# Handoff: Rediseño de GymApp (móvil)

## Overview
Rediseño de las pantallas principales de **GymApp** (app de seguimiento de entrenamiento, Next.js + Tailwind + shadcn/ui). El objetivo fue resolver dos problemas del diseño actual — “luce anticuado” y fricción de uso en móvil — **sin cambiar la paleta ni la tipografía base**, unificando el lenguaje visual (hoy mezcla neobrutalismo + glass), reduciendo el exceso de “cajas”, y adaptando el registro al flujo real de circuito por serie.

Cubre 6 vistas + un mini design system:
1. **Registro de sesión** (pantalla principal)
2. **Menú del ejercicio** (bottom sheet)
3. **Historial de sesiones**
4. **Asistencia del mes**
5. **Progreso por ejercicio**
6. **Progreso general + análisis del agente (Insights)**

## About the Design Files
Los archivos de este bundle son **referencias de diseño creadas en HTML/CSS** — prototipos que muestran la apariencia e interacción buscadas, **no código para copiar tal cual**. La tarea es **recrear estos diseños en el codebase real de GymApp** usando su stack y patrones existentes (Next.js App Router, React, Tailwind, shadcn/ui, lucide-react). Los nombres de datos, rutas y lógica citados abajo corresponden al código actual del repo para que el mapeo sea directo.

- `Revisión GymApp.dc.html` — prototipo interactivo con las 6 pantallas (turno **2a**), el design system (**3a**) y la revisión original (**1a**). Abrir en navegador. Requiere `support.js` al lado.
- `screens/*.png` — captura de cada pantalla y del design system.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados, radios y estados son finales. Recrear pixel-cercano usando los componentes existentes del codebase (Card, Button, Badge, etc.), re-tematizados con los tokens de abajo. Donde el prototipo use HTML plano (ej. sheet, gráficos), mapear al equivalente del stack (Radix Dialog/Drawer para el sheet, el mismo SVG chart que ya existe).

---

## Design Tokens

Todo deriva de la paleta original; el único cambio cromático es **bajar el chroma del acento verde** y **reservarlo para estado/progreso** (no como relleno decorativo).

### Color
| Token | Valor | Uso |
|---|---|---|
| Fondo app | `#fbfbf9` | fondo de pantalla |
| Superficie / card | `#ffffff` | tarjetas, inputs, sheet |
| Relleno muted | `#f2f2ee` | celdas de día apagadas, timer bg |
| Texto | `oklch(0.18 0.02 260)` | títulos y valores |
| Texto suave | `oklch(0.48 0.02 260)` | metadatos, labels, íconos inactivos |
| Línea / hairline | `oklch(0.9 0.006 90)` | bordes 1px de contenedores |
| Acento | `oklch(0.7 0.13 145)` | estado activo, confirmado, progreso, botón primario |
| Acento suave | `color-mix(in oklch, acento 15%, #fff)` | fondos de nota previa, serie en curso, chips ✓ |
| Acento texto | `oklch(0.3 0.07 145)` | texto sobre acento suave |
| Warning (insight) | fondo `oklch(0.94 0.05 40)` / ícono `oklch(0.5 0.16 40)` | bullet tipo “warning” |
| Líneas de gráfico general | acento + `oklch(0.6 0.02 260)`, `oklch(0.7 0.13 60)` … | series múltiples (mapear a `--chart-1..5` existentes) |

> Nota: el header actual hardcodea `slate-950/500` y `bg-white/80`; en el rediseño debe usar los tokens para que funcione en modo oscuro.

### Tipografía — Space Grotesk (400/500/600/700); mono: Space Mono
| Rol | Tamaño / peso | Notas |
|---|---|---|
| H1 título de pantalla | 24px / 700 / letter-spacing −2% | caja normal (no mayúsculas) |
| Nombre de ejercicio / card title | 14–16px / 700 | |
| Body / meta | 12.5–13.5px / 400–600 | objetivos, fechas, descripciones (texto suave) |
| Micro-label | 10–11px / 700 / +10% tracking / MAYÚS | único nivel en mayúsculas (ej. “SERIE 3”, “MÉTRICA”) |
| Número grande | 44px / 700 (asistencia), 18–19px / 700 (valores) | tabular-nums en valores |

