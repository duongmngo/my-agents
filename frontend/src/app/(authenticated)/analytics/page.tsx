'use client';

import React from 'react';
import { TrendingUp, Users, MessageSquare, Bot, BarChart3, Activity, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  // Mock analytics data
  const stats = [
    {
      name: 'Total Conversations',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: MessageSquare
    },
    {
      name: 'Active Users',
      value: '89',
      change: '+5%',
      changeType: 'positive',
      icon: Users
    },
    {
      name: 'Agents Used',
      value: '12',
      change: '+3',
      changeType: 'positive',
      icon: Bot
    },
    {
      name: 'Response Time',
      value: '2.3s',
      change: '-0.5s',
      changeType: 'positive',
      icon: Activity
    }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'conversation',
      title: 'New conversation started',
      description: 'Sales Assistant • Product Inquiry',
      time: '2 minutes ago',
      icon: MessageSquare
    },
    {
      id: '2',
      type: 'agent',
      title: 'Agent created',
      description: 'Marketing Assistant by Admin User',
      time: '1 hour ago',
      icon: Bot
    },
    {
      id: '3',
      type: 'user',
      title: 'New user joined',
      description: 'john.doe@company.com',
      time: '3 hours ago',
      icon: Users
    },
    {
      id: '4',
      type: 'conversation',
      title: 'Conversation completed',
      description: 'Code Assistant • Bug Fix Help',
      time: '5 hours ago',
      icon: MessageSquare
    }
  ];

  const topAgents = [
    { name: 'Sales Assistant', conversations: 45, usage: '32%' },
    { name: 'Code Assistant', conversations: 38, usage: '27%' },
    { name: 'Marketing Assistant', conversations: 29, usage: '21%' },
    { name: 'Customer Support', conversations: 18, usage: '13%' },
    { name: 'Research Assistant', conversations: 8, usage: '7%' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Monitor your application performance and usage</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-4 w-4" />
            <span>Last 30 days</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <BarChart3 className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className={`h-4 w-4 ${
                  stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={`ml-1 text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Usage Over Time</h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Chart visualization would go here</p>
                <p className="text-sm text-gray-400">Showing conversation volume over the last 30 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Agents</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topAgents.map((agent, index) => (
                <div key={agent.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.conversations} conversations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{agent.usage}</p>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-2 bg-primary-600 rounded-full" 
                        style={{ width: agent.usage }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-sm text-gray-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Response Time</span>
              <span className="text-sm font-medium text-gray-900">2.3s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">95th Percentile</span>
              <span className="text-sm font-medium text-gray-900">4.1s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-green-600">99.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Daily Active Users</span>
              <span className="text-sm font-medium text-gray-900">67</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Weekly Active Users</span>
              <span className="text-sm font-medium text-gray-900">89</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Session Duration</span>
              <span className="text-sm font-medium text-gray-900">12m 34s</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Calls This Month</span>
              <span className="text-sm font-medium text-gray-900">12,456</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Cost</span>
              <span className="text-sm font-medium text-gray-900">$234.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cost per Conversation</span>
              <span className="text-sm font-medium text-gray-900">$0.19</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 