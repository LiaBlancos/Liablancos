-- Seed raw materials based on user request
-- Price Unit defaults to Unit if not specified, but for flexibility we set it explicitly where needed.

INSERT INTO public.raw_materials (id, name, unit, unit_price, currency, price_unit, is_active, created_at, updated_at)
VALUES
    -- Fabrics (Prices are per Metre)
    (gen_random_uuid(), 'Kumaş', 'metre', 34.1, 'TRY', 'metre', true, now(), now()),
    (gen_random_uuid(), 'Astar', 'metre', 23.54, 'TRY', 'metre', true, now(), now()),
    (gen_random_uuid(), 'Tela', 'metre', 3.73591, 'TRY', 'metre', true, now(), now()),
    (gen_random_uuid(), 'Keçe', 'metre', 0, 'TRY', 'metre', true, now(), now()), -- Price unknown

    -- Accessories (Prices are per Adet)
    (gen_random_uuid(), '17 mm 54 Plastik Kapak', 'adet', 0.4125, 'TRY', 'adet', true, now(), now()),
    (gen_random_uuid(), '54 Dişi Parça Çıtçıt', 'adet', 0.4125, 'TRY', 'adet', true, now(), now()),
    (gen_random_uuid(), '54 Erkek Parça Çıtçıt', 'adet', 0.4125, 'TRY', 'adet', true, now(), now()),
    (gen_random_uuid(), '54 Bacak Parça Çıtçıt', 'adet', 0.4125, 'TRY', 'adet', true, now(), now()),
    (gen_random_uuid(), '3 No Kuş Gözü', 'adet', 0.34628, 'TRY', 'adet', true, now(), now()),
    (gen_random_uuid(), '3 No Plastik Pul', 'adet', 0.0198, 'TRY', 'adet', true, now(), now()),
    (gen_random_uuid(), 'Stoper', 'adet', 0.66, 'TRY', 'adet', true, now(), now()),
    (gen_random_uuid(), 'Fermuar', 'adet', 9.35, 'TRY', 'adet', true, now(), now()),

    -- Elastics & Cords (Usage in cm, Price in Metre)
    (gen_random_uuid(), '2 Cm Siyah Lastik', 'metre', 2.2, 'TRY', 'metre', true, now(), now()),
    (gen_random_uuid(), '1 Cm Siyah Lastik', 'metre', 0, 'TRY', 'metre', true, now(), now()), -- Price unknown
    (gen_random_uuid(), '15 Tel Siyah Lastik', 'metre', 1.54, 'TRY', 'metre', true, now(), now()),
    (gen_random_uuid(), 'Biye İpi', 'metre', 1.1, 'TRY', 'metre', true, now(), now()),

    -- Filling (Usage in gr, Price in Kg, Currency USD)
    (gen_random_uuid(), 'Elyaf', 'kg', 2.2, 'USD', 'kg', true, now(), now());
