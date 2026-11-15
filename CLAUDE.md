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
├── CLAUDE.local.md           # datos sensibles (contraseña admin EDP) — local, no se sube
├── sql/
│   ├── edp_fase1.sql         # tablas del módulo EDP + tarifario inicial (ya ejecutado)
│   └── fase15b_empresas.sql  # tabla empresas + 24 empresas iniciales (ya ejecutado)
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

**Carga de ingresos:** Supabase entrega máximo 1.000 filas por consulta (aunque se pida `.limit(5000)`). `cargarIngresos()` pagina con `.range()` en bloques de 1.000 hasta traer todo (1.704 al 15 nov 2026). No volver a una sola consulta.

**Backup:** `ingresos_backup_pre_fase15` = copia de los ingresos antes de la limpieza de nombres de empresa (Fase 1.5-A, 13-14 nov 2026). Antes de cualquier UPDATE/DELETE masivo sobre `ingresos`, confirmar que existe.

### Tabla `empresas` (Fase 1.5-B, creada con `sql/fase15b_empresas.sql`)

Reemplaza al antiguo array `EMPRESAS_CATALOGO` (ya no existe en el código).

- Columnas: `id`, `nombre` TEXT UNIQUE NOT NULL, `rut`, `contacto_nombre`, `contacto_email`, `contacto_telefono`, `activo` (default TRUE), `visible_en_nuevo_ingreso` (default TRUE), `created_at`, `updated_at`.
- Índices: nombre, activo. RLS abierto. Realtime habilitado.
- **No hay FK con `ingresos`:** el vínculo es por texto (`ingresos.nombre_empresa = empresas.nombre`), exacto, sensible a mayúsculas, tildes y espacios. Por eso:
  - El nombre de un cliente **solo se puede cambiar si tiene 0 ingresos** (se verifica con `SELECT COUNT` antes de habilitar el campo y otra vez justo antes de guardar). Al renombrar se actualiza también `clientes_tarifas.cliente`.
  - "Eliminar definitivamente" solo existe para clientes con 0 ingresos; borra la empresa y sus filas en `clientes_tarifas`. **Nunca toca `ingresos`.**
  - Nombres nuevos se normalizan: MAYÚSCULAS, sin espacios dobles ni caracteres invisibles (caso ORBIT). Duplicados se detectan ignorando mayúsculas y tildes ("SAN JOSE" = "SAN JOSÉ").
  - Si un ingreso tiene un `nombre_empresa` que no está en la tabla, la app muestra `console.warn` y el ingreso se ve normal (solo cae en "Otro" del filtro).
- Al 15 nov 2026: 24 empresas = 21 con ingresos + ARAMARK, JEJ, VILLA TRAVEL (clientes potenciales, sin ingresos). `COMTECSA (histórico)` tiene `visible_en_nuevo_ingreso = FALSE` (110 ingresos huérfanos antiguos; solo Historial/Tarifario).

## Catálogos

### EMPRESAS — dinámicas (tabla `empresas`, ver Schema)

Ya no son un catálogo en el código. Se cargan con `EmpresasProvider` (React Context, envuelve toda la app) y se leen con el hook `useEmpresas()`:

| Campo del hook | Qué es | Dónde se usa |
|---|---|---|
| `empresas` | todas, incluye desactivadas | Tarifario con "Mostrar desactivados" ON |
| `activas` | `activo = true` | filtro del Historial, Tarifario, Exportar tarifario |
| `paraNuevoIngreso` | `activo = true` AND `visible_en_nuevo_ingreso = true` | dropdown Empresa de Nuevo Ingreso |
| `loading`, `error`, `recargar()`, `reintentar()` | estados y recarga | spinner / mensaje de error con "Reintentar" |

Se recargan tras cada alta/edición/desactivación y también por Realtime (otros dispositivos ven el cambio al instante).

Se agregan, editan y desactivan **solo desde el Tarifario del módulo EDP** (admin). Ver "Gestión de clientes" en la sección Módulo EDP.

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

### SERVICIOS REALIZADOS (14)
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
Lavado solo chasis
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

1. **Vehículo** — Empresa (`SelectBuscable`: dropdown con búsqueda, **sin "Otro" ni texto libre**; si no hay resultados muestra "¿No ves tu empresa? Pide al admin que la agregue desde el módulo EDP."; al editar un ingreso cuya empresa está desactivada u oculta, conserva el valor y muestra un aviso ámbar), patente, tipo, marca (dropdown + Otro), modelo (dropdown dependiente de marca + Otro), kilometraje
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
- **Filtros (multi-select, `MultiSelect`):** patente (texto), empresa, tipo, estado, servicios, equipamiento. Dentro de un filtro = OR; entre filtros = AND.
- **Filtro de empresa (`crearFiltroEmpresas(activas)`):** solo empresas activas.
  - Las que comparten primera palabra forman una **familia** con opción propia que agrupa a todas: `COMTECSA` (C-132 + PEM 612 + SITES + histórico) y `SECHE` (SECHE + SECHE CHIQUI, que es una flota/contrato dentro de SECHE). Cada miembro también se puede elegir solo (grupo "Variantes y Otros").
  - "Otro" = ingresos cuya empresa no calza con ninguna activa (p. ej. empresas desactivadas).
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

