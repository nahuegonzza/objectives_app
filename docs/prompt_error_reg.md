Quiero que hagas un análisis profundo del sistema actual (Next.js + Prisma + PostgreSQL + Supabase) enfocado en detectar y corregir un error en producción.

⚠️ CONTEXTO IMPORTANTE:

* La app funciona PERFECTAMENTE en local
* Está deployada en Vercel
* El login funciona parcialmente
* El REGISTER (POST /api/register) devuelve 500 en producción
* En local el register funciona bien

---

# 🚨 ERROR ACTUAL

En producción:

POST /api/register → 500 Internal Server Error

En consola del navegador:
→ el error de "webpage_content_reporter.js" es irrelevante (extensión del navegador)

El problema REAL es el backend.

---

# 🎯 OBJETIVO

Quiero que encuentres EXACTAMENTE qué está rompiendo el endpoint de registro en producción y lo soluciones correctamente.

No quiero suposiciones.
Quiero debugging real.

---

# 🔍 TAREAS A REALIZAR

## 1. AUDITAR /api/register COMPLETO

* revisar lógica completa del endpoint
* detectar posibles errores silenciosos
* asegurar manejo correcto de errores (try/catch con console.error)

---

## 2. DETECTAR PROBLEMAS DE PRODUCCIÓN

Buscar específicamente:

### 🔐 bcrypt

* si se está usando `bcrypt`, reemplazar por `bcryptjs`
* asegurar compatibilidad con entorno serverless (Vercel)

---

### 🗄️ Prisma

* verificar que el cliente Prisma funciona en producción
* asegurar que no haya errores de conexión
* confirmar que el modelo User está correcto
* validar que no haya campos requeridos faltantes

---

### 🌍 Environment Variables

Verificar uso correcto de:

* DATABASE_URL
* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY

Asegurar que:

* se usan con `process.env`
* no hay valores undefined

---

## 3. LOGGING REAL (OBLIGATORIO)

Modificar el endpoint para que:

```ts
catch (error) {
  console.error("REGISTER ERROR:", error);
  return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
}
```

Esto es CLAVE para debugging en Vercel.

---

## 4. VALIDACIONES

* validar email
* validar password
* evitar crash por datos inválidos
* manejar errores de usuario ya existente

---

## 5. SEGURIDAD

* asegurar hash correcto de contraseña
* no devolver password
* sanitizar inputs

---

## 6. RESPUESTA DEL ENDPOINT

Devolver respuestas claras:

* success
* error específico
* no usar errores genéricos

---

# 🧠 BONUS (SI DETECTÁS PROBLEMAS)

Si detectás problemas estructurales:

* refactorizar endpoint
* mejorar estructura
* separar lógica si es necesario

---

# 📦 OUTPUT ESPERADO

Quiero:

* endpoint /api/register funcionando en producción
* compatible con Vercel
* sin errores 500
* con logs claros
* usando bcryptjs si aplica
* con Prisma funcionando correctamente
* código limpio y robusto

---

⚠️ IMPORTANTE:

* no romper login existente
* no simplificar lógica
* no eliminar funcionalidad existente

---

Podés modificar cualquier archivo necesario para lograr esto.

Tomate el tiempo necesario y verificá que realmente funcione en entorno de producción.
