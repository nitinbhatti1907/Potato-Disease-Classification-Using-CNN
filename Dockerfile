# =========================
# 1) Build frontend
# =========================
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Build-time env for React (CRA). Empty means axios will call /predict on same host.
ENV REACT_APP_API_URL=""
RUN npm run build


# =========================
# 2) Build backend image
# =========================
FROM python:3.11-slim

WORKDIR /app

# Install backend dependencies
COPY api/requirements.txt /app/api/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r /app/api/requirements.txt

# Copy backend + model + built frontend
COPY api /app/api
COPY saved_models /app/saved_models
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# Hugging Face Docker Spaces default port
EXPOSE 7860

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