## Módulo EDP (Estados de Pago)

Módulo separado de los flujos de ingreso/historial, protegido por contraseña admin. Se entra desde la tarjeta "Módulo EDP" en el inicio (`view === 'edp'`).

**Estado:** Fase 1 lista (13 nov 2026): login admin + tarifario. Fase 1.5-B lista (15 nov 2026): gestión dinámica de clientes. Fase 2 pendiente: generar EDP e historial de EDPs (las tarjetas muestran "Disponible en Fase 2").

### Tablas Supabase (creadas con `sql/edp_fase1.sql`)

- **`admin_sessions`** — `id`, `password_hash` (SHA-256 hex), `created_at`, `updated_at`. Un solo registro. RLS: **solo SELECT** (la app no puede cambiar la contraseña).
- **`clientes_tarifas`** — `cliente`, `categoria_vehiculo`, `servicio`, `precio_neto` INTEGER (NULL = sin precio), `activo`, `fecha_actualizacion`. UNIQUE (cliente, categoria_vehiculo, servicio). Índices: cliente, servicio. RLS abierto. Precargada con 560 filas (10 clientes × 4 categorías × 14 servicios; 305 con precio).
- **`estados_pago`** — para Fase 2, vacía. `cliente`, `n_edp_cliente` (correlativo por cliente, UNIQUE con cliente), `rut_cliente`, `periodo_desde/hasta`, `n_cotizacion_kame`, `solicitante`, `total_neto`, `iva`, `total`, `estado` ('borrador' | 'emitido' | 'pagado'), `fecha_emision/envio/pago`, `observaciones`. Índices: cliente, periodo_desde, estado. RLS abierto.

### Login admin

- Contraseña: ver `CLAUDE.local.md` (no se sube al repo porque el repo es público).
- `LoginAdminModal`: calcula SHA-256 client-side con `crypto.subtle.digest` (Web Crypto, sin bcrypt) y compara con `admin_sessions.password_hash`.
- Éxito → `sessionStorage.admin_auth = 'true'` (dura hasta cerrar el navegador).
- 3 intentos fallidos → bloqueo de 30 s con cuenta regresiva (`admin_intentos`, `admin_bloqueo_hasta` en sessionStorage, sobrevive cerrar el modal).
- "Cerrar sesión admin" borra `admin_auth` y vuelve al inicio.
- **Para cambiar la contraseña:** calcular el hash (`node -e "console.log(require('crypto').createHash('sha256').update('NUEVA').digest('hex'))"`) y correr en Supabase `UPDATE admin_sessions SET password_hash = '<hash>', updated_at = NOW();`. No commitear la nueva contraseña ni su hash.
- ⚠️ Es una barrera contra accesos por error, no seguridad real: con RLS abierto y la anon key pública, alguien técnico puede leer/escribir las tablas directo. Para proteger montos de verdad se necesita Supabase Auth.

### Tarifario (`TarifarioView`)

- **Clientes:** las empresas de la tabla `empresas` (`useEmpresas().activas`, o todas con el toggle). Ya no existe `CLIENTES_TARIFARIO`. Las empresas sin tarifa cargada aparecen igual, con celdas vacías; el primer precio que se escribe crea la fila con `upsert`. Hoy tienen precios cargados los 10 clientes originales del Excel.
- **Categorías (`CATEGORIAS_TARIFARIO`):** Camioneta, Camion (**sin tilde**, decisión de Luis), Minibus, Bus. Distintas de `TIPOS_VEHICULO`: en Fase 2 hay que mapear "Camión" → "Camion" y definir qué pasa con Automóvil/SUV/Furgón/Maquinaria (sin tarifa).
- **Servicios:** los 14 de `SERVICIOS_CATALOGO`. "Recarga de Adblue" no venía en el Excel de precios → NULL (probablemente se cobra por litro; definir en Fase 2).
- Se carga una vez al entrar al módulo (`ModuloEDPView`) y queda cacheado en estado local como mapa `'CLIENTE|Categoria|Servicio' → precio`.
- Cada celda (`PrecioCelda`) guarda con `upsert` al perder foco o con Enter; toast verde. Celda vacía = NULL. Si falla, revierte el valor.
- "Duplicar de otro cliente" (`DuplicarTarifasModal` + `calcularFilasDuplicado`): destino = cliente seleccionado; origen = cualquier cliente con al menos un precio.
  - **Fusión (decisión de Luis, opción A2):** solo **rellena celdas vacías** del destino con precios del origen. **Nunca sobrescribe** un precio que el destino ya tenga (protege precios puestos a mano) y nunca copia vacíos. Si algún día se necesita "copia total", sería un botón nuevo.
  - Por defecto **excluye** los servicios cuyo nombre contiene `(Comtecsa)` (Lavado Full Diurno/Nocturno). Checkbox "Copiar también servicios específicos Comtecsa" (desmarcado por defecto).
  - El modal muestra antes cuántos precios va a copiar. Toast: "Copiados N precios desde X".
