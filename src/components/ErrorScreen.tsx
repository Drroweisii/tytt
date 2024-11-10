import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorScreenProps {
  error: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
    <div className="text-center px-4">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl text-white font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-400">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default ErrorScreen;