-- ============================================================
-- PETFLOW — Dados de demonstração
-- Rode DEPOIS do schema.sql. Popula o banco com o mesmo cenário
-- fictício do protótipo (Dra. Ana, Mel, Thor, Nina, Luna, Bob...).
--
-- IMPORTANTE sobre o(a) veterinário(a):
-- a tabela `vets` referencia auth.users, então você precisa criar
-- o usuário da Dra. Ana pelo painel do Supabase (Authentication >
-- Add user) primeiro, copiar o UUID gerado e colar abaixo no lugar
-- de 'COLE_AQUI_O_UUID_DO_AUTH_USER'.
-- ============================================================

insert into vets (id, name, crmv, clinic, specialty, email, phone) values
  ('COLE_AQUI_O_UUID_DO_AUTH_USER', 'Dra. Ana Martins', 'CRMV-SP 34.812', 'Clínica Vida Animal', 'Clínica geral e domiciliar', 'ana.martins@petflow.app', '(11) 98221-4477');

insert into tutors (id, name, phone, email) values
  ('11111111-1111-1111-1111-111111111111', 'Paola Fontoura', '(11) 99887-1122', 'paola@email.com'),
  ('22222222-2222-2222-2222-222222222222', 'Mariana Costa', '(11) 98212-3344', 'mariana@email.com'),
  ('33333333-3333-3333-3333-333333333333', 'Carlos Eduardo', '(11) 97733-5566', 'carlos@email.com'),
  ('44444444-4444-4444-4444-444444444444', 'Fernanda Lima', '(11) 96654-7788', 'fernanda@email.com'),
  ('55555555-5555-5555-5555-555555555555', 'Juliana Prado', '(11) 95521-9900', 'juliana@email.com');

insert into pets (id, tutor_id, name, species, breed, sex, birth, weight, microchip, notes) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Mel', 'Cachorro', 'Golden Retriever', 'Fêmea', '2024-03-12', 24.5, '982000123456789', 'Levemente alérgica a frango.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Thor', 'Cachorro', 'SRD', 'Macho', '2021-01-20', 18.2, '982000123456790', 'Ansioso em consultas na clínica; prefere atendimento domiciliar.'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Nina', 'Gato', 'Gato sem raça definida', 'Fêmea', '2023-05-02', 4.1, '982000123456791', ''),
  ('aaaaaaaa-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'Luna', 'Cachorro', 'Shih-tzu', 'Fêmea', '2022-08-15', 6.4, '982000123456792', 'Sensível a mudanças de ração.'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'Bob', 'Cachorro', 'Beagle', 'Macho', '2020-02-10', 14.8, '982000123456793', '');

insert into appointments (pet_id, date, time, type, modality, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '2026-09-01', '09:30', 'Consulta', 'Domiciliar', 'Confirmado'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '2026-09-01', '11:00', 'Retorno', 'Clínica', 'Confirmado'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-09-01', '14:30', 'Consulta', 'Domiciliar', 'Aguardando confirmação'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '2026-09-02', '10:00', 'Vacinação', 'Clínica', 'Confirmado'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '2026-09-03', '16:00', 'Consulta', 'Teleatendimento', 'Aguardando confirmação'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '2026-09-04', '14:30', 'Retorno', 'Domiciliar', 'Confirmado'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '2026-08-28', '09:00', 'Consulta', 'Clínica', 'Realizado');

insert into consultations (id, pet_id, date, reason, anamnesis, weight, temp, hr, rr, tpc, hidratacao, mucosas, linfonodos, diagnosis, conduct, valor) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '2026-08-31', 'Consulta de rotina', 'Tutora relata bom apetite e disposição normal.', 24.5, '38.4', '96', '22', '< 2s', 'Normal', 'Normocoradas', 'Sem alterações', 'Animal hígido, sem alterações clínicas relevantes.', 'Manter alimentação atual. Retorno em 6 meses.', 150),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-08-28', 'Retorno pós-cirúrgico', 'Retorno para avaliação de cicatrização.', 4.1, '38.1', '160', '28', '< 2s', 'Normal', 'Normocoradas', 'Sem alterações', 'Cicatrização adequada, sem sinais de infecção.', 'Retirar pontos. Liberado para atividades normais.', 120),
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', '2026-08-15', 'Consulta domiciliar', 'Tutor relata leve coceira nas patas.', 18.2, '38.6', '110', '26', '< 2s', 'Normal', 'Normocoradas', 'Sem alterações', 'Dermatite leve, provável origem alérgica.', 'Prescrição de antialérgico. Reavaliar em 15 dias.', 200);

insert into prescriptions (pet_id, date, meds) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '2026-08-31', '[{"name":"Vitamina E","dosage":"1 cápsula","freq":"1x ao dia","duration":"30 dias","route":"Oral","orientations":"Administrar junto com a refeição."}]'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-08-15', '[{"name":"Cetirizina","dosage":"5mg","freq":"1x ao dia","duration":"15 dias","route":"Oral","orientations":""},{"name":"Pomada dermatológica","dosage":"Aplicação fina","freq":"2x ao dia","duration":"10 dias","route":"Tópica","orientations":"Evitar que o animal lamba o local."}]');

insert into exams (id, pet_id, date, type, valor, description, result, status) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-08-28', 'Hemograma completo', 100, 'Avaliação pré-liberação pós-cirúrgica.', 'Dentro dos parâmetros de normalidade.', 'Resultado disponível'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '2026-06-15', 'Ultrassom abdominal', 220, 'Avaliação de rotina.', 'Sem alterações significativas.', 'Resultado disponível'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', '2026-08-15', 'Raspado de pele', 90, 'Investigação de dermatite.', '', 'Em andamento');

