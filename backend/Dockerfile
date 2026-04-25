FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD sh -c "node node_modules/prisma/build/index.js generate && node node_modules/prisma/build/index.js migrate deploy && node prisma/seed.js && npm start"