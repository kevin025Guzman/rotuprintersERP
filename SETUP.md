# 🚀 Guía de Configuración Rápida - RotuPrinters

## Inicio Rápido con Docker (Recomendado)

### 1. Iniciar el Sistema

```bash
# En la raíz del proyecto
docker-compose up -d
```

Esto levantará:
- Backend Django en http://localhost:8000
- Frontend React en http://localhost:5173
- Base de datos PostgreSQL

### 2. Crear Usuario Administrador

```bash
docker-compose exec backend python manage.py createsuperuser
```

Ingresa:
- Username: admin
- Email: admin@rotuprinters.com
- Password: (tu contraseña segura)

### 3. Cargar Datos Iniciales (Opcional)

```bash
# Crear categorías de productos
docker-compose exec backend python manage.py shell
```

En el shell de Django:
```python
from inventory.models import ProductCategory

categories = [
    {'name': 'Banner', 'description': 'Rollos de banner para impresión'},
    {'name': 'Sticker', 'description': 'Rollos de sticker adhesivo'},
    {'name': 'PVC', 'description': 'Láminas de PVC'},
    {'name': 'Lona', 'description': 'Lona para impresión'},
    {'name': 'Vinil', 'description': 'Vinil decorativo'},
]

for cat in categories:
    ProductCategory.objects.get_or_create(name=cat['name'], defaults=cat)

print("Categorías creadas!")
exit()
```

### 4. Acceder al Sistema

- **Frontend:** http://localhost:5173
- **API:** http://localhost:8000/api
- **Admin Django:** http://localhost:8000/admin
- **Documentación API:** http://localhost:8000/swagger

**Credenciales por defecto:**
- Usuario: admin
- Contraseña: (la que creaste)

## 📝 Crear Usuarios de Prueba

### Desde Django Admin (http://localhost:8000/admin)

1. Ir a "Users" → "Add User"
2. Completar información
3. Asignar rol (ADMIN, SELLER, DESIGNER)

### Desde la API

```bash
curl -X POST http://localhost:8000/api/users/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "vendedor1",
    "email": "vendedor@rotuprinters.com",
    "password": "Password123!",
    "password_confirm": "Password123!",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "SELLER",
    "phone": "99887766"
  }'
```

## 🏢 Datos de Ejemplo

### Crear Cliente de Prueba

```python
# Ejecutar en django shell
docker-compose exec backend python manage.py shell

from clients.models import Client

Client.objects.create(
    name="Empresa Ejemplo S.A.",
    company="Ejemplo Corp",
    phone="22334455",
    email="contacto@ejemplo.com",
    address="Col. Ejemplo, Tegucigalpa",
    rtn="08011234567890"
)
```

### Crear Productos de Ejemplo

```python
from inventory.models import Product, ProductCategory

# Obtener categorías
banner = ProductCategory.objects.get(name='Banner')
sticker = ProductCategory.objects.get(name='Sticker')

# Crear productos
Product.objects.create(
    name="Banner Brillante 13oz",
    category=banner,
    unit_measure="ROLL",
    quantity_available=5,
    unit_cost=500.00,
    unit_price=750.00,
    price_per_square_inch=0.50,
    supplier="Proveedor ABC",
    minimum_stock=2
)

Product.objects.create(
    name="Sticker Mate",
    category=sticker,
    unit_measure="ROLL",
    quantity_available=10,
    unit_cost=300.00,
    unit_price=450.00,
    price_per_square_inch=0.35,
    supplier="Proveedor XYZ",
    minimum_stock=3
)
```

## 🔧 Comandos Útiles

### Docker

```bash
# Ver logs
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Ver logs solo del frontend
docker-compose logs -f frontend

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡cuidado! elimina la BD)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Ejecutar comando en backend
docker-compose exec backend python manage.py <comando>

# Acceder a shell de PostgreSQL
docker-compose exec db psql -U rotuprinters_user -d rotuprinters_db
```

### Django

```bash
# Crear migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Shell de Django
docker-compose exec backend python manage.py shell

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Recolectar archivos estáticos
docker-compose exec backend python manage.py collectstatic
```

### Frontend

```bash
# Instalar dependencias
docker-compose exec frontend npm install

# Reconstruir
docker-compose exec frontend npm run build
```

## 🐛 Solución de Problemas

### Error: Puerto ya en uso

```bash
# Ver qué está usando el puerto 8000
netstat -ano | findstr :8000

# Cambiar puertos en docker-compose.yml
```

### Error: Base de datos no se conecta

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Revisar logs
docker-compose logs db

# Reiniciar DB
docker-compose restart db
```

### Error: Frontend no se conecta al backend

1. Verificar que VITE_API_URL esté correcta en docker-compose.yml
2. Verificar CORS en Django settings.py
3. Reiniciar servicios

### Limpiar y reiniciar todo

```bash
docker-compose down -v
docker-compose up --build
```

## 🔐 Configuración de Producción

### 1. Variables de Entorno

Crear `backend/.env`:
```env
SECRET_KEY=<generar-key-segura>
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=rotuprinters_prod
DB_USER=rotuprinters_prod_user
DB_PASSWORD=<password-segura>
DB_HOST=db
DB_PORT=5432
JWT_SECRET_KEY=<jwt-key-segura>
```

### 2. Generar Secret Keys

```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Configurar HTTPS

Agregar nginx o usar servicio como Render, Railway, Heroku.

## 📚 Recursos Adicionales

- [Documentación Django](https://docs.djangoproject.com/)
- [Documentación React](https://react.dev/)
- [Documentación TailwindCSS](https://tailwindcss.com/)
- [Documentación Docker](https://docs.docker.com/)

## 💡 Tips

1. **Backup de Base de Datos:**
```bash
docker-compose exec db pg_dump -U rotuprinters_user rotuprinters_db > backup.sql
```

2. **Restaurar Base de Datos:**
```bash
docker-compose exec -T db psql -U rotuprinters_user rotuprinters_db < backup.sql
```

3. **Monitoring:**
- Usar Django Debug Toolbar en desarrollo
- Configurar logging en producción
- Monitorear recursos con `docker stats`

---

¿Problemas? Contacta a: dev@rotuprinters.com
