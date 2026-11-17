# S10-TAREA_2

API REST para catálogo de productos y favoritos con autenticación JWT y roles.

## Preparación

Requiere Node.js 18 o posterior.

```powershell
cd catalogo-api
npm.cmd install
Copy-Item .env.example .env
```

Completa `.env` antes de iniciar la API:

- `PORT`: puerto HTTP (por defecto `3000`).
- `DATABASE_PATH`: ruta de SQLite (por defecto `./data/catalogo.db`).
- `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres. No lo compartas ni lo subas al repositorio.
- `JWT_EXPIRES_IN`: vencimiento JWT, por ejemplo `1h`.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: credenciales iniciales del administrador.
- `ADMIN_NAME`: nombre opcional del administrador.

Genera un secreto local, por ejemplo con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, y copia el resultado a `JWT_SECRET`. No uses un secreto compartido de ejemplo.

## Iniciar

```powershell
npm.cmd run init:admin
npm.cmd start
```

El registro público siempre asigna el rol `usuario`. El script de inicialización no imprime la contraseña y falla si faltan las variables de administrador.

## Rutas y permisos

Todas las rutas llevan el prefijo `/api`. Los nombres de rutas en español cumplen la especificación; se mantienen también alias en inglés para compatibilidad.

| Método y ruta | Permiso | Cuerpo / propósito | Respuesta exitosa |
|---|---|---|---|
| `POST /api/auth/registro` | Público | `{ "name", "email", "password" }` | `201`, usuario sin hash |
| `POST /api/auth/login` | Público | `{ "email", "password" }` | `200`, JWT y usuario sin hash |
| `GET /api/productos?category=Tecnología` | Público | Filtra categoría opcionalmente | `200`, arreglo |
| `GET /api/productos/:id` | Público | Consultar producto | `200`, producto |
| `POST /api/productos` | Administrador | `{ "name", "description", "category", "price" }` | `201`, producto |
| `PUT /api/productos/:id` | Administrador | Campos de producto a actualizar | `200`, producto |
| `DELETE /api/productos/:id` | Administrador | Eliminar producto | `204` |
| `GET /api/favoritos` | Autenticado | Listar los propios favoritos | `200`, arreglo |
| `POST /api/favoritos` | Autenticado | `{ "productId": 1 }` | `201`, favorito |
| `DELETE /api/favoritos/:productoId` | Autenticado | Quitar de los propios favoritos | `200`, confirmación |

Las rutas protegidas requieren `Authorization: Bearer <token>`. Los tokens se verifican por firma y vencimiento. Los productos eliminados eliminan también sus favoritos mediante `ON DELETE CASCADE`.

Los errores usan JSON con `message`. Se devuelve `400` para validaciones, `401` para autenticación, `403` para permisos, `404` para recursos inexistentes y `409` para duplicados. Los errores internos responden `500` sin exponer detalles de implementación.

## Postman

1. Inicia el servidor y carga el administrador con los pasos anteriores.
2. Importa `catalogo-api/postman/Catalogo API.postman_collection.json`, `catalogo-api/postman/Catalogo API Persistencia.postman_collection.json` y `catalogo-api/postman/Catalogo API Local.postman_environment.json`.
3. Selecciona el entorno **Catalogo API Local**. Completa localmente `userPassword`, `adminEmail`, `adminPassword` y `jwtSecret`; el archivo exportado los deja vacíos.
4. Ejecuta la colección en orden para probar registro/login, roles, CRUD, validaciones y aislamiento de favoritos.
5. Para demostrar persistencia, ejecuta las peticiones del folder **Persistencia (después de reiniciar)** solo después de crear el favorito, reiniciar Node.js y volver a iniciar sesión si el JWT venció.

La colección espera `http://localhost:3000`; cambia `baseUrl` si usas otro puerto. Los datos se guardan en SQLite en `DATABASE_PATH`.
