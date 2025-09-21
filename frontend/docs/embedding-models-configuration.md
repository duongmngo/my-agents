# Embedding Models Configuration

This document explains how to configure and use multiple embedding providers per workspace in the My Agents application.

## Overview

The new embedding system allows each workspace to have multiple embedding providers configured, with only one active at a time. This provides flexibility, redundancy, and cost optimization options.

## Key Features

### 🔄 **Multiple Providers per Workspace**
- Configure multiple embedding providers (OpenAI, Cohere, HuggingFace, Local)
- Each provider can have different models and configurations
- Only one provider can be active at a time

### 🎯 **Provider Management**
- **Active Provider**: Currently used for all embedding operations
- **Default Provider**: Automatically selected when no active provider exists
- **Provider Rotation**: Automatically switch between providers for load balancing

### 🛡️ **Security & Configuration**
- API keys stored securely per provider
- Provider-specific configurations (models, dimensions, endpoints)
- Workspace-level settings for performance and behavior

## Supported Providers

### 1. **OpenAI**
- **Models**: `text-embedding-ada-002`, `text-embedding-3-small`, `text-embedding-3-large`
- **Features**: High quality, reliable, enterprise-ready
- **Cost**: $0.0001 per 1K tokens
- **Best for**: Production applications requiring high-quality embeddings

### 2. **Cohere**
- **Models**: `embed-english-v3.0`, `embed-multilingual-v3.0`, `embed-english-light-v3.0`
- **Features**: Cost-effective, multilingual support, simple API
- **Cost**: $0.00005 per 1K tokens
- **Best for**: Cost-conscious applications with good quality requirements

### 3. **HuggingFace**
- **Models**: `sentence-transformers/all-MiniLM-L6-v2`, `sentence-transformers/all-mpnet-base-v2`
- **Features**: Open-source, custom models, flexible
- **Cost**: $0.00001 per request
- **Best for**: Custom model requirements and open-source enthusiasts

### 4. **Local Models**
- **Models**: `all-MiniLM-L6-v2`, `all-mpnet-base-v2`, `paraphrase-multilingual-MiniLM-L12-v2`
- **Features**: Offline, no API costs, privacy-focused
- **Cost**: $0 (one-time model download)
- **Best for**: Privacy-sensitive applications and offline environments

## Configuration Workflow

### Step 1: Access Settings
1. Navigate to **Settings** → **Embedding Models** tab
2. Ensure you have admin permissions for the workspace

### Step 2: Add Provider
1. Click **"Add Provider"** button
2. Select provider type (OpenAI, Cohere, HuggingFace, Local)
3. Configure provider-specific settings:
   - **Name**: Descriptive name for the provider
   - **Model**: Select from supported models
   - **API Key**: Provider API key (except for local models)
   - **Dimensions**: Vector dimensions (auto-detected for most models)
   - **Base URL**: Custom endpoint (optional)
   - **Organization ID**: OpenAI-specific (optional)

### Step 3: Configure Workspace Settings
- **Auto Rotation**: Automatically switch between providers
- **Fallback Provider**: Backup provider if active provider fails
- **Batch Size**: Number of texts to process in parallel
- **Retry Attempts**: Number of retries on failure
- **Timeout**: Maximum time to wait for response

### Step 4: Set Active Provider
- Only one provider can be active at a time
- Click the **Activate** button on your chosen provider
- The system will automatically use this provider for all embedding operations

## Usage Examples

### Example 1: Production Setup with Backup
```typescript
// Primary: OpenAI for high quality
// Backup: Cohere for cost optimization
// Fallback: Local models for offline operation

const providers = [
  {
    name: "OpenAI Production",
    provider: "openai",
    model: "text-embedding-3-large",
    isActive: true,
    isDefault: true
  },
  {
    name: "Cohere Backup",
    provider: "cohere", 
    model: "embed-english-v3.0",
    isActive: false
  },
  {
    name: "Local Fallback",
    provider: "local",
    model: "all-MiniLM-L6-v2",
    isActive: false
  }
];
```

