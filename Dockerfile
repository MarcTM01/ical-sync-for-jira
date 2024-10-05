FROM node:lts-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS build
USER node
WORKDIR /usr/src/app

COPY --chown=node:node . /usr/src/app
RUN npm ci --ignore-scripts && npm run transpile && npm ci --omit=dev --ignore-scripts

FROM node:lts-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9
RUN apk add dumb-init

ENV NODE_ENV production

USER node
WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/build /usr/src/app/
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules

LABEL org.opencontainers.image.source="https://github.com/MarcTM01/ical-sync-for-jira/"
LABEL org.opencontainers.image.description="Ical Sync for Jira scans Jira issues for deadlines and assembles them into an iCalendar file, which you can subscribe to from your favorite calendar software to stay on top of deadlines. See https://github.com/MarcTM01/ical-sync-for-jira/ for details"
LABEL org.opencontainers.image.licenses="MIT"

CMD ["dumb-init", "node", "src/index.js"]
