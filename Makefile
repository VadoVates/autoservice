include .env
export

.PHONY: help build up down logs shell clean rebuild dev-backend dev-frontend dev-db prod-build prod-up backup-db migrate migrate-down

help:
	@echo "Dostępne komendy:"
	@echo "  make build       - Zbuduj obrazy Docker"
	@echo "  make up          - Uruchom kontenery"
	@echo "  make down        - Zatrzymaj kontenery"
	@echo "  make logs        - Pokaż logi"
	@echo "  make shell       - Wejdź do shella kontenera (np. make shell service=backend)"
	@echo "  make clean       - Wyczyść volumeny i obrazy"
	@echo "  make rebuild     - Przebuduj i uruchom od nowa"
	@echo "  make dev-backend - Wejdź do backendu (bash)"
	@echo "  make dev-frontend- Wejdź do frontendu (sh)"
	@echo "  make dev-db      - Wejdź do mysql (db)"
	@echo "  make backup-db   - Dump bazy do pliku"
	@echo "  make migrate     - Alembic upgrade"
	@echo "  make migrate-down- Alembic downgrade -1"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

shell:
	docker compose exec $(service) sh

clean:
	docker compose down -v
	docker system prune -f

rebuild: down clean build up

# Komendy developerskie
dev-backend:
	docker compose exec backend bash

dev-frontend:
	docker compose exec frontend sh

# Uwaga - pozwala "zajrzeć" do bazy, ale stawia nowy kontener z klientem MySQL
dev-db:
	docker run -it --rm \
		--network autoservice_autoservice_network \
		-e MYSQL_PWD=$(MARIADB_PASSWORD) \
		mysql:8 \
		mysql -h mariadb -u $(MARIADB_USER) $(MARIADB_DATABASE)

# Backup bazy danych, uwaga - pozwala "zapisać" dane z bazy, ale stawia nowy kontener z klientem MySQL
backup-db:
	docker run --rm \
		--network autoservice_autoservice_network \
		-e MYSQL_PWD=$(MARIADB_PASSWORD) \
		mysql:8 \
		mysqldump --column-statistics=0 -h mariadb -u $(MARIADB_USER) $(MARIADB_DATABASE) > backup_$$(date +%Y%m%d_%H%M%S).sql

# Migracje
migrate:
	docker compose exec backend alembic upgrade head

migrate-down:
	docker compose exec backend alembic downgrade -1