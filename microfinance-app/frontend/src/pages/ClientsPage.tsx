import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientsService } from '../services/api';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ClientsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => clientsService.getAll({ page, limit: 20, search }),
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: 'badge-success',
      PENDING: 'badge-warning',
      SUSPENDED: 'badge-danger',
      CLOSED: 'badge-gray',
    };
    return badges[status] || 'badge-gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les clients de votre institution
          </p>
        </div>
        <Link to="/clients/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau client
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, numéro de compte, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
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
                <th>Nom</th>
                <th>Type</th>
                <th>Téléphone</th>
                <th>Agence</th>
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
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                data?.items?.map((client: any) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="font-mono text-sm">{client.accountNumber}</td>
                    <td className="font-medium">{client.displayName}</td>
                    <td>
                      <span className="badge-info">
                        {client.clientType === 'INDIVIDUAL' ? 'Individu' : 
                         client.clientType === 'GROUP' ? 'Groupe' : 'Entreprise'}
                      </span>
                    </td>
                    <td>{client.phoneNumber}</td>
                    <td>{client.branchName}</td>
                    <td>
                      <span className={getStatusBadge(client.status)}>
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {data.meta.currentPage} sur {data.meta.totalPages} ({data.meta.totalItems} résultats)
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

export default ClientsPage;
