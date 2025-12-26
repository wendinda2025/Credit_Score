import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { savingsService, clientsService, organizationService } from '../services/api';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <h3 className="text-lg font-medium mb-4">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

const SavingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  
  // Form state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['savings', page, search],
    queryFn: () => savingsService.getAll({ page, limit: 20, search }),
  });

  const { data: products } = useQuery({
    queryKey: ['savingsProducts'],
    queryFn: () => savingsService.getProducts(),
  });

  const { data: paymentTypes } = useQuery({
    queryKey: ['paymentTypes'],
    queryFn: () => organizationService.getPaymentTypes(),
  });

  const { data: clientResults } = useQuery({
    queryKey: ['clientSearch', clientSearch],
    queryFn: () => clientsService.getAll({ search: clientSearch, limit: 10 }),
    enabled: clientSearch.length >= 2,
  });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: (data: any) => savingsService.create(data),
    onSuccess: () => {
      toast.success('Compte épargne créé avec succès');
      setShowNewAccountModal(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => savingsService.deposit(id, data),
    onSuccess: () => {
      toast.success('Dépôt effectué avec succès');
      setShowDepositModal(false);
      resetTransactionForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du dépôt');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => savingsService.withdraw(id, data),
    onSuccess: () => {
      toast.success('Retrait effectué avec succès');
      setShowWithdrawModal(false);
      resetTransactionForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du retrait');
    },
  });

  const resetForm = () => {
    setSelectedClient(null);
    setClientSearch('');
    setSelectedProductId('');
  };

  const resetTransactionForm = () => {
    setTransactionAmount('');
    setPaymentTypeId('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setSelectedAccount(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const handleCreateAccount = () => {
    if (!selectedClient || !selectedProductId) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    createAccountMutation.mutate({
      clientId: selectedClient.id,
      savingsProductId: selectedProductId,
    });
  };

  const handleDeposit = () => {
    if (!selectedAccount || !transactionAmount) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    depositMutation.mutate({
      id: selectedAccount.id,
      data: {
        amount: Number(transactionAmount),
        transactionDate,
        paymentTypeId: paymentTypeId || undefined,
      },
    });
  };

  const handleWithdraw = () => {
    if (!selectedAccount || !transactionAmount) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    withdrawMutation.mutate({
      id: selectedAccount.id,
      data: {
        amount: Number(transactionAmount),
        transactionDate,
        paymentTypeId: paymentTypeId || undefined,
      },
    });
  };

  const openDeposit = (account: any) => {
    setSelectedAccount(account);
    setShowDepositModal(true);
  };

  const openWithdraw = (account: any) => {
    setSelectedAccount(account);
    setShowWithdrawModal(true);
  };

  const openDetail = async (account: any) => {
    try {
      const details = await savingsService.getById(account.id);
      setSelectedAccount(details);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Épargne</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestion des comptes d'épargne
          </p>
        </div>
        <button
          onClick={() => setShowNewAccountModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau compte
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro de compte, nom du client..."
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
                <th>Client</th>
                <th>Produit</th>
                <th>Solde</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full" />
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Aucun compte d'épargne
                  </td>
                </tr>
              ) : (
                data?.items?.map((account: any) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="font-mono text-sm">{account.accountNumber}</td>
                    <td>
                      <div>
                        <p className="font-medium">
                          {account.client?.displayName || 
                           `${account.client?.firstName} ${account.client?.lastName}`}
                        </p>
                        <p className="text-xs text-gray-500">{account.client?.accountNumber}</p>
                      </div>
                    </td>
                    <td>{account.savingsProduct?.name}</td>
                    <td className="font-medium text-green-600">
                      {formatCurrency(Number(account.accountBalance || 0))}
                    </td>
                    <td>
                      <span className={`badge ${
                        account.status === 'ACTIVE' ? 'badge-success' :
                        account.status === 'PENDING' ? 'badge-warning' : 'badge-gray'
                      }`}>
                        {account.status === 'ACTIVE' ? 'Actif' :
                         account.status === 'PENDING' ? 'En attente' : account.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(account)}
                          className="p-1 text-gray-500 hover:text-indigo-600"
                          title="Voir détails"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {account.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => openDeposit(account)}
                              className="p-1 text-green-500 hover:text-green-700"
                              title="Dépôt"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openWithdraw(account)}
                              className="p-1 text-orange-500 hover:text-orange-700"
                              title="Retrait"
                            >
                              <ArrowUpTrayIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
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
              Page {data.meta.currentPage} sur {data.meta.totalPages} ({data.meta.totalItems} comptes)
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

      {/* Modal Nouveau compte */}
      <Modal
        isOpen={showNewAccountModal}
        onClose={() => { setShowNewAccountModal(false); resetForm(); }}
        title="Nouveau compte d'épargne"
      >
        <div className="space-y-4">
          {/* Recherche client */}
          <div>
            <label className="label">Client *</label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">
                    {selectedClient.displayName || `${selectedClient.firstName} ${selectedClient.lastName}`}
                  </p>
                  <p className="text-sm text-green-700">{selectedClient.accountNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="input"
                />
                {clientResults?.items && clientResults.items.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {clientResults.items.map((client: any) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setSelectedClient(client);
                          setClientSearch('');
                        }}
                        className="w-full p-2 text-left hover:bg-gray-50 text-sm"
                      >
                        <p className="font-medium">{client.displayName}</p>
                        <p className="text-gray-500">{client.accountNumber}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Produit */}
          <div>
            <label className="label">Produit d'épargne *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="input"
            >
              <option value="">Sélectionner un produit</option>
              {products?.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.interestRate}% p.a.)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setShowNewAccountModal(false); resetForm(); }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateAccount}
              disabled={createAccountMutation.isPending || !selectedClient || !selectedProductId}
              className="btn-primary"
            >
              {createAccountMutation.isPending ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Dépôt */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => { setShowDepositModal(false); resetTransactionForm(); }}
        title="Effectuer un dépôt"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600">Compte: {selectedAccount?.accountNumber}</p>
            <p className="text-lg font-bold text-blue-800">
              Solde actuel: {formatCurrency(Number(selectedAccount?.accountBalance || 0))}
            </p>
          </div>

          <div>
            <label className="label">Montant (FCFA) *</label>
            <input
              type="number"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              className="input"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Date de transaction</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
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

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setShowDepositModal(false); resetTransactionForm(); }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleDeposit}
              disabled={depositMutation.isPending || !transactionAmount}
              className="btn-primary bg-green-600 hover:bg-green-700"
            >
              {depositMutation.isPending ? 'Traitement...' : 'Confirmer le dépôt'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Retrait */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => { setShowWithdrawModal(false); resetTransactionForm(); }}
        title="Effectuer un retrait"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-orange-600">Compte: {selectedAccount?.accountNumber}</p>
            <p className="text-lg font-bold text-orange-800">
              Solde disponible: {formatCurrency(Number(selectedAccount?.accountBalance || 0))}
            </p>
          </div>

          <div>
            <label className="label">Montant (FCFA) *</label>
            <input
              type="number"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              className="input"
              placeholder="0"
              min="0"
              max={selectedAccount?.accountBalance}
            />
          </div>

          <div>
            <label className="label">Date de transaction</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
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

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setShowWithdrawModal(false); resetTransactionForm(); }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending || !transactionAmount}
              className="btn-primary bg-orange-600 hover:bg-orange-700"
            >
              {withdrawMutation.isPending ? 'Traitement...' : 'Confirmer le retrait'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedAccount(null); }}
        title={`Compte ${selectedAccount?.accountNumber}`}
      >
        {selectedAccount && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">
                  {selectedAccount.client?.displayName || 
                   `${selectedAccount.client?.firstName} ${selectedAccount.client?.lastName}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Produit</p>
                <p className="font-medium">{selectedAccount.savingsProduct?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Taux d'intérêt</p>
                <p className="font-medium">{selectedAccount.savingsProduct?.interestRate || 0}% p.a.</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <span className={`badge ${selectedAccount.status === 'ACTIVE' ? 'badge-success' : 'badge-gray'}`}>
                  {selectedAccount.status}
                </span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-600">Solde actuel</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(Number(selectedAccount.accountBalance || 0))}
              </p>
            </div>

            {/* Dernières transactions */}
            {selectedAccount.transactions?.length > 0 && (
              <div>
                <p className="font-medium mb-2">Dernières transactions</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedAccount.transactions.slice(0, 10).map((txn: any) => (
                    <div key={txn.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                      <div>
                        <span className={txn.transactionType === 'DEPOSIT' ? 'text-green-600' : 'text-orange-600'}>
                          {txn.transactionType === 'DEPOSIT' ? 'Dépôt' : 'Retrait'}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(txn.transactionDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`font-medium ${txn.transactionType === 'DEPOSIT' ? 'text-green-600' : 'text-orange-600'}`}>
                        {txn.transactionType === 'DEPOSIT' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedAccount(null); }}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SavingsPage;
