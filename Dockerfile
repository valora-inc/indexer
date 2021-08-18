FROM node:12.22.4-alpine3.14 as base

ENV NPM_CONFIG_LOGLEVEL info

# @celo/utils has depdencies in github
RUN apk update && apk upgrade && \
    apk add --no-cache git

WORKDIR /app
COPY yarn.lock package.json ./
RUN yarn

# Copy app
COPY . .

RUN yarn build

FROM node:12.18.3-alpine3.12

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL info

# @celo/utils has depdencies in github
RUN apk update && apk upgrade && \
    apk add --no-cache git

WORKDIR /app
COPY yarn.lock package.json ./
RUN yarn

# Copy build files
COPY --from=base /app/dist ./dist

CMD ["yarn", "start"]
