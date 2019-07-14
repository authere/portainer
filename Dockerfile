FROM portainer/base
COPY dist /
COPY dist/portainer /

VOLUME /data
WORKDIR /
EXPOSE 9000

ENTRYPOINT ["/portainer"]
