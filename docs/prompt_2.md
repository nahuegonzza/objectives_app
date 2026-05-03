La aplicación ya está creada, funcionando con Next.js, Prisma y PostgreSQL.

Actualmente existe un sistema basado en "eventos" manuales, pero quiero cambiar completamente la lógica a un sistema centrado en objetivos interactivos.

NO quiero eliminar todo el proyecto, sino refactorizar la lógica existente.

## 🧠 NUEVO CONCEPTO

El sistema debe dejar de depender de eventos manuales y pasar a funcionar así:

* El usuario crea OBJETIVOS
* El usuario interactúa directamente con esos objetivos cada día
* El sistema calcula puntos en base a esa interacción


## 🎯 OBJETIVOS

Un objetivo debe tener:

* name (string)
* description (string)
* type:

  * "boolean" → (sí / no)
  * "numeric" → (valor numérico)
* pointsConfig:

  * para boolean:

    * pointsIfTrue
    * pointsIfFalse (opcional)
  * para numeric:

    * pointsPerUnit

## 📅 REGISTRO DIARIO

Crear una nueva entidad:

GoalEntry:

* id
* goalId
* date (día)
* value:

  * boolean o number según el tipo de objetivo

Cada día debe existir como máximo una entrada por objetivo.

## ⚙️ CÁLCULO DE SCORE

Reemplazar la lógica actual de eventos por:

* recorrer todos los GoalEntry del día
* calcular puntos según su Goal asociado
* sumar todos los puntos

Eliminar dependencia de "event.value".

## 📊 FUNCIONALIDAD NUEVA

Implementar:

1. Vista diaria:

   * lista de objetivos
   * input para interactuar con cada uno:

     * checkbox (boolean)
     * input numérico (numeric)

2. Score diario automático

3. Historial:

   * lista de días anteriores
   * mostrar:

     * score del día
     * valores de cada objetivo

4. Comparaciones:

   * score día anterior
   * score semana anterior
   * score mes anterior

(No hace falta gráficos, solo datos)

## 🧱 BASE DE DATOS

Modificar schema.prisma:

* actualizar modelo Goal
* agregar modelo GoalEntry
* eliminar o dejar de usar Event si es necesario

## 🎨 UI

* reemplazar "Registrar evento" por interacción directa con objetivos
* cada objetivo debe ser editable y eliminable
* inputs dinámicos según tipo

## ⚠️ IMPORTANTE

* mantener estructura modular
* no usar lógica hardcodeada
* código limpio y tipado
* reutilizar lo existente cuando sea posible

## 🚀 OUTPUT

Generar:

* cambios en Prisma schema
* nuevas funciones de cálculo de score
* endpoints API actualizados
* componentes UI para interactuar con objetivos
* lógica de historial y comparaciones

No simplificar demasiado. Quiero una base sólida para seguir escalando.
