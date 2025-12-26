import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Créer une organisation
  const organization = await prisma.organization.upsert({
    where: { code: 'MF001' },
    update: {},
    create: {
      code: 'MF001',
      name: 'Microfinance Demo',
      description: 'Organisation de démonstration',
      currency: 'XOF',
      locale: 'fr',
      timezone: 'Africa/Abidjan',
    },
  });

  console.log('✅ Organisation créée:', organization.name);

  // Créer un bureau
  const office = await prisma.office.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'OFF001',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: 'OFF001',
      name: 'Bureau Principal',
      address: '123 Rue de la Microfinance',
    },
  });

  console.log('✅ Bureau créé:', office.name);

  // Créer des rôles
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Administrateur',
      description: 'Accès complet au système',
      permissions: [
        'users.create',
        'users.update',
        'users.delete',
        'clients.create',
        'clients.update',
        'loans.approve',
        'loans.disburse',
        'accounting.create',
        'reports.view',
        'audit.view',
      ],
    },
  });

  const creditOfficerRole = await prisma.role.upsert({
    where: { code: 'CREDIT_OFFICER' },
    update: {},
    create: {
      code: 'CREDIT_OFFICER',
      name: 'Agent de crédit',
      description: 'Gestion des prêts',
      permissions: [
        'clients.create',
        'clients.update',
        'loans.create',
        'loans.approve',
        'reports.view',
      ],
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { code: 'CASHIER' },
    update: {},
    create: {
      code: 'CASHIER',
      name: 'Caissier',
      description: 'Gestion des transactions',
      permissions: [
        'loans.disburse',
        'loans.repay',
        'savings.transact',
        'reports.view',
      ],
    },
  });

  console.log('✅ Rôles créés');

  // Créer un utilisateur admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      organizationId: organization.id,
      officeId: office.id,
      username: 'admin',
      email: 'admin@microfinance.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      isActive: true,
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log('✅ Utilisateur admin créé:', admin.username);

  // Créer le plan comptable de base
  const cashAccount = await prisma.chartOfAccount.create({
    data: {
      organizationId: organization.id,
      code: '101',
      name: 'Caisse',
      type: 'ASSET',
      level: 1,
      allowTransactions: true,
    },
  });

  const loanPortfolioAccount = await prisma.chartOfAccount.create({
    data: {
      organizationId: organization.id,
      code: '201',
      name: 'Portefeuille de prêts',
      type: 'ASSET',
      level: 1,
      allowTransactions: true,
    },
  });

  const interestIncomeAccount = await prisma.chartOfAccount.create({
    data: {
      organizationId: organization.id,
      code: '401',
      name: 'Revenus d\'intérêts',
      type: 'INCOME',
      level: 1,
      allowTransactions: true,
    },
  });

  const savingsAccount = await prisma.chartOfAccount.create({
    data: {
      organizationId: organization.id,
      code: '301',
      name: 'Dépôts clients',
      type: 'LIABILITY',
      level: 1,
      allowTransactions: true,
    },
  });

  console.log('✅ Plan comptable créé');

  // Créer un produit de prêt
  const loanProduct = await prisma.loanProduct.create({
    data: {
      organizationId: organization.id,
      code: 'LP001',
      name: 'Prêt Standard',
      description: 'Produit de prêt standard',
      minLoanAmount: 10000,
      maxLoanAmount: 1000000,
      minLoanTerm: 30,
      maxLoanTerm: 365,
      defaultLoanTerm: 90,
      interestRate: 0.15, // 15% par an
      interestCalculationMethod: 'DECLINING',
      repaymentFrequency: 'MONTHLY',
      processingFee: 1000,
      processingFeeType: 'FIXED',
      penaltyRate: 0.001, // 0.1% par jour
      principalAccountId: loanPortfolioAccount.id,
      interestAccountId: interestIncomeAccount.id,
    },
  });

  console.log('✅ Produit de prêt créé:', loanProduct.name);

  // Créer un produit d'épargne
  const savingsProduct = await prisma.savingsProduct.create({
    data: {
      organizationId: organization.id,
      code: 'SP001',
      name: 'Compte Épargne Standard',
      description: 'Compte d\'épargne avec intérêts',
      minBalance: 0,
      interestRate: 0.05, // 5% par an
      interestCalculation: 'DAILY',
      interestPaymentFrequency: 'MONTHLY',
      accountId: savingsAccount.id,
    },
  });

  console.log('✅ Produit d\'épargne créé:', savingsProduct.name);

  console.log('🎉 Seed terminé avec succès!');
  console.log('\n📝 Identifiants de connexion:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