insert into vaccines (pet_id, vaccine, date, batch, next_date, valor) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'V10', '2026-01-10', 'LT2201', '2027-01-10', 100),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Antirrábica', '2026-01-10', 'LT8843', '2027-01-10', 80),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'V10', '2026-09-06', 'LT2305', '2027-09-06', 100),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'V4 Felina', '2026-03-02', 'LT9021', '2027-03-02', 95),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'V8', '2026-08-10', 'LT1187', '2027-08-10', 90),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'V10', '2025-09-01', 'LT0765', '2026-09-05', 100);

-- Financeiro: lançamentos ligados às consultas/exames/vacinas acima
insert into payments (pet_id, date, service, ref_type, ref_id, valor, status, forma_pagamento, paid_date) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '2026-08-31', 'Consulta', 'consulta', 'cccccccc-0000-0000-0000-000000000001', 150, 'Pago', 'PIX', '2026-08-31'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '2026-08-28', 'Retorno', 'consulta', 'cccccccc-0000-0000-0000-000000000002', 120, 'Pago', 'Cartão de débito', '2026-08-28'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-08-15', 'Consulta domiciliar', 'consulta', 'cccccccc-0000-0000-0000-000000000003', 200, 'Pendente', null, null),
  ('aaaaaaaa-0000-0000-0000-000000000003', '2026-08-28', 'Exame — Hemograma completo', 'exame', 'eeeeeeee-0000-0000-0000-000000000001', 100, 'Pago', 'PIX', '2026-08-28'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '2026-06-15', 'Exame — Ultrassom abdominal', 'exame', 'eeeeeeee-0000-0000-0000-000000000002', 220, 'Pendente', null, null),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-08-15', 'Exame — Raspado de pele', 'exame', 'eeeeeeee-0000-0000-0000-000000000003', 90, 'Pendente', null, null);

insert into closed_dates (date, reason) values
  ('2026-09-07', 'Congresso'),
  ('2026-09-20', 'Compromisso');

insert into blocked_slots (date, time) values
  ('2026-09-02', '11:00'),
  ('2026-09-02', '11:30');
