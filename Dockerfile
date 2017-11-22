FROM node:8

MAINTAINER Sean Canton <sean.canton@admobilize.com>

RUN apt-get update && apt-get install -yq libzmq3-dev \
  && apt-get clean && rm -rf /var/tmp/*

ENV REINSTALL_NODE_MODULES 1

COPY . /matrix
RUN chmod +x /matrix/docker-entrypoint.sh

WORKDIR matrix/

EXPOSE 80
ENTRYPOINT ["/matrix/docker-entrypoint.sh"]
CMD ["node"]
