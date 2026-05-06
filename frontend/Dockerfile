# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We build the vite react app
RUN npm run build

# Serve stage
FROM nginx:alpine
# Copy the built assets from the build stage to NGINX serve directory
COPY --from=build /app/dist /usr/share/nginx/html
# Add a custom nginx config if routing is needed for react router, otherwise default works for simple apps.
# For React Router to work with direct URLs, we need to fallback to index.html
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
