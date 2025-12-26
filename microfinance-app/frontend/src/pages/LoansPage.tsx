import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { loansService } from '../services/api';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const LoansPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['loans', page, search, status],
    queryFn: () => loansService.getAll({ page, limit: 20, search, status: status || undefined }),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      PENDING_APPROVAL: { class: 'badge-warning', label: 'En attente' },
      APPROVED: { class: 'badge-info', label: 'Approuvé' },
      ACTIVE: { class: 'badge-success', label: 'Actif' },
      CLOSED: { class: 'badge-gray', label: 'Clôturé' },
      REJECTED: { class: 'badge-danger', label: 'Rejeté' },
    };
    return badges[status] || { class: 'badge-gray', label: status };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prêts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestion des demandes et prêts actifs
          </p>
        </div>
        <Link to="/loans/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau prêt
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input pl-10 pr-8"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING_APPROVAL">En attente</option>
                <option value="APPROVED">Approuvés</option>
                <option value="ACTIVE">Actifs</option>
                <option value="CLOSED">Clôturés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>N° Compte</th>
                <th>Client</th>
                <th>Produit</th>
                <th>Montant</th>
                <th>Encours</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full" />
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Aucun prêt trouvé
                  </td>
                </tr>
              ) : (
                data?.items?.map((loan: any) => {
                  const statusInfo = getStatusBadge(loan.status);
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="font-mono text-sm">{loan.accountNumber}</td>
                      <td>
                        <div>
                          <p className="font-medium">
                            {loan.client?.firstName} {loan.client?.lastName}
                            {loan.client?.businessName}
                          </p>
                          <p className="text-xs text-gray-500">{loan.client?.accountNumber}</p>
                        </div>
                      </td>
                      <td>{loan.loanProduct?.name}</td>
                      <td>{formatCurrency(Number(loan.principalAmount))}</td>
                      <td className={Number(loan.totalOutstanding) > 0 ? 'text-orange-600 font-medium' : ''}>
                        {formatCurrency(Number(loan.totalOutstanding))}
                      </td>
                      <td>
                        <span className={statusInfo.class}>{statusInfo.label}</span>
                      </td>
                      <td>
                        <Link
                          to={`/loans/${loan.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {data.meta.currentPage} sur {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!data.meta.hasPrevPage}
                className="btn-secondary"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data.meta.hasNextPage}
                className="btn-secondary"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansPage;