### Espaciado, radios, targets
- **Radios:** controles 10–13px · tarjetas 14–16px · pills/chips 999px.
- **Gap base:** 8–12px.
- **Targets táctiles ≥44px:** campo de peso 46px · botón de ícono 40–44px · botón guardar 52px · celdas de día ~44px.
- **Bordes:** hairline 1px de bajo contraste para contenedores. Borde grueso + sombra **solo** en la acción primaria (botón Guardar).

---

## Principios (aplican a cualquier pantalla nueva)
1. **Menos cajas.** Separar por espacio y hairlines de 1px, no por bordes negros. Borde grueso + sombra reservado a la acción primaria.
2. **El verde significa estado.** Acento solo en lo activo / confirmado / en progreso. Nunca como fondo decorativo.
3. **Una sola jerarquía.** Mayúsculas solo en micro-labels; títulos en caja normal y grandes.
4. **Targets ≥44px.** Todo lo tocable dimensionado para manos sudadas.
5. **Ritmo consistente.** Radios y gaps según la escala de arriba.

---

## Screens / Views

### 1. Registro de sesión — pantalla principal (`/`, `WorkoutApp`)
**Propósito:** cargar los pesos/reps de la sesión de hoy.

**Layout:** header sticky (marca + ícono chart→progreso) · cuerpo scroll: kicker “Hoy · Día N”, H1 nombre de rutina, meta (bloques/series), **barra de progreso** + caption + hint · lista de **bloques (circuitos)** · nota de sesión (chips + textarea) · **barra de guardado sticky abajo**.

**Modelo de datos — clave:** un bloque es un **circuito de N series × 2–3 ejercicios**. Se agrupa **por serie**, no por ejercicio. Cada serie muestra sus 2–3 ejercicios juntos, en orden. (Respeta la estructura `routine.sections[].groups[].exercises[]` y `values` del draft actual.)

**Componentes:**
- **Bloque:** título “Circuito A · Pecho”, subtítulo “3 series × 3 ejercicios · en circuito”, progreso “2/3”. Bloques no-activos colapsados como fila con chevron.
- **Serie:** pill de estado (`Serie 1` completada = borde suave/gris; `Serie 3` en curso = pill acento sólido) + tag (“Completada” / “En curso”) + botón **Descanso 90s** (pill, solo en la serie en curso). Series completadas atenuadas (opacity .6) pero visibles.
- **Fila de ejercicio (dentro de la serie):** nombre (700) + `›` (abre sheet) sobre meta “obj 8 · 60 kg”; a la derecha el campo de peso (46px, tabular).
  - Estados del campo: **confirmado** (sólido + ✓ verde a la derecha), **activo** (borde acento + ring + punto), **sugerido** (gris punteado, valor precargado de la última sesión).
- **Barra de guardado sticky:** progreso “4/9 series” + botón **Guardar sesión** (52px, acento, único con sombra).

**Interacción de teclado (central):** el usuario avanza con el botón **“Siguiente”** del teclado Android, campo por campo en orden de circuito (Serie 1 A→B→C → Serie 2…). **Pasar de campo confirma el campo que se deja atrás** (no hace falta tap extra ni botón ✓). El activo va resaltado; los aún no alcanzados quedan como sugerencia gris.
- En el **último campo de un bloque**, “Siguiente” **colapsa ese bloque y abre el siguiente**.
- En el **último bloque**, “Siguiente” salta a la **nota de sesión**.
- **Progreso = campos confirmados**, no “campos con texto” (crítico: los pesos vienen precargados de la última sesión, así que contar campos-con-valor daría siempre 100%).

### 2. Menú del ejercicio — bottom sheet
**Propósito:** acciones por-ejercicio, consolidadas en un solo punto de entrada (evita repetir íconos en cada fila del circuito).

