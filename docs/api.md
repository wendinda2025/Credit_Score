## API REST (socle)

Swagger est exposé sur `GET /api` quand le backend tourne.

### IAM

- `POST /iam/bootstrap` (public): initialise organisation + rôles + admin.
- `POST /iam/login` (public)
- `POST /iam/refresh` (public)
- `POST /iam/logout` (auth)
- `GET /iam/me` (auth)

### Utilisateurs (RBAC)

- `GET /users` (Admin)
- `POST /users` (Admin)

### Clients

- `POST /clients/individual` (Admin|AgentCredit)
- `POST /clients/group` (Admin|AgentCredit)
- `POST /clients/business` (Admin|AgentCredit)
- `GET /clients` (auth)
- `GET /clients/:id` (auth)
- `PATCH /clients/:id/status` (Admin|AgentCredit)
- `POST /clients/:id/kyc` (Admin|AgentCredit)

### Produits de prêts

- `POST /loan-products` (Admin)
- `GET /loan-products` (auth)

### Prêts

- `POST /loans` (Admin|AgentCredit) : soumission
- `POST /loans/:id/approve` (Admin|AgentCredit)
- `POST /loans/:id/disburse` (Admin|AgentCredit) + génération échéancier + écriture comptable
- `POST /loans/:id/repay` (Admin|Caissier) + imputation échéancier + écriture comptable
- `GET /loans` (auth)
- `GET /loans/:id` (auth)

### Produits d’épargne

- `POST /savings-products` (Admin)
- `GET /savings-products` (auth)

### Épargne

- `POST /savings` (Admin|Caissier|AgentCredit) : ouverture compte
- `POST /savings/:id/deposit` (Admin|Caissier)
- `POST /savings/:id/withdraw` (Admin|Caissier)
- `GET /savings` (auth)
- `GET /savings/:id` (auth)

### Comptabilité

- `GET /accounting/accounts` (auth)
- `POST /accounting/accounts` (Admin)
- `PUT /accounting/rules` (Admin)
- `GET /accounting/rules/:eventType` (auth)
- `POST /accounting/journals` (Admin|Auditeur)
- `GET /accounting/trial-balance` (auth)

### Audit

- `GET /audit/logs` (Admin|Auditeur)

### Reporting

- `GET /reports/kpis` (auth)

