FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache nginx
COPY package*.json ./
RUN npm install --production
COPY index.js ./
COPY nginx.conf /etc/nginx/http.d/default.conf
EXPOSE 80
CMD ["sh", "-c", "node index.js & nginx -g 'daemon off;'"]
