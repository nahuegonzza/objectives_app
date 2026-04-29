# Plan de Implementación: Módulo de Gestión Universitaria

## Objetivo
Crear un módulo nuevo llamado **Gestión Universitaria** que permita:
- Gestionar materias.
- Registrar exámenes y tareas.
- Mostrar lo programado para hoy en el Daily View.
- Integrarse con el sistema de puntaje global de la app.
- Exponer eventos para el calendario.

## Alcance
El módulo se implementará siguiendo la arquitectura de módulos existente en `modules/` y `types/`.
El objetivo es que el módulo sea:
- compatible con el sistema de módulos actual,
- configurable desde la UI de Settings,
- persistente en la base de datos,
- visualmente consistente con el resto de la app.

## Cambios Recientes (Separación de Configuración)

### Modificación de la UX
Se ha separado la configuración del dashboard principal para mejorar la experiencia de usuario:

- **Dashboard Principal** (`AcademicDashboard.tsx`): Ahora solo muestra eventos de hoy y próximos eventos, con un botón "Configurar" que lleva a una página dedicada.
- **Página de Configuración** (`app/academic/config/page.tsx`): Nueva página dedicada que contiene toda la lógica de configuración de materias y creación de eventos.

### Beneficios de la separación:
- Dashboard más limpio y enfocado en la información diaria
- Configuración más espaciosa y organizada
- Mejor navegación y experiencia de usuario
- Mayor facilidad para agregar funcionalidades futuras

## Qué se va a hacer
1. ✅ Crear el módulo académico en `modules/academic/`.
2. ✅ Definir la entidad y la configuración base.
3. ✅ Añadir `Component`, `ConfigComponent` y `DashboardComponent` si hace falta.
4. ✅ Extender el módulo para exponer:
   - materias
   - exámenes
   - tareas
5. ✅ Implementar función `getAcademicEventsForCalendar`.
6. ✅ Garantizar que los checks de "completado" disparen la lógica de score.
7. ✅ Integrar el nuevo módulo en `modules/index.ts`.
8. ✅ Separar configuración en página dedicada con navegación desde dashboard.

## Estructura de archivos propuesta

- `modules/academic/module.ts`
  - definición del módulo con `slug`, `name`, `description`, `defaultConfig`, `calculateScore` y export de helpers.
- `modules/academic/AcademicDashboard.tsx`
  - vista principal que carga `moduleEntries` del día y muestra tarjetas (solo eventos de hoy/próximos).
- `modules/academic/AcademicConfig.tsx`
  - pantalla de configuración de materias y colores (usada en página de configuración).
- `modules/academic/AcademicEventForm.tsx`
  - formulario para crear exámenes o tareas (usado en página de configuración).
- `modules/academic/AcademicTodayCard.tsx`
  - tarjeta compacta para Home / Daily View.
- `modules/academic/academicHelpers.ts`
  - utilidades para parsing, fecha y transformación de events.
- `app/academic/config/page.tsx`
  - página dedicada para configuración completa del módulo académico.

## Datos y persistencia

## Estructura de archivos propuesta

- `modules/academic/module.ts`
  - definición del módulo con `slug`, `name`, `description`, `defaultConfig`, `calculateScore` y export de helpers.
- `modules/academic/AcademicDashboard.tsx`
  - vista principal que carga `moduleEntries` del día y muestra tarjetas.
- `modules/academic/AcademicConfig.tsx`
  - pantalla de configuración de materias y colores.
- `modules/academic/AcademicEventForm.tsx`
  - formulario para crear exámenes o tareas.
- `modules/academic/AcademicTodayCard.tsx`
  - tarjeta compacta para Home / Daily View.
- `modules/academic/academicHelpers.ts`
  - utilidades para parsing, fecha y transformación de events.

## Datos y persistencia

### Modelo lógico en el módulo
El módulo usará la entidad `ModuleEntry` existente. Dentro del campo `data` se guardará JSON con estas formas:

- Materia:
  - `id`
  - `nombre`
  - `color_identificador`
  - `cuatrimestre`

