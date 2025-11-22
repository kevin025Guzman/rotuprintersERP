import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Package, 
  Search, Filter, Sliders, X, PlusCircle, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import { simpleInventoryService } from '../services/simpleInventoryService';
import { useDialog } from '../context/DialogContext';
import logoImage from '../assets/logo.png';

export default function SimpleInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sku: '',
    min_quantity: '',
    max_quantity: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  const { alertDialog, confirmDialog } = useDialog();

  const loadLogoImage = () => (
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoImage;
      img.onload = () => resolve(img);
      img.onerror = reject;
    })
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = { search: searchTerm, ...filters };
      const data = await simpleInventoryService.getProducts(params);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading products:', error);
      await alertDialog({ title: 'Error', message: 'Error al cargar los productos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, filters]);

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar producto',
      message: '¿Está seguro de eliminar este producto?'
    });
    if (!confirmed) return;
    try {
      await simpleInventoryService.deleteProduct(id);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      await alertDialog({ title: 'Error', message: 'Error al eliminar el producto' });
    }
  };

  const handleAdjustStock = async (productId, adjustment) => {
    try {
      const quantity = parseInt(adjustment, 10);
      if (isNaN(quantity)) return;
      
      await simpleInventoryService.adjustStock(productId, quantity, 'Ajuste manual');
      loadProducts();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      await alertDialog({ title: 'Error', message: 'Error al ajustar el inventario' });
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportPdf = async () => {
    const doc = new jsPDF();
    const brandColor = [255, 102, 0];
    const barHeight = 14;

    const applyBranding = () => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(...brandColor);
      doc.rect(0, 0, pageWidth, barHeight, 'F');
      doc.rect(0, pageHeight - barHeight, pageWidth, barHeight, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RotuPrinters', pageWidth / 2, barHeight / 2 + 4, { align: 'center' });

      doc.setTextColor(33, 33, 33);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    };

    applyBranding();

    try {
      const logo = await loadLogoImage();
      const logoY = barHeight + 6;
      doc.addImage(logo, 'PNG', 14, logoY, 18, 18);
    } catch (error) {
      // Si falla la carga del logo, continuamos sin él
    }

    const headerTextY = barHeight + 18;
    doc.setFontSize(20);
    doc.text('RotuPrinters', 36, headerTextY);
    doc.setFontSize(14);
    doc.text('Inventario Manual', 36, headerTextY + 8);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, headerTextY + 18);

    const tableTop = headerTextY + 28;
    const rowHeight = 8;
    let currentY = tableTop;

    const headers = ['Nombre', 'Descripción', 'Cantidad'];
    doc.setFontSize(11);
    headers.forEach((header, index) => {
      const x = 14 + index * 60;
      doc.text(header, x, currentY);
    });

    currentY += 4;
    doc.setLineWidth(0.1);
    doc.line(14, currentY, 196, currentY);
    currentY += 6;

    sortedProducts.forEach((product) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (currentY > pageHeight - (barHeight + 20)) {
        doc.addPage();
        applyBranding();
        currentY = tableTop;
      }
      const descText = doc.splitTextToSize(product.description || 'Sin descripción', 90);
      doc.text(product.name, 14, currentY);
      doc.text(descText, 74, currentY);
      doc.text(`${product.quantity}`, 164, currentY);
      currentY += rowHeight + (descText.length - 1) * 5;
    });

    doc.save(`inventario-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Inventario Simple
          </h1>
          <p className="text-sm text-gray-500">
            Gestión básica de productos y existencias
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportPdf}
            className="btn-outline flex items-center gap-2"
          >
            <Download size={16} />
            Descargar PDF
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            Filtros
          </button>
          <Link
            to="/simple-inventory/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código (SKU)</label>
              <input
                type="text"
                value={filters.sku}
                onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
                className="input-field"
                placeholder="Filtrar por código"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cant. Mínima</label>
              <input
                type="number"
                value={filters.min_quantity}
                onChange={(e) => setFilters({ ...filters, min_quantity: e.target.value })}
                className="input-field"
                placeholder="Mínimo"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cant. Máxima</label>
              <input
                type="number"
                value={filters.max_quantity}
                onChange={(e) => setFilters({ ...filters, max_quantity: e.target.value })}
                className="input-field"
                placeholder="Máximo"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10 w-full"
          placeholder="Buscar productos..."
        />
      </div>

      {/* Tabla de productos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Nombre
                    {sortConfig.key === 'name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center">
                    Cantidad
                    {sortConfig.key === 'quantity' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-sm">
                        {product.description || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.quantity <= 0 
                            ? 'bg-red-100 text-red-800' 
                            : product.quantity < 10 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {product.quantity} unidades
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const adjustment = prompt('Ingrese la cantidad a sumar (o restar con -)');
                              if (adjustment !== null) {
                                handleAdjustStock(product.id, parseInt(adjustment, 10));
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Ajustar inventario"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const quantity = parseInt(prompt('Nueva cantidad:', product.quantity), 10);
                              if (!isNaN(quantity)) {
                                const adjustment = quantity - product.quantity;
                                handleAdjustStock(product.id, adjustment);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-green-600"
                            title="Establecer cantidad exacta"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/simple-inventory/edit/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
