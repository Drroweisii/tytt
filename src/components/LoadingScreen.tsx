import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
      <h2 className="text-xl text-white font-semibold">Loading your mining rig...</h2>
    </div>
  </div>
);

export default LoadingScreen;