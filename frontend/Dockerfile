FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD sh -c "node node_modules/vite/bin/vite.js"
