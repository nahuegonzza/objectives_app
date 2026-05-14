# Auditoría Completa de Goalyx

Fecha: 2026-05-14

## 1. Alcance

Este documento es una revisión amplia y profunda de la aplicación Goalyx, con foco en:

- Arquitectura general
- Calidad de código y mantenimiento
- Tipado y seguridad
- API y backend
- UX / accesibilidad
- Performance y organización
- Funcionalidades existentes y mejoras pendientes

## 2. Resumen ejecutivo

Goalyx es una aplicación con una base sólida: Next.js App Router, Tailwind CSS, Prisma y Supabase.
Tiene una estructura modular con componentes de UI reutilizables y un sistema de módulos extensibles.

Sin embargo, el proyecto muestra varios signos de deuda técnica y áreas de mejora importantes:

- uso excesivo de `any` y validaciones débiles
- lógica de API con errores de estilo y protección inconsistente
- dependencias de `window`/`document` en componentes globales que pueden afectar SSR y accesibilidad
- modularidad funcional incompleta y falta de normalización en el manejo de estado y datos
- código de diagnóstico/depuración expuesto en producción

## 3. Fortalezas más relevantes

- Buena elección de stack: Next.js + TypeScript + Tailwind + Prisma + Supabase.
- Arquitectura modular: `modules/` con dashboard/config para cada funcionalidad.
- Uso de componentes reutilizables (`ConfirmationModal`, `InfoModal`, `Navigation`, `Goal*`, `Academic*`).
- `app/api` centraliza rutas y provee endpoints REST para usuarios, objetivos, eventos, módulos, etc.
- `lib/prisma.ts` incluye manejo de normalización de URL DB y retry en errores de conexión.
- PWA y nivel de UX ya presente: service worker, temas, exportación de datos.

## 4. Hallazgos y problemas por área

### 4.1 Arquitectura y organización

- `app/RootLayoutClient.tsx` contiene lógica de evento global muy intrusiva:
  - previene pinch zoom, doble clic y zoom con teclado
  - intercepta `wheel` en inputs numéricos
  - esta lógica puede impactar accesibilidad y usabilidad
- `next.config.js` tiene `experimental.serverActions.allowedOrigins = ["*"]`.
  - esto es innecesario y potencialmente inseguro.
- Existen archivos temporales y scripts de diagnóstico (`tmp-*`, `temp-*`, `app/api/prisma-test`)
  - recomendación: limpiar antes de producción.

### 4.2 Tipado y calidad de código

- Uso generalizado de `any` y `as any` en componentes y API.
  - Ejemplos: `app/profile/page.tsx`, `modules/academic/AcademicConfig.tsx`, `lib/modules.ts`, `app/api/user/route.ts`, `app/api/modules/route.ts`, `modules/mood/*`, `modules/sleep/*`.
- Muchos componentes usan `useState<any>` o tipos genéricos sin control.
- Hay `JSON.stringify` para detectar cambios en formularios (`AcademicConfig.tsx`). Esto funciona, pero es frágil.
- Varios componentes usan `console.log` y `console.error` directamente.
  - Ejemplo: `lib/supabase-server.ts`, `lib/prisma.ts`, `app/settings/page.tsx`, `app/api/*`, `app/login/page.tsx`.
  - Recomiendo centralizar logs y eliminar salida innecesaria en producción.

### 4.3 Seguridad y backend

- La aplicación depende de Supabase para autenticación, pero muchos endpoints aceptan payloads sin validación robusta.
  - No hay uso consistente de `zod` o validadores en los `app/api`.
- `app/api/auth/getEmailByUsername/route.ts` expone si un usuario existe o no.
  - Esto puede ser usado para enumeración de usuarios.
- `app/api/user/route.ts` y `app/api/modules/route.ts` emplean `upsert` y `prisma.user.upsert` con datos de sesión.
  - Hay controles para detectar inconsistencias de usuario, pero el enfoque es complejo y puede ser frágil.
- `lib/supabase-server.ts` guarda el `SUPABASE_ANON_KEY` en el cliente de servidor y hace logs con `console.log`.
- `app/api/modules/route.ts` realiza acciones de escritura en una petición GET.
  - Esto viola el principio de idempotencia y puede generar efectos laterales inesperados.

