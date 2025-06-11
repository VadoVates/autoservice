# Import all models to ensure they are registered with Base
from .base import Base
from .customer import Customer
from .vehicle import Vehicle
from .work_station import WorkStation
from .order import Order
from .part import Part
from .order_part import OrderPart
from .invoice import Invoice
from .user import User

# This ensures all models are loaded
__all__ = [
    "Base",
    "Customer", 
    "Vehicle",
    "WorkStation",
    "Order",
    "Part",
    "OrderPart",
    "Invoice",
    "User"
]