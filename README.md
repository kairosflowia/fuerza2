# FUERZA

Fundação técnica do site do FUERZA, obrador artesanal de massa mãe nas Astúrias. A interface pública está escrita em espanhol de Espanha.

## Requisitos

- Node.js 22 LTS
- npm 10 ou superior

## Instalação

```bash
npm install
cp .env.example .env.local
```

Para executar autenticação, preenche as três variáveis Supabase. Nunca coloques secrets ou ficheiros `.env*` reais no Git. `SUPABASE_SERVICE_ROLE_KEY` é exclusivamente server-side e não é necessária para os fluxos normais do cliente.

## Desenvolvimento

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:3000` por omissão.

## Qualidade e produção

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

## Estrutura básica

```text
src/app/       App Router, layout, páginas e estilos globais
src/lib/       Configuração e utilitários partilhados
public/        Ativos estáticos e branding
docs/          Documentação de produto, design e implementação
```

As pastas de componentes, estilos e tipos serão criadas quando tiverem conteúdo real, evitando estrutura vazia prematura.

## Supabase e autenticação

O projeto utiliza apenas os clientes oficiais `@supabase/supabase-js` e `@supabase/ssr`. A sessão é mantida em cookies pelo cliente SSR e renovada através de `src/proxy.ts`. Identidade e autorização no servidor são confirmadas com Supabase Auth; `getSession()` não é usado como decisão de acesso.

Variáveis necessárias:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

No painel Supabase, adiciona os URLs exatos de `/auth/callback` para desenvolvimento, preview e produção à lista de Redirect URLs. Ativa confirmação de email e configura limites de Auth/CAPTCHA adequados antes de produção. O ambiente local já exige passwords com pelo menos oito caracteres e aplica os limites nativos do Supabase Auth.

### Desenvolvimento local e migrações

É necessário Docker em execução. Depois:

```bash
npm run supabase:start
npm run db:reset
npm run test:db
```

`db:reset` aplica todas as migrações e depois `supabase/seed.sql`. O seed não cria utilizadores, credenciais ou dados comerciais. Os testes pgTAP em `supabase/tests/database/` criam identidades fictícias apenas dentro de uma transação revertida no final.

### Funções e primeiro proprietário

Cada conta recebe `customer`. As funções administrativas são `owner`, `admin`, `operator` e `pickup_manager`; as permissões da interface encontram-se centralizadas em `src/lib/auth/permissions.ts` e são reforçadas por RLS.

Para criar o primeiro `owner`, cria e confirma primeiro uma conta normal. Depois, no SQL Editor do projeto, com privilégios administrativos, confirma que o email identifica exatamente uma conta e executa numa transação, substituindo o parâmetro apenas durante a operação:

```sql
begin;
do $$
declare target_user uuid;
begin
  select id into strict target_user from auth.users where email = 'EMAIL_CONFIRMADO_DO_PROPRIETARIO';
  insert into public.user_roles (user_id, role, granted_by)
  values (target_user, 'owner', target_user)
  on conflict (user_id, role) do nothing;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  values (target_user, 'role.assigned.bootstrap', 'user_role', target_user::text, '{"role":"owner"}'::jsonb);
end $$;
commit;
```

Não guardes o email real no repositório. Depois do primeiro proprietário existir, atribuições e remoções elevadas passam pelas funções SQL auditadas e só podem ser executadas por um `owner`.

### Compra futura sem conta

A autenticação é opcional para clientes. O futuro modelo de encomendas deverá aceitar email e telefone de convidado, oferecer uma ligação assinada de consulta e permitir associação posterior somente após verificação do email. Esta fase não cria tabelas de encomendas nem obriga a criar conta.

### Catálogo e imagens de produto

A migração `20260803190000_product_catalog.sql` cria famílias, produtos, variantes, ingredientes, alergénios, imagens, dias habituais de produção e a associação preparada para pontos de recolha. Preços são guardados em cêntimos inteiros; o catálogo público só lê produtos publicados através de RLS.

O bucket privado `product-images` aceita JPEG, PNG, WebP e AVIF até 8 MB. Owner e admin fazem upload pelo painel e a aplicação entrega apenas imagens associadas a produtos publicados. O seed de produção permanece sem produtos fictícios.

Após ligar explicitamente o projeto remoto, aplica migrações com `npx supabase db push`. Nunca uses `db reset` num projeto remoto e confirma primeiro o destino com `npx supabase projects list`.

### Limitações atuais

- Não existe projeto Supabase remoto configurado neste repositório.
- O rate limiting da aplicação não foi duplicado em memória; usam-se os limites nativos do Supabase Auth. CAPTCHA ou proteção adicional de edge deve ser configurada antes do lançamento.
- Gestão visual de utilizadores e alterações de `app_settings` continuam sem CRUD.
- A `SUPABASE_SERVICE_ROLE_KEY` fica preparada apenas para futuros processos administrativos estritamente server-side.

## Documentação

As decisões do projeto estão em [`docs/`](./docs/). O plano de execução encontra-se em [`docs/06-roadmap-de-implementacao.md`](./docs/06-roadmap-de-implementacao.md).

## Vercel

O projeto usa a configuração padrão do Next.js. Na Vercel, o Root Directory deve permanecer na raiz do repositório, onde se encontra o `package.json`; o comando de build é `npm run build`.