- Examen:
  - `id`
  - `materiaId`
  - `fecha`
  - `descripción`
  - `completado`
  - `tipo` = `parcial | final | recuperatorio`

- Tarea:
  - `id`
  - `materiaId`
  - `fechaEntrega`
  - `descripción`
  - `completado`
  - `prioridad` = `alta | media | baja`

### Configuración del módulo
Variables configurables que se pueden exponer en UI:
- `defaultSubjectColors`
- `maxSubjects` o `allowSubjectCustomColor`
- `todayVisibilityMode` = `solo_hoy | mostrar_proximos`
- `completionScore` = puntos por examen/tarea completada
- `priorityScoreMap`

## Integración con el sistema de módulos

### `modules/index.ts`
Agregar export e incluir `academicModule` en `moduleDefinitions`.

### `ModuleDefinition`
El módulo tendrá:
- `calculateScore(entries, config, targetDate)` para sumar puntos.
- `DashboardComponent` para la pantalla principal de módulos.
- `ConfigComponent` para la edición de materias y colores.

### `ModuleTracker.tsx`
No requiere cambios estructurales mientras el módulo tenga `Component`.

### `app/settings/page.tsx`
Puede cargar la configuración del módulo usando la API existente y dejar que el backend guarde `config` dentro del módulo activo.

## UI y experiencia

### AcademicConfig
Un panel claro y pulido que permita:
- Crear / editar materias.
- Elegir color de identificación.
- Definir cuatrimestre.
- Opcional: valores de puntaje por tipo.

### EventForm
Un único formulario con:
- selector de `Materia`
- campo `Tipo`: `Examen` o `Tarea`
- fecha
- descripción
- prioridad o tipo de examen
- checkbox `Completado`

### SmartCard
Tarjetas compactas para el Home con diseño consistente:
- icono `Libro` para materia
- icono `Alerta` para examen
- icono `Checklist` para tarea
- mensaje estilo:
  - "Hoy tenés parcial de [Materia]"
  - "Entrega de [Tarea]"
- checkbox que activa la acción de completar y actualiza score.

## Calendario

### `getAcademicEventsForCalendar`
Función que transforme los datos del módulo en objetos con:
- `title`
- `start`
- `end`
- `color`
- `iconType` o `type`

El calendario debe diferenciar por:
- color de materia
- icono de examen vs tarea

## Lógica adicional y mejoras creativas

### Ideas extra que mejoran la conexión
- Guardar materias y eventos en datos estructurados dentro de `ModuleEntry` para no depender de múltiples APIs.
- Ofrecer filtros rápidos: `Hoy`, `Próximas 7 días`, `Completadas`.
- Soporte opcional de `recordatorios` o `notificaciones` en UI.
- Añadir una mini-sección en el dashboard con resumen de `materias activas` y `exámenes próximos`.
- Mapear prioridades a colores / badges para que la tarjeta sea más clara.

### Consistencia visual
- Usar `border-2`, esquinas `rounded-2xl` o `rounded-xl` según el estilo general.
- Mantener fuentes y estados de color similares a los componentes existentes.
- Usar SVG inline para iconos simples y escalables.
- Apoyarse en los estilos globales de Tailwind que ya están en la app.

## Qué se debe revisar después
1. Validar que `app/settings/page.tsx` soporte la configuración de este módulo.
2. Verificar la carga de `moduleDefinitions` y que el nuevo `slug` no choque.
3. Confirmar que `ModuleTracker` muestra el componente del módulo.
4. Probar `GET /api/moduleEntries?moduleId=<id>&date=<hoy>` para los eventos.
5. Asegurar persistencia en la tabla `ModuleEntry`.

## Resultado esperado
Al terminar, la app tendrá:
- un módulo académico configurado como cualquier otro módulo,
- una UI de configuración de materias,
- un formulario de tareas/exámenes,
- tarjetas diarias para lo que ocurre hoy,
- eventos listos para el calendario,
- y la lógica de score integrada en el cálculo global.

---

_Fecha de creación: 2026-04-29_
