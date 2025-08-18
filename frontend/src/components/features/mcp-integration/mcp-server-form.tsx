import React, { useState, useEffect } from 'react';
import { MCPServerConfiguration } from '@/types/mcp-types';
import { Button } from '@/components/common/button';
import { 
  Save, 
  X, 
  Server, 
  Settings, 
  Network, 
  Shield,
  Activity
} from 'lucide-react';

interface MCPServerFormProps {
  config?: Partial<MCPServerConfiguration>;
  onSave: (config: Partial<MCPServerConfiguration>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const MCPServerForm: React.FC<MCPServerFormProps> = ({
  config,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<Partial<MCPServerConfiguration>>({
    name: '',
    description: '',
    serverType: 'custom',
    image: '',
    command: [],
    environment: {},
    volumes: [],
    ports: [],
    resources: {
      cpu: 1,
      memory: 512,
      network: 'default'
    },
    healthCheck: {
      endpoint: '/health',
      interval: 30,
      timeout: 10,
      retries: 3
    },
    authentication: {
      type: 'jwt',
      secret: ''
    },
    enabled: true,
    ...config
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Server name is required';
    }

    if (!formData.image?.trim()) {
      newErrors.image = 'Docker image is required';
    }

    if (formData.resources?.cpu && formData.resources.cpu < 0.1) {
      newErrors.cpu = 'CPU must be at least 0.1 cores';
    }

    if (formData.resources?.memory && formData.resources.memory < 128) {
      newErrors.memory = 'Memory must be at least 128 MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addEnvironmentVariable = () => {
    setFormData(prev => ({
      ...prev,
      environment: {
        ...prev.environment,
        '': ''
      }
    }));
  };

  const updateEnvironmentVariable = (key: string, value: string) => {
    setFormData(prev => {
      const newEnv = { ...prev.environment };
      if (value === '') {
        delete newEnv[key];
      } else {
        newEnv[key] = value;
      }
      return {
        ...prev,
        environment: newEnv
      };
    });
  };

  const addPort = () => {
    setFormData(prev => ({
      ...prev,
      ports: [
        ...(prev.ports || []),
        { containerPort: 8080, hostPort: 8080, protocol: 'tcp' }
      ]
    }));
  };

  const updatePort = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ports: prev.ports?.map((port, i) => 
        i === index ? { ...port, [field]: value } : port
      )
    }));
  };

  const removePort = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ports: prev.ports?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Server className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit MCP Server' : 'Create MCP Server'}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="My MCP Server"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server Type
              </label>
              <select
                value={formData.serverType || 'custom'}
                onChange={(e) => handleInputChange('serverType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="custom">Custom</option>
                <option value="predefined">Predefined</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the purpose of this MCP server..."
              />
            </div>
          </div>
        </div>

        {/* Container Configuration */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Container Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Docker Image *
              </label>
              <input
                type="text"
                value={formData.image || ''}
                onChange={(e) => handleInputChange('image', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.image ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="my-mcp-server:latest"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Command (Optional)
              </label>
              <input
                type="text"
                value={formData.command?.join(' ') || ''}
                onChange={(e) => handleInputChange('command', e.target.value.split(' ').filter(Boolean))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="--port 8080 --host 0.0.0.0"
              />
            </div>
          </div>
        </div>

        {/* Resource Limits */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Resource Limits
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPU (cores)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.resources?.cpu || 1}
                onChange={(e) => handleInputChange('resources', {
                  ...formData.resources,
                  cpu: parseFloat(e.target.value) || 1
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.cpu ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.cpu && (
                <p className="mt-1 text-sm text-red-600">{errors.cpu}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Memory (MB)
              </label>
              <input
                type="number"
                min="128"
                value={formData.resources?.memory || 512}
                onChange={(e) => handleInputChange('resources', {
                  ...formData.resources,
                  memory: parseInt(e.target.value) || 512
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.memory ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.memory && (
                <p className="mt-1 text-sm text-red-600">{errors.memory}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Network
              </label>
              <input
                type="text"
                value={formData.resources?.network || 'default'}
                onChange={(e) => handleInputChange('resources', {
                  ...formData.resources,
                  network: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Port Configuration */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Network className="h-5 w-5 mr-2" />
              Port Configuration
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPort}
            >
              Add Port
            </Button>
          </div>
          
          <div className="space-y-3">
            {formData.ports?.map((port, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded border">
                <input
                  type="number"
                  value={port.containerPort}
                  onChange={(e) => updatePort(index, 'containerPort', parseInt(e.target.value) || 8080)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="8080"
                />
                <span className="text-gray-500">→</span>
                <input
                  type="number"
                  value={port.hostPort}
                  onChange={(e) => updatePort(index, 'hostPort', parseInt(e.target.value) || 8080)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="8080"
                />
                <select
                  value={port.protocol}
                  onChange={(e) => updatePort(index, 'protocol', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePort(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {(!formData.ports || formData.ports.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No ports configured. Click "Add Port" to configure port mappings.
              </p>
            )}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Environment Variables
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEnvironmentVariable}
            >
              Add Variable
            </Button>
          </div>
          
          <div className="space-y-3">
            {Object.entries(formData.environment || {}).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newEnv = { ...formData.environment };
                    delete newEnv[key];
                    newEnv[e.target.value] = value;
                    handleInputChange('environment', newEnv);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="VARIABLE_NAME"
                />
                <span className="text-gray-500">=</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateEnvironmentVariable(key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="value"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateEnvironmentVariable(key, '')}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {(!formData.environment || Object.keys(formData.environment).length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No environment variables configured. Click "Add Variable" to add environment variables.
              </p>
            )}
          </div>
        </div>

        {/* Health Check */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Health Check Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Health Check Endpoint
              </label>
              <input
                type="text"
                value={formData.healthCheck?.endpoint || '/health'}
                onChange={(e) => handleInputChange('healthCheck', {
                  ...formData.healthCheck,
                  endpoint: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="/health"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                value={formData.healthCheck?.interval || 30}
                onChange={(e) => handleInputChange('healthCheck', {
                  ...formData.healthCheck,
                  interval: parseInt(e.target.value) || 30
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                min="1"
                value={formData.healthCheck?.timeout || 10}
                onChange={(e) => handleInputChange('healthCheck', {
                  ...formData.healthCheck,
                  timeout: parseInt(e.target.value) || 10
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retries
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.healthCheck?.retries || 3}
                onChange={(e) => handleInputChange('healthCheck', {
                  ...formData.healthCheck,
                  retries: parseInt(e.target.value) || 3
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Authentication
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authentication Type
              </label>
              <select
                value={formData.authentication?.type || 'jwt'}
                onChange={(e) => handleInputChange('authentication', {
                  ...formData.authentication,
                  type: e.target.value as 'jwt' | 'api_key' | 'none'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="jwt">JWT</option>
                <option value="api_key">API Key</option>
                <option value="none">None</option>
              </select>
            </div>

            {formData.authentication?.type !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={formData.authentication?.secret || ''}
                  onChange={(e) => handleInputChange('authentication', {
                    ...formData.authentication,
                    secret: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter secret key..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={false}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Server' : 'Create Server'}
          </Button>
        </div>
      </form>
    </div>
  );
};
