/* ============================================================
   PETFLOW — Ponte com o Supabase
   Carrega os dados reais do banco para dentro do mesmo objeto
   `DB` que o app já usa (mesmo formato do mock), então quase
   nenhuma função de renderização precisa mudar.

   Preencha SUPABASE_URL e SUPABASE_ANON_KEY abaixo com os valores
   do seu projeto (Project Settings > API no painel do Supabase).
   ============================================================ */

const SUPABASE_URL = 'COLE_AQUI_A_URL_DO_SEU_PROJETO';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_ANON_KEY';
const SUPABASE_CONFIGURED = !SUPABASE_URL.startsWith('COLE_AQUI');

let supa = null;
if(SUPABASE_CONFIGURED){
  try { supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
  catch(err){ console.error('[PetFlow] URL/chave do Supabase inválida:', err); }
}

/* ---------- Autenticação ---------- */
async function supaSignInEmail(email, password){
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}
async function supaSignUpTutor(email, password){
  // O trigger link_tutor_on_signup (ver schema.sql) vincula automaticamente
  // este novo usuário à linha em `tutors` que tiver o mesmo e-mail.
  const { data, error } = await supa.auth.signUp({ email, password });
  if(error) throw error;
  return data;
}
async function supaSignOut(){ await supa.auth.signOut(); }
async function supaCurrentSession(){
  const { data } = await supa.auth.getSession();
  return data.session;
}

/* ---------- Carrega tudo do Supabase para dentro de DB (mesmo formato do mock) ---------- */
async function loadAllFromSupabase(){
  const [vets, tutors, pets, appointments, consultations, prescriptions, exams, vaccines, payments, closedDates, blockedSlots] =
    await Promise.all([
      supa.from('vets').select('*'),
      supa.from('tutors').select('*'),
      supa.from('pets').select('*'),
      supa.from('appointments').select('*'),
      supa.from('consultations').select('*'),
      supa.from('prescriptions').select('*'),
      supa.from('exams').select('*'),
      supa.from('vaccines').select('*'),
      supa.from('payments').select('*'),
      supa.from('closed_dates').select('*'),
      supa.from('blocked_slots').select('*'),
    ]);

  [vets, tutors, pets, appointments, consultations, prescriptions, exams, vaccines, payments, closedDates, blockedSlots]
    .forEach(r=>{ if(r.error) console.error('Erro ao carregar do Supabase:', r.error); });

  // Reaproveita o objeto DB já existente no app.js, só troca o conteúdo.
  DB.vet = vets.data && vets.data[0] ? {
    name: vets.data[0].name, firstName: vets.data[0].name.split(' ')[1]||vets.data[0].name,
    crmv: vets.data[0].crmv, clinic: vets.data[0].clinic, specialty: vets.data[0].specialty,
    email: vets.data[0].email, phone: vets.data[0].phone,
  } : DB.vet;

  DB.tutors = (tutors.data||[]).map(t=>({ id:t.id, name:t.name, phone:t.phone, email:t.email, pets: (pets.data||[]).filter(p=>p.tutor_id===t.id).map(p=>p.id) }));
  DB.pets = (pets.data||[]).map(p=>({ id:p.id, name:p.name, species:p.species, breed:p.breed, sex:p.sex, birth:p.birth, weight:Number(p.weight), microchip:p.microchip, notes:p.notes||'', tutorId:p.tutor_id }));
  DB.appointments = (appointments.data||[]).map(a=>({ id:a.id, petId:a.pet_id, date:a.date, time:a.time.slice(0,5), type:a.type, modality:a.modality, status:a.status, proposedSlots:a.proposed_slots }));
  DB.consultations = (consultations.data||[]).map(c=>({ id:c.id, petId:c.pet_id, date:c.date, reason:c.reason, anamnesis:c.anamnesis, weight:Number(c.weight), temp:c.temp, hr:c.hr, rr:c.rr, tpc:c.tpc, hidratacao:c.hidratacao, mucosas:c.mucosas, linfonodos:c.linfonodos, diagnosis:c.diagnosis, conduct:c.conduct, notes:c.notes||'', valor:Number(c.valor||0) }));
  DB.prescriptions = (prescriptions.data||[]).map(r=>({ id:r.id, petId:r.pet_id, date:r.date, meds:r.meds||[], orientations:r.orientations||'' }));
  DB.exams = (exams.data||[]).map(e=>({ id:e.id, petId:e.pet_id, date:e.date, type:e.type, valor:Number(e.valor||0), description:e.description||'', result:e.result||'', observacoes:e.observacoes||'', anexo:e.anexo||'', status:e.status }));
  DB.vaccines = (vaccines.data||[]).map(v=>({ id:v.id, petId:v.pet_id, vaccine:v.vaccine, date:v.date, batch:v.batch, nextDate:v.next_date, valor:Number(v.valor||0), notes:v.notes||'' }));
  DB.payments = (payments.data||[]).map(p=>({ id:p.id, petId:p.pet_id, date:p.date, service:p.service, refType:p.ref_type, refId:p.ref_id, valor:Number(p.valor), status:p.status, formaPagamento:p.forma_pagamento, parcelamentoTutor:p.parcelamento_tutor, paidDate:p.paid_date }));
  DB.closedDates = (closedDates.data||[]).map(c=>({ id:c.id, date:c.date, reason:c.reason||'' }));
  DB.blockedSlots = (blockedSlots.data||[]).map(b=>({ id:b.id, date:b.date, time:b.time.slice(0,5) }));
}

/* ============================================================
   PRÓXIMO PASSO (fase 2 da migração):
   As funções abaixo são o padrão a seguir para religar cada ação
   de salvar em app_part11.js à tabela real, além de atualizar o
   objeto DB local (que é o que a tela lê). Comece por estas —
   são as mais usadas:

   - save-atendimento   -> INSERT em consultations (+ exams/vaccines/payments)
   - save-receita        -> INSERT em prescriptions
   - save-exame           -> INSERT em exams (+ payments se valor>0)
   - save-vacina           -> INSERT em vaccines (+ payments se valor>0)
   - save-registrar-pagamento -> UPDATE em payments (status, forma_pagamento...)
   - confirm-appt / complete-appt / cancel-appt -> UPDATE em appointments

   Exemplo de como fica o INSERT de um exame:
   ============================================================ */
async function supaInsertExam(exam){
  const { data, error } = await supa.from('exams').insert({
    pet_id: exam.petId, date: exam.date, type: exam.type, valor: exam.valor,
    description: exam.description, status: exam.status,
  }).select().single();
  if(error) throw error;
  return data;
}

/* ---------- Liga tudo, com fallback seguro para os dados de demonstração ---------- */
(function bootstrapSupabase(){
  if(!SUPABASE_CONFIGURED || !supa){
    console.info('[PetFlow] Supabase ainda não configurado — usando dados de demonstração locais.');
    return;
  }
  loadAllFromSupabase()
    .then(()=>{ if(typeof render==='function') render(); console.info('[PetFlow] Dados carregados do Supabase.'); })
    .catch(err=>{ console.error('[PetFlow] Falha ao carregar do Supabase, mantendo dados de demonstração:', err); });
})();
