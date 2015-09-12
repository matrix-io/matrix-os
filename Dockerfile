FROM debian:jessie

# Set the env variables to non-interactive
# ENV DEBIAN_FRONTEND noninteractive
# ENV DEBIAN_PRIORITY critical
# ENV DEBCONF_NOWARNINGS yes


# From https://github.com/nodesource/docker-node/blob/master/debian/jessie/node/0.12.7/Dockerfile
RUN apt-get update \
 && apt-get install -y --force-yes --no-install-recommends\
      apt-transport-https \
      build-essential \
      curl \
      ca-certificates \
      git \
      lsb-release \
      python-all \
      rlwrap \
 && rm -rf /var/lib/apt/lists/*;

RUN curl https://deb.nodesource.com/node_0.12/pool/main/n/nodejs/nodejs_0.12.7-1nodesource1~jessie1_amd64.deb > node.deb \
 && dpkg -i node.deb \
 && rm node.deb

ADD . admatrix/
WORKDIR admatrix/

RUN cd node_modules/adsensors && npm install -g pangyp && ln -s $(which pangyp) $(dirname $(which pangyp))/node-gyp && npm cache clear && node-gyp configure || echo ""
RUN npm install -g nodemon

ENV NODE_ENV production
ENV NODE_VERSION 0.12.7
ENV NPM_VERSION 2.13.2

ENV ADMATRIX_API_SERVER http://dev-demo.admobilize.com
ENV ADMATRIX_DEVICE_ID '12:23:34:45:56'
ENV ADMATRIX_STREAMING_SERVER http://admatrix-streaming-server-1954957778.us-east-1.elb.amazonaws.com:80
ENV ADMATRIX_USER brian@rokk3rlabs.com
ENV ADMATRIX_PASSWORD Trudat55
ENV ADMATRIX_CLIENT_ID AdMobilizeClientID
ENV ADMATRIX_CLIENT_SECRET AdMobilizeClientSecret

EXPOSE 80 80
RUN apt-get -y update && apt-get install -y wget

## Sensor libs
RUN apt-get install -y bluetooth libbluetooth-dev libasound2-dev alsa-base alsa-utils


#Compile For Hardware
WORKDIR admatrix/
RUN npm rebuild

# Install Node modules

# RUN node app.js
CMD ["npm", "start"]
