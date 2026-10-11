import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import IncomingTransmissionToast from './components/common/IncomingTransmissionToast';

import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import PortalPage from './pages/PortalPage';
import FeedPage from './pages/FeedPage';
import DiscussionsPage from './pages/DiscussionsPage';
import TimetablePage from './pages/TimetablePage';
import VaultPage from './pages/VaultPage';
import MobileNavbar from './components/common/MobileNavbar';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <IncomingTransmissionToast />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route 
              path="/onboard" 
              element={
                <ProtectedRoute requireOnboarded={false}>
                  <OnboardingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <PortalPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/feed" 
              element={
                <ProtectedRoute>
                  <FeedPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/discussions" 
              element={
                <ProtectedRoute>
                  <DiscussionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/timetable" 
              element={
                <ProtectedRoute>
                  <TimetablePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vault" 
              element={
                <ProtectedRoute>
                  <VaultPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <PortalPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <MobileNavbar />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
