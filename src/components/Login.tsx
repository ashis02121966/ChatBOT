import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Bot } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Attempting login for:', email);
    const success = await login(email, password);
    if (!success) {
      setError('Invalid credentials. Please use the demo credentials shown below or check your Supabase configuration.');
    }
    setLoading(false);
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@example.com', password: 'password123' },
    { role: 'Enumerator', email: 'enum@example.com', password: 'password123' },
    { role: 'Supervisor', email: 'super@example.com', password: 'password123' },
    { role: 'ZO', email: 'zo@example.com', password: 'password123' },
    { role: 'RO', email: 'ro@example.com', password: 'password123' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Survey ChatBot</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the intelligent survey assistant
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</h3>
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> If Supabase is not configured or demo users don't exist in your Supabase project, 
              the app will automatically fall back to mock authentication using these credentials.
            </p>
          </div>
          <div className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div 
                key={index} 
                className="text-xs bg-white p-2 rounded border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                }}
                title="Click to auto-fill credentials"
              >
                <strong>{cred.role}:</strong> {cred.email} / {cred.password}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Click on any credential above to auto-fill the login form
          </p>
        </div>
      </div>
    </div>
  );
}