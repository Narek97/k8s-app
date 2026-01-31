# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY public ./public
COPY src ./src

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Create nginx config for React routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri /index.html; \
    } \
    location /api { \
        proxy_pass http://backend-service:5000; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
