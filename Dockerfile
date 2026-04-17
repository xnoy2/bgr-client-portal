# ── Stage 1: PHP + Composer dependencies ─────────────────────────────────────
FROM php:8.2-cli-alpine AS vendor

RUN apk add --no-cache \
        git curl unzip libpng-dev libjpeg-turbo-dev freetype-dev \
        libxml2-dev oniguruma-dev zip libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo pdo_mysql mbstring exif pcntl bcmath gd zip xml

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# ── Stage 2: Node — build frontend assets ────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 3: Final runtime image ──────────────────────────────────────────────
FROM php:8.2-cli-alpine AS runtime

RUN apk add --no-cache \
        libpng libjpeg-turbo freetype libxml2 oniguruma libzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo pdo_mysql mbstring exif pcntl bcmath gd zip xml

WORKDIR /app

# Copy app source
COPY . .

# Copy vendor from stage 1
COPY --from=vendor /app/vendor ./vendor

# Copy compiled frontend assets from stage 2
COPY --from=frontend /app/public/build ./public/build

# Storage & cache permissions
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions \
        storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE ${PORT:-8000}

CMD php artisan migrate --force \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
