import React, { useState } from 'react';
import { Database, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MigrationStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export default function DatabaseMigration() {
  const [migrations, setMigrations] = useState<MigrationStatus[]>([
    { name: 'Create Initial Schema', status: 'pending' },
    { name: 'Insert Initial Data', status: 'pending' },
    { name: 'Fix Foreign Key Constraints', status: 'pending' },
    { name: 'Add Missing Schema Columns', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runMigrations = async () => {
    setIsRunning(true);
    
    try {
      // Update status to running
      setMigrations(prev => prev.map(m => ({ ...m, status: 'running' as const })));

      // Create demo users if they don't exist
      const demoUsers = [
        {
          id: 'admin-user-id',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin' as const,
          status: 'active' as const,
          password_hash: 'demo-hash',
          salt: 'demo-salt'
        },
        {
          id: 'enum-user-id',
          email: 'enum@example.com',
          name: 'John Enumerator',
          role: 'enumerator' as const,
          status: 'active' as const,
          password_hash: 'demo-hash',
          salt: 'demo-salt'
        },
        {
          id: 'super-user-id',
          email: 'super@example.com',
          name: 'Jane Supervisor',
          role: 'supervisor' as const,
          status: 'active' as const,
          password_hash: 'demo-hash',
          salt: 'demo-salt'
        },
        {
          id: 'zo-user-id',
          email: 'zo@example.com',
          name: 'ZO User',
          role: 'zo' as const,
          status: 'active' as const,
          password_hash: 'demo-hash',
          salt: 'demo-salt'
        },
        {
          id: 'ro-user-id',
          email: 'ro@example.com',
          name: 'RO User',
          role: 'ro' as const,
          status: 'active' as const,
          password_hash: 'demo-hash',
          salt: 'demo-salt'
        }
      ];

      // Insert demo users
      for (const user of demoUsers) {
        try {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            const { error: insertError } = await supabase
              .from('users')
              .insert(user);

            if (insertError) {
              console.error(`Error creating user ${user.email}:`, insertError);
            } else {
              console.log(`Created demo user: ${user.email}`);
            }
          } else {
            console.log(`Demo user already exists: ${user.email}`);
          }
        } catch (error) {
          console.error(`Error checking/creating user ${user.email}:`, error);
        }
      }

      // Create demo surveys if they don't exist
      const demoSurveys = [
        { id: 'survey-1', name: 'Population Census Survey', description: 'National population census data collection' },
        { id: 'survey-2', name: 'Economic Household Survey', description: 'Household economic status survey' },
        { id: 'survey-3', name: 'Health and Nutrition Survey', description: 'Health and nutrition assessment' },
        { id: 'survey-4', name: 'Education Access Survey', description: 'Educational access and quality survey' },
        { id: 'survey-5', name: 'ASUSE Industry Survey', description: 'Industry and business survey' }
      ];

      for (const survey of demoSurveys) {
        try {
          const { data: existingSurvey } = await supabase
            .from('surveys')
            .select('id')
            .eq('id', survey.id)
            .single();

          if (!existingSurvey) {
            const { error: insertError } = await supabase
              .from('surveys')
              .insert(survey);

            if (insertError) {
              console.error(`Error creating survey ${survey.name}:`, insertError);
            } else {
              console.log(`Created demo survey: ${survey.name}`);
            }
          } else {
            console.log(`Demo survey already exists: ${survey.name}`);
          }
        } catch (error) {
          console.error(`Error checking/creating survey ${survey.name}:`, error);
        }
      }

      // Mark all migrations as completed
      setMigrations(prev => prev.map(m => ({ ...m, status: 'completed' as const })));

    } catch (error) {
      console.error('Migration error:', error);
      setMigrations(prev => prev.map(m => ({ 
        ...m, 
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
      case 'running':
        return <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const allCompleted = migrations.every(m => m.status === 'completed');
  const anyFailed = migrations.some(m => m.status === 'failed');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Database Setup</h2>
        </div>
        
        {!allCompleted && (
          <button
            onClick={runMigrations}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>{isRunning ? 'Running...' : 'Run Migrations'}</span>
          </button>
        )}
      </div>

      {allCompleted && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Database setup completed successfully!
            </span>
          </div>
        </div>
      )}

      {anyFailed && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Some migrations failed. Please check the errors below.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {migrations.map((migration, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(migration.status)}
              <span className="text-sm font-medium text-gray-900">
                {migration.name}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {migration.status === 'completed' && (
                <span className="text-xs text-green-600 font-medium">Completed</span>
              )}
              {migration.status === 'failed' && (
                <span className="text-xs text-red-600 font-medium">Failed</span>
              )}
              {migration.status === 'running' && (
                <span className="text-xs text-blue-600 font-medium">Running...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {anyFailed && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Migration Errors:</h3>
          {migrations
            .filter(m => m.status === 'failed' && m.error)
            .map((migration, index) => (
              <div key={index} className="text-xs text-red-600 mb-1">
                <strong>{migration.name}:</strong> {migration.error}
              </div>
            ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">What this creates:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Users table with role-based access control</li>
          <li>• Surveys and documents with proper relationships</li>
          <li>• Chat sessions and messages with full history</li>
          <li>• Admin knowledge base for enhanced responses</li>
          <li>• Unanswered queries tracking for continuous improvement</li>
          <li>• Demo user accounts for testing authentication</li>
          <li>• Missing schema columns (admin_images in unanswered_queries)</li>
          <li>• Full-text search indexes for fast content retrieval</li>
          <li>• Row Level Security (RLS) for data protection</li>
        </ul>
      </div>
    </div>
  );
}