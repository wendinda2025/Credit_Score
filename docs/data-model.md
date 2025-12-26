## Modèle de données (PostgreSQL via Prisma)

Source de vérité: `backend/prisma/schema.prisma`.

### Entités principales

- **Organization**: future multi-tenancy (MFI), devise/langue par défaut.
- **Office**: structure d’agences (arbre) pour gestion opérationnelle.
- **User / Role / UserRole / RefreshToken**: IAM (RBAC) + refresh token révoquable.
- **Client** + profils:
  - `IndividualClientProfile`
  - `GroupClientProfile`
  - `BusinessClientProfile`
  - `KycDocument`
- **LoanProduct**: paramètres prêts.
- **LoanAccount**: contrat/dossier prêt.
- **LoanScheduleInstallment**: échéancier (principal/intérêt, paiements, statut).
- **LoanTransaction**: mouvements prêt (décaissement, remboursement...).
- **SavingsProduct / SavingsAccount / SavingsTransaction**: épargne.
- **AccountingAccount**: plan comptable (arborescent).
- **JournalEntry / JournalEntryLine**: journaux + lignes (partie double).
- **AccountingRule / AccountingRuleLine**: règles d’imputation automatiques par événement.
- **AuditLog**: journal d’audit (auth, actions critiques).

### Conventions financières

- Tous les montants sont en `DECIMAL(18,2)` (ou `DECIMAL(9,6)` pour les taux).
- Les écritures comptables sont validées en **partie double** (débit == crédit).
- Les flux sont paramétrés via `AccountingRule*` (éviter les “codes en dur”).

