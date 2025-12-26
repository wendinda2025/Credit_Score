FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Builder l'application
RUN npm run build

# Image de production
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers nécessaires
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Générer le client Prisma pour la production
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
