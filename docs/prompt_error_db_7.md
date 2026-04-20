🚨 PROBLEMA

Las queries de Prisma fallan en producción con:

Error opening a TLS connection: self-signed certificate in certificate chain
CONTEXTO
Next.js en Vercel
Supabase PostgreSQL
Prisma ORM
DATABASE_URL usa Supabase pooler (puerto 6543)
CAUSA

La conexión no está configurada correctamente para SSL.

El pooler de Supabase requiere parámetros explícitos de SSL.

OBJETIVO

Configurar correctamente la conexión para evitar errores TLS.

TAREAS
Modificar DATABASE_URL para incluir parámetros SSL correctos
Asegurar que incluya:
sslmode=require
Mantener también:
pgbouncer=true
FORMATO FINAL ESPERADO
postgresql://USER:PASSWORD@HOST:PORT/postgres?pgbouncer=true&sslmode=require
VALIDACIÓN
Prisma debe poder ejecutar queries sin errores TLS
findMany() debe funcionar
endpoints /api/* deben dejar de devolver 500
REGLAS
No desactivar SSL
No usar configuraciones inseguras
No eliminar pooler
RESULTADO
conexión estable
sin errores TLS
datos cargando correctamente