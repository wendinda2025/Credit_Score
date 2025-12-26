import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/api';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  TableCellsIcon,
  CalendarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'par' | 'production' | 'collections'>('par');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });
  const [parDate, setParDate] = useState(new Date().toISOString().split('T')[0]);

  // Queries
  const { data: parData, isLoading: parLoading } = useQuery({
    queryKey: ['par', parDate],
    queryFn: () => reportsService.getPAR(parDate),
    enabled: activeTab === 'par',
  });

  const { data: productionData, isLoading: productionLoading } = useQuery({
    queryKey: ['production', dateRange.fromDate, dateRange.toDate],
    queryFn: () => reportsService.getLoanProduction(dateRange.fromDate, dateRange.toDate),
    enabled: activeTab === 'production',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
  };

  const formatPercent = (value: number) => {
    return (value || 0).toFixed(2) + '%';
  };

  const tabs = [
    { id: 'par', name: 'Portfolio At Risk', icon: ChartBarIcon },
    { id: 'production', name: 'Production de prêts', icon: TableCellsIcon },
    { id: 'collections', name: 'Collections', icon: DocumentTextIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tableaux de bord et indicateurs de performance
          </p>
        </div>
        <button className="btn-secondary">
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Exporter
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* PAR Report */}
      {activeTab === 'par' && (
        <div className="space-y-6">
          {/* Date selector */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Date du rapport:</label>
                <input
                  type="date"
                  value={parDate}
                  onChange={(e) => setParDate(e.target.value)}
                  className="input w-auto"
                />
              </div>
            </div>
          </div>

          {parLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-sm text-gray-500">Portefeuille total</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(parData?.totalPortfolio || 0)}
                    </p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-sm text-gray-500">PAR &gt; 1 jour</p>
                    <p className={`text-xl font-bold ${(parData?.par1 || 0) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercent(parData?.par1)}
                    </p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-sm text-gray-500">PAR &gt; 30 jours</p>
                    <p className={`text-xl font-bold ${(parData?.par30 || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercent(parData?.par30)}
                    </p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-sm text-gray-500">PAR &gt; 90 jours</p>
                    <p className={`text-xl font-bold ${(parData?.par90 || 0) > 2 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercent(parData?.par90)}
                    </p>
                  </div>
                </div>
              </div>

              {/* PAR Table */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-medium">Détail par tranche de retard</h2>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tranche de retard</th>
                        <th>Nombre de prêts</th>
                        <th>Encours à risque</th>
                        <th>% du portefeuille</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      <tr>
                        <td>À jour (0 jour)</td>
                        <td>{parData?.buckets?.current?.count || 0}</td>
                        <td>{formatCurrency(parData?.buckets?.current?.amount || 0)}</td>
                        <td className="text-green-600">{formatPercent(parData?.buckets?.current?.percentage)}</td>
                      </tr>
                      <tr>
                        <td>1-30 jours</td>
                        <td>{parData?.buckets?.days1_30?.count || 0}</td>
                        <td>{formatCurrency(parData?.buckets?.days1_30?.amount || 0)}</td>
                        <td className="text-yellow-600">{formatPercent(parData?.buckets?.days1_30?.percentage)}</td>
                      </tr>
                      <tr>
                        <td>31-60 jours</td>
                        <td>{parData?.buckets?.days31_60?.count || 0}</td>
                        <td>{formatCurrency(parData?.buckets?.days31_60?.amount || 0)}</td>
                        <td className="text-orange-600">{formatPercent(parData?.buckets?.days31_60?.percentage)}</td>
                      </tr>
                      <tr>
                        <td>61-90 jours</td>
                        <td>{parData?.buckets?.days61_90?.count || 0}</td>
                        <td>{formatCurrency(parData?.buckets?.days61_90?.amount || 0)}</td>
                        <td className="text-red-500">{formatPercent(parData?.buckets?.days61_90?.percentage)}</td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="font-medium">&gt; 90 jours</td>
                        <td>{parData?.buckets?.days90Plus?.count || 0}</td>
                        <td>{formatCurrency(parData?.buckets?.days90Plus?.amount || 0)}</td>
                        <td className="text-red-600 font-medium">{formatPercent(parData?.buckets?.days90Plus?.percentage)}</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="font-bold">Total</td>
                        <td className="font-bold">{parData?.totalLoans || 0}</td>
                        <td className="font-bold">{formatCurrency(parData?.totalPortfolio || 0)}</td>
                        <td className="font-bold">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Production Report */}
      {activeTab === 'production' && (
        <div className="space-y-6">
          {/* Date range selector */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-wrap items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Période:</label>
                <input
                  type="date"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
                  className="input w-auto"
                />
                <span className="text-gray-500">à</span>
                <input
                  type="date"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                  className="input w-auto"
                />
              </div>
            </div>
          </div>

          {productionLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-sm text-gray-500">Nombre de prêts décaissés</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {productionData?.totalCount || 0}
                    </p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-sm text-gray-500">Montant total décaissé</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(productionData?.totalAmount || 0)}
                    </p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-sm text-gray-500">Montant moyen</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(productionData?.averageAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* By Product */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-medium">Production par produit</h2>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Nombre</th>
                        <th>Montant</th>
                        <th>% du total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {productionData?.byProduct?.length > 0 ? (
                        productionData.byProduct.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="font-medium">{item.productName || 'N/A'}</td>
                            <td>{item.count || 0}</td>
                            <td>{formatCurrency(item.amount || 0)}</td>
                            <td>{formatPercent((item.amount / productionData.totalAmount) * 100)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-500">
                            Aucune donnée pour cette période
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Collections Report */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          {/* Date range selector */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-wrap items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Période:</label>
                <input
                  type="date"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
                  className="input w-auto"
                />
                <span className="text-gray-500">à</span>
                <input
                  type="date"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                  className="input w-auto"
                />
              </div>
            </div>
          </div>

          {/* Collections Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Attendu</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(0)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Collecté</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(0)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Taux de recouvrement</p>
                <p className="text-xl font-bold text-indigo-600">
                  {formatPercent(100)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Arriérés</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(0)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center py-12 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Les données de collections seront affichées ici</p>
              <p className="text-sm">Effectuez des remboursements pour voir les statistiques</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
