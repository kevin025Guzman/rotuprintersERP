from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta, time
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.utils import timezone

from sales.models import Sale
from quotations.models import Quotation
from inventory.models import Product
from clients.models import Client
from users.permissions import IsAdmin
from simple_inventory.models import SimpleProduct


def get_logo_path():
    """Return an absolute path to the logo image if available."""
    candidates = [
        Path(settings.BASE_DIR) / 'logo.png',
        Path(settings.BASE_DIR) / 'static' / 'logo.png',
        Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'logo.png',
    ]
    for path in candidates:
        if path.exists():
            return str(path)
    return None


class DashboardStatsView(APIView):
    """General dashboard statistics."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Sales statistics
        total_sales = Sale.objects.filter(status=Sale.Status.COMPLETED).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        sales_count = Sale.objects.filter(status=Sale.Status.COMPLETED).count()
        pending_sales = Sale.objects.filter(status=Sale.Status.PENDING).count()
        
        # Quotations statistics
        active_quotations = Quotation.objects.filter(
            status__in=[Quotation.Status.PENDING, Quotation.Status.APPROVED]
        ).count()
        
        total_quotations = Quotation.objects.count()
        
        # Inventory statistics
        low_stock_products = len([p for p in Product.objects.filter(is_active=True) if p.is_low_stock])
        out_of_stock_products = Product.objects.filter(quantity_available=0, is_active=True).count()
        total_products = Product.objects.filter(is_active=True).count()
        
        # Clients statistics
        total_clients = Client.objects.filter(is_active=True).count()
        
        # Recent sales (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_sales = Sale.objects.filter(
            status=Sale.Status.COMPLETED,
            completed_at__gte=thirty_days_ago
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        # Today's sales (respecting local timezone date)
        today = timezone.localdate()
        today_sales_qs = Sale.objects.filter(created_at__date=today)
        today_sales = today_sales_qs.aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Today's completed sales
        today_completed_qs = Sale.objects.filter(
            status=Sale.Status.COMPLETED,
            completed_at__date=today
        )
        today_completed_sales = today_completed_qs.aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        return Response({
            'sales': {
                'total_amount': float(total_sales),
                'total_count': sales_count,
                'pending_count': pending_sales,
                'recent_30_days': float(recent_sales),
                'today_amount': float(today_sales['total'] or Decimal('0')),
                'today_count': today_sales['count'] or 0,
                'today_completed_amount': float(today_completed_sales['total'] or Decimal('0')),
                'today_completed_count': today_completed_sales['count'] or 0
            },
            'quotations': {
                'active': active_quotations,
                'total': total_quotations
            },
            'inventory': {
                'low_stock': low_stock_products,
                'out_of_stock': out_of_stock_products,
                'total_products': total_products
            },
            'clients': {
                'total': total_clients
            }
        })


class SalesReportView(APIView):
    """Sales reports with filtering."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_by = request.query_params.get('group_by', 'month')  # month, week, day
        
        queryset = Sale.objects.filter(status=Sale.Status.COMPLETED)
        
        if start_date:
            queryset = queryset.filter(completed_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(completed_at__lte=end_date)
        
        # Sales by period
        if group_by == 'month':
            sales_by_period = queryset.annotate(
                period=TruncMonth('completed_at')
            ).values('period').annotate(
                total=Sum('total_amount'),
                count=Count('id')
            ).order_by('period')
        else:
            sales_by_period = []
        
        # Top selling products
        from sales.models import SaleItem
        top_products = SaleItem.objects.filter(
            sale__status=Sale.Status.COMPLETED
        ).values(
            'product__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_amount=Sum('total')
        ).order_by('-total_amount')[:10]
        
        # Sales by payment method
        sales_by_payment = queryset.values('payment_method').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Total summary
        summary = queryset.aggregate(
            total_sales=Sum('total_amount'),
            total_count=Count('id'),
            avg_sale=Sum('total_amount') / Count('id') if queryset.count() > 0 else 0
        )
        
        return Response({
            'summary': {
                'total_sales': float(summary['total_sales'] or 0),
                'total_count': summary['total_count'],
                'average_sale': float(summary['avg_sale'] or 0)
            },
            'sales_by_period': [
                {
                    'period': item['period'].strftime('%Y-%m') if item['period'] else None,
                    'total': float(item['total']),
                    'count': item['count']
                }
                for item in sales_by_period
            ],
            'top_products': [
                {
                    'product': item['product__name'],
                    'quantity': float(item['total_quantity']),
                    'amount': float(item['total_amount'])
                }
                for item in top_products
            ],
            'sales_by_payment_method': [
                {
                    'method': item['payment_method'],
                    'total': float(item['total']),
                    'count': item['count']
                }
                for item in sales_by_payment
            ]
        })


class InventoryReportView(APIView):
    """Inventory reports."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        manual_products = SimpleProduct.objects.all().order_by('name')
        low_stock_threshold = int(request.query_params.get('low_stock_threshold', 5))

        low_stock = [
            {
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'description': product.description,
                'quantity_available': product.quantity,
                'minimum_stock': low_stock_threshold,
                'status': 'SIN_STOCK' if product.quantity == 0 else 'STOCK_BAJO'
            }
            for product in manual_products
            if product.quantity <= low_stock_threshold
        ]

        categories_stats = [
            {
                'category': product.name,
                'description': product.description,
                'total_products': product.quantity
            }
            for product in manual_products
        ]

        total_units = sum(product.quantity for product in manual_products)

        return Response({
            'low_stock_products': low_stock,
            'categories': categories_stats,
            'total_inventory_value': float(total_units),
            'total_products': manual_products.count(),
            'low_stock_threshold': low_stock_threshold
        })


class QuotationsReportView(APIView):
    """Quotations reports."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        quotations = Quotation.objects.all()
        
        # Quotations by status
        by_status = quotations.values('status').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        ).order_by('-count')
        
        # Conversion rate
        total_quotations = quotations.count()
        converted_quotations = quotations.filter(
            status=Quotation.Status.CONVERTED
        ).count()
        conversion_rate = (
            (converted_quotations / total_quotations * 100) 
            if total_quotations > 0 else 0
        )
        
        # Top clients by quotations
        top_clients = quotations.values(
            'client__name'
        ).annotate(
            count=Count('id'),
            total=Sum('total_amount')
        ).order_by('-count')[:10]
        
        return Response({
            'by_status': [
                {
                    'status': item['status'],
                    'count': item['count'],
                    'total': float(item['total'] or 0)
                }
                for item in by_status
            ],
            'conversion_rate': conversion_rate,
            'total_quotations': total_quotations,
            'converted_quotations': converted_quotations,
            'top_clients': [
                {
                    'client': item['client__name'],
                    'count': item['count'],
                    'total': float(item['total'])
                }
                for item in top_clients
            ]
        })


