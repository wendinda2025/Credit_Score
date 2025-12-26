import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/api';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Client non trouvé</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clients" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.displayName}
            </h1>
            <p className="text-sm text-gray-500 font-mono">
              {client.accountNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
            {client.status}
          </span>
          <button className="btn-secondary">
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Informations personnelles</h2>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Type</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {client.clientType === 'INDIVIDUAL' ? 'Individu' : 
                     client.clientType === 'GROUP' ? 'Groupe' : 'Entreprise'}
                  </dd>
                </div>
                {client.firstName && (
                  <>
                    <div>
                      <dt className="text-sm text-gray-500">Prénom</dt>
                      <dd className="text-sm font-medium text-gray-900">{client.firstName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Nom</dt>
                      <dd className="text-sm font-medium text-gray-900">{client.lastName}</dd>
                    </div>
                  </>
                )}
                {client.businessName && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-gray-500">Nom commercial</dt>
                    <dd className="text-sm font-medium text-gray-900">{client.businessName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Téléphone</dt>
                  <dd className="text-sm font-medium text-gray-900">{client.phoneNumber}</dd>
                </div>
                {client.email && (
                  <div>
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="text-sm font-medium text-gray-900">{client.email}</dd>
                  </div>
                )}
                {client.city && (
                  <div>
                    <dt className="text-sm text-gray-500">Ville</dt>
                    <dd className="text-sm font-medium text-gray-900">{client.city}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Agence</dt>
                  <dd className="text-sm font-medium text-gray-900">{client.branch?.name}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Prêts */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-medium">Prêts</h2>
              <Link to={`/loans?clientId=${client.id}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                Voir tout
              </Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Compte</th>
                    <th>Produit</th>
                    <th>Montant</th>
                    <th>Encours</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {client.loans?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">
                        Aucun prêt
                      </td>
                    </tr>
                  ) : (
                    client.loans?.map((loan: any) => (
                      <tr key={loan.id}>
                        <td className="font-mono text-sm">
                          <Link to={`/loans/${loan.id}`} className="text-indigo-600 hover:text-indigo-800">
                            {loan.accountNumber}
                          </Link>
                        </td>
                        <td>{loan.loanProduct?.name}</td>
                        <td>{Number(loan.principalAmount).toLocaleString()} FCFA</td>
                        <td>{Number(loan.totalOutstanding).toLocaleString()} FCFA</td>
                        <td>
                          <span className={`badge ${
                            loan.status === 'ACTIVE' ? 'badge-success' :
                            loan.status === 'CLOSED' ? 'badge-gray' : 'badge-warning'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Actions</h2>
            </div>
            <div className="card-body space-y-3">
              <Link
                to={`/loans/new?clientId=${client.id}`}
                className="btn-primary w-full justify-center"
              >
                Nouveau prêt
              </Link>
              <Link
                to={`/savings/new?clientId=${client.id}`}
                className="btn-secondary w-full justify-center"
              >
                Nouveau compte épargne
              </Link>
            </div>
          </div>

          {/* Comptes épargne */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Comptes épargne</h2>
            </div>
            <div className="card-body">
              {client.savingsAccounts?.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun compte</p>
              ) : (
                <ul className="space-y-3">
                  {client.savingsAccounts?.map((account: any) => (
                    <li key={account.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{account.accountNumber}</p>
                        <p className="text-xs text-gray-500">{account.savingsProduct?.name}</p>
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        {Number(account.accountBalance).toLocaleString()} FCFA
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;
