FROM node:20

WORKDIR /app

# Copia os arquivos de configuração e o schema do Prisma para otimizar o cache
COPY package*.json ./
COPY prisma ./prisma/

# Instalação rigorosa e limpa das dependências
RUN npm ci

# Copia o restante do código
COPY . .

# Gera o cliente do Prisma no momento do build
RUN npx prisma generate

# Altera para o usuário sem privilégios
USER node

EXPOSE 5000

# Executa puramente o servidor.
# Execute 'npx prisma migrate deploy' no CI/CD ou antes do deploy da imagem.
CMD ["node", "src/server.js"]
