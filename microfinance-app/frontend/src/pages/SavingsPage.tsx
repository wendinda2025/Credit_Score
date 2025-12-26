import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { savingsService } from '../services/api';

const SavingsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['savings'],
    queryFn: () => savingsService.getAll({ page: 1, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Épargne</h1>
      
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>N° Compte</th>
                <th>Client</th>
                <th>Produit</th>
                <th>Solde</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">Chargement...</td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Aucun compte d'épargne
                  </td>
                </tr>
              ) : (
                data?.items?.map((account: any) => (
                  <tr key={account.id}>
                    <td className="font-mono">{account.accountNumber}</td>
                    <td>{account.client?.firstName} {account.client?.lastName}</td>
                    <td>{account.savingsProduct?.name}</td>
                    <td className="font-medium text-green-600">
                      {Number(account.accountBalance).toLocaleString()} FCFA
                    </td>
                    <td>
                      <span className={`badge ${
                        account.status === 'ACTIVE' ? 'badge-success' : 'badge-gray'
                      }`}>
                        {account.status}
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
  );
};

export default SavingsPage;
