from pathlib import Path
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import Quotation, QuotationItem
from .serializers import (
    QuotationSerializer, QuotationListSerializer, QuotationItemSerializer
)
from users.permissions import IsAdminOrSeller
from utils.pdf import add_branding_to_canvas


def get_logo_path():
    candidates = [
        Path(settings.BASE_DIR) / 'logo.png',
        Path(settings.BASE_DIR) / 'static' / 'logo.png',
        Path(settings.BASE_DIR) / 'staticfiles' / 'logo.png',
        Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'logo.png',
        Path(settings.BASE_DIR) / 'frontend_dist' / 'logo.png',
    ]
    for path in candidates:
        if path.exists():
            return str(path)
    return None


class QuotationViewSet(viewsets.ModelViewSet):
    """ViewSet for Quotation CRUD operations."""
    queryset = Quotation.objects.select_related('client', 'created_by').prefetch_related('items').all()
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status', 'created_by']
    search_fields = ['quotation_number', 'client__name', 'client__company']
    ordering_fields = ['created_at', 'total_amount', 'quotation_number']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return QuotationListSerializer
        return QuotationSerializer
    
    def perform_destroy(self, instance):
        if not getattr(self.request.user, 'is_admin', False):
            raise PermissionDenied('Solo administradores pueden eliminar cotizaciones.')
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a quotation."""
        quotation = self.get_object()
        if quotation.status == Quotation.Status.CONVERTED:
            return Response(
                {'error': 'Esta cotización ya fue convertida a venta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        quotation.status = Quotation.Status.APPROVED
        quotation.save()
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a quotation."""
        quotation = self.get_object()
        quotation.status = Quotation.Status.REJECTED
        quotation.save()
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def convert_to_sale(self, request, pk=None):
        """Convert quotation to sale (handled in sales app)."""
        quotation = self.get_object()
        if quotation.status == Quotation.Status.CONVERTED:
            return Response(
                {'error': 'Esta cotización ya fue convertida a venta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # This will be handled by the sales endpoint
        return Response({
            'message': 'Use POST /api/sales/from_quotation/ with quotation_id',
            'quotation_id': quotation.id
        })

    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        """Generate a PDF for a quotation with logo."""
        from io import BytesIO
        from django.http import HttpResponse
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            SimpleDocTemplate,
            Table,
            TableStyle,
            Paragraph,
            Spacer,
            Image,
        )
        from reportlab.lib.enums import TA_CENTER

        quotation = self.get_object()

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'QuotationTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#FF6600'),
            alignment=TA_CENTER,
            spaceAfter=20,
        )

        logo_path = get_logo_path()
        logo = None
        if logo_path:
            try:
                logo = Image(logo_path, width=1.0 * inch, height=1.0 * inch)
            except Exception:
                logo = None

        title = Paragraph("RotuPrinters", title_style)
        if logo:
            header = Table([[logo, title]], colWidths=[1.2 * inch, 5.8 * inch])
            header.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]))
            header.hAlign = 'CENTER'
            elements.append(header)
            elements.append(Spacer(1, 0.15 * inch))
        else:
            elements.append(title)

        elements.append(Paragraph(
            f"Cotización {quotation.quotation_number}",
            styles['Heading2']
        ))
        elements.append(Spacer(1, 0.2 * inch))

        created_at = timezone.localtime(quotation.created_at)
        info_data = [
            ['Cliente:', quotation.client.name],
            ['Vendedor:', quotation.created_by.username if quotation.created_by else 'N/D'],
            ['Estado:', quotation.get_status_display()],
            ['Creada:', created_at.strftime('%d/%m/%Y %H:%M')],
        ]
        if quotation.include_client_details:
            if quotation.client_rtn:
                info_data.append(['RTN Cliente:', quotation.client_rtn])
            if quotation.client_phone:
                info_data.append(['Teléfono Cliente:', quotation.client_phone])
            if quotation.client_address:
                info_data.append(['Dirección Cliente:', quotation.client_address])
        if quotation.valid_until:
            info_data.append(['Válida hasta:', quotation.valid_until.strftime('%d/%m/%Y')])
        if quotation.notes:
            info_data.append(['Notas:', quotation.notes])

        info_table = Table(info_data, colWidths=[1.5 * inch, 4.5 * inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.2 * inch))

        subtotal = quotation.subtotal or Decimal('0')
        tax_amount = quotation.tax_amount or Decimal('0')
        total = quotation.total_amount or Decimal('0')

        summary_rows = [
            ['Subtotal', f'L {subtotal:.2f}'],
        ]
        if quotation.discount_amount:
            summary_rows.append([
                f"Descuento ({quotation.discount_percentage}%)",
                f"- L {quotation.discount_amount:.2f}"
            ])
        if quotation.apply_tax:
            summary_rows.append([
                f"ISV ({quotation.tax_rate}%)",
                f"L {tax_amount:.2f}"
            ])
        summary_rows.append(['Total', f'L {total:.2f}'])

        summary_table = Table(summary_rows, colWidths=[3 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        items = quotation.items.all()
        if items:
            elements.append(Paragraph('Detalle de Items', styles['Heading3']))
            elements.append(Spacer(1, 0.1 * inch))
            item_rows = [[
                'Producto', 'Descripción', 'Cantidad',
                'Precio/pulg²', 'Total'
            ]]
            for item in items:
                item_rows.append([
                    item.product.name if item.product else item.description[:30],
                    item.description or 'N/D',
                    str(item.quantity),
                    f'L {item.price_per_square_inch:.2f}',
                    f'L {item.total:.2f}',
                ])
            table = Table(item_rows, colWidths=[1.5 * inch, 2.3 * inch, 0.7 * inch, 1.1 * inch, 1.1 * inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055A4')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 0.2 * inch))
        else:
            elements.append(Spacer(1, 0.1 * inch))

        elements.append(summary_table)
        elements.append(Spacer(1, 0.4 * inch))

        signature_table = Table([[" "]], colWidths=[4 * inch])
        signature_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        signature_table.hAlign = 'CENTER'
        elements.append(signature_table)

        signature_label_style = ParagraphStyle(
            'SignatureLabel',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            spaceBefore=4
        )
        elements.append(Paragraph('Firma', signature_label_style))

        doc.build(
            elements,
            onFirstPage=add_branding_to_canvas,
            onLaterPages=add_branding_to_canvas
        )
        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = (
            f"attachment; filename=\"Cotizacion_{quotation.quotation_number}.pdf\""
        )
        response.write(pdf)
        return response

    @action(detail=False, methods=['post'], url_path='delete_bulk')
    def delete_bulk(self, request):
        user = request.user
        if not getattr(user, 'is_admin', False):
            return Response({'detail': 'Solo administradores pueden eliminar cotizaciones.'}, status=status.HTTP_403_FORBIDDEN)
        ids = request.data.get('ids')
        if not isinstance(ids, list) or not ids:
            return Response({'detail': 'Debe proporcionar una lista de IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        quotations = Quotation.objects.filter(id__in=ids)
        deleted = quotations.count()
        quotations.delete()
        return Response({'deleted': deleted})


class QuotationItemViewSet(viewsets.ModelViewSet):
    """ViewSet for QuotationItem operations."""
    queryset = QuotationItem.objects.select_related('quotation', 'product').all()
    serializer_class = QuotationItemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        quotation_id = self.request.query_params.get('quotation_id')
        if quotation_id:
            queryset = queryset.filter(quotation_id=quotation_id)
        return queryset
