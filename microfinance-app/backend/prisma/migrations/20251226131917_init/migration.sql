-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'GROUP', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'REJECTED', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "InterestMethod" AS ENUM ('FLAT', 'DECLINING_BALANCE');

-- CreateEnum
CREATE TYPE "InterestCalculationPeriod" AS ENUM ('DAILY', 'SAME_AS_REPAYMENT');

-- CreateEnum
CREATE TYPE "AmortizationType" AS ENUM ('EQUAL_INSTALLMENTS', 'EQUAL_PRINCIPAL');

-- CreateEnum
CREATE TYPE "RepaymentFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED', 'WRITTEN_OFF', 'RESCHEDULED', 'OVERPAID');

-- CreateEnum
CREATE TYPE "LoanTransactionType" AS ENUM ('DISBURSEMENT', 'REPAYMENT', 'WAIVER', 'WRITE_OFF', 'RECOVERY', 'CHARGE', 'REFUND', 'ACCRUAL');

-- CreateEnum
CREATE TYPE "SavingsAccountType" AS ENUM ('REGULAR', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT', 'MANDATORY');

-- CreateEnum
CREATE TYPE "SavingsAccountStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'DORMANT', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SavingsTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'INTEREST_POSTING', 'FEE_DEDUCTION', 'TRANSFER_IN', 'TRANSFER_OUT', 'HOLD', 'RELEASE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountUsage" AS ENUM ('HEADER', 'DETAIL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "preferred_locale" TEXT NOT NULL DEFAULT 'fr',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "branch_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "additional_info" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "registration_no" TEXT,
    "tax_id" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SN',
    "phone_number" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "default_currency" TEXT NOT NULL DEFAULT 'XOF',
    "fiscal_year_start" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "is_head_office" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "client_type" "ClientType" NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'PENDING',
    "branch_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "middle_name" TEXT,
    "gender" "Gender",
    "date_of_birth" TIMESTAMP(3),
    "place_of_birth" TEXT,
    "nationality" TEXT DEFAULT 'SN',
    "marital_status" "MaritalStatus",
    "business_name" TEXT,
    "registration_number" TEXT,
    "date_of_incorporation" TIMESTAMP(3),
    "phone_number" TEXT NOT NULL,
    "alternate_phone" TEXT,
    "email" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SN',
    "occupation" TEXT,
    "employer" TEXT,
    "monthly_income" DECIMAL(65,30),
    "income_source" TEXT,
    "id_type" TEXT,
    "id_number" TEXT,
    "id_expiry_date" TIMESTAMP(3),
    "id_issued_date" TIMESTAMP(3),
    "id_issued_place" TEXT,
    "photo_url" TEXT,
    "signature_url" TEXT,
    "submitted_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_on" TIMESTAMP(3),
    "closed_on" TIMESTAMP(3),
    "external_id" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "phone_number" TEXT,
    "is_dependent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "description" TEXT,
    "currency_code" TEXT NOT NULL DEFAULT 'XOF',
    "min_principal" DECIMAL(65,30) NOT NULL,
    "max_principal" DECIMAL(65,30) NOT NULL,
    "default_principal" DECIMAL(65,30) NOT NULL,
    "min_interest_rate" DECIMAL(65,30) NOT NULL,
    "max_interest_rate" DECIMAL(65,30) NOT NULL,
    "default_interest_rate" DECIMAL(65,30) NOT NULL,
    "interest_method" "InterestMethod" NOT NULL,
    "interest_calculation_period" "InterestCalculationPeriod" NOT NULL,
    "min_term" INTEGER NOT NULL,
    "max_term" INTEGER NOT NULL,
    "default_term" INTEGER NOT NULL,
    "repayment_frequency" "RepaymentFrequency" NOT NULL,
    "amortization_type" "AmortizationType" NOT NULL,
    "processing_fee_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "processing_fee_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "insurance_fee_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "insurance_fee_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "penalty_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "penalty_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grace_period_days" INTEGER NOT NULL DEFAULT 0,
    "principal_grace_period" INTEGER NOT NULL DEFAULT 0,
    "interest_grace_period" INTEGER NOT NULL DEFAULT 0,
    "allow_partial_payments" BOOLEAN NOT NULL DEFAULT true,
    "allow_prepayments" BOOLEAN NOT NULL DEFAULT true,
    "requires_collateral" BOOLEAN NOT NULL DEFAULT false,
    "requires_guarantor" BOOLEAN NOT NULL DEFAULT false,
    "fund_source_account_id" TEXT,
    "loan_portfolio_account_id" TEXT,
    "interest_receivable_account_id" TEXT,
    "interest_income_account_id" TEXT,
    "penalty_income_account_id" TEXT,
    "fee_income_account_id" TEXT,
    "write_off_account_id" TEXT,
    "overpayment_account_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_product_charges" (
    "id" TEXT NOT NULL,
    "loan_product_id" TEXT NOT NULL,
    "charge_id" TEXT NOT NULL,

    CONSTRAINT "loan_product_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'XOF',
    "charge_applies_to" TEXT NOT NULL,
    "charge_time_type" TEXT NOT NULL,
    "charge_calculation_type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_penalty" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "external_id" TEXT,
    "client_id" TEXT NOT NULL,
    "loan_product_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "loan_officer_id" TEXT,
    "principal_amount" DECIMAL(65,30) NOT NULL,
    "approved_principal" DECIMAL(65,30),
    "disbursed_amount" DECIMAL(65,30),
    "currency_code" TEXT NOT NULL DEFAULT 'XOF',
    "number_of_repayments" INTEGER NOT NULL,
    "repayment_frequency" "RepaymentFrequency" NOT NULL,
    "interest_rate" DECIMAL(65,30) NOT NULL,
    "interest_method" "InterestMethod" NOT NULL,
    "amortization_type" "AmortizationType" NOT NULL,
    "submitted_on" TIMESTAMP(3) NOT NULL,
    "approved_on" TIMESTAMP(3),
    "expected_disbursement_date" TIMESTAMP(3),
    "actual_disbursement_date" TIMESTAMP(3),
    "expected_maturity_date" TIMESTAMP(3),
    "closed_on" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "total_expected_repayment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_principal_repaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_interest_repaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_fees_repaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_penalties_repaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_overpaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_outstanding" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "principal_outstanding" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "interest_outstanding" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fees_outstanding" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "penalties_outstanding" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "days_in_arrears" INTEGER NOT NULL DEFAULT 0,
    "arrears_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "principal_grace_period" INTEGER NOT NULL DEFAULT 0,
    "interest_grace_period" INTEGER NOT NULL DEFAULT 0,
    "loan_purpose" TEXT,
    "rejection_reason" TEXT,
    "closure_reason" TEXT,
    "notes" TEXT,
    "approved_by_id" TEXT,
    "disbursed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_schedules" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "principal_due" DECIMAL(65,30) NOT NULL,
    "interest_due" DECIMAL(65,30) NOT NULL,
    "fees_due" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "penalties_due" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_due" DECIMAL(65,30) NOT NULL,
    "principal_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "interest_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fees_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "penalties_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "principal_outstanding" DECIMAL(65,30) NOT NULL,
    "interest_outstanding" DECIMAL(65,30) NOT NULL,
    "total_outstanding" DECIMAL(65,30) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_on" TIMESTAMP(3),
    "is_overdue" BOOLEAN NOT NULL DEFAULT false,
    "days_overdue" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_transactions" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "transaction_type" "LoanTransactionType" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "principal_portion" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "interest_portion" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fees_portion" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "penalties_portion" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overpayment_portion" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "outstanding_balance" DECIMAL(65,30) NOT NULL,
    "payment_type_id" TEXT,
    "receipt_number" TEXT,
    "check_number" TEXT,
    "bank_name" TEXT,
    "external_id" TEXT,
    "is_reversed" BOOLEAN NOT NULL DEFAULT false,
    "reversal_transaction_id" TEXT,
    "reversal_reason" TEXT,
    "notes" TEXT,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_charges" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "charge_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "amount_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amount_outstanding" DECIMAL(65,30) NOT NULL,
    "amount_waived" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "is_waived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_collaterals" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_collaterals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_guarantors" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address" TEXT,
    "guarantee_amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_guarantors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_disbursement_details" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "expected_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "principal" DECIMAL(65,30) NOT NULL,
    "approved_principal" DECIMAL(65,30),

    CONSTRAINT "loan_disbursement_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "description" TEXT,
    "currency_code" TEXT NOT NULL DEFAULT 'XOF',
    "account_type" "SavingsAccountType" NOT NULL,
    "min_opening_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "min_balance_for_interest" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "nominal_annual_interest_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "interest_compounding_period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "interest_posting_period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "interest_calculation_type" TEXT NOT NULL DEFAULT 'DAILY_BALANCE',
    "allow_withdrawals" BOOLEAN NOT NULL DEFAULT true,
    "min_withdrawal_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "savings_reference_account_id" TEXT,
    "savings_control_account_id" TEXT,
    "interest_payable_account_id" TEXT,
    "interest_expense_account_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_accounts" (
    "id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "external_id" TEXT,
    "client_id" TEXT NOT NULL,
    "savings_product_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'XOF',
    "account_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "available_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "blocked_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "nominal_annual_interest_rate" DECIMAL(65,30) NOT NULL,
    "total_interest_earned" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_interest_posted" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "last_interest_calculation_date" TIMESTAMP(3),
    "last_interest_posting_date" TIMESTAMP(3),
    "total_deposits" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_withdrawals" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "SavingsAccountStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submitted_on" TIMESTAMP(3) NOT NULL,
    "approved_on" TIMESTAMP(3),
    "activated_on" TIMESTAMP(3),
    "closed_on" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_transactions" (
    "id" TEXT NOT NULL,
    "savings_account_id" TEXT NOT NULL,
    "transaction_type" "SavingsTransactionType" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "running_balance" DECIMAL(65,30) NOT NULL,
    "payment_type_id" TEXT,
    "receipt_number" TEXT,
    "check_number" TEXT,
    "bank_name" TEXT,
    "external_id" TEXT,
    "is_reversed" BOOLEAN NOT NULL DEFAULT false,
    "reversal_transaction_id" TEXT,
    "reversal_reason" TEXT,
    "notes" TEXT,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_holds" (
    "id" TEXT NOT NULL,
    "savings_account_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hold_date" TIMESTAMP(3) NOT NULL,
    "release_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "usage" "AccountUsage" NOT NULL DEFAULT 'DETAIL',
    "description" TEXT,
    "parent_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "full_code" TEXT NOT NULL,
    "manual_entries_allowed" BOOLEAN NOT NULL DEFAULT true,
    "is_reconciliation_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gl_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'XOF',
    "is_reversed" BOOLEAN NOT NULL DEFAULT false,
    "reversal_entry_id" TEXT,
    "reversal_date" TIMESTAMP(3),
    "reversal_reason" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "gl_account_id" TEXT NOT NULL,
    "debit_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_closures" (
    "id" TEXT NOT NULL,
    "closing_date" TIMESTAMP(3) NOT NULL,
    "comments" TEXT,
    "closed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_closures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_cash" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimal_places" INTEGER NOT NULL DEFAULT 0,
    "display_symbol" TEXT NOT NULL,
    "name_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "data_type" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "next_value" INTEGER NOT NULL DEFAULT 1,
    "pad_length" INTEGER NOT NULL DEFAULT 8,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_account_number_key" ON "clients"("account_number");

-- CreateIndex
CREATE INDEX "clients_account_number_idx" ON "clients"("account_number");

-- CreateIndex
CREATE INDEX "clients_phone_number_idx" ON "clients"("phone_number");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_branch_id_idx" ON "clients"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_client_id_key" ON "group_members"("group_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_products_code_key" ON "loan_products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "loan_product_charges_loan_product_id_charge_id_key" ON "loan_product_charges"("loan_product_id", "charge_id");

-- CreateIndex
CREATE UNIQUE INDEX "loans_account_number_key" ON "loans"("account_number");

-- CreateIndex
CREATE INDEX "loans_account_number_idx" ON "loans"("account_number");

-- CreateIndex
CREATE INDEX "loans_client_id_idx" ON "loans"("client_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loans_branch_id_idx" ON "loans"("branch_id");

-- CreateIndex
CREATE INDEX "loan_schedules_due_date_idx" ON "loan_schedules"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "loan_schedules_loan_id_installment_number_key" ON "loan_schedules"("loan_id", "installment_number");

-- CreateIndex
CREATE INDEX "loan_transactions_loan_id_idx" ON "loan_transactions"("loan_id");

-- CreateIndex
CREATE INDEX "loan_transactions_transaction_date_idx" ON "loan_transactions"("transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "savings_products_code_key" ON "savings_products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "savings_accounts_account_number_key" ON "savings_accounts"("account_number");

-- CreateIndex
CREATE INDEX "savings_accounts_account_number_idx" ON "savings_accounts"("account_number");

-- CreateIndex
CREATE INDEX "savings_accounts_client_id_idx" ON "savings_accounts"("client_id");

-- CreateIndex
CREATE INDEX "savings_accounts_status_idx" ON "savings_accounts"("status");

-- CreateIndex
CREATE INDEX "savings_transactions_savings_account_id_idx" ON "savings_transactions"("savings_account_id");

-- CreateIndex
CREATE INDEX "savings_transactions_transaction_date_idx" ON "savings_transactions"("transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "gl_accounts_code_key" ON "gl_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_transaction_id_key" ON "journal_entries"("transaction_id");

-- CreateIndex
CREATE INDEX "journal_entries_transaction_date_idx" ON "journal_entries"("transaction_date");

-- CreateIndex
CREATE INDEX "journal_entries_entity_type_entity_id_idx" ON "journal_entries"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_effective_date_key" ON "exchange_rates"("from_currency", "to_currency", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_entity_type_key" ON "number_sequences"("entity_type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_product_charges" ADD CONSTRAINT "loan_product_charges_loan_product_id_fkey" FOREIGN KEY ("loan_product_id") REFERENCES "loan_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_product_charges" ADD CONSTRAINT "loan_product_charges_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_loan_product_id_fkey" FOREIGN KEY ("loan_product_id") REFERENCES "loan_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_disbursed_by_id_fkey" FOREIGN KEY ("disbursed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_schedules" ADD CONSTRAINT "loan_schedules_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "payment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_charges" ADD CONSTRAINT "loan_charges_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_charges" ADD CONSTRAINT "loan_charges_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_collaterals" ADD CONSTRAINT "loan_collaterals_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_guarantors" ADD CONSTRAINT "loan_guarantors_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_disbursement_details" ADD CONSTRAINT "loan_disbursement_details_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_savings_product_id_fkey" FOREIGN KEY ("savings_product_id") REFERENCES "savings_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_savings_account_id_fkey" FOREIGN KEY ("savings_account_id") REFERENCES "savings_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "payment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_holds" ADD CONSTRAINT "savings_holds_savings_account_id_fkey" FOREIGN KEY ("savings_account_id") REFERENCES "savings_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_accounts" ADD CONSTRAINT "gl_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "gl_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "gl_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