**Disparador:** tap en el **nombre del ejercicio** (el `›`). Hoy el nombre navega directo al historial; ahora “Ver progreso / historial” pasa a ser **una opción más** del menú.

**Contenido (orden):**
1. **Cabecera de contexto (no es acción):** “Última vez · hace 3 días” + valores (“0:45 · 0:50 · 0:50” o “60 · 62,5 · 62,5 kg”) + nota previa en cursiva. (Reemplaza la “nota previa” que hoy vive inline.)
2. **Cambiar ejercicio** (swap — `ExerciseSwapDialog`).
3. **Cronómetro** — solo para ejercicios **por tiempo**. Se expande in-place: display `00:38` + íconos Pausar/Reiniciar + botón **Usar** (acento) que **escribe el tiempo medido en el campo** de la serie.
4. **Agregar nota** (del ejercicio).
5. *(condicional)* **Quitar** — solo si es ejercicio agregado del día.
6. — separador —
7. **Ver progreso / historial** — al final y separado, porque **navega fuera** de la sesión (`/progress/[movementId]`).

**Implementación sugerida:** Radix Dialog/Drawer (bottom sheet), scrim con blur suave, grip, items de 44–53px.

### 3. Historial de sesiones (`SessionHistory`)
**Propósito:** revisar sesiones pasadas.
**Layout:** H1 “Historial”, subtítulo, lista de sesiones separadas por hairline. Cada ítem: nombre de rutina (700) + fecha con ícono calendario (`formatSessionDate`) + chevron. **Expandible** → nota (en card acento suave) + filas “nombre de ejercicio … valor + unidad” (usa `splitValueSummary(valueSummary)`, tabular-nums).

### 4. Asistencia del mes (`AttendanceCard`)
**Propósito:** ver constancia mensual.
**Layout:** número grande de **días entrenados** + **% de meta** · **navegación de mes** (prev/next, `buildAttendanceGrid`, respetar `canGoForward`) · grilla de calendario 7 col (fila de iniciales L–D) con celdas: **on** (día con sesión = acento), **off** (muted), **today** (ring acento). Debajo, 2 insight cards (ej. “semanas seguidas”, “sesiones/semana prom.”).
> Los insights extra son sugeridos; si no existe el cálculo en el backend, omitirlos o derivarlos de `history`.

### 5. Progreso por ejercicio (`/progress/[movementId]`, `ExerciseProgressPage`)
**Propósito:** evolución de un ejercicio.
**Layout:** back “Volver” · H1 nombre + meta “N sesiones · última …” · **Métrica** (segmentado, de `availableMetrics`: Peso máx / Volumen / Reps) · **Rango** (3m/6m/1a/Todo) · **gráfico de línea** (SVG, puntos seleccionables, punto activo resaltado) · **detalle de sesión activa** (fecha, rutina, valor, setSummary) en card acento suave · **grid de stats 2×2**: Último valor / Récord / Última mejora / Sin mejorar · **Tendencia**: badge (`Subiendo` acento / `Bajando` / `Estable`), o “Faltan N sesiones” si `< 6`.
**Segmentado (nuevo estilo):** botón activo = acento sólido; inactivo = borde hairline sobre blanco. (Reemplaza el `shadow-brutal` + borde 2px actual.)

### 6. Progreso general + análisis del agente (`/progress`, `ProgressOverviewPage` + `ProgressInsights`)
**Propósito:** comparar ejercicios y leer el análisis automático.

**Análisis del agente (`ProgressInsights`) — arriba, card destacada:**
- Micro-label “Insights · últimos 90 días” con ícono chispa + timestamp relativo (“hace 2 h”, `formatRelative`).
- **Headline** (700).
- **Bullets tipados** con chip de ícono: `progress` = ↑ acento · `plateau` = − gris (muted) · `warning` = ⚠ ámbar.
- **Sugerencia** destacada (700) con flecha, separada por hairline arriba.
- Botón **Regenerar** (`fetchInsight({force:true})`).
- **Estados a implementar** (del componente actual): `loading` (skeleton) · `insufficient` (“Necesitás 5 sesiones en 90 días, llevás N”) · `unavailable` (503/Gemini caído) · `error` · `disabled` (no render).
- **Datos:** `GET /api/insights` con `If-None-Match: cacheKey` → 304 usa cache; respuesta `{status, insight:{headline,bullets[],suggestion}, cacheKey, generatedAt}`. Cache en `localStorage["gymapp:progress-insight"]`.

