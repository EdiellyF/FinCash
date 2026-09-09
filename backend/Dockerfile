FROM node:20

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
