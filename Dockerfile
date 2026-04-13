# syntax=docker/dockerfile:1

FROM caddy:2-alpine

# OCI standard labels (build-time args populated by GitHub Actions)
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.opencontainers.image.title="Diceware Passphrase Generator" \
      org.opencontainers.image.description="Cryptographically secure Diceware passphrase generator — zero dependencies, all client-side" \
      org.opencontainers.image.url="https://diceware.rempe.us" \
      org.opencontainers.image.source="https://github.com/grempe/diceware" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}"

# Copy production Caddyfile
COPY Caddyfile.production /etc/caddy/Caddyfile

# Copy static assets
COPY index.html faq.html favicon.ico robots.txt sitemap.xml /srv/

COPY css/ /srv/css/
COPY js/ /srv/js/
COPY lists/*.js /srv/lists/
COPY reports/ /srv/reports/

EXPOSE 8080
