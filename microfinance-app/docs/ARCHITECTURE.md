# 🏗️ Architecture de la Plateforme de Microfinance

## Vue d'ensemble

Cette plateforme utilise une **architecture hexagonale** (ports et adaptateurs) couplée à une **architecture modulaire** propre à NestJS, garantissant :

- ✅ Séparation des préoccupations
- ✅ Testabilité élevée  
- ✅ Maintenabilité à long terme
- ✅ Évolutivité facile
- ✅ Indépendance vis-à-vis des frameworks

---

## Diagramme de l'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (Frontend React, Mobile App, API Consumers)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Controllers  │  │   Guards     │  │ Interceptors │         │
│  │              │  │              │  │              │         │
│  │ - Validation │  │ - JWT Auth   │  │ - Transform  │         │
│  │ - Routing    │  │ - RBAC       │  │ - Logging    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────────┐
│                       APPLICATION LAYER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Business Services                      │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │  Loans   │  │ Savings  │  │ Clients  │  │ Account │ │  │
│  │  │ Service  │  │ Service  │  │ Service  │  │  -ing   │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │  │
│  │       │             │             │             │       │  │
│  │       │    ┌────────▼─────────────▼─────────────▼────┐ │  │
│  │       │    │                                          │ │  │
│  │       └────►      Business Logic / Domain Rules      │ │  │
│  │            │  - Amortization Calculations            │ │  │
│  │            │  - Interest Calculations                │ │  │
│  │            │  - Double-Entry Bookkeeping             │ │  │
│  │            │  - Business Validations                 │ │  │
│  │            └──────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                         │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Prisma ORM    │  │  JWT Strategy   │  │  File Storage   │ │
│  │                │  │                 │  │                 │ │
│  │  - Migrations  │  │  - Passport     │  │  - Documents    │ │
│  │  - Queries     │  │  - bcrypt       │  │  - Images       │ │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘ │
└───────────┼───────────────────────────────────────────────────────┘
            │
            │
┌───────────▼───────────────────────────────────────────────────────┐
│                        DATA LAYER                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   PostgreSQL Database                        │ │
│  │                                                              │ │
│  │  Organizations │ Users │ Clients │ Loans │ Savings          │ │
│  │  Accounting    │ Audit │ Reports │ ...                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## Couches de l'Architecture

### 1. Client Layer (Couche Client)

**Responsabilité :** Interface utilisateur et consommation de l'API

**Composants :**
- Frontend web (React)
- Application mobile (à venir)
- Intégrations tierces via API

**Technologies :**
- React.js + TypeScript
- Tailwind CSS
- React Query
- Axios

---

### 2. Presentation Layer (Couche Présentation)

**Responsabilité :** Gestion des requêtes HTTP et des réponses

#### Controllers (Contrôleurs)

Exposent les endpoints API :

```typescript
@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  @Post('applications')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER')
  createLoanApplication(@Body() dto: CreateLoanApplicationDto) {
    return this.loansService.createLoanApplication(dto);
  }
}
```

**Responsabilités :**
- Routing des requêtes
- Validation des DTOs
- Transformation des réponses
- Gestion des erreurs HTTP

#### Guards (Gardes)

Contrôlent l'accès aux endpoints :

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Vérifie la validité du JWT
}

@Injectable()
export class RolesGuard implements CanActivate {
  // Vérifie les permissions RBAC
}
```

#### Interceptors (Intercepteurs)

Transforment les requêtes/réponses :

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString()
      }))
    );
  }
}
```

#### Pipes (Tuyaux)

Valident et transforment les données :

```typescript
@Injectable()
export class ValidationPipe implements PipeTransform {
  // Validation avec class-validator
}
```

---

### 3. Application Layer (Couche Application)

**Responsabilité :** Logique métier et orchestration

#### Services Métier

**LoansService**
```typescript
@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private amortizationService: AmortizationService,
  ) {}

  async createLoanApplication(dto: CreateLoanApplicationDto) {
    // 1. Valider les règles métier
    // 2. Créer la demande de prêt
    // 3. Générer le numéro de compte
    // 4. Enregistrer dans la base
  }

  async disburseLoan(id: string, dto: DisburseLoanDto) {
    // 1. Vérifier le statut du prêt
    // 2. Générer le calendrier d'amortissement
    // 3. Créer les écritures comptables
    // 4. Mettre à jour le statut
  }
}
```

