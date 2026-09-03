/* ============================================================
   PETFLOW — Ponte com o Supabase
   Carrega os dados reais do banco para dentro do mesmo objeto
   `DB` que o app já usa (mesmo formato do mock), e cuida do
   login/cadastro de verdade (múltiplos veterinários e tutores).
   ============================================================ */

const SUPABASE_URL = 'https://uwsfpwjqkqpnauvyblov.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cJyaa7xlXMIUR8CBim_l6w_InXds4Oc';
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

/* Cadastro de tutor: cria a conta e, em seguida, ou "reivindica" um
   cadastro que o(a) veterinário(a) já tenha feito com o mesmo e-mail,
   ou cria um cadastro de tutor novo vinculado a essa conta. */
async function supaSignUpTutor(email, password, name, phone){
  const { data: signUpData, error: signUpError } = await supa.auth.signUp({ email, password });
  if(signUpError) throw signUpError;
  const user = signUpData.user;
  if(!user) throw new Error('Não foi possível criar a conta agora. Tente novamente em instantes.');

  const { data: claimed, error: claimErr } = await supa.from('tutors')
    .update({ user_id: user.id })
    .eq('email', email)
    .is('user_id', null)
    .select();
  if(claimErr) console.warn('[PetFlow] Não foi possível checar cadastro existente:', claimErr);

  if(!claimed || claimed.length === 0){
    const { error: insertErr } = await supa.from('tutors').insert({
      user_id: user.id, name: name || email.split('@')[0], phone: phone || '', email,
    });
    if(insertErr) throw insertErr;
  }
  return user;
}

async function supaSignOut(){ if(supa) await supa.auth.signOut(); }

/* ============================================================
   Gravação real no Supabase — cada função espelha uma mutação
   que antes só existia na memória local. Todas assumem que o
   objeto local já usa os mesmos nomes/ids que a tabela remota
   (os ids agora são UUIDs de verdade, ver uid() em app.js).
   ============================================================ */
function requireSupa(){ if(!SUPABASE_CONFIGURED || !supa) throw new Error('Supabase não está configurado neste ambiente.'); }

async function dbInsertPet(pet){
  requireSupa();
  const { error } = await supa.from('pets').insert({
    id: pet.id, tutor_id: pet.tutorId, name: pet.name, species: pet.species, breed: pet.breed,
    sex: pet.sex, birth: pet.birth, weight: pet.weight, microchip: pet.microchip||'', notes: pet.notes||'', photo_url: pet.photo||null,
  });
  if(error) throw error;
}
async function dbUpdatePet(petId, fields){
  requireSupa();
  const payload = {};
  if('name' in fields) payload.name = fields.name;
  if('breed' in fields) payload.breed = fields.breed;
  if('weight' in fields) payload.weight = fields.weight;
  if('sex' in fields) payload.sex = fields.sex;
  if('notes' in fields) payload.notes = fields.notes;
  if('birth' in fields) payload.birth = fields.birth;
  if('photo' in fields) payload.photo_url = fields.photo;
  const { error } = await supa.from('pets').update(payload).eq('id', petId);
  if(error) throw error;
}
async function dbDeletePet(petId){
  requireSupa();
  const { error } = await supa.from('pets').delete().eq('id', petId);
  if(error) throw error;
}
async function dbInsertTutor(tutor){
  requireSupa();
  const { error } = await supa.from('tutors').insert({ id: tutor.id, name: tutor.name, phone: tutor.phone||'', email: tutor.email||null, cpf: tutor.cpf||null, photo_url: tutor.photo||null });
  if(error) throw error;
}
async function dbUpdateTutor(tutorId, fields){
  requireSupa();
  const payload = {};
  if('photo' in fields) payload.photo_url = fields.photo;
  if('name' in fields) payload.name = fields.name;
  if('phone' in fields) payload.phone = fields.phone;
  const { error } = await supa.from('tutors').update(payload).eq('id', tutorId);
  if(error) throw error;
}
/* vet_id: todo registro clínico/financeiro criado pela veterinária logada
   passa a pertencer a ela (ver RLS em schema.sql) — é o que garante que
   outro(a) veterinário(a) que também atenda o mesmo pet não veja este
   registro. DB.vet.id é preenchido em enterAppWithProfile() no login. */
