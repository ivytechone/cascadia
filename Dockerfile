FROM node:18-alpine
COPY ./ /cascadia/
WORKDIR /cascadia
ENTRYPOINT node ./app.js