**AmortizationService**
```typescript
@Injectable()
export class AmortizationService {
  calculateRepaymentSchedule(
    principal: number,
    rate: number,
    installments: number,
    frequency: RepaymentFrequency,
    method: InterestMethod,
  ): RepaymentScheduleItem[] {
    // Calculs complexes d'amortissement
    // Méthode forfaitaire ou dégressive
  }
}
```

**Règles Métier Implémentées :**

1. **Validation des montants :**
   - Montant entre min et max du produit
   - Nombre d'échéances valide

2. **Workflow des prêts :**
   - PENDING → APPROVED → ACTIVE → CLOSED
   - Validation des transitions d'état

3. **Calculs financiers :**
   - Calendrier d'amortissement
   - Intérêts (flat ou declining balance)
   - Pénalités de retard

4. **Comptabilité :**
   - Principe de la partie double
   - Génération automatique des écritures
   - Équilibrage débit/crédit

---

### 4. Infrastructure Layer (Couche Infrastructure)

**Responsabilité :** Accès aux ressources externes

#### Prisma ORM

Abstraction de la base de données :

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Avantages :**
- Type-safety complet
- Migrations automatiques
- Queries optimisées
- Relations faciles

#### Authentification

**JWT Strategy :**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

---

### 5. Data Layer (Couche Données)

**Responsabilité :** Stockage persistant

#### Schéma de Base de Données

**Relations principales :**

```
Organization (1) ─────► (N) Users
Organization (1) ─────► (N) Clients
Organization (1) ─────► (N) Loans
Organization (1) ─────► (N) SavingsAccounts
Organization (1) ─────► (N) ChartOfAccounts

Client (1) ─────► (N) Loans
Client (1) ─────► (N) SavingsAccounts

Loan (1) ─────► (N) LoanRepayments
Loan (1) ─────► (N) LoanTransactions

SavingsAccount (1) ─────► (N) SavingsTransactions

JournalEntry (1) ─────► (N) JournalEntryLines
JournalEntryLine (N) ───► (1) ChartOfAccount
```

**Indexes pour Performance :**
- Email unique sur Users
- AccountNumber unique sur Clients, Loans, SavingsAccounts
- Index sur organizationId pour le multi-tenant
- Index sur dates pour les requêtes de reporting

---

## Patterns de Conception Utilisés

### 1. Repository Pattern (via Prisma)

Abstraction de l'accès aux données :

```typescript
// Au lieu d'accéder directement à la BDD
this.prisma.loan.create({ data: ... });

// Possibilité de créer des repositories
export class LoanRepository {
  constructor(private prisma: PrismaService) {}
  
  async findActiveByClient(clientId: string) {
    return this.prisma.loan.findMany({
      where: { clientId, status: 'ACTIVE' }
    });
  }
}
```

### 2. Service Pattern

Chaque module a un service qui contient la logique métier :

```typescript
@Injectable()
export class LoansService {
  // Toute la logique métier des prêts
}
```

### 3. DTO Pattern (Data Transfer Object)

Validation et transformation des données :

```typescript
export class CreateLoanApplicationDto {
  @IsString()
  clientId: string;

  @IsNumber()
  @Min(0)
  principalAmount: number;

  @IsEnum(RepaymentFrequency)
  repaymentFrequency: RepaymentFrequency;
}
```

### 4. Dependency Injection

NestJS gère automatiquement les dépendances :

```typescript
@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amortizationService: AmortizationService,
  ) {}
}
```

### 5. Factory Pattern

Pour la création d'objets complexes :

```typescript
class LoanFactory {
  static createSchedule(loan: Loan): RepaymentSchedule {
    // Logique de création complexe
  }
}
```

---

## Sécurité

### Multi-couches de Sécurité

#### 1. Authentification (Qui êtes-vous ?)

```typescript
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  // Seuls les utilisateurs authentifiés peuvent accéder
}
```

