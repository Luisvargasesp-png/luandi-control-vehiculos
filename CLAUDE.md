# CLAUDE.md — Luandi Control Vehículos

Contexto para Claude Code al trabajar en este proyecto. Luis no es programador; entrega decisiones de negocio, Claude Code implementa.

## Qué es este proyecto

Web app para **Luandi Servicios SPA** (Calama, Chile): control de ingreso y entrega de vehículos de clientes al taller. Reemplaza una planilla Excel física (formato N°5901). Partió como un prototipo y evolucionó a app productiva usada día a día.

**URL producción:** https://luandi-control-vehiculos.vercel.app
**Repo:** https://github.com/Luisvargasesp-png/luandi-control-vehiculos (branch `main`)
**Datos empresa:** Manzana 10, Sitio 11, Barrio Industrial Puerto Seco, Calama · Fono 963458567 · contacto@luandiservicios.com · www.luandiservicios.com

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + lucide-react
- **Backend:** Supabase (Postgres + Realtime + Storage)
- **Hosting:** Vercel plan Hobby (gratis), auto-deploy desde `main`
- **Proyecto Supabase:** `luandi-control` (región São Paulo, plan Free)
- **Acceso:** abierto, sin login. RLS con políticas permisivas.

## Estructura

```
luandi-control-vehiculos/
├── package.json              # incluye @supabase/supabase-js ^2.45.0
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.local                # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (local, no se sube)
└── src/
    ├── main.jsx
    ├── index.css             # clases @layer: .input, .btn-primary, .btn-secondary
    ├── supabase.js           # cliente Supabase con env vars
    └── App.jsx               # TODO el código de la app vive aquí (archivo único grande)
```

**Nota:** `App.jsx` es monolítico a propósito. Luis prefiere reemplazos completos sobre edits puntuales porque le facilita pegarlo en GitHub. Si Claude Code puede editar directo, no hay problema con hacer cambios quirúrgicos.

## Variables de entorno

Vive en `.env.local` (local) y en Vercel a **nivel proyecto** (no Shared):

```
VITE_SUPABASE_URL=https://mhecvzexqfszmuphfmwm.supabase.co
VITE_SUPABASE_ANON_KEY=<la anon public key, NO la publishable>
```

⚠️ **Error histórico:** usar `/rest/v1` al final de la URL (debe quedar solo el dominio raíz). Y confundir la `anon public eyJ...` con una `sb_publishable_...` — la correcta es la `anon`.

## Schema Supabase

Tabla principal `ingresos`. Columnas actuales:

**Identificadores:**
- `id` BIGSERIAL PK
- `n_control` UNIQUE (correlativo, arranca en 7150 vía función `siguiente_n_control()`)
- `fecha_creacion`, `fecha_actualizacion` (timestamps)
- `estado` ('en_proceso' | 'entregado')

**Vehículo:**
- `nombre_empresa`, `patente`, `tipo_vehiculo`, `marca`, `modelo`, `kilometraje`

**Servicios y equipamiento:**
- `servicios` JSONB (array de strings del catálogo marcados)
- `servicios_otros` TEXT (campo libre)
- `equipamiento` JSONB
- `equipamiento_otros` TEXT

**Cantidades por servicio/equipamiento (NUMERIC o INTEGER):**
- `cantidad_cinta_metros` (decimal)
- `cantidad_focos_traseros` (entero)
- `cantidad_faroles_delanteros` (entero)
- `cantidad_adblue_litros` (entero — Luis decidió sin decimales)
- `cantidad_cunas` (entero)
- `cantidad_piola_cunas` (entero)
- `cantidad_porta_cunas` (entero)
- `cantidad_checkpoint` (entero)
- `cantidad_focos_mineros` (entero)
- `cantidad_mallas_elasticas` (entero)

**Firmas e identificación de personas:**
- `cliente_entrega_fecha/hora/persona/firma`
- `cliente_entrega_sin_firma` BOOLEAN (excepción con motivo)
- `cliente_entrega_motivo_sin_firma` TEXT
- `luandi_recibe_fecha/hora/persona`
- `luandi_entrega_fecha/hora/persona`
- `cliente_recibe_fecha/hora/persona/firma`

**Observaciones:**
- `observaciones` (ingreso), `observaciones_entrega` (retiro)

**Índices:** `patente`, `nombre_empresa`, `estado`, `fecha_creacion`
**Realtime:** habilitado en tabla `ingresos`
**RLS:** abierto en SELECT/INSERT/UPDATE/DELETE

Tabla secundaria `contador` con registro único `id=1, valor=7150` (manejado por la función RPC).

## Catálogos

### EMPRESAS (14, orden alfabético)
ARAMARK, ATLAS COPCO, BARBARA RENT A CAR, BESALCO, CBS, COLORADO (SIGMA), COMTECSA, ECHEVERRIA IZQUIERDO, JEJ, MINING TAG, SECHE, TOLOZA, VILLA TRAVEL

