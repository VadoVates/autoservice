from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    total_amount = Column(Float, nullable=False)
    notes = Column(Text)

    order = relationship("Order", back_populates="invoice")