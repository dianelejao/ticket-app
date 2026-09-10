# Billetterie MG — App de réservation de tickets (concerts, cinéma)

Application mobile-first de billetterie pour événements (concerts, cinéma),
conçue pour une démonstration en réseau local : l'admin héberge le serveur
sur son PC, les clients s'y connectent depuis leurs smartphones via le WiFi.

## Structure du projet

```
ticket-app/
├── backend/     API Node.js/Express + PostgreSQL (auth, événements, réservations, paiement simulé, QR)
├── frontend/    Application React (Vite), mobile-first
├── mockups/     Maquettes statiques des écrans principaux (mockups.html)
└── INSTALL_GUIDE.md   Guide d'installation et de déploiement local (à lire en premier)
```

## Fonctionnalites

- **Authentification JWT** (client / admin)
- **Catalogue d'événements** avec catégories de billets (prix, quotas)
- **Panier** et **paiement mobile simulé** (MVola, Orange Money, Airtel Money) avec nom et référence de paiement
- **Validation admin des paiements** avant génération et envoi des billets
- **Billets numériques avec QR code** généré à la volée
- **Historique des réservations** et **notifications in-app** (rappels, changements)
- **Dashboard admin** : création d'événements, suivi des ventes, revenu par événement
- **Scan QR admin** (caméra du PC ou du téléphone admin) pour valider les entrées

## Demarrage rapide

Voir [`INSTALL_GUIDE.md`](./INSTALL_GUIDE.md) pour les instructions complètes
(installation, configuration réseau local, comptes de démonstration).

## Comptes de démonstration

| Role   | Email                  | Mot de passe |
|--------|-------------------------|--------------|
| Admin  | admin@gmail.com         | admin123     |
| Client | client@ticketapp.mg     | Client123!   |
