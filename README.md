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

### 3.1 Frontend (JavaScript/TypeScript)

- **Framework:** Next.js 14.x (React 18.x)
- **Język:** TypeScript
- **Stylowanie:** Tailwind CSS
- **Zarządzanie stanem:** Redux Toolkit / Zustand
- **Routing:** Next.js App Router (wbudowany)
- **UI Components:** shadcn/ui lub Tailwind UI
- **Komunikacja z API:** Axios lub fetch
- **Wykresy:** Chart.js / Recharts
- **Formularze:** React Hook Form
- **Walidacja:** Zod / Yup

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
- **API Testing:** Postman/Insomnia / Swagger UI
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

- **Node.js:** 18.x LTS lub nowszy (20.x LTS zalecane)
- **npm:** 9.x lub nowszy (instalowany z Node.js)
- **Python:** 3.10+
- **MySQL:** 8.0+
- **Docker:** 20.10+ (opcjonalnie)

---

## 5. Instalacja

### 5.1 Instalacja wymaganych narzędzi

#### Node.js i npm

**Linux (Debian/Ubuntu):**
```bash
# Opcja 1: Z oficjalnego repozytorium NodeSource (zalecane)
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs npm

# Opcja 2: Przez snap
sudo snap install node --classic

# Opcja 3: Przez nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Sprawdź instalację
node --version  # Powinno pokazać v20.x.x
npm --version   # Powinno pokazać 10.x.x
```

**Windows:**
1. Pobierz instalator z https://nodejs.org/
2. Wybierz wersję LTS (20.x)
3. Uruchom instalator .msi
4. Upewnij się, że zaznaczona jest opcja "Add to PATH"
5. Zrestartuj terminal/cmd po instalacji

**macOS:**
```bash
# Przez Homebrew
brew install node

# Lub pobierz instalator z https://nodejs.org/
```

#### Python

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

**Windows:**
1. Pobierz z https://www.python.org/downloads/
2. Podczas instalacji zaznacz "Add Python to PATH"

#### MySQL

**Linux:**
```bash
sudo apt update
sudo apt install mariadb-server mariadb-client
# Celem szybkiej konfiguracji zalecane jest uruchomienie skryptu startowego
sudo mysql_secure_installation
```
**Windows:**
1. Pobierz MySQL Installer z https://dev.mysql.com/downloads/installer/
2. Wybierz "Developer Default" podczas instalacji

### 5.2 Przygotowanie projektu

#### Krok 1: Klonowanie repozytorium

```bash
sudo apt install git
git clone https://github.com/VadoVates/autoservice.git
cd autoservice
```

#### Krok 2: Utworzenie bazy danych

```bash
# Zaloguj się do MySQL - jeżeli ustawiłeś hasło roota to:
mariadb -u root -p
# Jeżeli hasło roota nie jest ustawione to:
sudo mariadb

# W konsoli MySQL wykonaj:
```
```sql
CREATE DATABASE autoservice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'autoservice_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON autoservice_db.* TO 'autoservice_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# Jest też przygotowany skrypt w pliku .sql, którego można użyć:
```sql
SOURCE ścieżka_do_sklonowanego_repozytorium/autoservice/create_db.sql;
exit;

```

### 5.3 Instalacja Backend

#### Krok 1: Przejdź do katalogu backend

```bash
cd backend
```

#### Krok 2: Utwórz i aktywuj środowisko wirtualne

```bash
# Linux/Mac
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

#### Krok 3: Instalacja zależności

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Krok 4: Konfiguracja zmiennych środowiskowych

```bash
# Utwórz plik .env
cp .env.example .env

# Edytuj .env celem ustawienia danych użytkownika
nano .env
```

#### Krok 5: Wykonaj migracje bazy danych

```bash
# Upewnij się, że venv jest aktywny: świadczy o tym napis `(venv)` na początku linii
alembic upgrade head
```

#### Krok 6: Uruchom serwer backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Lub
python main.py
```

Backend będzie dostępny pod adresem: http://localhost:8000
Dokumentacja API (Swagger UI): http://localhost:8000/docs

### 5.4 Instalacja Frontend

#### Krok 1: Otwórz nowy terminal i przejdź do katalogu frontend

```bash
cd autoservice/frontend
```

#### Krok 2: Instalacja dodatkowych zależności

```bash
# Podstawowe pakiety do komunikacji z API
npm install axios
npm install @tanstack/react-query  # Do zarządzania stanem serwera

# Pakiety do formularzy i walidacji
npm install react-hook-form zod @hookform/resolvers

# Opcjonalne - komponenty UI
npm install lucide-react  # Ikony
npm install react-hot-toast  # Powiadomienia
```

#### Krok 3: Konfiguracja połączenia z API

```bash
# Utwórz plik .env.local (Next.js używa .env.local zamiast .env)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

#### Krok 4: Uruchom aplikację frontend

```bash
npm run dev
```

Frontend będzie dostępny pod adresem: http://localhost:3000

### 5.5 Instalacja z użyciem Docker (opcjonalnie)

