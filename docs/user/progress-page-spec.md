# Especificación: Página de progreso por ejercicio

## Objetivo

La página de progreso permite consultar la evolución histórica de un ejercicio concreto a lo largo del tiempo.

Se accede desde la pantalla principal tocando el nombre del ejercicio dentro de la rutina actual.

---

## Acceso y navegación

### Entrada desde la principal

- Cada ejercicio loggable en la rutina tiene su nombre como link hacia su página de progreso.
- El link conserva:
  - la rutina desde la que se salió (`routineId`)
  - el slot visual del ejercicio dentro de la rutina (`slotId`)

### Volver

- El botón `Volver` regresa a la pantalla principal.
- Al volver:
  - se restaura la rutina desde la que se abrió la página de progreso
  - se hace scroll automático hasta el ejercicio desde el que se salió

Esto evita volver a la rutina recomendada o perder la posición dentro de la pantalla principal.

---

## Estructura de la página

La página muestra:

1. Cabecera
   - botón `Volver`

2. Tarjeta principal del ejercicio
   - nombre del ejercicio
   - tipo de seguimiento
   - contexto rápido:
     - cantidad de sesiones
     - fecha del último registro
   - selectores de métrica
   - selectores de rango

3. Tarjeta de gráfico
   - gráfico histórico por sesión
   - detalle del punto seleccionado debajo del gráfico

4. Tarjeta de resumen
   - último valor
   - récord
   - última mejora
   - sin mejorar
   - estado de tendencia

5. Tarjeta de historial
   - lista de sesiones visibles en el rango elegido
   - resumen de series por sesión
   - nota, si existe

---

## Métricas disponibles por tipo de ejercicio

### Ejercicios con peso

- `Carga máxima`
- `Volumen`

Nota:
- el volumen se estima usando las repeticiones objetivo configuradas en el ejercicio
- no usa reps reales, porque hoy ese dato no se guarda para ejercicios con peso

### Ejercicios por repeticiones

- `Mejor serie`
- `Reps totales`

### Ejercicios por tiempo

- `Mayor tiempo`
- `Tiempo total`

---

## Gráfico

### Qué representa

- Cada punto representa una sesión.
- El valor del punto depende de la métrica seleccionada.
- El rango visible depende del filtro activo:
  - `3 m`
  - `6 m`
  - `1 año`
  - `Todo`

### Interacción

- Los puntos son seleccionables.
- Al tocar un punto, se actualiza la caja de detalle debajo del gráfico.

### Caja de detalle bajo el gráfico

Muestra:

- fecha de la sesión seleccionada
- rutina en la que ocurrió
- valor de la métrica activa
- nombre de la métrica activa
- resumen de series registradas en esa sesión

---

## Resumen

La tarjeta de resumen muestra estas cajas, en este orden:

1. `Último valor`
2. `Récord`
3. `Última mejora`
4. `Sin mejorar`
5. `Tendencia`

### Significado

- `Último valor`: valor más reciente de la métrica seleccionada
- `Récord`: mejor valor histórico de la métrica seleccionada
- `Última mejora`: última sesión que marcó un nuevo récord en esa métrica
- `Sin mejorar`: cantidad de sesiones transcurridas desde la última mejora
- `Tendencia`: estado comparativo del rendimiento reciente

---

## Comportamiento según cantidad de sesiones

### 0 sesiones

Se muestra un estado vacío:

- no se muestra tendencia
- no se muestra gráfico
- no se muestra resumen
- no se muestra historial

Mensaje:

- `Aún no hay suficientes datos para este ejercicio.`
- `Guardá más sesiones para ver la evolución de su progreso.`

### 1 a 5 sesiones

Se habilita la página de progreso básica:

- sí se muestran métricas
- sí se muestra rango
- sí se muestra gráfico
- sí se muestra resumen
- sí se muestra historial
- no se muestra badge de tendencia

Además, en el resumen aparece el texto:

- `Falta 1 sesión para ver la tendencia.`
- `Faltan X sesiones para ver la tendencia.`

### 6 sesiones o más

Se habilita la página completa:

- sí se muestra todo lo anterior
- sí se muestra la tendencia dentro del resumen

La tendencia puede ser:

- `Subiendo`
- `Estable`
- `Bajando`

---

## Regla de tendencia

La tendencia solo aparece desde la sesión 6 porque compara dos ventanas:

- promedio de las últimas 3 sesiones
- contra el promedio de las 3 anteriores

Reglas:

- `Subiendo`: si el promedio reciente sube al menos 5%
- `Bajando`: si baja al menos 5%
- `Estable`: en el resto de los casos

Con menos de 6 sesiones no se muestra tendencia.

---

## Historial

La tarjeta de historial:

- respeta el rango seleccionado
- lista las sesiones de más nueva a más vieja
- muestra la rutina de cada registro
- muestra el resumen de series guardadas
- muestra la nota si la sesión tenía una

Si no hay sesiones dentro del rango elegido:

- `No hay sesiones en el rango seleccionado.`

---

## Criterios UX actuales

- La página es mobile-first.
- No se diseñó una variante específica para desktop.
- El objetivo es permitir consulta rápida del ejercicio sin perder contexto al volver.
- La navegación de ida y vuelta preserva la rutina y el punto de origen.
