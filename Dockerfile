FROM node:lts-alpine@sha256:d18f4d9889b217d3fab280cc52fbe1d4caa0e1d2134c6bab901a8b7393dd5f53 AS build
USER node
WORKDIR /usr/src/app

COPY --chown=node:node . /usr/src/app
RUN npm ci --ignore-scripts && npm run transpile && npm ci --omit=dev --ignore-scripts

FROM node:lts-alpine@sha256:d18f4d9889b217d3fab280cc52fbe1d4caa0e1d2134c6bab901a8b7393dd5f53
RUN apk add dumb-init

ENV NODE_ENV production

USER node
WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/build /usr/src/app/
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules

CMD ["dumb-init", "node", "src/index.js"]