### 4.4 UX y accesibilidad

- Modales tienen diseño consistente, pero hay falta de manejo de foco y `aria` en varios lugares.
- `app/settings/page.tsx` usa export de blob manual con `document.createElement('a')`; funciona pero es un patrón de bajo nivel.
- Algunos controles no tienen etiquetas accesibles claras o no se asegura el foco en la apertura de modales.
- La lógica de interacción global en `RootLayoutClient.tsx` puede romper comportamientos esperados para usuarios con capacidades especiales.

### 4.5 Performance y datos

- Muchos componentes cargan datos con `fetch` en `useEffect` y no reutilizan resultados.
  - Ejemplo: `ProfilePage` hace varios `fetch` separados para usuario, stats y streak.
  - `app/settings/page.tsx` hace 5 fetches paralelos para exportación; bien, pero no hay estrategia de caché.
- `lib/modules.ts` ejecuta `fetch('/api/modules')` en librería compartida, lo que puede confundir su uso en SSR.
- No hay caché centralizada, no hay uso de SWR/React Query ni de un state manager.

### 4.6 Funcionalidad y experiencia

- La app cubre muchas funciones: objetivos, eventos académicos, módulos de sueño/agua/estado de ánimo/gimnasio, amigos y perfil.
- Falta una visión global de onboarding y gestión de módulos activos.
- La lógica social en `app/profile` se ve completa, pero el estado de carga y errores podría mejorarse.
- Algunas rutas de `api` son muy específicas y podrían ser consolidadas (por ejemplo, `moduleEntries`, `goalEntries`, `events`).

## 5. Observaciones específicas destacadas

### 5.1 `RootLayoutClient.tsx`

- Previene zoom y manipula `wheel` globalmente.
- Esto puede afectar a navegadores móviles, usuarios con baja visión y test de accesibilidad.
- Recomendación: eliminar o limitar a casos muy puntuales con controles explícitos.

### 5.2 `lib/modules.ts`

- Hacer `fetch('/api/modules')` desde una librería compartida no es ideal.
- El módulo debería ser una utilidad pura de parseo o un hook de datos, no una función `fetch` genérica.
- También se recibe y mapea con `any`.

### 5.3 `AcademicConfig.tsx`

- Depende mucho de `any` para `config`.
- Genera valores de scoring con `Number(...).toString()` y los vuelve a convertir en `Number`.
- Hay un `useEffect` que actualiza `subjects` basado en `academicModule.subjects`; esto puede causar renderizados extra.

### 5.4 `app/api/modules/route.ts`

- GET: crea/actualiza registros de módulo en cada petición.
- El endpoint debería separar claramente lectura y escritura.
- PATCH y PUT están bien estructurados, pero falta validación de payloades.

## 6. Limpieza de producción aplicada

Se aplicó una limpieza puntual para preparar el proyecto para producción sin cambiar la lógica de negocio.

- Eliminación de todos los `console.log`, `console.error`, `console.warn` y `console.info` usados como salida de depuración en el código de producción.
- Eliminación de archivos temporales y de diagnóstico en la raíz del repositorio:
  - `tmp-prisma-test2.js`
  - `tmp-index-check.js`
  - `tmp-db-inspect.js`
  - `tmp-db-inspect-js.js`
  - `tmp-db-columns.sql`
  - `tmp-create-supabase-user.js`
  - `temp-upsert-test.js`
  - `temp-test-api.js`
  - `temp-check-modules.js`
  - `temp-activate-modules.js`

- Eliminación de imports y declaraciones sin uso en las siguientes áreas clave:
  - `app/api/rules/route.ts`
  - `app/api/user/blocks/route.ts`
  - `app/settings/modules/page.tsx`
  - `app/settings/page.tsx`
  - `components/CalendarExplorer2.tsx`
  - `components/ModuleTile.tsx`
  - `components/GoalManager.tsx`
  - `components/GoalTracker.tsx`
  - `components/HistoryViewer.tsx`

> Nota: la limpieza se centró en la eliminación de trazas de depuración y imports sin uso. Quedan advertencias separadas de React Hooks y reglas de Next.js que requerirán revisión futura.

### 5.5 `app/api/auth/getEmailByUsername/route.ts`

