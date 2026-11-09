FROM node:22.22.3-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


FROM node:22.22.3-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3002

CMD ["node", "dist/main.js"]