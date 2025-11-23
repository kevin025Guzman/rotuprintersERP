from datetime import datetime
from io import BytesIO

from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework import filters, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdminOrSeller
from utils.pdf import add_branding_to_canvas

from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('created_by').all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['date']
    search_fields = ['description']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def perform_destroy(self, instance):
        if not getattr(self.request.user, 'role', None) == 'ADMIN':
            raise PermissionDenied('Solo administradores pueden eliminar gastos.')
        instance.delete()

    @action(detail=False, methods=['get'], url_path='export_pdf')
    def export_pdf(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        expenses = queryset.order_by('-date')[:200]
        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ExpensesTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#FF6600'),
            alignment=1,
            spaceAfter=20,
        )

        elements.append(Paragraph('Reporte de Gastos', title_style))
        date_range = self._get_date_range_text(request)
        if date_range:
            elements.append(Paragraph(date_range, styles['Normal']))
            elements.append(Spacer(1, 0.2 * inch))

        summary_table = Table([
            ['Cantidad de Gastos', str(queryset.count())],
            ['Total (L)', f"L {total_amount:.2f}"],
        ], colWidths=[3 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3 * inch))

        if expenses:
            table_data = [['Fecha', 'Descripción', 'Monto (L)']]
            for expense in expenses:
                table_data.append([
                    expense.date.strftime('%d/%m/%Y'),
                    expense.description[:80],
                    f"L {expense.amount:.2f}",
                ])

            table = Table(table_data, colWidths=[1.3 * inch, 4.2 * inch, 1.2 * inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055A4')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph('No hay gastos en el rango seleccionado.', styles['Normal']))

        doc.build(elements, onFirstPage=add_branding_to_canvas, onLaterPages=add_branding_to_canvas)
        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(content_type='application/pdf')
        filename = timezone.localtime().strftime('Gastos_%Y%m%d_%H%M.pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(pdf)
        return response

    def _get_date_range_text(self, request):
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        if not start and not end:
            return ''
        start_label = start or 'inicio'
        end_label = end or timezone.localdate().strftime('%d/%m/%Y')
        return f'Rango de fechas: {start_label} - {end_label}'

    @action(detail=False, methods=['post'], url_path='delete_bulk')
    def delete_bulk(self, request):
        if not getattr(request.user, 'role', None) == 'ADMIN':
            raise PermissionDenied('Solo administradores pueden eliminar gastos.')

        ids = request.data.get('ids')
        if not isinstance(ids, list) or not ids:
            return Response(
                {'detail': 'Debe proporcionar una lista de IDs a eliminar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        expenses = Expense.objects.filter(id__in=ids)
        deleted_count = expenses.count()
        expenses.delete()
        return Response({'deleted': deleted_count})
