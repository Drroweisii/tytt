import { partConfigs } from '../config/partConfigs';
import { GameState } from '../types/game';

export const calculateUpgradeCost = (part: string, currentLevel: number): number => {
  const config = partConfigs[part];
  return Math.floor(config.basePrice * Math.pow(config.priceMultiplier, currentLevel));
};

export const calculateHashRate = (part: string, level: number): number => {
  const config = partConfigs[part];
  return config.baseHashRate * Math.pow(config.hashRateMultiplier, level - 1);
};

export const calculateTotalHashRate = (parts: Record<string, number>): number => {
  return Object.entries(parts).reduce((total, [part, level]) => {
    return total + calculateHashRate(part, level);
  }, 0);
};

// New function to calculate earnings per second
export const calculateEarningsPerSecond = (parts: Record<string, number>): number => {
  const totalHashRate = calculateTotalHashRate(parts);
  // You can adjust this multiplier based on your game balance
  const earningsMultiplier = 1.0;
  return totalHashRate * earningsMultiplier;
};

// New function to calculate offline earnings
export const calculateOfflineEarnings = (
  gameState: GameState,
  currentTime: number
): { earnings: number; timeOffline: number } => {
  const lastUpdated = new Date(gameState.lastUpdated).getTime();
  const timeOffline = Math.floor((currentTime - lastUpdated) / 1000); // Convert to seconds
  
  // Cap offline time if needed (e.g., 24 hours maximum)
  const maxOfflineTime = 24 * 60 * 60; // 24 hours in seconds
  const cappedOfflineTime = Math.min(timeOffline, maxOfflineTime);
  
  // Calculate earnings with potential offline penalty
  const earningsPerSecond = calculateEarningsPerSecond(gameState.parts);
  const offlineEfficiencyMultiplier = 0.5; // Reduce offline earnings to 50%
  const earnings = earningsPerSecond * cappedOfflineTime * offlineEfficiencyMultiplier;
  
  return {
    earnings: Math.floor(earnings),
    timeOffline: cappedOfflineTime
  };
};

// New function to calculate mining progress for a given time period
export const calculateMiningProgress = (
  gameState: GameState,
  elapsedSeconds: number
): number => {
  const earningsPerSecond = calculateEarningsPerSecond(gameState.parts);
  return earningsPerSecond * elapsedSeconds;
};

// New function to check if mining is profitable
export const isMiningProfitable = (parts: Record<string, number>): boolean => {
  return calculateEarningsPerSecond(parts) > 0;
};

// Improved number formatting with additional units
export const formatNumber = (num: number): string => {
  const units = ['', 'K', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(Math.abs(num)) / 3);
  if (order < 0) return num.toFixed(2);
  const unit = units[Math.min(order, units.length - 1)];
  const scaled = num / Math.pow(10, order * 3);
  return `${scaled.toFixed(2)}${unit}`;
};

// New function to format time duration
export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${Math.floor(seconds % 60)}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// New function to calculate efficiency of a part
export const calculatePartEfficiency = (
  part: string,
  level: number
): { hashPerCost: number } => {
  const hashRate = calculateHashRate(part, level);
  const cost = calculateUpgradeCost(part, level);
  return {
    hashPerCost: hashRate / cost
  };
};