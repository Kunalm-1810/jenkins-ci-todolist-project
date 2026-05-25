# Stage 1 - Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm run build

# Stage 2 - Serve
FROM nginx:alpine

COPY --from=builder /usr/src/app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
