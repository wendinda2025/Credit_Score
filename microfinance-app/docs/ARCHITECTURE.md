# Architecture de la Plateforme de Microfinance

## Vue d'ensemble

Cette application suit une architecture modulaire hexagonale (ports & adapters) avec séparation claire des responsabilités.

## Architecture technique

### Backend (NestJS)

```
src/
├── common/              # Code partagé
│   ├── decorators/      # Décorateurs personnalisés (@Public, @Roles, etc.)
│   ├── filters/         # Filtres d'exception globaux
│   ├── guards/          # Guards d'authentification et autorisation
│   ├── interceptors/    # Intercepteurs de transformation
│   ├── pipes/           # Pipes de validation
│   └── dto/             # DTOs communs (PaginationDto, etc.)
│
├── config/              # Configuration
│
├── modules/             # Modules métier
│   ├── auth/            # Authentification JWT
│   ├── users/           # Gestion des utilisateurs
│   ├── clients/         # Gestion des clients
│   ├── loans/           # Gestion des prêts
│   │   └── services/
│   │       └── amortization.service.ts  # Calcul d'amortissement
│   ├── savings/         # Gestion de l'épargne
│   ├── accounting/      # Comptabilité
│   ├── reports/         # Reporting
│   ├── audit/           # Audit et journalisation
│   └── organizations/  # Organisations et bureaux
│
└── prisma/              # Service Prisma (ORM)
```

## Modèle de données

### Entités principales

1. **Organization** : Organisation multi-tenant
2. **Office** : Bureaux d'une organisation
3. **User** : Utilisateurs du système
4. **Role** : Rôles avec permissions
5. **Client** : Clients (personnes, groupes, entreprises)
6. **LoanProduct** : Produits de prêts
7. **Loan** : Prêts individuels
8. **LoanInstallment** : Échéances de remboursement
9. **LoanRepayment** : Remboursements effectués
10. **SavingsProduct** : Produits d'épargne
11. **SavingsAccount** : Comptes d'épargne
12. **SavingsTransaction** : Transactions d'épargne
13. **ChartOfAccount** : Plan comptable
14. **JournalEntry** : Écritures comptables
15. **Transaction** : Transactions générales
16. **AuditLog** : Journal d'audit

### Relations clés

- **Multi-tenant** : Toutes les entités sont liées à une Organization
- **Hiérarchie** : Organization → Office → Users/Clients
- **Prêts** : Client → Loan → LoanInstallment → LoanRepayment
- **Épargne** : Client → SavingsAccount → SavingsTransaction
- **Comptabilité** : ChartOfAccount → JournalEntry (débit/crédit)

## Flux de données

### Cycle de vie d'un prêt

```
1. Création du produit de prêt (LoanProduct)
   ↓
2. Création de la demande de prêt (Loan) - Statut: PENDING
   ↓
3. Calcul automatique du calendrier d'amortissement (LoanInstallment[])
   ↓
4. Approbation (Loan) - Statut: APPROVED
   ↓
5. Décaissement (Loan) - Statut: DISBURSED
   → Création des écritures comptables
   ↓
6. Remboursements (LoanRepayment)
   → Mise à jour des échéances (LoanInstallment)
   → Création des écritures comptables
   ↓
7. Clôture (Loan) - Statut: CLOSED
```

### Calcul d'amortissement

Deux méthodes supportées :

1. **Dégressif (DECLINING)** : Méthode la plus courante en microfinance
   - Calcul basé sur le solde restant
   - Formule d'annuité constante

2. **Taux fixe (FLAT)** : Intérêt simple
   - Intérêt calculé sur le montant initial
   - Principal divisé en parts égales

## Sécurité

### Authentification
- JWT avec expiration
- Refresh tokens (à implémenter)
- Hachage bcrypt pour les mots de passe

### Autorisation
- RBAC (Role-Based Access Control)
- Permissions granulaires par rôle
- Guards NestJS pour protéger les routes

### Audit
- Journalisation complète de toutes les actions critiques
- Traçabilité des modifications
- Conformité réglementaire

## Comptabilité

### Principe de la partie double
Chaque écriture comptable doit avoir :
- Un compte débit
- Un compte crédit
- Montant égal (débit = crédit)

### Écritures automatiques
- **Décaissement de prêt** :
  - Débit : Portefeuille de prêts
  - Crédit : Caisse

- **Remboursement de prêt** :
  - Débit : Caisse
  - Crédit : Portefeuille de prêts (principal)
  - Crédit : Revenus d'intérêts (intérêts)

- **Dépôt épargne** :
  - Débit : Caisse
  - Crédit : Dépôts clients

- **Retrait épargne** :
  - Débit : Dépôts clients
  - Crédit : Caisse

## Reporting

### Indicateurs clés

1. **PAR (Portfolio at Risk)**
   ```
   PAR = (Montant des prêts en retard / Montant total du portefeuille) × 100
   ```

2. **Taux de remboursement**
   ```
   Taux = (Montant remboursé / Montant dû) × 100
   ```

3. **Encours**
   ```
   Encours = Somme des montants principaux des prêts actifs
   ```

## Extensibilité

### Points d'extension

1. **Nouveaux types de produits** : Ajouter dans LoanProduct/SavingsProduct
2. **Nouvelles méthodes d'amortissement** : Étendre AmortizationService
3. **Nouveaux rapports** : Ajouter dans ReportsService
4. **Intégrations externes** : Créer de nouveaux modules d'intégration
5. **Notifications** : Module de notifications (SMS, Email)

## Performance

### Optimisations

- Index sur les colonnes fréquemment interrogées
- Pagination sur les listes
- Requêtes optimisées avec Prisma
- Cache Redis (à implémenter)

### Scalabilité

- Architecture modulaire pour déploiement distribué
- Base de données PostgreSQL scalable
- Support multi-tenant natif

## Tests

### Stratégie de test

1. **Tests unitaires** : Services métier
2. **Tests d'intégration** : Modules complets
3. **Tests e2e** : Flux complets utilisateur

### Couverture cible

- Services métier : >80%
- Controllers : >60%
- Utilitaires : >90%

## Déploiement

### Environnements

1. **Development** : Local avec Docker Compose
2. **Staging** : Environnement de test
3. **Production** : Environnement réel avec haute disponibilité

### Configuration

- Variables d'environnement pour tous les paramètres sensibles
- Secrets gérés via gestionnaire de secrets
- Configuration par environnement

## Conformité

### Réglementaire

- Traçabilité complète (audit trail)
- Principe de la partie double respecté
- Journalisation des actions critiques
- Conformité PCI-DSS (logique applicative)

### Métier

- Validation stricte des règles métier
- Transactions atomiques
- Gestion des erreurs métier
- Intégrité référentielle
