import axios from 'axios';
import { z } from 'zod';

// Define the API URL using environment variables or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Define the structure of the AuthResponse using zod for validation
const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    gameState: z.any()
  })
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Create an axios instance with the base API URL and default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Register a new user
export const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { username, email, password });
  return AuthResponseSchema.parse(response.data);
};

// Login a user
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { username, password });
  return AuthResponseSchema.parse(response.data);
};

// Save the game state
export const saveGameState = async (gameState: any, token: string) => {
  const response = await api.post(
    '/game/save',
    { gameState },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Load the game state
export const loadGameState = async (token: string) => {
  const response = await api.get(
    '/game/load',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};