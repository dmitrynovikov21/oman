FROM node:22 AS build
WORKDIR /app

# Install dependencies (including devDeps for TypeScript/prisma)
COPY package.json ./
RUN npm install

# Generate Prisma client and build Nest app
COPY tsconfig.json ./tsconfig.json
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:22
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 2988

# Запускаем миграции перед стартом приложения
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
