# Guide d'installation — Billetterie MG (démonstration en réseau local)

Ce guide explique comment installer et lancer l'application pour une
démonstration où l'**admin** héberge tout sur son PC (Node.js + PostgreSQL),
et où les **clients** se connectent depuis leurs smartphones via le même
réseau WiFi, en utilisant l'IP locale du PC.

---

## 1. Prérequis (sur le PC de l'admin uniquement)

- [Node.js](https://nodejs.org/) version 18 ou supérieure (`node -v`)
- [PostgreSQL](https://www.postgresql.org/download/) version 14 ou supérieure, installé et démarré
- Un navigateur récent (Chrome recommandé pour le scan QR)
- PC et smartphones **connectés au même réseau WiFi local**

Les smartphones clients n'ont besoin d'installer aucune application :
un navigateur web suffit (Chrome sur Android, Safari sur iPhone).

---

## 2. Trouver l'adresse IP locale du PC admin

C'est l'adresse que les clients utiliseront pour se connecter. Elle
ressemble à `192.168.x.x` ou `10.0.x.x`.

- **Windows** : ouvrir l'invite de commandes, taper `ipconfig`, relever
  "Adresse IPv4" de la carte WiFi.
- **macOS** : Préférences Système > Réseau > WiFi > Détails, ou
  `ipconfig getifaddr en0` dans le terminal.
- **Linux** : `ip a` ou `hostname -I` dans le terminal.

> Notez cette adresse (ex. : `192.168.1.10`), elle sera réutilisée.

---

## 3. Installer et configurer la base de données

```bash
# Se connecter à PostgreSQL et créer la base
psql -U postgres -c "CREATE DATABASE ticket_app;"
```

Si votre installation PostgreSQL utilise un autre utilisateur ou mot de passe,
adaptez la commande ci-dessus et le fichier `.env` à l'étape suivante.

---

## 4. Installer et lancer le backend (API)

```bash
cd backend
npm install
cp .env.example .env
```

Ouvrez `.env` et ajustez si besoin :

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticket_app
DB_USER=postgres
DB_PASSWORD=postgres          # <-- votre mot de passe PostgreSQL
HOST_LAN_IP=192.168.1.10      # <-- l'IP relevée à l'étape 2 (informatif dans les logs)
JWT_SECRET=change_this_secret_in_production
```

Initialiser les tables et les données de démonstration (comptes + événements) :

```bash
npm run db:init
```

Lancer le serveur :

```bash
npm run dev
```

Le terminal doit afficher :

```
API demarree sur le port 4000
  - Admin (sur ce PC)     : http://localhost:4000/api/health
  - Clients (même WiFi)   : http://192.168.1.10:4000/api/health
```

Vérifiez que `http://localhost:4000/api/health` répond `{"status":"ok",...}`
dans un navigateur.

**Important — Pare-feu Windows** : lors du premier lancement, Windows peut
demander d'autoriser Node.js sur les reseaux "prives". Acceptez, sinon les
clients ne pourront pas joindre l'API depuis leur téléphone.

---

## 5. Installer et lancer le frontend (application React)

Dans un **second terminal** :

```bash
cd frontend
npm install
npm run dev
```

Vite affiche deux adresses :

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.10:5173/
```

- **L'admin** ouvre l'adresse `Local` (`http://localhost:5173`) dans son
  navigateur PC.
- **Les clients** ouvrent l'adresse `Network` (`http://192.168.1.10:5173`,
  avec l'IP réelle du PC) depuis le navigateur de leur smartphone.

> Le frontend détecte automatiquement comment il a été ouvert (localhost ou
> IP locale) et appelle l'API backend sur la même adresse, port 4000. Aucune
> configuration supplémentaire n'est nécessaire côté client : il suffit de
> communiquer l'URL `http://<IP_DU_PC>:5173` (par ex. par QR code ou message)
> aux participants de la démonstration.

---

## 6. Se connecter

| Role   | Email                   | Mot de passe | A utiliser depuis  |
|--------|-------------------------|--------------|--------------------|
| Admin  | admin@gmail.com         | admin123     | Le PC (localhost)  |
| Client | client@ticketapp.mg     | Client123!   | Un smartphone (IP locale), ou creer un nouveau compte via "Inscrivez-vous" |

Parcours de démonstration suggéré :

1. **Admin (PC)** : se connecter, aller dans "Creer" pour publier un
  nouvel événement avec ses catégories de billets.
2. **Client (smartphone)** : ouvrir l'app via l'IP locale, parcourir les
  événements, ajouter des billets au panier, choisir MVola, Orange Money ou
  Airtel Money, puis saisir le nom du payeur et la référence de paiement.
3. **Admin (PC)** : dans le tableau de bord, vérifier la référence et
  approuver la réservation. Les billets sont alors générés et envoyés au client.
4. **Admin (PC ou un smartphone admin)** : aller dans "Scanner", autoriser
  l'accès caméra, scanner le QR code affiché sur le téléphone du client
  pour valider l'entrée.
5. **Admin** : consulter le "Tableau de bord" pour voir les ventes et
  billets scannés se mettre à jour en direct.

---

## 7. Limitations connues de cette demo locale

- **Paiement simulé** : aucun appel à une passerelle de paiement réelle
  (MVola, Orange Money, etc.) n'est effectué ; le client fournit le nom et
  la référence, puis un administrateur doit approuver avant l'émission du billet.
- **Notifications** : elles sont stockées en base et affichées dans
  l'onglet "Profil > Notifications" de l'application (rafraîchies à chaque
  ouverture). Les notifications systeme du navigateur (push natif) ne sont
  pas activées car elles nécessitent une connexion HTTPS, indisponible en
  HTTP sur IP locale ; c'est un choix adapté à la contrainte de démo en
  réseau local sans certificat SSL.
- **Scan QR sur smartphone** : certains navigateurs mobiles n'autorisent
  l'accès caméra qu'en HTTPS ou sur `localhost`. Si le scan ne fonctionne
  pas depuis le téléphone de l'admin, effectuez le scan depuis le PC admin
  (webcam) ou testez avec Chrome sur Android, generalement plus permissif
  en HTTP sur réseau local.
- Les données (événements, réservations) sont réinitialisées uniquement si
  vous relancez `npm run db:init` (cela supprime les tables existantes).

---

## 8. Arreter l'application

Dans chaque terminal (backend et frontend), faites `Ctrl + C`.
