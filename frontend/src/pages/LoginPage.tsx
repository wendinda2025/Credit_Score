/**
 * Page de connexion
 */
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials } from '@/types'
import { LogIn } from 'lucide-react'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setLoading(true)
      await login(data)
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Erreur de connexion:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PAMF</h1>
            <p className="text-gray-600">Système de Gestion de Crédit</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="label">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={`input ${errors.username ? 'border-red-500' : ''}`}
                {...register('username', { required: 'Le nom d\'utilisateur est requis' })}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
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
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                {...register('password', { required: 'Le mot de passe est requis' })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Informations de test */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">Comptes de test :</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Admin: admin / admin123</li>
              <li>• Agent: agent / agent123</li>
              <li>• Risk Officer: risk / risk123</li>
              <li>• Chef d'Agence: chef / chef123</li>
            </ul>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          © 2025 PAMF - Tous droits réservés
        </p>
      </div>
    </div>
  )
}

export default LoginPage
