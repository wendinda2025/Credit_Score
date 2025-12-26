# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à la plateforme de microfinance ! Ce document vous guide à travers le processus de contribution.

---

## 📋 Table des Matières

1. [Code de Conduite](#code-de-conduite)
2. [Comment Contribuer](#comment-contribuer)
3. [Configuration de l'Environnement](#configuration-de-lenvironnement)
4. [Standards de Code](#standards-de-code)
5. [Processus de Pull Request](#processus-de-pull-request)
6. [Types de Contributions](#types-de-contributions)
7. [Reporting de Bugs](#reporting-de-bugs)
8. [Suggestions de Fonctionnalités](#suggestions-de-fonctionnalités)

---

## Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- ✅ Soyez respectueux envers tous les contributeurs
- ✅ Acceptez les critiques constructives
- ✅ Concentrez-vous sur ce qui est le mieux pour la communauté
- ✅ Faites preuve d'empathie envers les autres membres

---

## Comment Contribuer

### 1. Fork le Projet

```bash
# Cliquez sur "Fork" sur GitHub
# Puis clonez votre fork
git clone https://github.com/VOTRE-USERNAME/microfinance-app.git
cd microfinance-app
```

### 2. Créer une Branche

```bash
# Créez une branche pour votre fonctionnalité
git checkout -b feature/ma-super-fonctionnalite

# Ou pour un bug fix
git checkout -b fix/correction-bug-xyz
```

### 3. Faire vos Modifications

Suivez les [standards de code](#standards-de-code) ci-dessous.

### 4. Commit vos Changements

```bash
git add .
git commit -m "feat: ajout de la fonctionnalité X"

# Suivez les conventions de commit (voir ci-dessous)
```

### 5. Push vers votre Fork

```bash
git push origin feature/ma-super-fonctionnalite
```

### 6. Ouvrir une Pull Request

- Allez sur GitHub
- Cliquez sur "New Pull Request"
- Remplissez le template de PR
- Attendez la review

---

## Configuration de l'Environnement

### Prérequis

- Node.js 18+
- PostgreSQL 15+
- npm 9+
- Git

### Installation

```bash
# Cloner le projet
git clone https://github.com/votre-org/microfinance-app.git
cd microfinance-app/backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Créer la base de données
createdb microfinance

# Lancer les migrations
npm run prisma:migrate

# Charger les données de test
npm run prisma:seed

# Démarrer en mode développement
npm run start:dev
```

### Vérifier l'Installation

```bash
# L'API devrait être accessible sur http://localhost:3000
curl http://localhost:3000

# La doc Swagger sur http://localhost:3000/api/docs
```

---

## Standards de Code

### TypeScript

- ✅ Utilisez TypeScript strict mode
- ✅ Typez toutes les fonctions et variables
- ✅ Évitez `any` (utilisez `unknown` si nécessaire)
- ✅ Utilisez les interfaces pour les objets complexes

```typescript
// ✅ BON
interface User {
  id: string;
  email: string;
  role: UserRole;
}

async function getUser(id: string): Promise<User> {
  // ...
}

// ❌ MAUVAIS
function getUser(id: any): any {
  // ...
}
```

### Conventions de Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| **Fichiers** | kebab-case | `loan-product.service.ts` |
| **Classes** | PascalCase | `LoansService` |
| **Interfaces** | PascalCase | `CreateLoanDto` |
| **Fonctions** | camelCase | `calculateAmortization()` |
| **Variables** | camelCase | `totalAmount` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_LOAN_AMOUNT` |
| **Enums** | PascalCase | `LoanStatus` |

### Structure des Fichiers

```typescript
// 1. Imports externes
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 2. Imports internes
import { CreateLoanDto } from './dto/loan.dto';

// 3. Classe avec décorateur
@Injectable()
export class LoansService {
  // 4. Constructeur
  constructor(private readonly prisma: PrismaService) {}

  // 5. Méthodes publiques
  async create(dto: CreateLoanDto) {
    // ...
  }

  // 6. Méthodes privées
  private async validate(data: any) {
    // ...
  }
}
```

### Commentaires

```typescript
/**
 * Calcule le calendrier d'amortissement d'un prêt
 * 
 * @param principal Montant du prêt
 * @param rate Taux d'intérêt annuel (en %)
 * @param installments Nombre d'échéances
 * @returns Tableau des échéances
 */
calculateSchedule(
  principal: number,
  rate: number,
  installments: number,
): RepaymentScheduleItem[] {
  // Implémentation...
}
```

### Validation

- ✅ Utilisez `class-validator` pour les DTOs
- ✅ Validez tous les inputs utilisateur
- ✅ Messages d'erreur clairs en français

```typescript
export class CreateLoanDto {
  @IsString()
  @IsNotEmpty({ message: 'Le client est requis' })
  clientId: string;

  @IsNumber()
  @Min(0, { message: 'Le montant doit être positif' })
  principalAmount: number;
}
```

### Gestion des Erreurs

```typescript
// ✅ BON
if (!loan) {
  throw new NotFoundException(`Prêt #${id} introuvable`);
}

// ❌ MAUVAIS
if (!loan) {
  throw new Error('Not found');
}
```

### Tests

Chaque fonctionnalité doit avoir des tests :

```typescript
describe('LoansService', () => {
  describe('create', () => {
    it('should create a loan application', async () => {
      const dto = { /* ... */ };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.status).toBe('PENDING');
    });

    it('should throw error if client not found', async () => {
      const dto = { clientId: 'invalid' };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Processus de Pull Request

### Avant de Soumettre

- [ ] Le code compile sans erreur (`npm run build`)
- [ ] Les tests passent (`npm run test`)
- [ ] Le linting passe (`npm run lint`)
- [ ] La documentation est à jour
- [ ] Les commits suivent les conventions

### Template de PR

Utilisez ce template pour vos Pull Requests :

```markdown
## Description

Décrivez brièvement les changements apportés.

## Type de Changement

- [ ] Bug fix (changement qui corrige un problème)
- [ ] Nouvelle fonctionnalité (changement qui ajoute une fonctionnalité)
- [ ] Breaking change (changement qui casse la compatibilité)
- [ ] Documentation

## Comment Tester

Décrivez les étapes pour tester vos changements :

1. Faire X
2. Faire Y
3. Vérifier que Z

## Checklist

- [ ] Mon code suit les standards du projet
- [ ] J'ai commenté les parties complexes
- [ ] J'ai mis à jour la documentation
- [ ] J'ai ajouté des tests
- [ ] Tous les tests passent
- [ ] Le build fonctionne sans warning

## Screenshots (si applicable)

Ajoutez des captures d'écran si pertinent.
```

### Review Process

1. Soumettez votre PR
2. Un mainteneur reviewera sous 48h
3. Répondez aux commentaires
4. Faites les modifications demandées
5. Une fois approuvé, votre PR sera mergée

---

## Types de Contributions

### 🐛 Bug Fixes

Corrections de bugs dans le code existant.

**Exemples :**
- Correction d'un calcul d'intérêt
- Fix d'une validation manquante
- Correction d'une erreur de typage

**Branch naming :** `fix/description-du-bug`

### ✨ Nouvelles Fonctionnalités

Ajout de nouvelles fonctionnalités.

**Exemples :**
- Module de gestion des garanties
- Intégration SMS
- Export PDF des rapports

**Branch naming :** `feature/nom-de-la-fonctionnalite`

### 📚 Documentation

Amélioration de la documentation.

**Exemples :**
- Corrections de typos
- Ajout d'exemples
- Traduction
- Diagrammes

**Branch naming :** `docs/description`

### 🎨 Refactoring

Amélioration du code sans changer le comportement.

**Exemples :**
- Optimisation de performance
- Simplification du code
- Amélioration de la structure

**Branch naming :** `refactor/description`

### 🧪 Tests

Ajout ou amélioration des tests.

**Branch naming :** `test/description`

---

## Reporting de Bugs

### Avant de Reporter

1. Vérifiez que le bug n'a pas déjà été reporté
2. Assurez-vous d'utiliser la dernière version
3. Essayez de reproduire le bug

### Template de Bug Report

```markdown
**Description du Bug**
Description claire et concise du bug.

**Reproduction**
Étapes pour reproduire :
1. Aller sur '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement Attendu**
Ce qui devrait se passer normalement.

**Comportement Actuel**
Ce qui se passe actuellement.

**Screenshots**
Si applicable, ajoutez des captures d'écran.

**Environnement**
- OS : [e.g. Ubuntu 22.04]
- Node.js : [e.g. 18.17.0]
- PostgreSQL : [e.g. 15.3]
- Version du projet : [e.g. 1.0.0]

**Contexte Additionnel**
Toute autre information pertinente.
```

---

## Suggestions de Fonctionnalités

### Template de Feature Request

```markdown
**Problème à Résoudre**
Description claire du problème que cette fonctionnalité résoudrait.

**Solution Proposée**
Description de la solution que vous aimeriez voir.

**Alternatives Considérées**
Autres solutions que vous avez envisagées.

**Contexte Additionnel**
Screenshots, mockups, liens vers des exemples, etc.

**Priorité**
- [ ] Basse
- [ ] Moyenne
- [ ] Haute
- [ ] Critique
```

---

## Conventions de Commit

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description | Exemple |
|------|-------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat(loans): add reschedule feature` |
| `fix` | Correction de bug | `fix(auth): correct token validation` |
| `docs` | Documentation | `docs(readme): update installation steps` |
| `style` | Formatage (pas de changement de code) | `style: format with prettier` |
| `refactor` | Refactoring | `refactor(loans): simplify calculation logic` |
| `test` | Ajout de tests | `test(loans): add amortization tests` |
| `chore` | Maintenance | `chore: update dependencies` |
| `perf` | Amélioration de performance | `perf(db): add index on accountNumber` |

### Exemples

```bash
# Bonne nouvelle fonctionnalité
git commit -m "feat(savings): add fixed deposit account type"

# Correction de bug
git commit -m "fix(loans): correct interest calculation for declining balance"

# Documentation
git commit -m "docs(api): add swagger examples for loan endpoints"

# Breaking change
git commit -m "feat(auth): migrate to OAuth 2.0

BREAKING CHANGE: JWT authentication is now replaced by OAuth 2.0"
```

---

## Questions ?

- 📧 Email : dev@microfinance-app.com
- 💬 Discord : [lien]
- 📖 Documentation : [docs/](./docs/)

---

## Remerciements

Merci à tous les contributeurs qui aident à améliorer cette plateforme ! 🙏

Votre contribution, quelle qu'elle soit, est précieuse :
- ⭐ Star le projet sur GitHub
- 🐛 Reporter des bugs
- ✨ Proposer des fonctionnalités
- 📝 Améliorer la documentation
- 💻 Contribuer du code
- 🌍 Traduire

---

**Ensemble, construisons la meilleure plateforme de microfinance open source ! 🚀**
