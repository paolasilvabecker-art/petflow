# PetFlow — protótipo de gestão veterinária

Sistema para veterinários e tutores acompanharem consultas, receitas, exames,
vacinas, agenda e financeiro de pets. Front-end em HTML/CSS/JS puro (sem
build), pronto para GitHub + Vercel, com ponte opcional para Supabase.

## Estrutura

```
petflow/
├── index.html                    ← o app inteiro (também funciona sozinho, com dados de demonstração)
├── supabase-client.js            ← ponte opcional com o Supabase (ver Fase 2 abaixo)
├── schema.sql                    ← tabelas + segurança (RLS) — para um banco novo
├── migration_2026-09-11.sql      ← rode uma vez no banco que você já usa (ver abaixo)
├── migration_2026-09-12.sql      ← rode uma vez no banco que você já usa (ver abaixo)
├── seed.sql                      ← dados de demonstração para popular o banco real
├── vercel.json
└── README.md
```

### Atualização de 11/09/2026 — rodar a migração

Se o seu Supabase **já está em produção** (você já rodou `schema.sql` antes),
abra o **SQL Editor** do seu projeto e rode o arquivo `migration_2026-09-11.sql`
uma única vez. Ele só acrescenta colunas/políticas novas (nada é apagado ou
recriado) e é o que faz funcionar: o campo "Exame físico" da consulta, as
observações da receita, e a foto de pet/tutor parar de sumir ao recarregar a
página. Se for um banco novo, `schema.sql` já vem com tudo isso — não precisa
rodar a migração separadamente.

### Atualização de 12/09/2026 — rodar a migração

Mesma coisa: se o seu Supabase já está em produção, rode
`migration_2026-09-12.sql` uma única vez no SQL Editor. Ele só acrescenta uma
função nova (nenhuma tabela/coluna existente é alterada) e é o que faz o(a)
**tutor(a)** conseguir desmarcar um agendamento pela tela inicial do app. Se
for um banco novo, `schema.sql` já vem com tudo isso.

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
   - Como `index.html` está na raiz do repositório, não é preciso configurar nenhum diretório raiz especial no projeto da Vercel.
   - Clique em **Deploy**. Em ~30 segundos você tem uma URL pública.

A partir daqui, todo `git push` na branch `main` gera um novo deploy automático.

## Fase 2 — Ligar ao Supabase (dados reais e login de verdade)

### 2.1 Criar o projeto e as tabelas

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor** → cole e rode o conteúdo de `schema.sql` (cria as tabelas e as políticas de segurança).
3. Vá em **Authentication → Users → Add user** e crie o login da veterinária (e-mail/senha). Copie o **UUID** gerado.
4. Abra `seed.sql`, troque `COLE_AQUI_O_UUID_DO_AUTH_USER` pelo UUID copiado, e rode o arquivo no SQL Editor. Isso popula o banco com o mesmo cenário de demonstração (Mel, Thor, Nina...).

### 2.2 Conectar o front-end

1. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
2. Abra `supabase-client.js` e preencha:
   ```js
   const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
   const SUPABASE_ANON_KEY = 'sua-anon-key-aqui';
   ```
3. Dê `git commit` + `git push`. A Vercel já publica a versão nova sozinha.

Com isso preenchido, o app passa a **carregar automaticamente** pets, tutores,
consultas, exames, vacinas, agenda e financeiro direto do Supabase assim que a
página abre — sem precisar mudar mais nada nas telas.

### 2.3 Login real dos tutores

Hoje a tela de login tem os botões de demonstração ("Entrar como Dra. Ana" /
"Entrar como Paola"). O próximo passo, quando fizer sentido, é trocar esses
botões por um formulário de e-mail/senha de verdade, usando `supaSignInEmail`
(já disponível em `supabase-client.js`). O gatilho `link_tutor_on_signup` no
`schema.sql` já vincula automaticamente um tutor cadastrado pelo veterinário
ao login que ele criar com o mesmo e-mail.

## Dúvidas comuns

- **"Rodei o schema.sql e deu erro de trigger em auth.users"** — normal em
  planos gratuitos mais antigos; rode o arquivo sem a última seção (trigger)
  e faça a vinculação manualmente (`update tutors set user_id = '...' where
  email = '...'`).
- **O site abriu mas os dados continuam sendo os de demonstração** — confira
  se `SUPABASE_URL`/`SUPABASE_ANON_KEY` foram realmente salvos e se o deploy
  mais recente já rodou (veja em Vercel → Deployments).
