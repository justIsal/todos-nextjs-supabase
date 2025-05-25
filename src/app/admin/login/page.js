'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Check, X, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const Toast = ({ toast, onRemove }) => (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out ${
        toast.type === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200'
          : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200'
      } animate-in slide-in-from-right-full`}
      style={{ marginTop: `${toast.index * 80}px` }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {toast.type === 'success' ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <X size={14} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.message && <p className="text-sm opacity-90 mt-1">{toast.message}</p>}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );

  const showToast = (type, title, message = '') => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, title, message, index: toasts.length };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id).map((toast, index) => ({ ...toast, index }))
    );
  };

  const LoadingSpinner = ({ size = 16, className = '' }) => (
    <div className={`inline-block animate-spin ${className}`}>
      <div
        className={`border-2 border-current border-t-transparent rounded-full`}
        style={{ width: size, height: size }}
      />
    </div>
  );

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast('error', 'Missing Information', 'Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let errorMessage = 'Login failed. Please try again.';

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account first.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }

        showToast('error', 'Login Failed', errorMessage);
        return;
      }

      showToast('success', 'Login Successful! 🎉', 'Welcome back! Redirecting to dashboard...');

      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      showToast('error', 'Unexpected Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4 transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Login</h1>
            {loading && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <LoadingSpinner size={16} />
                <span className="text-sm">Authenticating...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size={16} className="text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>

            <div className="text-sm text-center">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Forgot your password?
              </a>
            </div>
          </form>
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <LoadingSpinner size={20} className="text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Authenticating your account...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
