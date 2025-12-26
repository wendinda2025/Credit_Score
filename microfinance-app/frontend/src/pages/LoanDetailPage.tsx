import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansService, organizationService } from '../services/api';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, BanknotesIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-medium mb-4">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

const LoanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDate, setRepaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: loan, isLoading, refetch } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loansService.getById(id!),
    enabled: !!id,
  });

  const { data: paymentTypes } = useQuery({
    queryKey: ['paymentTypes'],
    queryFn: () => organizationService.getPaymentTypes(),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => loansService.approve(id!),
    onSuccess: () => {
      toast.success('Prêt approuvé avec succès');
      setShowApproveModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'approbation');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => loansService.reject(id!, reason),
    onSuccess: () => {
      toast.success('Prêt rejeté');
      setShowRejectModal(false);
      navigate('/loans');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du rejet');
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (data: any) => loansService.disburse(id!, data),
    onSuccess: () => {
      toast.success('Prêt décaissé avec succès');
      setShowDisburseModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du décaissement');
    },
  });

  const repaymentMutation = useMutation({
    mutationFn: (data: any) => loansService.makeRepayment(id!, data),
    onSuccess: () => {
      toast.success('Remboursement enregistré avec succès');
      setShowRepaymentModal(false);
      setRepaymentAmount('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du remboursement');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Prêt non trouvé</p>
        <Link to="/loans" className="text-indigo-600 hover:underline mt-2 inline-block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      PENDING_APPROVAL: { class: 'bg-yellow-100 text-yellow-800', label: 'En attente d\'approbation' },
      APPROVED: { class: 'bg-blue-100 text-blue-800', label: 'Approuvé' },
      ACTIVE: { class: 'bg-green-100 text-green-800', label: 'Actif' },
      CLOSED: { class: 'bg-gray-100 text-gray-800', label: 'Clôturé' },
      REJECTED: { class: 'bg-red-100 text-red-800', label: 'Rejeté' },
      WRITTEN_OFF: { class: 'bg-red-100 text-red-800', label: 'Passé en perte' },
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status };
  };

  const statusInfo = getStatusBadge(loan.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/loans" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Prêt {loan.accountNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Client: {loan.client?.displayName || `${loan.client?.firstName} ${loan.client?.lastName}`}
              {' • '} Produit: {loan.loanProduct?.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Résumé financier */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Montant principal</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(Number(loan.principalAmount))}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Décaissé</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(Number(loan.disbursedAmount || 0))}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Encours</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(Number(loan.totalOutstanding || 0))}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-sm text-gray-500">Total remboursé</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(Number(loan.totalRepaid || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Détails du prêt */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Détails du prêt</h2>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <dt className="text-sm text-gray-500">Produit</dt>
                  <dd className="font-medium">{loan.loanProduct?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Taux d'intérêt</dt>
                  <dd className="font-medium">{loan.interestRate}% / {loan.interestPeriod}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Méthode de calcul</dt>
                  <dd className="font-medium">{loan.amortizationType || 'Standard'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Nombre d'échéances</dt>
                  <dd className="font-medium">{loan.numberOfRepayments}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Fréquence</dt>
                  <dd className="font-medium">
                    Chaque {loan.repaymentEvery} {loan.repaymentFrequency === 'MONTHS' ? 'mois' : 
                      loan.repaymentFrequency === 'WEEKS' ? 'semaine(s)' : 'jour(s)'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date de décaissement</dt>
                  <dd className="font-medium">
                    {loan.disbursedOn ? new Date(loan.disbursedOn).toLocaleDateString('fr-FR') : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Première échéance</dt>
                  <dd className="font-medium">
                    {loan.expectedFirstRepaymentDate ? 
                      new Date(loan.expectedFirstRepaymentDate).toLocaleDateString('fr-FR') : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date de maturité</dt>
                  <dd className="font-medium">
                    {loan.expectedMaturityDate ? 
                      new Date(loan.expectedMaturityDate).toLocaleDateString('fr-FR') : '-'}
                  </dd>
                </div>
                {loan.loanPurpose && (
                  <div className="col-span-full">
                    <dt className="text-sm text-gray-500">Objet du prêt</dt>
                    <dd className="font-medium">{loan.loanPurpose}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Calendrier de remboursement */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Calendrier de remboursement</h2>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Date d'échéance</th>
                    <th>Principal</th>
                    <th>Intérêts</th>
                    <th>Total dû</th>
                    <th>Payé</th>
                    <th>Solde</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loan.schedule?.length > 0 ? (
                    loan.schedule.map((installment: any) => {
                      const isOverdue = !installment.isPaid && new Date(installment.dueDate) < new Date();
                      return (
                        <tr key={installment.id} className={isOverdue ? 'bg-red-50' : ''}>
                          <td>{installment.installmentNumber}</td>
                          <td>{new Date(installment.dueDate).toLocaleDateString('fr-FR')}</td>
                          <td>{formatCurrency(Number(installment.principalDue))}</td>
                          <td>{formatCurrency(Number(installment.interestDue))}</td>
                          <td className="font-medium">{formatCurrency(Number(installment.totalDue))}</td>
                          <td className="text-green-600">{formatCurrency(Number(installment.totalPaid || 0))}</td>
                          <td>{formatCurrency(Number(installment.principalBalance || 0))}</td>
                          <td>
                            {installment.isPaid ? (
                              <span className="badge-success">Payé</span>
                            ) : isOverdue ? (
                              <span className="badge-danger">En retard</span>
                            ) : (
                              <span className="badge-warning">À payer</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        L'échéancier sera généré après le décaissement
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Historique des transactions</h2>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Principal</th>
                    <th>Intérêts</th>
                    <th>Pénalités</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loan.transactions?.length > 0 ? (
                    loan.transactions.map((txn: any) => (
                      <tr key={txn.id}>
                        <td>{new Date(txn.transactionDate).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <span className={`badge ${
                            txn.transactionType === 'DISBURSEMENT' ? 'badge-info' :
                            txn.transactionType === 'REPAYMENT' ? 'badge-success' : 'badge-gray'
                          }`}>
                            {txn.transactionType === 'DISBURSEMENT' ? 'Décaissement' :
                             txn.transactionType === 'REPAYMENT' ? 'Remboursement' : txn.transactionType}
                          </span>
                        </td>
                        <td className="font-medium">{formatCurrency(Number(txn.amount))}</td>
                        <td>{formatCurrency(Number(txn.principalPortion || 0))}</td>
                        <td>{formatCurrency(Number(txn.interestPortion || 0))}</td>
                        <td>{formatCurrency(Number(txn.penaltyPortion || 0))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Aucune transaction
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Colonne Actions */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Actions</h2>
            </div>
            <div className="card-body space-y-3">
              {loan.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckIcon className="h-5 w-5" />
                    Approuver
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    Rejeter
                  </button>
                </>
              )}
              {loan.status === 'APPROVED' && (
                <button
                  onClick={() => setShowDisburseModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <BanknotesIcon className="h-5 w-5" />
                  Décaisser
                </button>
              )}
              {loan.status === 'ACTIVE' && (
                <button
                  onClick={() => setShowRepaymentModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <CurrencyDollarIcon className="h-5 w-5" />
                  Enregistrer remboursement
                </button>
              )}
              {loan.status === 'CLOSED' && (
                <p className="text-center text-gray-500 py-4">
                  Ce prêt est clôturé
                </p>
              )}
            </div>
          </div>

          {/* Info Client */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Client</h2>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xl font-medium text-indigo-600">
                    {(loan.client?.firstName?.[0] || loan.client?.businessName?.[0] || '?').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {loan.client?.displayName || `${loan.client?.firstName} ${loan.client?.lastName}`}
                  </p>
                  <p className="text-sm text-gray-500">{loan.client?.accountNumber}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="text-gray-500">Téléphone:</span> {loan.client?.phoneNumber}</p>
                {loan.client?.email && (
                  <p><span className="text-gray-500">Email:</span> {loan.client?.email}</p>
                )}
              </div>
              <Link
                to={`/clients/${loan.client?.id}`}
                className="mt-4 block text-center text-indigo-600 hover:underline text-sm"
              >
                Voir le profil complet
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Approuver */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approuver le prêt"
      >
        <p className="text-gray-600 mb-4">
          Êtes-vous sûr de vouloir approuver ce prêt de {formatCurrency(Number(loan.principalAmount))} ?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowApproveModal(false)} className="btn-secondary">
            Annuler
          </button>
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="btn-primary bg-green-600 hover:bg-green-700"
          >
            {approveMutation.isPending ? 'Approbation...' : 'Confirmer l\'approbation'}
          </button>
        </div>
      </Modal>

      {/* Modal Rejeter */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Rejeter le prêt"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Motif du rejet *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input"
              rows={3}
              placeholder="Indiquez la raison du rejet..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowRejectModal(false)} className="btn-secondary">
              Annuler
            </button>
            <button
              onClick={() => rejectMutation.mutate(rejectReason)}
              disabled={!rejectReason || rejectMutation.isPending}
              className="btn-danger"
            >
              {rejectMutation.isPending ? 'Rejet...' : 'Confirmer le rejet'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Décaisser */}
      <Modal
        isOpen={showDisburseModal}
        onClose={() => setShowDisburseModal(false)}
        title="Décaisser le prêt"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Date de décaissement</label>
            <input
              type="date"
              value={disbursementDate}
              onChange={(e) => setDisbursementDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Mode de paiement</label>
            <select
              value={paymentTypeId}
              onChange={(e) => setPaymentTypeId(e.target.value)}
              className="input"
            >
              <option value="">Sélectionner</option>
              {paymentTypes?.map((pt: any) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Montant à décaisser</p>
            <p className="text-xl font-bold">{formatCurrency(Number(loan.principalAmount))}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDisburseModal(false)} className="btn-secondary">
              Annuler
            </button>
            <button
              onClick={() => disburseMutation.mutate({
                disbursementDate,
                paymentTypeId: paymentTypeId || undefined,
              })}
              disabled={disburseMutation.isPending}
              className="btn-primary"
            >
              {disburseMutation.isPending ? 'Décaissement...' : 'Confirmer le décaissement'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Remboursement */}
      <Modal
        isOpen={showRepaymentModal}
        onClose={() => setShowRepaymentModal(false)}
        title="Enregistrer un remboursement"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Date du remboursement</label>
            <input
              type="date"
              value={repaymentDate}
              onChange={(e) => setRepaymentDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Montant (FCFA)</label>
            <input
              type="number"
              value={repaymentAmount}
              onChange={(e) => setRepaymentAmount(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Mode de paiement</label>
            <select
              value={paymentTypeId}
              onChange={(e) => setPaymentTypeId(e.target.value)}
              className="input"
            >
              <option value="">Sélectionner</option>
              {paymentTypes?.map((pt: any) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600">Encours actuel: {formatCurrency(Number(loan.totalOutstanding || 0))}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowRepaymentModal(false)} className="btn-secondary">
              Annuler
            </button>
            <button
              onClick={() => repaymentMutation.mutate({
                transactionDate: repaymentDate,
                amount: Number(repaymentAmount),
                paymentTypeId: paymentTypeId || undefined,
              })}
              disabled={!repaymentAmount || repaymentMutation.isPending}
              className="btn-primary"
            >
              {repaymentMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoanDetailPage;
