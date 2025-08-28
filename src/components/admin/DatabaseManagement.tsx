import React, { useState } from 'react';
import { Database, Users, FileText, MessageSquare, Brain, BarChart3 } from 'lucide-react';
import DatabaseStatus from '../database/DatabaseStatus';
import DatabaseMigration from '../database/DatabaseMigration';
import { useUsers, useSurveys, useDocuments, useUnansweredQueries, useAdminKnowledge } from '../../hooks/useDatabase';

export default function DatabaseManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { users, loading: usersLoading } = useUsers();
  const { surveys, loading: surveysLoading } = useSurveys();
  const { documents, loading: documentsLoading } = useDocuments();
  const { queries, loading: queriesLoading } = useUnansweredQueries();
  const { knowledge, loading: knowledgeLoading } = useAdminKnowledge();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Database },
    { id: 'migration', label: 'Setup', icon: BarChart3 },
  ];

  const stats = [
    {
      name: 'Users',
      value: usersLoading ? '...' : users.length,
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Surveys',
      value: surveysLoading ? '...' : surveys.length,
      icon: FileText,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Documents',
      value: documentsLoading ? '...' : documents.length,
      icon: FileText,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      name: 'Unanswered Queries',
      value: queriesLoading ? '...' : queries.length,
      icon: MessageSquare,
      color: 'text-orange-600 bg-orange-100'
    },
    {
      name: 'Admin Knowledge',
      value: knowledgeLoading ? '...' : knowledge.length,
      icon: Brain,
      color: 'text-indigo-600 bg-indigo-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
      </div>

      {/* Database Status */}
      <DatabaseStatus />

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Database Tables</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Core Tables</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">users</span>
                      <span className="text-gray-900">{users.length} records</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">surveys</span>
                      <span className="text-gray-900">{surveys.length} records</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">documents</span>
                      <span className="text-gray-900">{documents.length} records</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Chat & Knowledge</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">unanswered_queries</span>
                      <span className="text-gray-900">{queries.length} records</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">admin_knowledge</span>
                      <span className="text-gray-900">{knowledge.length} records</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">chat_sessions</span>
                      <span className="text-gray-900">- records</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Database Features</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Row Level Security</h3>
                    <p className="text-sm text-gray-600">All tables protected with RLS policies</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Full-Text Search</h3>
                    <p className="text-sm text-gray-600">Optimized search indexes for content</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Real-time Updates</h3>
                    <p className="text-sm text-gray-600">Live data synchronization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'migration' && (
        <DatabaseMigration />
      )}
    </div>
  );
}