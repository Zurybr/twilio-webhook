FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm init -y && npm install express twilio dotenv
COPY index.js .
EXPOSE 3000
CMD ["node", "index.js"]