- "Exportar tarifario": CSV `Luandi_Tarifario_YYYY-MM-DD.csv` con formato matriz (filas categoría + servicio, columnas clientes), igual que el Excel original de precios.
- El Excel fuente (`listado precio por cliente.xlsx`) está en `.gitignore`.

### Gestión de clientes (Tarifario, Fase 1.5-B)

- **"+ Agregar cliente nuevo"** (arriba del sidebar) → `ClienteFormModal`. Al guardar: INSERT en `empresas`, recarga en toda la app, toast "Cliente creado" y abre el cliente en el tarifario.
- Campos: Nombre * (MAYÚSCULAS automáticas, único), RUT, contacto nombre, email, teléfono, checkbox **"Visible en Nuevo Ingreso"** (marcado por defecto).
- **RUT** (opcional): `validarRut` = módulo 11 (dígitos de derecha a izquierda × 2,3,4,5,6,7,2,3…; DV = 11 − suma mod 11; 11→"0", 10→"K"), cuerpo de 7-8 dígitos, y **rechaza RUT con todos los dígitos iguales** (11.111.111-1, 22.222.222-2…: ficticios aunque cumplan módulo 11; decisión de Luis). Se guarda formateado con `formatearRut` (`77.123.456-9`). Helpers: `limpiarRut`, `calcularDvRut`, `validarRut`, `formatearRut`.
- **Email** (opcional): validación de formato; se guarda en minúsculas.
- **Menú ⋮ por cliente** (`ItemCliente`): Editar datos · Desactivar cliente / Reactivar cliente · Eliminar definitivamente (solo si tiene 0 ingresos; al abrir el menú se cuentan en Supabase).
- **Editar:** el Nombre queda bloqueado (🔒) si el cliente tiene ≥1 ingreso; RUT, contactos y visibilidad se editan siempre.
- **Desactivar** = soft delete (`activo = false`), con confirmación. Desaparece de Nuevo Ingreso y del filtro del Historial; sus ingresos y precios se conservan. Toggle **"Mostrar desactivados"** (OFF por defecto, al final del sidebar) los muestra en gris.
- Indicadores en el sidebar: "Desactivado" (gris) y "Oculto en Nuevo Ingreso" (ámbar).

### Pendientes acordados con Luis (13 nov 2026)

- **Cambiar contraseña admin:** el hash de `luandi2026` quedó público en `sql/edp_fase1.sql`. Luis la cambiará cuando haya más usuarios en el módulo. No proponerlo antes.
- **Mover el proyecto fuera de `~/Documents`** (iCloud saca `node_modules` a la nube y traba el build): se resuelve en otra sesión.
- **Fase 2 — tarifas faltantes:** se coordina cuando Luis tenga definidos los precios de SUV, Furgón, Maquinaria, Automóvil, los de Camión que faltan (celdas NULL) y Adblue. No inventar precios ni reglas de cobro: preguntar.

## Workflow con Claude Code

Luis es dueño de la lógica de negocio. Claude Code debe:

1. **Preguntar antes de decisiones no obvias.** Ej: "¿esta validación debe ser bloqueante o solo advertencia?"
2. **Nunca inventar reglas de negocio.** Si no está en este archivo ni en la conversación, preguntar.
3. **Hacer commit directo a `main`** cuando Luis apruebe. Mensaje de commit descriptivo corto en inglés (ej: `add adblue quantity validation`).
4. **No tocar firmas ya guardadas en BD** sin confirmación explícita.
5. **Después de un cambio en Supabase (SQL),** avisar a Luis que debe correrse el ALTER TABLE ANTES del redeploy de código.
6. **Para probar localmente:** `npm run dev` → http://localhost:5173
7. **Para build:** `npm run build`
8. **Si `npm run dev` o `npm run build` se quedan pegados en "transforming...":** iCloud (carpeta Documents) mandó archivos de `node_modules` a la nube. Solución: mover/borrar `node_modules` y correr `npm install`.
9. **Si git falla con `bad object refs/heads/main 2`:** son copias de conflicto que crea iCloud dentro de `.git/refs` (archivos con " 2" en el nombre). Verificar que apuntan a commits ya incluidos en `main` (`git merge-base --is-ancestor <sha> main`) y sacarlas de `.git/refs`.

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
