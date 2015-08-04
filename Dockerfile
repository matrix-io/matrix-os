FROM debian:jessie

# Set the env variables to non-interactive
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

ENV NODE_ENV development

RUN apt-get -y update && apt-get install -y wget

## Find Node
RUN wget https://deb.nodesource.com/setup_0.12 | bash -
RUN apt-get install -y nodejs

# Install Node

ADD . matrix/

WORKDIR matrix/
# Install Node modules
# RUN node app.js
