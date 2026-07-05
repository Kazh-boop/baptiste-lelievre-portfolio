# syntax=docker/dockerfile:1

########################################
# Étape 1 — Build (SSR + prerender)
########################################
FROM node:22-alpine AS build
WORKDIR /app

# Copier d'abord les manifestes : cette couche n'est invalidée que si les
# dépendances changent → les builds suivants réutilisent le cache npm.
COPY package.json package-lock.json ./
RUN npm ci

# Puis le reste des sources (voir .dockerignore pour ce qui est exclu).
COPY . .
RUN npm run build

########################################
# Étape 2 — Runtime (image minimale)
########################################
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app

# Utilisateur non-root : même principe du moindre privilège que sur le VPS.
RUN addgroup -S app && adduser -S app -G app

# On n'embarque QUE le résultat du build : ni sources, ni node_modules de
# build (le serveur SSR Angular est bundlé, autonome).
COPY --from=build --chown=app:app /app/dist/baptiste-lelievre-portfolio ./dist

USER app
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4000/ || exit 1

CMD ["node", "dist/server/server.mjs"]
