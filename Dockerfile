FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
ENV PORT=3000
EXPOSE 3000

CMD ["node","src/index.js"]
