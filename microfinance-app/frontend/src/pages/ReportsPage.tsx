import React from 'react';
import { ChartBarIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';

const reports = [
  {
    name: 'Portfolio At Risk (PAR)',
    description: 'Analyse des prêts en retard par tranche',
    icon: ChartBarIcon,
    href: '/reports/par',
  },
  {
    name: 'Production de prêts',
    description: 'Décaissements par période et produit',
    icon: TableCellsIcon,
    href: '/reports/production',
  },
  {
    name: 'Collections',
    description: 'Remboursements collectés par période',
    icon: DocumentTextIcon,
    href: '/reports/collections',
  },
  {
    name: 'Balance de vérification',
    description: 'État comptable à une date donnée',
    icon: TableCellsIcon,
    href: '/reports/trial-balance',
  },
  {
    name: 'Compte de résultat',
    description: 'Revenus et charges sur une période',
    icon: ChartBarIcon,
    href: '/reports/income-statement',
  },
];

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableaux de bord et rapports réglementaires
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <a
            key={report.name}
            href={report.href}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="card-body flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
                <report.icon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{report.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
