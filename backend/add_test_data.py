from models.base import SessionLocal
from models.customer import Customer
from models.vehicle import Vehicle
from models.work_station import WorkStation
from datetime import datetime

db = SessionLocal()

try:
    # Najpierw dodaj stanowiska
    stations = [
        WorkStation(id=1, name="Stanowisko 1", is_active=True),
        WorkStation(id=2, name="Stanowisko 2", is_active=True),
    ]
    
    for station in stations:
        existing = db.query(WorkStation).filter(WorkStation.id == station.id).first()
        if not existing:
            db.add(station)
    
    # Dodaj klientów
    customers = [
        Customer(name="Jan Kowalski", phone="123456789", email="jan@example.com", address="ul. Testowa 1, Warszawa"),
        Customer(name="Anna Nowak", phone="987654321", email="anna@example.com", address="ul. Przykładowa 10, Kraków"),
        Customer(name="Piotr Wiśniewski", phone="555444333", email="piotr@example.com", address="ul. Główna 5, Poznań")
    ]
    
    for customer in customers:
        db.add(customer)
    
    db.commit()
    print(f"Dodano {len(customers)} klientów")
    
    # Pobierz ID dodanych klientów
    all_customers = db.query(Customer).all()
    
    # Dodaj pojazdy
    vehicles = [
        Vehicle(customer_id=all_customers[0].id, brand="Toyota", model="Corolla", year=2020, registration_number="WA12345"),
        Vehicle(customer_id=all_customers[1].id, brand="Ford", model="Focus", year=2019, registration_number="KR98765"),
        Vehicle(customer_id=all_customers[2].id, brand="Volkswagen", model="Golf", year=2021, registration_number="PO55555"),
        Vehicle(customer_id=all_customers[0].id, brand="Honda", model="Civic", year=2018, registration_number="WA99999"),
    ]
    
    for vehicle in vehicles:
        db.add(vehicle)
    
    db.commit()
    print(f"Dodano {len(vehicles)} pojazdów")
    
except Exception as e:
    print(f"Błąd: {e}")
    db.rollback()
finally:
    db.close()