El proyecto ya supera prisma generate, pero el build puede bloquearse en prisma migrate deploy.

OBJETIVO

Evitar que el build en Vercel se cuelgue durante migraciones.

TAREAS
Verificar prisma.config.ts
Asegurar que datasource tenga:
url: process.env.DATABASE_URL
directUrl: process.env.DIRECT_DATABASE_URL
Confirmar que:
DATABASE_URL = pooler (6543)
DIRECT_DATABASE_URL = conexión directa (5432)
Asegurar que Prisma use directUrl automáticamente para migraciones
FALLBACK (si sigue colgándose)

Modificar script:

"build": "next build"

y remover:

prisma migrate deploy &&
RESULTADO
build NO se cuelga
migraciones no usan pooler
deploy estable en Vercel