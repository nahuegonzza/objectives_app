Quiero que finalices y asegures completamente la implementación de weekDays en los objetivos. La funcionalidad ya está hecha, pero necesito que la dejes robusta, consistente y libre de edge cases.

Contexto
Ya se agregó weekDays al schema de Prisma
Se implementó en:
GoalForm (crear/editar)
API /api/goals
GoalTracker
CalendarExplorer
goalHelpers.ts
La lógica es:
Si tiene días asignados → solo aparece esos días
Si NO tiene días → aparece todos los días
Problemas potenciales a corregir
1. Normalización de datos

Asegurá que weekDays:

Nunca sea null → debe ser siempre []
Tenga un formato único en todo el proyecto (ej: ["D","L","M","X","J","V","S"])
No mezcle formatos (strings vs números vs enums)
2. Backend (Prisma / API)
En create y update:
Si weekDays no viene → guardar []
Validar que Prisma no guarde null
Si hay datos existentes en la DB con null:
Normalizarlos automáticamente a [] (puede ser en runtime o migración simple)
3. Frontend (GoalForm)
En edición:
Cargar correctamente los días ya guardados
Evitar que:
Se pierdan los días al editar
Se resetee el estado
Asegurar que el estado inicial esté sincronizado con el backend
4. Lógica de filtrado (MUY IMPORTANTE)

Centralizar en goalHelpers.ts una función clara tipo:

isGoalActiveOnDate(goal, date)

Debe cumplir:

Si weekDays.length === 0 → return true
Si tiene días → verificar contra el día de la fecha
Usar un único sistema de mapeo de días (ej: getDay() → ["D","L","M","X","J","V","S"])

Evitar lógica duplicada en:

GoalTracker
CalendarExplorer
5. Consistencia global
Eliminar cualquier lógica duplicada de filtrado
Asegurar que TODO use la misma función helper
Revisar que no haya:
comparaciones incorrectas
off-by-one en días (domingo vs lunes inicio)
6. Test lógico (importante)

Validar estos casos:

Objetivo sin días → aparece siempre
Objetivo con días específicos → solo esos días
Edición mantiene días correctamente
Objetivos viejos siguen funcionando
Calendar y Home muestran lo mismo
Restricciones
NO agregues nuevas features
NO simplifiques lógica rompiendo casos existentes
NO desactives warnings sin entenderlos
Enfocate en consistencia, datos y lógica
Objetivo final

Dejar la funcionalidad de weekDays:

Predecible
Consistente
Sin bugs ocultos
Fácil de mantener

Si detectás inconsistencias, corregilas directamente.