```bash
# W głównym katalogu projektu
docker-compose up -d --build

# Wykonaj migracje
docker-compose exec backend alembic upgrade head
```

---

## 6. Uruchomienie i użytkowanie

### 6.1 Pierwsze uruchomienie

1. **Backend musi być uruchomiony:**
   ```bash
   cd backend
   source venv/bin/activate  # Linux/Mac
   uvicorn main:app --reload
   ```

2. **Frontend w osobnym terminalu:**
   ```bash
   cd frontend
   npm start
   ```

3. **Dostęp do aplikacji:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - Dokumentacja API: http://localhost:8000/docs

### 6.2 Domyślne dane logowania

- Login: admin@autoservice.pl
- Hasło: Admin123! (zmień po pierwszym logowaniu)

### 6.3 Podstawowe procesy

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

---

## 7. Rozwiązywanie problemów

### Problem: "command not found: npm"
**Rozwiązanie:** Node.js nie jest zainstalowany lub nie jest w PATH. Zainstaluj Node.js zgodnie z instrukcją w sekcji 5.1.

### Problem: "No module named 'module_name'"
**Rozwiązanie:** Aktywuj środowisko wirtualne Python:
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# lub
venv\Scripts\activate  # Windows
```

### Problem: Błędy CORS
**Rozwiązanie:** Sprawdź czy backend jest uruchomiony i czy URL w frontend/.env jest poprawny.

### Problem: "alembic: command not found"
**Rozwiązanie:** Upewnij się, że venv jest aktywny i zainstaluj alembic:
```bash
pip install alembic
```

---

## 8. Struktura projektu

```
autoservice/
├── backend/
│   ├── alembic/              # Migracje bazy danych
│   ├── models/               # Modele SQLAlchemy
│   ├── venv/                 # Środowisko wirtualne Python
│   ├── main.py              # Punkt wejścia aplikacji
│   ├── requirements.txt      # Zależności Python
│   └── .env                 # Konfiguracja (nie commituj!)
├── frontend/
│   ├── public/               # Pliki statyczne
│   ├── src/
│   │   ├── components/       # Komponenty React
│   │   ├── pages/           # Strony aplikacji
│   │   ├── services/        # Komunikacja z API
│   │   └── App.js           # Główny komponent
│   ├── package.json         # Zależności npm
│   └── .env                 # Konfiguracja (nie commituj!)
├── .gitignore               # Pliki ignorowane przez Git
└── README.md               # Ten plik
```

---

## 9. Wsparcie i rozwój

### Zgłaszanie błędów
Utwórz issue na GitHub: https://github.com/VadoVates/autoservice/issues

### Kontakt
- Email: support@autoservice.pl
- Dokumentacja API: http://localhost:8000/docs
- Repozytorium: https://github.com/VadoVates/autoservice

## 10. Do zrobienia

### Do zrobienia na pewno
- Walidacja roku produkcji przy dodawaniu auta
- Oznaczyć zlecenia jako zakończone, tj. nie wiem gdzie miałbym przeciągnąć na stronie queue.
- Jak usunę użytkownika, to gdy jego samochód jest na naprawie, zaczynają się dziać dziwne rzeczy. Powinniśmy uzależnić możliwość usunięcia usera od tego czy samochód ma aktywny "order".
- Po utworzeniu nowego zlecenia pojawia się zlecenie, ale "Nieznany klient", a także zamiast samochodu jest "-". Poprawnie wyświetla się info o statusie "Normalny/Wysoki/Pilny" Po odświeżeniu strony jest już OK.
- Na liście zleceń sortowanie zleceń jest od najstarszego. Powinno być: najpierw wg ważności, a potem wg najstarszego.
- Historia wszystkich działań (może w bazie stworzyć na zasadzie akcji?) przypisana do każdego pojazdu. Przy realizacji naprawy, możliwość dodawania komentarza do auta. Tak żeby potem móc odszukać to zgłoszenie serwisowe.
- filtrowanie zleceń po parametrach (status realizacji)

### Planowane funkcjonalności
- Rozdzielenie klientów indywidualnych od firmowych
- Walidacja poprawności NIP-u
- Pobieranie z GUS danych firm po NIP-ie
- (może) Walidacja numeru rejestracyjnego (jeżeli istnieje baza i warunku?)
- Lista (może edytowalna?) marek pojazdów
- Możliwe, że i lista modeli (też edytowalna), może jakaś wyszukiwarka wersji/serii/pojemność silnika i typ (elektryk, benzyna, diesiel, hybryda, inne?)
- Sprawdzić czy jest możliwa walidacja numeru VIN?
- Sprawdzić czy jest możliwość pobrania historii pojazdu na podstawie VIN-u z Ministerstwa lub GUS

### Może kiedyś
- Poprawa funkcjonowania na mobilkach
- Moduł powiadomień SMS/email
- Aplikacja mobilna dla mechaników
- Integracja z systemami księgowymi
- Moduł analityczny i raporty
- Kalendarz przeglądów okresowych
