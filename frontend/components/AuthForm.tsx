'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authService, LoginData, RegisterData } from '@/utils/auth';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>();

  const onSubmit = async (data: LoginData | RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await authService.login(data);
      } else {
        await authService.register(data);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white border border-gray-200 p-8">
      <h2 className="text-lg font-light text-gray-900 text-center mb-8">
        {mode === 'login' ? 'Sign in to upload' : 'Create account'}
      </h2>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 text-white py-2 px-4 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <a
            href={mode === 'login' ? '/auth/register' : '/auth/login'}
            className="text-gray-700 hover:text-gray-900 underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
}