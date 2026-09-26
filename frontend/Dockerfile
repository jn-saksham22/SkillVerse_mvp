FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html ./index.html
COPY vite.config.js ./vite.config.js
COPY src ./src
RUN npm run build

FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080

ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-g", "daemon off;"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
