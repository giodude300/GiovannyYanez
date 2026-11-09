FROM node:22.22.3-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


FROM nginx:alpine AS production

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist/financial-products-frontend/browser/ ./

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]