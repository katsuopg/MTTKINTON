'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/lib/auth/actions';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  locale: string;
  messages: {
    auth: {
      login: string;
      password: string;
      employeeNumber: string;
      employeeNumberPlaceholder: string;
      passwordPlaceholder: string;
      loggingIn: string;
      error: {
        employeeNumberRequired: string;
        passwordMin: string;
        generic: string;
      };
    };
  };
}

export function LoginForm({ locale, messages }: LoginFormProps) {
  const t = messages.auth;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginSchema = z.object({
    identifier: z.string().min(1, t.error.employeeNumberRequired),
    password: z.string().min(6, t.error.passwordMin),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.identifier, data.password);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t.error.generic);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" style={{ maxWidth: '100%' }}>
      <div>
        <label
          htmlFor="identifier"
          className="block text-sm font-medium text-gray-700"
        >
          {t.employeeNumber}
        </label>
        <div className="mt-1">
          <input
            {...register('identifier')}
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
            placeholder={t.employeeNumberPlaceholder}
            suppressHydrationWarning
          />
          {errors.identifier && (
            <p className="mt-2 text-sm text-red-600">
              {errors.identifier.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          {t.password}
        </label>
        <div className="mt-1">
          <input
            {...register('password')}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={t.passwordPlaceholder}
            suppressHydrationWarning
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              {t.loggingIn}
            </>
          ) : (
            t.login
          )}
        </button>
      </div>
    </form>
  );
}
