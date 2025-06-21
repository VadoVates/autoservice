from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.models import CustomerCreate
from api.utils import get_object_or_404, count_active_orders
from models.customer import Customer
from models.vehicle import Vehicle
from models.base import get_db

router = APIRouter(
    prefix="/api/customers",
    tags=["customers"]
)

@router.post("")
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("")
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers

@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = get_object_or_404(db, Customer, customer_id, "Customer")
    return customer

@router.get("/{customer_id}/vehicles")
def get_customer_vehicles(customer_id: int, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()
    return vehicles

@router.put("/{customer_id}")
def update_customer(customer_id: int, customer_db: CustomerCreate, db: Session = Depends(get_db)):
    customer = get_object_or_404(db, Customer, customer_id, "Customer")
    
    for key, value in customer_db.model_dump().items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
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