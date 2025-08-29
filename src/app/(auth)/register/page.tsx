'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, type RegistrationInput } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema)
  });

  const onSubmit = async (data: RegistrationInput) => {
    setIsLoading(true);
    setServerErrors({});

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to dashboard after successful registration
        router.push('/dashboard');
        router.refresh();
      } else {
        if (result.errors) {
          setServerErrors(result.errors);
        } else {
          setServerErrors({ _general: result.message || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerErrors({ _general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Staff Only:</strong> You need a valid invitation code from your manager to create an account.
              </p>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Invitation Code"
              type="text"
              required
              placeholder="Enter your invitation code"
              error={errors.invitationCode?.message || serverErrors.invitationCode}
              helperText="Get this code from your store manager or administrator"
              {...register('invitationCode')}
            />

            <Input
              label="Username"
              type="text"
              autoComplete="username"
              required
              placeholder="Choose a username"
              error={errors.username?.message || serverErrors.username}
              helperText="3-50 characters, letters, numbers, and underscores only"
              {...register('username')}
            />

            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your work email"
              error={errors.email?.message || serverErrors.email}
              helperText="Use your company email address"
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Create a secure password"
              error={errors.password?.message}
              helperText="At least 8 characters with uppercase, lowercase, and number"
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message || serverErrors.confirmPassword}
              helperText="Must match the password above"
              {...register('confirmPassword')}
            />
          </div>

          {serverErrors._general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{serverErrors._general}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              Create Account
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}