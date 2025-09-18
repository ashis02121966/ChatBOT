import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { DocumentProvider } from './contexts/DocumentContext';
import Login from './components/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import ChatInterface from './components/chat/ChatInterface';
import ApiDocs from './components/api/ApiDocs';
import Header from './components/layout/Header';
import LoadingSpinner from './components/common/LoadingSpinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        <Routes>
          <Route 
            path="/admin/*" 
            element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/chat" />} 
          />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/" element={<Navigate to="/chat" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  // Add error boundary for debugging
  React.useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error);
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <AuthProvider>
      <DocumentProvider>
        <ChatProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ChatProvider>
      </DocumentProvider>
    </AuthProvider>
  );
}

export default App;