Quiero implementar un sistema completo de autenticación y manejo de usuarios en la aplicación actual (Next.js + Prisma + PostgreSQL), que ya está funcionando correctamente a nivel funcional.

⚠️ IMPORTANTE:

* Podés tomarte todo el tiempo necesario
* Analizá el proyecto completo antes de implementar
* Verificá errores constantemente
* Tenés libertad total para modificar cualquier archivo necesario
* NO quiero soluciones improvisadas o inseguras
* Quiero una base sólida, escalable y segura

---

# 🧠 OBJETIVO

Convertir la app en un sistema multiusuario donde:

* cada usuario tenga su cuenta
* todos los datos estén vinculados a ese usuario
* se pueda acceder desde distintos dispositivos
* las sesiones sean persistentes

---

# 🔐 AUTENTICACIÓN

Implementar usando:

* Supabase Auth
* Prisma Adapter

## FUNCIONALIDAD:

1. Registro de usuario:

   * email
   * contraseña (hasheada con bcrypt)
   * validaciones básicas

2. Login:

   * email + contraseña
   * manejo de errores

3. Sesión:

   * persistente
   * accesible desde frontend y backend

4. Logout

---

# 📧 VERIFICACIÓN DE EMAIL (SI ES POSIBLE)

Implementar:

* envío de código o link de verificación
* campo "emailVerified"
* impedir login si no está verificado (opcional)

Si es complejo, dejar preparado para agregar después.

---

# 🗄️ BASE DE DATOS

Modificar schema.prisma:

Agregar:

User:

* id
* email (unique)
* password
* createdAt
* updatedAt
* emailVerified (nullable)

Actualizar TODOS los modelos existentes:

* Goal
* GoalEntry
* cualquier otro

Para que tengan:

* userId
* relación con User

---

# 🔒 SEGURIDAD

* hashear contraseñas con bcrypt
* no devolver passwords nunca
* validar inputs
* proteger endpoints

---

# 🔐 PROTECCIÓN DE RUTAS

* si no hay sesión → redirigir a login
* proteger:

  * dashboard
  * objetivos
  * analytics
  * calendario

---

# 🧠 BACKEND

Actualizar TODAS las queries:

* filtrar SIEMPRE por userId
* evitar acceso a datos de otros usuarios

---

# 🎨 FRONTEND

Crear vistas nuevas:

## 1. Login

* email
* contraseña
* botón login
* link a registro

## 2. Registro

* email
* contraseña
* confirmar contraseña

## 3. Estado de sesión

* mostrar usuario logueado
* botón logout

---

# ⚙️ UX IMPORTANTE

* manejo de errores claro:

  * usuario no existe
  * contraseña incorrecta
* loading states
* feedback visual

---

# 🧱 MIGRACIÓN DE DATOS

IMPORTANTE:

* si existen datos actuales:

  * asignarlos a un usuario por defecto
    o
  * limpiar DB si es necesario

---

# 📦 OUTPUT ESPERADO

Quiero:

* sistema completo de auth funcionando
* usuarios persistentes
* datos vinculados a usuario
* rutas protegidas
* UI de login/registro
* seguridad básica correcta
* código limpio y escalable

---

⚠️ PRIORIDAD:

1. seguridad
2. consistencia de datos
3. correcta asociación userId
4. estabilidad

No simplificar autenticación.
No hardcodear usuarios.

Si hace falta refactorizar estructura, hacerlo.
