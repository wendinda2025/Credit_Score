import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientsService, organizationService } from '../services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ClientForm {
  clientType: 'INDIVIDUAL' | 'GROUP' | 'ENTERPRISE';
  firstName: string;
  lastName: string;
  middleName?: string;
  businessName?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  phoneNumber: string;
  email?: string;
  nationalId?: string;
  nationalIdType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  occupation?: string;
  monthlyIncome?: number;
  branchId: string;
  notes?: string;
}

const NewClientPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'GROUP' | 'ENTERPRISE'>('INDIVIDUAL');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ClientForm>({
    defaultValues: {
      clientType: 'INDIVIDUAL',
      country: 'Burkina Faso',
    }
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => organizationService.getBranches(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ClientForm) => clientsService.create(data),
    onSuccess: (data) => {
      toast.success('Client créé avec succès');
      navigate(`/clients/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const onSubmit = (data: ClientForm) => {
    createMutation.mutate({ ...data, clientType });
  };

  const watchedType = watch('clientType');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
          <p className="text-sm text-gray-500">Créer un nouveau compte client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Type de client */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium">Type de client</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'INDIVIDUAL', label: 'Individu', icon: '👤' },
                { value: 'GROUP', label: 'Groupe', icon: '👥' },
                { value: 'ENTERPRISE', label: 'Entreprise', icon: '🏢' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setClientType(type.value as any)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    clientType === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{type.icon}</span>
                  <p className="mt-2 font-medium">{type.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium">
              {clientType === 'ENTERPRISE' ? 'Informations de l\'entreprise' : 'Informations personnelles'}
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clientType === 'ENTERPRISE' ? (
                <div className="md:col-span-2">
                  <label className="label">Nom de l'entreprise *</label>
                  <input
                    {...register('businessName', { required: 'Ce champ est requis' })}
                    className={errors.businessName ? 'input-error' : 'input'}
                    placeholder="Ex: SARL Example"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                  )}
                </div>
              ) : clientType === 'GROUP' ? (
                <div className="md:col-span-2">
                  <label className="label">Nom du groupe *</label>
                  <input
                    {...register('businessName', { required: 'Ce champ est requis' })}
                    className={errors.businessName ? 'input-error' : 'input'}
                    placeholder="Ex: Groupe Solidarité Femmes"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                  )}
                </div>
              ) : null}

              {clientType === 'INDIVIDUAL' && (
                <>
                  <div>
                    <label className="label">Prénom *</label>
                    <input
                      {...register('firstName', { required: 'Ce champ est requis' })}
                      className={errors.firstName ? 'input-error' : 'input'}
                      placeholder="Prénom"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Nom *</label>
                    <input
                      {...register('lastName', { required: 'Ce champ est requis' })}
                      className={errors.lastName ? 'input-error' : 'input'}
                      placeholder="Nom de famille"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Genre</label>
                    <select {...register('gender')} className="input">
                      <option value="">Sélectionner</option>
                      <option value="MALE">Homme</option>
                      <option value="FEMALE">Femme</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Date de naissance</label>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="input"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="label">Téléphone *</label>
                <input
                  {...register('phoneNumber', { required: 'Ce champ est requis' })}
                  className={errors.phoneNumber ? 'input-error' : 'input'}
                  placeholder="+226 70 00 00 00"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="input"
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documents d'identité */}
        {clientType === 'INDIVIDUAL' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Documents d'identité (KYC)</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Type de document</label>
                  <select {...register('nationalIdType')} className="input">
                    <option value="">Sélectionner</option>
                    <option value="CNIB">CNIB</option>
                    <option value="PASSPORT">Passeport</option>
                    <option value="PERMIS">Permis de conduire</option>
                    <option value="CARTE_CONSULAIRE">Carte consulaire</option>
                  </select>
                </div>

                <div>
                  <label className="label">Numéro du document</label>
                  <input
                    {...register('nationalId')}
                    className="input"
                    placeholder="Numéro d'identification"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Adresse */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium">Adresse</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label">Adresse</label>
                <input
                  {...register('address')}
                  className="input"
                  placeholder="Rue, quartier..."
                />
              </div>

              <div>
                <label className="label">Ville</label>
                <input
                  {...register('city')}
                  className="input"
                  placeholder="Ouagadougou"
                />
              </div>

              <div>
                <label className="label">Région/Province</label>
                <input
                  {...register('state')}
                  className="input"
                  placeholder="Centre"
                />
              </div>

              <div>
                <label className="label">Pays</label>
                <input
                  {...register('country')}
                  className="input"
                  placeholder="Burkina Faso"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informations financières */}
        {clientType === 'INDIVIDUAL' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Informations financières</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Profession</label>
                  <input
                    {...register('occupation')}
                    className="input"
                    placeholder="Ex: Commerçant, Agriculteur..."
                  />
                </div>

                <div>
                  <label className="label">Revenu mensuel (FCFA)</label>
                  <input
                    type="number"
                    {...register('monthlyIncome', { valueAsNumber: true })}
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Affectation */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium">Affectation</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Agence *</label>
                <select
                  {...register('branchId', { required: 'Ce champ est requis' })}
                  className={errors.branchId ? 'input-error' : 'input'}
                >
                  <option value="">Sélectionner une agence</option>
                  {branches?.map((branch: any) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="mt-1 text-sm text-red-600">{errors.branchId.message}</p>
                )}
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  {...register('notes')}
                  className="input"
                  rows={3}
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Création...' : 'Créer le client'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewClientPage;
