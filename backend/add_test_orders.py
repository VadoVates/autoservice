from models.base import SessionLocal
from models.order import Order
from models.vehicle import Vehicle
from datetime import datetime

db = SessionLocal()

try:
    # Sprawdź czy są pojazdy
    vehicles = db.query(Vehicle).all()
    if not vehicles:
        print("Brak pojazdów w bazie. Najpierw dodaj klientów i pojazdy.")
        exit()
    
    # Dodaj zlecenia testowe
    orders = [
        Order(
            customer_id=vehicles[0].customer_id,
            vehicle_id=vehicles[0].id,
            description="Wymiana klocków hamulcowych przód i tył, sprawdzenie tarcz",
            priority="high",
            status="new",
            estimated_cost=350.00
        ),
        Order(
            customer_id=vehicles[1].customer_id if len(vehicles) > 1 else vehicles[0].customer_id,
            vehicle_id=vehicles[1].id if len(vehicles) > 1 else vehicles[0].id,
            description="Przegląd okresowy, wymiana oleju i filtrów",
            priority="normal",
            status="in_progress",
            work_station_id=1,
            estimated_cost=250.00
        ),
        Order(
            customer_id=vehicles[0].customer_id,
            vehicle_id=vehicles[0].id,
            description="Naprawa układu chłodzenia - wyciek płynu",
            priority="urgent",
            status="new",
            estimated_cost=500.00
        ),
        Order(
            customer_id=vehicles[2].customer_id if len(vehicles) > 2 else vehicles[0].customer_id,
            vehicle_id=vehicles[2].id if len(vehicles) > 2 else vehicles[0].id,
            description="Diagnostyka komputerowa, błąd silnika",
            priority="normal",
            status="waiting_for_parts",
            work_station_id=2,
            estimated_cost=150.00
        ),
    ]
    
    for order in orders:
        db.add(order)
    
    db.commit()
    print(f"Dodano {len(orders)} zleceń testowych")
    
except Exception as e:
    print(f"Błąd: {e}")
    db.rollback()
finally:
    db.close()