from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
import uvicorn
from pydantic import BaseModel, field_validator
from typing import Optional

from models.base import get_db
from models import Customer, Vehicle, Order

ACTIVE_STATUSES = ["new", "in_progress", "waiting_for_parts"]
RECENT_ORDERS = 6

class VehicleCreate(BaseModel):
    customer_id: int
    brand: str
    model: str
    year: Optional[int] = None
    registration_number: str
    vin: Optional[str] = None

    @field_validator('year')
    def validate_year(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1900 or v > datetime.now().year + 1):
            raise ValueError("Invalid year for vehicle")
        return v

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class OrderCreate(BaseModel):
    customer_id: int
    vehicle_id: int
    description: str
    priority: str = "normal"
    estimated_cost: float = 0.0

class OrderUpdate(BaseModel):
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    work_station_id: Optional[int] = None
    estimated_cost: Optional[str] = None
    final_cost: Optional[str] = None

app = FastAPI(
    title="AutoService Manager API",
    description="System zarządzania warsztatem samochodowym",
    version="2.0.0"
)

# Konfiguracja CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.0.107:3000", "http://192.168.0.*:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_object_or_404(db: Session, model, object_id: int, name: str = "Object"):
    obj = db.query(model).filter(model.id == object_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail=f"{name} not found")
    return obj

def count_active_orders(db : Session, customer_id: Optional[int] = None):
    if customer_id is None:
        result = db.query(Order).filter(
            Order.status.in_(ACTIVE_STATUSES)
        ).count()
    else:
        result = db.query(Order).filter(
            Order.customer_id == customer_id,
            Order.status.in_(ACTIVE_STATUSES)
        ).count()
    return result

def serialize_customer(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email
    }

def serialize_vehicle(vehicle: Vehicle, include_owner: bool = False) -> dict:
    data = {
            "id": vehicle.id,
            "brand": vehicle.brand,
            "model": vehicle.model,
            "registration_number": vehicle.registration_number,
            "year": vehicle.year,
            "vin": vehicle.vin,
            "customer_id": vehicle.customer_id,
    }

    if include_owner and vehicle.owner:
        data["owner"] = serialize_customer(vehicle.owner)

    return data

def serialize_order(order: Order) -> dict:
    return {
            "id": order.id,
            "customer_id": order.customer_id,
            "vehicle_id": order.vehicle_id,
            "work_station_id": order.work_station_id,
            "description": order.description,
            "priority": order.priority,
            "status": order.status,
            "created_at": order.created_at,
            "started_at": order.started_at,
            "completed_at": order.completed_at,
            "estimated_cost": order.estimated_cost,
            "final_cost": order.final_cost,
            "customer": serialize_customer(order.customer) if order.customer else None,
            "vehicle": serialize_vehicle(order.vehicle) if order.vehicle else None
    }

@app.get("/")
def read_root():
    return {
        "message": "Witaj w AutoService Manager API",
        "version": "1.0.0",
        "endpoints": {
            # Dashboard
            "dashboard": {
                "stats": "/api/dashboard/stats"
            },
            
            # Klienci
            "customers": {
                "list": "/api/customers",
                "get": "/api/customers/{customer_id}",
                "create": "POST /api/customers",
                "update": "PUT /api/customers/{customer_id}",
                "delete": "DELETE /api/customers/{customer_id}",
                "vehicles": "/api/customers/{customer_id}/vehicles"
            },
            
            # Pojazdy
            "vehicles": {
                "list": "/api/vehicles",
                "create": "POST /api/vehicles",
                "update": "PUT /api/vehicles/{vehicle_id}",
                "delete": "DELETE /api/vehicles/{vehicle_id}"
            },
            
            # Zlecenia
            "orders": {
                "list": "/api/orders?status={status}",
                "create": "POST /api/orders",
                "update": "PUT /api/orders/{order_id}",
                "delete": "DELETE /api/orders/{order_id}"
            },
            
            # Kolejka
            "queue": "/api/queue",
            
            # Dokumentacja
            "documentation": "/docs",
            "openapi": "/openapi.json",
            
            # Status
            "health": "/health"
        }
    }

### DASHBOARD SECTION ###
def get_priority_stats(db: Session) -> dict:
    stats = {
        "normal" : 0,
        "high" : 0,
        "urgent" : 0
    }

    orders_by_priority = db.query(
        Order.priority,
        func.count(Order.id).label('count')
    ).filter(
        Order.status.in_(ACTIVE_STATUSES)
    ).group_by(Order.priority).all()

    for priority, count in orders_by_priority:
        stats[priority] = count

    return stats