### MARCAS → MODELOS
```
CHANGAN:       (sin modelos — usar "Otro")
CHEVROLET:     COLORADO
FORD:          MAVERICK, RANGER
GWM:           POER
JAC:           (sin modelos)
MACK:          (sin modelos)
MAXUS:         T-60, T-90
MAZDA:         (sin modelos)
MERCEDES BENZ: SPRINTER
MITSUBISHI:    L200
NISSAN:        NAVARA
TOYOTA:        HILUX
VOLKSWAGEN:    CONSTELLATION
VOLVO:         (sin modelos)
```

**Regla UX:** Si la marca no tiene modelos, mostrar aviso azul: "La marca X no tiene modelos predefinidos. Use la opción 'Otro' para escribir el modelo manualmente."

**Cambiar marca limpia el modelo** si el modelo actual no pertenece a la nueva marca.

### TIPOS DE VEHÍCULO
Camioneta, Camión, Bus, Minibus, Automóvil, SUV, Furgón, Maquinaria

### SERVICIOS REALIZADOS (13)
```
Lavado Full (exterior, interior y chasis)
Lavado Full Diurno (Comtecsa)
Lavado Full Nocturno (Comtecsa)
Lavado Exterior Completo (exterior y chasis)
Limpieza Interior
Lavado Exterior (sin chasis)
Lavado de Tapiz
Instalación de Fundas Asientos
Recarga de Adblue              [requiere cantidad en LITROS, enteros]
Torqueo de Neumáticos
Mantención Aire Acondicionado
Cambio Filtro Aire
Cambio Filtro Polen
```

### EQUIPAMIENTO (12)
```
Pertiga Normal
Pertiga Full Led
Cuñas                          [cantidad: unidades]
Piola para cuñas               [cantidad: unidades]
Porta cuñas                    [cantidad: unidades]
Checkpoint tipo gota           [cantidad: unidades]
Baliza
Focos Mineros                  [cantidad: unidades]
Mallas elásticas               [cantidad: unidades]
Cambio de Cinta Reflectante    [cantidad: METROS, acepta decimales]
Cambio de Foco Trasero         [cantidad: unidades]
Cambio de Faroles Delanteros   [cantidad: unidades]
```

**Reglas de cantidad:**
- Diseño compacto: input aparece a la derecha del checkbox en la misma línea (visible solo cuando está marcado).
- Al desmarcar un item, limpiar su cantidad asociada.
- Validación obligatoria: si está marcado y cantidad vacía o 0 → modal `AlertModal` y llevar al paso 2.
- Las cantidades aparecen en PDF junto al nombre del servicio ("Cuñas — 4 unidades").
- Las cantidades aparecen en Excel como columnas separadas.

## Flujo del formulario de ingreso

4 pasos (5 si está editando un ya entregado):

1. **Vehículo** — Empresa (dropdown + Otro), patente, tipo, marca (dropdown + Otro), modelo (dropdown dependiente de marca + Otro), kilometraje
2. **Servicios** — Catálogo de servicios + Catálogo de equipamiento (con cantidades inline donde aplica) + campos "Otros" libres
3. **Recepción** — Fechas, personas, firma del cliente (con excepción "sin firma" + motivo), personal Luandi que recibe
4. **Observaciones** — Texto libre + resumen del ingreso
5. **(solo editando entregado)** Entrega — datos de retiro, firma del cliente de conformidad

### Validaciones críticas al guardar

1. Si marca cualquier equipamiento/servicio con cantidad obligatoria sin completarla → bloquea, modal, lleva al paso 2.
2. (Solo nuevo ingreso) Firma del cliente obligatoria O marcar "sin firma" + motivo. Si falta → bloquea, modal, lleva al paso 3.
3. (En formulario de entrega) Firma de conformidad del cliente al retirar es **obligatoria sin excepción**.

## Flujo de edición post-entrega

- Botón "Editar" disponible SIEMPRE (incluso para entregados).
- Al editar un entregado: banner amarillo arriba "Editando un ingreso ya entregado..."
- Las firmas ya registradas quedan `readOnly` (candado 🔒). No se pueden cambiar para mantener validez legal.
- Para cambiar una firma, Luis debe revertir primero el estado a "en_proceso".
- Botón "Revertir entrega" ↻ (color amber) → modal de confirmación → vuelve a "en_proceso" conservando firmas.

**Decisión:** Sin auditoría de cambios (no se registra quién/cuándo editó).

## Historial

- **Agrupación por período (mes/año):** vista por defecto = mes actual. Botón "Cambiar período" abre modal `SelectorPeriodo` agrupado por año.
- **Filtros:** patente, empresa (texto libre), estado (todos | en_proceso | entregado).
- **Botones principales con contador dinámico:**
  - `[PDF respaldos (N)]` → PDF con TODOS los filtrados en formato individual completo, ordenados por n_control asc.
  - `[Excel mes (N)]` → CSV con los filtrados.
  - `[+ Nuevo]`
- Nombre de archivo refleja filtros: `Luandi_Ingresos_Junio_2026_COMTECSA.csv`.
- Título del PDF: "Respaldos Junio 2026 - COMTECSA" (si filtró empresa).
- **Mobile:** vista en cards. **Desktop:** vista tabla.
- Botón "Limpiar filtros" aparece cuando hay filtros activos.