function currentVetId(){ return DB.vet && DB.vet.id ? DB.vet.id : null; }

async function dbInsertConsultation(c){
  requireSupa();
  const { error } = await supa.from('consultations').insert({
    id:c.id, pet_id:c.petId, vet_id: currentVetId(), date:c.date, reason:c.reason, anamnesis:c.anamnesis, weight:c.weight,
    temp:c.temp, hr:c.hr, rr:c.rr, tpc:c.tpc, hidratacao:c.hidratacao, mucosas:c.mucosas, linfonodos:c.linfonodos,
    diagnosis:c.diagnosis, conduct:c.conduct, notes:c.notes||'', valor:c.valor||0,
  });
  if(error) throw error;
}
async function dbInsertExam(e){
  requireSupa();
  const { error } = await supa.from('exams').insert({ id:e.id, pet_id:e.petId, vet_id: currentVetId(), date:e.date, type:e.type, valor:e.valor||0, description:e.description||'', result:e.result||'', observacoes:e.observacoes||'', anexo:e.anexo||'', status:e.status });
  if(error) throw error;
}
async function dbUpdateExam(examId, fields){
  requireSupa();
  const { error } = await supa.from('exams').update(fields).eq('id', examId);
  if(error) throw error;
}
async function dbInsertVaccine(v){
  requireSupa();
  const { error } = await supa.from('vaccines').insert({ id:v.id, pet_id:v.petId, vet_id: currentVetId(), vaccine:v.vaccine, date:v.date, batch:v.batch||'', next_date:v.nextDate, valor:v.valor||0, notes:v.notes||'' });
  if(error) throw error;
}
async function dbInsertPrescription(r){
  requireSupa();
  const { error } = await supa.from('prescriptions').insert({ id:r.id, pet_id:r.petId, vet_id: currentVetId(), date:r.date, meds:r.meds, orientations:r.orientations||'' });
  if(error) throw error;
}
async function dbInsertPayment(p){
  requireSupa();
  const { error } = await supa.from('payments').insert({ id:p.id, pet_id:p.petId, vet_id: currentVetId(), date:p.date, service:p.service, ref_type:p.refType, ref_id:p.refId, valor:p.valor, status:p.status });
  if(error) throw error;
}
async function dbUpdatePaymentsStatus(payIds, forma, parcelas, paidDate){
  requireSupa();
  const { error } = await supa.from('payments').update({ status:'Pago', forma_pagamento: forma, parcelamento_tutor: forma==='Cartão de crédito' ? (parcelas||1) : null, paid_date: paidDate }).in('id', payIds);
  if(error) throw error;
}
async function dbInsertAppointment(a){
  requireSupa();
  const { error } = await supa.from('appointments').insert({ id:a.id, pet_id:a.petId, date:a.date, time:a.time, type:a.type, modality:a.modality, status:a.status });
  if(error) throw error;
}
async function dbUpdateAppointment(apptId, fields){
  requireSupa();
  const payload = {};
  if('date' in fields) payload.date = fields.date;
  if('time' in fields) payload.time = fields.time;
  if('status' in fields) payload.status = fields.status;
  if('proposedSlots' in fields) payload.proposed_slots = fields.proposedSlots;
  const { error } = await supa.from('appointments').update(payload).eq('id', apptId);
  if(error) throw error;
}
async function dbToggleClosedDate(date, reason, isClosingNow){
  requireSupa();
  if(isClosingNow){
    const { error } = await supa.from('closed_dates').insert({ date, reason: reason||'' });
    if(error) throw error;
  } else {
    const { error } = await supa.from('closed_dates').delete().eq('date', date);
    if(error) throw error;
  }
}
async function dbToggleBlockedSlot(date, time, isBlockingNow){
  requireSupa();
  if(isBlockingNow){
    const { error } = await supa.from('blocked_slots').insert({ date, time });
    if(error) throw error;
  } else {
    const { error } = await supa.from('blocked_slots').delete().eq('date', date).eq('time', time);
    if(error) throw error;
  }
}
async function dbBlockSlotRange(date, slots){
  requireSupa();
  const rows = slots.map(time=>({ date, time }));
  const { error } = await supa.from('blocked_slots').upsert(rows, { onConflict: 'date,time', ignoreDuplicates: true });
  if(error) throw error;
}

