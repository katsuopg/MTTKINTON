-- ============================================
-- マスタテーブルに name_en カラム追加
-- 熱処理・表面処理の多言語対応
-- ============================================

-- 熱処理マスタに name_en 追加
ALTER TABLE master_heat_treatments
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);

-- 表面処理マスタに name_en 追加
ALTER TABLE master_surface_treatments
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);

-- 熱処理マスタの英語名を更新
UPDATE master_heat_treatments SET name_en = '58-60 HRC' WHERE code = 'HRC58-60';
UPDATE master_heat_treatments SET name_en = '55-58 HRC' WHERE code = 'HRC55-58';
UPDATE master_heat_treatments SET name_en = '40-45 HRC' WHERE code = 'HRC40-45';
UPDATE master_heat_treatments SET name_en = 'Carburizing' WHERE code = 'CARBURIZING';
UPDATE master_heat_treatments SET name_en = 'Induction Hardening' WHERE code = 'INDUCTION';
UPDATE master_heat_treatments SET name_en = 'Nitriding' WHERE code = 'NITRIDING';
UPDATE master_heat_treatments SET name_en = 'Annealing' WHERE code = 'ANNEALING';
UPDATE master_heat_treatments SET name_en = 'Quenching & Tempering' WHERE code = 'TEMPERING';

-- 表面処理マスタの英語名を更新
UPDATE master_surface_treatments SET name_en = 'Black Oxide' WHERE code = 'BLACK_OXIDE';
UPDATE master_surface_treatments SET name_en = 'Zinc Plating' WHERE code = 'ZINC';
UPDATE master_surface_treatments SET name_en = 'Chrome Plating' WHERE code = 'CHROME';
UPDATE master_surface_treatments SET name_en = 'Electroless Nickel' WHERE code = 'ELECTROLESS_NI';
UPDATE master_surface_treatments SET name_en = 'Hard Chrome' WHERE code = 'HARD_CHROME';
UPDATE master_surface_treatments SET name_en = 'Anodizing' WHERE code = 'ANODIZE';
UPDATE master_surface_treatments SET name_en = 'Powder Coating' WHERE code = 'POWDER_COAT';
UPDATE master_surface_treatments SET name_en = 'Trivalent Chromate' WHERE code = 'TRIVALENT_CHROMATE';
UPDATE master_surface_treatments SET name_en = 'Passivation' WHERE code = 'PASSIVATION';
