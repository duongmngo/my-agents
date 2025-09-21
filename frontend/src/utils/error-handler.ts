import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';

export interface ApiError {
  message: string;
  error_code?: string;
}

export interface ApiErrorResponse {
  detail: {
    message: string;
    error_code: string;
  };
}

export const getErrorMessage = (
  error: ApiError, 
  t: ReturnType<typeof useTranslations>
): { title: string; message: string; type: 'error' | 'warning' | 'info' } => {
  const errorCode = error.error_code || 'UNKNOWN_ERROR';
  
  // Try to get localized message first
  try {
    const localizedError = t(`errors.${errorCode}` as any) as any;
    if (localizedError && typeof localizedError === 'object' && localizedError.title && localizedError.message) {
      return {
        title: localizedError.title || t('common.error'),
        message: localizedError.message || error.message || t('errors.UNKNOWN_ERROR.message' as any),
        type: errorCode === 'NO_ACTIVE_EMBEDDING_PROVIDER' ? 'warning' : 'error'
      };
    }
  } catch (e) {
    // Fallback to hardcoded messages if translation fails
  }
  
  // Fallback to hardcoded messages
  switch (errorCode) {
    case 'NO_ACTIVE_EMBEDDING_PROVIDER':
      return {
        title: 'No Embedding Provider Configured',
        message: 'Please configure an embedding provider in your workspace settings before generating embeddings.',
        type: 'warning'
      };
    
    case 'EMBEDDING_PROVIDERS_UNAVAILABLE':
      return {
        title: 'Embedding Service Unavailable',
        message: 'The embedding service is currently unavailable. Please try again later.',
        type: 'error'
      };
    
    case 'DATABASE_SESSION_REQUIRED':
      return {
        title: 'Database Error',
        message: 'A database connection is required for this operation. Please try again.',
        type: 'error'
      };
    
    case 'EMBEDDING_GENERATION_FAILED':
      return {
        title: 'Embedding Generation Failed',
        message: 'Failed to generate embedding for the content. Please check your provider configuration.',
        type: 'error'
      };
    
    case 'EMBEDDING_OPERATION_FAILED':
      return {
        title: 'Embedding Operation Failed',
        message: 'An error occurred during the embedding operation. Please try again.',
        type: 'error'
      };
    
    case 'NETWORK_ERROR':
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        type: 'error'
      };
    
    case 'UNKNOWN_ERROR':
    default:
      return {
        title: 'Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        type: 'error'
      };
  }
};

export const showErrorToast = (
  error: ApiError, 
  addToast: ReturnType<typeof useToast>['addToast'],
  t: ReturnType<typeof useTranslations>
) => {
  const { title, message, type } = getErrorMessage(error, t);
  
  addToast({
    type,
    title,
    message,
    duration: type === 'warning' ? 8000 : 5000 // Show warnings longer
  });
};

export const showSuccessToast = (
  successKey: string,
  params: Record<string, string> = {},
  addToast: ReturnType<typeof useToast>['addToast'],
  t: ReturnType<typeof useTranslations>
) => {
  try {
    const localizedSuccess = t(`success.${successKey}` as any) as any;
    if (localizedSuccess && typeof localizedSuccess === 'object' && localizedSuccess.title && localizedSuccess.message) {
      let message = localizedSuccess.message;
      
      // Replace parameters in the message
      Object.entries(params).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, value);
      });
      
      addToast({
        type: 'success',
        title: localizedSuccess.title || t('common.success'),
        message,
        duration: 3000
      });
      return;
    }
  } catch (e) {
    // Fallback to hardcoded messages
  }
  
  // Fallback
  addToast({
    type: 'success',
    title: 'Success',
    message: 'Operation completed successfully',
    duration: 3000
  });
};
