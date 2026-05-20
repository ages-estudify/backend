# ==========================================
# Estágio 1: Build
# ==========================================
FROM node:22-alpine AS builder

# Instala openssl para o Prisma funcionar no Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instalamos tudo para poder buildar, mas ignoramos os scripts do Husky
RUN npm ci --ignore-scripts

COPY . .

# Geramos o client do prisma e buildamos o Nest
RUN npx prisma generate
RUN npm run build

# ==========================================
# Estágio 2: Produção
# ==========================================
FROM node:22-alpine

# Repete o openssl aqui porque esta é uma imagem nova, do zero
RUN apk add --no-cache openssl

WORKDIR /app

# Copiamos os arquivos necessários do estágio anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY prisma.config.ts ./

# Em vez de rodar npm ci de novo (que pode dar erro de script), 
# nós apenas limpamos os pacotes de desenvolvimento que sobraram
RUN npm prune --production

EXPOSE 3000

# Executa as migrations, roda o seed-prod direto via ts-node e inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed-prod.js && node dist/main.js"]