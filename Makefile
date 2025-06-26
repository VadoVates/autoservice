.PHONY: help build up down logs shell clean rebuild

help:
	@echo "Dostępne komendy:"
	@echo "  make build    - Zbuduj obrazy Docker"
	@echo "  make up       - Uruchom kontenery"
	@echo "  make down     - Zatrzymaj kontenery"
	@echo "  make logs     - Pokaż logi"
	@echo "  make shell    - Wejdź do shella kontenera (np. make shell service=backend)"
	@echo "  make clean    - Wyczyść volumeny i obrazy"
	@echo "  make rebuild  - Przebuduj i uruchom od nowa"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

shell:
	docker-compose exec $(service) /bin/bash

clean:
	docker-compose down -v
	docker system prune -f

rebuild: down clean build up

# Komendy developerskie
dev-backend:
	docker-compose exec backend bash

dev-frontend:
	docker-compose exec frontend sh

dev-db:
	docker-compose exec db mysql -u autoservice_user -pSecurePassword123! autoservice_db

# Komendy produkcyjne
prod-build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Backup bazy danych
backup-db:
	docker-compose exec db mysqldump -u root -p rootpassword123 autoservice_db > backup_$$(date +%Y%m%d_%H%M%S).sql

# Migracje
migrate:
	docker-compose exec backend alembic upgrade head

migrate-down:
	docker-compose exec backend alembic downgrade -1