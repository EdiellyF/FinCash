FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .



EXPOSE 5000

# Executa as migrations do Prisma e inicia o servidor JS nativo
CMD ["sh", "-c", "node src/server.js"]
