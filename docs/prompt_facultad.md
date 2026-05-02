# Prompt: Implementación de Módulo de Gestión Académica

## Contexto del Proyecto
Estoy desarrollando una aplicación de gestión de objetivos en **React** con **Tailwind CSS**. La app ya cuenta con un sistema de "Módulos" que interactúan con un puntaje global y una vista de inicio. Necesito crear un nuevo módulo llamado **"Gestión Universitaria"**.

## Objetivo del Módulo
Permitir el seguimiento integral de materias, exámenes (parciales) y tareas, integrándose con el dashboard principal y un calendario.

## Especificaciones Técnicas de los Datos

### 1. Entidades
Necesito definir tres tipos de objetos principales:
- **Materia:** (id, nombre, color_identificador, cuatrimestre).
- **Examen:** (id, materia_id, fecha, descripción, completado: boolean, tipo: 'parcial' | 'final' | 'recuperatorio').
- **Tarea:** (id, materia_id, fecha_entrega, descripción, completado: boolean, prioridad: 'alta' | 'media' | 'baja').

### 2. Lógica de Interacción
- **Visibilidad en Inicio:** Los exámenes y tareas solo deben aparecer en el componente `DailyView` (Inicio) si `fecha === hoy`. 
- **Sistema de Check:** Al marcar un examen o tarea como "completado", debe disparar la función `updateGlobalScore()` que ya existe en mi contexto de objetivos.
- **Vista de Calendario:** El módulo debe exportar una función o componente que mapee estos eventos al componente de calendario existente, diferenciando visualmente (por color de materia o icono) si es examen o tarea.

## Tareas a Realizar por Copilot

### A. Estructura de Estado
Crea el hook `useAcademicModule` o el slice de estado necesario para manejar el CRUD de materias, tareas y exámenes.

### B. Componentes de UI (Tailwind CSS)
1. **AcademicConfig:** Un panel dentro de "Módulos" para añadir/editar materias y asignarles un color.
2. **EventForm:** Un formulario único para añadir Exámenes o Tareas vinculados a una materia.
3. **SmartCard (Inicio):** Un componente de tarjeta simplificado para la Home que muestre: "Hoy tenés parcial de [Materia]" o "Entrega de [Tarea]" con un checkbox de alta fidelidad.

### C. Integración de Calendario
Genera una función `getAcademicEventsForCalendar` que transforme los datos del módulo en un formato compatible con una librería de calendario estándar (por ejemplo, objetos con `title`, `start`, `end`, y `color`).

## Requerimientos Estéticos
- Mantener consistencia visual con el resto de la app (bordes definidos, escalabilidad de iconos).
- Uso de **SVG** para iconos de "Libro" (materias), "Alerta" (exámenes) y "Checklist" (tareas).
- Los bordes deben ser consistentes (ej. `border-2`) para que no se pierda claridad en tamaños pequeños.

---

**Nota:** Por favor, escribe el código utilizando **TypeScript** y asegúrate de que la lógica de "completado" sea persistente.