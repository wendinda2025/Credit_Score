/**
 * Page du tableau de bord
 */
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  const stats = [
    {
      name: 'Total des demandes',
      value: '24',
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'En attente',
      value: '8',
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+3',
    },
    {
      name: 'Approuvées',
      value: '14',
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8',
    },
    {
      name: 'Rejetées',
      value: '2',
      icon: XCircle,
      color: 'bg-red-500',
      change: '0',
    },
    {
      name: 'Montant total',
      value: '125M FCFA',
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15%',
    },
    {
      name: 'Clients actifs',
      value: '156',
      icon: Users,
      color: 'bg-indigo-500',
      change: '+22',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">
          Bienvenue, {user?.first_name}! Voici un aperçu de vos activités.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Demandes récentes */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Demandes récentes</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                OZ
              </div>
              <div>
                <p className="font-medium text-gray-900">OUEDRAOGO Zenabo</p>
                <p className="text-sm text-gray-600">Demande #PAMF-20250120-0001</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">10 000 000 FCFA</p>
              <span className="badge-warning">En attente</span>
            </div>
          </div>

          <div className="flex items-center justify-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mb-2 opacity-50" />
            <p>Aucune autre demande récente</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
