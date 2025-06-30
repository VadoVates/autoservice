# System Zarządzania Warsztatem Samochodowym

## Strona tytułowa

**Nazwa projektu:** AutoService Manager
**Wersja:** 3.0
**Data:** Czerwiec 2025
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

- **Frontend:** Next.js (React 18), TypeScript, Tailwind CSS, React Hook Form, Zod
- **Backend:** FastAPI, SQLAlchemy 2.0, Alembic, JWT, Pydantic
- **Baza danych:** MySQL 8.0
- **Konteneryzacja:** Docker

---

## 4. Instalacja

### 4.1 Wymagania

- Należy zainstalować Dockera (nie musi być to wersja Desktop) zgodnie z instrukcjami z linka: https://docs.docker.com/get-started/get-docker/
- Git
```bash
# Ubuntu/Debian
sudo apt install git
```

```bash
# Windows
https://git-scm.com/downloads/win
```
- (Opcjonalnie) `make` do wygodnego zarządzania
```bash
# Ubuntu/Debian
sudo apt install make
```

### 4.2 Kroki
```bash
# Klonowanie repozytorium
git clone https://github.com/VadoVates/autoservice.git
cd autoservice

# Przygotowanie pliku konfiguracyjnego
cp .env.example .env
```
Na tym etapie warto otworzyć plik .env (plik ukryty) aby ustawić hasła i nazwę użytkownika dla bazy danych.
```bash
# Zbudowanie aplikacji
make build
# Uruchomienie aplikacji
make up
# Dodatkowe komendy/pomoc
make help
```

### 4.3 Dostęp

- Backend będzie dostępny pod adresem: http://localhost:8000
- Dokumentacja API (Swagger UI): http://localhost:8000/docs
- Frontend dostępny pod adresem: http://localhost:3000

Numery portów to wartości domyślne. Można je zmienić w pliku `.env`.

---

## 5. Komendy Makefile
Uruchomienie: `make help`

Najważniejsze:
- `make up` - start kontenerów,
- `make down` – zatrzymanie kontenerów
- `make shell service=backend` – wejście do kontenera backendu
- `make migrate` – migracje Alembica
- `make backup-db` – kopia zapasowa bazy danych

## 6. Instrukcja obsługi
### 6.1 Przyjmowanie zlecenia

1. Kliknij "Nowe zlecenie" w menu głównym
2. Wyszukaj lub dodaj klienta
3. Dodaj dane pojazdu (marka, model, nr rej.)
4. Opisz usterki i zakres prac
5. Ustaw priorytet (normalny/wysoki/pilny)
6. Zapisz zlecenie

### 6.2 Zarządzanie kolejką

1. Przejdź do "Kolejka napraw"
2. System automatycznie przydziela zlecenia do stanowisk
3. Możesz ręcznie przeciągać zlecenia między stanowiskami
4. Zlecenia z wysokim priorytetem są oznaczone kolorem

### 6.3 Zamawianie części

1. W szczegółach zlecenia kliknij "Dodaj części"
2. Wyszukaj część w katalogu
3. Jeśli brak na stanie, system utworzy zamówienie
4. Potwierdź zamówienie w module "Zamówienia"

### 6.4 Wystawianie rachunku

1. Po zakończeniu naprawy przejdź do zlecenia
2. Kliknij "Wystaw rachunek"
3. System automatycznie pobierze dane
4. Zweryfikuj kwoty i kliknij "Generuj PDF"

---

## 7. Planowane funkcjonalności

- Drag & Drop trochę działa w taki "sloppy" sposób
- Filtrowanie przypadków Pilnych i Ważnych w liście zleceń
- Rozdzielenie klientów indywidualnych od firmowych
- Historia wszystkich działań (może w bazie stworzyć na zasadzie akcji?) przypisana do każdego pojazdu. Przy realizacji naprawy, możliwość dodawania komentarza do auta. Tak żeby potem móc odszukać to zgłoszenie serwisowe.
- Walidacja poprawności NIP-u
- Pobieranie z GUS danych firm po NIP-ie
- (może) Walidacja numeru rejestracyjnego (jeżeli istnieje baza i warunku?)
- Lista (może edytowalna?) marek pojazdów
- Możliwe, że i lista modeli (też edytowalna), może jakaś wyszukiwarka wersji/serii/pojemność silnika i typ (elektryk, benzyna, diesiel, hybryda, inne?)
- Sprawdzić, czy jest możliwa walidacja numeru VIN?
- Sprawdzić, czy jest możliwość pobrania historii pojazdu na podstawie VIN-u z Ministerstwa lub GUS
- Konteneryzacja aplikacji celem umieszczenia na serwerze

### Może kiedyś
- Poprawa funkcjonowania na mobilkach
- Moduł powiadomień SMS/email
- Aplikacja mobilna dla mechaników
- Integracja z systemami księgowymi
- Moduł analityczny i raporty
- Kalendarz przeglądów okresowych
- Konfigurowalna ilość stanowisk przy starcie

## 8. Kontakt i rozwój
- Repozytorium: https://github.com/VadoVates/autoservice
- Dokumentacja API: http://localhost:8000
- Zgłoszenia błędów: GitHub Issues