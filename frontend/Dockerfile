FROM node:22-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Copier les traductions vers le dossier locales
RUN mkdir -p public/locales && cp src/locales/*.json public/locales/
 
RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache openssl

COPY --from=builder /app/dist /usr/share/nginx/html

# Copier les traductions vers un dossier accessible
COPY --from=builder /app/public/locales /usr/share/nginx/html/locales

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /etc/nginx/ssl && \
    openssl genrsa -out /etc/nginx/ssl/nginx.key 2048 && \
    openssl req -new -x509 -key /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt -days 365 \
    -subj "/C=FR/ST=France/L=Paris/O=Dev/CN=localhost"

# Expose port
EXPOSE 80 443

# Development command
CMD ["nginx", "-g", "daemon off;"]