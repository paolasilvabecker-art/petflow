# PetFlow — protótipo de gestão veterinária

Sistema para veterinários e tutores acompanharem consultas, receitas, exames,
vacinas, agenda e financeiro de pets. Front-end em HTML/CSS/JS puro (sem
build), pronto para GitHub + Vercel, com ponte opcional para Supabase.

## Estrutura

```
petflow/
├── public/
│   ├── index.html            ← o app inteiro (também funciona sozinho, com dados de demonstração)
│   └── supabase-client.js    ← ponte opcional com o Supabase (ver Fase 2 abaixo)
├── supabase/
│   ├── schema.sql            ← tabelas + segurança (RLS)
│   └── seed.sql              ← dados de demonstração para popular o banco real
├── vercel.json
└── README.md
```

## Fase 1 — Publicar no ar (GitHub + Vercel), sem mexer no Supabase ainda

Isso já funciona hoje, porque `index.html` roda 100% com dados de
demonstração locais (o mesmo protótipo que você já testou).

1. **GitHub**
   ```bash
   cd petflow
   git init
   git add .
   git commit -m "PetFlow — protótipo inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/petflow.git
   git push -u origin main
   ```
2. **Vercel**
   - Entre em [vercel.com/new](https://vercel.com/new) e importe o repositório que você acabou de criar.
   - Framework preset: **Other** (é HTML puro, sem build).
   - O `vercel.json` já aponta a pasta `public` como raiz do site — não precisa mudar nada.
   - Clique em **Deploy**. Em ~30 segundos você tem uma URL pública.

A partir daqui, todo `git push` na branch `main` gera um novo deploy automático.

## Fase 2 — Ligar ao Supabase (dados reais e login de verdade)

### 2.1 Criar o projeto e as tabelas

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor** → cole e rode o conteúdo de `supabase/schema.sql` (cria as tabelas e as políticas de segurança).
3. Vá em **Authentication → Users → Add user** e crie o login da veterinária (e-mail/senha). Copie o **UUID** gerado.
4. Abra `supabase/seed.sql`, troque `COLE_AQUI_O_UUID_DO_AUTH_USER` pelo UUID copiado, e rode o arquivo no SQL Editor. Isso popula o banco com o mesmo cenário de demonstração (Mel, Thor, Nina...).

### 2.2 Conectar o front-end

1. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
2. Abra `public/supabase-client.js` e preencha:
   ```js
   const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
   const SUPABASE_ANON_KEY = 'sua-anon-key-aqui';
   ```
3. Dê `git commit` + `git push`. A Vercel já publica a versão nova sozinha.

Com isso preenchido, o app passa a **carregar automaticamente** pets, tutores,
consultas, exames, vacinas, agenda e financeiro direto do Supabase assim que a
página abre — sem precisar mudar mais nada nas telas.

### 2.3 O que ainda falta pra estar 100% ligado (próximo passo)

O carregamento (leitura) já fica automático. O que falta é religar cada
**ação de salvar** para também gravar no Supabase (hoje elas só atualizam a
tela, localmente, como no protótipo). O arquivo `supabase-client.js` já traz
um exemplo pronto (`supaInsertExam`) e a lista exata de onde mexer dentro de
`app_part11.js` (a seção de eventos do app), uma ação de cada vez:

| Ação no app | O que fazer |
|---|---|
| Novo atendimento | `INSERT` em `consultations` (+ `exams`/`vaccines`/`payments` se houver) |
| Nova receita | `INSERT` em `prescriptions` |
| Novo exame / vacina avulsos | `INSERT` em `exams` / `vaccines` |
| Registrar pagamento | `UPDATE` em `payments` (status, forma_pagamento...) |
| Confirmar / recusar / concluir / cancelar agendamento | `UPDATE` em `appointments` |
| Fechar dia / bloquear horário | `INSERT`/`DELETE` em `closed_dates` / `blocked_slots` |

Isso pode ser feito aos poucos — o app continua 100% funcional (com dados
locais) entre um passo e outro. Se quiser, me chame de volta aqui e eu religo
essas ações uma a uma com você testando cada uma no seu Supabase real.

### 2.4 Login real dos tutores

Hoje a tela de login tem os botões de demonstração ("Entrar como Dra. Ana" /
"Entrar como Paola"). Depois que a Fase 2 estiver rodando, o próximo passo é
trocar esses botões por um formulário de e-mail/senha de verdade, usando
`supaSignInEmail` (já disponível em `supabase-client.js`). O gatilho
`link_tutor_on_signup` no `schema.sql` já vincula automaticamente um tutor
cadastrado pelo veterinário ao login que ele criar com o mesmo e-mail.

## Dúvidas comuns

- **"Rodei o schema.sql e deu erro de trigger em auth.users"** — normal em
  planos gratuitos mais antigos; rode o arquivo sem a última seção (trigger)
  e faça a vinculação manualmente (`update tutors set user_id = '...' where
  email = '...'`).
- **O site abriu mas os dados continuam sendo os de demonstração** — confira
  se `SUPABASE_URL`/`SUPABASE_ANON_KEY` foram realmente salvos e se o deploy
  mais recente já rodou (veja em Vercel → Deployments).
