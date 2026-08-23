FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN node node_modules/prisma/build/index.js generate

EXPOSE 5000

# Em produção, roda as migrations pendentes antes de subir o servidor,
# e usa "npm start" (node puro) em vez de "npm run dev" (nodemon, feito
# para desenvolvimento local, não para produção).
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]