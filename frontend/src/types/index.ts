/**
 * Types TypeScript pour l'application
 */

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  phone?: string
  role: UserRole
  is_active: boolean
  is_superuser: boolean
  agency?: string
  created_at: string
  last_login?: string
}

export enum UserRole {
  ADMIN = 'admin',
  AGENT_CREDIT = 'agent_credit',
  RISK_OFFICER = 'risk_officer',
  CHEF_AGENCE = 'chef_agence',
  COMITE_CREDIT = 'comite_credit',
  CONSULTANT = 'consultant',
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Client {
  id: number
  client_number: string
  first_name: string
  last_name: string
  gender: Gender
  date_of_birth?: string
  id_type?: string
  id_number?: string
  phone_mobile?: string
  phone_fixed?: string
  email?: string
  address?: string
  city?: string
  sector?: string
  marital_status?: MaritalStatus
  profession?: string
  agency?: string
  created_at: string
  updated_at: string
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum MaritalStatus {
  MARRIED = 'married',
  SINGLE = 'single',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  COHABITING = 'cohabiting',
}

export interface CreditApplication {
  id: number
  application_number: string
  client_id: number
  agent_id: number
  application_date: string
  requested_amount: number
  duration_months: number
  payment_frequency: PaymentFrequency
  credit_purpose: string
  business_name?: string
  activity_sector?: ActivitySector
  status: ApplicationStatus
  agent_recommended_amount?: number
  risk_officer_recommended_amount?: number
  chef_agence_recommended_amount?: number
  approved_amount?: number
  created_at: string
  updated_at: string
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  POSTPONED = 'postponed',
  DISBURSED = 'disbursed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

export enum ActivitySector {
  PRODUCTION = 'production',
  SERVICE = 'service',
  COMMERCE = 'commerce',
}

export interface FinancialAnalysis {
  id: number
  credit_application_id: number
  family_total: number
  total_monthly_sales: number
  total_monthly_cogs: number
  gross_margin: number
  gross_margin_percentage: number
  total_operating_expenses: number
  net_profit: number
  monthly_cash_flow: number
  annual_cash_available: number
  debt_service_capacity: number
  liquidity_ratio: number
  debt_ratio: number
  profitability_ratio: number
  coverage_ratio: number
  net_worth: number
  created_at: string
  updated_at: string
}

export interface Approval {
  id: number
  credit_application_id: number
  reviewer_id: number
  approval_level: ApprovalLevel
  decision: ApprovalDecision
  recommended_amount?: number
  comments?: string
  created_at: string
  reviewed_at?: string
}

export enum ApprovalLevel {
  AGENT_CREDIT = 'agent_credit',
  RISK_OFFICER = 'risk_officer',
  CHEF_AGENCE = 'chef_agence',
  COMITE_CREDIT = 'comite_credit',
}

export enum ApprovalDecision {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  POSTPONED = 'postponed',
}

export interface ApiError {
  detail: string
  errors?: Array<{
    field: string
    message: string
    type: string
  }>
}

export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface DashboardStats {
  total_applications: number
  pending_applications: number
  approved_applications: number
  rejected_applications: number
  total_amount_requested: number
  total_amount_approved: number
  approval_rate: number
}
