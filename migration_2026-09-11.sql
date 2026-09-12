-- ============================================================
-- PETFLOW — Migração de 11/09/2026
-- Rode este arquivo UMA VEZ no SQL Editor do seu projeto Supabase (o mesmo
-- banco que você já usa em produção). Ele só ACRESCENTA coisas — nenhuma
-- tabela é recriada, nenhuma coluna existente é alterada ou removida, e
-- nenhum dado é apagado. É seguro rodar mais de uma vez (idempotente).
--
-- O que este arquivo resolve, dos itens pedidos:
--   1) Exame físico na consulta        → coluna consultations.exam_fisico
--   2) Observações da receita          → coluna prescriptions.observacoes
--   3) Foto do pet/tutor não persistia → coluna pets.photo_url / tutors.photo_url
--      (caso ainda não existam no seu banco) + bucket "photos" no Storage
--      + as políticas que faltavam para o(a) tutor(a) conseguir salvar a
--      própria foto (antes só o(a) veterinário(a) conseguia).
-- Os demais itens do pedido (data automática, receita em PDF, microchip na
-- edição, notificações de vacina, editar/excluir atendimento, dívida por
-- pet) são só de front-end (public/index.html) e não precisam de migração.
-- ============================================================

-- ---------- 1) Exame físico (consulta) ----------
alter table consultations add column if not exists exam_fisico text;

-- ---------- 2) Observações da receita ----------
alter table prescriptions add column if not exists observacoes text;

-- ---------- 3) Foto de pet/tutor ----------
alter table pets add column if not exists photo_url text;
alter table tutors add column if not exists photo_url text;

-- Bucket "photos" no Storage — precisa existir e ser público para as URLs
-- geradas pelo app abrirem a imagem. Se você já criou esse bucket manualmente
-- pelo painel do Supabase, este comando só garante que ele fique público.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read access to photos" on storage.objects;
create policy "Public read access to photos"
  on storage.objects for select
  using (bucket_id = 'photos');

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update photos" on storage.objects;
create policy "Authenticated users can update photos"
  on storage.objects for update
  using (bucket_id = 'photos' and auth.role() = 'authenticated');

-- Gravação da foto pelo(a) TUTOR(A): tutores só tinham política de leitura
-- (select) em `pets`/`tutors`. Sem uma política de update, o UPDATE feito
-- pela tela do tutor não retornava erro nenhum, mas também não gravava nada
-- (a linha simplesmente fica invisível para essa operação, por causa da
-- RLS) — por isso a foto "sumia" ao recarregar a página. Estas duas funções
-- (security definer) liberam SOMENTE a gravação da própria coluna de foto,
-- sem abrir edição geral das tabelas `pets`/`tutors` para tutores.
create or replace function update_own_pet_photo(p_pet_id uuid, p_photo_url text)
returns void language plpgsql security definer as $$
begin
  if not owns_pet(p_pet_id) then
    raise exception 'Você não tem permissão para alterar a foto deste pet.';
  end if;
  update pets set photo_url = p_photo_url where id = p_pet_id;
end;
$$;
grant execute on function update_own_pet_photo(uuid, text) to authenticated;

create or replace function update_own_tutor_photo(p_photo_url text)
returns void language plpgsql security definer as $$
begin
  update tutors set photo_url = p_photo_url where user_id = auth.uid();
end;
$$;
grant execute on function update_own_tutor_photo(text) to authenticated;
