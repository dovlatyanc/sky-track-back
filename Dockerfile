
FROM node:18-alpine


WORKDIR /app


COPY package*.json ./


RUN npm ci --only=production


COPY . .


RUN npx prisma generate


EXPOSE 5174


CMD ["node", "src/index.ts"]