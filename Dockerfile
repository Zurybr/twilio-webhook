FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install
COPY index.js .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD curl -f http://localhost:3000/ || exit 1
CMD ["node", "index.js"]
