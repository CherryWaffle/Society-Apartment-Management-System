FROM node:20-alpine

WORKDIR /app

# Expo requires some extra dependencies in Alpine
RUN apk add --no-cache bash git

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

CMD ["npm", "run", "start"]
