# 🔴 INFORME TÉCNICO: Bug Crítico de Cross-User Data Overwrite

**Fecha:** 28 de Abril de 2026  
**Severidad:** CRÍTICA  
**Estado:** INVESTIGACIÓN EN CURSO

---

## 📋 Resumen Ejecutivo

Se ha identificado un bug crítico que permite que los datos de un usuario (específicamente el campo `username`) sean guardados incorrectamente en la cuenta de otro usuario. Este comportamiento ha sido confirmado por el usuario en múltiples dispositivos y ubicaciones geográficas diferentes.

---

## 🔍 Síntomas Observados

| # | Síntoma | Descripción |
|---|---------|-------------|
| 1 | **Username cruzado** | El username de un usuario aparece almacenado en la cuenta de otro usuario |
| 2 | **Datos no persisten** | El username y birthDate no se guardan correctamente, aparecen como `NULL` |
| 3 | **Afecta múltiples dispositivos** | El problema ocurrió incluso cuando la amiga se registró desde otro dispositivo, otra red, y otra casa |
| 4 | **Primer usuario afectado** | El usuario con ID 1 en la tabla parece ser el receptor de los datos incorrectos |

---

## 🏗️ Arquitectura del Sistema de Autenticación

### Componentes involucrados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE AUTENTICACIÓN                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENTE (Navegador)                          SERVIDOR (Next.js)          │
│  ─────────────────────                        ─────────────────────         │
│                                                                             │
│  ┌─────────────────────┐                      ┌─────────────────────┐     │
│  │ createBrowser       │                      │ createServer        │     │
│  │ SupabaseClient      │                      │ SupabaseClient      │     │
│  │ (@supabase/ssr)     │                      │ (@supabase/ssr)     │     │
│  └─────────┬───────────┘                      └─────────┬───────────┘     │
│            │                                                │               │
│            │  signUp/signIn                                 │  getUser()    │
│            │  ────────────────                              │  ─────────    │
│            ▼                                                ▼               │
│  ┌─────────────────────┐                      ┌─────────────────────┐     │
│  │ Supabase Auth       │◄────────────────────►│ Supabase Auth       │     │
│  │ (cookies)           │    cookies sync       │ (JWT validation)   │     │
│  └─────────────────────┘                      └─────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Archivos clave involucrados

| Archivo | Función |
|---------|---------|
| `lib/supabase-client.ts` | Cliente browser para autenticación cliente |
| `lib/supabase-server.ts` | Cliente servidor para autenticación en API routes |
| `middleware.ts` | Manejo de cookies en el edge |
| `app/register/page.tsx` | Página de registro |
| `app/login/page.tsx` | Página de login |
| `app/api/user/route.ts` | Endpoint GET/PATCH de usuario |

---

## 🔎 Análisis de Causas Posibles

### Hipótesis 1: Race Condition en Cookies post-registro

**Descripción:**
Cuando un usuario se registra, el código hace:

```typescript
// app/register/page.tsx
const { data, error } = await supabase.auth.signUp({...});

if (data?.user) {
  await fetch('/api/user', {
    method: 'PATCH',
    body: JSON.stringify({ username: ... })
  });
}
```

**Problema identificado:**
- `supabase.auth.signUp()` usa el cliente **browser**
- El PATCH a `/api/user` usa el cliente **servidor** (`getServerSupabaseUser`)
- Son dos clientes diferentes con contextos de cookies distintos
- El servidor puede no tener la sesión actualizada cuando recibe el PATCH

---

### Hipótesis 2: Diferencia entre getUser() y getSession()

**Descripción:**
En `lib/supabase-server.ts`:

```typescript
// Línea 46 - Usa getUser()
const { data: { user }, error } = await supabase.auth.getUser();
```

En `middleware.ts`:

```typescript
// Línea 31 - Usa getSession()
const { data: { session } } = await supabase.auth.getSession();
```

**Diferencia crítica:**

| Método | Comportamiento |
|--------|----------------|
| `getUser()` | Valida el JWT del token. Puede fallar si el token está en proceso de renovación o si las cookies no están sincronizadas |
| `getSession()` | Solo lee las cookies sin validar el JWT. Más permisivo pero menos seguro |

**Problema:** Si `getUser()` falla por cualquier razón de timing, el sistema puede caer en el fallback de service role.

---

### Hipótesis 3: Service Role Fallback con DEFAULT_USER_ID

**Descripción:**
En `lib/supabase-server.ts`:

```typescript
if (error || !user) {
  // Fallback: usar service role si está disponible
  if (supabaseServiceRoleKey) {
    return {
      user: null,
      supabase: createServiceRoleSupabaseClient(),
      isServiceRole: true,
      serviceRoleAvailable: true
    };
  }
}
```

Y en los API routes:

```typescript
if (user?.id) {
  userId = user.id;
} else if (isServiceRole && serviceRoleAvailable) {
  userId = process.env.DEFAULT_USER_ID;  // ← PROBLEMA AQUÍ
}
```

