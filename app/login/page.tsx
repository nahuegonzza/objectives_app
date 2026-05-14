'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import Image from 'next/image';

function getLoginErrorMessage(defaultMessage: string, fallbackMessage: string) {
  if (!defaultMessage) return fallbackMessage;
  const normalized = defaultMessage.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return fallbackMessage;
  }
  if (normalized.includes('email not confirmed') || normalized.includes('confirm your email')) {
    return 'El email aún no está verificado. Revisa tu correo.';
  }
  return defaultMessage;
}

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const input = emailOrUsername.trim().toLowerCase();
    let emailToUse = input;

    // Check if input is an email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    
    if (!isEmail) {
      // It's a username, try to find the associated email
      try {
        const response = await fetch(`/api/auth/getEmailByUsername?username=${encodeURIComponent(input)}`);
        if (response.ok) {
          const data = await response.json();
          emailToUse = data.email;
        } else {
          setError('Usuario o contraseña incorrectos');
          setLoading(false);
          return;
        }
      } catch (checkError) {
        setError('Usuario o contraseña incorrectos');
        setLoading(false);
        return;
      }
    }

    const supabase = createBrowserSupabaseClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (authError) {
      let message = getLoginErrorMessage(authError.message, 'Usuario o contraseña incorrectos');
      try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailToUse)}`);
        if (response.ok) {
          const details = await response.json();
          if (details.serviceRoleAvailable) {
            if (!details.exists) {
              message = 'No existe ninguna cuenta con ese usuario o email.';
            } else if (!details.emailConfirmed) {
              message = 'El email aún no está verificado. Revisa tu correo.';
            } else {
              message = 'La contraseña es incorrecta.';
            }
          }
        }
      } catch (checkError) {
      }
      setError(message);
    } else if (data?.session) {
      router.refresh();
      router.push('/');
    } else {
      setError('No fue posible iniciar sesión. Intenta nuevamente.');
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createBrowserSupabaseClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setError('Se ha enviado un enlace de restablecimiento a tu correo electrónico.');
      setShowForgotPassword(false);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 pt-0 pb-0 -mt-20 sm:mt-0">
      <div className="max-w-md w-full bg-slate-900 rounded-lg shadow-lg p-8 border border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Iniciar Sesión</h2>
          <p className="mt-2 text-slate-400">Accede a tu cuenta</p>
        </div>

        {!showForgotPassword ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-slate-300 mb-2">
                Email o Usuario
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="tu@email.com o tunombredeusuario"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                <Image
                  src={showPassword ? '/icons/ui/no_view_pass_icon.png' : '/icons/ui/view_pass_icon.png'}
                  alt={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  width={20}
                  height={20}
                  unoptimized
                />
              </button>
            </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-md p-3">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                ¿No tienes cuenta? Regístrate
              </Link>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="resetEmail"
                name="resetEmail"
                type="email"
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-center bg-blue-900/20 border border-blue-800 rounded-md p-3">
                <p className="text-blue-300">{error}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setResetEmail('');
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