#### 2. Autorisation (Que pouvez-vous faire ?)

```typescript
@Roles('ADMIN', 'MANAGER')
@Post('approve')
approveLoad() {
  // Seuls les admins et managers peuvent approuver
}
```

#### 3. Validation des Données

```typescript
@Post()
create(@Body() dto: CreateLoanDto) {
  // class-validator vérifie automatiquement
}
```

#### 4. Audit Trail

Toutes les actions importantes sont tracées :

```typescript
await this.auditService.logAction({
  action: 'APPROVE',
  entityType: 'LOAN',
  entityId: loan.id,
  userId: user.id,
});
```

---

## Performance & Scalabilité

### Optimisations Implémentées

#### 1. Indexes Base de Données

```prisma
model Loan {
  id String @id @default(uuid())
  accountNumber String @unique
  organizationId String
  
  @@index([organizationId])
  @@index([status])
  @@index([disbursedDate])
}
```

#### 2. Eager/Lazy Loading

```typescript
// Optimisé : charge uniquement ce qui est nécessaire
const loan = await prisma.loan.findUnique({
  where: { id },
  include: {
    client: { select: { firstName: true, lastName: true } },
    repayments: true,
  }
});
```

#### 3. Pagination

```typescript
async findAll(page: number = 1, limit: number = 50) {
  return this.prisma.loan.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

#### 4. Transactions pour Intégrité

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Décaisser le prêt
  await tx.loan.update({ ... });
  
  // 2. Créer le calendrier
  await tx.loanRepayment.createMany({ ... });
  
  // 3. Créer les écritures comptables
  await tx.journalEntry.create({ ... });
});
```

---

## Extensibilité

### Comment Ajouter un Nouveau Module

1. **Créer la structure :**
```bash
nest g module modules/new-feature
nest g service modules/new-feature
nest g controller modules/new-feature
```

2. **Définir le schéma Prisma :**
```prisma
model NewFeature {
  id String @id @default(uuid())
  // ... champs
}
```

3. **Créer les DTOs :**
```typescript
export class CreateNewFeatureDto { ... }
```

4. **Implémenter le service :**
```typescript
@Injectable()
export class NewFeatureService {
  constructor(private prisma: PrismaService) {}
}
```

5. **Créer le contrôleur :**
```typescript
@Controller('new-feature')
export class NewFeatureController { ... }
```

6. **Importer dans AppModule :**
```typescript
@Module({
  imports: [NewFeatureModule],
})
export class AppModule {}
```

---

## Tests

### Stratégie de Test

#### Tests Unitaires

```typescript
describe('AmortizationService', () => {
  it('should calculate flat interest correctly', () => {
    const schedule = service.calculateRepaymentSchedule(
      100000, 15, 12, 'MONTHLY', 'FLAT'
    );
    expect(schedule).toHaveLength(12);
  });
});
```

#### Tests d'Intégration

```typescript
describe('LoansController (e2e)', () => {
  it('/loans/applications (POST)', () => {
    return request(app.getHttpServer())
      .post('/loans/applications')
      .send(createLoanDto)
      .expect(201);
  });
});
```

---

## Monitoring & Logging

### Logging Structure

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        Logger.log(`${method} ${url} - ${responseTime}ms`);
      })
    );
  }
}
```

### Métriques Importantes

- Temps de réponse API
- Taux d'erreur
- Nombre de transactions
- Utilisation de la base de données

---

## Évolutions Futures

### Architecture Microservices (Phase 3)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Loans      │    │   Savings    │    │  Accounting  │
│  Service     │    │   Service    │    │   Service    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────▼───────┐
                    │  API Gateway │
                    └──────────────┘
```

### Event-Driven Architecture

```typescript
// Émettre des événements
this.eventEmitter.emit('loan.disbursed', {
  loanId: loan.id,
  amount: loan.principalAmount,
});

// Écouter les événements
@OnEvent('loan.disbursed')
handleLoanDisbursed(event: LoanDisbursedEvent) {
  // Créer les écritures comptables
}
```

---

**Cette architecture garantit une base solide, évolutive et maintenable pour les années à venir.**
