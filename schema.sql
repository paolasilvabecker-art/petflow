-- ============================================================
-- PETFLOW — Schema do Supabase (Postgres)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- Estrutura pensada para: 1 clínica/veterinário(a) por enquanto,
-- com tutores autenticados vendo apenas seus próprios dados.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Veterinário(a) (perfil vinculado ao auth.users) ----------
create table if not exists vets (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  crmv text,
  clinic text,
  specialty text,
  email text,
  phone text,
  created_at timestamptz default now()
);

-- ---------- Tutores ----------
-- user_id fica nulo até o tutor criar login; quando ele se cadastra,
-- vinculamos pelo e-mail (ver trigger opcional no fim do arquivo).
create table if not exists tutors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text unique,
  created_at timestamptz default now()
);

-- ---------- Pets ----------
create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references tutors(id) on delete cascade,
  name text not null,
  species text not null check (species in ('Cachorro','Gato')),
  breed text,
  sex text check (sex in ('Fêmea','Macho')),
  birth date,
  weight numeric(6,2),
  microchip text,
  notes text,
  created_at timestamptz default now()
);

-- ---------- Agendamentos (agenda / calendário) ----------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  date date not null,
  time time not null,
  type text not null,
  modality text not null check (modality in ('Clínica','Domiciliar','Teleatendimento')),
  status text not null default 'Aguardando confirmação'
    check (status in ('Aguardando confirmação','Confirmado','Recusado','Realizado','Cancelado')),
  proposed_slots jsonb,          -- [{date,time}, ...] sugeridos quando recusado
  created_at timestamptz default now()
);

-- ---------- Consultas (prontuário) ----------
create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  date date not null,
  reason text,
  anamnesis text,
  weight numeric(6,2),
  temp text,
  hr text,
  rr text,
  tpc text,
  hidratacao text,
  mucosas text,
  linfonodos text,
  diagnosis text,
  conduct text,
  notes text,
  valor numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- ---------- Receitas ----------
create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  date date not null,
  meds jsonb not null default '[]',  -- [{name,dosage,freq,duration,route,orientations}, ...]
  orientations text,
  created_at timestamptz default now()
);

-- ---------- Exames ----------
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  date date not null,
  type text not null,
  valor numeric(10,2) default 0,
  description text,
  result text,
  observacoes text,
  anexo text,
  status text not null default 'Solicitado'
    check (status in ('Solicitado','Em andamento','Resultado disponível')),
  created_at timestamptz default now()
);

-- ---------- Vacinas ----------
create table if not exists vaccines (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  vaccine text not null,
  date date not null,
  batch text,
  next_date date,
  valor numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);

-- ---------- Financeiro (lançamento integral — sem parcelamento do lado da clínica) ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  date date not null,
  service text not null,
  ref_type text,                 -- 'consulta' | 'exame' | 'vacina' | null
  ref_id uuid,
  valor numeric(10,2) not null,
  status text not null default 'Pendente' check (status in ('Pendente','Pago','Cancelado')),
  forma_pagamento text check (forma_pagamento in ('PIX','Cartão de crédito','Cartão de débito','Dinheiro')),
  parcelamento_tutor int,        -- informativo — nunca fraciona o recebimento da clínica
  paid_date date,
  created_at timestamptz default now()
);

-- ---------- Disponibilidade da agenda ----------
create table if not exists closed_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text
);

create table if not exists blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time time not null,
  unique(date, time)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Modelo: qualquer usuário autenticado com linha em `vets` é
-- veterinário(a) da clínica e enxerga tudo. Tutores só enxergam
-- (e só podem solicitar agendamento para) os próprios pets.
-- ============================================================

alter table vets enable row level security;
alter table tutors enable row level security;
alter table pets enable row level security;
alter table appointments enable row level security;
alter table consultations enable row level security;
alter table prescriptions enable row level security;
alter table exams enable row level security;
alter table vaccines enable row level security;
alter table payments enable row level security;
alter table closed_dates enable row level security;
alter table blocked_slots enable row level security;

create or replace function is_vet()
returns boolean language sql stable as $$
  select exists (select 1 from vets where id = auth.uid());
$$;

create or replace function owns_pet(p_pet_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from pets p
    join tutors t on t.id = p.tutor_id
    where p.id = p_pet_id and t.user_id = auth.uid()
  );
$$;

-- vets: acesso total
create policy "vet full access - vets" on vets for all using (is_vet()) with check (is_vet());
create policy "vet reads own row" on vets for select using (id = auth.uid());

create policy "vet full access - tutors" on tutors for all using (is_vet()) with check (is_vet());
create policy "tutor reads own row" on tutors for select using (user_id = auth.uid());

create policy "vet full access - pets" on pets for all using (is_vet()) with check (is_vet());
create policy "tutor reads own pets" on pets for select using (owns_pet(id));

create policy "vet full access - appointments" on appointments for all using (is_vet()) with check (is_vet());
create policy "tutor reads own appointments" on appointments for select using (owns_pet(pet_id));
create policy "tutor creates own appointments" on appointments for insert with check (owns_pet(pet_id));

create policy "vet full access - consultations" on consultations for all using (is_vet()) with check (is_vet());
create policy "tutor reads own consultations" on consultations for select using (owns_pet(pet_id));

create policy "vet full access - prescriptions" on prescriptions for all using (is_vet()) with check (is_vet());
create policy "tutor reads own prescriptions" on prescriptions for select using (owns_pet(pet_id));

create policy "vet full access - exams" on exams for all using (is_vet()) with check (is_vet());
create policy "tutor reads own exams" on exams for select using (owns_pet(pet_id));

create policy "vet full access - vaccines" on vaccines for all using (is_vet()) with check (is_vet());
create policy "tutor reads own vaccines" on vaccines for select using (owns_pet(pet_id));

create policy "vet full access - payments" on payments for all using (is_vet()) with check (is_vet());
create policy "tutor reads own payments" on payments for select using (owns_pet(pet_id));

create policy "vet full access - closed_dates" on closed_dates for all using (is_vet()) with check (is_vet());
create policy "anyone reads closed_dates" on closed_dates for select using (true);

create policy "vet full access - blocked_slots" on blocked_slots for all using (is_vet()) with check (is_vet());
create policy "anyone reads blocked_slots" on blocked_slots for select using (true);

-- ============================================================
-- Vincular tutor ao usuário quando ele cria login com o mesmo e-mail
-- cadastrado pelo veterinário. Rode isso uma vez; dispara sempre que
-- um novo usuário confirma o cadastro no Supabase Auth.
-- ============================================================
create or replace function link_tutor_on_signup()
returns trigger language plpgsql security definer as $$
begin
  update tutors set user_id = new.id where email = new.email and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function link_tutor_on_signup();
