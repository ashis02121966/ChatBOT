import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileUp, MessageSquare, BarChart3, Settings, Users } from 'lucide-react';
import FileManagement from './FileManagement';
import QueryManagement from './QueryManagement';
import Analytics from './Analytics';
import UserManagement from './UserManagement';

export default function AdminDashboard() {
  const location = useLocation();

  const navItems = [
    { path: '/admin/files', icon: FileUp, label: 'File Management' },
    { path: '/admin/queries', icon: MessageSquare, label: 'Unanswered Queries' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
          </div>
          <nav className="px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Routes>
            <Route path="/files" element={<FileManagement />} />
            <Route path="/queries" element={<QueryManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/" element={<FileManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}