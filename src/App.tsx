import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { ChatProvider } from './contexts/ChatContext';
import Login from './components/Login';
import Header from './components/layout/Header';
import ChatInterface from './components/chat/ChatInterface';
import AdminDashboard from './components/admin/AdminDashboard';
import ApiDocs from './components/api/ApiDocs';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';

// Main App wrapper with providers
function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </DocumentProvider>
    </AuthProvider>
  );
}

// App content component that uses auth context
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If no user, show login
  if (!user) {
    return <Login />;
  }

  // If user is logged in, show main app with routing
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main>
          <Routes>
            <Route path="/chat" element={<ChatInterface />} />
            <Route 
              path="/admin/*" 
              element={
                user.role === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/chat" replace />
                )
              } 
            />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;