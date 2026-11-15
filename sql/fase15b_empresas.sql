-- ============================================================
-- Módulo EDP — Fase 1.5-B: tabla dinámica de empresas
-- Ejecutar en Supabase (SQL Editor) ANTES del deploy del código.
-- Es seguro correrlo más de una vez. No hace UPDATE ni DELETE.
-- ============================================================

-- 0) Verificación de seguridad: aborta si no existe el backup
DO $$
BEGIN
  IF to_regclass('public.ingresos_backup_pre_fase15') IS NULL THEN
    RAISE EXCEPTION 'No existe ingresos_backup_pre_fase15. Abortando.';
  END IF;
END $$;

-- 1) Tabla empresas ------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  rut TEXT,
  contacto_nombre TEXT,
  contacto_email TEXT,
  contacto_telefono TEXT,
  activo BOOLEAN DEFAULT TRUE,
  visible_en_nuevo_ingreso BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Por si la tabla ya existía de una corrida anterior sin la columna
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS visible_en_nuevo_ingreso BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas (nombre);
CREATE INDEX IF NOT EXISTS idx_empresas_activo ON empresas (activo);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresas_all" ON empresas;
CREATE POLICY "empresas_all" ON empresas FOR ALL USING (true) WITH CHECK (true);

-- Realtime: otros dispositivos ven al instante un cliente nuevo/desactivado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'empresas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE empresas;
  END IF;
END $$;

-- 2) 24 empresas: las 21 con el nombre EXACTO que tienen hoy en ingresos
--    + 3 clientes potenciales sin ingresos (ARAMARK, JEJ, VILLA TRAVEL).
--    Los nombres con tilde van con código Unicode (U&'...') para que los
--    bytes sean idénticos a los de la tabla ingresos al copiar y pegar.
INSERT INTO empresas (nombre, visible_en_nuevo_ingreso) VALUES
  ('COMTECSA C-132', TRUE),
  ('COLORADO (SIGMA)', TRUE),
  ('CBS', TRUE),
  ('ECHEVERRIA IZQUIERDO', TRUE),
  ('SECHE', TRUE),
  (U&'COMTECSA (hist\00F3rico)', FALSE),   -- solo historial, no en Nuevo Ingreso
  ('COMTECSA PEM 612', TRUE),
  ('ATLAS COPCO', TRUE),
  ('BARBARA RENT A CAR', TRUE),
  ('BESALCO', TRUE),
  ('MAJOR DRILLING', TRUE),
  ('COMTECSA SITES', TRUE),
  ('MINING TAG', TRUE),
  ('ORBIT', TRUE),
  (U&'SAN JOS\00C9', TRUE),
  ('SECHE CHIQUI', TRUE),
  ('TOLOZA', TRUE),
  ('UMBEL', TRUE),
  ('VEROD', TRUE),
  ('ES INGENIERIA', TRUE),
  ('TECTRAMIN', TRUE),
  ('ARAMARK', TRUE),
  ('JEJ', TRUE),
  ('VILLA TRAVEL', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- 3) Verificación A: total de empresas (debe dar 24) y cuántas visibles en Nuevo Ingreso (23)
SELECT COUNT(*) AS total_empresas,
       COUNT(*) FILTER (WHERE activo AND visible_en_nuevo_ingreso) AS visibles_nuevo_ingreso
FROM empresas;

-- 4) Verificación B: debe devolver 0 filas.
--    Si aparece alguna, es un nombre en ingresos que NO calza con empresas.
SELECT i.nombre_empresa, COUNT(*) AS ingresos
FROM ingresos i
LEFT JOIN empresas e ON e.nombre = i.nombre_empresa
WHERE e.id IS NULL
GROUP BY i.nombre_empresa;
