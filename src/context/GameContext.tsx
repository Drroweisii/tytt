import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { GameState } from '../types/game';
import { fetchGameState, saveProgress } from '../api/gameApi';
import {
  calculateOfflineEarnings,
  calculateMiningProgress,
  calculateEarningsPerSecond,
  formatNumber,
  formatTime
} from '../utils/calculations';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  currentHashRate: string;
  miningTime: string;
  startMining: () => void;
  stopMining: () => void;
}

type GameAction = 
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'UPGRADE_PART'; payload: { part: keyof GameState['parts']; level: number } }
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'START_MINING' }
  | { type: 'STOP_MINING' }
  | { type: 'UPDATE_MINING_PROGRESS' }
  | { type: 'UPDATE_OFFLINE_PROGRESS'; payload: { earnings: number; timeOffline: number } }
  | { type: 'SHOW_OFFLINE_EARNINGS'; payload: { earnings: number; timeOffline: number } };

const initialState: GameState = {
  balance: 0,
  parts: {
    cpu: 1,
    gpu: 1,
    motherboard: 1,
    psu: 1,
    ram: 1
  },
  hashRates: {
    cpu: 0.5,
    gpu: 1.0,
    motherboard: 0.3,
    psu: 0.2,
    ram: 0.4
  },
  lastUpdated: new Date().toISOString(),
  isMining: false,
  totalMined: 0,
  miningStartTime: null
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_BALANCE':
      return {
        ...state,
        balance: action.payload,
        lastUpdated: new Date().toISOString()
      };

    case 'UPGRADE_PART':
      return {
        ...state,
        parts: {
          ...state.parts,
          [action.payload.part]: action.payload.level
        },
        lastUpdated: new Date().toISOString()
      };

    case 'SET_GAME_STATE':
      return {
        ...action.payload,
        lastUpdated: new Date().toISOString()
      };

    case 'START_MINING':
      return {
        ...state,
        isMining: true,
        miningStartTime: new Date().toISOString()
      };

    case 'STOP_MINING':
      return {
        ...state,
        isMining: false,
        miningStartTime: null,
        lastUpdated: new Date().toISOString()
      };

    case 'UPDATE_MINING_PROGRESS':
      const earnings = calculateMiningProgress(state, 1);
      return {
        ...state,
        balance: state.balance + earnings,
        totalMined: state.totalMined + earnings,
        lastUpdated: new Date().toISOString()
      };

    case 'UPDATE_OFFLINE_PROGRESS':
      return {
        ...state,
        balance: state.balance + action.payload.earnings,
        totalMined: state.totalMined + action.payload.earnings,
        lastUpdated: new Date().toISOString()
      };

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [offlineNotificationShown, setOfflineNotificationShown] = useState(false);

  // Calculate current hash rate for display
  const currentHashRate = formatNumber(calculateEarningsPerSecond(state.parts));
  
  // Calculate mining time
  const miningTime = state.miningStartTime 
    ? formatTime((new Date().getTime() - new Date(state.miningStartTime).getTime()) / 1000)
    : '0s';

  // Load initial game state and calculate offline progress
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const response = await fetchGameState();
        if (response.success && response.data) {
          dispatch({ type: 'SET_GAME_STATE', payload: response.data });

          // Calculate offline earnings
          const currentTime = new Date().getTime();
          const { earnings, timeOffline } = calculateOfflineEarnings(response.data, currentTime);

          if (earnings > 0 && !offlineNotificationShown) {
            dispatch({
              type: 'UPDATE_OFFLINE_PROGRESS',
              payload: { earnings, timeOffline }
            });
            
            // Show offline earnings notification (you'll need to implement this UI)
            dispatch({
              type: 'SHOW_OFFLINE_EARNINGS',
              payload: { earnings, timeOffline }
            });
            
            setOfflineNotificationShown(true);
          }
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
      }
    };

    loadGameState();
  }, []);

  // Auto-mining effect
  useEffect(() => {
    let miningInterval: NodeJS.Timeout;

    if (state.isMining) {
      miningInterval = setInterval(() => {
        dispatch({ type: 'UPDATE_MINING_PROGRESS' });
      }, 1000); // Update every second
    }

    return () => {
      if (miningInterval) {
        clearInterval(miningInterval);
      }
    };
  }, [state.isMining]);

  // Save game state periodically
  useEffect(() => {
    const saveGameState = async () => {
      try {
        await saveProgress(state);
      } catch (error) {
        console.error('Failed to save game state:', error);
      }
    };

    const saveInterval = setInterval(saveGameState, 30000); // Save every 30 seconds

    // Also save when window is closed or hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveGameState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(saveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state]);

  const startMining = () => {
    dispatch({ type: 'START_MINING' });
  };

  const stopMining = () => {
    dispatch({ type: 'STOP_MINING' });
  };

  const contextValue: GameContextType = {
    state,
    dispatch,
    currentHashRate,
    miningTime,
    startMining,
    stopMining
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}