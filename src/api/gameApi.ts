import { GameState, ApiResponse } from '../types/game';
import axios, { AxiosError } from 'axios';
import { debounce } from 'lodash';
import { z } from 'zod';

const STORAGE_KEY = 'crypto_miner_state';
const API_BASE_URL = 'http://localhost:3000';
const API_TIMEOUT = 5000;
const SAVE_DEBOUNCE_TIME = 5000;
const MAX_RETRY_ATTEMPTS = 3;

// API Response schemas for validation
const GameStateSchema = z.object({
  balance: z.number(),
  parts: z.object({
    cpu: z.number(),
    gpu: z.number(),
    motherboard: z.number(),
    psu: z.number(),
    ram: z.number()
  }),
  hashRates: z.record(z.string(), z.number()),
  lastUpdated: z.string(),
  isMining: z.boolean(),
  totalMined: z.number(),
  miningStartTime: z.string().nullable(),
  version: z.number().default(0)
});

type GameStateWithVersion = z.infer<typeof GameStateSchema>;

// Queue for offline operations
interface QueuedOperation {
  type: 'save' | 'upgrade' | 'balance';
  data: any;
  timestamp: number;
}

let operationQueue: QueuedOperation[] = [];

// Retry logic with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRY_ATTEMPTS
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && axios.isAxiosError(error) && !error.response) {
      const delay = Math.min(1000 * (MAX_RETRY_ATTEMPTS - retries + 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1);
    }
    throw error;
  }
};

// Process queued operations when online
const processQueue = async () => {
  if (!navigator.onLine || operationQueue.length === 0) return;

  const sortedQueue = [...operationQueue].sort((a, b) => a.timestamp - b.timestamp);
  
  for (const operation of sortedQueue) {
    try {
      switch (operation.type) {
        case 'save':
          await saveProgress(operation.data);
          break;
        case 'upgrade':
          await upgradePart(operation.data.part, operation.data.level);
          break;
        case 'balance':
          await updateBalance(operation.data);
          break;
      }
      operationQueue = operationQueue.filter(op => op !== operation);
    } catch (error) {
      console.error('Failed to process queued operation:', error);
      break;
    }
  }
};

// Listen for online status changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', processQueue);
}

// Fetch game state with enhanced error handling and offline support
export const fetchGameState = async (): Promise<ApiResponse<GameState>> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await retryWithBackoff(() => 
      axios.get<{gameState: GameStateWithVersion}>(`${API_BASE_URL}/game/load`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      })
    );

    const validatedState = GameStateSchema.parse(response.data.gameState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedState));
    return { success: true, data: validatedState };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Network error - try local storage
      if (!error.response) {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          try {
            const parsedState = GameStateSchema.parse(JSON.parse(savedState));
            return { success: true, data: parsedState };
          } catch (parseError) {
            return { success: false, error: 'Invalid stored game state' };
          }
        }
      }
      // Auth error
      if (error.response?.status === 401) {
        return { success: false, error: 'Authentication required' };
      }
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load game state' 
    };
  }
};

// Debounced save function to reduce API calls
const debouncedSave = debounce(async (state: GameStateWithVersion): Promise<ApiResponse<void>> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    await retryWithBackoff(() =>
      axios.post(
        `${API_BASE_URL}/game/save`,
        { gameState: state },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'If-Match': String(state.version)
          },
          timeout: API_TIMEOUT
        }
      )
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { success: true };

  } catch (error) {
    if (!navigator.onLine) {
      operationQueue.push({
        type: 'save',
        data: state,
        timestamp: Date.now()
      });
      return { success: true, warning: 'Changes queued for sync' };
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save game state' 
    };
  }
}, SAVE_DEBOUNCE_TIME, { maxWait: 30000 });

// Save progress with version control
export const saveProgress = async (state: GameState): Promise<ApiResponse<void>> => {
  try {
    const currentState = await fetchGameState();
    if (currentState.success && currentState.data) {
      const serverVersion = (currentState.data as GameStateWithVersion).version;
      const newState: GameStateWithVersion = {
        ...state,
        version: serverVersion + 1
      };
      return debouncedSave(newState);
    }
    return { success: false, error: 'Failed to fetch current state' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save game state' 
    };
  }
};

// Upgrade part with optimistic updates
export const upgradePart = async (
  part: keyof GameState['parts'],
  newLevel: number
): Promise<ApiResponse<void>> => {
  try {
    const currentState = await fetchGameState();
    if (currentState.success && currentState.data) {
      const updatedState = {
        ...currentState.data,
        parts: { ...currentState.data.parts, [part]: newLevel }
      };

      // Optimistic update
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));

      if (!navigator.onLine) {
        operationQueue.push({
          type: 'upgrade',
          data: { part, level: newLevel },
          timestamp: Date.now()
        });
        return { success: true, warning: 'Upgrade queued for sync' };
      }

      return saveProgress(updatedState);
    }
    return { success: false, error: 'Failed to fetch current state' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upgrade part' 
    };
  }
};

// Update balance with optimistic updates
export const updateBalance = async (newBalance: number): Promise<ApiResponse<void>> => {
  try {
    const currentState = await fetchGameState();
    if (currentState.success && currentState.data) {
      const updatedState = { ...currentState.data, balance: newBalance };

      // Optimistic update
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));

      if (!navigator.onLine) {
        operationQueue.push({
          type: 'balance',
          data: newBalance,
          timestamp: Date.now()
        });
        return { success: true, warning: 'Balance update queued for sync' };
      }

      return saveProgress(updatedState);
    }
    return { success: false, error: 'Failed to fetch current state' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update balance' 
    };
  }
};

// Batch upgrades to reduce server calls
export const upgradeMultipleParts = async (
  upgrades: Array<{part: keyof GameState['parts'], level: number}>
): Promise<ApiResponse<void>> => {
  try {
    const currentState = await fetchGameState();
    if (currentState.success && currentState.data) {
      const updatedState = {
        ...currentState.data,
        parts: {
          ...currentState.data.parts,
          ...Object.fromEntries(upgrades.map(({part, level}) => [part, level]))
        }
      };
      return saveProgress(updatedState);
    }
    return { success: false, error: 'Failed to fetch current state' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to batch upgrade parts' 
    };
  }
};