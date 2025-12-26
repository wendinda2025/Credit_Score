# 📚 Concepts Clés de la Microfinance

Guide complet des concepts financiers et métier implémentés dans la plateforme.

## Table des Matières

1. [Qu'est-ce que la Microfinance ?](#quest-ce-que-la-microfinance)
2. [Types de Clients](#types-de-clients)
3. [Produits Financiers](#produits-financiers)
4. [Prêts et Crédits](#prêts-et-crédits)
5. [Épargne](#épargne)
6. [Comptabilité](#comptabilité)
7. [Indicateurs de Performance](#indicateurs-de-performance)

---

## Qu'est-ce que la Microfinance ?

La **microfinance** désigne l'offre de services financiers (prêts, épargne, assurance) aux populations à faibles revenus, souvent exclues du système bancaire traditionnel.

### Objectifs

- ✅ Inclusion financière
- ✅ Lutte contre la pauvreté
- ✅ Développement économique local
- ✅ Autonomisation (surtout des femmes)

### Caractéristiques

- **Montants faibles** (microcrédits)
- **Garanties alternatives** (caution solidaire)
- **Accompagnement rapproché**
- **Flexibilité des remboursements**

---

## Types de Clients

### 1. Personnes Physiques (INDIVIDUAL)

**Description :** Clients individuels, souvent microentrepreneurs.

**Exemples :**
- Vendeuse au marché
- Artisan
- Petit commerçant

**Données collectées (KYC) :**
- Identité (nom, prénom, date de naissance)
- Pièce d'identité
- Adresse
- Activité économique
- Photo

### 2. Groupes Solidaires (GROUP)

**Description :** Groupe de personnes qui se portent mutuellement caution.

**Principe :**
- 5 à 20 membres
- Caution solidaire (si un membre ne paie pas, les autres compensent)
- Meetings réguliers
- Pression sociale positive

**Avantages :**
- Réduction du risque pour l'institution
- Pas de garantie matérielle nécessaire
- Taux d'intérêt plus bas

### 3. Micro-Entreprises (BUSINESS)

**Description :** Petites entreprises formelles ou informelles.

**Exemples :**
- Boutique
- Atelier de couture
- Salon de coiffure

**Documents requis :**
- Registre de commerce (si formel)
- États financiers
- Plan d'affaires

---

## Produits Financiers

### Produits de Prêt

Un **produit de prêt** est un modèle configurable qui définit les conditions d'octroi de crédit.

#### Paramètres d'un Produit

```typescript
{
  name: "Prêt Micro-Entreprise",
  minPrincipal: 50000,          // Montant minimum
  maxPrincipal: 2000000,         // Montant maximum
  interestRate: 15,              // Taux d'intérêt annuel (%)
  minInstallments: 3,            // Nombre minimum d'échéances
  maxInstallments: 24,           // Nombre maximum d'échéances
  repaymentFrequency: "MONTHLY", // Fréquence de remboursement
  interestMethod: "DECLINING_BALANCE", // Méthode de calcul
  penaltyRate: 2,                // Pénalité en cas de retard (%)
  fees: 5000                     // Frais de dossier
}
```

### Produits d'Épargne

Un **produit d'épargne** définit les conditions d'un compte d'épargne.

#### Paramètres

```typescript
{
  name: "Compte Épargne Classique",
  productType: "SAVINGS",
  interestRate: 3,               // Taux d'intérêt créditeur annuel (%)
  minBalance: 5000,              // Solde minimum à maintenir
  minOpeningBalance: 10000,      // Montant minimum pour ouvrir
  withdrawalFee: 500,            // Frais par retrait
  monthlyMaintenanceFee: 200,    // Frais mensuels
  maxWithdrawalsPerMonth: 4      // Limite de retraits
}
```

---

## Prêts et Crédits

### Cycle de Vie d'un Prêt

```
PENDING (En attente)
    ↓
    ↓ [Approbation]
    ↓
APPROVED (Approuvé)
    ↓
    ↓ [Décaissement]
    ↓
ACTIVE (Actif)
    ↓
    ↓ [Remboursements complets]
    ↓
CLOSED (Clôturé)

[Rejet possible à partir de PENDING → REJECTED]
```

### Méthodes de Calcul d'Intérêt

#### 1. Taux Forfaitaire (FLAT)

**Principe :** Les intérêts sont calculés sur le montant initial pendant toute la durée.

**Formule :**
```
Intérêt total = Principal × Taux × Durée
Intérêt par période = Intérêt total / Nombre d'échéances
```

**Exemple :**
```
Principal : 100 000 FCFA
Taux : 15% par an
Durée : 12 mois

Intérêt total = 100 000 × 0.15 = 15 000 FCFA
Intérêt par mois = 15 000 / 12 = 1 250 FCFA
Principal par mois = 100 000 / 12 = 8 333 FCFA

Échéance mensuelle = 8 333 + 1 250 = 9 583 FCFA
```

**Avantages :**
- Simple à comprendre
- Montant fixe chaque mois
- Facile à planifier

**Inconvénients :**
- TEG (Taux Effectif Global) plus élevé
- Moins équitable (on paie des intérêts sur un capital déjà remboursé)

#### 2. Taux Dégressif (DECLINING_BALANCE)

**Principe :** Les intérêts sont calculés sur le solde restant dû.

**Formule d'annuité :**
```
PMT = P × [r(1+r)^n] / [(1+r)^n - 1]

Où :
P = Principal
r = Taux périodique (taux annuel / nombre de périodes par an)
n = Nombre total de périodes
```

**Exemple :**
```
Principal : 100 000 FCFA
Taux : 15% par an (1.25% par mois)
Durée : 12 mois

Mois 1:
  Intérêt = 100 000 × 0.0125 = 1 250 FCFA
  Principal = PMT - 1 250
  
Mois 2:
  Solde restant = 100 000 - Principal mois 1
  Intérêt = Solde restant × 0.0125
  (diminue chaque mois)
```

**Avantages :**
- Plus équitable
- TEG réel = taux annoncé
- Économie d'intérêts

**Inconvénients :**
- Calcul plus complexe
- Échéances peuvent varier légèrement

### Calendrier d'Amortissement

Le **calendrier d'amortissement** (repayment schedule) détaille chaque échéance :

```typescript
[
  {
    installmentNumber: 1,
    dueDate: "2024-02-01",
    principalDue: 8333,
    interestDue: 1250,
    feesDue: 0,
    penaltyDue: 0,
    total: 9583,
    principalBalance: 91667
  },
  {
    installmentNumber: 2,
    dueDate: "2024-03-01",
    principalDue: 8333,
    interestDue: 1250,
    feesDue: 0,
    penaltyDue: 0,
    total: 9583,
    principalBalance: 83334
  },
  // ... jusqu'à l'échéance 12
]
```

### Remboursements

#### Priorité d'Application

Quand un client effectue un paiement, il est appliqué dans cet ordre :

1. **Pénalités** (le plus important)
2. **Intérêts**
3. **Frais**
4. **Principal**

**Exemple :**

```
Paiement de 5 000 FCFA sur une échéance de :
- Pénalités : 1 000 FCFA
- Intérêts : 2 000 FCFA
- Frais : 500 FCFA
- Principal : 8 000 FCFA

Application :
1. Pénalités : 1 000 FCFA payé ✓
2. Intérêts : 2 000 FCFA payé ✓
3. Frais : 500 FCFA payé ✓
4. Principal : 1 500 FCFA payé (reste 6 500 FCFA dû)

Statut de l'échéance : PARTIAL (partiellement payé)
```

### Pénalités de Retard

**Calcul :**
```
Pénalité = Montant en retard × Taux de pénalité × Jours de retard / 365
```

**Exemple :**
```
Montant en retard : 10 000 FCFA
Taux de pénalité : 2% par an
Jours de retard : 30 jours

Pénalité = 10 000 × 0.02 × 30 / 365 = 16.44 FCFA
```

### Rééchelonnement

Le **rééchelonnement** (restructuration) consiste à modifier les conditions d'un prêt en cours :

- Augmenter la durée
- Modifier le taux d'intérêt
- Recalculer le calendrier

**Quand ?**
- Client en difficulté financière temporaire
- Éviter un défaut de paiement
- Préserver la relation client

**Processus :**
1. Calculer le solde restant dû
2. Définir les nouvelles conditions
3. Annuler les échéances futures
4. Générer un nouveau calendrier
5. Créer une nouvelle échéance de paiement

---

## Épargne

### Comptes d'Épargne

#### Types

1. **Compte Épargne Classique (SAVINGS)**
   - Retraits libres (avec limites)
   - Intérêts créditeurs
   - Solde minimum requis

2. **Compte à Terme (FIXED_DEPOSIT)**
   - Durée fixe (ex: 12 mois)
   - Taux d'intérêt plus élevé
   - Pénalités en cas de retrait anticipé

3. **Compte Courant (CURRENT_ACCOUNT)**
   - Pour les transactions quotidiennes
   - Pas d'intérêts
   - Peut avoir un découvert autorisé

#### Calcul des Intérêts Créditeurs

**Méthode du solde quotidien moyen :**

```
Intérêt = (Solde × Taux annuel × Jours) / 365
```

**Exemple :**
```
Solde : 50 000 FCFA
Taux : 3% par an
Période : 30 jours

Intérêt = (50 000 × 0.03 × 30) / 365 = 123.29 FCFA
```

**Fréquence d'affectation :**
- Calcul : quotidien ou mensuel
- Affectation (posting) : mensuelle, trimestrielle ou annuelle

---

## Comptabilité

### Principe de la Partie Double

**Règle fondamentale :** Pour chaque transaction, le total des débits doit égaler le total des crédits.

```
DÉBIT = CRÉDIT (toujours !)
```

#### Types de Comptes

| Type | Débit | Crédit |
|------|-------|--------|
| **ACTIF** (ce que possède l'institution) | Augmente | Diminue |
| **PASSIF** (ce que doit l'institution) | Diminue | Augmente |
| **CAPITAUX PROPRES** (fonds propres) | Diminue | Augmente |
| **REVENUS** (produits) | Diminue | Augmente |
| **CHARGES** (dépenses) | Augmente | Diminue |

### Exemples d'Écritures Comptables

#### 1. Décaissement d'un Prêt (100 000 FCFA)

```
Débit:  Prêts aux clients (ACTIF)         100 000 FCFA
Crédit: Caisse (ACTIF)                    100 000 FCFA

Explication :
- L'institution "perd" de l'argent en caisse (diminue un actif = crédit)
- Mais acquiert une créance sur le client (augmente un actif = débit)
```

#### 2. Remboursement de Prêt (10 000 FCFA dont 1 250 FCFA d'intérêts)

```
Débit:  Caisse (ACTIF)                      10 000 FCFA
Crédit: Prêts aux clients (ACTIF)            8 750 FCFA
Crédit: Produits d'intérêts (REVENUS)        1 250 FCFA

Explication :
- La caisse augmente (augmente un actif = débit)
- La créance diminue (diminue un actif = crédit)
- On enregistre un revenu d'intérêts (augmente un revenu = crédit)
```

#### 3. Dépôt d'Épargne (20 000 FCFA)

```
Débit:  Caisse (ACTIF)                      20 000 FCFA
Crédit: Comptes d'épargne clients (PASSIF)  20 000 FCFA

Explication :
- La caisse augmente (augmente un actif = débit)
- L'institution doit cet argent au client (augmente un passif = crédit)
```

#### 4. Paiement d'Intérêts sur Épargne (123 FCFA)

```
Débit:  Charges d'intérêts (CHARGES)          123 FCFA
Crédit: Comptes d'épargne clients (PASSIF)    123 FCFA

Explication :
- L'institution paye des intérêts (augmente une charge = débit)
- Le solde du compte client augmente (augmente un passif = crédit)
```

### États Financiers

#### 1. Balance Générale (Trial Balance)

Liste de tous les comptes avec leurs soldes débiteurs et créditeurs.

```
Compte                          Débit       Crédit
─────────────────────────────────────────────────
100 - Caisse                   500 000            
200 - Prêts aux clients      3 000 000            
400 - Comptes d'épargne                 1 500 000
500 - Capital social                    1 000 000
700 - Produits d'intérêts                 850 000
800 - Charges d'intérêts        150 000            
─────────────────────────────────────────────────
TOTAUX                       3 650 000   3 350 000

❌ PAS ÉQUILIBRÉ ! Il y a une erreur.
```

#### 2. Grand Livre (General Ledger)

Détail de toutes les écritures pour un compte donné.

```
Compte : 200 - Prêts aux clients

Date       | Libellé              | Débit    | Crédit   | Solde
─────────────────────────────────────────────────────────────
01/01/2024 | Solde d'ouverture   |          |          | 2 500 000
05/01/2024 | Décaissement prêt   | 100 000  |          | 2 600 000
10/01/2024 | Remboursement       |          | 8 750    | 2 591 250
15/01/2024 | Décaissement prêt   | 200 000  |          | 2 791 250
...
```

#### 3. Compte de Résultat (Income Statement)

Revenus - Charges = Résultat Net

```
COMPTE DE RÉSULTAT
Du 01/01/2024 au 31/12/2024

REVENUS
  Produits d'intérêts sur prêts      850 000 FCFA
  Produits de frais                  120 000 FCFA
  Produits de pénalités               30 000 FCFA
  ─────────────────────────────────────────────
  Total Revenus                    1 000 000 FCFA

CHARGES
  Charges d'intérêts sur épargne    (150 000) FCFA
  Frais de personnel                (300 000) FCFA
  Frais administratifs              (100 000) FCFA
  ─────────────────────────────────────────────
  Total Charges                     (550 000) FCFA

RÉSULTAT NET                         450 000 FCFA
```

#### 4. Bilan (Balance Sheet)

Photographie de la situation financière à une date donnée.

```
BILAN au 31/12/2024

ACTIF                                    PASSIF
─────────────────────────────────────────────────────────
Caisse              500 000   | Comptes épargne  1 500 000
Banque              800 000   | Fournisseurs       200 000
Prêts clients     3 000 000   | Capital social   1 000 000
                              | Résultats         1 600 000
─────────────────────────────────────────────────────────
TOTAL            4 300 000   | TOTAL            4 300 000

✅ ÉQUILIBRÉ : Actif = Passif
```

---

## Indicateurs de Performance

### PAR (Portfolio at Risk)

**Définition :** Pourcentage du portefeuille de prêts en situation de retard.

**Formule :**
```
PAR X = (Solde des prêts avec au moins une échéance en retard de X jours / Encours total) × 100
```

**Exemple :**
```
Encours total : 10 000 000 FCFA
Prêts en retard > 30 jours : 350 000 FCFA

PAR 30 = (350 000 / 10 000 000) × 100 = 3.5%
```

**Interprétation :**
- PAR < 5% : Excellent
- PAR 5-10% : Acceptable
- PAR > 10% : Préoccupant
- PAR > 20% : Critique

### Taux de Remboursement

**Formule :**
```
Taux = (Montant remboursé / Montant dû) × 100
```

**Exemple :**
```
Montant dû ce mois : 5 000 000 FCFA
Montant remboursé : 4 750 000 FCFA

Taux de remboursement = (4 750 000 / 5 000 000) × 100 = 95%
```

### Taux d'Utilisation du Portefeuille

**Formule :**
```
Taux = (Encours de prêts / Capacité de prêt) × 100
```

Indique si l'institution utilise bien ses ressources.

### Ratio de Liquidité

**Formule :**
```
Ratio = Actifs liquides / Passifs à court terme
```

Mesure la capacité à honorer les retraits d'épargne.

### ROE (Return on Equity)

**Formule :**
```
ROE = (Résultat net / Capitaux propres) × 100
```

Mesure la rentabilité pour les actionnaires/investisseurs.

---

## Glossaire

- **Amortissement** : Remboursement progressif du principal d'un prêt
- **Capital** : Montant initial du prêt (principal)
- **Collatéral** : Garantie matérielle pour un prêt
- **Décaissement** : Versement des fonds au client
- **Échéance** : Date de paiement d'une mensualité
- **Encours** : Montant total des prêts actifs
- **Groupe solidaire** : Groupe de personnes se cautionnant mutuellement
- **KYC** (Know Your Customer) : Connaissance du client
- **Mensualité** : Paiement mensuel
- **Mora** : Retard de paiement
- **Pénalité** : Frais en cas de retard
- **Principal** : Capital emprunté (hors intérêts)
- **Provision** : Réserve pour créances douteuses
- **Rééchelonnement** : Modification des conditions de remboursement
- **TEG** : Taux Effectif Global (coût réel du crédit)

---

**Ces concepts sont au cœur du système. Une bonne compréhension garantit une implémentation correcte et complète.**
