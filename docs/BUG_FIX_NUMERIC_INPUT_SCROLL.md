# BUG FIX: Prevención de scroll accidental en inputs numéricos

## Contexto

Al usar la página, al posicionarse sobre un campo de tipo `number` y desplazar el wheel del mouse, el valor del input cambia y la página también hace scroll. Esto produce:

- cambios accidentales en valores numéricos
- scroll no deseado de la página
- mala experiencia de uso en formularios con campos numéricos

## Diagnóstico

El problema es funcional y global, porque el comportamiento nativo del navegador en `input[type="number"]` responde al wheel event con incremento/decremento. Si además la página puede desplazarse, el mismo gesto afecta tanto al valor como al scroll.

## Solución aplicada

Se añadió una escucha global en `app/RootLayoutClient.tsx` que intercepta el evento `wheel` en fase de captura y evita el comportamiento por defecto cuando el objetivo o un elemento ancestro es un `input[type="number"]`.

### Resultado

- El scroll del mouse sobre inputs numéricos ya no desplaza la página.
- Tampoco se incrementa o decrementa el valor accidentalmente.
- El resto de la página sigue permitiendo scroll normal.

## Archivos modificados

- `app/RootLayoutClient.tsx`

## Consideraciones

- La corrección se aplica a todos los inputs nativos de tipo `number`.
- Si existieran componentes personalizados que usen otro tipo de input numérico, puede requerir una segunda revisión.
- La escucha se registra con `{ passive: false, capture: true }` para asegurar que `preventDefault()` funcione correctamente.
