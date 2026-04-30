FROM node:20-alpine AS build
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG PROD_API_URL
ENV PROD_API_URL=$PROD_API_URL

#RUN npm run build -- --configuration staging
RUN npm run build -- --configuration production

FROM nginx:alpine

COPY --from=build /app/dist/client/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx
