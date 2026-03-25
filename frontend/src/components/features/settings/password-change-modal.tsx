'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { X, Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { userService } from '@/services/user-service';
import toast from 'react-hot-toast';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('At least one number');
  }
  
  return errors;
};

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useTranslations();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordErrors = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    if (!passwordsMatch) {
      setErrors([t('settings.profile.passwordMismatch')]);
      return;
    }
    
    if (!currentPassword) {
      setErrors(['Current password is required']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
      });
      
      toast.success(t('settings.profile.passwordChanged'));
      handleClose();
    } catch (error: any) {
      console.error('Password change failed:', error);
      const message = error?.response?.data?.detail || 'Failed to change password';
      setErrors([message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg w-full max-w-md mx-4 border border-neutral-200 dark:border-neutral-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('settings.profile.changePassword')}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error messages */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('settings.profile.currentPassword')}
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('settings.profile.newPassword')}
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score <= 2 ? 'text-red-500' :
                    passwordStrength.score <= 4 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                
                {/* Requirements */}
                <div className="mt-2 space-y-1">
                  {[
                    { check: newPassword.length >= 8, text: 'At least 8 characters' },
                    { check: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
                    { check: /[a-z]/.test(newPassword), text: 'One lowercase letter' },
                    { check: /\d/.test(newPassword), text: 'One number' },
                  ].map((req, index) => (
                    <div key={index} className="flex items-center space-x-1.5 text-xs">
                      {req.check ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-neutral-300 dark:border-neutral-600" />
                      )}
                      <span className={req.check ? 'text-green-600 dark:text-green-400' : 'text-neutral-500'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('settings.profile.confirmPassword')}
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                error={confirmPassword.length > 0 && !passwordsMatch}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-500">{t('settings.profile.passwordMismatch')}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || passwordErrors.length > 0 || !passwordsMatch || !currentPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.change')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;
