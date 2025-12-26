import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // 1. Créer une organisation
  console.log('📦 Création de l\'organisation...');
  const organization = await prisma.organization.upsert({
    where: { id: 'default-org-id' },
    update: {},
    create: {
      id: 'default-org-id',
      name: 'Microfinance SARL',
      shortName: 'MF-SARL',
      email: 'contact@microfinance.com',
      phone: '+225 27 20 00 00 00',
      address: 'Abidjan, Plateau',
      city: 'Abidjan',
      country: 'Côte d\'Ivoire',
      isActive: true,
    },
  });

  console.log(`✅ Organisation créée: ${organization.name}`);

  // 2. Créer des utilisateurs
  console.log('👥 Création des utilisateurs...');
  
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@microfinance.com' },
    update: {},
    create: {
      email: 'admin@microfinance.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN',
      isActive: true,
      organizationId: organization.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@microfinance.com' },
    update: {},
    create: {
      email: 'manager@microfinance.com',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Kouassi',
      role: 'MANAGER',
      isActive: true,
      organizationId: organization.id,
    },
  });

  const loanOfficer = await prisma.user.upsert({
    where: { email: 'agent@microfinance.com' },
    update: {},
    create: {
      email: 'agent@microfinance.com',
      password: hashedPassword,
      firstName: 'Amina',
      lastName: 'Diallo',
      role: 'LOAN_OFFICER',
      isActive: true,
      organizationId: organization.id,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'caissier@microfinance.com' },
    update: {},
    create: {
      email: 'caissier@microfinance.com',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Yao',
      role: 'CASHIER',
      isActive: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Utilisateurs créés');
  console.log('   - admin@microfinance.com (Password123!)');
  console.log('   - manager@microfinance.com (Password123!)');
  console.log('   - agent@microfinance.com (Password123!)');
  console.log('   - caissier@microfinance.com (Password123!)');

  // 3. Créer un plan comptable de base
  console.log('💰 Création du plan comptable...');

  const accounts = [
    // ACTIFS
    { code: '100', name: 'Caisse', type: 'ASSET', usage: 'CASH' },
    { code: '101', name: 'Banque', type: 'ASSET', usage: 'BANK' },
    { code: '200', name: 'Prêts aux clients', type: 'ASSET', usage: 'LOAN_PORTFOLIO' },
    
    // PASSIFS
    { code: '400', name: 'Comptes d\'épargne clients', type: 'LIABILITY', usage: 'SAVINGS_ACCOUNT' },
    { code: '401', name: 'Fournisseurs', type: 'LIABILITY', usage: 'MANUAL' },
    
    // CAPITAUX PROPRES
    { code: '500', name: 'Capital social', type: 'EQUITY', usage: 'CAPITAL' },
    { code: '501', name: 'Résultats non distribués', type: 'EQUITY', usage: 'RETAINED_EARNINGS' },
    
    // REVENUS
    { code: '700', name: 'Produits d\'intérêts sur prêts', type: 'INCOME', usage: 'INTEREST_INCOME' },
    { code: '701', name: 'Produits de frais', type: 'INCOME', usage: 'FEE_INCOME' },
    { code: '702', name: 'Produits de pénalités', type: 'INCOME', usage: 'PENALTY_INCOME' },
    
    // CHARGES
    { code: '800', name: 'Charges d\'intérêts sur épargne', type: 'EXPENSE', usage: 'INTEREST_EXPENSE' },
    { code: '801', name: 'Frais de personnel', type: 'EXPENSE', usage: 'MANUAL' },
    { code: '802', name: 'Frais administratifs', type: 'EXPENSE', usage: 'MANUAL' },
  ];

  for (const acc of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { 
        organizationId_accountCode: {
          organizationId: organization.id,
          accountCode: acc.code,
        }
      },
      update: {},
      create: {
        accountCode: acc.code,
        name: acc.name,
        type: acc.type as any,
        usage: acc.usage as any,
        organizationId: organization.id,
        balance: 0,
        manualEntriesAllowed: acc.usage === 'MANUAL',
      },
    });
  }

  console.log(`✅ Plan comptable créé (${accounts.length} comptes)`);

  // 4. Créer des produits de prêt
  console.log('💳 Création des produits de prêt...');

  const loanProduct1 = await prisma.loanProduct.create({
    data: {
      name: 'Prêt Micro-Entreprise',
      shortName: 'PME',
      description: 'Prêt pour le développement de micro-entreprises',
      minPrincipal: 50000,
      maxPrincipal: 2000000,
      interestRate: 15,
      minInstallments: 3,
      maxInstallments: 24,
      repaymentFrequency: 'MONTHLY',
      interestMethod: 'DECLINING_BALANCE',
      penaltyRate: 2,
      isActive: true,
      organizationId: organization.id,
    },
  });

  const loanProduct2 = await prisma.loanProduct.create({
    data: {
      name: 'Prêt Solidaire',
      shortName: 'PS',
      description: 'Prêt pour groupes solidaires',
      minPrincipal: 20000,
      maxPrincipal: 500000,
      interestRate: 18,
      minInstallments: 6,
      maxInstallments: 12,
      repaymentFrequency: 'MONTHLY',
      interestMethod: 'FLAT',
      penaltyRate: 3,
      isActive: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Produits de prêt créés');
  console.log(`   - ${loanProduct1.name}`);
  console.log(`   - ${loanProduct2.name}`);

  // 5. Créer des produits d'épargne
  console.log('💰 Création des produits d\'épargne...');

  const savingsProduct1 = await prisma.savingsProduct.create({
    data: {
      name: 'Compte Épargne Classique',
      shortName: 'CEC',
      description: 'Compte d\'épargne avec intérêts',
      productType: 'SAVINGS',
      interestRate: 3,
      minBalance: 5000,
      minOpeningBalance: 10000,
      withdrawalFee: 500,
      monthlyMaintenanceFee: 0,
      isActive: true,
      organizationId: organization.id,
    },
  });

  const savingsProduct2 = await prisma.savingsProduct.create({
    data: {
      name: 'Compte à Terme',
      shortName: 'CAT',
      description: 'Compte à terme 12 mois',
      productType: 'FIXED_DEPOSIT',
      interestRate: 6,
      minBalance: 50000,
      minOpeningBalance: 100000,
      maxWithdrawalsPerMonth: 0,
      isActive: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Produits d\'épargne créés');
  console.log(`   - ${savingsProduct1.name}`);
  console.log(`   - ${savingsProduct2.name}`);

  // 6. Créer des clients de démonstration
  console.log('👤 Création de clients de démonstration...');

  const clients = [
    {
      type: 'INDIVIDUAL',
      firstName: 'Kofi',
      lastName: 'Mensah',
      gender: 'MALE',
      dateOfBirth: new Date('1985-03-15'),
      phone: '+225 07 12 34 56 78',
      email: 'kofi.mensah@example.com',
      address: 'Abidjan, Yopougon',
    },
    {
      type: 'INDIVIDUAL',
      firstName: 'Fatou',
      lastName: 'Traoré',
      gender: 'FEMALE',
      dateOfBirth: new Date('1990-08-22'),
      phone: '+225 05 98 76 54 32',
      email: 'fatou.traore@example.com',
      address: 'Abidjan, Cocody',
    },
    {
      type: 'INDIVIDUAL',
      firstName: 'Ibrahim',
      lastName: 'Sow',
      gender: 'MALE',
      dateOfBirth: new Date('1982-11-10'),
      phone: '+225 07 45 67 89 01',
      email: 'ibrahim.sow@example.com',
      address: 'Abidjan, Abobo',
    },
  ];

  let clientCount = 1;
  for (const clientData of clients) {
    await prisma.client.create({
      data: {
        ...clientData,
        accountNumber: `CLI-${String(clientCount).padStart(6, '0')}`,
        status: 'ACTIVE',
        organizationId: organization.id,
        createdById: admin.id,
      } as any,
    });
    clientCount++;
  }

  console.log(`✅ ${clients.length} clients créés`);

  console.log('\n🎉 Seeding terminé avec succès!');
  console.log('\n📝 Informations de connexion:');
  console.log('   Email: admin@microfinance.com');
  console.log('   Mot de passe: Password123!');
  console.log('\n🚀 Vous pouvez maintenant démarrer l\'application!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
