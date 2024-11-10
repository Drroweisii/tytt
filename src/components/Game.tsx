import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import MiningRig from './MiningRig';
import Stats from './Stats';
import { saveGameState } from '../api/authApi';
import { calculateTotalHashRate } from '../utils/calculations';
import { Activity, LogOut } from 'lucide-react';

const Game: React.FC = () => {
  const { state, dispatch } = useGame();
  const { token, logout } = useAuth();

  const getTotalHashRate = useCallback(() => {
    return calculateTotalHashRate(state.parts);
  }, [state.parts]);

  useEffect(() => {
    if (state.isMining) {
      const miningInterval = setInterval(() => {
        const earnings = getTotalHashRate() * 0.1;
        dispatch({ 
          type: 'UPDATE_BALANCE', 
          payload: state.balance + earnings 
        });
      }, 1000);

      return () => clearInterval(miningInterval);
    }
  }, [getTotalHashRate, dispatch, state.balance, state.isMining]);

  // Save game state every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (token) {
        saveGameState(state, token);
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [state, token]);

  const handleLogout = () => {
    if (token) {
      saveGameState(state, token).then(() => {
        logout();
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className={`w-8 h-8 text-green-400 ${state.isMining ? 'animate-pulse' : ''}`} />
            <h1 className="text-4xl font-bold">Crypto Miner</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
        <Stats 
          balance={state.balance} 
          hashRate={getTotalHashRate()} 
        />
        <MiningRig 
          parts={state.parts}
          onUpgrade={async (part) => {
            const upgradeCost = Math.floor(100 * Math.pow(1.5, state.parts[part]));
            if (state.balance >= upgradeCost) {
              dispatch({
                type: 'UPDATE_BALANCE',
                payload: state.balance - upgradeCost
              });
              dispatch({
                type: 'UPGRADE_PART',
                payload: { part, level: state.parts[part] + 1 }
              });
              if (token) {
                await saveGameState(state, token);
              }
            }
          }}
          balance={state.balance}
        />
      </div>
    </div>
  );
};

export default Game;