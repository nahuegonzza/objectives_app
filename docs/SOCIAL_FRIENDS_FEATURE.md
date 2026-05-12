# Social Friends Feature

## Resumen
Se agrega un sistema social básico dentro de la app para permitir:
- Búsqueda de usuarios por `username`.
- Envío de solicitudes de amistad.
- Visualización de solicitudes entrantes y salientes.
- Listado de amigos aceptados en el perfil.
- Aceptar o rechazar solicitudes.
- Mostrar al usuario cuántas solicitudes pendientes tiene en su perfil.

## Cambios en la base de datos
Se añadió un nuevo modelo `FriendRequest` en `prisma/schema.prisma`:
- `senderId` y `receiverId`.
- `status` con valores `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`.
- Relaciones de usuario para solicitudes enviadas y recibidas.
- Restricción única para evitar duplicar una solicitud entre el mismo par de usuarios.

## Nuevo API social
### `GET /api/user/search?query=...`
- Busca usuarios por `username`.
- Devuelve hasta 10 resultados.
- Requiere autenticación.

### `GET /api/user/friend-requests`
- Obtiene:
  - Amigos aceptados.
  - Solicitudes entrantes pendientes.
  - Solicitudes salientes.
  - Conteos de solicitudes pendientes.
- Requiere autenticación.

### `POST /api/user/friend-requests`
- Envía una solicitud a otro usuario por `username`.
- Valida que el usuario exista.
- Evita enviar solicitudes a uno mismo.
- Evita duplicar solicitudes pendientes o amistades ya aceptadas.

### `PATCH /api/user/friend-requests`
- Actualiza el estado de una solicitud con `requestId` y `action`.
- `accept` / `decline` solo puede ejecutar el receptor.
- `cancel` solo puede ejecutar el remitente.

## Cambios de UI
Se actualiza `app/profile/page.tsx` para:
- Mostrar amigos reales en lugar de contenido estático.
- Mostrar solicitudes entrantes con botones de aceptar/rechazar.
- Permitir buscar y enviar solicitudes por `username`.
- Mostrar un contador de solicitudes pendientes.

## Recomendaciones
- Ejecutar `npx prisma migrate dev --name add_friend_requests` después de ajustar el esquema.
- Asegurarse de que los usuarios tengan `username` definidos para poder enviarse solicitudes.
- Validar que el middleware de sesión siga funcionando con las nuevas rutas.
