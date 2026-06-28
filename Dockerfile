# syntax=docker/dockerfile:1

#####################################################################
# Etapa base: Node 22 LTS sobre Alpine.
#####################################################################
FROM node:22-alpine AS base
WORKDIR /usr/src/app

#####################################################################
# Etapa deps: instala todas las dependencias.
#####################################################################
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

#####################################################################
# Etapa dev: desarrollo con hot-reload (el código se monta como volumen).
#####################################################################
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev"]

#####################################################################
# Etapa build: genera los estáticos en /dist.
#####################################################################
FROM deps AS build
COPY . .
# La URL de la API se inyecta en build-time (Vite reemplaza import.meta.env).
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

#####################################################################
# Etapa prod: sirve los estáticos con nginx.
#####################################################################
FROM nginx:1.29-alpine AS prod
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
