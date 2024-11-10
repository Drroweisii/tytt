import { PartConfig } from '../types/game';

export const partConfigs: Record<string, PartConfig> = {
  cpu: {
    maxLevel: 25,
    baseHashRate: 0.5,
    basePrice: 100,
    priceMultiplier: 1.5,
    hashRateMultiplier: 1.2
  },
  gpu: {
    maxLevel: 20,
    baseHashRate: 1.0,
    basePrice: 150,
    priceMultiplier: 1.6,
    hashRateMultiplier: 1.3
  },
  motherboard: {
    maxLevel: 15,
    baseHashRate: 0.3,
    basePrice: 80,
    priceMultiplier: 1.4,
    hashRateMultiplier: 1.15
  },
  psu: {
    maxLevel: 12,
    baseHashRate: 0.2,
    basePrice: 60,
    priceMultiplier: 1.35,
    hashRateMultiplier: 1.1
  },
  ram: {
    maxLevel: 18,
    baseHashRate: 0.4,
    basePrice: 90,
    priceMultiplier: 1.45,
    hashRateMultiplier: 1.25
  }
};