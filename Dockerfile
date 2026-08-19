FROM node:20-slim

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci

COPY backend/ .

RUN npx prisma generate

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]