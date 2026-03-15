'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  supportedExtensions: string[];
  maxFileSizeMb: number;
  isUploading?: boolean;
  uploadProgress?: number;
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  supportedExtensions,
  maxFileSizeMb,
  isUploading = false,
  uploadProgress = 0,
  disabled = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!supportedExtensions.includes(extension)) {
        return `File type .${extension} is not supported. Supported: ${supportedExtensions.join(', ')}`;
      }

      // Check file size
      const fileSizeMb = file.size / (1024 * 1024);
      if (fileSizeMb > maxFileSizeMb) {
        return `File size (${fileSizeMb.toFixed(1)}MB) exceeds maximum (${maxFileSizeMb}MB)`;
      }

      return null;
    },
    [supportedExtensions, maxFileSizeMb]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setValidationError(null);

      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }

      setSelectedFile(file);
      await onUpload(file);
      setSelectedFile(null);
    },
    [validateFile, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input value so same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const acceptExtensions = supportedExtensions.map((ext) => `.${ext}`).join(',');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag and drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptExtensions}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-primary-500 animate-spin" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Uploading {selectedFile?.name || 'file'}...
              </p>
              <div className="w-48 mx-auto bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {uploadProgress}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`
              p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center
              ${isDragging
                ? 'bg-primary-100 dark:bg-primary-800'
                : 'bg-neutral-100 dark:bg-neutral-800'
              }
            `}>
              <Upload className={`h-8 w-8 ${isDragging ? 'text-primary-500' : 'text-neutral-500 dark:text-neutral-400'}`} />
            </div>
            <div>
              <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
                {isDragging ? 'Drop file here' : 'Drag and drop a file here'}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                or click to browse
              </p>
            </div>
            <div className="text-xs text-neutral-400 dark:text-neutral-500">
              <p>Supported: {supportedExtensions.join(', ').toUpperCase()}</p>
              <p>Max size: {maxFileSizeMb}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0" />
          <p className="text-sm text-error-700 dark:text-error-300 flex-1">{validationError}</p>
          <button
            onClick={clearValidationError}
            className="p-1 hover:bg-error-100 dark:hover:bg-error-800/50 rounded"
          >
            <X className="h-4 w-4 text-error-500" />
          </button>
        </div>
      )}
    </div>
  );
};
