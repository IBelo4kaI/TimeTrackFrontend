# Сборка приложения
FROM node:22-alpine AS build-stage

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение для production
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production-stage

# Копируем собранное приложение из build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx (опционально)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]