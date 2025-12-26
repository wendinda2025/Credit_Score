import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Permissions prédéfinies du système
export enum SystemPermissions {
  // Users
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Clients
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  CLIENT_ACTIVATE = 'client:activate',
  CLIENT_SUSPEND = 'client:suspend',
  CLIENT_CLOSE = 'client:close',
  
  // Loans
  LOAN_CREATE = 'loan:create',
  LOAN_READ = 'loan:read',
  LOAN_UPDATE = 'loan:update',
  LOAN_DELETE = 'loan:delete',
  LOAN_APPROVE = 'loan:approve',
  LOAN_REJECT = 'loan:reject',
  LOAN_DISBURSE = 'loan:disburse',
  LOAN_REPAY = 'loan:repay',
  LOAN_WRITE_OFF = 'loan:writeoff',
  LOAN_RESCHEDULE = 'loan:reschedule',
  
  // Savings
  SAVINGS_CREATE = 'savings:create',
  SAVINGS_READ = 'savings:read',
  SAVINGS_UPDATE = 'savings:update',
  SAVINGS_DELETE = 'savings:delete',
  SAVINGS_ACTIVATE = 'savings:activate',
  SAVINGS_DEPOSIT = 'savings:deposit',
  SAVINGS_WITHDRAW = 'savings:withdraw',
  SAVINGS_CLOSE = 'savings:close',
  
  // Accounting
  ACCOUNTING_READ = 'accounting:read',
  ACCOUNTING_CREATE = 'accounting:create',
  ACCOUNTING_CLOSE_PERIOD = 'accounting:closePeriod',
  ACCOUNTING_REVERSE = 'accounting:reverse',
  
  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  REPORT_REGULATORY = 'report:regulatory',
  
  // Audit
  AUDIT_VIEW = 'audit:view',
  
  // System
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_BACKUP = 'system:backup',
}
