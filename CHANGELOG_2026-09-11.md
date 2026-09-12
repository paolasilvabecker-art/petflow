# PetFlow — alterações de 11/09/2026

Resumo do que mudou, arquivo por arquivo. Nada foi recriado: todas as
mudanças abaixo são pontuais, dentro do `index.html` e
`supabase-client.js` que você já tinha, mais um arquivo novo de
migração do banco.

## ⚠️ Passo obrigatório: rodar a migração no Supabase

Abra o **SQL Editor** do seu projeto Supabase e rode o arquivo
`migration_2026-09-11.sql` **uma única vez**. Ele só acrescenta
colunas/políticas novas — não apaga nem recria nada. Sem esse passo, o
"Exame físico" da consulta, as observações da receita e a persistência da
foto não vão funcionar (mas o resto do app continua normal).

## 1) Data do sistema

`NOW_ISO_DATE` deixou de ser um texto fixo (`'2026-09-01'`) e passou a ser
calculado a partir do relógio real, sempre no fuso de Brasília
(`America/Sao_Paulo`). Todos os lugares que usavam a data fixa como "hoje"
(agenda, dashboard, filtros de "próximos/passados", valores padrão de
formulário) agora usam esse cálculo. Datas já salvas em consultas, exames,
vacinas etc. não foram tocadas.

## 2) Receita

- Novo campo **Quantidade/apresentação** por medicamento (ex: "1 frasco",
  "1 comprimido").
- Novo campo **Posologia (texto livre)** por medicamento — não fica mais
  preso a "frequência + duração" fixos.
- Novas seções **Observações** e **Orientações gerais / texto livre** na
  receita inteira.
- PDF: os botões "Baixar PDF" e "Imprimir" agora funcionam de verdade
  (abrem o diálogo de impressão do navegador, de onde dá pra escolher
  "Salvar como PDF" — sem precisar de nenhuma biblioteca nova). O layout
  mostra observações, quantidade, posologia e texto livre sem cortar nada.
- Banco: nova coluna `prescriptions.observacoes`.

## 3) Consulta — Exame físico

Nova seção "Exame físico" dentro do formulário de atendimento, separada da
anamnese e das observações gerais. Aparece também na visualização da
consulta salva. Banco: nova coluna `consultations.exam_fisico`.

## 4) Microchip

A tela de **editar pet** simplesmente não tinha nenhum campo de microchip
— por isso ele nunca aparecia (com ou sem chip cadastrado). Agora tem uma
caixa "Possui microchip" + campo do número, sempre visível na edição, e o
salvamento (local e Supabase) foi corrigido para realmente gravar essa
informação (antes também faltava no `dbUpdatePet`).

## 5) Tutor dentro da consulta

Não foi alterado.

## 6) Notificações de vacina

O sino de notificações usava uma lista (`DB.notifications`) que nunca era
preenchida — por isso nenhuma notificação aparecia, nem a de vacina.
Agora a lista é calculada na hora, a partir dos dados reais (próxima dose
de cada vacina, comparada com a data de hoje) — sem guardar nada duplicado,
então não tem como duplicar notificação. Tutores veem só as notificações
dos próprios pets; a veterinária vê de todos.

## 7) Editar/excluir atendimento

Agora dá para abrir uma consulta já salva e **editar** (reason, anamnese,
exame físico, sinais vitais, diagnóstico, conduta, valor) ou **excluir**,
com uma tela de confirmação antes de excluir. Editar uma consulta antiga
não mexe no peso atual do pet a menos que ela seja a mais recente. Exames,
vacinas e receitas lançados separadamente não têm vínculo direto com a
consulta no banco, então não são afetados por editar/excluir ela.

## 8) Foto do paciente

Achada a causa real: a tabela `pets`/`tutors` não tinha coluna de foto no
`schema.sql` original nem política que permitisse ao(à) **tutor(a)**
salvar a própria foto (só a veterinária conseguia gravar de verdade — a
tela do tutor "parecia" funcionar porque atualizava a tela, mas nada era
gravado no banco, por isso sumia ao recarregar). Corrigido com:
colunas `photo_url`, bucket público "photos" no Storage, e duas funções que
permitem ao(à) tutor(a) gravar somente a própria foto (sem abrir edição
geral das tabelas).

## 9) Dívida do tutor/pet

A lista de "Tutores" e a lista "Quem está devendo?" (Financeiro) mostravam
só um valor total por tutor, sem dizer qual pet devia. Agora mostram por
pet (ex: "Mel: R$ 100,00 pendente"), reaproveitando o agrupamento por pet
que a função `tutorFinance` já calculava.

## Verificação feita

- Sintaxe JS do `index.html` e do `supabase-client.js` validada
  (`node --check`).
- CSS com chaves balanceadas.
- Conferido que nenhuma função nova ficou duplicada ou faltando.
- Fluxos revisados manualmente: Tutor → Pet → Consulta → Receita → PDF;
  Tutor → Pet → Vacina → Notificação; Tutor → Pet → Dívida;
  Pet → Foto → Salvar → Atualizar página; Consulta → Editar/Excluir.
