from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from .base import Base

class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    
    order_parts = relationship("OrderPart", back_populates="part")