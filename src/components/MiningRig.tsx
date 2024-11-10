import React from 'react';
import { Cpu, MonitorDot, CircuitBoard, Battery, HardDrive, Lock, Play, Pause } from 'lucide-react';
import { partConfigs } from '../config/partConfigs';
import { calculateUpgradeCost, calculateHashRate, calculateEarningsPerSecond, formatNumber } from '../utils/calculations';
import { useGame } from '../context/GameContext';
import { Card, CardContent } from '@/components/ui/card';

interface PartProps {
  name: string;
  partKey: string;
  level: number;
  onUpgrade: () => void;
  balance: number;
}

const Part: React.FC<PartProps> = ({ name, partKey, level, onUpgrade, balance }) => {
  const config = partConfigs[partKey];
  const isMaxLevel = level >= config.maxLevel;
  const upgradeCost = calculateUpgradeCost(partKey, level);
  const currentHashRate = calculateHashRate(partKey, level);
  const nextHashRate = isMaxLevel ? currentHashRate : calculateHashRate(partKey, level + 1);
  const canAfford = balance >= upgradeCost;

  const getIcon = () => {
    switch (partKey) {
      case 'cpu': return <Cpu className="w-full h-full" />;
      case 'gpu': return <MonitorDot className="w-full h-full" />;
      case 'motherboard': return <CircuitBoard className="w-full h-full" />;
      case 'psu': return <Battery className="w-full h-full" />;
      case 'ram': return <HardDrive className="w-full h-full" />;
      default: return null;
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-lg p-4 rounded-xl border transition-all ${
      isMaxLevel ? 'border-yellow-500/50' : canAfford ? 'border-white/20 hover:border-white/40' : 'border-red-500/20'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${
            isMaxLevel ? 'text-yellow-400' : 'text-blue-400'
          }`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-bold text-white">{name}</h3>
            <p className={`text-sm ${
              isMaxLevel ? 'text-yellow-300' : 'text-blue-300'
            }`}>
              Level {level}/{config.maxLevel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-green-400">{formatNumber(currentHashRate)} H/s</p>
          {!isMaxLevel && (
            <p className="text-xs text-gray-400">
              +{formatNumber(nextHashRate - currentHashRate)} H/s
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onUpgrade}
        disabled={isMaxLevel || !canAfford}
        className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
          isMaxLevel
            ? 'bg-yellow-600/50 cursor-not-allowed text-white/50'
            : canAfford
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-600/50 cursor-not-allowed text-white/50'
        }`}
      >
        {isMaxLevel ? (
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Max Level
          </span>
        ) : (
          <>
            <span>Upgrade</span>
            <span className={canAfford ? 'text-blue-200' : 'text-red-300'}>
              ${formatNumber(upgradeCost)}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

const MiningRig: React.FC = () => {
  const { state, dispatch, currentHashRate, miningTime, startMining, stopMining } = useGame();
  const { parts, balance, isMining } = state;

  const handleUpgrade = (part: string) => {
    const upgradeCost = calculateUpgradeCost(part, parts[part]);
    if (balance >= upgradeCost) {
      dispatch({
        type: 'UPGRADE_PART',
        payload: { part: part as keyof typeof parts, level: parts[part] + 1 }
      });
      dispatch({
        type: 'UPDATE_BALANCE',
        payload: balance - upgradeCost
      });
    }
  };

  const earningsPerSecond = calculateEarningsPerSecond(parts);

  return (
    <div className="space-y-4">
      <Card className="bg-white/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Mining Rig</h2>
              <p className="text-gray-400">
                Current Hashrate: {currentHashRate}/s
                {isMining && <span className="text-green-400 ml-2">Mining for: {miningTime}</span>}
              </p>
            </div>
            <button
              onClick={isMining ? stopMining : startMining}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                isMining
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isMining ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop Mining
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Mining
                </>
              )}
            </button>
          </div>
          {isMining && (
            <div className="bg-green-900/20 text-green-400 px-4 py-2 rounded-lg mb-4">
              Earning ${formatNumber(earningsPerSecond)} per second
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Part
          name="CPU"
          partKey="cpu"
          level={parts.cpu}
          onUpgrade={() => handleUpgrade('cpu')}
          balance={balance}
        />
        <Part
          name="GPU"
          partKey="gpu"
          level={parts.gpu}
          onUpgrade={() => handleUpgrade('gpu')}
          balance={balance}
        />
        <Part
          name="Motherboard"
          partKey="motherboard"
          level={parts.motherboard}
          onUpgrade={() => handleUpgrade('motherboard')}
          balance={balance}
        />
        <Part
          name="Power Supply"
          partKey="psu"
          level={parts.psu}
          onUpgrade={() => handleUpgrade('psu')}
          balance={balance}
        />
        <Part
          name="RAM"
          partKey="ram"
          level={parts.ram}
          onUpgrade={() => handleUpgrade('ram')}
          balance={balance}
        />
      </div>
    </div>
  );
};

export default MiningRig;