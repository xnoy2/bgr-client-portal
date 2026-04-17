# Single-stage build — Debian-based PHP avoids Alpine library issues
FROM php:8.2-cli

# ── System dependencies ───────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl unzip zip \
        libpng-dev libjpeg-dev libfreetype6-dev \
        libxml2-dev libzip-dev libonig-dev \
    && rm -rf /var/lib/apt/lists/*

# ── PHP extensions ────────────────────────────────────────────────────────────
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo pdo_mysql mbstring exif pcntl bcmath gd zip xml

# ── Composer ──────────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ── Node.js 20 ────────────────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install PHP dependencies ──────────────────────────────────────────────────
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# ── Install & build frontend ──────────────────────────────────────────────────
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Composer post-install scripts (autoload dump etc.) ───────────────────────
RUN composer dump-autoload --optimize --no-dev

# ── Storage permissions ───────────────────────────────────────────────────────
RUN mkdir -p storage/logs storage/framework/cache \
        storage/framework/sessions storage/framework/views \
        bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE ${PORT:-8000}

CMD php artisan migrate --force \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
