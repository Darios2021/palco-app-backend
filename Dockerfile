# Dockerfile
FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# Solo lo necesario para instalar deps
COPY package*.json ./

# Instala dependencias de producción
RUN npm ci --omit=dev

# Copia el resto del código
COPY . .

# Puerto interno del contenedor
ENV PORT=3000
EXPOSE 3000

# Arranque
CMD ["node", "src/index.js"]
