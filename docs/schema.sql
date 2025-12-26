-- Schéma SQL (PostgreSQL) – référence lisible.
-- Source de vérité: backend/prisma/schema.prisma (générer via: prisma migrate dev)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========== IAM / Organisation ==========
CREATE TABLE organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_currency_code text NOT NULL DEFAULT 'XOF',
  default_language text NOT NULL DEFAULT 'FR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE office (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  parent_office_id uuid NULL REFERENCES office(id),
  code text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  office_id uuid NULL REFERENCES office(id),
  username text NOT NULL,
  email text NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, username)
);

CREATE TABLE role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name text NOT NULL,
  description text NULL,
  UNIQUE (organization_id, name)
);

CREATE TABLE user_role (
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== Clients / KYC ==========
CREATE TABLE client (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  type text NOT NULL,          -- INDIVIDUAL|GROUP|BUSINESS
  status text NOT NULL DEFAULT 'ACTIVE',
  external_id text NULL,
  display_name text NOT NULL,
  phone text NULL,
  email text NULL,
  address text NULL,
  language text NOT NULL DEFAULT 'FR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, external_id)
);

CREATE TABLE individual_client_profile (
  client_id uuid PRIMARY KEY REFERENCES client(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text NULL,
  date_of_birth date NULL,
  national_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE group_client_profile (
  client_id uuid PRIMARY KEY REFERENCES client(id) ON DELETE CASCADE,
  meeting_day text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE business_client_profile (
  client_id uuid PRIMARY KEY REFERENCES client(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  registration_no text NULL,
  tax_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kyc_document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  type text NOT NULL,
  file_name text NOT NULL,
  mime_type text NULL,
  storage_key text NULL,
  issued_by text NULL,
  issued_at timestamptz NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== Prêts ==========
CREATE TABLE loan_product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name text NOT NULL,
  currency_code text NOT NULL DEFAULT 'XOF',
  interest_type text NOT NULL,
  interest_rate_annual_percent numeric(9,6) NOT NULL,
  repayment_frequency text NOT NULL,
  repayment_every int NOT NULL DEFAULT 1,
  number_of_repayments int NOT NULL,
  principal_min numeric(18,2) NULL,
  principal_max numeric(18,2) NULL,
  disbursement_fee numeric(18,2) NULL,
  penalty_rate_annual_percent numeric(9,6) NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE loan_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  client_id uuid NOT NULL REFERENCES client(id),
  loan_product_id uuid NOT NULL REFERENCES loan_product(id),
  officer_user_id uuid NULL REFERENCES app_user(id),
  status text NOT NULL DEFAULT 'SUBMITTED',
  currency_code text NOT NULL DEFAULT 'XOF',
  principal numeric(18,2) NOT NULL,
  interest_type text NOT NULL,
  interest_rate_annual_percent numeric(9,6) NOT NULL,
  repayment_frequency text NOT NULL,
  repayment_every int NOT NULL DEFAULT 1,
  number_of_repayments int NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz NULL,
  expected_disbursement_at timestamptz NULL,
  disbursed_at timestamptz NULL,
  first_repayment_date timestamptz NULL,
  closed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE loan_schedule_installment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_account_id uuid NOT NULL REFERENCES loan_account(id) ON DELETE CASCADE,
  installment_number int NOT NULL,
  due_date timestamptz NOT NULL,
  principal_due numeric(18,2) NOT NULL,
  interest_due numeric(18,2) NOT NULL,
  fee_charges_due numeric(18,2) NOT NULL DEFAULT 0,
  penalty_charges_due numeric(18,2) NOT NULL DEFAULT 0,
  principal_paid numeric(18,2) NOT NULL DEFAULT 0,
  interest_paid numeric(18,2) NOT NULL DEFAULT 0,
  fee_charges_paid numeric(18,2) NOT NULL DEFAULT 0,
  penalty_charges_paid numeric(18,2) NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  UNIQUE (loan_account_id, installment_number)
);

CREATE TABLE loan_transaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_account_id uuid NOT NULL REFERENCES loan_account(id) ON DELETE CASCADE,
  type text NOT NULL,
  transaction_date timestamptz NOT NULL,
  amount numeric(18,2) NOT NULL,
  principal_portion numeric(18,2) NULL,
  interest_portion numeric(18,2) NULL,
  fee_portion numeric(18,2) NULL,
  penalty_portion numeric(18,2) NULL,
  external_ref text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== Épargne ==========
CREATE TABLE savings_product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name text NOT NULL,
  currency_code text NOT NULL DEFAULT 'XOF',
  interest_rate_annual_percent numeric(9,6) NULL,
  min_balance numeric(18,2) NULL,
  allow_withdrawals boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE savings_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  client_id uuid NOT NULL REFERENCES client(id),
  savings_product_id uuid NOT NULL REFERENCES savings_product(id),
  currency_code text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'ACTIVE',
  balance numeric(18,2) NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE savings_transaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_account_id uuid NOT NULL REFERENCES savings_account(id) ON DELETE CASCADE,
  type text NOT NULL,
  transaction_date timestamptz NOT NULL,
  amount numeric(18,2) NOT NULL,
  balance_after numeric(18,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== Comptabilité ==========
CREATE TABLE accounting_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  parent_id uuid NULL REFERENCES accounting_account(id),
  code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,          -- ASSET|LIABILITY|...
  currency_code text NULL,
  is_header boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE accounting_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  event_type text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_type)
);

CREATE TABLE accounting_rule_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES accounting_rule(id) ON DELETE CASCADE,
  entry_type text NOT NULL,    -- DEBIT|CREDIT
  component text NOT NULL,     -- TOTAL|PRINCIPAL|INTEREST|FEE|PENALTY
  account_id uuid NOT NULL REFERENCES accounting_account(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_id, entry_type, component)
);

CREATE TABLE journal_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  office_id uuid NULL REFERENCES office(id),
  transaction_date timestamptz NOT NULL,
  reference text NULL,
  memo text NULL,
  status text NOT NULL DEFAULT 'POSTED',
  created_by_user_id uuid NOT NULL REFERENCES app_user(id),
  posted_at timestamptz NOT NULL DEFAULT now(),
  reversed_by_id uuid NULL REFERENCES journal_entry(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE journal_entry_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entry(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounting_account(id),
  entry_type text NOT NULL,
  amount numeric(18,2) NOT NULL,
  memo text NULL
);

-- ========== Audit ==========
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  user_id uuid NULL REFERENCES app_user(id),
  action text NOT NULL,
  entity_type text NULL,
  entity_id text NULL,
  success boolean NOT NULL DEFAULT true,
  ip text NULL,
  user_agent text NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

