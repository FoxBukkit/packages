FROM amazoncorretto:21-alpine

RUN apt-get update && \
        apt-get install --no-install-recommends -y curl npm nodejs git wget

RUN mkdir -p /tools /plugins /data
VOLUME /data
RUN chown 1337:1337 /data /plugins

COPY updater /tools/updater
WORKDIR /tools/updater
RUN npm ci

COPY entrypoint.sh /tools/entrypoint.sh
ENV MAX_MEMORY=1G
ENV MINECRAFT_VERSION=1.20.1
USER 1337:1337
WORKDIR /data
CMD [ "/tools/entrypoint.sh" ]
