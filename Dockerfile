# syntax=docker/dockerfile:1.5

# ---------- Backend builder ----------
FROM python:3.11-slim AS backend-build

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# ---------- Frontend builder ----------
FROM node:20-slim AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- Final image ----------
FROM python:3.11-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=rotuprinters.settings

WORKDIR /app

# Copiar dependencias y código del backend
COPY --from=backend-build /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=backend-build /usr/local/bin /usr/local/bin
COPY --from=backend-build /backend /app

# Copiar build compilado del frontend para servir archivos estáticos
COPY --from=frontend-build /frontend/dist /app/frontend_dist

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && \
python create_initial_user.py && \
python manage.py collectstatic --noinput && \
gunicorn rotuprinters.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]

