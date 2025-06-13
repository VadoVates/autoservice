from models.base import SessionLocal
from models.customer import Customer
from models.vehicle import Vehicle

# Utwórz sesję
db = SessionLocal()

try:
    # Dodaj testowego klienta
    customer = Customer(
        name="Jan Kowalski",
        phone="123456789",
        email="jan@example.com",
        address="ul. Testowa 1, Warszawa"
    )
    db.add(customer)
    db.commit()
    
    print(f"Dodano klienta: {customer.name} (ID: {customer.id})")
    
    # Dodaj pojazd
    vehicle = Vehicle(
        customer_id=customer.id,
        brand="Toyota",
        model="Corolla",
        year=2020,
        registration_number="WA12345"
    )
    db.add(vehicle)
    db.commit()
    
    print(f"Dodano pojazd: {vehicle.brand} {vehicle.model}")
    
    # Sprawdź
    all_customers = db.query(Customer).all()
    print(f"\nWszyscy klienci ({len(all_customers)}):")
    for c in all_customers:
        print(f"- {c.name}")
        
except Exception as e:
    print(f"Błąd: {e}")
    db.rollback()
finally:
    db.commit()
    db.close()