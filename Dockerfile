FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# Si tenés step de build (TS/webpack), habilitalo:
# RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
