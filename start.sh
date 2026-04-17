#!/bin/sh
set -e

echo "=== BGR Portal Boot ==="
echo "PORT=${PORT:-8000}"
echo "APP_ENV=${APP_ENV}"

# Run migrations (non-fatal — DB may not be ready yet)
echo "--- Running migrations..."
php artisan migrate --force 2>&1 && echo "✓ Migrations OK" || echo "⚠ Migrations failed (DB env vars may be missing)"

# Cache only if APP_KEY is set (required for config:cache)
if [ -n "$APP_KEY" ]; then
    echo "--- Caching config/routes/views..."
    php artisan config:cache 2>&1 || echo "⚠ Config cache failed"
    php artisan route:cache  2>&1 || echo "⚠ Route cache failed"
    php artisan view:cache   2>&1 || echo "⚠ View cache failed"
else
    echo "⚠ APP_KEY not set — skipping cache commands"
fi

echo "--- Starting server on 0.0.0.0:${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
