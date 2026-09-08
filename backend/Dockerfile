FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Gera o cliente do Prisma
RUN node node_modules/prisma/build/index.js generate

EXPOSE 5000

# Executa as migrations do Prisma e inicia o servidor JS nativo
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
