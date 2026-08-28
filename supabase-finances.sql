-- Dashboard de finanzas: tabla de gastos
-- Ejecutar en Supabase → SQL Editor

-- Tabla de gastos manuales
CREATE TABLE IF NOT EXISTS expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount      numeric(10,2) NOT NULL,
  description text,
  date        date NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- RLS: solo admins pueden leer/escribir
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to expenses"
ON expenses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);
