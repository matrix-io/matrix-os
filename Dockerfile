FROM node:latest

MAINTAINER Sean Canton <sean.canton@admobilize.com>

ADD . matrix/
WORKDIR matrix/

RUN npm install

ENV NODE_ENV production
ENV NODE_VERSION 4.2
ENV NPM_VERSION 2.13.2

ENV MATRIX_API_SERVER http://dev-demo.admobilize.com
# ENV ADMATRIX_DEVICE_ID '12:23:34:45:56'
ENV MATRIX_STREAMING_SERVER http://dev-mxss.admobilize.com:80
# ENV ADMATRIX_USER brian@rokk3rlabs.com
# ENV ADMATRIX_PASSWORD Trudat55
# ENV ADMATRIX_CLIENT_ID AdMobilizeClientID
# ENV ADMATRIX_CLIENT_SECRET AdMobilizeClientSecret

EXPOSE 80 80

# Install Node modules

# RUN node app.js
CMD ["node", "app.js"]
