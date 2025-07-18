FROM node:18-alpine

# Installer les dependances systeme necessaires
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./

# Installer les dependances
RUN npm ci

# Copier le code source
COPY . .

# Creer le dossier pour la base de donnees
RUN mkdir -p /app/database

# on utilise pas Prisma car on peux faire en commande SQL

# Exposer le port
EXPOSE 8000

# Commande dev
CMD ["npm", "run", "dev"]