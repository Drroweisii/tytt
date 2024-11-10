import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Game from './components/Game';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <GameProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/game"
              element={
                <PrivateRoute>
                  <Game />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </GameProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;