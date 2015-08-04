FROM debian:jessie

# Set the env variables to non-interactive
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

ENV NODE_ENV development

FROM buildpack-deps:jessie

# verify gpg and sha256: http://nodejs.org/dist/v0.10.30/SHASUMS256.txt.asc
# gpg: aka "Timothy J Fontaine (Work) <tj.fontaine@joyent.com>"
# gpg: aka "Julien Gilli <jgilli@fastmail.fm>"
RUN gpg --keyserver pool.sks-keyservers.net --recv-keys 7937DFD2AB06298B2293C3187D33FF9D0246406D 114F43EE0176B71C7BC219DD50A3051F888C628D

ENV NODE_VERSION 0.12.7
ENV NPM_VERSION 2.13.2

ENV ADMATRIX_API_SERVER http://localhost:1337
ENV ADMATRIX_DEVICE_ID 'fc:aa:14:9d:f6:32'
ENV ADMATRIX_STREAMING_SERVER http://localhost:1338
ENV ADMATRIX_USER diego@rokk3rlabs.com
ENV ADMATRIX_PASSWORD trudat
ENV ADMATRIX_CLIENT_ID AdMobilizeClientID
ENV ADMATRIX_CLIENT_SECRET AdMobilizeClientSecret

EXPOSE 80 80


# Install Node
RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
	&& curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
	&& gpg --verify SHASUMS256.txt.asc \
	&& grep " node-v$NODE_VERSION-linux-x64.tar.gz\$" SHASUMS256.txt.asc | sha256sum -c - \
	&& tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
	&& rm "node-v$NODE_VERSION-linux-x64.tar.gz" SHASUMS256.txt.asc \
	&& npm install -g npm@"$NPM_VERSION" \
	&& npm cache clear

RUN apt-get -y update && apt-get install -y wget
RUN apt-get install -y bluetooth
RUN apt-get install -y libbluetooth-dev

## Find Node
RUN wget https://deb.nodesource.com/setup_0.12 | bash -
RUN apt-get install -y nodejs

RUN npm install -g nodemon

ADD . matrix/

WORKDIR matrix/
# Install Node modules

# RUN node app.js
