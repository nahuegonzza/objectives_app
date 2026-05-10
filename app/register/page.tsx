'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import Image from 'next/image';

function getRegisterMessage(data: any, errorMessage: string) {
  if (errorMessage) return errorMessage;
  if (data?.user && !data.user.email_confirmed_at) {
    return 'Registro exitoso. Revisa tu correo para verificar tu cuenta.';
  }
  if (data?.session) {
    return 'Registro exitoso. Has iniciado sesión correctamente.';
  }
  return 'Registro exitoso. Revisa tu correo para verificar tu cuenta.';
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    if (!firstName.trim() || !lastName.trim() || !birthDate) {
      setStatus('Nombre, apellido y fecha de nacimiento son obligatorios');
      setStatusType('error');
      setLoading(false);
      return;
    }

    if (!username.trim()) {
      setStatus('El nombre de usuario es obligatorio');
      setStatusType('error');
      setLoading(false);
      return;
    }

    // Validate username format (alphanumeric, underscore, dash, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username.trim())) {
      setStatus('El nombre de usuario debe tener 3-20 caracteres y solo contener letras, números, guiones y guiones bajos');
      setStatusType('error');
      setLoading(false);
      return;
    }

    // Check username availability
    let checkData: any = null;
    try {
      const checkRes = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.trim())}`);
      if (!checkRes.ok) {
        const errorData = await checkRes.json().catch(() => null);
        setStatus(errorData?.error || 'Error verificando nombre de usuario');
        setStatusType('error');
        setLoading(false);
        return;
      }
      checkData = await checkRes.json();
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(false);
      setUsernameSuggestions([]);
      setStatus('Error verificando nombre de usuario');
      setStatusType('error');
      setLoading(false);
      return;
    }

    if (!checkData?.available) {
      setUsernameAvailable(false);
      setStatus('Este nombre de usuario ya está en uso');
      setUsernameSuggestions(checkData?.suggestions || []);
      setStatusType('error');
      setLoading(false);
      return;
    }
    setUsernameAvailable(true);
    setUsernameSuggestions([]);

    if (password !== confirmPassword) {
      setStatus('Las contraseñas no coinciden');
      setStatusType('error');
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate,
          username: username.trim(),
        },
      },
    });

    if (error) {
      setStatus(error.message);
      setStatusType('error');
    } else {
      const message = getRegisterMessage(data, 'Registro exitoso. Revisa tu correo para verificar tu cuenta.');
      setStatus(message);
      setStatusType('success');
      
      // Save username to database - wait for session to be established
      // This prevents the race condition where PATCH uses wrong user session
      if (data?.user) {
        try {
          // Wait a moment for cookies to be set, then verify session before PATCH
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify we have a valid session before saving username
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            await fetch('/api/user', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: username.trim() }),
              credentials: 'include'
            });
          }
        } catch (err) {
          console.error('Error saving username:', err);
        }
      }

      if (data?.session) {
        router.refresh();
        router.push('/');
      }
    }

    setLoading(false);
  };

  const checkUsernameAvailability = async (usernameValue: string) => {
    if (!usernameValue.trim()) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(usernameValue.trim())) {
      setUsernameAvailable(false);
      setUsernameSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(usernameValue.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setUsernameAvailable(data.available);
        setUsernameSuggestions(data.suggestions || []);
      } else {
        setUsernameAvailable(false);
        setUsernameSuggestions([]);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(false);
      setUsernameSuggestions([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 rounded-lg shadow-lg p-8 border border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Crear Cuenta</h2>
          <p className="mt-2 text-slate-400">Regístrate para comenzar</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                Nombre
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                Apellido
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-slate-300 mb-2">
              Fecha de nacimiento
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
              Nombre de usuario
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="tunombredeusuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameSuggestions([]);
                  checkUsernameAvailability(e.target.value);
                }}
              />
              {username && (
                <div className="mt-1 text-sm">
                  {usernameAvailable === true && (
                    <span className="text-emerald-400">✓ Nombre de usuario disponible</span>
                  )}
                  {usernameAvailable === false && (
                    <span className="text-red-400">✗ Nombre de usuario no disponible</span>
                  )}
                </div>
              )}
              {usernameAvailable === false && usernameSuggestions.length > 0 && (
                <div className="mt-2 rounded-md border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-200">
                  <p className="mb-2 text-slate-400">Usuarios sugeridos:</p>
                  <div className="flex flex-wrap gap-2">
                    {usernameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setUsername(suggestion);
                          setUsernameSuggestions([]);
                          checkUsernameAvailability(suggestion);
                        }}
                        className="rounded-full border border-slate-600 px-3 py-1 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">3-20 caracteres, letras, números, guiones y guiones bajos</p>
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
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              <Image
                src={showConfirmPassword ? '/icons/ui/no_view_pass_icon.png' : '/icons/ui/view_pass_icon.png'}
                alt={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                width={20}
                height={20}
                unoptimized
              />
            </button>
          </div>
          </div>

          {status && (
            <div className={`text-sm text-center rounded-md p-3 ${statusType === 'success' ? 'bg-emerald-900/20 text-emerald-200 border border-emerald-700' : 'bg-red-900/20 text-red-200 border border-red-700'}`}>
              {status}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
