FROM node:20.11.1-alpine

WORKDIR /app

COPY package*.json .

# ARG FINNHUB_API_KEY
ENV FINNHUB_API_KEY ${FINNHUB_API_KEY}

RUN npm install -g pnpm
RUN pnpm store prune
RUN pnpm install

COPY . .

RUN pnpm prisma generate
# RUN pnpm prisma migrate deploy
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]