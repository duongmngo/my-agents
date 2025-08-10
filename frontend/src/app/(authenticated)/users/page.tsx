'use client';

import React, { useState } from 'react';
import { Plus, Search, Users, UserPlus, MoreVertical, Mail, Shield, Calendar } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock users data with proper avatars
  const users = [
    {
      id: 'user-1',
      email: 'admin@demo.com',
      name: 'Admin User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin&backgroundColor=b6e3f4&mouth=smile&style=circle',
      role: 'admin',
      status: 'active',
      lastActive: '2024-01-15T10:30:00Z',
      joinedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'user-2',
      email: 'user@demo.com',
      name: 'Demo User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo&backgroundColor=c0aede&mouth=smile&style=circle',
      role: 'user',
      status: 'active',
      lastActive: '2024-01-15T09:15:00Z',
      joinedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'user-3',
      email: 'john.doe@company.com',
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john&backgroundColor=8b5cf6&mouth=smile&style=circle',
      role: 'user',
      status: 'active',
      lastActive: '2024-01-14T16:45:00Z',
      joinedAt: '2024-01-05T00:00:00Z'
    },
    {
      id: 'user-4',
      email: 'jane.smith@company.com',
      name: 'Jane Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane&backgroundColor=ef4444&mouth=smile&style=circle',
      role: 'user',
      status: 'inactive',
      lastActive: '2024-01-10T14:20:00Z',
      joinedAt: '2024-01-08T00:00:00Z'
    },
    {
      id: 'user-5',
      email: 'mike.wilson@company.com',
      name: 'Mike Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike&backgroundColor=f59e0b&mouth=smile&style=circle',
      role: 'user',
      status: 'active',
      lastActive: '2024-01-15T08:30:00Z',
      joinedAt: '2024-01-12T00:00:00Z'
    },
    {
      id: 'user-6',
      email: 'sarah.jones@company.com',
      name: 'Sarah Jones',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah&backgroundColor=10b981&mouth=smile&style=circle',
      role: 'user',
      status: 'active',
      lastActive: '2024-01-15T11:20:00Z',
      joinedAt: '2024-01-15T00:00:00Z'
    }
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'user': return Users;
      default: return Users;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage your organization's users</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <UserPlus className="h-4 w-4" />
          <span>Invite User</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => new Date(u.joinedAt) > new Date('2024-01-01')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Filter
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
        </div>
        <div className="p-6">
          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <RoleIcon className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Last active</p>
                        <p className="text-xs text-gray-900">
                          {new Date(user.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Invite your first user to get started'
                }
              </p>
              {!searchTerm && (
                <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <UserPlus className="h-4 w-4" />
                  <span>Invite User</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New user joined</p>
                <p className="text-sm text-gray-500">Sarah Jones joined the organization</p>
              </div>
              <div className="text-sm text-gray-400">2 days ago</div>
            </div>
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Role updated</p>
                <p className="text-sm text-gray-500">Admin User was promoted to admin</p>
              </div>
              <div className="text-sm text-gray-400">1 week ago</div>
            </div>
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Invitation sent</p>
                <p className="text-sm text-gray-500">Invitation sent to mike.wilson@company.com</p>
              </div>
              <div className="text-sm text-gray-400">1 week ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 