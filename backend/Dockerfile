FROM node:22-alpine

# Installer sqlite3 de manière permanente
# RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Compilation TypeScript
RUN npm run build

# Exposition du port
EXPOSE 8000

# Démarrage de l'application
CMD ["npm", "run", "start"]