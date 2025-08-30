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
    <div className="min-h-screen flex">
      {/* Left side - Brand section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-eucalyptus)] to-emerald-500 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute top-0 right-0 w-96 h-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,89.8,-0.2C89.6,15.9,86.6,31.8,78.9,45.2C71.2,58.6,58.8,69.5,44.7,76.4C30.6,83.3,15.3,86.2,0.1,86C-15.1,85.8,-30.2,82.5,-44.3,75.6C-58.4,68.7,-71.5,58.2,-79.3,44.8C-87.1,31.4,-89.6,15.7,-89.8,-0.1C-90,-15.9,-87.9,-31.8,-80.4,-45.2C-72.9,-58.6,-60,-69.5,-45.9,-76.4C-31.8,-83.3,-15.9,-86.2,-0.1,-86C15.7,-85.8,31.4,-82.5,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Join Our Team
            </h1>
            <p className="text-xl text-emerald-100 leading-relaxed">
              Create your staff account to access comprehensive inventory management and analytics tools
            </p>
            <div className="flex items-center space-x-2 text-emerald-100">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Invitation code required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-heading-1 font-bold text-[var(--color-night)]">
              Create Account
            </h2>
            <p className="mt-2 text-body text-gray-600">
              Join the team with your invitation code
            </p>
          </div>

          {/* Staff notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  <strong>Staff Only:</strong> You need a valid invitation code from your manager.
                </p>
              </div>
            </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <Input
                type="text"
                required
                placeholder="Invitation Code"
                error={errors.invitationCode?.message || serverErrors.invitationCode}
                className="h-11"
                {...register('invitationCode')}
              />

              <Input
                type="text"
                autoComplete="username"
                required
                placeholder="Username"
                error={errors.username?.message || serverErrors.username}
                className="h-11"
                {...register('username')}
              />

              <Input
                type="email"
                autoComplete="email"
                required
                placeholder="Work Email Address"
                error={errors.email?.message || serverErrors.email}
                className="h-11"
                {...register('email')}
              />

              <Input
                type="password"
                autoComplete="new-password"
                required
                placeholder="Password"
                error={errors.password?.message}
                className="h-11"
                {...register('password')}
              />

              <Input
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm Password"
                error={errors.confirmPassword?.message || serverErrors.confirmPassword}
                className="h-11"
                {...register('confirmPassword')}
              />
            </div>

            {serverErrors._general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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

            <div className="pt-2">
              <Button
                type="submit"
                loading={isLoading}
                className="w-full h-11 rounded-lg bg-[var(--color-eucalyptus)] hover:bg-emerald-600 text-white font-medium"
              >
                Create Account
              </Button>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-[var(--color-eucalyptus)] hover:text-emerald-700 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="text-center pt-1">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}