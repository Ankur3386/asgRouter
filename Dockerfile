FROM node:22-alpine
WORKDIR /app
COPY ./package.json ./package.json
RUN npm i
COPY . .
CMD ["node","run","index.js"]
