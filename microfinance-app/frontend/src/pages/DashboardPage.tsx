import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/api';
import {
  UsersIcon,
  BanknotesIcon,
  WalletIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}> = ({ title, value, subtitle, icon, trend, trendValue, color }) => (
  <div className="card">
    <div className="card-body">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-5 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && trendValue && (
              <span
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value) + ' FCFA';
};

const DashboardPage: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsService.getDashboard(),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble de l'activité de microfinance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Clients actifs"
          value={metrics?.clients?.active || 0}
          subtitle={`${metrics?.clients?.newThisMonth || 0} ce mois`}
          icon={<UsersIcon className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        
        <StatCard
          title="Prêts actifs"
          value={metrics?.loans?.activeLoans || 0}
          subtitle={`${metrics?.loans?.pendingApproval || 0} en attente`}
          icon={<BanknotesIcon className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />

        <StatCard
          title="Encours total"
          value={formatCurrency(metrics?.loans?.totalOutstanding || 0)}
          icon={<WalletIcon className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />

        <StatCard
          title="Prêts en retard"
          value={metrics?.loans?.inArrears || 0}
          subtitle={`PAR30: ${metrics?.performance?.par30?.toFixed(1) || 0}%`}
          icon={<ExclamationTriangleIcon className="h-6 w-6 text-white" />}
          color="bg-red-500"
        />
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Performance Indicators */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">
              Indicateurs de performance
            </h2>
          </div>
          <div className="card-body">
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Taux de remboursement</dt>
                <dd className="text-sm font-medium text-gray-900">
                  <span
                    className={`px-2 py-1 rounded ${
                      (metrics?.performance?.repaymentRate || 0) >= 95
                        ? 'bg-green-100 text-green-800'
                        : (metrics?.performance?.repaymentRate || 0) >= 85
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metrics?.performance?.repaymentRate?.toFixed(1) || 0}%
                  </span>
                </dd>
              </div>
              
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">PAR &gt; 30 jours</dt>
                <dd className="text-sm font-medium text-gray-900">
                  <span
                    className={`px-2 py-1 rounded ${
                      (metrics?.performance?.par30 || 0) <= 5
                        ? 'bg-green-100 text-green-800'
                        : (metrics?.performance?.par30 || 0) <= 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metrics?.performance?.par30?.toFixed(2) || 0}%
                  </span>
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">PAR &gt; 90 jours</dt>
                <dd className="text-sm font-medium text-gray-900">
                  <span
                    className={`px-2 py-1 rounded ${
                      (metrics?.performance?.par90 || 0) <= 2
                        ? 'bg-green-100 text-green-800'
                        : (metrics?.performance?.par90 || 0) <= 5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metrics?.performance?.par90?.toFixed(2) || 0}%
                  </span>
                </dd>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Décaissements ce mois</dt>
                  <dd className="text-sm font-medium text-green-600">
                    {formatCurrency(metrics?.performance?.disbursementThisMonth || 0)}
                  </dd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Collections ce mois</dt>
                <dd className="text-sm font-medium text-blue-600">
                  {formatCurrency(metrics?.performance?.collectionsThisMonth || 0)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Savings Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">
              Épargne
            </h2>
          </div>
          <div className="card-body">
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Comptes actifs</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {metrics?.savings?.activeAccounts || 0}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Total des dépôts</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(metrics?.savings?.totalDeposits || 0)}
                </dd>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <dt className="text-sm font-medium text-gray-900">Solde total</dt>
                <dd className="text-xl font-bold text-indigo-600">
                  {formatCurrency(metrics?.savings?.totalBalance || 0)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Actions rapides</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a
              href="/clients?action=new"
              className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-blue-500" />
              <span className="mt-2 text-sm font-medium text-gray-900">
                Nouveau client
              </span>
            </a>
            
            <a
              href="/loans?action=new"
              className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <BanknotesIcon className="h-8 w-8 text-green-500" />
              <span className="mt-2 text-sm font-medium text-gray-900">
                Nouveau prêt
              </span>
            </a>

            <a
              href="/loans?status=PENDING_APPROVAL"
              className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
              <span className="mt-2 text-sm font-medium text-gray-900">
                Prêts à approuver
              </span>
            </a>

            <a
              href="/reports"
              className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <WalletIcon className="h-8 w-8 text-purple-500" />
              <span className="mt-2 text-sm font-medium text-gray-900">
                Rapports
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
