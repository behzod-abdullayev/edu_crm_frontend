'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { httpClient } from '@/services/api/axios.instance';
import { useToast } from '@shared/hooks/useToast';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { cn } from '@shared/utils/cn';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

interface ChangePasswordFormProps {
  userId: string;
  role?: 'student' | 'teacher' | 'admin' | 'owner';
  className?: string;
}

export function ChangePasswordForm({ userId: _userId, role: _role = 'student', className }: ChangePasswordFormProps) {
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await httpClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch {
      toast.error('Failed to change password', 'Please check your current password and try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-5 max-w-md', className)}
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="currentPassword"
            type={showCurrent ? 'text' : 'password'}
            className="pl-9 pr-10"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
            {...register('currentPassword')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p id="current-password-error" className="text-xs text-destructive mt-1" role="alert">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="newPassword"
            type={showNew ? 'text' : 'password'}
            className="pl-9 pr-10"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
            {...register('newPassword')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowNew((v) => !v)}
            aria-label={showNew ? 'Hide new password' : 'Show new password'}
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p id="new-password-error" className="text-xs text-destructive mt-1" role="alert">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            className="pl-9 pr-10"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="text-xs text-destructive mt-1" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
        Change Password
      </Button>
    </form>
  );
}