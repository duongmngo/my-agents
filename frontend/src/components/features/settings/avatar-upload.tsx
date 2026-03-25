'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { userService } from '@/services/user-service';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  username: string;
  onAvatarUpdate: (avatarUrl: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  username,
  onAvatarUpdate,
}) => {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getInitials = () => {
    return username?.charAt(0)?.toUpperCase() || 'U';
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please use JPEG, PNG, or WebP images.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 5MB.';
    }
    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const response = await userService.uploadAvatar(file);
      if (response.success) {
        toast.success(t('settings.profile.avatarUpdated'));
        onAvatarUpdate(response.avatarUrl);
        setPreviewUrl(null); // Clear preview after successful upload
      }
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      toast.error(error?.response?.data?.detail || 'Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [t, onAvatarUpdate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative">
      {/* Avatar Display */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-24 h-24 rounded-full cursor-pointer relative overflow-hidden
          border-2 transition-all duration-200
          ${isDragging 
            ? 'border-primary-500 border-dashed bg-primary-50 dark:bg-primary-900/20' 
            : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-400'
          }
          ${isUploading ? 'opacity-50' : ''}
        `}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <span className="text-3xl font-semibold text-primary-600 dark:text-primary-400">
              {getInitials()}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Change button */}
      <button
        onClick={handleClick}
        disabled={isUploading}
        className="absolute -bottom-1 -right-1 p-1.5 bg-primary-500 hover:bg-primary-600 rounded-full text-white shadow-md transition-colors disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Hint text */}
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-center">
        {t('settings.profile.avatarHint')}
      </p>
    </div>
  );
};

export default AvatarUpload;
