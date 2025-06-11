# System Zarządzania Warsztatem Samochodowym

## Strona tytułowa

**Nazwa projektu:** AutoService Manager  
**Wersja:** 1.0  
**Data:** Grudzień 2024  
**Autorzy:** [Marek & Filip]  
**Typ projektu:** Aplikacja webowa

---

## 1. Cele i założenia projektu

### 1.1 Cel główny

Stworzenie kompleksowego systemu informatycznego wspomagającego zarządzanie warsztatem samochodowym, automatyzującego procesy biznesowe i zwiększającego efektywność pracy.

### 1.2 Cele szczegółowe

- Cyfryzacja procesu przyjmowania i obsługi zleceń napraw
- Optymalizacja wykorzystania stanowisk warsztatowych
- Automatyzacja zarządzania kolejką napraw z uwzględnieniem priorytetów
- Usprawnienie procesu zamawiania części zamiennych
- Automatyzacja wystawiania dokumentów księgowych
- Poprawa komunikacji z klientami
- Redukcja błędów wynikających z ręcznego prowadzenia dokumentacji

### 1.3 Założenia projektowe

- System obsługuje 2 stanowiska warsztatowe pracujące równolegle
- Dostępna jest wystarczająca liczba pracowników
- System priorytetyzacji umożliwia przyspieszenie obsługi wybranych klientów
- Aplikacja działa w architekturze klient-serwer
- Dane przechowywane są w relacyjnej bazie danych

---

## 2. Zastosowanie projektu

### 2.1 Obszary zastosowania

- **Małe i średnie warsztaty samochodowe** - podstawowa grupa docelowa
- **Serwisy dealerskie** - po rozbudowie o dodatkowe funkcjonalności
- **Warsztaty specjalistyczne** (np. blacharskie, lakiernicze)
- **Firmy flotowe** z własnym zapleczem serwisowym

### 2.2 Korzyści biznesowe

- **Zwiększenie przepustowości** - optymalne wykorzystanie stanowisk
- **Redukcja czasu obsługi** - automatyzacja procesów administracyjnych
- **Poprawa jakości obsługi** - system priorytetów dla kluczowych klientów
- **Kontrola kosztów** - śledzenie zużycia części i czasu pracy
- **Profesjonalizacja** - elektroniczne dokumenty i historia napraw

### 2.3 Funkcjonalności kluczowe

1. **Moduł przyjmowania zleceń**

   - Rejestracja klienta i pojazdu
   - Opis usterek i zakres prac
   - Wstępna wycena

2. **Moduł zarządzania kolejką**

   - Wizualizacja obciążenia stanowisk
   - System priorytetów (normalny/wysoki/pilny)
   - Automatyczne przydzielanie zleceń

3. **Moduł części zamiennych**

   - Katalog części
   - Śledzenie stanów magazynowych
   - Generowanie zamówień

4. **Moduł fakturowania**
   - Generowanie rachunków/faktur
   - Eksport do PDF
   - Rejestr dokumentów

---

## 3. Technologie i oprogramowanie

### 3.1 Frontend (JavaScript)

- **Framework:** React 18.x
- **Zarządzanie stanem:** Redux Toolkit
- **Routing:** React Router v6
- **UI Framework:** Material-UI (MUI) v5
- **Komunikacja z API:** Axios
- **Wykresy:** Chart.js
- **Formularze:** React Hook Form
- **Walidacja:** Yup

### 3.2 Backend (Python)

- **Framework:** FastAPI 0.104.x
- **ORM:** SQLAlchemy 2.0
- **Migracje:** Alembic
- **Walidacja:** Pydantic
- **Autentykacja:** JWT (PyJWT)
- **CORS:** FastAPI middleware
- **Generowanie PDF:** ReportLab
- **Testy:** pytest

### 3.3 Baza danych

- **System:** MySQL 8.0
- **Narzędzie administracyjne:** phpMyAdmin (opcjonalnie)
- **Backup:** mysqldump (automatyczny co 24h)

### 3.4 Narzędzia deweloperskie

- **Kontrola wersji:** Git
- **Konteneryzacja:** Docker & Docker Compose
- **IDE:** VS Code
- **API Testing:** Postman/Insomnia
- **Linting:** ESLint (JS), Pylint (Python)

---

## 4. Wymagania systemowe

### 4.1 Serwer

- **System operacyjny:** Ubuntu 22.04 LTS / Windows Server 2019+
- **Procesor:** min. 2 rdzenie, 2.4 GHz
- **RAM:** min. 4 GB (zalecane 8 GB)
- **Dysk:** min. 20 GB wolnego miejsca
- **Sieć:** stałe łącze internetowe

### 4.2 Stacja robocza (klient)

- **Przeglądarka:** Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Rozdzielczość:** min. 1366x768
- **RAM:** min. 2 GB
- **Połączenie:** dostęp do sieci lokalnej/internetu

### 4.3 Oprogramowanie wymagane do uruchomienia

- **Node.js:** 18.x LTS
- **Python:** 3.10+
- **MySQL:** 8.0+
- **Docker:** 20.10+ (opcjonalnie)
- **npm/yarn:** najnowsza wersja

---

## 5. Instalacja

### 5.1 Przygotowanie środowiska

#### Krok 1: Klonowanie repozytorium

```bash
git clone https://github.com/VadoVice/autoservice.git
cd autoservice
```

#### Krok 2: Instalacja MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Windows - pobierz instalator ze strony MySQL
```

#### Krok 3: Utworzenie bazy danych

```sql
CREATE DATABASE autoservice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'autoservice_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON autoservice_db.* TO 'autoservice_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5.2 Instalacja Backend

