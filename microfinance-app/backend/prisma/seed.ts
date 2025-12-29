import { PrismaClient, AccountType, AccountUsage } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Créer les devises
  console.log('💰 Creating currencies...');
  const currencies = [
    { code: 'XOF', name: 'Franc CFA BCEAO', symbol: 'FCFA', displaySymbol: 'FCFA', nameCode: 'currency.XOF', decimalPlaces: 0 },
    { code: 'XAF', name: 'Franc CFA BEAC', symbol: 'FCFA', displaySymbol: 'FCFA', nameCode: 'currency.XAF', decimalPlaces: 0 },
    { code: 'EUR', name: 'Euro', symbol: '€', displaySymbol: '€', nameCode: 'currency.EUR', decimalPlaces: 2 },
    { code: 'USD', name: 'Dollar US', symbol: '$', displaySymbol: '$', nameCode: 'currency.USD', decimalPlaces: 2 },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }

  // 2. Créer les permissions
  console.log('🔐 Creating permissions...');
  const permissionModules = {
    user: ['create', 'read', 'update', 'delete'],
    client: ['create', 'read', 'update', 'delete', 'activate', 'suspend', 'close'],
    loan: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'disburse', 'repay', 'writeoff', 'reschedule'],
    savings: ['create', 'read', 'update', 'delete', 'activate', 'deposit', 'withdraw', 'close'],
    accounting: ['read', 'create', 'closePeriod', 'reverse'],
    report: ['view', 'export', 'regulatory'],
    audit: ['view'],
    system: ['settings', 'backup'],
  };

  const permissions: any[] = [];
  for (const [module, actions] of Object.entries(permissionModules)) {
    for (const action of actions) {
      permissions.push({
        code: `${module}:${action}`,
        name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module}`,
        module,
        description: `Permission to ${action} ${module}`,
      });
    }
  }

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  // 3. Créer les rôles
  console.log('👥 Creating roles...');
  const roles = [
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrateur',
      description: 'Accès total au système',
      isSystem: true,
      permissions: permissions.map((p) => p.code),
    },
    {
      name: 'ADMIN',
      displayName: 'Administrateur',
      description: 'Administration générale',
      isSystem: true,
      permissions: permissions.filter((p) => !p.code.includes('system:')).map((p) => p.code),
    },
    {
      name: 'BRANCH_MANAGER',
      displayName: 'Directeur d\'agence',
      description: 'Gestion d\'une agence',
      isSystem: true,
      permissions: ['client:read', 'client:create', 'client:update', 'client:activate',
                    'loan:read', 'loan:create', 'loan:approve', 'loan:disburse', 'loan:repay',
                    'savings:read', 'savings:create', 'savings:activate', 'savings:deposit', 'savings:withdraw',
                    'report:view', 'report:export', 'accounting:read'],
    },
    {
      name: 'LOAN_OFFICER',
      displayName: 'Agent de crédit',
      description: 'Gestion des prêts',
      isSystem: true,
      permissions: ['client:read', 'client:create', 'client:update',
                    'loan:read', 'loan:create', 'loan:repay',
                    'savings:read', 'report:view'],
    },
    {
      name: 'TELLER',
      displayName: 'Caissier',
      description: 'Opérations de caisse',
      isSystem: true,
      permissions: ['client:read', 'loan:read', 'loan:repay',
                    'savings:read', 'savings:deposit', 'savings:withdraw'],
    },
    {
      name: 'ACCOUNTANT',
      displayName: 'Comptable',
      description: 'Comptabilité',
      isSystem: true,
      permissions: ['accounting:read', 'accounting:create', 'report:view', 'report:export'],
    },
    {
      name: 'AUDITOR',
      displayName: 'Auditeur',
      description: 'Audit et contrôle',
      isSystem: true,
      permissions: ['client:read', 'loan:read', 'savings:read', 'accounting:read',
                    'report:view', 'report:export', 'audit:view'],
    },
  ];

  for (const roleData of roles) {
    const { permissions: permCodes, ...roleInfo } = roleData;
    
    const role = await prisma.role.upsert({
      where: { name: roleInfo.name },
      update: {},
      create: roleInfo,
    });

    // Associer les permissions
    for (const code of permCodes) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permission.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }
    }
  }

  // 4. Créer l'organisation
  console.log('🏢 Creating organization...');
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Microfinance Platform',
      legalName: 'Microfinance Platform SARL',
      country: 'SN',
      defaultCurrency: 'XOF',
    },
  });

  // 5. Créer l'agence siège
  console.log('🏦 Creating head office branch...');
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      code: 'HQ',
      name: 'Siège',
      organizationId: org.id,
      isHeadOffice: true,
      city: 'Dakar',
    },
  });

  // 6. Créer l'utilisateur admin
  console.log('👤 Creating admin user...');
  const adminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const passwordHash = await bcrypt.hash('Admin@123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@microfinance.local' },
    update: {},
    create: {
      email: 'admin@microfinance.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'System',
      isActive: true,
      isEmailVerified: true,
      branchId: branch.id,
    },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: adminUser.id, roleId: adminRole.id },
      },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  // 7. Créer les types de paiement
  console.log('💳 Creating payment types...');
  const paymentTypes = [
    { name: 'Espèces', isCash: true, position: 1 },
    { name: 'Chèque', isCash: false, position: 2 },
    { name: 'Virement bancaire', isCash: false, position: 3 },
    { name: 'Mobile Money', isCash: false, position: 4 },
  ];

  for (const pt of paymentTypes) {
    await prisma.paymentType.upsert({
      where: { id: pt.name.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: { id: pt.name.toLowerCase().replace(/\s/g, '-'), ...pt },
    });
  }

  // 8. Créer le plan comptable de base
  console.log('📊 Creating chart of accounts...');
  const accounts = [
    // ACTIFS
    { code: '1', name: 'ACTIFS', accountType: AccountType.ASSET, usage: AccountUsage.HEADER },
    { code: '10', name: 'Actifs circulants', accountType: AccountType.ASSET, usage: AccountUsage.HEADER, parentCode: '1' },
    { code: '101', name: 'Caisse', accountType: AccountType.ASSET, usage: AccountUsage.DETAIL, parentCode: '10' },
    { code: '102', name: 'Banques', accountType: AccountType.ASSET, usage: AccountUsage.DETAIL, parentCode: '10' },
    { code: '11', name: 'Portefeuille de prêts', accountType: AccountType.ASSET, usage: AccountUsage.HEADER, parentCode: '1' },
    { code: '110', name: 'Prêts en cours', accountType: AccountType.ASSET, usage: AccountUsage.DETAIL, parentCode: '11' },
    { code: '111', name: 'Intérêts à recevoir', accountType: AccountType.ASSET, usage: AccountUsage.DETAIL, parentCode: '11' },
    { code: '119', name: 'Provisions pour créances douteuses', accountType: AccountType.ASSET, usage: AccountUsage.DETAIL, parentCode: '11' },
    
    // PASSIFS
    { code: '2', name: 'PASSIFS', accountType: AccountType.LIABILITY, usage: AccountUsage.HEADER },
    { code: '20', name: 'Dépôts des clients', accountType: AccountType.LIABILITY, usage: AccountUsage.HEADER, parentCode: '2' },
    { code: '200', name: 'Épargne à vue', accountType: AccountType.LIABILITY, usage: AccountUsage.DETAIL, parentCode: '20' },
    { code: '201', name: 'Dépôts à terme', accountType: AccountType.LIABILITY, usage: AccountUsage.DETAIL, parentCode: '20' },
    { code: '21', name: 'Emprunts', accountType: AccountType.LIABILITY, usage: AccountUsage.HEADER, parentCode: '2' },
    { code: '210', name: 'Emprunts bancaires', accountType: AccountType.LIABILITY, usage: AccountUsage.DETAIL, parentCode: '21' },
    
    // CAPITAUX PROPRES
    { code: '3', name: 'CAPITAUX PROPRES', accountType: AccountType.EQUITY, usage: AccountUsage.HEADER },
    { code: '30', name: 'Capital', accountType: AccountType.EQUITY, usage: AccountUsage.DETAIL, parentCode: '3' },
    { code: '31', name: 'Réserves', accountType: AccountType.EQUITY, usage: AccountUsage.DETAIL, parentCode: '3' },
    { code: '32', name: 'Résultat de l\'exercice', accountType: AccountType.EQUITY, usage: AccountUsage.DETAIL, parentCode: '3' },
    
    // PRODUITS
    { code: '7', name: 'PRODUITS', accountType: AccountType.INCOME, usage: AccountUsage.HEADER },
    { code: '70', name: 'Produits d\'intérêts', accountType: AccountType.INCOME, usage: AccountUsage.HEADER, parentCode: '7' },
    { code: '700', name: 'Intérêts sur prêts', accountType: AccountType.INCOME, usage: AccountUsage.DETAIL, parentCode: '70' },
    { code: '71', name: 'Produits de commissions', accountType: AccountType.INCOME, usage: AccountUsage.HEADER, parentCode: '7' },
    { code: '710', name: 'Frais de dossier', accountType: AccountType.INCOME, usage: AccountUsage.DETAIL, parentCode: '71' },
    { code: '711', name: 'Pénalités de retard', accountType: AccountType.INCOME, usage: AccountUsage.DETAIL, parentCode: '71' },
    
    // CHARGES
    { code: '6', name: 'CHARGES', accountType: AccountType.EXPENSE, usage: AccountUsage.HEADER },
    { code: '60', name: 'Charges d\'intérêts', accountType: AccountType.EXPENSE, usage: AccountUsage.HEADER, parentCode: '6' },
    { code: '600', name: 'Intérêts sur dépôts', accountType: AccountType.EXPENSE, usage: AccountUsage.DETAIL, parentCode: '60' },
    { code: '601', name: 'Intérêts sur emprunts', accountType: AccountType.EXPENSE, usage: AccountUsage.DETAIL, parentCode: '60' },
    { code: '61', name: 'Charges de personnel', accountType: AccountType.EXPENSE, usage: AccountUsage.HEADER, parentCode: '6' },
    { code: '610', name: 'Salaires', accountType: AccountType.EXPENSE, usage: AccountUsage.DETAIL, parentCode: '61' },
    { code: '62', name: 'Autres charges', accountType: AccountType.EXPENSE, usage: AccountUsage.HEADER, parentCode: '6' },
    { code: '620', name: 'Dotations aux provisions', accountType: AccountType.EXPENSE, usage: AccountUsage.DETAIL, parentCode: '62' },
  ];

  // Créer les comptes en respectant la hiérarchie
  const accountMap = new Map();
  
  for (const acc of accounts) {
    const parentId = acc.parentCode ? accountMap.get(acc.parentCode) : null;
    const level = acc.code.length;
    const fullCode = acc.code;

    const created = await prisma.gLAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        usage: acc.usage,
        level,
        fullCode,
        parentId,
      },
    });

    accountMap.set(acc.code, created.id);
  }

  // 9. Créer les séquences de numérotation
  console.log('🔢 Creating number sequences...');
  const sequences = [
    { entityType: 'CLIENT', prefix: 'CL', nextValue: 1, padLength: 8 },
    { entityType: 'LOAN', prefix: 'LN', nextValue: 1, padLength: 8 },
    { entityType: 'SAVINGS', prefix: 'SA', nextValue: 1, padLength: 8 },
  ];

  for (const seq of sequences) {
    await prisma.numberSequence.upsert({
      where: { entityType: seq.entityType },
      update: {},
      create: seq,
    });
  }

  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📧 Admin credentials:');
  console.log('   Email: admin@microfinance.local');
  console.log('   Password: Admin@123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