**Comparador (`ProgressOverviewPage`):**
- **Filtros (4):** **Rutina** (Todas + por rutina) · **Rango** (3m/6m/1a/Todo) · **Métrica** (Mejor registro / Volumen) · **Ejercicios** (acciones “Todos”/“Ninguno” + chip toggle por ejercicio; los activos definen qué líneas se dibujan).
- **Gráfico multilínea** (SVG): variación **% normalizada vs. primer registro** (línea 0% marcada); una línea/color por ejercicio (mapear a `--chart-1..5`); puntos seleccionables.
- **Detalle de punto activo:** ejercicio, fecha · rutina, valor, “% vs. inicio”.
- **Leyenda / resumen:** fila por ejercicio (punto de color + nombre + “N sesiones visibles” · %Δ + último valor). **Tap resalta** su línea (atenúa el resto). 

---

## State Management (existente — conservar)
- **Draft autosaved** de la sesión en el dispositivo (`WorkoutSessionDraft` v1: `routineId`, `note`, `values`, `slotAssignments`, `dayExercisesByGroupId`).
- **Wake-lock** para que la pantalla no se apague con el timer corriendo.
- **Valores por serie**, asignaciones de swap, ejercicios agregados del día.
- **Insights** cacheados en `localStorage` con validación por ETag.
- Selección de rutina sugerida (`getSuggestedRoutineId`), estado de métrica/rango/ejercicios activos en las vistas de progreso.

> El trabajo pendiente es **de piel** (jerarquía, color, tamaños táctiles, unificar lenguaje), no de arquitectura. No cambiar la lógica de datos ni las rutas.

## Interactions & Behavior — resumen
- Colapsables de bloque/historial/asistencia con chevron que rota.
- “Siguiente” del teclado como motor del registro (ver pantalla 1).
- Sheet del ejercicio: abrir con tap en nombre; timer con “Usar”.
- Gráficos: puntos/series seleccionables; leyenda con highlight.
- Estados de carga/vacío/error explícitos en Insights y en cada vista de progreso.
- Transiciones sutiles (hover/active); nada de sombras duras salvo el botón primario.

## Assets
- **Fuentes:** Space Grotesk + Space Mono (Google Fonts). En el codebase, usar `next/font` si ya está configurado.
- **Íconos:** `lucide-react` (ya en uso): ChevronDown/Left/Right, CalendarDays, BarChart3, TrendingUp, Minus, TriangleAlert, ArrowRight, RefreshCw, Timer, Pencil, ArrowLeftRight, etc. En el prototipo son SVG inline equivalentes.
- Sin imágenes bitmap ni logos nuevos.

## Files
- `Revisión GymApp.dc.html` — prototipo de las 6 pantallas + design system (abrir en navegador; requiere `support.js`).
- `support.js` — runtime del prototipo (no portar; es solo para ver el HTML).
- `screens/registro.png`, `menu-ejercicio.png`, `historial.png`, `asistencia.png`, `progreso-ejercicio.png`, `progreso-general.png`, `design-system.png`.

## Referencia de archivos del repo (para el mapeo)
- `src/components/workouts/workout-app.tsx` — registro, AttendanceCard, SessionHistory, swap dialog.
- `src/components/workouts/exercise-progress-page.tsx` — progreso por ejercicio.
- `src/components/workouts/progress-overview-page.tsx` — progreso general.
- `src/components/workouts/progress-insights.tsx` — análisis del agente.
- `app/globals.css`, `tailwind.config.ts` — tokens (actualizar acento y el uso del verde).
