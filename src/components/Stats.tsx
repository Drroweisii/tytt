import React from 'react';
import { Wallet, Activity } from 'lucide-react';
import { formatNumber } from '../utils/calculations';

interface StatsProps {
  balance: number;
  hashRate: number;
}

const Stats: React.FC<StatsProps> = ({ balance, hashRate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all">
        <div className="flex items-center gap-3">
          <Wallet className="text-yellow-400 w-6 h-6" />
          <div>
            <h2 className="text-sm text-gray-400">Balance</h2>
            <p className="text-2xl font-bold">${formatNumber(balance)} USDT</p>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all">
        <div className="flex items-center gap-3">
          <Activity className="text-green-400 w-6 h-6" />
          <div>
            <h2 className="text-sm text-gray-400">Hash Rate</h2>
            <p className="text-2xl font-bold">{formatNumber(hashRate)} H/s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;