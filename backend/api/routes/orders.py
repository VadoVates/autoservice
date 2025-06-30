import os
from datetime import datetime, timezone, date, timedelta
from typing import Optional
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Body

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
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


router = APIRouter(
    prefix="/api/orders",
    tags=["orders"]
)

try:
    # Spróbuj znaleźć font systemowy
    font_paths = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:\\Windows\\Fonts\\Arial.ttf",
    ]

    font_registered = False
    for font_path in font_paths:
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('CustomFont', font_path))
            font_registered = True
            break

    if not font_registered:
        # Fallback - użyj wbudowanego Helvetica
        print("Warning: No Unicode font found, using Helvetica")
except Exception as e:
    print(f"Font registration error: {e}")

@router.post("")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    db.refresh(db_order, ["customer", "vehicle"])

    return serialize_order(db_order)

@router.post("/{order_id}/invoice")
def create_invoice(order_id: int, invoice_data: dict = Body(...), db: Session = Depends(get_db)):
    # Pobierz zlecenie
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Sprawdź czy zlecenie jest zakończone
    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Only completed orders can be invoiced"
        )

    # Ustaw końcowy koszt z formularza
    labor_cost = invoice_data.get("final_cost", order.estimated_cost or 0)

    # Pobierz części użyte w zleceniu
    order_parts = db.query(OrderPart).filter(OrderPart.order_id == order_id).all()
    total_parts_cost = sum(op.quantity * op.unit_price for op in order_parts)

    # Całkowity koszt = robocizna + części
    total_cost = labor_cost + total_parts_cost

    # Zapisz koszt końcowy
    order.final_cost = total_cost

    # Generuj PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    elements = []

    # Style
    styles = getSampleStyleSheet()

    # Użyj custom font jeśli został zarejestrowany
    try:
        if 'CustomFont' in pdfmetrics.getRegisteredFontNames():
            styles['Normal'].fontName = 'CustomFont'
            styles['Heading1'].fontName = 'CustomFont'
            styles['Heading2'].fontName = 'CustomFont'
    except:
        pass

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=15,
        alignment=1
    )

    # NAGŁÓWEK
    elements.append(Paragraph("PROTOKÓŁ NAPRAWY", title_style))
    elements.append(Spacer(1, 10))

    # Informacje o dokumencie
    doc_info = [
        ['Numer zlecenia:', f'#{order.id}'],
        ['Data wystawienia:', date.today().strftime('%d.%m.%Y')],
        ['Status:', 'Zakończone']
    ]

    doc_table = Table(doc_info, colWidths=[5 * cm, 10 * cm])
    doc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), styles['Normal'].fontName),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), styles['Heading2'].fontName),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(doc_table)
    elements.append(Spacer(1, 10))

    # Dane klienta
    elements.append(Paragraph("<b>DANE KLIENTA</b>", styles['Heading2']))
    client_data = [
        ['Imię i nazwisko:', order.customer.name if order.customer else 'Brak danych'],
        ['Telefon:', order.customer.phone or '-'],
        ['Email:', order.customer.email or '-'],
    ]

    client_table = Table(client_data, colWidths=[5 * cm, 10 * cm])
    client_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), styles['Normal'].fontName),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), styles['Heading2'].fontName),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 10))

    # Dane pojazdu
    elements.append(Paragraph("<b>DANE POJAZDU</b>", styles['Heading2']))
    vehicle_data = [
        ['Marka:', order.vehicle.brand if order.vehicle else '-'],
        ['Model:', order.vehicle.model if order.vehicle else '-'],
        ['Rok produkcji:', str(order.vehicle.year) if order.vehicle and order.vehicle.year else '-'],
        ['Nr rejestracyjny:', order.vehicle.registration_number if order.vehicle else '-'],
        ['VIN:', order.vehicle.vin or '-' if order.vehicle else '-'],
    ]

    vehicle_table = Table(vehicle_data, colWidths=[5 * cm, 10 * cm])
    vehicle_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), styles['Normal'].fontName),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), styles['Heading2'].fontName),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(vehicle_table)
    elements.append(Spacer(1, 10))

    # Opis naprawy
    elements.append(Paragraph("<b>OPIS WYKONANYCH PRAC</b>", styles['Heading2']))
    desc_text = order.description.replace('\n', '<br/>')
    elements.append(Paragraph(desc_text, styles['Normal']))
    elements.append(Spacer(1, 15))

    # Użyte części
    if order_parts:
        elements.append(Paragraph("<b>UŻYTE CZĘŚCI</b>", styles['Heading2']))

        parts_data = [['Część', 'Ilość', 'Cena jedn.', 'Wartość']]
        for op in order_parts:
            parts_data.append([
                f"{op.part.code} - {op.part.name}",
                str(op.quantity),
                f"{op.unit_price:.2f} PLN",
                f"{(op.quantity * op.unit_price):.2f} PLN"
            ])

        parts_table = Table(parts_data, colWidths=[8 * cm, 2 * cm, 2.5 * cm, 2.5 * cm])
        parts_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), styles['Normal'].fontName),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (-1, 0), styles['Heading2'].fontName),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('ALIGN', (2, 0), (3, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(parts_table)
        elements.append(Spacer(1, 15))

    # Podsumowanie kosztów
    elements.append(Paragraph("<b>PODSUMOWANIE</b>", styles['Heading2']))
    cost_data = [
        ['', 'Kwota'],
        ['Koszt robocizny:', f'{labor_cost:.2f} PLN'],
    ]

    if total_parts_cost > 0:
        cost_data.append(['Koszt części:', f'{total_parts_cost:.2f} PLN'])

    cost_data.extend([
        ['', ''],
        ['DO ZAPŁATY:', f'{total_cost:.2f} PLN'],
    ])

    cost_table = Table(cost_data, colWidths=[10 * cm, 5 * cm])
    cost_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), styles['Normal'].fontName),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('FONTNAME', (0, 0), (-1, 0), styles['Heading2'].fontName),
        ('FONTNAME', (0, -1), (-1, -1), styles['Heading2'].fontName),
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

    # Zaktualizuj status zlecenia na "invoiced"
    order.status = OrderStatus.INVOICED
    db.commit()

    # Zwróć PDF
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=zlecenie_{order_id}_dokument.pdf"
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