#### Krok 1: Środowisko wirtualne Python

```bash
cd backend
python3 -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### Krok 2: Instalacja zależności

```bash
pip install -r requirements.txt
```

#### Krok 3: Konfiguracja

```bash
# Skopiuj plik konfiguracji
cp .env.example .env

# Edytuj .env i ustaw parametry połączenia z bazą
nano .env
```

Zawartość .env:

```
DATABASE_URL=mysql+pymysql://autoservice_user:SecurePassword123!@localhost/autoservice_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Krok 4: Migracje bazy danych

```bash
alembic upgrade head
```

#### Krok 5: Uruchomienie serwera

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5.3 Instalacja Frontend

#### Krok 1: Instalacja zależności

```bash
cd ../frontend
npm install
```

#### Krok 2: Konfiguracja

```bash
# Skopiuj plik konfiguracji
cp .env.example .env

# Ustaw adres API
echo "REACT_APP_API_URL=http://localhost:8000" > .env
```

#### Krok 3: Uruchomienie aplikacji

```bash
npm start
```

### 5.4 Instalacja z użyciem Docker (zalecana)

#### Krok 1: Zbudowanie i uruchomienie kontenerów

```bash
docker-compose up -d --build
```

#### Krok 2: Wykonanie migracji

```bash
docker-compose exec backend alembic upgrade head
```

#### Krok 3: Utworzenie użytkownika administracyjnego

```bash
docker-compose exec backend python create_admin.py
```

---

## 6. Uruchomienie i użytkowanie

### 6.1 Pierwsze uruchomienie

1. **Dostęp do aplikacji**

   - Otwórz przeglądarkę
   - Przejdź pod adres: `http://localhost:3000`

2. **Logowanie**

   - Login: admin@autoservice.pl
   - Hasło: Admin123! (zmień po pierwszym logowaniu)

3. **Konfiguracja początkowa**
   - Uzupełnij dane warsztatu
   - Skonfiguruj stanowiska
   - Dodaj pracowników

### 6.2 Podstawowe procesy

#### Przyjmowanie zlecenia

1. Kliknij "Nowe zlecenie" w menu głównym
2. Wyszukaj lub dodaj klienta
3. Dodaj dane pojazdu (marka, model, nr rej.)
4. Opisz usterki i zakres prac
5. Ustaw priorytet (normalny/wysoki/pilny)
6. Zapisz zlecenie

#### Zarządzanie kolejką

1. Przejdź do "Kolejka napraw"
2. System automatycznie przydziela zlecenia do stanowisk
3. Możesz ręcznie przeciągać zlecenia między stanowiskami
4. Zlecenia z wysokim priorytetem są oznaczone kolorem

#### Zamawianie części

1. W szczegółach zlecenia kliknij "Dodaj części"
2. Wyszukaj część w katalogu
3. Jeśli brak na stanie, system utworzy zamówienie
4. Potwierdź zamówienie w module "Zamówienia"

#### Wystawianie rachunku

1. Po zakończeniu naprawy przejdź do zlecenia
2. Kliknij "Wystaw rachunek"
3. System automatycznie pobierze dane
4. Zweryfikuj kwoty i kliknij "Generuj PDF"

### 6.3 Backup i odzyskiwanie

#### Automatyczny backup

```bash
# Dodaj do crontab
0 2 * * * mysqldump -u autoservice_user -p'SecurePassword123!' autoservice_db > /backup/autoservice_$(date +%Y%m%d).sql
```

#### Przywracanie z backupu

```bash
mysql -u autoservice_user -p autoservice_db < /backup/autoservice_20241201.sql
```

### 6.4 Rozwiązywanie problemów

**Problem:** Aplikacja nie łączy się z bazą danych

- Sprawdź czy MySQL jest uruchomiony
- Zweryfikuj dane dostępowe w pliku .env
- Sprawdź logi: `docker-compose logs backend`

**Problem:** Błędy CORS w przeglądarce

- Upewnij się, że backend nasłuchuje na właściwym porcie
- Sprawdź konfigurację CORS w backend/main.py

**Problem:** Brak stylów w aplikacji

- Wyczyść cache przeglądarki
- Przebuduj frontend: `npm run build`

---

## 7. Struktura projektu

```
autoservice/
├── backend/
│   ├── alembic/              # Migracje bazy danych
│   ├── api/                  # Endpointy API
│   ├── core/                 # Konfiguracja, security
│   ├── models/               # Modele SQLAlchemy
│   ├── schemas/              # Schematy Pydantic
│   ├── services/             # Logika biznesowa
│   ├── tests/                # Testy jednostkowe
│   ├── main.py              # Punkt wejścia aplikacji
│   └── requirements.txt      # Zależności Python
├── frontend/
│   ├── public/               # Pliki statyczne
│   ├── src/
│   │   ├── components/       # Komponenty React
│   │   ├── pages/           # Strony aplikacji
│   │   ├── services/        # Komunikacja z API
│   │   ├── store/           # Redux store
│   │   └── utils/           # Funkcje pomocnicze
│   └── package.json         # Zależności npm
├── docker-compose.yml       # Konfiguracja Docker
└── README.md               # Dokumentacja
```

---

## 8. Dalszy rozwój

### Planowane funkcjonalności

- Moduł powiadomień SMS/email
- Aplikacja mobilna dla mechaników
- Integracja z systemami księgowymi
- Moduł analityczny i raporty
- Kalendarz przeglądów okresowych
- System ocen i opinii klientów

### Wsparcie techniczne

- Email: support@autoservice.pl
- Dokumentacja API: http://localhost:8000/docs
- Repozytorium: https://github.com/VadoVice/autoservice
