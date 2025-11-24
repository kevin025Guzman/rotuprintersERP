# 🎨 RotuPrinters - Sistema de Gestión

Sistema completo de gestión para empresa de diseño gráfico, rotulación e impresión de materiales publicitarios.

## 🚀 Tecnologías

### Backend
- **Django 4.2** + Django REST Framework
- **PostgreSQL** (producción) / SQLite (desarrollo)
- **JWT** para autenticación
- **Swagger/ReDoc** para documentación de API
- **Docker** para contenedores

### Frontend
- **React 18** con Vite
- **TailwindCSS** para estilos
- **Zustand** para manejo de estado
- **Axios** para peticiones HTTP
- **React Router** para navegación
- **Chart.js** para gráficos
- **Lucide React** para iconos

## 📋 Funcionalidades

### 1. **Usuarios y Roles**
- ✅ Registro e inicio de sesión con JWT
- ✅ 3 roles: Administrador, Operaciones, Ventas
- ✅ Permisos específicos por rol
- ✅ Gestión de usuarios (solo Admin)

### 2. **Clientes**
- ✅ CRUD completo de clientes
- ✅ Búsqueda y filtrado
- ✅ Información: nombre, empresa, teléfono, correo, dirección, RTN
- ✅ Historial de ventas por cliente

### 3. **Inventario**
- ✅ Gestión de productos (banners, stickers, láminas PVC, etc.)
- ✅ Control de stock con alertas
- ✅ Categorías de productos
- ✅ Movimientos de inventario (entradas/salidas)
- ✅ SKU automático

### 4. **Cotizaciones**
- ✅ Crear cotizaciones basadas en medidas (largo × ancho)
- ✅ Cálculo automático por pulgada cuadrada
- ✅ Estados: Pendiente, Aprobada, Rechazada, Convertida
- ✅ Conversión a venta

### 5. **Ventas y Facturación**
- ✅ Registro de ventas
- ✅ Generación de facturas con número correlativo
- ✅ Cálculo automático de ISV (15%)
- ✅ Descuentos
- ✅ Actualización automática de inventario
- ✅ Múltiples métodos de pago

### 6. **Reportería**
- ✅ Dashboard con métricas principales
- ✅ Reportes de ventas por período
- ✅ Productos más vendidos
- ✅ Inventario bajo
- ✅ Estado de cotizaciones
- ✅ Top clientes

## 🎨 Diseño

