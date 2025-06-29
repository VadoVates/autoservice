#!/bin/bash
# autoservice/setup.sh - Inicjalizacja projektu z Docker

set -e

echo "🚀 Inicjalizacja projektu autoservice z Docker..."

# Sprawdź czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany!"
    echo "📥 Zainstaluj Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose nie jest zainstalowany!"
    exit 1
fi

# Sprawdź czy plik .env istnieje
if [ ! -f .env ]; then
    echo "📝 Tworzenie pliku .env z .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "⚠️  WAŻNE: Edytuj plik .env przed kontynuowaniem!"
        echo "📝 Otwórz .env i ustaw prawdziwe hasła."
        echo ""
        echo "Przykład edycji:"
        echo "MARIADB_PASSWORD=TwojeRzeczywiste_Haslo123!"
        echo "SECRET_KEY=twoj-bardzo-tajny-klucz-produkcyjny"
        echo ""
        read -p "Naciśnij Enter gdy zakończysz edycję .env..."
    else
        echo "❌ Brak pliku .env.example!"
        echo "📝 Tworze podstawowy plik .env..."
        cat > .env << EOF
MARIADB_RANDOM_ROOT_PASSWORD=yes
MARIADB_DATABASE=autoservice_db
MARIADB_USER=autoservice_user
MARIADB_PASSWORD=SecurePassword123!

SECRET_KEY=change-this-secret-key-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
        echo "✅ Utworzono podstawowy plik .env"
    fi
fi

# Zatrzymaj istniejące kontenery
echo "🛑 Zatrzymuję istniejące kontenery..."
docker-compose down 2>/dev/null || true

# Wyczyść stare obrazy (opcjonalnie)
read -p "🗑️  Czy wyczyścić stare obrazy Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Czyszczenie starych obrazów..."
    docker system prune -f
fi

# Zbuduj obrazy
echo "🔨 Budowanie obrazów Docker..."
docker-compose build

# Uruchom serwisy
echo "🚀 Uruchamianie serwisów..."
docker-compose up -d

# Czekaj na bazę danych
echo "⏳ Czekanie na gotowość bazy danych..."
timeout=60
while ! docker-compose exec -T mariadb mysqladmin ping -h localhost --silent 2>/dev/null; do
    echo -n "."
    sleep 2
    timeout=$((timeout-2))
    if [ $timeout -le 0 ]; then
        echo ""
        echo "❌ Timeout podczas oczekiwania na bazę danych!"
        echo "🔍 Sprawdź logi: docker-compose logs mariadb"
        exit 1
    fi
done
echo " ✅"

# Czekaj na backend
echo "⏳ Czekanie na gotowość backendu..."
timeout=60
while ! curl -f http://localhost:8000/health &>/dev/null; do
    echo -n "."
    sleep 2
    timeout=$((timeout-2))
    if [ $timeout -le 0 ]; then
        echo ""
        echo "⚠️  Backend może nie być gotowy, ale kontynuujemy..."
        break
    fi
done
echo " ✅"

# Wykonaj migracje
echo "🗄️  Wykonywanie migracji bazy danych..."
if docker-compose exec backend alembic upgrade head; then
    echo "✅ Migracje wykonane pomyślnie"
else
    echo "⚠️  Błąd podczas migracji - sprawdź logi backendu"
fi

# Sprawdź status
echo ""
echo "🔍 Status serwisów:"
docker-compose ps

echo ""
echo "✅ Projekt autoservice został uruchomiony!"
echo ""
echo "🌐 Dostępne aplikacje:"
echo "   Frontend:        http://localhost:3000"
echo "   Backend API:     http://localhost:8000"
echo "   API Docs:        http://localhost:8000/docs"
echo ""
echo "📋 Przydatne komendy:"
echo "   make logs        # Pokaż logi wszystkich serwisów"
echo "   make logs backend # Pokaż logi tylko backendu"
echo "   make down        # Zatrzymaj wszystkie serwisy"
echo "   make shell service=backend  # Wejdź do kontenera backendu"
echo "   ./starting_script.sh  # Uruchom lokalnie (bez Docker)"
echo ""
echo "🔧 W razie problemów:"
echo "   docker-compose logs     # Wszystkie logi"
echo "   docker-compose ps       # Status kontenerów"
echo "   docker-compose restart  # Restart serwisów"
echo ""