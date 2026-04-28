FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN node node_modules/prisma/build/index.js generate

EXPOSE 5000

CMD ["npm", "start"]