## PDF individual

Formato idéntico al Excel original de Luandi (N°5901). Contiene:
- Header con "CONTROL DE INGRESO Y ENTREGA DE VEHICULO" + logo texto "LUANDI SERVICIOS SPA"
- N° de control
- Datos de ingreso en tabla
- Servicios realizados (2 columnas: servicios + equipamiento con marcas ✓)
- Cantidades en negrita azul junto al servicio marcado: "Cuñas — 4 unidades"
- Firmas (cliente ingreso + cliente retiro). Si "sin firma" muestra bloque amber con motivo.
- Datos de recepción y entrega del personal Luandi
- Observaciones
- Footer con datos empresa

Se abre en nueva pestaña y se dispara `window.print()` automáticamente.

## Decisiones de UX importantes (no romper)

- Luis trabaja desde Mac. Instrucciones en pantallazos esperan comandos Cmd+A/C/V, Cmd+Shift+R, Cmd+Option+J.
- Prefiere reemplazo completo de archivo sobre ediciones puntuales (más fácil de aplicar vía GitHub web). Con Claude Code esto ya no aplica tanto.
- Siempre marcar "Commit directly to the main branch" (no PRs).
- Al editar un `<button>` que no responde al click, el patrón que funciona es: convertirlo en botón sólido con `cursor-pointer`, usar `setData(prev => ...)` en vez de `update()` dentro del `onClick`, y clases de Tailwind más robustas (`inline-flex items-center ...`).
- Modales de confirmación propios (`ConfirmModal`), no `window.confirm()`.
- Toasts arriba a la derecha para feedback no-crítico, modales para errores de validación.

## Mejoras discutidas (pendientes o descartadas)

### Pendientes / posibles próximas
- Logo real de Luandi (SVG) en header y PDF — actualmente solo texto estilizado
- Autocompletar datos del vehículo si la patente ya existe
- Login con usuario/contraseña simple
- PWA instalable
- Dashboard con estadísticas (clientes top, servicios más solicitados)
- Notificaciones al cliente cuando el vehículo esté listo

### Descartadas
- Integración OneDrive (complejidad alta, no justificada)
- Microsoft 365 personal del usuario (no se usa)
- Dominio propio luandi.app por ahora (dejar luandi-control-vehiculos.vercel.app)

## Workflow con Claude Code

Luis es dueño de la lógica de negocio. Claude Code debe:

1. **Preguntar antes de decisiones no obvias.** Ej: "¿esta validación debe ser bloqueante o solo advertencia?"
2. **Nunca inventar reglas de negocio.** Si no está en este archivo ni en la conversación, preguntar.
3. **Hacer commit directo a `main`** cuando Luis apruebe. Mensaje de commit descriptivo corto en inglés (ej: `add adblue quantity validation`).
4. **No tocar firmas ya guardadas en BD** sin confirmación explícita.
5. **Después de un cambio en Supabase (SQL),** avisar a Luis que debe correrse el ALTER TABLE ANTES del redeploy de código.
6. **Para probar localmente:** `npm run dev` → http://localhost:5173
7. **Para build:** `npm run build`

## Pendiente al cerrar la sesión del chat Claude.ai (26 oct 2026)

**Luis dejó aplicado el cambio de cantidades para:** Cinta Reflectante (m), Foco Trasero (un), Faroles Delanteros (un) + servicios Lavado Full Diurno/Nocturno Comtecsa + Filtro Aire + Filtro Polen + listas desplegables Empresa/Marca/Modelo con "Otro".

**Pendiente de aplicar en el código (SQL ya decidido pero NO ejecutado):**
Agregar cantidades a:
- Recarga de Adblue (litros, enteros)
- Cuñas, Piola para cuñas, Porta cuñas, Checkpoint tipo gota, Focos Mineros, Mallas elásticas (todas en unidades)

**SQL que falta ejecutar en Supabase (si no se ejecutó aún):**
```sql
ALTER TABLE ingresos
  ADD COLUMN IF NOT EXISTS cantidad_adblue_litros NUMERIC,
  ADD COLUMN IF NOT EXISTS cantidad_cunas INTEGER,
  ADD COLUMN IF NOT EXISTS cantidad_piola_cunas INTEGER,
  ADD COLUMN IF NOT EXISTS cantidad_porta_cunas INTEGER,
  ADD COLUMN IF NOT EXISTS cantidad_checkpoint INTEGER,
  ADD COLUMN IF NOT EXISTS cantidad_focos_mineros INTEGER,
  ADD COLUMN IF NOT EXISTS cantidad_mallas_elasticas INTEGER;
```

**Decisiones ya tomadas para ese cambio:**
- Adblue: solo enteros (no decimales)
- Validación: obligar cantidad si está marcado
- Diseño: input compacto a la derecha del checkbox

**Primera tarea sugerida para Claude Code:** revisar `src/App.jsx` para ver si estos cambios ya están en el código. Si no están, aplicarlos siguiendo el patrón de los equipamientos con cantidad que ya existen.