### Example 2: Cost Optimization
```typescript
// Use Cohere for most operations
// Switch to OpenAI for critical tasks
// Local models for development/testing

const settings = {
  autoRotate: true,
  fallbackProviderId: "local-backup",
  batchSize: 50,
  retryAttempts: 2,
  timeout: 15000
};
```

### Example 3: Multilingual Support
```typescript
// Primary: OpenAI for English
// Secondary: HuggingFace for multilingual
// Local: Lightweight models for edge cases

const multilingualSetup = [
  {
    name: "OpenAI English",
    provider: "openai",
    model: "text-embedding-3-large",
    isActive: true
  },
  {
    name: "HF Multilingual",
    provider: "huggingface",
    model: "paraphrase-multilingual-MiniLM-L12-v2",
    isActive: false
  }
];
```

## API Integration

### Embedding Service Usage
```typescript
import { embeddingService } from '@/services/embedding-service';

// Get workspace settings
const settings = await embeddingService.getWorkspaceSettings(workspaceId);

// Add new provider
const newProvider = await embeddingService.addProvider(workspaceId, {
  name: "My OpenAI Provider",
  provider: "openai",
  config: {
    apiKey: "sk-...",
    model: "text-embedding-ada-002"
  }
});

// Set as default
await embeddingService.setDefaultProvider(workspaceId, providerId);

// Toggle active status
await embeddingService.toggleProviderActive(workspaceId, providerId);
```

### Backend Integration
The embedding service automatically:
1. **Queries the active provider** for all embedding operations
2. **Falls back to default provider** if active provider is unavailable
3. **Uses provider-specific configurations** (API keys, models, endpoints)
4. **Stores vectors in Weaviate** using the configured dimensions

## Best Practices

### 🔐 **Security**
- Store API keys securely (encrypted in database)
- Use environment variables for sensitive configuration
- Implement API key rotation policies
- Monitor API key usage and costs

### 📊 **Performance**
- Set appropriate batch sizes based on provider limits
- Configure timeouts based on network conditions
- Use provider rotation for load balancing
- Monitor response times and error rates

### 💰 **Cost Management**
- Use cost-effective providers for non-critical operations
- Implement usage quotas and alerts
- Monitor token consumption per provider
- Set up fallback providers for cost optimization

### 🔄 **Reliability**
- Always have a fallback provider configured
- Test provider connections regularly
- Monitor provider health and availability
- Implement automatic failover mechanisms

## Troubleshooting

### Common Issues

#### Provider Not Responding
- Check API key validity
- Verify network connectivity
- Check provider service status
- Review rate limits and quotas

#### Dimension Mismatch
- Ensure vector dimensions match across providers
- Check model configuration settings
- Verify Weaviate schema compatibility
- Consider re-indexing if dimensions change

#### Performance Issues
- Adjust batch sizes based on provider limits
- Check timeout configurations
- Monitor network latency
- Consider provider rotation for load balancing

### Debug Information
- Check provider health status
- Review error logs and messages
- Monitor usage statistics
- Test provider connections manually

## Migration Guide

### From Single Provider
1. **Backup current configuration**
2. **Add new providers** alongside existing one
3. **Test new providers** with sample data
4. **Switch active provider** during maintenance window
5. **Monitor performance** and adjust settings

### From Multiple Unmanaged Providers
1. **Audit existing providers** and configurations
2. **Consolidate configurations** into workspace settings
3. **Set appropriate defaults** and fallbacks
4. **Implement monitoring** and alerting
5. **Train team** on new management interface

## Future Enhancements

- **Provider Analytics**: Detailed usage and cost analysis
- **Automatic Provider Selection**: AI-powered provider selection based on content type
- **Advanced Rotation Policies**: Time-based and load-based rotation
- **Provider Marketplace**: Third-party provider integrations
- **Real-time Monitoring**: Live provider health and performance metrics

---

For technical support or questions, please refer to the API documentation or contact the development team.
