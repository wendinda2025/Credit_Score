import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { loansService } from '../services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const LoanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loansService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!loan) {
    return <div>Prêt non trouvé</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/loans" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Prêt {loan.accountNumber}</h1>
          <p className="text-sm text-gray-500">
            {loan.client?.firstName} {loan.client?.lastName} {loan.client?.businessName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Détails du prêt */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Détails du prêt</h2>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Produit</dt>
                  <dd className="font-medium">{loan.loanProduct?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Statut</dt>
                  <dd>
                    <span className={`badge ${
                      loan.status === 'ACTIVE' ? 'badge-success' :
                      loan.status === 'PENDING_APPROVAL' ? 'badge-warning' : 'badge-gray'
                    }`}>
                      {loan.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Montant décaissé</dt>
                  <dd className="font-medium">{formatCurrency(Number(loan.disbursedAmount))}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Encours</dt>
                  <dd className="font-medium text-orange-600">{formatCurrency(Number(loan.totalOutstanding))}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Taux d'intérêt</dt>
                  <dd className="font-medium">{loan.interestRate}%</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Échéances</dt>
                  <dd className="font-medium">{loan.numberOfRepayments}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Calendrier */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Calendrier de remboursement</h2>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Principal</th>
                    <th>Intérêts</th>
                    <th>Total dû</th>
                    <th>Payé</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loan.schedule?.map((installment: any) => (
                    <tr key={installment.id} className={installment.isOverdue ? 'bg-red-50' : ''}>
                      <td>{installment.installmentNumber}</td>
                      <td>{new Date(installment.dueDate).toLocaleDateString('fr-FR')}</td>
                      <td>{formatCurrency(Number(installment.principalDue))}</td>
                      <td>{formatCurrency(Number(installment.interestDue))}</td>
                      <td className="font-medium">{formatCurrency(Number(installment.totalDue))}</td>
                      <td className="text-green-600">{formatCurrency(Number(installment.totalPaid))}</td>
                      <td>
                        {installment.isPaid ? (
                          <span className="badge-success">Payé</span>
                        ) : installment.isOverdue ? (
                          <span className="badge-danger">En retard</span>
                        ) : (
                          <span className="badge-gray">À payer</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Actions</h2>
            </div>
            <div className="card-body space-y-3">
              {loan.status === 'PENDING_APPROVAL' && (
                <>
                  <button className="btn-success w-full justify-center">
                    Approuver
                  </button>
                  <button className="btn-danger w-full justify-center">
                    Rejeter
                  </button>
                </>
              )}
              {loan.status === 'APPROVED' && (
                <button className="btn-primary w-full justify-center">
                  Décaisser
                </button>
              )}
              {loan.status === 'ACTIVE' && (
                <button className="btn-primary w-full justify-center">
                  Enregistrer remboursement
                </button>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Transactions</h2>
            </div>
            <div className="card-body">
              {loan.transactions?.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune transaction</p>
              ) : (
                <ul className="space-y-3">
                  {loan.transactions?.slice(0, 5).map((txn: any) => (
                    <li key={txn.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{txn.transactionType}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(txn.transactionDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(Number(txn.amount))}</p>
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

export default LoanDetailPage;