def get_recent_orders(db: Session) -> dict:
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(RECENT_ORDERS).all()
    recent_orders_data = []
    for order in recent_orders:
        recent_orders_data.append({
            "id": order.id,
            "customer_name": order.customer.name if order.customer else "Nieznany",
            "vehicle": f"{order.vehicle.brand} {order.vehicle.model}" if order.vehicle else "Nieznany",
            "status": order.status,
            "priority": order.priority,
            "created_at": order.created_at
        })
    return recent_orders_data

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_vehicles = db.query(Vehicle).count()
    total_orders = db.query(Order).count()

    active_orders = count_active_orders(db)

    orders_in_queue = db.query(Order).filter(
        Order.status == "new",
        Order.work_station_id == None
        ).count()
    
    completed_today = db.query(Order).filter(
        Order.status == "completed",
        func.date(Order.completed_at) == func.date(func.now())
    ).count()

    station_1_busy = db.query(Order).filter(
        Order.work_station_id == 1,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).count() > 0

    station_2_busy = db.query(Order).filter(
        Order.work_station_id == 2,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).count() > 0

    revenue_today = db.query(func.sum(Order.final_cost)).filter(
        Order.status == "invoiced",
        func.date(Order.completed_at) == func.date(func.now())
    ).scalar() or 0
    
    revenue_month = db.query(func.sum(Order.final_cost)).filter(
        Order.status == "invoiced",
        func.extract('year', Order.completed_at) == func.extract('year', func.now()),
        func.extract('month', Order.completed_at) == func.extract('month', func.now())
    ).scalar() or 0

    return {
        "total_customers": total_customers,
        "total_vehicles": total_vehicles,
        "total_orders": total_orders,
        "active_orders": active_orders,
        "orders_in_queue": orders_in_queue,
        "completed_today": completed_today,
        "priority_stats": get_priority_stats(db),
        "station_1_busy": station_1_busy,
        "station_2_busy": station_2_busy,
        "revenue_today": revenue_today,
        "revenue_month": revenue_month,
        "recent_orders": get_recent_orders(db)
    }


### CUSTOMERS SECTION ###

@app.post("/api/customers")
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/api/customers")
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers

@app.get("/api/customers/{customer_id}/vehicles")
def get_customer_vehicles(customer_id: int, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()
    return vehicles

@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = get_object_or_404(db, Customer, customer_id, "Customer")
    return customer

@app.put("/api/customers/{customer_id}")
def update_customer(customer_id: int, customer: CustomerCreate, db: Session = Depends(get_db)):
    customer = get_object_or_404(db, Customer, customer_id, "Customer")
    
    for key, value in customer.model_dump().items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)
    return customer

@app.delete("/api/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = get_object_or_404(db, Customer, customer_id, "Customer")
    
    active_orders = count_active_orders(db, customer_id)

    if active_orders > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Can't remove customer - it has {active_orders} active orders"
        )
    
    vehicles_count = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).count()

    if vehicles_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Can't remove customer - it has {vehicles_count} vehicles"
        )
    
    db.delete(customer)
    db.commit()
    return {"message" : "Customer deleted succesfully"}

### VEHICLES SECTION ###

@app.post("/api/vehicles")
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(Vehicle).filter(Vehicle.registration_number == vehicle.registration_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this license plate already exists")
    
    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.get("/api/vehicles")
def get_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).outerjoin(Customer).offset(skip).limit(limit).all()

    result = []
    for vehicle in vehicles:
        result.append(serialize_vehicle(vehicle, include_owner=True))

    return result

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = get_object_or_404(db, Vehicle, vehicle_id, "Vehicle")

    for key, value in vehicle.model_dump().items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle

@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = get_object_or_404(db, Vehicle, vehicle_id, "Vehicle")

    orders_count = db.query(Order).filter(Order.vehicle_id == vehicle_id).count()
    if orders_count > 0:
        raise HTTPException(status_code=400, detail=f"Can't remove the vehicle, there's {orders_count} orders")
    
    db.delete(vehicle)
    db.commit()
    return {"message" : "Vehicle deleted succesfully"}

### ORDER SECTION ###

@app.post("/api/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    db.refresh(db_order, ["customer", "vehicle"])

    return serialize_order(db_order)

@app.post("/api/orders/{order_id}/invoice")
def create_invoice(order_id: int, db: Session = Depends(get_db)):
    return
    
@app.get("/api/orders")
def get_orders(skip: int = 0, limit: int = 100, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)

    orders = query.order_by(
        Order.priority.desc(),
        Order.created_at.asc()
    ).offset(skip).limit(limit).all()
    
    # Dodaj dane klienta i pojazdu
    result = []
    for order in orders:
        result.append(serialize_order(order))
    
    return result

@app.put("/api/orders/{order_id}")
def update_order(order_id: int, order_data: OrderUpdate, db: Session = Depends(get_db)):
    db_order = get_object_or_404(db, Order, order_id, "Order")

    update_data = order_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if hasattr(db_order, key):
            setattr(db_order, key, value)

    if update_data.get("status") == "in_progress" and not db_order.started_at:
        db_order.started_at = datetime.now(timezone.utc)

    if update_data.get("status") == "completed" and not db_order.completed_at:
        db_order.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(db_order)
    return serialize_order(db_order)

@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = get_object_or_404(db, Order, order_id, "Order")
    
    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}

### QUEUE SECTION ###

@app.get("/api/queue")
def get_queue(db: Session = Depends(get_db)):
    station_1_orders = db.query(Order).filter(
        Order.work_station_id == 1,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).all()

    station_2_orders = db.query(Order).filter(
        Order.work_station_id == 2,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).all()

    waiting_orders = db.query(Order).filter(
        Order.work_station_id == None,
        Order.status == "new"
    ).order_by(
        Order.priority.desc(),
        Order.created_at
    ).all()

    waiting_for_parts_orders = db.query(Order).filter(
        Order.status == "waiting_for_parts",
        Order.work_station_id == None
    ).order_by(
        Order.priority.desc(),
        Order.created_at
    ).all()

    completed_orders = db.query(Order).filter(
        Order.status.in_(["completed", "invoiced"])
    ).all()
    
    return {
        "station_1": station_1_orders,
        "station_2": station_2_orders,
        "waiting": waiting_orders,
        "waiting_for_parts": waiting_for_parts_orders,
        "completed": completed_orders
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)