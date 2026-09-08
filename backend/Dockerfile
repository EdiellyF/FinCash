FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Gera o cliente do Prisma durante o build da imagem (perfeito, pois não pesa na hora que o container liga)
RUN node node_modules/prisma/build/index.js generate

EXPOSE 5000

# Apenas inicia o servidor (as migrações rodam separadamente)
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
