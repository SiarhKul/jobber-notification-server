# syntax=docker/dockerfile:1.7

FROM node:22-alpine3.20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

COPY tsconfig.json ./
COPY src ./src
COPY tools ./tools
RUN npm intall -g pm2 npm@latest
RUN npm run build

FROM node:22-alpine3.20
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json package-lock.json ./
COPY tools ./tools
RUN npm intall -g pm2 npm@latest
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --omit=dev
COPY --from=builder /app/build ./build

EXPOSE 4001

CMD ["npm", "run", "start"]
