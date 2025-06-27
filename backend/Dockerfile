FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN python3 -m pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for static files
RUN mkdir -p /app/static /app/logs

# output of the app on the docker terminal
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["gunicorn", "-b", "0.0.0.0:8000", "-w", "4", "-k", "uvicorn.workers.UvicornWorkser", "main:app"]