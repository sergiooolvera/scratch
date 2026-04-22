ALTER TABLE ie_pagos_manuales ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'transferencia';
