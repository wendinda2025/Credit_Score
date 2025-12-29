# Guide de Contribution - PAMF

Merci de votre intérêt pour contribuer au Système de Gestion de Crédit PAMF ! Ce document vous guidera à travers le processus de contribution.

## 🤝 Comment Contribuer

### Signaler un Bug

1. Vérifiez d'abord si le bug n'a pas déjà été signalé dans les [Issues](https://github.com/votre-repo/pamf-credit/issues)
2. Créez une nouvelle issue avec le label "bug"
3. Incluez :
   - Description claire du problème
   - Steps pour reproduire
   - Comportement attendu vs comportement actuel
   - Captures d'écran si pertinent
   - Version de l'application
   - Environnement (navigateur, OS, etc.)

### Proposer une Fonctionnalité

1. Créez une issue avec le label "enhancement"
2. Décrivez clairement :
   - La fonctionnalité proposée
   - Le problème qu'elle résout
   - Des exemples d'utilisation
   - Des mockups si applicable

### Soumettre du Code

#### 1. Fork et Clone

```bash
# Forker le repo sur GitHub puis
git clone https://github.com/votre-username/pamf-credit.git
cd pamf-credit
```

#### 2. Créer une Branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

Conventions de nommage :
- `feature/` : Nouvelle fonctionnalité
- `fix/` : Correction de bug
- `docs/` : Documentation
- `refactor/` : Refactoring
- `test/` : Tests

#### 3. Développer

- Suivez les standards de code (voir ci-dessous)
- Écrivez des tests pour votre code
- Mettez à jour la documentation si nécessaire
- Commitez régulièrement avec des messages clairs

#### 4. Tester

```bash
# Backend
cd backend
source venv/bin/activate
pytest tests/ -v
black --check app/
flake8 app/

# Frontend
cd frontend
npm test
npm run lint
```

#### 5. Commiter

Suivez les conventions de commit :

```
type(scope): description courte

Description détaillée si nécessaire

Fixes #123
```

Types :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, pas de changement de code
- `refactor`: Refactoring
- `test`: Ajout de tests
- `chore`: Maintenance

Exemples :
```
feat(auth): ajouter l'authentification à deux facteurs

Implémentation de l'authentification à deux facteurs via SMS
et email pour améliorer la sécurité des comptes utilisateurs.

Fixes #45

---

fix(api): corriger l'erreur 500 lors de la création de client

Le champ phone_mobile pouvait être null, causant une erreur.
Ajout de la validation appropriée.

Fixes #78
```

#### 6. Pusher et Créer une Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

Créez une Pull Request sur GitHub avec :
- Titre clair
- Description détaillée des changements
- Référence aux issues liées
- Captures d'écran si pertinent
- Checklist de vérification

### Template de Pull Request

```markdown
## Description
Décrivez les changements apportés

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
Étapes pour tester les changements

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai effectué une auto-revue
- [ ] J'ai commenté les parties complexes
- [ ] J'ai mis à jour la documentation
- [ ] Mes changements ne génèrent pas de warnings
- [ ] J'ai ajouté des tests
- [ ] Tous les tests passent
- [ ] J'ai vérifié les linters

## Références
Fixes #(issue)
```

## 📝 Standards de Code

### Python (Backend)

- Suivre PEP 8
- Utiliser Black pour le formatage (ligne max 100 caractères)
- Type hints pour les fonctions publiques
- Docstrings pour les modules, classes et fonctions
- Maximum 15 lignes par fonction (sauf exceptions justifiées)

Exemple :
```python
def calculate_loan_capacity(
    monthly_income: int,
    monthly_expenses: int,
    loan_duration: int
) -> dict[str, int]:
    """
    Calcule la capacité d'emprunt d'un client.
    
    Args:
        monthly_income: Revenu mensuel en FCFA
        monthly_expenses: Dépenses mensuelles en FCFA
        loan_duration: Durée du prêt en mois
        
    Returns:
        Dict contenant capacity et max_amount
        
    Raises:
        ValueError: Si les valeurs sont négatives
    """
    if monthly_income < 0 or monthly_expenses < 0:
        raise ValueError("Les valeurs ne peuvent être négatives")
    
    monthly_capacity = monthly_income - monthly_expenses
    max_amount = int(monthly_capacity * loan_duration * 0.7)
    
    return {
        "capacity": monthly_capacity,
        "max_amount": max_amount
    }
```

### TypeScript (Frontend)

- Utiliser TypeScript strict
- Types explicites (éviter `any`)
- Composants fonctionnels avec hooks
- Props interfaces définies
- Nommage descriptif

Exemple :
```typescript
interface ClientCardProps {
  client: Client
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  onEdit, 
  onDelete 
}) => {
  const handleEdit = () => {
    onEdit?.(client.id)
  }
  
  return (
    <div className="card">
      <h3>{client.first_name} {client.last_name}</h3>
      <p>{client.client_number}</p>
      {onEdit && (
        <button onClick={handleEdit}>Modifier</button>
      )}
    </div>
  )
}
```

### SQL/Alembic

- Noms de tables en snake_case au pluriel
- Noms de colonnes en snake_case
- Toujours ajouter un index sur les clés étrangères
- Utiliser des migrations réversibles quand possible

## 🧪 Tests

### Tests Obligatoires

- Tests unitaires pour toute logique métier
- Tests d'intégration pour les endpoints API
- Tests de validation pour les schémas Pydantic
- Couverture minimum : 80%

### Écriture de Tests

```python
# Test unitaire
def test_calculate_loan_capacity():
    """Test le calcul de capacité d'emprunt"""
    result = calculate_loan_capacity(
        monthly_income=500000,
        monthly_expenses=200000,
        loan_duration=12
    )
    
    assert result["capacity"] == 300000
    assert result["max_amount"] == 2520000

# Test d'intégration
def test_create_client_api(client, auth_headers):
    """Test la création d'un client via l'API"""
    response = client.post(
        "/api/v1/clients/",
        json={
            "client_number": "TEST001",
            "first_name": "Test",
            "last_name": "User",
            "gender": "male"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["client_number"] == "TEST001"
```

## 📚 Documentation

- Documenter toute nouvelle fonctionnalité
- Mettre à jour le README si nécessaire
- Ajouter des docstrings aux fonctions/classes
- Commenter le code complexe
- Mettre à jour le CHANGELOG

## 🔍 Revue de Code

Lors de la revue :
- Vérifier la logique et les cas limites
- Vérifier les tests et la couverture
- Vérifier le style et les conventions
- Suggérer des améliorations constructives
- Approuver quand tout est bon

## 📋 Checklist Avant de Soumettre

- [ ] Le code compile sans erreurs
- [ ] Tous les tests passent
- [ ] Les linters passent
- [ ] La documentation est à jour
- [ ] Les commits sont bien formatés
- [ ] La branche est à jour avec main
- [ ] J'ai testé manuellement les changements

## 💬 Communication

- Soyez respectueux et constructif
- Posez des questions si quelque chose n'est pas clair
- Expliquez vos choix de design
- Soyez ouvert aux suggestions
- Répondez aux commentaires de revue

## 📄 Licence

En contribuant, vous acceptez que vos contributions soient sous la même licence que le projet.

## 🙏 Remerciements

Merci de contribuer à améliorer le système PAMF !

---

Pour toute question : support@pamf.bf
