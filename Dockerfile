FROM node:20-slim

# Install OpenSSL and CA certificates required by Prisma Query Engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci

COPY backend/ .

RUN npx prisma generate

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]