- **Colores corporativos:**
  - Primario: Anaranjado (#FF6600)
  - Secundario: Azul (#0055A4)
- **Responsive design** (móvil, tablet, escritorio)
- **Modo oscuro** opcional
- **UI moderna** con TailwindCSS

## 🐳 Instalación con Docker

### Prerrequisitos
- Docker
- Docker Compose

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd rotuprinters
```

2. **Configurar variables de entorno**
```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones
```

3. **Construir y levantar contenedores**
```bash
docker-compose up --build
```

4. **Crear superusuario (en otra terminal)**
```bash
docker-compose exec backend python manage.py createsuperuser
```

5. **Acceder a la aplicación**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin Django: http://localhost:8000/admin
- Swagger UI: http://localhost:8000/swagger
- ReDoc: http://localhost:8000/redoc

## 💻 Instalación Local (sin Docker)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Cargar datos de ejemplo (opcional)
python manage.py loaddata fixtures/initial_data.json

# Iniciar servidor
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
rotuprinters/
├── backend/
│   ├── rotuprinters/          # Configuración Django
│   ├── users/                 # App de usuarios
│   ├── clients/               # App de clientes
│   ├── inventory/             # App de inventario
│   ├── quotations/            # App de cotizaciones
│   ├── sales/                 # App de ventas
│   ├── reports/               # App de reportes
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── services/          # Servicios API
│   │   ├── store/             # Zustand stores
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## 🔑 API Endpoints

### Autenticación
- `POST /api/users/auth/login/` - Iniciar sesión
- `POST /api/users/auth/refresh/` - Refrescar token
- `POST /api/users/auth/register/` - Registro

### Usuarios
- `GET /api/users/` - Listar usuarios
- `GET /api/users/me/` - Perfil actual
- `PUT /api/users/update_profile/` - Actualizar perfil
- `POST /api/users/change_password/` - Cambiar contraseña

### Clientes
- `GET /api/clients/` - Listar clientes
- `POST /api/clients/` - Crear cliente
- `GET /api/clients/{id}/` - Detalle cliente
- `PUT /api/clients/{id}/` - Actualizar cliente
- `DELETE /api/clients/{id}/` - Eliminar cliente

### Inventario
- `GET /api/inventory/products/` - Listar productos
- `POST /api/inventory/products/` - Crear producto
- `GET /api/inventory/products/low_stock/` - Productos con stock bajo
- `GET /api/inventory/categories/` - Categorías
- `POST /api/inventory/movements/` - Registrar movimiento

### Cotizaciones
- `GET /api/quotations/` - Listar cotizaciones
- `POST /api/quotations/` - Crear cotización
- `POST /api/quotations/{id}/approve/` - Aprobar
- `POST /api/quotations/{id}/reject/` - Rechazar

### Ventas
- `GET /api/sales/` - Listar ventas
- `POST /api/sales/` - Crear venta
- `POST /api/sales/from_quotation/` - Crear desde cotización
- `POST /api/sales/{id}/complete/` - Completar venta
- `POST /api/sales/{id}/cancel/` - Cancelar venta

### Reportes
- `GET /api/reports/dashboard/` - Estadísticas dashboard
- `GET /api/reports/sales/` - Reporte de ventas
- `GET /api/reports/inventory/` - Reporte de inventario
- `GET /api/reports/quotations/` - Reporte de cotizaciones
- `GET /api/reports/clients/` - Reporte de clientes

## 🔐 Roles y Permisos

### Administrador
- Acceso total al sistema
- Gestión de usuarios
- Configuración
- Todos los reportes

### Operaciones
- Gestión de clientes
- Crear y gestionar cotizaciones
- Registrar ventas
- Ver reportes básicos

### Ventas
- Acceso a módulos de ventas, gastos, inventario manual y cotizaciones
- Sin acceso a Dashboard, Reportes ni Usuarios

## 🧪 Tests

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📦 Despliegue en Producción

### Railway / Dockerfile Único

1. **Dockerfile** (en la raíz) — ya incluido en este repo. Construye backend y frontend en etapas separadas y arranca Gunicorn:
   ```dockerfile
   FROM python:3.11-slim AS backend-build
   ...
   CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn rotuprinters.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
   ```

2. **Procfile** (en la raíz) — Railway lo detecta automáticamente:
   ```
   web: gunicorn rotuprinters.wsgi:application --bind 0.0.0.0:${PORT:-8000}
   ```

3. **Variables de entorno recomendadas en Railway**
   | Variable | Descripción |
   | --- | --- |
   | `SECRET_KEY` | Clave segura de Django |
   | `DEBUG` | `False` en producción |
   | `ALLOWED_HOSTS` | Ej. `miapp.up.railway.app` |
   | `DATABASE_URL` | Railway la provee al conectar PostgreSQL |
   | `JWT_SECRET_KEY` | Si deseas separarla de `SECRET_KEY` |
   | `CORS_ALLOWED_ORIGINS` | Comma-separated con tu dominio público |
   | `ISV_TAX_RATE` | Opcional para personalizar el impuesto |

4. **Comandos automáticos** — El contenedor ejecuta `collectstatic`, `migrate` y luego Gunicorn.

> Railway detecta automáticamente el `PORT`; no necesitas exponerlo manualmente.

### Configuración para PostgreSQL

Editar `backend/.env`:
```env
DEBUG=False
DB_ENGINE=django.db.backends.postgresql
DB_NAME=rotuprinters_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_HOST=db_host
DB_PORT=5432
```

### Comandos de producción

```bash
# Recolectar archivos estáticos
docker-compose exec backend python manage.py collectstatic --noinput

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate
```

## 🛠️ Variables de Entorno

### Backend
```env
SECRET_KEY=tu-secret-key-segura
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com
DATABASE_URL=postgres://usuario:password@host:5432/rotuprinters_db
JWT_SECRET_KEY=tu-jwt-secret
CORS_ALLOWED_ORIGINS=https://tu-dominio.com
```

### Frontend
```env
VITE_API_URL=http://localhost:8000/api
```

## 📄 Licencia

Este proyecto es propiedad de RotuPrinters.

## 👥 Contacto

- Email: info@rotuprinters.com
- Website: www.rotuprinters.com

## 🎯 Próximas Funcionalidades

- [ ] Generación de PDF para facturas
- [ ] Notificaciones por email
- [ ] Módulo de diseño
- [ ] Chat interno
- [ ] App móvil

---

Desarrollado con ❤️ para RotuPrinters
