# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Caminho (relativo) em que o nginx expõe a API. Relativo = funciona em
# qualquer domínio/URL do túnel, sem rebuild e sem CORS.
ARG VITE_API_URL=/backend
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
