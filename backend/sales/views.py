from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.shortcuts import get_object_or_404

from .models import Sale, SaleItem
from .serializers import (
    SaleSerializer, SaleListSerializer, SaleItemSerializer,
    CreateSaleFromQuotationSerializer
)
from quotations.models import Quotation
from users.permissions import IsAdminOrSeller


class SaleViewSet(viewsets.ModelViewSet):
    """ViewSet for Sale CRUD operations."""
    queryset = Sale.objects.select_related('client', 'created_by', 'quotation').prefetch_related('items').all()
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status', 'payment_method', 'created_by']
    search_fields = ['invoice_number', 'client__name', 'client__company']
    ordering_fields = ['created_at', 'total_amount', 'invoice_number']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SaleListSerializer
        return SaleSerializer
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a sale and update inventory."""
        sale = self.get_object()
        try:
            sale.complete_sale()
            serializer = self.get_serializer(sale)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a sale."""
        sale = self.get_object()
        if sale.status == Sale.Status.COMPLETED:
            return Response(
                {'error': 'No se puede cancelar una venta completada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        sale.status = Sale.Status.CANCELLED
        sale.save()
        serializer = self.get_serializer(sale)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def from_quotation(self, request):
        """Create a sale from an existing quotation."""
        serializer = CreateSaleFromQuotationSerializer(data=request.data)
        if serializer.is_valid():
            quotation_id = serializer.validated_data['quotation_id']
            quotation = get_object_or_404(Quotation, id=quotation_id)
            
            if quotation.status == Quotation.Status.CONVERTED:
                return Response(
                    {'error': 'Esta cotización ya fue convertida a venta.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create sale from quotation
            sale = Sale.objects.create(
                client=quotation.client,
                quotation=quotation,
                created_by=request.user,
                payment_method=serializer.validated_data.get('payment_method', Sale.PaymentMethod.CASH),
                discount_percentage=quotation.discount_percentage,
                notes=serializer.validated_data.get('notes', quotation.notes)
            )
            
            # Copy items from quotation to sale
            for quote_item in quotation.items.all():
                SaleItem.objects.create(
                    sale=sale,
                    product=quote_item.product,
                    description=quote_item.description,
                    width_inches=quote_item.width_inches,
                    height_inches=quote_item.height_inches,
                    unit_price=quote_item.price_per_square_inch * quote_item.square_inches,
                    quantity=quote_item.quantity,
                    quantity_used=quote_item.square_inches * quote_item.quantity
                )
            
            sale.calculate_totals()
            sale_serializer = SaleSerializer(sale)
            return Response(sale_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        """Generate PDF invoice for a sale."""
        from django.http import HttpResponse
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        from io import BytesIO
        
        sale = self.get_object()
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#FF6600'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        # Company header
        elements.append(Paragraph("RotuPrinters", title_style))
        elements.append(Paragraph("Diseño Gráfico, Rotulación e Impresión", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Invoice info
        invoice_data = [
            ['Factura #:', sale.invoice_number],
            ['Fecha:', sale.created_at.strftime('%d/%m/%Y %H:%M')],
            ['Cliente:', sale.client.name],
            ['RTN Cliente:', sale.client.rtn or 'N/A'],
            ['Vendedor:', sale.created_by.get_full_name() or sale.created_by.username],
            ['Método de Pago:', sale.get_payment_method_display()],
        ]
        
        invoice_table = Table(invoice_data, colWidths=[2*inch, 4*inch])
        invoice_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(invoice_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Items table
        items_data = [['Producto', 'Cantidad', 'Precio Unit.', 'Total']]
        for item in sale.items.all():
            items_data.append([
                item.product.name,
                str(item.quantity),
                f'L {item.unit_price:.2f}',
                f'L {(item.quantity * item.unit_price):.2f}'
            ])
        
        items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055A4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Totals
        totals_data = [
            ['Subtotal:', f'L {sale.subtotal:.2f}'],
            ['ISV (15%):', f'L {sale.tax_amount:.2f}'],
        ]
        
        if sale.discount_amount > 0:
            totals_data.append(['Descuento:', f'- L {sale.discount_amount:.2f}'])
        
        totals_data.append(['TOTAL:', f'L {sale.total_amount:.2f}'])
        
        totals_table = Table(totals_data, colWidths=[5*inch, 2*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 14),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#FF6600')),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(totals_table)
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF from buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        # Create response
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Factura_{sale.invoice_number}.pdf"'
        response.write(pdf)
        
        return response


class SaleItemViewSet(viewsets.ModelViewSet):
    """ViewSet for SaleItem operations."""
    queryset = SaleItem.objects.select_related('sale', 'product').all()
    serializer_class = SaleItemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        sale_id = self.request.query_params.get('sale_id')
        if sale_id:
            queryset = queryset.filter(sale_id=sale_id)
        return queryset
