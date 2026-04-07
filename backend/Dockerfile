FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for graspologic/networkx
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY . .

ENV PORT=8080

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
