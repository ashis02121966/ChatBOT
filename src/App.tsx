import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';

// Simplified App component to get basic rendering working
function App() {
  const [user, setUser] = React.useState(null);

  // Simple demo login function
  const handleLogin = (email: string, password: string) => {
    if (password === 'password123') {
      const demoUsers = {
        'admin@example.com': { id: '1', name: 'Admin User', email, role: 'admin' },
        'enum@example.com': { id: '2', name: 'John Enumerator', email, role: 'enumerator' },
        'super@example.com': { id: '3', name: 'Jane Supervisor', email, role: 'supervisor' },
        'zo@example.com': { id: '4', name: 'ZO User', email, role: 'zo' },
        'ro@example.com': { id: '5', name: 'RO User', email, role: 'ro' },
      };
      
      const userData = demoUsers[email as keyof typeof demoUsers];
      if (userData) {
        setUser(userData);
        return true;
      }
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
  };

  // If no user, show login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // If user is logged in, show main app
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Survey ChatBot</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {user.role.toUpperCase()}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-16">
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/admin" element={user.role === 'admin' ? <AdminPage /> : <Navigate to="/chat" />} />
            <Route path="/" element={<Navigate to="/chat" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Simple Chat Page
function ChatPage() {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: Date.now() + 1,
      content: "Hello! I'm your survey assistant. I can help you with survey procedures, data collection methods, and terminology. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Chat Interface</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>Start a conversation with your survey assistant</p>
            </div>
          ) : (
            messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about survey procedures..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// Simple Admin Page
function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">File Management</h3>
            <p className="text-sm text-blue-700 mt-1">Upload and manage survey documents</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900">Query Management</h3>
            <p className="text-sm text-green-700 mt-1">Review and answer user queries</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900">Analytics</h3>
            <p className="text-sm text-purple-700 mt-1">View usage statistics and reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;