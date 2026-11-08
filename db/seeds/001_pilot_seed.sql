BEGIN;

INSERT INTO roles (code, description) VALUES
  ('CLIENTE', 'Cliente do cinema'),
  ('OPERADOR_PORTARIA', 'Operador de portaria'),
  ('OPERADOR_CANTINA', 'Operador da cantina'),
  ('RUNNER', 'Responsável por entrega'),
  ('ADMIN_CINEMA', 'Administrador da unidade')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO cinema_units (id, name, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'Unidade Piloto CineFood', 'America/Sao_Paulo')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, timezone = EXCLUDED.timezone;

INSERT INTO rooms (id, unit_id, name) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Sala 01'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Sala 02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, display_name, password_hash, role_code, unit_id) VALUES
  ('00000000-0000-0000-0000-000000000021', 'rst-01@cinefood.local', 'RST-01 Portaria', 'seed-password-hash', 'OPERADOR_PORTARIA', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000022', 'rst-03@cinefood.local', 'RST-03 Cantina', 'seed-password-hash', 'OPERADOR_CANTINA', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, role_code = EXCLUDED.role_code, unit_id = EXCLUDED.unit_id;

INSERT INTO movies (id, title, synopsis, rating, duration_minutes) VALUES
  ('00000000-0000-0000-0000-000000000031', 'Filme Piloto CineFood', 'Conteúdo de demonstração da unidade piloto.', 'L', 120)
ON CONFLICT (id) DO UPDATE SET active = true;

INSERT INTO screenings (id, movie_id, room_id, starts_at, ends_at, format) VALUES
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000011', '2026-12-01 19:00:00-03', '2026-12-01 21:00:00-03', 'DIGITAL')
ON CONFLICT (id) DO UPDATE SET active = true;

INSERT INTO seats (room_id, row_label, seat_number)
SELECT '00000000-0000-0000-0000-000000000011', chr(64 + row_number), seat_number
FROM generate_series(1, 4) AS rows(row_number), generate_series(1, 8) AS seats(seat_number)
ON CONFLICT (room_id, row_label, seat_number) DO NOTHING;

INSERT INTO screening_seats (screening_id, seat_id)
SELECT '00000000-0000-0000-0000-000000000051', id
FROM seats
WHERE room_id = '00000000-0000-0000-0000-000000000011'
ON CONFLICT (screening_id, seat_id) DO NOTHING;

INSERT INTO privacy_terms (id, version, title, content, effective_from) VALUES
  ('00000000-0000-0000-0000-000000000041', '1.0', 'Aviso de Privacidade CineFood', 'Tratamos dados para autenticação, compra e atendimento. Comunicações promocionais são opcionais.', now())
ON CONFLICT (version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

COMMIT;
