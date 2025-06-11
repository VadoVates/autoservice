from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer)
    registration_number = Column(String(20), unique=True)
    vin = Column(String(17), unique=True)

    owner = relationship("Customer", back_populates="vehicles")
    orders = relationship("Order", back_populates="vehicle")