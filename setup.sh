#!/usr/bin/env bash
#
# setup.sh — Installation et (re)initialisation complete du backend Billeterie MG
#
# Remplace les etapes manuelles 3 et 4 du guide d'installation :
#   - supprime la base "ticket_app" si elle existe deja
#   - la recree
#   - cree le fichier backend/.env s'il n'existe pas
#   - installe les dependances npm du backend
#   - initialise les tables + donnees de demo (npm run db:init)
#
# Usage :
#   chmod +x setup.sh
#   ./setup.sh
#
# A executer depuis la racine du projet (dossier "ticket-app").

set -e

DB_NAME="ticket_app"
DB_USER="postgres"
BACKEND_DIR="backend"

echo "== Billeterie MG - Installation du backend =="

# --- 1. Verifier que PostgreSQL tourne ---
if ! sudo -u postgres pg_isready >/dev/null 2>&1; then
  echo "! PostgreSQL ne semble pas demarre. Tentative de demarrage..."
  sudo systemctl start postgresql || {
    echo "Erreur : impossible de demarrer PostgreSQL. Verifiez son installation."
    exit 1
  }
fi
echo "-> PostgreSQL est actif."

# --- 2. Supprimer la base existante si besoin, puis la recreer ---
# NB: "sudo -u postgres" est necessaire car Ubuntu utilise l'authentification
# "peer" en local : il faut etre l'utilisateur systeme "postgres" pour se
# connecter en tant que role "postgres" sans mot de passe.
EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")

if [ "$EXISTS" = "1" ]; then
  echo "-> La base '${DB_NAME}' existe deja : suppression en cours..."
  # Coupe les connexions actives avant de supprimer, sinon DROP DATABASE echoue.
  sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}';" >/dev/null
  sudo -u postgres psql -c "DROP DATABASE ${DB_NAME};"
  echo "   Base supprimee."
else
  echo "-> Aucune base '${DB_NAME}' existante."
fi

echo "-> Creation de la base '${DB_NAME}'..."
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
echo "   Base creee."

# --- 3. Preparer le fichier .env du backend ---
cd "$BACKEND_DIR"

if [ ! -f .env ]; then
  echo "-> Creation de backend/.env a partir de .env.example..."
  cp .env.example .env
else
  echo "-> backend/.env existe deja, il n'est pas modifie."
fi

# --- 4. Installer les dependances ---
echo "-> Installation des dependances npm (backend)..."
npm install

# --- 5. Initialiser les tables + donnees de demo ---
echo "-> Initialisation des tables et des donnees de demonstration..."
npm run db:init

echo ""
echo "== Installation terminee =="
echo "Comptes de demo :"
echo "  Admin  : admin@gmail.com / admin123"
echo "  Client : client@ticketapp.mg / Client123!"
echo ""
echo "Pour lancer le serveur : cd backend && npm run dev"
echo "Puis, dans un autre terminal : cd frontend && npm install && npm run dev"
