import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { loansService, clientsService } from '../services/api';
import { ArrowLeftIcon, MagnifyingGlassIcon, CalculatorIcon } from '@heroicons/react/24/outline';

interface LoanForm {
  clientId: string;
  loanProductId: string;
  principalAmount: number;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequency: 'DAYS' | 'WEEKS' | 'MONTHS';
  interestRate: number;
  expectedDisbursementDate: string;
  submittedOnDate: string;
  loanPurpose?: string;
}

const NewLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientSearch, setShowClientSearch] = useState(!preselectedClientId);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LoanForm>({
    defaultValues: {
      repaymentEvery: 1,
      repaymentFrequency: 'MONTHS',
      submittedOnDate: new Date().toISOString().split('T')[0],
      expectedDisbursementDate: new Date().toISOString().split('T')[0],
    }
  });

  // Charger les produits de prêt
  const { data: products } = useQuery({
    queryKey: ['loanProducts'],
    queryFn: () => loansService.getProducts(),
  });

  // Recherche de clients
  const { data: clientsResults } = useQuery({
    queryKey: ['clientSearch', clientSearch],
    queryFn: () => clientsService.getAll({ search: clientSearch, limit: 10 }),
    enabled: clientSearch.length >= 2,
  });

  // Charger le client présélectionné
  useEffect(() => {
    if (preselectedClientId) {
      clientsService.getById(preselectedClientId).then((client) => {
        setSelectedClient(client);
        setValue('clientId', client.id);
      });
    }
  }, [preselectedClientId, setValue]);

  // Quand un produit est sélectionné, pré-remplir les champs
  const selectedProductId = watch('loanProductId');
  useEffect(() => {
    if (selectedProductId && products) {
      const product = products.find((p: any) => p.id === selectedProductId);
      if (product) {
        setValue('interestRate', Number(product.interestRatePerPeriod));
        setValue('numberOfRepayments', product.numberOfRepayments);
        setValue('repaymentFrequency', product.repaymentFrequencyType);
      }
    }
  }, [selectedProductId, products, setValue]);

  const watchedValues = watch();

  // Mutation pour calculer l'échéancier
  const previewMutation = useMutation({
    mutationFn: (data: any) => loansService.previewSchedule(data),
    onSuccess: (data) => {
      setSchedule(data.schedule || []);
      setShowSchedule(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du calcul');
    },
  });

  // Mutation pour créer le prêt
  const createMutation = useMutation({
    mutationFn: (data: LoanForm) => loansService.create(data),
    onSuccess: (data) => {
      toast.success('Demande de prêt créée avec succès');
      navigate(`/loans/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const handlePreviewSchedule = () => {
    if (!selectedClient || !watchedValues.loanProductId || !watchedValues.principalAmount) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }
    previewMutation.mutate({
      loanProductId: watchedValues.loanProductId,
      principalAmount: watchedValues.principalAmount,
      numberOfRepayments: watchedValues.numberOfRepayments,
      interestRate: watchedValues.interestRate,
      expectedDisbursementDate: watchedValues.expectedDisbursementDate,
      repaymentEvery: watchedValues.repaymentEvery,
      repaymentFrequency: watchedValues.repaymentFrequency,
    });
  };

  const onSubmit = (data: LoanForm) => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    createMutation.mutate({ ...data, clientId: selectedClient.id });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const selectClient = (client: any) => {
    setSelectedClient(client);
    setValue('clientId', client.id);
    setShowClientSearch(false);
    setClientSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/loans')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande de prêt</h1>
          <p className="text-sm text-gray-500">Créer une nouvelle demande de prêt</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Sélection du client */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium">Client</h2>
          </div>
          <div className="card-body">
            {selectedClient ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">
                    {selectedClient.displayName || `${selectedClient.firstName} ${selectedClient.lastName}`}
                  </p>
                  <p className="text-sm text-green-700">
                    N° {selectedClient.accountNumber} • {selectedClient.phoneNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setShowClientSearch(true);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Rechercher un client par nom, numéro ou téléphone..."
                    className="input pl-10"
                  />
                </div>

                {clientsResults?.items && clientsResults.items.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {clientsResults.items.map((client: any) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full p-3 text-left hover:bg-gray-50 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{client.displayName}</p>
                          <p className="text-sm text-gray-500">
                            N° {client.accountNumber} • {client.phoneNumber}
                          </p>
                        </div>
                        <span className={`badge-${client.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                          {client.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Produit et montant */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium">Détails du prêt</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Produit de prêt *</label>
                <select
                  {...register('loanProductId', { required: 'Ce champ est requis' })}
                  className={errors.loanProductId ? 'input-error' : 'input'}
                >
                  <option value="">Sélectionner un produit</option>
                  {products?.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.interestRatePerPeriod}%)
                    </option>
                  ))}
                </select>
                {errors.loanProductId && (
                  <p className="mt-1 text-sm text-red-600">{errors.loanProductId.message}</p>
                )}
              </div>

              <div>
                <label className="label">Montant du prêt (FCFA) *</label>
                <input
                  type="number"
                  {...register('principalAmount', { 
                    required: 'Ce champ est requis',
                    min: { value: 1000, message: 'Minimum 1000 FCFA' }
                  })}
                  className={errors.principalAmount ? 'input-error' : 'input'}
                  placeholder="100000"
                />
                {errors.principalAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.principalAmount.message}</p>
                )}
              </div>

              <div>
                <label className="label">Taux d'intérêt (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('interestRate', { required: 'Ce champ est requis' })}
                  className={errors.interestRate ? 'input-error' : 'input'}
                />
              </div>

              <div>
                <label className="label">Nombre d'échéances *</label>
                <input
                  type="number"
                  {...register('numberOfRepayments', { 
                    required: 'Ce champ est requis',
                    min: { value: 1, message: 'Minimum 1 échéance' }
                  })}
                  className={errors.numberOfRepayments ? 'input-error' : 'input'}
                />
              </div>

              <div>
                <label className="label">Fréquence de remboursement</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    {...register('repaymentEvery', { min: 1 })}
                    className="input w-20"
                    min="1"
                  />
                  <select {...register('repaymentFrequency')} className="input flex-1">
                    <option value="DAYS">Jour(s)</option>
                    <option value="WEEKS">Semaine(s)</option>
                    <option value="MONTHS">Mois</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Objet du prêt</label>
                <input
                  {...register('loanPurpose')}
                  className="input"
                  placeholder="Ex: Fonds de roulement, Agriculture..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium">Dates</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Date de soumission</label>
                <input
                  type="date"
                  {...register('submittedOnDate')}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Date de décaissement prévue</label>
                <input
                  type="date"
                  {...register('expectedDisbursementDate')}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton calculer échéancier */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handlePreviewSchedule}
            disabled={previewMutation.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            <CalculatorIcon className="h-5 w-5" />
            {previewMutation.isPending ? 'Calcul...' : 'Calculer l\'échéancier'}
          </button>
        </div>

        {/* Échéancier prévisonnel */}
        {showSchedule && schedule.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Échéancier prévisionnel</h2>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Date d'échéance</th>
                    <th>Principal</th>
                    <th>Intérêts</th>
                    <th>Total</th>
                    <th>Solde restant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {schedule.map((row: any, index: number) => (
                    <tr key={index}>
                      <td>{row.installmentNumber || index + 1}</td>
                      <td>{new Date(row.dueDate).toLocaleDateString('fr-FR')}</td>
                      <td>{formatCurrency(Number(row.principalDue || row.principal || 0))}</td>
                      <td>{formatCurrency(Number(row.interestDue || row.interest || 0))}</td>
                      <td className="font-medium">
                        {formatCurrency(Number(row.totalDue || row.total || 0))}
                      </td>
                      <td>{formatCurrency(Number(row.principalBalance || row.balance || 0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="font-medium">Total</td>
                    <td className="font-medium">
                      {formatCurrency(schedule.reduce((sum, r) => sum + Number(r.principalDue || r.principal || 0), 0))}
                    </td>
                    <td className="font-medium">
                      {formatCurrency(schedule.reduce((sum, r) => sum + Number(r.interestDue || r.interest || 0), 0))}
                    </td>
                    <td className="font-bold">
                      {formatCurrency(schedule.reduce((sum, r) => sum + Number(r.totalDue || r.total || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/loans')} className="btn-secondary">
            Annuler
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !selectedClient}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Création...' : 'Soumettre la demande'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewLoanPage;
