FROM openjdk:22-slim

RUN apt-get update && \
        apt-get install --no-install-recommends -y curl npm nodejs git wget

RUN mkdir -p /tools /plugins /data
VOLUME /data
RUN chown 1337:1337 /data /plugins

RUN wget https://api.papermc.io/v2/projects/paper/versions/1.20.1/builds/169/downloads/paper-1.20.1-169.jar -O /server.jar

RUN git clone https://github.com/FoxBukkit/maven-downloader /tools/maven-downloader
WORKDIR /tools/maven-downloader
RUN npm ci

COPY update.sh /tools/update.sh

COPY entrypoint.sh /tools/entrypoint.sh
ENV MAX_MEMORY=1G
USER 1337:1337
CMD [ "/tools/entrypoint.sh" ]
