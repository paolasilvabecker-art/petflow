# PetFlow — alterações de 12/09/2026

Resumo do que mudou, arquivo por arquivo. Nada foi recriado nem
refatorado: todas as mudanças abaixo são pontuais, dentro do
`index.html` e `supabase-client.js` que você já tinha, mais
um arquivo novo de migração do banco (só acrescenta uma função — nenhuma
tabela, coluna ou dado existente foi alterado).

## ⚠️ Passo obrigatório: rodar a migração no Supabase

Abra o **SQL Editor** do seu projeto Supabase e rode o arquivo
`migration_2026-09-12.sql` **uma única vez**. Sem esse passo, o
resto do app continua normal — só o botão "Desmarcar" do tutor na tela
inicial não vai funcionar (a tela até parece cancelar, mas o Supabase
recusa silenciosamente o UPDATE, do mesmo jeito que a foto do tutor sumia
antes da migração de 11/09 — por isso o cancelamento agora usa uma função
própria em vez de UPDATE direto).

## 1) Autonomia da veterinária para editar registros antigos

Antes, só a **consulta** (atendimento) podia ser editada depois de salva.
Vacina, exame e receita só podiam ser criados — não existia nenhum botão
para corrigi-los depois, nem mesmo o resultado de um exame já concluído.

Agora, abrindo o registro na linha do tempo do pet (ou, no caso do exame,
também direto na lista de Exames), a veterinária tem um botão **Editar**
que abre um formulário com todos os campos daquele registro, incluindo os
que antes só podiam ser preenchidos uma vez:

- **Exame**: tipo, data, valor, descrição, status, resultado, observações
  e anexo — inclusive um exame já com "Resultado disponível" pode ser
  reaberto e corrigido.
- **Vacina**: nome, data de aplicação, lote, valor, **próxima dose** e
  observações.
- **Receita**: mesma tela de "Nova receita", agora reaproveitada também
  para editar — todos os medicamentos, posologia, observações e
  orientações gerais.

Consulta (exame físico, peso, sinais vitais, diagnóstico, conduta etc.) e
o cadastro do pet (peso atual, datas, microchip) já podiam ser editados
antes de hoje — nada mudou nesses dois.

Nenhum histórico é apagado automaticamente: editar só grava o que a
veterinária alterar e mandar salvar.

## 2) Tela inicial do tutor — status das vacinas

Nova seção **"Vacinas"** na tela inicial do tutor, um cartão por pet (o
mesmo cálculo de "próxima vacina" que já existia no resumo de saúde do
pet), com três estados calculados sempre a partir da data de hoje real
(fuso de Brasília, `America/Sao_Paulo` — sem nenhuma data fixa no código):

- 🟢 **Vacina em dia** — próxima dose a mais de 14 dias.
- 🟡 **Vacina próxima do vencimento** — dentro de 14 dias.
- 🔴 **Vacina vencida** — data já passou.

Cada cartão mostra pet, nome da vacina e a data (prevista ou de
vencimento), sem precisar abrir o cadastro do pet. Nenhuma data já salva
no banco foi alterada — a seção só lê o que já existe.

## 3) Tela inicial do tutor — próximos agendamentos

A antiga seção "Próximo atendimento" (só o mais próximo) virou
**"Próximos agendamentos"**, mostrando até 4 atendimentos futuros
confirmados ou aguardando confirmação, cada um com pet, tipo, data,
horário e veterinário(a).

## 4) Desmarcar agendamento (tutor)

Cada agendamento futuro na tela inicial agora tem um botão **Desmarcar**.
Ele não cancela na hora — abre uma confirmação ("Tem certeza que deseja
desmarcar este atendimento?" / Voltar / Desmarcar atendimento) e só
cancela de fato depois de confirmado. O tutor só consegue desmarcar
agendamentos dos próprios pets (a função `cancel_own_appointment` do banco
confere isso) e só enquanto o atendimento ainda está em aberto — não dá
para "reabrir" um já realizado, recusado ou cancelado.

## 5) Histórico da agenda preservado

O cancelamento (tanto o já existente, feito pela veterinária, quanto o
novo, feito pelo tutor) continua usando o status `Cancelado` já existente
— não apaga o agendamento, e não mexe em pet, tutor, consultas, exames,
vacinas ou financeiro. Isso não mudou; só confirmamos que continua assim.

## 6) Data do sistema

Conferido: não existe mais nenhuma data fixa no código (a correção de
11/09 — `NOW_ISO_DATE` calculado a partir do relógio real, fuso de
Brasília — permanece intacta). Nenhuma mudança necessária aqui.

## Verificação feita

- Sintaxe JS do `index.html` e do `supabase-client.js` validada
  (`node --check`).
- Conferido que os handlers de edição de exame/vacina/receita seguem
  exatamente o mesmo padrão (rascunho, `editId`, insert vs. update) já
  usado para editar consulta — sem duplicar nem quebrar esse fluxo.
- Conferido que a política de segurança (RLS) de `vaccines`,
  `prescriptions` e `exams` já permitia UPDATE para a veterinária dona do
  registro — não foi preciso mudar nenhuma política existente.
- Conferido que `appointments` **não** tinha (e continua sem) uma política
  de UPDATE geral para tutores — por isso o cancelamento do tutor usa a
  função restrita `cancel_own_appointment`, e não um UPDATE direto.
- Fluxos revisados manualmente: Veterinária → editar exame antigo (inclusive
  já concluído) → salvar → reabrir → conferir; idem para vacina (inclusive
  próxima dose) e receita; Tutor → tela inicial → ver vacina em dia/próxima/
  vencida → ver próximos agendamentos → desmarcar → confirmar → recarregar
  a página → cancelamento permanece.
