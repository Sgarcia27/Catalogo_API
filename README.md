# S10-TAREA_2

API REST para catálogo de productos y favoritos con autenticación JWT y roles.

## Requisitos funcionales

- Proyecto inicial con Express y Node.js
- Persistencia con SQLite local
- Registro e inicio de sesión
- JWT con expiración y validación
- Servicios públicos para consultar catálogo
- Solo administradores pueden crear, actualizar y eliminar productos
- Favoritos protegidos por usuario autenticado usando el id del token
- Datos persistentes al reiniciar el proceso

## Instalación

1. Entra al proyecto:
   cd catalogo-api
2. Instala dependencias:
   npm install
3. Copia `.env.example` a `.env` y ajusta los valores.
4. Inicializa el administrador:
   npm run init:admin
5. Inicia el servidor:
   npm start

## Variables de entorno

- PORT: puerto HTTP
- DATABASE_PATH: ruta de la base SQLite
- JWT_SECRET: clave para firmar JWT
- JWT_EXPIRES_IN: duración del token, por ejemplo `1h`
- ADMIN_EMAIL: correo del administrador
- ADMIN_PASSWORD: contraseña inicial del administrador

## Endpoints principales

- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id
- POST /api/auth/register
- POST /api/auth/login
- GET /api/favorites
- POST /api/favorites/:productId
- DELETE /api/favorites/:productId

## Administrador

El usuario administrador se crea mediante:

npm run init:admin

No se permite asignar el rol `admin` desde el registro público.

## Probar con Postman

1. Inicia el servidor con `npm start`.
2. En Postman, importa `catalogo-api/postman/Catalogo API.postman_collection.json` y `catalogo-api/postman/Catalogo API Local.postman_environment.json`.
3. Selecciona el entorno `Catalogo API Local`.
4. Verifica que `adminEmail` y `adminPassword` coincidan con los valores de tu archivo `.env`.
5. Ejecuta las solicitudes en orden. La colección registra un usuario de prueba, guarda los JWT de usuario y administrador, prueba catálogo y favoritos y después crea, actualiza y elimina un producto de prueba.

La colección espera la API en `http://localhost:3000`. Si cambias el puerto, actualiza `baseUrl` en el entorno. La contraseña del administrador de ejemplo debe cambiarse si configuraste otra en `.env`.
