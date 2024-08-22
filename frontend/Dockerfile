# ---
# Builder
# ---
FROM node:16-alpine AS builder
ARG CI_COMMIT_SHA
LABEL git-commit=$CI_COMMIT_SHA
WORKDIR /app/

COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json

RUN npm i

COPY ./ ./

RUN npm run build --configuration=production

# ---
# Final image
# ---
FROM nginx:alpine

COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
