FROM node:5.12

MAINTAINER Sean Canton <sean.canton@admobilize.com>

ADD . matrix/
WORKDIR matrix/

RUN npm install

EXPOSE 80

# RUN node app.js
CMD ["node", "index.js"]
