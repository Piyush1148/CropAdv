import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import './styles/globals.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';

// Utilities - safe DOM cleaner for extension management
import safeDomCleaner from './utils/domCleaner';

// Layout Components
import Header from './components/common/Header';
import ProtectedRoute from './components/ProtectedRoute';
import DebugPanel from './components/debug/DebugPanel';
import ErrorBoundary from './components/debug/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CropRecommendationPage from './pages/CropRecommendationPage';
import GrowingGuidePage from './pages/GrowingGuidePage';
import AIAssistant from './pages/AIAssistant';
import AIAssistantTest from './pages/AIAssistantTest';
import AIAssistantSimple from './pages/AIAssistantSimple';
import AIAssistantDebug from './pages/AIAssistantDebug';
import SimpleAIAssistant from './pages/SimpleAIAssistant';
import RobustAIAssistant from './pages/RobustAIAssistant';
import UltraMinimalAI from './pages/UltraMinimalAI';
import DebugAITest from './pages/DebugAITest';
import MinimalTest from './components/debug/MinimalTest';

// Placeholder components for pages under development
const PlaceholderPage = ({ title }) => (
  <div style={{ 
    padding: '4rem 2rem', 
    textAlign: 'center',
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h1 style={{ color: theme.colors.primary[500], marginBottom: '1rem' }}>
      {title}
    </h1>
    <p style={{ color: theme.colors.text.secondary, fontSize: '1.1rem' }}>
      This page is under development. Coming soon!
    </p>
  </div>
);

// Layout wrapper that conditionally shows Header
// Header stays mounted across navigation for better performance
const Layout = ({ children }) => {
  const location = useLocation();
  
  // Routes that should NOT show header
  const noHeaderRoutes = ['/auth/login', '/auth/register'];
  const shouldShowHeader = !noHeaderRoutes.includes(location.pathname);
  
  return (
    <>
      {shouldShowHeader && <Header />}
      {children}
    </>
  );
};

function App() {
  // Start safe DOM cleaner to handle browser extensions
  useEffect(() => {
    safeDomCleaner.start();
    
    return () => {
      safeDomCleaner.stop();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Layout>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                
                {/* Auth routes (no header - handled by Layout) */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                
                {/* Protected routes (header stays mounted via Layout) */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/crop-advisory" element={
                  <ProtectedRoute>
                    <CropRecommendationPage />
                  </ProtectedRoute>
                } />
                <Route path="/reverse-advisory" element={
                  <ProtectedRoute>
                    <GrowingGuidePage />
                  </ProtectedRoute>
                } />
                <Route path="/ai-assistant" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <RobustAIAssistant />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/test-ai" element={<AIAssistantTest />} />
                <Route path="/ai-robust" element={
                  <ErrorBoundary>
                    <RobustAIAssistant />
                  </ErrorBoundary>
                } />
                <Route path="/ai-minimal" element={<UltraMinimalAI />} />
                <Route path="/debug-ai" element={
                  <ProtectedRoute>
                    <DebugAITest />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Analytics" />
                  </ProtectedRoute>
                } />
                
                {/* Redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
