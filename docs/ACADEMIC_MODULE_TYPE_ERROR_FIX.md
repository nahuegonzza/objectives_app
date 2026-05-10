# Corrección de Error de Tipos en Módulo Académico

## Fecha: $(date +%Y-%m-%d)

## Problema Identificado
Error de TypeScript en `modules/academic/useAcademicModule.ts` línea 205:
```
Type error: Argument of type '(ModuleEntry | { data: { subjects: AcademicSubject[]; events: AcademicEvent[]; }; id: string; userId: string; moduleId: string; date: string; createdAt: string; updatedAt: string; module: ModuleState; })[]' is not assignable to parameter of type 'SetStateAction<ModuleEntry[]>'.
```

## Análisis del Problema
En las actualizaciones optimistas del módulo académico, el código estaba asignando un objeto `{ subjects: ..., events: ... }` a la propiedad `data` de `ModuleEntry`, pero según la interfaz `ModuleEntry`, `data` debe ser de tipo `string`.

La interfaz `ModuleEntry` define:
```typescript
export interface ModuleEntry {
  id: string;
  userId: string;
  moduleId: string;
  date: string;
  data: string;  // ← Debe ser string
  createdAt: string;
  updatedAt: string;
  module: ModuleState;
}
```

Sin embargo, el código de actualización optimista estaba haciendo:
```typescript
data: { subjects: existingData.subjects, events: updatedEvents }
```

## Solución Implementada
Se cambió la asignación para serializar los datos a JSON string usando `JSON.stringify()`:

```typescript
// Antes (incorrecto):
data: { subjects: existingData.subjects, events: updatedEvents }

// Después (correcto):
data: JSON.stringify({ subjects: existingData.subjects, events: updatedEvents })
```

Esto mantiene la consistencia con cómo se almacenan los datos en la base de datos (como string JSON) y con la interfaz `ModuleEntry`.

## Archivos Modificados
- `modules/academic/useAcademicModule.ts` (línea 203-205)

## Ubicación del Cambio
En la función `toggleEventCompleted`, dentro del bloque de actualización optimista:

```typescript
const updatedEntries = allEntries.map(entry =>
  entry.date.slice(0, 10) === entryDate
    ? { ...entry, data: JSON.stringify({ subjects: existingData.subjects, events: updatedEvents }) }
    : entry
);
```

## Verificación
- ✅ `npm run build` pasa exitosamente
- ✅ `npm run lint` pasa exitosamente
- ✅ Las actualizaciones optimistas del módulo académico funcionan correctamente
- ✅ Los tipos TypeScript son consistentes</content>
<parameter name="filePath">c:\Users\Operador\Documents\Programación\goalyx\docs\ACADEMIC_MODULE_TYPE_ERROR_FIX.md