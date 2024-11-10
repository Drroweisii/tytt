export interface GameState {
  balance: number;
  parts: {
    cpu: number;
    gpu: number;
    motherboard: number;
    psu: number;
    ram: number;
  };
  hashRates: {
    cpu: number;
    gpu: number;
    motherboard: number;
    psu: number;
    ram: number;
  };
  lastUpdated: string;
  isMining: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PartConfig {
  maxLevel: number;
  baseHashRate: number;
  basePrice: number;
  priceMultiplier: number;
  hashRateMultiplier: number;
}