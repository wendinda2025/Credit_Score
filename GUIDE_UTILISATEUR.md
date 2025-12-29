# Guide Utilisateur - Système de Gestion de Crédit PAMF

## 📚 Table des Matières

1. [Introduction](#introduction)
2. [Connexion](#connexion)
3. [Tableau de Bord](#tableau-de-bord)
4. [Gestion des Clients](#gestion-des-clients)
5. [Demandes de Crédit](#demandes-de-crédit)
6. [Analyse Financière](#analyse-financière)
7. [Processus d'Approbation](#processus-dapprobation)
8. [FAQ](#faq)

## Introduction

Le Système de Gestion de Crédit PAMF est une application web complète pour gérer l'ensemble du processus de demande et d'approbation de crédit, de la création du dossier client jusqu'à la décision finale.

### Rôles et Permissions

L'application dispose de plusieurs rôles avec différents niveaux d'accès :

- **Administrateur** : Accès complet, gestion des utilisateurs
- **Agent de Crédit** : Création et gestion des demandes, analyse initiale
- **Risk Officer** : Évaluation des risques, validation financière
- **Chef d'Agence** : Approbation finale au niveau agence
- **Comité de Crédit** : Décision finale pour les montants importants
- **Consultant** : Accès en lecture seule

## Connexion

### Première Connexion

1. Accédez à l'application via votre navigateur web
2. Entrez votre nom d'utilisateur et mot de passe fournis par l'administrateur
3. Cliquez sur "Se connecter"

### Changement de Mot de Passe

1. Cliquez sur votre nom en haut à droite
2. Sélectionnez "Mon Profil"
3. Cliquez sur "Changer le mot de passe"
4. Entrez votre ancien mot de passe et le nouveau
5. Confirmez le changement

## Tableau de Bord

Le tableau de bord vous donne un aperçu rapide de vos activités :

### Statistiques Principales

- **Total des demandes** : Nombre total de demandes créées
- **En attente** : Demandes nécessitant une action
- **Approuvées** : Demandes validées
- **Rejetées** : Demandes refusées
- **Montant total** : Somme des montants demandés/approuvés
- **Clients actifs** : Nombre de clients avec des dossiers en cours

### Demandes Récentes

Liste des dernières demandes de crédit avec :
- Nom du client
- Numéro de demande
- Montant
- Statut actuel

## Gestion des Clients

### Créer un Nouveau Client

1. Allez dans "Clients" > "Nouveau Client"
2. Remplissez les informations obligatoires :
   - Numéro client PAMF
   - Nom et prénom
   - Genre
   - Pièce d'identité
   - Contact (téléphone)
   - Adresse

3. Informations complémentaires :
   - Situation familiale
   - Niveau d'éducation
   - Profession
   - Date d'adhésion

4. Références :
   - Ajoutez au moins 2 personnes de contact
   - Indiquez leur relation avec le client

5. Comptes bancaires :
   - Institution
   - Type de compte
   - Numéro et solde

6. Cliquez sur "Enregistrer"

### Rechercher un Client

- Utilisez la barre de recherche pour trouver un client par :
  - Nom
  - Prénom
  - Numéro client

### Modifier un Client

1. Trouvez le client dans la liste
2. Cliquez sur "Modifier"
3. Modifiez les informations nécessaires
4. Enregistrez les modifications

## Demandes de Crédit

### Créer une Demande

1. Allez dans "Demandes" > "Nouvelle Demande"
2. Sélectionnez ou créez le client
3. **Informations de la demande** :
   - Montant sollicité
   - Durée (en mois)
   - Périodicité de remboursement
   - Objet du crédit

4. **Activité du client** :
   - Nom de l'entreprise
   - Secteur d'activité
   - Type d'entreprise
   - Localisation
   - Années d'expérience

5. **Projet** :
   - Coût total
   - Apport personnel
   - Détail des dépenses
   - Source des fonds

6. **Garanties** :
   - Type de garantie
   - Description
   - Valeur déclarée
   - Valeur marchande

7. Cliquez sur "Enregistrer le brouillon" ou "Soumettre"

### Statuts d'une Demande

- **Brouillon** : En cours de création
- **Soumise** : En attente d'évaluation
- **En révision** : En cours d'analyse
- **Approuvée** : Validée
- **Rejetée** : Refusée
- **Ajournée** : Nécessite des clarifications
- **Déboursée** : Fonds versés
- **Terminée** : Remboursement complet

## Analyse Financière

### Saisir l'Analyse Financière

1. Ouvrez la demande de crédit
2. Allez dans l'onglet "Analyse Financière"

3. **Budget Familial** (mensuel) :
   - Nourriture
   - Loyer
   - Éducation
   - Habillement
   - Transport
   - Eau et électricité
   - Téléphone
   - Soins médicaux
   - Autres charges

4. **Revenus de l'Activité** :
   - Ventes mensuelles par activité
   - Coût des marchandises vendues
   - L'application calcule automatiquement la marge brute

5. **Charges Opérationnelles** :
   - Salaires
   - Loyer commercial
   - Utilitaires
   - Transport/Communication
   - Maintenance
   - Taxes et frais
   - Autres dépenses

6. **Bilan** :
   - Total des actifs
   - Total des passifs
   - L'application calcule la valeur nette

7. **Commentaires** :
   - Forces du dossier
   - Faiblesses identifiées
   - Facteurs d'atténuation
   - Recommandations

### Ratios Calculés Automatiquement

L'application calcule automatiquement :

- **Marge brute** : (Ventes - Coût marchandises) / Ventes
- **Résultat net** : Marge brute - Charges
- **Cash flow mensuel** : Disponible pour remboursement
- **CAF** : Capacité d'autofinancement annuelle
- **Ratio d'endettement** : Passifs / Actifs
- **Ratio de liquidité** : Actifs liquides / Actifs totaux
- **Ratio de couverture** : Cash flow / Remboursements

### Recommandation Automatique

Basée sur l'analyse, l'application génère une recommandation indiquant :
- Si le dossier peut être approuvé
- Les points forts
- Les risques identifiés
- Les avertissements

## Processus d'Approbation

### Niveaux d'Approbation

Chaque demande passe par plusieurs niveaux :

1. **Agent de Crédit**
   - Recommandation initiale
   - Montant recommandé
   - Commentaires

2. **Risk Officer**
   - Validation du dossier
   - Évaluation des risques
   - Montant recommandé
   - Accord/désaccord avec l'AC

3. **Chef d'Agence**
   - Approbation finale agence
   - Montant final
   - Conditions éventuelles

4. **Comité de Crédit** (si nécessaire)
   - Décision finale
   - Accord/Refus/Ajournement

### Donner une Approbation

1. Ouvrez la demande assignée
2. Allez dans "Approbations"
3. Remplissez votre évaluation :
   - Dossier complet ? Oui/Non
   - Accord avec recommandation précédente ?
   - Montant recommandé
   - Commentaires
   - Éléments à clarifier (si incomplet)

4. Sélectionnez votre décision :
   - Approuvé
   - Rejeté
   - Ajourné

5. Cliquez sur "Soumettre l'approbation"

### Historique des Approbations

Pour chaque demande, vous pouvez consulter :
- Toutes les approbations passées
- Commentaires de chaque niveau
- Montants recommandés
- Dates des décisions

## FAQ

### Comment réinitialiser mon mot de passe ?

Contactez votre administrateur système qui pourra réinitialiser votre mot de passe.

### Puis-je modifier une demande déjà soumise ?

Non, une fois soumise, seul un administrateur peut modifier une demande. Si des modifications sont nécessaires, contactez votre supérieur.

### Comment calculer la capacité de remboursement ?

L'application calcule automatiquement :
- Cash flow mensuel = Résultat net + Dépréciations - Budget familial + Autres revenus
- Capacité annuelle = Cash flow × 12
- Capacité de remboursement = 70% de la capacité annuelle

### Que signifie "Dossier ajourné" ?

Un dossier ajourné nécessite des clarifications ou documents supplémentaires. L'agent de crédit doit compléter les informations manquantes avant une nouvelle soumission.

### Puis-je exporter les données ?

Oui, utilisez les boutons "Exporter" disponibles dans chaque section pour télécharger les données en PDF ou Excel.

### Comment ajouter un document ?

1. Ouvrez la demande
2. Allez dans "Documents"
3. Cliquez sur "Ajouter un document"
4. Sélectionnez le type et téléchargez le fichier
5. Ajoutez une description
6. Enregistrez

### Les calculs automatiques sont-ils modifiables ?

Non, les calculs automatiques (ratios, totaux) ne sont pas modifiables pour garantir l'exactitude. Vérifiez les données de base si un résultat semble incorrect.

### Comment contacter le support ?

Pour toute assistance :
- Email : support@pamf.bf
- Téléphone : [À compléter]
- Chat : Disponible pendant les heures de bureau

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2025  
**PAMF © 2025 - Tous droits réservés**
