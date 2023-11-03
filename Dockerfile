FROM cgr.dev/chainguard/wolfi-base:latest

ARG YARN_VERSION=1.22.19

RUN apk add nodejs-18 \
 && npm install -g yarn@$YARN_VERSION

COPY dist/index.js /app/

ENTRYPOINT ["node", "/app/index.js"]
