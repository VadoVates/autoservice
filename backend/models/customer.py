from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .base import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(200))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    vehicles = relationship("Vehicle", back_populates="owner")
    orders = relationship("Order", back_populates="customer")