- Permite saber si existe un usuario y su email indirectamente.
- Mejora de seguridad: no devolver diferencias de comparación de usuario o agregar lentitud constante para prevenir enumeración.

### 5.6 Tipado de `ModuleDefinition`

- `HistoryComponent?: React.ComponentType<{ date: string; data: any }>;`
- `any` aquí indica que la extensión de módulos no está fuertemente tipada.
- Se puede mejorar con tipos genéricos que sean más seguros.

### 5.7 `app/settings/page.tsx`

- Tiene muchos `console.log` de debug.
- Usa `alert` en algunas ramas; ya está corregido parcialmente, pero conviene revisar toda la app para evitar mensajes nativos en producción.

### 5.8 Dependencias y limpieza

- Hay muchos scripts temporales (`tmp-*.js`, `temp-*.js`) en la raíz.
- Recomiendo mantener solo los necesarios y mover pruebas a `scripts/` con nombres claros.
- `package.json` no tiene `typescript` lint step ni tests.

## 6. Recomendaciones de mejora

### 6.1 Código y tipado

1. Eliminar `any` e introducir tipos firmes.
   - `app/profile/page.tsx`, `modules/academic/AcademicConfig.tsx`, `app/api/*`, `lib/modules.ts`.
2. Usar validación con `zod` en todos los endpoints API.
3. Agregar esquemas de request/response e incluso clientes API con tipos.
4. Eliminar o limitar logs en producción.
5. Usar `eslint` con reglas más agresivas en `no-explicit-any`, `consistent-return`, `no-console` y `@typescript-eslint/no-unsafe-assignment`.

### 6.2 Arquitectura y datos

1. Centralizar fetches en hooks o servicios reutilizables.
   - Ejemplo: `useUser`, `useModules`, `useProfileStats`.
2. Evaluar React Query o SWR para caché, revalidaciones y fallos.
3. Separar lectura de escritura en APIs y evitar side-effects en GET.
4. Normalizar datos devueltos por el backend para evitar checks `data?.x || 0` en UI.

### 6.3 Seguridad y autenticación

1. Revisar endpoints expuestos sin protección fina.
2. Evitar devolver si un usuario existe por username/email desde front-end.
3. Usar service role solamente en backend seguro, no en rutas de cliente.
4. Revisar `next.config.js` y eliminar `allowedOrigins: ['*']` si no es necesario.
5. Auditar `app/api/*` para verificar que `userId` siempre se derive de la sesión y no del payload.

### 6.4 UX / accesibilidad

1. Añadir `aria` en modales y manejo de foco.
2. Evitar lógica global que bloquea gestos nativos del navegador.
3. Añadir estados de carga y errores consistentes.
4. Revisar contraste y texto alternativo en iconos.
5. Asegurar que los modales sean accesibles con teclado.

### 6.5 Performance y limpieza

1. Remover archivos temporales y rutas de debug no necesarias.
2. Agregar pruebas unitarias y de integración.
3. Evaluar bundle analyzer si la app crece.
4. Usar `next build` en CI y revisar advertencias.
5. Eliminar dependencias no usadas.

## 7. Mejora funcional sugerida

- Implementar un onboarding de módulos con selección de módulos activos.
- Sistema de estado global ligero para evitar fetch duplicados.
- Dashboard central de métricas con score histórico.
- Mejorar la navegación entre módulos y perfil social.
- Añadir validación de formularios consistente en todos los forms.

## 8. Prioridades recomendadas

### Crítico

- Eliminar efectos laterales en GET de API.
- Corregir uso inseguro de `getEmailByUsername`.
- Limpiar `next.config.js` y evitar `allowedOrigins: ['*']`.
- Reducir `any` y añadir validación de request/responses.

### Importante

- Revisar la lógica de `RootLayoutClient.tsx` por accesibilidad.
- Consolidar fetches en hooks/servicios.
- Normalizar el manejo de errores UI.

### Recomendado

- Añadir pruebas automatizadas.
- Limpiar scripts y archivos temporales.
- Mejorar la documentación de módulos y APIs.

---

### Nota final

La app ya cuenta con una base funcional interesante, pero hoy depende demasiado de patrones improvisados y tipado laxo.
Con un esfuerzo de refactor moderado se puede convertir en una plataforma más robusta, segura y mantenible.

