FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Gera o cliente do Prisma
RUN node node_modules/prisma/build/index.js generate

# Compila o código TypeScript para JavaScript (criando a pasta dist/ lá dentro do contêiner)
RUN npm run build

EXPOSE 5000

# Executa as migrations e inicia o app chamando o arquivo compilado diretamente com o node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