class ClientsReportView(APIView):
    """Clients reports."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        clients = Client.objects.filter(is_active=True)
        
        # Top clients by sales
        top_clients = []
        for client in clients:
            total_sales = client.sales.filter(
                status=Sale.Status.COMPLETED
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            
            if total_sales > 0:
                top_clients.append({
                    'id': client.id,
                    'name': client.name,
                    'company': client.company,
                    'total_sales': float(total_sales),
                    'sales_count': client.sales.filter(
                        status=Sale.Status.COMPLETED
                    ).count()
                })
        
        # Sort by total sales
        top_clients.sort(key=lambda x: x['total_sales'], reverse=True)
        
        return Response({
            'top_clients': top_clients[:20],
            'total_active_clients': clients.count()
        })


class DailySalesPDFView(APIView):
    """Generate PDF report of today's sales."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.http import HttpResponse
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
        from reportlab.lib.enums import TA_CENTER
        from io import BytesIO
        
        # Get today's sales using local date boundaries
        today = timezone.localdate()
        today_sales = (
            Sale.objects
            .filter(created_at__date=today)
            .order_by('-created_at')
            .prefetch_related('items__product')
        )
        
        # Calculate totals
        total_amount = today_sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        completed_count = today_sales.filter(status=Sale.Status.COMPLETED).count()
        pending_count = today_sales.filter(status=Sale.Status.PENDING).count()
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title with optional logo inline
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#FF6600'),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        logo_path = get_logo_path()
        if logo_path:
            logo = Image(logo_path, width=1.0 * inch, height=1.0 * inch)
            title_paragraph = Paragraph("RotuPrinters", title_style)
            from reportlab.platypus import Table
            header_table = Table([[logo, title_paragraph]], colWidths=[1.2 * inch, 5.8 * inch])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]))
            header_table.hAlign = 'CENTER'
            elements.append(header_table)
            elements.append(Spacer(1, 0.1 * inch))
        else:
            elements.append(Paragraph("RotuPrinters", title_style))
        elements.append(Paragraph(f"Reporte de Ventas del Día - {today.strftime('%d/%m/%Y')}", styles['Heading2']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary
        summary_data = [
            ['Total Ventas:', f'L {total_amount:.2f}'],
            ['Ventas Completadas:', str(completed_count)],
            ['Ventas Pendientes:', str(pending_count)],
            ['Total Ventas:', str(today_sales.count())],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Sales table
        if today_sales.exists():
            elements.append(Paragraph("Detalle de Ventas", styles['Heading3']))
            elements.append(Spacer(1, 0.2*inch))
            
            sales_data = [['Factura', 'Cliente', 'Productos', 'Estado', 'Total', 'Hora']]
            
            for sale in today_sales:
                created_at_local = timezone.localtime(sale.created_at)
                status_text = 'Completada' if sale.status == Sale.Status.COMPLETED else 'Pendiente'
                products_text = ', '.join(filter(None, [
                    item.description or (item.product.name if item.product else None)
                    for item in sale.items.all()
                ])) or 'N/D'
                sales_data.append([
                    sale.invoice_number,
                    sale.client.name[:30],
                    products_text[:50] + ('…' if len(products_text) > 50 else ''),
                    status_text,
                    f'L {sale.total_amount:.2f}',
                    created_at_local.strftime('%H:%M')
                ])
            
            sales_table = Table(sales_data, colWidths=[1.2*inch, 1.8*inch, 2.3*inch, 1.0*inch, 1.0*inch, 0.8*inch])
            sales_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055A4')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
            ]))
            elements.append(sales_table)
        else:
            elements.append(Paragraph("No hay ventas registradas hoy.", styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF from buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        # Create response
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Ventas_Dia_{timezone.now().strftime("%Y%m%d")}.pdf"'
        response.write(pdf)
        
        return response


class TotalSalesPDFView(APIView):
    """Generate PDF report of all sales."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.http import HttpResponse
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
        from reportlab.lib.enums import TA_CENTER
        from io import BytesIO
        
        # Get all completed sales
        all_sales = (
            Sale.objects
            .filter(status=Sale.Status.COMPLETED)
            .order_by('-completed_at')
            .prefetch_related('items__product')
        )
        
        # Calculate totals
        total_amount = all_sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        total_count = all_sales.count()
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title with optional logo inline
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#FF6600'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        logo_path = get_logo_path()
        if logo_path:
            logo = Image(logo_path, width=1.0 * inch, height=1.0 * inch)
            title_paragraph = Paragraph("RotuPrinters", title_style)
            from reportlab.platypus import Table
            header_table = Table([[logo, title_paragraph]], colWidths=[1.2 * inch, 5.8 * inch])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]))
            header_table.hAlign = 'CENTER'
            elements.append(header_table)
            elements.append(Spacer(1, 0.1 * inch))
        else:
            elements.append(Paragraph("RotuPrinters", title_style))
        elements.append(Paragraph(f"Reporte de Ventas Totales - {timezone.localdate().strftime('%d/%m/%Y')}", styles['Heading2']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary
        summary_data = [
            ['Total Ventas:', f'L {total_amount:.2f}'],
            ['Cantidad de Ventas:', str(total_count)],
            ['Promedio por Venta:', f'L {(total_amount / total_count if total_count > 0 else 0):.2f}'],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Sales table
        if all_sales.exists():
            elements.append(Paragraph("Detalle de Ventas", styles['Heading3']))
            elements.append(Spacer(1, 0.2*inch))
            
            sales_data = [['Factura', 'Cliente', 'Productos', 'Total', 'Fecha']]
            
            for sale in all_sales[:100]:  # Limit to 100 sales for PDF size
                products_text = ', '.join(filter(None, [
                    item.description or (item.product.name if item.product else None)
                    for item in sale.items.all()
                ])) or 'N/D'
                sales_data.append([
                    sale.invoice_number,
                    sale.client.name[:30],
                    products_text[:60] + ('…' if len(products_text) > 60 else ''),
                    f'L {sale.total_amount:.2f}',
                    timezone.localtime(sale.completed_at or sale.created_at).strftime('%d/%m/%Y')
                ])
            
            sales_table = Table(sales_data, colWidths=[1.2*inch, 1.8*inch, 2.8*inch, 1.2*inch, 1.0*inch])
            sales_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055A4')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
            ]))
            elements.append(sales_table)
            
            if all_sales.count() > 100:
                elements.append(Spacer(1, 0.2*inch))
                elements.append(Paragraph(f"Mostrando las primeras 100 ventas de {all_sales.count()} totales.", styles['Normal']))
        else:
            elements.append(Paragraph("No hay ventas registradas.", styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF from buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        # Create response
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Ventas_Totales_{timezone.now().strftime("%Y%m%d")}.pdf"'
        response.write(pdf)
        
        return response
