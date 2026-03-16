# Instrucciones de Base de Datos

Para que la aplicación funcione, necesitas ejecutar el esquema en tu panel de Supabase.

1. Ve a tu proyecto en [Supabase](https://supabase.com).
2. Entra en **SQL Editor**.
3. Crea una "New Query".
4. Pega el contenido de [schema.sql](file:///c:/Users/rafad/Desktop/IA%20test/Inversiones/app/src/lib/schema.sql).
5. Dale a **Run**.

### Datos Iniciales (Seed)

Una vez creada la estructura, puedes insertar tus datos actuales ejecutando este SQL:

```sql
-- Insertar Activos base
INSERT INTO assets (name, ticker, asset_type) VALUES 
('iShares MSCI World ETF', 'URTH', 'ETF'),
('NVIDIA Corporation', 'NVDA', 'Stock'),
('Apple Inc.', 'AAPL', 'Stock'),
('Vusa S&P 500', 'VUSA', 'ETF'),
('Bitcoin', 'BTC', 'Crypto');

-- Insertar Transacciones iniciales (Ejemplo basado en tu Excel)
-- NOTA: Esto es una simplificación, la app te permitirá añadir las reales.
```
