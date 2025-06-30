from models.base import SessionLocal
from models.order import Order, Priority, OrderStatus
from models.vehicle import Vehicle
from models.part import Part
from models.order_part import OrderPart
import random

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
            priority=Priority.HIGH,
            status=OrderStatus.NEW,
            estimated_cost=350.00
        ),
        Order(
            customer_id=vehicles[1].customer_id if len(vehicles) > 1 else vehicles[0].customer_id,
            vehicle_id=vehicles[1].id if len(vehicles) > 1 else vehicles[0].id,
            description="Przegląd okresowy, wymiana oleju i filtrów",
            priority=Priority.NORMAL,
            status=OrderStatus.IN_PROGRESS,
            work_station_id=1,
            estimated_cost=250.00
        ),
        Order(
            customer_id=vehicles[0].customer_id,
            vehicle_id=vehicles[0].id,
            description="Naprawa układu chłodzenia - wyciek płynu",
            priority=Priority.URGENT,
            status=OrderStatus.IN_PROGRESS,
            work_station_id=2,
            estimated_cost=500.00
        ),
        Order(
            customer_id=vehicles[2].customer_id if len(vehicles) > 2 else vehicles[0].customer_id,
            vehicle_id=vehicles[2].id if len(vehicles) > 2 else vehicles[0].id,
            description="Diagnostyka komputerowa, błąd silnika",
            priority=Priority.NORMAL,
            status=OrderStatus.WAITING_FOR_PARTS,
            estimated_cost=150.00
        ),
    ]

    for order in orders:
        db.add(order)

    db.commit()
    print(f"Dodano {len(orders)} zleceń testowych")

    # Przypisz części do zleceń
    all_parts = db.query(Part).all()
    all_orders = db.query(Order).all()

    for order in all_orders:
        used_parts = random.sample(all_parts, k=min(2, len(all_parts)))
        for part in used_parts:
            op = OrderPart(
                order_id=order.id,
                part_id=part.id,
                quantity=random.randint(1, 3),
                unit_price=part.price
            )
            db.add(op)

    db.commit()
    print("Dodano części do zleceń")

except Exception as e:
    print(f"Błąd: {e}")
    db.rollback()
finally:
    db.close()