**Problema:** 
- Cuando `getUser()` falla Y hay service role key disponible, el sistema usa `DEFAULT_USER_ID`
- `DEFAULT_USER_ID` está configurado como `00000000-0000-0000-0000-000000000000` en `.env.example`
- Si este valor está configurado en producción, todas las operaciones pueden ejecutarse como el primer usuario de la base de datos

---

### Hipótesis 4: Middleware no sincroniza cookies

**Descripción:**
El middleware solo lee cookies para verificar sesión:

```typescript
// middleware.ts
const {
  data: { session },
} = await supabase.auth.getSession();

if (isProtected && !session) {
  return NextResponse.redirect(new URL('/login', req.url))
}

return res;
```

**Problema:**
- El middleware no llama a `setAll()` para actualizar cookies después de un login/registro
- Las cookies pueden quedar desincronizadas entre el cliente y el servidor
- No hay forma de forzar la actualización de cookies en el edge

---

### Hipótesis 5: IDs de usuario conflictivos

**Descripción:**
El usuario mencionó que su cuenta es el "ID 1" en la tabla.

**Posible problema:**
- Si el primer usuario creado tiene un ID específico (no UUID aleatorio)
- Y hay algún problema con cómo se generan o asignan los IDs
- Podría haber una colisión o malentendido de IDs

---

## 📊 Flujo de Datos del Registro

```
REGISTRO DE USUARIO
===================

1. Usuario completa formulario
   ├── email: "nuevo@email.com"
   ├── username: "nuevouser"
   ├── firstName: "Juan"
   ├── lastName: "Pérez"
   └── birthDate: "2000-01-01"

2. Browser: supabase.auth.signUp()
   ├── Envía datos a Supabase Auth
   ├── Supabase crea usuario en Auth
   ├── Supabase devuelve session con nuevo user.id
   └── Browser recibe cookies de sesión

3. Browser: fetch('/api/user', PATCH)
   ├── Envía request con credentials: 'include'
   ├── Request incluye cookies del browser
   └── ⚠️ PROBLEMA: Cookies pueden no estar actualizadas

4. Servidor: getServerSupabaseUser()
   ├── createServerSupabaseClient() lee cookies
   ├── supabase.auth.getUser() valida JWT
   ├── ⚠️ POSIBLE: getUser() puede fallar si cookies desincronizadas
   └── Si falla → service role fallback → DEFAULT_USER_ID

5. Servidor: prisma.user.update()
   ├── WHERE: userId = ??? (puede ser incorrecto)
   ├── UPDATE: { username: "nuevouser" }
   └── ⚠️ RESULTADO: Datos guardados en usuario wrong

```

---

## 🔧 Intento de Correcciones Previas

Se aplicaron las siguientes correcciones que NO resolvieron el problema:

| # | Corrección | Archivo | Resultado |
|---|------------|---------|-----------|
| 1 | Validación de sesión en GET/PATCH | `app/api/user/route.ts` | ❌ El problema persiste |
| 2 | Espera de 500ms antes de PATCH | `app/register/page.tsx` | ❌ El problema persiste |

---

## 🧪 Preguntas para Diagnóstico Adicional

1. **¿Cuál es el valor exacto de `DEFAULT_USER_ID` en producción?**
   - Verificar si está configurado en Vercel

2. **¿Hay logs de producción que muestren el fallback de service role?**
   - Revisar Vercel function logs

3. **¿Cuántos usuarios hay en la tabla `User` de la base de datos?**
   - Ejecutar: `SELECT id, email, username, "firstName", "lastName" FROM "User";`

4. **¿Los IDs de usuario en la DB son UUIDs o hay IDs personalizados?**
   - Verificar schema de Prisma

5. **¿Hay algún trigger o función en la base de datos que modifique usuarios?**
   - Revisar event triggers en Supabase

---

## 📝 Recomendaciones para Investigación Futura

1. **Agregar logging detallado** en `getServerSupabaseUser()` para ver exactamente qué userId se está usando en cada request

2. **Verificar configuración de Vercel** para confirmar el valor de `DEFAULT_USER_ID`

3. **Revisar Supabase Auth logs** para ver si hay errores de validación de JWT

4. **Considerar cambiar de `getUser()` a `getSession()`** en el servidor para evitar validaciones estrictas

5. **Deshabilitar el service role fallback** temporalmente para ver si el problema desaparece

---

## 📎 Archivos Relacionados

- `lib/supabase-server.ts` - Función `getServerSupabaseUser()`
- `lib/supabase-client.ts` - Cliente browser
- `middleware.ts` - Manejo de sesiones edge
- `app/register/page.tsx` - Página de registro
- `app/login/page.tsx` - Página de login
- `app/api/user/route.ts` - Endpoint de usuario
- `.env.example` - Configuración de variables

---

**Documento creado para investigación profunda del bug de cross-user data overwrite.**