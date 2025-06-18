from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
import uvicorn
from pydantic import BaseModel
from typing import Optional

from models.base import get_db
from models import Customer, Vehicle, Order

class VehicleCreate(BaseModel):
    customer_id: int
    brand: str
    model: str
    year: Optional[int] = None
    registration_number: str
    vin: Optional[str] = None

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
    work_station_id: Optional[str] = None
    estimated_cost: Optional[str] = None
    final_cost: Optional[str] = None

app = FastAPI(
    title="AutoService Manager API",
    description="System zarządzania warsztatem samochodowym",
    version="1.0.0"
)

# Konfiguracja CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.0.107:3000", "http://192.168.0.*:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Witaj w AutoService Manager API",
        "version": "1.0.0",
        "endpoints": {
            "customers": "/api/customers",
            "vehicles": "/api/vehicles",
            "orders": "/api/orders"
        }
    }

### DASHBOARD SECTION ###
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_vehicles = db.query(Vehicle).count()
    total_orders = db.query(Order).count()

    active_orders = db.query(Order).filter(
        Order.status.in_(["new", "in_progress", "waiting_for_parts"])
    ).count()

    orders_in_queue = db.query(Order).filter(
        Order.status == "new",
        Order.work_station_id == None
        ).count()
    
    completed_today = db.query(Order).filter(
        Order.status == "completed",
        func.date(Order.completed_at) == func.date(func.now())
    ).count()

    orders_by_priority = db.query(
        Order.priority,
        func.count(Order.id).label('count')
    ).filter(
        Order.status.in_(["new", "in_progress", "waiting_for_parts"])
    ).group_by(Order.priority).all()

    priority_stats = {
        "normal" : 0,
        "high" : 0,
        "urgent" : 0
    }

    for priority, count in orders_by_priority:
        priority_stats[priority] = count

    station_1_busy = db.query(Order).filter(
        Order.work_station_id == 1,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).count() > 0

    station_2_busy = db.query(Order).filter(
        Order.work_station_id == 2,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).count() > 0

#####################################################################
    revenue_today = db.query(func.sum(Order.final_cost)).filter(
        Order.status == "invoiced",
        func.date(Order.completed_at) == func.date(func.now())
    ).scalar() or 0
    
    revenue_month = db.query(func.sum(Order.final_cost)).filter(
        Order.status == "invoiced",
        func.extract('year', Order.completed_at) == func.extract('year', func.now()),
        func.extract('month', Order.completed_at) == func.extract('month', func.now())
    ).scalar() or 0
#####################################################################

    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
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

    return {
        "total_customers": total_customers,
        "total_vehicles": total_vehicles,
        "total_orders": total_orders,
        "active_orders": active_orders,
        "orders_in_queue": orders_in_queue,
        "completed_today": completed_today,
        "priority_stats": priority_stats,
        "station_1_busy": station_1_busy,
        "station_2_busy": station_2_busy,
        "revenue_today": revenue_today,
        "revenue_month": revenue_month,
        "recent_orders": recent_orders_data
    }


### CUSTOMERS SECTION ###

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
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.post("/api/customers")
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.put("/api/customers/{customer_id}")
def update_customer(customer_id: int, customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer.model_dump().items():
        setattr(db_customer, key, value)

    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.delete("/api/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return {"message" : "Customer deleted succesfully"}

### ORDER SECTION ###

@app.get("/api/orders")
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = db.query(Order).offset(skip).limit(limit).all()
    
    # Dodaj dane klienta i pojazdu
    result = []
    for order in orders:
        order_dict = {
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
            "customer": {
                "id": order.customer.id,
                "name": order.customer.name,
                "phone": order.customer.phone,
                "email": order.customer.email
            } if order.customer else None,
            "vehicle": {
                "id": order.vehicle.id,
                "brand": order.vehicle.brand,
                "model": order.vehicle.model,
                "registration_number": order.vehicle.registration_number
            } if order.vehicle else None
        }
        result.append(order_dict)
    
    return result

@app.post("/api/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/api/orders/{order_id}")
def update_order(order_id: int, order_data: dict, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    """
    update_data = order.model_dump(exclude_unset=True)

    if "status" in update_data:
        if update_data["status"] == "in progress" and not db_order.started_at:
            update_data["started_at"] = datetime.now(timezone.utc)
        elif update_data["status"] == "completed" and not db_order.completed_at:
            update_data["completed_at"] = datetime.now(timezone.utc)

    for key, value in update_data.items():
        setattr(db_order, key, value)
    """

    for key, value in order_data.items():
        if hasattr(db_order, key):
            setattr(db_order, key, value)

    if "status" in order_data:
        if order_data["status"] == "in progress" and not db_order.started_at:
            db_order.started_at = datetime.now(timezone.utc)
        elif order_data["status"] == "completed" and not db_order.completed_at:
            db_order.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(db_order)
    return {
        "id": db_order.id,
        "customer_id": db_order.customer_id,
        "vehicle_id": db_order.vehicle_id,
        "work_station_id": db_order.work_station_id,
        "description": db_order.description,
        "priority": db_order.priority,
        "status": db_order.status,
        "created_at": db_order.created_at,
        "started_at": db_order.started_at,
        "completed_at": db_order.completed_at,
        "estimated_cost": db_order.estimated_cost,
        "final_cost": db_order.final_cost,
        "customer": {
            "id": db_order.customer.id,
            "name": db_order.customer.name,
            "phone": db_order.customer.phone,
            "email": db_order.customer.email
        } if db_order.customer else None,
        "vehicle": {
            "id": db_order.vehicle.id,
            "brand": db_order.vehicle.brand,
            "model": db_order.vehicle.model,
            "registration_number": db_order.vehicle.registration_number
        } if db_order.vehicle else None
    }

@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
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

    completed_orders = db.query(Order).filter(
        Order.status.in_(["completed", "invoiced"])
    ).all()
    
    return {
        "station_1": station_1_orders,
        "station_2": station_2_orders,
        "waiting": waiting_orders,
        "completed": completed_orders
    }

### VEHICLES ###

@app.get("/api/vehicles")
def get_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).join(Customer).offset(skip).limit(limit).all()

    result = []
    for vehicle in vehicles:
        vehicle_dict = {
            "id": vehicle.id,
            "customer_id": vehicle.customer_id,
            "brand": vehicle.brand,
            "model": vehicle.model,
            "year": vehicle.year,
            "registration_number": vehicle.registration_number,
            "vin": vehicle.vin,
            "owner": {
                "id": vehicle.owner.id,
                "name": vehicle.owner.name,
                "phone": vehicle.owner.phone,
                "email": vehicle.owner.email
            } if vehicle.owner else None
        }
        result.append(vehicle_dict)

    return result

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

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    for key, value in vehicle.model_dump().items():
        setattr(db_vehicle, key, value)

    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    orders_count = db.query(Order).filter(Order.vehicle_id == vehicle_id).count()
    if orders_count > 0:
        raise HTTPException(status_code=400, detail=f"Can't remove the vehicle, there's {orders_count} orders")
    
    db.delete(db_vehicle)
    db.commit()
    return {"message" : "Vehicle deleted succesfully"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)