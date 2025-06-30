from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


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

class PartCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int = 0

class PartUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None

class OrderPartCreate(BaseModel):
    part_id: int
    quantity: int
    unit_price: Optional[float] = None  # If None, use current part price