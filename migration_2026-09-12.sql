-- ============================================================
-- PETFLOW — Migração de 12/09/2026
-- Rode este arquivo uma única vez no SQL Editor do seu projeto Supabase
-- (Project → SQL Editor → cole o conteúdo → Run).
-- Só acrescenta UMA função nova — nenhuma tabela, coluna ou política
-- existente é alterada, apagada ou recriada. Se o banco for novo, não
-- precisa rodar esta migração: o schema.sql já vem com tudo isso.
-- ============================================================

-- Permite que o(a) TUTOR(A) desmarque (cancele) um agendamento futuro do
-- próprio pet, sem abrir uma política geral de UPDATE em `appointments`
-- para tutores — o que deixaria qualquer campo do agendamento (data,
-- horário, tipo...) editável por eles. Esta função só troca o status para
-- 'Cancelado', e só quando:
--   1) o agendamento pertence a um pet do(a) tutor(a) que está logado(a);
--   2) o agendamento ainda está em aberto ('Confirmado' ou
--      'Aguardando confirmação' — não deixa "reabrir" um já
--      cancelado/recusado/realizado).
-- Segue o mesmo padrão de segurança das funções update_own_pet_photo /
-- update_own_tutor_photo já existentes no schema.sql.
create or replace function cancel_own_appointment(p_appt_id uuid)
returns void language plpgsql security definer as $$
declare
  v_pet_id uuid;
  v_status text;
begin
  select pet_id, status into v_pet_id, v_status from appointments where id = p_appt_id;
  if v_pet_id is null then
    raise exception 'Agendamento não encontrado.';
  end if;
  if not owns_pet(v_pet_id) then
    raise exception 'Você não tem permissão para desmarcar este agendamento.';
  end if;
  if v_status not in ('Confirmado','Aguardando confirmação') then
    raise exception 'Este agendamento não pode mais ser desmarcado.';
  end if;
  update appointments set status = 'Cancelado' where id = p_appt_id;
end;
$$;
grant execute on function cancel_own_appointment(uuid) to authenticated;
