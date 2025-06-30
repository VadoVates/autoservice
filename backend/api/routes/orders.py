from datetime import datetime, timezone, date, timedelta
from typing import Optional
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from api.models import OrderCreate, OrderUpdate, OrderPartCreate
from api.utils import get_object_or_404, serialize_order, serialize_part
from models import OrderPart, Part
from models.order import Order, OrderStatus
from models.base import get_db

import io
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm


router = APIRouter(
    prefix="/api/orders",
    tags=["orders"]
)

try:
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
except:
    pass

@router.post("")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    db.refresh(db_order, ["customer", "vehicle"])

    return serialize_order(db_order)

@router.post("/{order_id}/invoice")
def create_invoice(order_id: int, db: Session = Depends(get_db)):
    order = get_object_or_404(db, Order, order_id, "Order")

    # print("Order status:", order.status)

    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Only completed orders can be invoiced"
        )
    
    if not order.final_cost:
        order.final_cost = order.estimated_cost or 0.0

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1f2137'),
        spaceAfter=15,
        alignment=1 # center!
    )

    # NAGŁÓWEK
    elements.append(Paragraph("PROTOKÓŁ NAPRAWY", title_style))
    elements.append(Spacer(1, 10))

    # Info o dokumencie
    doc_info = [
        ['Numer zlecenia', f'#{order.id}'],
        ['Data wystawienia:', datetime.now().strftime("%Y-%m-%d %H:%M")],
        ['Status', 'Zakończone']
    ]

    doc_table = Table(doc_info, colWidths=[5*cm, 10*cm])
    doc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(doc_table)
    elements.append(Spacer(1, 10))

    # Dane klienta
    elements.append(Paragraph("DANE KLIENTA", styles['Heading2']))
    client_data = [
        ['Imię i nazwisko:', order.customer.name if order.customer else 'Brak danych'],
        ['Telefon:', order.customer.phone if order.customer else '-'],
        ['Email:', order.customer.email if order.customer else '-'],
    ]
    
    client_table = Table(client_data, colWidths=[5*cm, 10*cm])
    client_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 10))
    
    # Dane pojazdu
    elements.append(Paragraph("DANE POJAZDU", styles['Heading2']))
    vehicle_data = [
        ['Marka:', order.vehicle.brand if order.vehicle else '-'],
        ['Model:', order.vehicle.model if order.vehicle else '-'],
        ['Rok produkcji:', str(order.vehicle.year) if order.vehicle and order.vehicle.year else '-'],
        ['Nr rejestracyjny:', order.vehicle.registration_number if order.vehicle else '-'],
        ['VIN:', order.vehicle.vin if order.vehicle and order.vehicle.vin else '-'],
    ]
    
    vehicle_table = Table(vehicle_data, colWidths=[5*cm, 10*cm])
    vehicle_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(vehicle_table)
    elements.append(Spacer(1, 10))
    
    # Opis naprawy
    elements.append(Paragraph("TREŚĆ ZLECENIA", styles['Heading2']))
    elements.append(Paragraph(order.description, styles['Normal']))
    elements.append(Spacer(1, 30))
    
    # Podsumowanie kosztów
    elements.append(Paragraph("PODSUMOWANIE", styles['Heading2']))
    cost_data = [
        ['', 'Kwota'],
        ['Koszt naprawy:', f'{order.final_cost:.2f} PLN'],
        ['', ''],
        ['DO ZAPŁATY:', f'{order.final_cost:.2f} PLN'],
    ]
    
    cost_table = Table(cost_data, colWidths=[10*cm, 5*cm])
    cost_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 14),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(cost_table)
    
    # Stopka
    elements.append(Spacer(1, 20))
    footer_text = "Dokument wygenerowany automatycznie przez system AutoService Manager"
    elements.append(Paragraph(footer_text, ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=1
    )))
    
    # Generuj PDF
    doc.build(elements)
    buffer.seek(0)
    
    order.status = "invoiced"

    today = date.today()
    tomorrow = today + timedelta(days=1)
    daily_revenue = db.query(func.sum(Order.final_cost)).filter(
        Order.completed_at >= today,
        Order.completed_at < tomorrow,
        Order.status == "invoiced"
    ).scalar() or 0
    
    db.commit()

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=zlecenie_{order_id}.pdf"
        }
    )
    
@router.get("")
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

@router.put("/{order_id}")
def update_order(order_id: int, db_order: OrderUpdate, db: Session = Depends(get_db)):
    order = get_object_or_404(db, Order, order_id, "Order")

    update_data = db_order.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if hasattr(order, key):
            setattr(order, key, value)

    if update_data.get("status") == "in_progress" and not order.started_at:
        order.started_at = datetime.now(timezone.utc)

    if update_data.get("status") == "completed" and not order.completed_at:
        order.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)
    return serialize_order(order)

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = get_object_or_404(db, Order, order_id, "Order")
    
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}


@router.post("/{order_id}/parts")
def add_part_to_order(
        order_id: int,
        order_part: OrderPartCreate,
        db: Session = Depends(get_db)
):
    # Verify order exists
    order = get_object_or_404(db, Order, order_id, "Order")

    # Verify part exists
    part = get_object_or_404(db, Part, order_part.part_id, "Part")

    # Check if we have enough stock
    if part.stock_quantity < order_part.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {part.stock_quantity}, Requested: {order_part.quantity}"
        )

    # Use provided price or current part price
    unit_price = order_part.unit_price if order_part.unit_price is not None else part.price

    # Create order-part relationship
    db_order_part = OrderPart(
        order_id=order_id,
        part_id=order_part.part_id,
        quantity=order_part.quantity,
        unit_price=unit_price
    )

    # Update stock
    part.stock_quantity -= order_part.quantity

    db.add(db_order_part)
    db.commit()
    db.refresh(db_order_part)

    return {
        "id": db_order_part.id,
        "order_id": db_order_part.order_id,
        "part": {
            "id": part.id,
            "code": part.code,
            "name": part.name,
            "price": part.price
        },
        "quantity": db_order_part.quantity,
        "unit_price": db_order_part.unit_price,
        "total_price": db_order_part.quantity * db_order_part.unit_price
    }

@router.get("/{order_id}/parts")
def get_order_parts(order_id: int, db: Session = Depends(get_db)):
    # Verify order exists
    order = get_object_or_404(db, Order, order_id, "Order")

    order_parts = db.query(OrderPart).filter(OrderPart.order_id == order_id).all()

    result = []
    total_cost = 0

    for op in order_parts:
        part = op.part
        item_total = op.quantity * op.unit_price
        total_cost += item_total

        result.append({
            "id": op.id,
            "part": {
                "id": part.id,
                "code": part.code,
                "name": part.name,
                "current_price": part.price,
                "stock_quantity": part.stock_quantity
            },
            "quantity": op.quantity,
            "unit_price": op.unit_price,
            "total_price": item_total
        })

    return {
        "order_id": order_id,
        "parts": result,
        "total_parts_cost": total_cost
    }

@router.delete("/{order_id}/parts/{order_part_id}")
def remove_part_from_order(
        order_id: int,
        order_part_id: int,
        db: Session = Depends(get_db)
):
    order_part = db.query(OrderPart).filter(
        OrderPart.id == order_part_id,
        OrderPart.order_id == order_id
    ).first()

    if not order_part:
        raise HTTPException(status_code=404, detail="Order part not found")

    # Return stock
    part = order_part.part
    part.stock_quantity += order_part.quantity

    db.delete(order_part)
    db.commit()

    return {"message": "Part removed from order successfully"}