/* ---------- Fotos: upload real no Supabase Storage ---------- */
async function handlePhotoUpload(kind, id, file){
  if(!SUPABASE_CONFIGURED || !supa){ showToast('Conecte o Supabase para enviar fotos.', 'warn'); return; }
  try{
    showToast('Enviando foto...');
    const ext = (file.name.split('.').pop()||'jpg').toLowerCase();
    const path = `${kind}s/${id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supa.storage.from('photos').upload(path, file, { upsert:true, contentType: file.type||'image/jpeg' });
    if(upErr) throw upErr;
    const { data: pub } = supa.storage.from('photos').getPublicUrl(path);
    const url = pub.publicUrl;
    if(kind==='pet'){
      await dbUpdatePet(id, { photo: url });
      const pet = getPet(id); if(pet) pet.photo = url;
    } else {
      await dbUpdateTutor(id, { photo: url });
      const t = getTutor(id); if(t) t.photo = url;
    }
    showToast('Foto atualizada!');
    render();
  } catch(err){
    showToast('Não foi possível enviar a foto: ' + (err.message||''), 'warn');
    render();
  }
}

/* Cadastro de veterinário(a): cria a conta e a linha em `vets`.
   Ativado só se o Bloco 4 do auth-setup.sql foi rodado — sem aquela
   política, o insert abaixo falha com erro de permissão. */
async function supaSignUpVet(email, password, name, crmv, clinic, phone){
  const { data: signUpData, error: signUpError } = await supa.auth.signUp({ email, password });
  if(signUpError) throw signUpError;
  const user = signUpData.user;
  if(!user) throw new Error('Não foi possível criar a conta agora. Tente novamente em instantes.');

  const { error: insertErr } = await supa.from('vets').insert({
    id: user.id, name: name || email.split('@')[0], crmv: crmv||'', clinic: clinic||'',
    specialty: '', email, phone: phone||'',
  });
  if(insertErr) throw insertErr;
  return user;
}

/* Descobre se a conta logada é de um(a) veterinário(a) ou de um(a) tutor(a). */
async function getMyProfile(){
  const { data: { user } } = await supa.auth.getUser();
  if(!user) return null;
  const { data: vetRow } = await supa.from('vets').select('*').eq('id', user.id).maybeSingle();
  if(vetRow) return { role:'vet', user, vetRow };
  const { data: tutorRow } = await supa.from('tutors').select('*').eq('user_id', user.id).maybeSingle();
  if(tutorRow) return { role:'tutor', user, tutorRow };
  return { role:null, user };
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
    .forEach(r=>{ if(r.error) console.error('[PetFlow] Erro ao carregar do Supabase:', r.error); });

  DB.tutors = (tutors.data||[]).map(t=>({ id:t.id, name:t.name, phone:t.phone, email:t.email, cpf:t.cpf||null, photo:t.photo_url||null, pets: (pets.data||[]).filter(p=>p.tutor_id===t.id).map(p=>p.id) }));
  DB.pets = (pets.data||[]).map(p=>({ id:p.id, name:p.name, species:p.species, breed:p.breed, sex:p.sex, birth:p.birth, weight:Number(p.weight), microchip:p.microchip, notes:p.notes||'', tutorId:p.tutor_id, photo:p.photo_url||null }));
  DB.appointments = (appointments.data||[]).map(a=>({ id:a.id, petId:a.pet_id, date:a.date, time:a.time.slice(0,5), type:a.type, modality:a.modality, status:a.status, proposedSlots:a.proposed_slots }));
  // As tabelas abaixo já chegam filtradas pelo RLS: cada veterinário(a)
  // só recebe do banco os registros que ela mesma criou (vet_id = auth.uid()).
  DB.consultations = (consultations.data||[]).map(c=>({ id:c.id, petId:c.pet_id, vetId:c.vet_id, date:c.date, reason:c.reason, anamnesis:c.anamnesis, weight:Number(c.weight), temp:c.temp, hr:c.hr, rr:c.rr, tpc:c.tpc, hidratacao:c.hidratacao, mucosas:c.mucosas, linfonodos:c.linfonodos, diagnosis:c.diagnosis, conduct:c.conduct, notes:c.notes||'', valor:Number(c.valor||0) }));
  DB.prescriptions = (prescriptions.data||[]).map(r=>({ id:r.id, petId:r.pet_id, vetId:r.vet_id, date:r.date, meds:r.meds||[], orientations:r.orientations||'' }));
  DB.exams = (exams.data||[]).map(e=>({ id:e.id, petId:e.pet_id, vetId:e.vet_id, date:e.date, type:e.type, valor:Number(e.valor||0), description:e.description||'', result:e.result||'', observacoes:e.observacoes||'', anexo:e.anexo||'', status:e.status }));
  DB.vaccines = (vaccines.data||[]).map(v=>({ id:v.id, petId:v.pet_id, vetId:v.vet_id, vaccine:v.vaccine, date:v.date, batch:v.batch, nextDate:v.next_date, valor:Number(v.valor||0), notes:v.notes||'' }));
  DB.payments = (payments.data||[]).map(p=>({ id:p.id, petId:p.pet_id, vetId:p.vet_id, date:p.date, service:p.service, refType:p.ref_type, refId:p.ref_id, valor:Number(p.valor), status:p.status, formaPagamento:p.forma_pagamento, parcelamentoTutor:p.parcelamento_tutor, paidDate:p.paid_date }));
  DB.closedDates = (closedDates.data||[]).map(c=>({ id:c.id, date:c.date, reason:c.reason||'' }));
  DB.blockedSlots = (blockedSlots.data||[]).map(b=>({ id:b.id, date:b.date, time:b.time.slice(0,5) }));

  // vets: usa o total só como referência; quem realmente "vira" o DB.vet
  // exibido na tela é a linha do usuário logado (ver enterAppWithProfile).
  if(vets.data && vets.data.length && !DB.__vetLocked){
    const v = vets.data[0];
    DB.vet = { id:v.id, name:v.name, firstName:(v.name.split(' ')[1]||v.name), crmv:v.crmv, clinic:v.clinic, specialty:v.specialty, email:v.email, phone:v.phone };
  }
}

/* ---------- Entra no app já autenticado, com o perfil certo ---------- */
async function enterAppWithProfile(profile){
  await loadAllFromSupabase();
  if(profile.role === 'vet'){
    const v = profile.vetRow;
    DB.vet = { id:v.id, name:v.name, firstName:(v.name.split(' ')[1]||v.name), crmv:v.crmv, clinic:v.clinic, specialty:v.specialty, email:v.email, phone:v.phone };
    DB.__vetLocked = true; // impede loadAllFromSupabase de sobrescrever com outro(a) vet
    STATE.role = 'vet';
    STATE.view = 'vet-dashboard';
  } else if(profile.role === 'tutor'){
    STATE.role = 'tutor';
    STATE.view = 'tutor-dashboard';
    STATE.currentTutorId = profile.tutorRow.id;
  }
  STATE.authError = null; STATE.authBusy = false;
  render();
}

async function handleRealLogin(role, email, password){
  STATE.authBusy = true; render();
  try{
    STATE.authError = null;
    await supaSignInEmail(email, password);
    const profile = await getMyProfile();
    if(!profile || !profile.role){
      STATE.authError = 'Login feito, mas não encontramos um cadastro de ' + (role==='vet'?'veterinário(a)':'tutor(a)') + ' vinculado a esta conta.';
      STATE.authBusy = false; render(); return;
    }
    if(profile.role !== role){
      STATE.authError = `Essa conta está cadastrada como ${profile.role==='vet'?'veterinário(a)':'tutor(a)'}. Clique na aba certa acima.`;
      STATE.authBusy = false; render(); return;
    }
    await enterAppWithProfile(profile);
  } catch(err){
    STATE.authError = traduzErroAuth(err);
    STATE.authBusy = false; render();
  }
}

async function handleTutorSignup(email, password, name, phone){
  STATE.authBusy = true; render();
  try{
    STATE.authError = null;
    await supaSignUpTutor(email, password, name, phone);
    const profile = await getMyProfile();
    if(profile && profile.role){
      await enterAppWithProfile(profile);
    } else {
      STATE.authError = 'Conta criada! Se pedirmos confirmação por e-mail, confira sua caixa de entrada e depois volte para entrar.';
      STATE.signupMode = false; STATE.authBusy = false; render();
    }
  } catch(err){
    STATE.authError = traduzErroAuth(err);
    STATE.authBusy = false; render();
  }
}

async function handleVetSignup(email, password, name, crmv, clinic, phone){
  STATE.authBusy = true; render();
  try{
    STATE.authError = null;
    await supaSignUpVet(email, password, name, crmv, clinic, phone);
    const profile = await getMyProfile();
    if(profile && profile.role){
      await enterAppWithProfile(profile);
    } else {
      STATE.authError = 'Conta criada! Se pedirmos confirmação por e-mail, confira sua caixa de entrada e depois volte para entrar.';
      STATE.signupMode = false; STATE.authBusy = false; render();
    }
  } catch(err){
    STATE.authError = traduzErroAuth(err);
    STATE.authBusy = false; render();
  }
}

async function handleRealLogout(){
  await supaSignOut();
  DB.__vetLocked = false;
  STATE.role = null; STATE.view = null; STATE.modal = null;
  STATE.authError = null; STATE.signupMode = false; STATE.authBusy = false;
  render();
}

function traduzErroAuth(err){
  const msg = (err && err.message) || '';
  if(/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if(/user already registered/i.test(msg)) return 'Já existe uma conta com esse e-mail. Tente entrar em vez de criar uma nova.';
  if(/duplicate key/i.test(msg)) return 'Este e-mail já está cadastrado.';
  if(/password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if(/rate limit/i.test(msg)) return 'Muitas tentativas seguidas. Aguarde um instante e tente de novo.';
  if(/row-level security|permission denied/i.test(msg)) return 'Cadastro de veterinário(a) ainda não está liberado neste banco (falta rodar o Bloco 4 do auth-setup.sql).';
  return msg || 'Algo deu errado. Tente novamente.';
}

/* ---------- Liga tudo: restaura sessão existente ou mostra o login ---------- */
(function bootstrapSupabase(){
  window.__petflowBooted = true;
  if(!SUPABASE_CONFIGURED || !supa){
    console.info('[PetFlow] Supabase não configurado — usando dados de demonstração locais.');
    render();
    return;
  }
  supa.auth.getSession().then(async ({data})=>{
    if(data.session){
      try{
        const profile = await getMyProfile();
        if(profile && profile.role){ await enterAppWithProfile(profile); return; }
      } catch(err){ console.error('[PetFlow] Erro ao restaurar sessão:', err); }
    }
    render();
  }).catch(err=>{
    console.error('[PetFlow] Erro ao verificar sessão:', err);
    render();
  });
})();
