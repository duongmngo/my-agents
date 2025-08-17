import React from 'react';
import { Badge } from '@/components/common/badge/badge';
import { Button } from '@/components/common/button';
import { ProviderIcon } from '@/components/common/icon';
import { LLMModel, EmbeddingModel } from '@/types/common-types';
import { Crown, Settings, Trash2 } from 'lucide-react';

interface ModelCardProps {
  model: LLMModel | EmbeddingModel;
  isDefault?: boolean;
  onSetDefault?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isDefault = false,
  onSetDefault,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const isLLMModel = 'modelType' in model;
  const llmModel = isLLMModel ? model as LLMModel : null;
  const embeddingModel = !isLLMModel ? model as EmbeddingModel : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
            {isDefault && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <ProviderIcon 
              provider={model.provider.name} 
              size="sm" 
              className="text-gray-600"
            />
            <span className="text-sm text-gray-600">{model.provider.name}</span>
            <Badge variant={model.isActive ? 'success' : 'secondary'}>
              {model.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="space-y-2">
            {llmModel && (
              <>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Type: {llmModel.modelType}</span>
                  <span>Max Tokens: {llmModel.maxTokens.toLocaleString()}</span>
                  <span>Context: {llmModel.contextWindow.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Input: ${llmModel.pricing.input}/1K tokens</span>
                  <span>Output: ${llmModel.pricing.output}/1K tokens</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {llmModel.capabilities.map((capability, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {embeddingModel && (
              <>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Dimensions: {embeddingModel.dimensions}</span>
                  <span>Max Tokens: {embeddingModel.maxTokens.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>Cost: ${embeddingModel.pricing.perToken}/1K tokens</span>
                </div>
              </>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            {!isDefault && onSetDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetDefault}
                title="Set as default"
              >
                <Crown className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                title="Edit model"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                title="Delete model"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
