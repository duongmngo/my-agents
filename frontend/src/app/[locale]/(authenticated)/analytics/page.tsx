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
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Analytics</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Monitor your application performance and usage</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300">
            <Calendar className="h-4 w-4" />
            <span>Last 30 days</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors">
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
            <div key={stat.name} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
                </div>
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className={`h-4 w-4 ${
                  stat.changeType === 'positive' ? 'text-success-500 dark:text-success-400' : 'text-error-500 dark:text-error-400'
                }`} />
                <span className={`ml-1 text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Usage Over Time</h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="text-center">
                <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-primary-500 dark:text-primary-400" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 font-medium">Chart visualization would go here</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Showing conversation volume over the last 30 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Top Agents</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topAgents.map((agent, index) => (
                <div key={agent.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{agent.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{agent.conversations} conversations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{agent.usage}</p>
                    <div className="w-20 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full mt-1">
                      <div 
                        className="h-2 bg-primary-600 dark:bg-primary-500 rounded-full" 
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
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{activity.title}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{activity.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Response Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Average Response Time</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">2.3s</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">95th Percentile</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">4.1s</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Success Rate</span>
              <span className="text-sm font-medium text-success-600 dark:text-success-400">99.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">User Engagement</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Daily Active Users</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">67</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Weekly Active Users</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">89</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Avg Session Duration</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">12m 34s</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Cost Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">API Calls This Month</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">12,456</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Estimated Cost</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">$234.50</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Cost per Conversation</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">$0.19</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 