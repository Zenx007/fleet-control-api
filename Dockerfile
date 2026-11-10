FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY db/migrations ./db/migrations
COPY src ./src

USER node

EXPOSE 3000

CMD ["node", "src/main.js"]
