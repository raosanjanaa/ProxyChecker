# Stage 1: Build the Vite Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve the Unified Stack via FastAPI
FROM python:3.10-slim
WORKDIR /app/backend

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend logic
COPY backend/ ./

# Copy built frontend from Stage 1 into the parent directory for static mounting
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Cloud Run injects $PORT (usually 8080)
EXPOSE 8080
ENV PORT=8080

# Keep the Uvicorn command dynamic to listen to the $PORT env var
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
