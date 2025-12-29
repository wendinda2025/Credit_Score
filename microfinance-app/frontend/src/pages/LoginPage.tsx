import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await authService.login(data.email, data.password);
      login(response.user, response.accessToken, response.refreshToken);
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏦 Microfinance
            </h1>
            <p className="text-gray-500">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'L\'email est requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide',
                  },
                })}
                className={errors.email ? 'input-error' : 'input'}
                placeholder="admin@microfinance.local"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', {
                  required: 'Le mot de passe est requis',
                })}
                className={errors.password ? 'input-error' : 'input'}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Identifiants par défaut :</p>
            <p className="font-mono text-xs mt-1">
              admin@microfinance.local / Admin@123!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
