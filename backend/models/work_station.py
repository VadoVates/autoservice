from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from .base import Base

class WorkStation(Base):
    __tablename__ = "work_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    
    orders = relationship("Order", back_populates="work_station")