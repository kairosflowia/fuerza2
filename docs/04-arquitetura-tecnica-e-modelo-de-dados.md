# FUERZA — Arquitetura Técnica e Modelo de Dados

**Documento 04** · Arquitetura, domínios, modelo de dados e decisões técnicas
Data: 3 de agosto de 2026
Estado: proposta para validação — sem código, sem SQL, sem migrations, sem componentes

**Fontes:**
[Doc 01 — Análise e Direção Criativa](01-analise-e-direcao-criativa.md) ·
[Doc 02 — PRD e Regras de Negócio](02-prd-e-regras-de-negocio.md) ·
[Doc 03 — Sistema de Design](03-sistema-de-design.md)

---

## Nota de leitura

**Âmbito.** Este documento define *o que* o sistema faz e *como se estrutura*. Não escreve código, SQL, migrations nem componentes. Nomes de tabelas, campos e estados são **vocabulário de domínio** — existem para que ninguém os invente durante a implementação.

**Decisões herdadas, já aprovadas.** Condicionam toda a arquitetura:

| Origem | Decisão | Consequência arquitetural |
|---|---|---|
| `DA-01` | Pagamento sempre antecipado; encomenda só confirmada após pagamento; **sem pagamento na recolha** | O webhook do processador é a fronteira de confirmação. Invariante: nenhuma encomenda em `confirmado` ou posterior sem pagamento `pagado` |
| `DA-02` | Horário do obrador 09:00–18:00 | Valor de configuração. **Não é hora-limite** |
| Doc 02 §1.5 | Disponibilidade apresentada é sempre real | Sem cache de stock sem invalidação explícita |
| Doc 02 §14.10 | Nunca aceitar mais reservas do que a capacidade | **Invariante garantido por restrição de base de dados**, não por lógica de aplicação |
| Doc 02 §3.2 | Compra sem conta é caminho de primeira classe | Encomenda não depende de utilizador autenticado |
| Doc 02 §5.4 | Reserva temporária durante o checkout | Modelo de disponibilidade com três contadores |
| Doc 02 §7.9 | Subscrições preparadas desde a fase 1 | Capacidade separada em total / subscrição / avulsa desde o primeiro dia |
| Doc 02 §6 | Pontos externos com horários, dias, produtos e capacidades próprios | Zero valores herdados entre pontos |
| `DP-02` | Hora-limite | **Pendente.** Configurável, nunca codificada |

**Decisões pendentes.** Nenhuma é transformada em aprovada aqui. Onde uma regra comercial falta, o sistema define o *mecanismo* e deixa o *valor* em configuração.

---

# 1. Visão geral da arquitetura

## 1.1 Forma

> **Monólito modular sobre Next.js, com Postgres gerido e três serviços externos.**
> Sem microserviços. Sem filas dedicadas. Sem infraestrutura própria.

A justificação é o objetivo 7 do Doc 02 — simplicidade operacional para uma equipa pequena — com poder de veto sobre elegância arquitetural. Um obrador com um forno e alguns pontos de recolha não tem tráfego que justifique distribuição, e tem muito a perder com sistemas que ninguém consegue depurar sozinho.

## 1.2 Camadas

| Camada | Conteúdo |
|---|---|
| **Frontend público** | Home, catálogo, ficha, obrador, nosotros, subscrições, reservas, dónde estamos, contacto, legais. Maioritariamente estático |
| **Área do cliente** | Próximas recolhas, histórico, detalhe, dados, consentimentos; subscrição na fase 2 |
| **Painel do obrador** | Produção, encomendas, disponibilidade, catálogo, pontos, encerramentos, clientes, exceções |
| **Backend** | Server Actions e Route Handlers dentro da mesma aplicação. **Toda a lógica de negócio vive aqui** |
| **Base de dados** | Postgres gerido (Supabase). Fonte de verdade do domínio e **guardião dos invariantes** |
| **Pagamentos** | Stripe. Fonte de verdade do **estado do pagamento** |
| **Emails** | Resend. Envio assíncrono, nunca bloqueante |
| **Imagens** | Supabase Storage + otimização do Next.js |
| **Autenticação** | Supabase Auth |
| **Tarefas agendadas** | Vercel Cron. **Correção não depende delas** (§24.2) |
| **Integrações externas** | Apenas Stripe e Resend. Mais nenhuma na fase 1 |

## 1.3 Diagrama de fluxo

```
                        ┌──────────────────────────────┐
   Navegador  ────────► │   Next.js (Vercel)           │
   (cliente)            │                              │
                        │  ├─ Páginas públicas (SSG)   │
                        │  ├─ Disponibilidade (dinâm.) │
                        │  ├─ Área do cliente          │
                        │  ├─ Painel do obrador        │
                        │  └─ Camada de domínio        │
                        └───┬───────┬───────┬──────────┘
                            │       │       │
              ┌─────────────┘       │       └───────────────┐
              ▼                     ▼                       ▼
    ┌──────────────────┐   ┌────────────────┐     ┌──────────────────┐
    │ Supabase         │   │ Stripe         │     │ Resend           │
    │  ├─ PostgreSQL   │   │  PaymentIntent │     │  Email transac.  │
    │  ├─ Auth         │   │  Subscriptions │     └──────────────────┘
    │  └─ Storage      │   └───────┬────────┘
    └──────────────────┘           │
              ▲                    │ webhook assinado
              │                    ▼
              │          ┌──────────────────────┐
              └──────────┤ /api/webhooks/stripe │
                         │  FONTE DE VERDADE    │
                         │  do estado do pagam. │
                         └──────────────────────┘

    ┌─────────────────┐
    │  Vercel Cron    │──► expirar reservas · não recolhidos · lembretes
    │  (agendador)    │    reconciliação · entregas de subscrição
    └─────────────────┘
```

**Duas fronteiras de verdade, e não se sobrepõem:**

- **Postgres** é a autoridade sobre o **domínio** — o que existe, quanta capacidade há, em que estado está a encomenda.
- **Stripe** é a autoridade sobre o **pagamento** — se houve dinheiro e quanto.

A reconciliação entre as duas é um processo explícito e monitorizado (§12.5), não uma suposição.

## 1.4 O que deliberadamente não existe

| Ausência | Razão |
|---|---|
| Microserviços | Volume não justifica; custo de depuração intolerável para a equipa |
| Fila de mensagens dedicada | Tabela `notifications` + cron resolve o mesmo com uma dependência a menos |
| Cache distribuída (Redis) | O único dado quente é a disponibilidade, e esse **não deve ser cacheado sem invalidação** |
| API pública | Ninguém a consome |
| Aplicação móvel | Web responsiva cobre os dois perfis de uso |
| CMS externo | §19 — analisado e recusado para as fases 1 e 2 |
| ORM pesado com abstração de queries complexas | Consultas de disponibilidade e produção beneficiam de SQL direto |

---

# 2. Princípios arquiteturais

## 2.1 O servidor é a fonte de verdade

Nenhum valor com significado comercial vem do cliente. Preços, disponibilidade, totais, estados, capacidades e prazos são **sempre** recalculados no servidor a partir da base de dados.

O cliente envia **intenções** — «quero 2 unidades da variante X para a data Y no ponto Z» — nunca **factos**.

## 2.2 Zero confiança em dados do cliente

| O cliente envia | O servidor faz |
|---|---|
| Identificador de variante | Verifica que existe, está ativa e é publicável |
| Quantidade | Verifica contra a disponibilidade real e os limites |
| Data | Verifica as cinco condições de Doc 02 §4.9 **e** a hora-limite |
| Ponto | Verifica estado, capacidade e produtos aceites |
| **Preço** | **Ignora por completo.** Lê da base de dados |
| **Total** | **Ignora por completo.** Recalcula |
| Estado | Nunca aceite; só transições através de operações de domínio |

## 2.3 Operações idempotentes

Toda a operação que possa ser repetida — por retentativa de rede, duplo clique, reenvio de webhook ou nova execução de cron — produz o mesmo resultado que uma execução única.

Mecanismos: chave de idempotência no início do checkout; identificador de evento único do processador; tarefas agendadas desenhadas como reconciliação e não como sequência.

## 2.4 Transações em operações críticas

Operações que tocam mais do que uma tabela e têm de ser tudo-ou-nada:

| Operação | Abrange |
|---|---|
| Criar reserva temporária | Contadores de variante + contadores de ponto + registo de reserva |
| Confirmar encomenda após pagamento | Estados de reserva + encomenda + histórico + registo de pagamento |
| Cancelar encomenda | Estado + libertação de capacidade + reembolso + histórico |
| Alterar limite de capacidade | Verificação contra reservado + atualização + auditoria |
| Gerar ciclo de subscrição | Reserva prioritária + encomendas + entregas |

## 2.5 Disponibilidade calculada no servidor, sempre

Nunca cacheada sem estratégia de invalidação explícita (§26.4). Nunca calculada no cliente. Nunca derivada de um valor enviado pelo navegador.

## 2.6 Complexidade mínima

Regra de decisão: **entre duas soluções que resolvem o problema, escolhe-se a que a equipa consegue depurar às 6 da manhã.**

Aplicações concretas: sem abstrações para um só implementador; sem camada de eventos assíncronos onde uma chamada direta chega; sem generalização de casos que ainda não existem.

## 2.7 Separação entre conteúdo, comércio e operação

Três domínios com ritmos e riscos diferentes, e que não devem partilhar código:

| | Ritmo de alteração | Risco de erro | Onde vive |
|---|---|---|---|
| **Conteúdo** | Raro | Baixo | Repositório + blocos editáveis (§19) |
| **Comércio** | Diário (disponibilidade), semanal (catálogo) | **Alto** — dinheiro e stock | Base de dados + domínio |
| **Operação** | Contínuo | Médio | Base de dados + painel |

## 2.8 Auditabilidade

Toda a ação com impacto comercial ou sobre dados pessoais deixa registo imutável com ator, momento, entidade, valor anterior e valor novo (§23). Não é opcional nem posterior: é parte da operação.

## 2.9 Compatibilidade futura com subscrições

**Cinco defesas** implementadas na fase 1 sem construir a subscrição (Doc 02 §16.4). Detalhadas em §17.9. Todas são decisões de forma com custo próximo de zero agora e custo alto se adiadas.

## 2.10 Invariantes garantidos pela base de dados

O princípio mais importante deste documento:

> **Um invariante que depende de o código estar correto não é um invariante — é uma esperança.**

Os invariantes críticos são impostos por **restrições da base de dados**, para que nenhum defeito da aplicação, nenhuma condição de corrida e nenhuma manipulação administrativa os possa violar:

| Invariante | Como é imposto |
|---|---|
| Reservas nunca excedem a capacidade | Restrição de verificação na linha de disponibilidade (§8.4) |
| Encomenda confirmada tem sempre pagamento pago | Restrição + verificação de reconciliação (§12.5) |
| Um evento do processador é processado uma só vez | Unicidade do identificador de evento |
| Preço da linha é imutável após confirmação | Cópia no momento, não referência |
| Um limite não desce abaixo do reservado | Restrição de verificação (§8.4) |

---

# 3. Estrutura do projeto

## 3.1 Princípio

Estrutura **modular por domínio**, não por tipo de ficheiro. Evita tanto a fragmentação excessiva (uma pasta por conceito) como a pasta única gigante.

**Regra:** um domínio novo só nasce quando tem, no mínimo, dados próprios, operações próprias e invariantes próprios. Caso contrário, vive dentro de um domínio existente.

## 3.2 Organização proposta

```
/
├─ app/                          Rotas (Next.js App Router)
│  ├─ (public)/                  Site público — es-ES
│  │  ├─ pan/ · pan/[slug]/
│  │  ├─ obrador/ · nosotros/
│  │  ├─ suscripciones/ · reservas/
│  │  ├─ donde-estamos/ · contacto/
│  │  └─ legal/
│  ├─ (checkout)/                Fluxo de compra, layout próprio
│  ├─ (auth)/                    Entrar, registar, recuperar
│  ├─ cuenta/                    Área do cliente
│  ├─ admin/                     Painel do obrador
│  └─ api/
│     ├─ webhooks/stripe/        Fronteira de confirmação de pagamento
│     └─ cron/                   Handlers das tarefas agendadas
│
├─ domain/                       NÚCLEO — sem React, sem Next, testável isolado
│  ├─ catalog/
│  ├─ availability/              ← o domínio mais crítico
│  ├─ cart/
│  ├─ checkout/
│  ├─ orders/
│  ├─ payments/
│  ├─ customers/
│  ├─ pickup/
│  ├─ production/
│  ├─ notifications/
│  ├─ subscriptions/             ← estrutura na fase 1, lógica na fase 2
│  └─ shared/                    Dinheiro, datas, resultados, erros de domínio
│
├─ data/                         Acesso a dados — a única camada que fala SQL
│  ├─ repositories/              Uma por agregado
│  ├─ client.ts                  Ligações (privilegiada e de sessão)
│  └─ types.ts                   Tipos gerados do esquema
│
├─ ui/                           Sistema de Design (Doc 03)
│  ├─ tokens/                    Cores, espaço, tipografia, formas
│  ├─ primitives/                Button, Input, Select, Modal, Drawer…
│  ├─ patterns/                  ProductCard, DatePicker, StockIndicator…
│  └─ illustrations/             SVG da marca
│
├─ components/                   Composições específicas de página
├─ emails/                       Templates transacionais em es-ES
├─ content/                      Prosa institucional versionada (§19)
├─ lib/                          Utilitários transversais estritos
├─ types/
├─ config/                       Configuração e variáveis validadas no arranque
├─ supabase/migrations/          Migrações (criadas na implementação)
└─ tests/
   ├─ unit/ · integration/ · e2e/ · a11y/
```

## 3.3 Regras de dependência

**Direção única. Verificada por linter, não por convenção.**

```
app  →  domain  →  data
 ↓                   ↑
ui                Postgres
```

| Regra | |
|---|---|
| `domain/` | **Não importa** React, Next, Stripe SDK nem Supabase SDK. Puro TypeScript |
| `data/` | **A única camada que emite SQL** |
| `ui/` | **Não importa** `domain/` nem `data/`. Recebe dados por props |
| `app/` | Orquestra. Não contém regras de negócio |

O objetivo prático: **as regras de disponibilidade e de estados testam-se sem base de dados, sem rede e sem navegador.** É o que torna os testes de concorrência de §27.7 viáveis.

## 3.4 O que evitar

- Uma pasta por componente com cinco ficheiros dentro.
- Camada de «services» que só reencaminha para «repositories».
- Abstração de base de dados para suportar um motor que nunca será usado.
- Barris de reexportação que escondem o grafo de dependências.

---

# 4. Domínios do sistema

Treze domínios. Formato: **responsabilidade · dados · operações · dependências · invariantes**.

## 4.1 Catálogo

| | |
|---|---|
| **Responsabilidade** | O que existe para vender e como se descreve |
| **Dados** | `product_families`, `products`, `product_variants`, `product_images`, `ingredients`, `allergens`, `product_allergens` |
| **Operações** | Listar publicáveis · obter por slug · criar/editar/publicar/descatalogar · gerir variantes e alergénios |
| **Dependências** | Nenhuma. **É o domínio mais isolado** |
| **Invariantes** | Produto publicado tem ≥1 variante ativa, preço, alergénios confirmados e dias de produção · Slug único e estável · Preço nunca negativo · Alteração de preço não afeta linhas já confirmadas |

## 4.2 Disponibilidade

**O domínio mais crítico do sistema.** Toda a promessa comercial do produto assenta aqui.

| | |
|---|---|
| **Responsabilidade** | Determinar, para cada combinação variante × data × ponto, quantas unidades se podem vender — e garantir que nunca se vendem mais |
| **Dados** | `production_dates`, `availability_limits`, `pickup_point_daily_capacity`, `stock_reservations`, `closures` |
| **Operações** | Calcular disponibilidade · reservar temporariamente · confirmar reserva · libertar reserva · expirar · ajustar capacidade · reservar capacidade de subscrição |
| **Dependências** | Catálogo (variantes), Pontos (capacidade e dias), Encerramentos |
| **Invariantes** | **`held + confirmed + subscription_reserved ≤ capacity_total`** — imposto por restrição de BD · Capacidade nunca reduzida abaixo do já comprometido · Reserva expirada nunca conta como capacidade ocupada (§9.5) · Toda a alteração de contador ocorre dentro de transação |

## 4.3 Carrinho

| | |
|---|---|
| **Responsabilidade** | Guardar a intenção de compra antes de haver compromisso |
| **Dados** | `carts`, `cart_items` |
| **Operações** | Criar · adicionar/remover/alterar item · definir ponto e data · revalidar · fundir após autenticação · expirar |
| **Dependências** | Catálogo, Disponibilidade (leitura), Pontos |
| **Invariantes** | **Carrinho não reserva stock** (Doc 02 §5.4) · Preços revalidados a cada leitura · Um carrinho ativo por sessão ou utilizador |

## 4.4 Checkout

| | |
|---|---|
| **Responsabilidade** | Transformar um carrinho numa encomenda paga, sem perder dinheiro nem sobrevender |
| **Dados** | Não possui tabelas próprias — orquestra Carrinho, Disponibilidade, Encomendas e Pagamentos. Usa `idempotency_keys` |
| **Operações** | Validar · reservar temporariamente · criar encomenda em `pendiente_pago` · iniciar pagamento · confirmar · reverter |
| **Dependências** | **Todas as anteriores.** É o ponto de maior acoplamento e por isso o mais testado |
| **Invariantes** | Nenhuma encomenda passa a `confirmado` sem pagamento confirmado pelo webhook (`DA-01`) · Falha em qualquer passo liberta a capacidade · Repetição não duplica encomendas |

## 4.5 Encomendas

| | |
|---|---|
| **Responsabilidade** | Registo do compromisso e do seu ciclo de vida |
| **Dados** | `orders`, `order_items`, `order_status_history` |
| **Operações** | Criar · transitar estado · cancelar · consultar por código, cliente, data ou ponto |
| **Dependências** | Clientes, Pontos, Catálogo (cópia de dados), Disponibilidade |
| **Invariantes** | Linhas guardam **cópia** de nome, variante e preço — nunca referência viva · Só transições válidas (§13) · `confirmado` e posteriores implicam pagamento pago · Código de recolha único na janela ativa |

## 4.6 Pagamentos

| | |
|---|---|
| **Responsabilidade** | Refletir fielmente o estado do dinheiro e reconciliá-lo com as encomendas |
| **Dados** | `payments`, `refunds`, `webhook_events` |
| **Operações** | Iniciar · processar webhook · reembolsar total/parcial · reconciliar · detetar duplicações |
| **Dependências** | Encomendas, Stripe |
| **Invariantes** | **Webhook é a fonte de verdade** · Um evento processado uma só vez · Reembolso nunca superior ao pago · Pagamento sem encomenda e encomenda sem pagamento geram exceção, nunca silêncio |

## 4.7 Clientes

| | |
|---|---|
| **Responsabilidade** | Identidade, dados pessoais e consentimentos |
| **Dados** | `users`, `customer_profiles`, `user_roles`, `consent_records` |
| **Operações** | Criar convidado · registar · autenticar · vincular encomendas anteriores · editar · exportar · eliminar/anonimizar |
| **Dependências** | Supabase Auth |
| **Invariantes** | **Encomenda não exige conta** (Doc 02 §3.2) · Vinculação de histórico só após verificação de email · Consentimento de marketing sempre explícito e revogável · Eliminação preserva o mínimo legal, anonimizado |

## 4.8 Pontos de recolha

| | |
|---|---|
| **Responsabilidade** | Onde e quando se levanta, com capacidade e restrições próprias por ponto |
| **Dados** | `pickup_points`, `pickup_point_schedules`, `pickup_point_exceptions`, `product_pickup_points`, `pickup_point_daily_capacity` |
| **Operações** | Listar disponíveis para um carrinho e data · gerir horários, janelas, capacidades e exceções · ativar/desativar |
| **Dependências** | Catálogo, Encerramentos |
| **Invariantes** | **Nenhum valor herdado entre pontos** (Doc 02 §6) · Ponto com encomendas ativas não pode ser desativado (Doc 02 §5.12) · Janela contida no horário do próprio ponto · Encerramento global vence sobre calendário de ponto |

## 4.9 Produção

| | |
|---|---|
| **Responsabilidade** | Dizer ao obrador o que fazer e para onde levar |
| **Dados** | `production_batches`, `pickup_batches` |
| **Operações** | Gerar mapa por data · totais por produto/variante/ponto · marcar preparado · marcar lote entregue · exportar e imprimir |
| **Dependências** | Encomendas (leitura), Pontos |
| **Invariantes** | **Totais derivados de encomendas confirmadas, nunca mantidos à mão** (Doc 02 §9.2) · Estado de preparação nunca contradiz o estado da encomenda · Marcação em lote é atómica |

## 4.10 Notificações

| | |
|---|---|
| **Responsabilidade** | Comunicar eventos ao cliente e à equipa, sem nunca bloquear o domínio |
| **Dados** | `notifications`, `email_events` |
| **Operações** | Enfileirar · enviar · retentar · registar falha · consultar histórico |
| **Dependências** | Todos os domínios (leitura de eventos), Resend |
| **Invariantes** | **Falha de email nunca altera estado de domínio** (Doc 02 §15 caso 12) · Cada evento gera no máximo uma notificação por destinatário · Marketing exige consentimento válido no momento do envio |

## 4.11 Subscrições — fase 2

| | |
|---|---|
| **Responsabilidade** | Compra recorrente com stock garantido |
| **Dados** | `subscriptions`, `subscription_items`, `subscription_deliveries` |
| **Operações** | Criar · gerar ciclo · pausar/retomar/saltar/cancelar · tratar falha e recuperação de pagamento |
| **Dependências** | Disponibilidade (**prioridade de stock**), Encomendas, Pagamentos, Clientes, Pontos |
| **Invariantes** | **Capacidade de subscrição reservada antes da abertura à venda avulsa** (Doc 02 §7.9) · Pausa não afeta entregas já geradas · Falha de pagamento suspende, **nunca cancela** · Alteração de preço não afeta ciclo já cobrado |

## 4.12 Conteúdo

| | |
|---|---|
| **Responsabilidade** | Prosa institucional e blocos editáveis |
| **Dados** | Ficheiros em `content/` + `content_blocks` |
| **Operações** | Ler prosa versionada · ler/editar blocos operacionais |
| **Dependências** | Nenhuma |
| **Invariantes** | **Zero texto marcador em produção** (Doc 02 §13.9) — verificado em CI |

## 4.13 Administração

| | |
|---|---|
| **Responsabilidade** | Autorização, auditoria e fila de exceções |
| **Dados** | `user_roles`, `audit_logs`, `operational_exceptions` |
| **Operações** | Verificar permissão · registar ação · abrir/resolver exceção |
| **Dependências** | Transversal |
| **Invariantes** | Toda a ação com impacto comercial é auditada · Registo de auditoria é **imutável** · Exceção nunca se fecha sozinha |

---

# 5. Modelo de dados

39 entidades. **Sem SQL.** Formato: finalidade · campos · relações · restrições · índices · fase.

## 5.1 Identidade e clientes

### `users`
- **Finalidade:** conta autenticável. Gerida pelo Supabase Auth.
- **Campos:** id · email · email_verified_at · created_at · last_sign_in_at
- **Relações:** 1–1 `customer_profiles`; 1–N `user_roles`, `orders`, `carts`, `subscriptions`
- **Restrições:** email único · **encomenda não exige utilizador**
- **Índices:** email (único)
- **Fase 1**

### `customer_profiles`
- **Finalidade:** dados pessoais do cliente, com ou sem conta.
- **Campos:** id · user_id (nulo para convidado) · full_name · email · phone · marketing_consent · created_at · anonymized_at
- **Relações:** N–1 `users`; 1–N `orders`, `consent_records`
- **Restrições:** email obrigatório · perfil sem `user_id` é convidado · anonimização preserva a linha
- **Índices:** email · user_id
- **Fase 1**

### `user_roles`
- **Finalidade:** autorização. Suporta os quatro perfis do Doc 02 §3.
- **Campos:** id · user_id · role (`customer` | `operator` | `admin` | `point_manager`) · pickup_point_id (só para `point_manager`) · granted_by · granted_at
- **Restrições:** `point_manager` exige ponto · um papel por utilizador e âmbito · atribuição auditada
- **Índices:** user_id · (role, pickup_point_id)
- **Fase 1** (`point_manager` ativo na fase 2)

### `consent_records`
- **Finalidade:** prova auditável de consentimento (RGPD).
- **Campos:** id · customer_profile_id · type (`marketing` | `cookies` | `terms`) · granted · text_version · source · ip_hash · occurred_at
- **Restrições:** **imutável** — revogar cria nova linha
- **Índices:** (customer_profile_id, type, occurred_at)
- **Fase 1**

## 5.2 Catálogo

### `product_families`
- **Finalidade:** agrupamento de primeiro nível e classificação cromática (Doc 03 §3.6).
- **Campos:** id · name · slug · description · color_token · display_order · status
- **Restrições:** slug único · **cor é classificação visual, não regra comercial**
- **Fase 1** · *Taxonomia real: `DP-09`, pendente*

### `products`
- **Finalidade:** unidade de catálogo. Estrutura derivada da etiqueta física da marca.
- **Campos:** id · family_id · name · slug · short_description · long_description · **flour_type** · flour_origin · **fermentation_hours** · status (`draft`|`active`|`seasonal`|`unavailable`|`discontinued`) · production_weekdays · display_order · seo_title · seo_description · created_at · updated_at
- **Relações:** N–1 família; 1–N variantes, imagens, alergénios; N–N pontos
- **Restrições:** slug único e estável · **publicação bloqueada** sem ≥1 variante ativa, preço, alergénios confirmados e dias de produção (Doc 02 §4.2) · `discontinued` mantém URL
- **Índices:** slug (único) · (status, family_id) · production_weekdays
- **Fase 1**

### `product_variants`
- **Finalidade:** unidade que se reserva, tem preço e tem stock.
- **Campos:** id · product_id · name · **weight_grams** · **price_cents** · currency · is_default · status · display_order
- **Restrições:** produto sem variantes declaradas tem **uma variante implícita única** — modelo uniforme, nunca dois caminhos (Doc 02 §4.3) · `price_cents` inteiro ≥ 0
- **Índices:** (product_id, status)
- **Fase 1**

### `product_images`
- **Finalidade:** galeria com ordem e texto alternativo obrigatório.
- **Campos:** id · product_id · storage_path · **alt_text_es** · width · height · is_primary · display_order
- **Restrições:** **`alt_text_es` obrigatório** se não for decorativa (Doc 03 §7.4) · uma primária por produto · dimensões obrigatórias (CLS)
- **Fase 1** · *Justificação: Doc 03 §8.5 exige proporções, dimensões e alt geridos por imagem*

### `ingredients`
- **Finalidade:** lista de ingredientes por produto, ordenada por peso.
- **Campos:** id · product_id · name_es · display_order
- **Restrições:** ordem por peso decrescente (requisito de rotulagem)
- **Fase 1**

### `allergens`
- **Finalidade:** **lista fechada** dos 14 alergénios do anexo II do Regulamento (UE) 1169/2011.
- **Campos:** id · code · name_es · display_order
- **Restrições:** **tabela de referência, não editável pelo painel** · não é campo de texto livre (Doc 02 §4.5)
- **Fase 1**

### `product_allergens`
- **Finalidade:** declaração legal por produto, com dois graus.
- **Campos:** product_id · allergen_id · **presence** (`contains` | `may_contain`) · confirmed_by · confirmed_at
- **Restrições:** distinção obrigatória entre presença e contaminação cruzada · **confirmação explícita e auditada** ao publicar ou alterar
- **Índices:** (product_id)
- **Fase 1** · *Responsabilidade legal é do FUERZA, não do sistema*

## 5.3 Pontos de recolha

### `pickup_points`
- **Finalidade:** obrador e parceiros, no mesmo modelo.
- **Campos:** id · name · type (`obrador`|`external`) · slug · address_line · postal_code · city · latitude · longitude · pickup_instructions_es · **opening_hours** · status (`active`|`temporarily_unavailable`|`inactive`|`coming_soon`) · manager_name · manager_contact · display_order
- **Restrições:** **`opening_hours` nunca herdado** — obrador `DA-02` 09:00–18:00; externos os seus próprios · **desativação bloqueada com encomendas ativas** (Doc 02 §5.12) · `manager_contact` nunca público
- **Índices:** slug (único) · status
- **Fase 1** · *Valores reais: `DP-25`, pendente*

### `pickup_point_schedules`
- **Finalidade:** padrão semanal — **dias de recolha, janela e capacidade** (conceitos distintos do horário).
- **Campos:** id · pickup_point_id · weekday · **window_start** · **window_end** · **capacity_units**
- **Restrições:** **janela contida no horário do ponto** · ausência de linha = não há recolha nesse dia · capacidade por omissão zero (`DP-15`)
- **Índices:** (pickup_point_id, weekday)
- **Fase 1**

### `pickup_point_exceptions`
- **Finalidade:** sobreposições pontuais ao padrão semanal.
- **Campos:** id · pickup_point_id · date · type (`closed`|`extra_opening`|`capacity_override`) · window_start · window_end · capacity_units · note
- **Restrições:** vence sobre o padrão semanal · **encerramento global vence sobre esta**
- **Índices:** (pickup_point_id, date) único
- **Fase 1**

### `product_pickup_points`
- **Finalidade:** que produtos cada ponto aceita.
- **Campos:** product_id · pickup_point_id · created_at
- **Restrições:** **por omissão, produto novo só no obrador** — adicionar pontos é ação explícita (Doc 02 §4.11)
- **Índices:** (pickup_point_id, product_id)
- **Fase 1**

### `closures`
- **Finalidade:** calendário **global** de encerramentos e feriados.
- **Campos:** id · date · reason_es · created_by · created_at
- **Restrições:** **precedência máxima** — bloqueia todas as datas em todos os pontos (Doc 02 §6.9) · feriados introduzidos manualmente, nunca calculados
- **Índices:** date (único)
- **Fase 1**

## 5.4 Disponibilidade — o núcleo

### `production_dates`
- **Finalidade:** que datas existem como dia de produção e o seu estado de abertura.
- **Campos:** id · date · **cutoff_at** · is_open · notes
- **Relações:** 1–N `availability_limits`
- **Restrições:** **`cutoff_at` calculado a partir de configuração (`DP-02`), nunca codificado** · resolvido em `Europe/Madrid` com DST · data fechada não aceita novas reservas
- **Índices:** date (único) · (is_open, date)
- **Fase 1**

### `availability_limits`
- **Finalidade:** **capacidade e contadores por variante × data.** A tabela mais crítica do sistema.
- **Campos:** id · variant_id · production_date · **capacity_total** · **qty_subscription_reserved** · **qty_held** · **qty_confirmed** · updated_at
- **Restrições:**
  - **`qty_held + qty_confirmed + qty_subscription_reserved ≤ capacity_total`** — *restrição de verificação; torna a sobrevenda impossível ao nível do armazenamento*
  - Todos os contadores ≥ 0
  - `capacity_total` **nunca reduzível abaixo** de `qty_held + qty_confirmed + qty_subscription_reserved` — a mesma restrição garante-o
  - Contadores só alterados dentro de transação
- **Índices:** (variant_id, production_date) **único** · production_date
- **Fase 1** · *Os quatro contadores separados desde a fase 1 são a **defesa n.º 1** de compatibilidade com subscrições (§17.9)*

### `pickup_point_daily_capacity`
- **Finalidade:** contadores de capacidade **por ponto × data** — limite de nível 2 (Doc 02 §4.10).
- **Campos:** id · pickup_point_id · production_date · **capacity_total** · qty_held · qty_confirmed · updated_at
- **Restrições:** mesma restrição de verificação da entidade anterior · `capacity_total` derivada do horário ou da exceção, materializada aqui
- **Índices:** (pickup_point_id, production_date) único
- **Fase 1** · *Entidade acrescentada: sem ela, o limite de ponto não é atómico*

### `stock_reservations`
- **Finalidade:** reserva temporária durante o checkout; converte-se ou liberta-se.
- **Campos:** id · **token** · cart_id · order_id · variant_id · production_date · pickup_point_id · quantity · status (`held`|`converted`|`released`|`expired`) · **expires_at** · payment_in_progress · created_at
- **Restrições:** criada na entrada da revisão (Doc 02 §5.4) · **expiração é lida, não apenas varrida** (§9.5) · `payment_in_progress` protege contra expiração durante o pagamento · converte para `converted` só com pagamento confirmado
- **Índices:** token (único) · (status, expires_at) · cart_id · order_id
- **Fase 1**

## 5.5 Carrinho

### `carts`
- **Finalidade:** intenção de compra. **Não reserva stock.**
- **Campos:** id · session_token · user_id · pickup_point_id · production_date · status (`active`|`converted`|`abandoned`|`expired`) · created_at · last_activity_at · expires_at
- **Restrições:** anónimo ou autenticado · fusão após autenticação (§10.4) · **nunca representa compromisso**
- **Índices:** session_token · user_id · (status, expires_at)
- **Fase 1**

### `cart_items`
- **Finalidade:** linhas do carrinho.
- **Campos:** id · cart_id · variant_id · quantity · **price_cents_snapshot** · added_at
- **Restrições:** preço é **fotografia informativa**, revalidada a cada leitura e **nunca usada para cobrar** (§2.2)
- **Índices:** cart_id
- **Fase 1**

## 5.6 Encomendas

### `orders`
- **Finalidade:** o compromisso.
- **Campos:** id · **public_code** · customer_profile_id · user_id · pickup_point_id · production_date · pickup_window_start · pickup_window_end · status · **origin** (`standalone`|`subscription`) · subscription_id · **subtotal_cents** · **tax_cents** · **total_cents** · currency · customer_notes · created_at · confirmed_at · picked_up_at · cancelled_at
- **Restrições:** `public_code` único na janela ativa · **`confirmado` e posteriores implicam pagamento `pagado`** (`DA-01`) · janela **copiada** do ponto no momento — não referência viva · **`origin` preenchido desde a fase 1** (defesa n.º 2, §17.9)
- **Índices:** public_code (único) · (production_date, pickup_point_id) · (status, production_date) · customer_profile_id · (origin, subscription_id)
- **Fase 1**

### `order_items`
- **Finalidade:** linhas com **cópia** dos dados no momento da compra.
- **Campos:** id · order_id · variant_id · **product_name_snapshot** · **variant_name_snapshot** · **weight_grams_snapshot** · quantity · **unit_price_cents** · **line_total_cents** · fulfilled_quantity
- **Restrições:** **cópia, nunca referência viva** — alteração de preço ou nome não altera histórico (Doc 02 §4.7) · `fulfilled_quantity` suporta falta parcial na entrega (Doc 02 §15 caso 15)
- **Índices:** order_id · variant_id
- **Fase 1**

### `order_status_history`
- **Finalidade:** linha temporal auditável de estados.
- **Campos:** id · order_id · from_status · to_status · actor_type (`customer`|`operator`|`admin`|`system`|`webhook`) · actor_id · reason · occurred_at
- **Restrições:** **imutável** · toda a transição regista uma linha (§13)
- **Índices:** (order_id, occurred_at)
- **Fase 1**

## 5.7 Pagamentos

### `payments`
- **Finalidade:** espelho local do estado do pagamento no Stripe.
- **Campos:** id · order_id · **provider_payment_intent_id** · status (`pendiente`|`autorizado`|`pagado`|`fallido`|`cancelado`|`parcialmente_reembolsado`|`reembolsado`) · **amount_cents** · **amount_refunded_cents** · currency · payment_method_summary · failure_reason · created_at · paid_at
- **Restrições:** **1 encomenda ↔ 1 pagamento** na fase 1 · `provider_payment_intent_id` único · **estado atualizado apenas por webhook** (§12.2) · `amount_refunded_cents ≤ amount_cents`
- **Índices:** order_id (único) · provider_payment_intent_id (único) · (status, created_at)
- **Fase 1**

### `refunds`
- **Finalidade:** devoluções totais e parciais, com motivo.
- **Campos:** id · payment_id · provider_refund_id · **amount_cents** · **reason** · type (`full`|`partial`) · initiated_by · status · created_at
- **Restrições:** **motivo obrigatório** · soma nunca superior ao pago · sempre para o método original
- **Índices:** payment_id · provider_refund_id (único)
- **Fase 1**

### `webhook_events`
- **Finalidade:** **desduplicação e rastreabilidade** de eventos do processador.
- **Campos:** id · **provider_event_id** · event_type · payload · status (`received`|`processed`|`failed`|`ignored`) · processing_error · received_at · processed_at
- **Restrições:** **`provider_event_id` único** — é o que garante idempotência (§12.3) · payload guardado para reprocessamento
- **Índices:** provider_event_id (único) · (status, received_at)
- **Fase 1** · *Entidade acrescentada: sem ela não há idempotência real de webhooks*

### `idempotency_keys`
- **Finalidade:** impedir duplicação em operações iniciadas pelo cliente.
- **Campos:** id · key · scope · request_hash · response_snapshot · created_at · expires_at
- **Restrições:** chave única por âmbito · repetição devolve o resultado guardado, não reexecuta
- **Índices:** (scope, key) único
- **Fase 1** · *Entidade acrescentada: exigida por Doc 02 §10.8*

## 5.8 Produção

### `production_batches`
- **Finalidade:** estado de preparação por variante × data.
- **Campos:** id · production_date · variant_id · **planned_quantity** · prepared_quantity · status (`pending`|`in_progress`|`ready`) · prepared_by · prepared_at
- **Restrições:** **`planned_quantity` derivada de encomendas confirmadas, nunca introduzida à mão** (Doc 02 §9.2) · recalculada enquanto a data estiver aberta
- **Índices:** (production_date, variant_id) único
- **Fase 1**

### `pickup_batches`
- **Finalidade:** lote transportado para um ponto numa data.
- **Campos:** id · production_date · pickup_point_id · status (`pending`|`in_transit`|`delivered`) · **total_units** · delivered_by · delivered_at
- **Restrições:** marcação em lote é **atómica** — todas as encomendas transitam juntas (Doc 02 §9.4) · não existe para o obrador principal
- **Índices:** (production_date, pickup_point_id) único
- **Fase 1**

## 5.9 Notificações

### `notifications`
- **Finalidade:** fila de comunicações — **assíncrona por desenho**.
- **Campos:** id · event_type · recipient_type · recipient_email · related_entity_type · related_entity_id · **payload** · status (`queued`|`sending`|`sent`|`failed`|`cancelled`) · attempts · last_error · scheduled_for · sent_at
- **Restrições:** **enfileirar nunca falha a operação de domínio** (Doc 02 §15 caso 12) · um evento gera no máximo uma notificação por destinatário · marketing exige consentimento válido **no momento do envio**
- **Índices:** (status, scheduled_for) · (related_entity_type, related_entity_id) · (event_type, recipient_email)
- **Fase 1**

### `email_events`
- **Finalidade:** retorno do fornecedor — entrega, devolução, reclamação.
- **Campos:** id · notification_id · provider_message_id · event (`delivered`|`bounced`|`complained`|`opened`) · payload · occurred_at
- **Restrições:** devolução permanente marca o contacto para verificação · **nenhum evento altera estado de encomenda**
- **Índices:** notification_id · provider_message_id
- **Fase 1**

## 5.10 Subscrições — estrutura na fase 1, lógica na fase 2

### `subscriptions`
- **Finalidade:** o Plan de Pan de um cliente.
- **Campos:** id · customer_profile_id · user_id · **provider_subscription_id** · plan_type · **frequency** · usual_pickup_point_id · usual_weekday · status (`borrador`|`activa`|`pausada`|`pago_fallido`|`impagada`|`cancelacion_programada`|`cancelada`) · **price_cents** · currency · current_period_start · current_period_end · paused_until · cancel_at · created_at
- **Restrições:** falha de pagamento **suspende, nunca cancela** (Doc 02 §7.14) · alteração de preço não afeta ciclo cobrado · cancelamento autónomo obrigatório
- **Índices:** customer_profile_id · (status, current_period_end) · provider_subscription_id (único)
- **Fase 2** *(tabelas criadas na fase 1, vazias)*

### `subscription_items`
- **Finalidade:** conteúdo do plano.
- **Campos:** id · subscription_id · variant_id · family_id · quantity · selection_mode (`fixed_product`|`family_choice`)
- **Restrições:** `family_choice` implica escolha do obrador antes de cada entrega
- **Fase 2**

### `subscription_deliveries`
- **Finalidade:** entrega planeada de um ciclo; liga plano a encomenda.
- **Campos:** id · subscription_id · **planned_date** · actual_date · pickup_point_id · **order_id** · status (`planned`|`generated`|`skipped`|`moved`|`cancelled`|`fulfilled`) · skip_reason · created_at
- **Restrições:** data inválida **desloca para a seguinte válida** com notificação (Doc 02 §7.8) · saltar só até à hora-limite · pausa afeta apenas entregas **não geradas**
- **Índices:** (subscription_id, planned_date) · (planned_date, status) · order_id
- **Fase 2**

## 5.11 Administração e conteúdo

### `audit_logs`
- **Finalidade:** registo imutável de ações com impacto comercial ou pessoal.
- **Campos:** id · **actor_type** · actor_id · **action** · **entity_type** · entity_id · **before_value** · **after_value** · reason · source (`admin_ui`|`api`|`cron`|`webhook`) · ip_hash · occurred_at
- **Restrições:** **imutável — sem atualização nem eliminação** · motivo obrigatório em reembolso, cancelamento pelo obrador, alteração de preço e redução de limite
- **Índices:** (entity_type, entity_id, occurred_at) · (actor_id, occurred_at) · (action, occurred_at)
- **Fase 1** · *Retenção: `DP-55`, pendente*

### `operational_exceptions`
- **Finalidade:** fila de casos que exigem decisão humana (Doc 02 §9.3, §15).
- **Campos:** id · type · severity (`critical`|`warning`) · related_entity_type · related_entity_id · description · **suggested_actions** · status (`open`|`resolved`|`dismissed`) · resolved_by · resolution_note · created_at · resolved_at
- **Restrições:** **nunca se fecha sozinha** · `critical` gera alerta imediato · contagem visível em permanência no painel
- **Índices:** (status, severity, created_at)
- **Fase 1** · *Entidade acrescentada: exigida por Doc 02 §10.4, §14.11 e nove casos de §15*

### `content_blocks`
- **Finalidade:** os poucos textos que o obrador edita sem programador (§19.4).
- **Campos:** id · key · **content_es** · updated_by · updated_at
- **Restrições:** conjunto **pequeno e fechado** de chaves · prosa longa vive no repositório, não aqui
- **Índices:** key (único)
- **Fase 1**

## 5.12 Resumo

| Grupo | Entidades | Fase 1 | Fase 2 |
|---|---:|---:|---:|
| Identidade e clientes | 4 | 4 | — |
| Catálogo | 7 | 7 | — |
| Pontos de recolha | 5 | 5 | — |
| Disponibilidade | 4 | 4 | — |
| Carrinho | 2 | 2 | — |
| Encomendas | 3 | 3 | — |
| Pagamentos | 4 | 4 | — |
| Produção | 2 | 2 | — |
| Notificações | 2 | 2 | — |
| Subscrições | 3 | *(criadas)* | 3 |
| Administração e conteúdo | 3 | 3 | — |
| **Total** | **39** | **36** | **3** |

**Sete entidades acrescentadas** à lista pedida, todas exigidas por regras já aprovadas: `product_images`, `pickup_point_daily_capacity`, `webhook_events`, `idempotency_keys`, `user_roles`, `operational_exceptions`, `content_blocks`.

---

# 6. Identificadores e convenções

## 6.1 Chaves

| Convenção | Regra |
|---|---|
| Chave primária | **UUID v7** — ordenável no tempo, boa localidade de índice, sem revelar volume de negócio |
| Identificador interno | Nunca exposto em URL pública |
| Referências | Sempre por UUID; **nunca por slug** |

**Porquê não inteiros sequenciais:** `/pedido/47` revela que houve 47 encomendas. UUID v7 dá a ordenação sem a fuga de informação.

## 6.2 Slugs

- Minúsculas, hífenes, sem acentos, gerados do nome em es-ES com revisão manual.
- **Únicos e estáveis.** Alteração cria redirecionamento permanente automático (Doc 02 §13.6).
- Produto descatalogado **mantém o slug** — nunca 404.

## 6.3 Código público de recolha

| Aspeto | Regra |
|---|---|
| Formato | `FZ-` + 4 caracteres, sem ambíguos (0/O, 1/I/l) — `DP-24`, pendente |
| Geração | Aleatório, verificado contra colisão na janela ativa |
| Unicidade | Dentro de uma janela razoável; não perpétua |
| **Natureza** | **Não é credencial.** Não dá acesso a dados pessoais (Doc 02 §5.13) |
| Proteção | Limitação de taxa na pesquisa; sem enumeração (§21.6) |

## 6.4 Datas e horas

**A distinção mais importante e mais fácil de errar:**

| Tipo | Uso | Exemplos |
|---|---|---|
| **Instante** (`timestamptz`, UTC) | Momentos absolutos | `created_at`, `confirmed_at`, `expires_at`, `cutoff_at` |
| **Data de negócio** (`date`, sem fuso) | Dias operacionais | `production_date`, `planned_date`, data de encerramento |
| **Hora do dia** (`time`) | Padrões recorrentes | `window_start`, `window_end`, horário do ponto |

**Regras:**
- Armazenamento **sempre em UTC**; conversão para `Europe/Madrid` apenas na apresentação e no cálculo de regras de negócio.
- Uma data de produção **não é um instante** — é um dia de trabalho. Comparar com `now()` sem converter é um defeito.
- `cutoff_at` é a **resolução** de (data de produção + configuração de hora-limite) num instante concreto, **com mudança de hora tratada**. Calculado e materializado; nunca inferido em tempo de leitura.
- Toda a apresentação em es-ES: `dd/mm/aaaa`, relógio de 24 horas.

## 6.5 Valores monetários

> **Inteiros em cêntimos. Nunca vírgula flutuante. Nunca decimal em ponto flutuante.**

| Regra | |
|---|---|
| Armazenamento | Inteiro, cêntimos (`price_cents`, `total_cents`) |
| Moeda | Coluna explícita, `EUR` |
| Cálculo | Aritmética inteira; arredondamento **explícito** e documentado no ponto exato onde ocorre |
| Apresentação | Formatado em es-ES: **`12,50 €`** (Doc 03 §4.7) |
| IVA | Incluído no preço ao consumidor. Enquadramento por produto: `DP-12`, pendente |
| Nomenclatura | Todo o campo monetário termina em `_cents` — **torna impossível confundir unidades por descuido** |

## 6.6 Quantidades

Inteiros não negativos. Unidades, nunca fracionadas. Peso em gramas, inteiro (`weight_grams`), comunicado como aproximado.

## 6.7 Nomes internos

| Elemento | Convenção |
|---|---|
| Tabelas | `snake_case`, plural, inglês |
| Colunas | `snake_case`, inglês |
| **Estados visíveis ao cliente** | **espanhol** — `confirmado`, `en_preparacion`, `listo`, `recogido` |
| Estados internos | inglês — `held`, `converted`, `released` |
| Campos de texto voltados ao cliente | sufixo `_es` |

> **A mistura é deliberada.** Os estados da encomenda são vocabulário partilhado com o cliente e com o obrador, e aparecem em espanhol na interface (Doc 02 §5.14). Traduzi-los internamente criaria um mapeamento a manter e uma fonte de erro. Os estados puramente técnicos ficam em inglês.

## 6.8 Estados

Conjuntos fechados, validados na base de dados. Transições **apenas** através de operações de domínio (§13). Nenhum estado é escrito diretamente por uma rota.

## 6.9 Eliminação lógica

| Entidade | Estratégia |
|---|---|
| Produtos | `status = discontinued` — **nunca eliminados** (histórico e URL) |
| Pontos | `status = inactive` — nunca eliminados |
| Encomendas | **Nunca eliminadas** |
| Clientes | **Anonimização**, não eliminação — preserva integridade referencial e retenção legal (§22.5) |
| Carrinhos e reservas expiradas | Eliminação física após retenção curta |
| Registos de auditoria | Nunca eliminados dentro do prazo de retenção |

## 6.10 Versionamento de registos

**Não há versionamento genérico.** Duas estratégias específicas:

1. **Cópia no momento** — encomendas guardam nome, variante e preço copiados. Torna o histórico imune a alterações de catálogo, sem tabela de versões.
2. **Registo de alterações** — `audit_logs` guarda valor anterior e novo. Permite reconstruir quando é preciso, sem custo permanente.

---

# 7. Disponibilidade

O domínio que sustenta a promessa comercial. **Regra fundadora (Doc 02 §1.5): a disponibilidade apresentada é sempre a real.**

## 7.1 As cinco categorias de capacidade

Separação exigida por Doc 02 §7.9 e implementada **desde a fase 1**, mesmo antes de existirem subscrições.

| Categoria | Campo | Significado |
|---|---|---|
| **Total** | `capacity_total` | Quanto o obrador consegue produzir nessa data |
| **Reservada para subscrições** | `qty_subscription_reserved` | Comprometido com assinantes **antes** da abertura pública |
| **Temporariamente bloqueada** | `qty_held` | Reservas de checkout em curso, não expiradas |
| **Confirmada** | `qty_confirmed` | Encomendas pagas |
| **Disponível para venda avulsa** | *(derivada)* | `total − subscription_reserved − held − confirmed` |

**A quinta é sempre calculada, nunca armazenada.** Armazená-la criaria uma segunda fonte de verdade que se dessincroniza.

## 7.2 Fórmula funcional

Uma combinação **variante × data × ponto** é reservável na quantidade `q` se **todas** as condições se verificarem:

```
  1. A data existe como dia de produção e o produto produz-se nesse dia
        production_dates.date existe
        E product.production_weekdays inclui o dia da semana
        E não existe exceção que suspenda a produção

  2. A data não está encerrada
        NÃO existe closures(date)                     ← precedência máxima
        E NÃO existe pickup_point_exceptions(ponto, date, 'closed')

  3. O ponto opera nessa data
        existe pickup_point_schedules(ponto, dia_da_semana)
          OU pickup_point_exceptions(ponto, date, 'extra_opening')
        E pickup_point.status = 'active'

  4. O ponto aceita o produto
        existe product_pickup_points(produto, ponto)

  5. A hora-limite não passou
        agora() < production_dates.cutoff_at          ← DP-02, configurável

  6. Há capacidade de VARIANTE
        q ≤ capacity_total
            − qty_subscription_reserved
            − qty_held_não_expiradas
            − qty_confirmed

  7. Há capacidade de PONTO
        q ≤ point.capacity_total
            − point.qty_held_não_expiradas
            − point.qty_confirmed
```

**Todas as sete são obrigatórias.** Falhar uma torna a combinação indisponível — mas **o motivo é registado e devolvido**, porque a interface tem de o comunicar com a alternativa correspondente (Doc 03 §11.1).

## 7.3 Motivos de indisponibilidade

O cálculo devolve sempre um motivo tipificado, mapeado diretamente para os oito estados de Doc 03 §11.2:

| Condição falhada | Motivo | Alternativa que a interface oferece |
|---|---|---|
| 1 | `not_produced` | Outra data |
| 2 | `closed` | Outra data |
| 3 | `point_not_operating` | Outro ponto ou outra data |
| 4 | `product_not_accepted` | Outro ponto |
| 5 | `cutoff_passed` | Próxima data válida |
| 6 | `variant_sold_out` | **Outra data** |
| 7 | `point_full` | **Outro ponto, mesma data** |

> **Distinguir 6 de 7 é o requisito mais importante desta secção.** São situações com causas e saídas opostas — num caso o cliente muda de dia, no outro muda de sítio. Confundi-las obriga-o a procurar sozinho (Doc 02 §5.7).

## 7.4 Expiração lida, não apenas varrida

**Decisão arquitetural com consequência desproporcionada:**

> A consulta de disponibilidade **ignora sempre** reservas cujo `expires_at` já passou, independentemente do seu `status` registado.

Consequência: **a correção da disponibilidade não depende de a tarefa agendada correr.** Se o cron falhar durante horas, nenhuma capacidade fica presa — as reservas expiradas deixam de contar no instante em que expiram, ao nível da consulta.

A tarefa de limpeza (§24.2) passa a ser **higiene, não correção**. É a mitigação principal do risco «falha de tarefa agendada» (§32.5).

## 7.5 Reserva de capacidade para subscrições

Fase 2, mas o mecanismo existe desde a fase 1:

1. Ao gerar um ciclo, o domínio de subscrições **incrementa `qty_subscription_reserved`** para cada variante × data.
2. Esse incremento respeita a mesma restrição de verificação — **uma subscrição nunca pode sobrevender** (Doc 02 §15 caso 7).
3. A venda avulsa lê a capacidade **já líquida** dessa reserva.
4. Se a geração não couber, **falha explicitamente** e abre uma exceção crítica. Nunca falha em silêncio, nunca sobrevende.

Na fase 1, `qty_subscription_reserved` é sempre zero — **mas a coluna, a fórmula e a restrição já existem.** Introduzi-las depois obrigaria a rever todo o motor.

## 7.6 Consultas típicas

| Consulta | Uso | Nota de desempenho |
|---|---|---|
| Disponibilidade de uma variante num intervalo | Calendário da ficha | Uma consulta por intervalo, nunca uma por dia |
| Disponibilidade do catálogo numa data | `/pan` filtrado por dia | Uma consulta agregada para todas as variantes |
| Pontos válidos para um carrinho e data | Checkout | Uma consulta com junção; nunca N+1 |
| Próxima data disponível de uma variante | Mensagens de esgotado | Índice em (variant_id, production_date) |

---

# 8. Proteção contra sobrevenda

O requisito não funcional mais crítico do sistema (Doc 02 §14.10).

## 8.1 O cenário

Dois clientes chegam simultaneamente à revisão do pedido com uma unidade restante. **Exatamente um pode ficar com ela.** O outro tem de receber recusa imediata, clara e com alternativa. Nunca ambos.

## 8.2 Comparação de abordagens

| Abordagem | Como funciona | A favor | Contra |
|---|---|---|---|
| **Bloqueio otimista** | Coluna de versão; lê, calcula, escreve se a versão não mudou; repete em caso de conflito | Sem bloqueios mantidos; bom com contenção baixa | Sob disputa da última unidade a contenção é **alta por definição** — produz repetições em cascata e latência imprevisível no momento exato em que a experiência importa mais |
| **Bloqueio pessimista** | `SELECT … FOR UPDATE` na linha de disponibilidade dentro de transação | Correto e simples de raciocinar; contenção naturalmente baixa (uma linha por variante × data) | Mantém bloqueio durante a transação; risco de impasse com várias linhas se a ordem não for determinística |
| **Atualização atómica condicional** | Uma instrução que incrementa o contador **com a condição do invariante na própria cláusula de filtro**; zero linhas afetadas = sem capacidade | **Uma ida à base de dados**; atómica pelo bloqueio de linha do Postgres; sem versão, sem repetições, sem bloqueio explícito | Exige que a condição esteja correta — e é por isso que se duplica com uma restrição |

## 8.3 Abordagem recomendada

> ### Atualização atómica condicional, dentro de transação, com restrição de verificação como rede de segurança.

**Mecanismo, em três camadas:**

**Camada 1 — atualização atómica condicional.**
Incrementar `qty_held` numa única instrução cuja cláusula de filtro exige que o invariante continue verdadeiro depois do incremento. Se nenhuma linha for afetada, não há capacidade: rejeição limpa, sem exceção, sem repetição. O bloqueio de linha do Postgres serializa naturalmente os concorrentes.

**Camada 2 — transação abrangendo variante e ponto.**
A reserva toca duas famílias de contadores (variante × data e ponto × data) e, com vários itens, várias linhas. Tudo dentro de **uma transação**. Se qualquer incremento falhar, reverte-se por completo — nunca fica capacidade parcialmente comprometida.

**Camada 3 — restrição de verificação na base de dados.**
`qty_held + qty_confirmed + qty_subscription_reserved ≤ capacity_total`, imposta pela própria tabela.

> **É esta terceira camada que satisfaz o critério de aprovação n.º 1.** Mesmo que um defeito da aplicação, uma migração mal feita, uma alteração manual no painel ou um script de manutenção tentem violar o invariante, **a base de dados recusa a escrita**. A sobrevenda deixa de ser improvável e passa a ser **impossível ao nível do armazenamento**.

## 8.4 Prevenção de impasses

Com vários itens no carrinho, várias linhas são atualizadas na mesma transação. Se duas transações as tocarem em ordens opostas, bloqueiam-se mutuamente.

**Regra obrigatória:** **as linhas são sempre atualizadas por ordem determinística** — identificador de variante ascendente, e as linhas de ponto depois das de variante, sempre. Ordem igual em todas as transações elimina o impasse por construção.

## 8.5 Redução de limite pelo administrador

Doc 02 §15 caso 13: reduzir `capacity_total` abaixo do já comprometido é **recusado**.

Não é preciso lógica adicional: **a mesma restrição de verificação rejeita a operação.** A camada de aplicação apanha a rejeição e traduz numa mensagem útil — «Ya hay [n] unidades reservadas para el [fecha]» — em vez de um erro técnico.

## 8.6 Validação em três momentos

| Momento | Onde | Natureza |
|---|---|---|
| Catálogo e ficha | Servidor, leitura | Informativa |
| Entrada na revisão | Servidor, **escrita atómica** | **Vinculativa** — cria a reserva |
| Confirmação do pagamento | Servidor, transação | **Final** — converte a reserva |

A validação no cliente é **conveniência, nunca garantia** (§2.2).

## 8.7 Idempotência do checkout

Duplo clique, retentativa de rede ou reenvio do formulário **não podem** criar duas reservas.

Mecanismo: chave de idempotência gerada na entrada da revisão, guardada em `idempotency_keys`. Repetição com a mesma chave devolve o resultado da primeira execução, sem reexecutar.

---

# 9. Reserva temporária de stock

## 9.1 Momento de criação

**Entrada no passo 5 — revisão do pedido** (Doc 02 §5.4).

**Não ao adicionar ao carrinho.** Com stock diário pequeno, isso estrangularia a disponibilidade: carrinhos abandonados bloqueariam unidades durante minutos. Reservar quando o cliente demonstra intenção real é o equilíbrio correto.

## 9.2 Duração

> **Configurável. Valor final `DP-19`, pendente** — recomendação de Doc 02: 15 minutos.

Armazenado em configuração de aplicação, **nunca codificado**. Alterável sem implantação.

## 9.3 Token e associações

| Aspeto | Regra |
|---|---|
| **Token** | Opaco, aleatório, sem significado. Devolvido ao cliente para retomar a reserva |
| **Carrinho** | Toda a reserva nasce ligada a um carrinho |
| **Sessão** | Herdada do carrinho — funciona com e sem conta (`DA-01` + Doc 02 §3.2) |
| **Encomenda** | Ligada quando a encomenda em `pendiente_pago` é criada |

## 9.4 Prolongamento durante o pagamento

Ao iniciar o pagamento, a reserva é **prolongada uma vez** e marcada com `payment_in_progress`.

**Efeito:** a tarefa de expiração **ignora** reservas com pagamento em curso, dentro de um limite de segurança. Evita o cenário em que a reserva expira enquanto o cliente está a introduzir os dados do cartão.

**Se ainda assim expirar e o pagamento for bem-sucedido** — Doc 02 §15 casos 17 e 21: entra em `operational_exceptions` com gravidade crítica e alerta imediato. O administrador decide entre cumprir (se houver capacidade) ou reembolsar na totalidade. **O cliente nunca fica sem pão e sem dinheiro.**

## 9.5 Expiração

**Dois mecanismos complementares** — e o primeiro é o que garante correção:

| Mecanismo | Papel |
|---|---|
| **Expiração à leitura** | Toda a consulta de disponibilidade **ignora** reservas com `expires_at` no passado (§7.4). **É esta que garante correção** |
| **Tarefa de limpeza** | Marca `expired`, liberta contadores e encerra a encomenda em `pendiente_pago`. **É higiene, não correção** |

> **A correção não depende do agendador.** Se a tarefa falhar, nenhuma capacidade fica presa. É a mitigação mais valiosa deste documento.

## 9.6 Ciclo de vida

```
   [entrada na revisão]
            │
            ▼
        ┌────────┐  pagamento confirmado    ┌───────────┐
        │  held  │─────────────────────────►│ converted │  (definitiva)
        └────────┘                          └───────────┘
            │
            ├── abandono explícito ─────────►┌──────────┐
            │                                │ released │
            ├── falha definitiva ───────────►└──────────┘
            │
            └── prazo esgotado ─────────────►┌─────────┐
                                             │ expired │
                                             └─────────┘
```

**Nos três desfechos negativos o resultado material é o mesmo:** a capacidade volta ao mercado e não há encomenda (Doc 02 §5.11).

## 9.7 Conversão

Ocorre **apenas** no processamento do webhook de pagamento bem-sucedido, dentro de uma transação que:

1. Verifica que a reserva ainda é válida.
2. Move a quantidade de `qty_held` para `qty_confirmed`, na variante **e** no ponto.
3. Marca a reserva como `converted`.
4. Transita a encomenda de `pendiente_pago` para `confirmado`.
5. Regista o histórico de estado e a auditoria.
6. **Enfileira** as notificações — não as envia.

Tudo ou nada.

---

# 10. Carrinho

## 10.1 Natureza

> **O carrinho é intenção, não compromisso. Não reserva stock.**

## 10.2 Anónimo e autenticado

| | Anónimo | Autenticado |
|---|---|---|
| Identificação | Token de sessão em cookie assinado | `user_id` |
| Persistência | Duração do cookie | Permanente até converter ou expirar |
| Validade | Configurável, curta | Configurável, mais longa |

## 10.3 Persistência

No servidor, na base de dados. **Não em armazenamento local do navegador** — o cliente pode mudar de dispositivo, e o preço e a disponibilidade têm de ser sempre revalidados no servidor (§2.2).

## 10.4 Fusão após autenticação

Se existirem carrinho anónimo e carrinho do utilizador:

1. Os itens do anónimo são acrescentados ao do utilizador.
2. Itens repetidos somam quantidades, **até ao máximo disponível**.
3. Ponto e data: prevalece a escolha **mais recente**.
4. Itens que se tornem inválidos são assinalados, **nunca removidos em silêncio**.
5. O carrinho anónimo é marcado como fundido.

## 10.5 Revalidação

**A cada leitura** — não apenas no checkout:

| Verificação | Ação se falhar |
|---|---|
| Variante ainda ativa | Assinalar item |
| Preço inalterado | **Atualizar e avisar visivelmente** |
| Disponibilidade na data | Assinalar com motivo e alternativa |
| Ponto aceita o produto | Assinalar (§10.7) |
| Hora-limite não passou | Assinalar e propor a data seguinte |

**Nunca remover em silêncio.** O cliente decide sempre.

## 10.6 Mudança de ponto ou de data

Revalida todos os itens contra as sete condições de §7.2. Conflitos são apresentados **antes** de a mudança se confirmar, com escolha explícita.

## 10.7 Produtos incompatíveis

Doc 02 §4.11: ao mudar para um ponto que não aceita um item, o cliente escolhe entre remover o item ou manter o ponto anterior. **Sem remoção automática.**

## 10.8 Preços

`price_cents_snapshot` em `cart_items` é **informativo**, para detetar alterações e avisar. **Nunca é usado para cobrar** — o valor cobrado lê-se sempre de `product_variants` no momento de criar a encomenda.

---

# 11. Checkout

## 11.1 Sequência técnica

| # | Passo | Onde | Falha ⇒ |
|---|---|---|---|
| 1 | **Validar carrinho** | Servidor | Devolve ao carrinho com itens assinalados |
| 2 | **Validar preços** | Servidor, lidos da BD | Atualiza e pede confirmação explícita |
| 3 | **Validar data** | Servidor, §7.2 cond. 1, 2, 5 | Propõe a data válida seguinte |
| 4 | **Validar ponto** | Servidor, §7.2 cond. 3, 4 | Propõe ponto alternativo |
| 5 | **Validar capacidade** | Servidor, §7.2 cond. 6, 7 | Motivo tipificado + alternativa |
| 6 | **Criar reserva temporária** | **Transação atómica** (§8.3) | Sem capacidade: recusa limpa. Reverte tudo |
| 7 | **Criar encomenda `pendiente_pago`** | Transação | Liberta a reserva |
| 8 | **Iniciar pagamento** | Stripe | Mantém a reserva; permite nova tentativa |
| 9 | **Receber confirmação** | **Webhook** | Reserva expira normalmente; encomenda encerra |
| 10 | **Confirmar encomenda** | Transação (§9.7) | Exceção crítica; **nunca perde o pagamento** |
| 11 | **Converter stock** | Mesma transação do 10 | Idem |
| 12 | **Enfileirar notificações** | Após confirmar | **Nunca bloqueia.** Falha fica na fila |

## 11.2 Nota sobre os passos 9 a 11

**O passo 9 é a fronteira de confirmação.** O retorno do navegador **não confirma nada** — pode perder-se, repetir-se ou ser forjado. A encomenda só passa a `confirmado` quando o webhook assinado chega e é processado (§12.2).

**Consequência para a experiência:** entre pagar e receber o webhook há um intervalo, geralmente curto. O ecrã de confirmação consulta o estado real; se ainda estiver pendente, mostra estado de espera com mensagem honesta, **nunca uma confirmação falsa**.

## 11.3 Reversão

Falha nos passos 1–8: a reserva é libertada e a encomenda em `pendiente_pago` encerra. Sem cobrança.

Falha nos passos 9–11 **com pagamento bem-sucedido**: **nunca se reverte automaticamente.** Abre exceção crítica e alerta imediato; a decisão é humana (Doc 02 §15 casos 3 e 21).

> **Assimetria deliberada:** antes do dinheiro, o sistema reverte sozinho. Depois do dinheiro, o sistema **para e chama uma pessoa**.

## 11.4 Idempotência

Chave gerada na entrada da revisão, presente em todos os passos 6–8. Repetição devolve o resultado guardado (§8.7).

---

# 12. Pagamentos com Stripe

Especificação **funcional**. Sem integração.

## 12.1 Payment Intent

- Criado no passo 8, com o valor **calculado no servidor** (§2.2).
- Referência cruzada: identificador da encomenda nos metadados; identificador do intento em `payments`.
- **Captura imediata** — recomendação de Doc 02 §10.3 (`DP-47`, pendente). A alternativa de autorizar e capturar mais tarde colide com reservas feitas com semanas de antecedência: as autorizações caducam antes.

## 12.2 O webhook é a fonte de verdade

> **Regra inviolável.** Nenhuma encomenda passa a `confirmado` com base no retorno do navegador.

| Evento | Efeito |
|---|---|
| Pagamento bem-sucedido | Transação de conversão (§9.7); encomenda → `confirmado` |
| Pagamento falhado | `payments` → `fallido`; notificação; reserva segue o seu curso |
| Pagamento cancelado | Liberta reserva; encomenda → `cancelado` |
| Reembolso criado | `refunds` e `payments` atualizados |
| Disputa | Exceção crítica; alerta imediato |

**Assinatura verificada em todos os eventos.** Evento não assinado é descartado e registado como tentativa de intrusão.

## 12.3 Idempotência

**Dois níveis:**

| Nível | Mecanismo |
|---|---|
| **Saída** (para o Stripe) | Chave de idempotência em criação de intentos e reembolsos |
| **Entrada** (do Stripe) | `provider_event_id` **único** em `webhook_events`. Evento já processado é reconhecido e ignorado |

O mesmo evento recebido cinco vezes produz **uma** encomenda confirmada e **um** registo de pagamento (Doc 02 §17.5, CA-Pg2).

## 12.4 Ordem de chegada

Webhooks podem chegar fora de ordem ou atrasados.

**Regras:** o processamento é **convergente, não sequencial** — cada evento leva o estado local ao estado que descreve, sem assumir que os anteriores já chegaram. Um evento mais antigo que o estado atual é registado e ignorado. Um evento cujo objeto local ainda não existe é **retido e retentado**, nunca descartado.

## 12.5 Reconciliação

Tarefa periódica que compara os dois lados e alimenta `operational_exceptions` (Doc 02 §14.11):

| Divergência | Gravidade | Ação |
|---|---|---|
| Pago sem encomenda confirmada | **Crítica** | Alerta imediato |
| Encomenda confirmada sem pagamento pago | **Crítica** | Alerta imediato — viola `DA-01` |
| Reserva expirada com pagamento bem-sucedido | **Crítica** | Alerta; cliente nunca perde o pago |
| Reservas somam mais do que a capacidade | **Crítica** | Viola o invariante de §8.3 |
| Pagamento duplicado | Aviso | Reembolso automático do segundo |
| Encomenda em `pendiente_pago` há muito tempo | Aviso | Encerramento automático |

## 12.6 Pagamentos duplicados

Bloqueio do botão após o primeiro envio; chave de idempotência; deteção na reconciliação. **O segundo pagamento é reembolsado automaticamente** e o caso entra em exceções (Doc 02 §10.8).

## 12.7 Reembolsos

| Cenário | Automático |
|---|---|
| Cliente cancela dentro do prazo | ✓ Total |
| Obrador cancela | ✓ Total |
| Ponto encerra e cliente recusa alternativa | ✓ Total |
| Item em falta na entrega | ✗ Parcial, decisão do administrador |
| Não recolhido | ✗ Conforme `DP-22`, pendente |
| Pagamento duplicado | ✓ Total do segundo |

**Reembolso parcial exige motivo obrigatório** e fica auditado. Sempre para o método original.

> Com `DA-01`, **toda a encomenda cancelada depois de confirmada envolve dinheiro já cobrado.** O reembolso deixa de ser exceção e passa a ser o mecanismo normal de reversão — tem de ser fiável e observável.

## 12.8 Recibos e faturas

Recibo em todas as encomendas pagas, por email e na conta. Fatura com dados fiscais a pedido — `DP-43`, pendente. Numeração e requisitos fiscais — `DP-48`, pendente, dependente de assessoria fiscal do FUERZA.

## 12.9 Erros e segurança

- **Nenhum dado de cartão** toca os sistemas do FUERZA. Apenas referências do processador.
- Erros do processador traduzidos em mensagens humanas em es-ES (Doc 03 §18.3); **nunca códigos técnicos ao cliente**.
- Chaves secretas apenas no servidor, nunca no pacote enviado ao navegador.
- Endpoint de webhook com limitação de taxa e verificação de assinatura antes de qualquer processamento.

---

# 13. Estados da encomenda

## 13.1 Máquina de estados

```
   borrador
      │ criar encomenda
      ▼
  pendiente_pago ──── falha/abandono/expiração ────► cancelado
      │ webhook: pagamento bem-sucedido                  │
      ▼                                                  │
  confirmado ──────────── cancelamento ──────────────────┤
      │                                                  │
      ▼                                                  │
  en_preparacion ──────── cancelamento ──────────────────┤
      │                                                  │
      ▼                                                  ▼
    listo ───────────────────────────────────────►  reembolsado
      │  ├──────────────► en_punto ──┐
      │                              │
      ├──────────────────────────────┼─► recogido  (terminal de sucesso)
      │                              │
      └──────────────────────────────┴─► no_recogido ──► reembolsado
                                              ▲ │
                                              └─┘ reversão auditada (admin)
```

## 13.2 Tabela de transições

| # | Origem → Destino | Ator | Condição | Efeitos | Notificação | Auditoria |
|---|---|---|---|---|---|---|
| 1 | `borrador` → `pendiente_pago` | sistema | Reserva criada | Encomenda criada; reserva ligada | — | ✓ |
| 2 | `pendiente_pago` → `confirmado` | **webhook** | **Pagamento pago** | `held`→`confirmed`; código gerado; lote atualizado | 1 «Tu pan está reservado» | ✓ |
| 3 | `pendiente_pago` → `cancelado` | sistema | Falha, abandono ou expiração | Reserva libertada | 9 «Tu pedido no se ha completado» | ✓ |
| 4 | `confirmado` → `en_preparacion` | operador | Data ≤ hoje | Lote em curso | — | ✓ |
| 5 | `confirmado` → `cancelado` | cliente | **Antes da hora-limite** (`DP-08`) | Capacidade libertada; **reembolso total automático** | 5 «Pedido cancelado» | ✓ |
| 6 | `confirmado` → `cancelado` | admin | **Motivo obrigatório** | Capacidade libertada; reembolso total | 6 «No podemos preparar tu pedido» | ✓ |
| 7 | `en_preparacion` → `listo` | operador | Preparado | Lote pronto | 3 «Tu pan ya está listo» | ✓ |
| 8 | `en_preparacion` → `cancelado` | admin | Motivo obrigatório | Reembolso total | 6 | ✓ |
| 9 | `listo` → `en_punto` | operador | **Só ponto externo**; lote entregue | Lote inteiro transita, **atómico** | 3 «Ya está en [punto]» | ✓ |
| 10 | `listo` → `recogido` | operador | **Só obrador**; código verificado | Terminal de sucesso | — | ✓ |
| 11 | `en_punto` → `recogido` | operador / responsável | Código verificado (`DP-27`) | Terminal de sucesso | — | ✓ |
| 12 | `listo`/`en_punto` → `no_recogido` | sistema | Janela + tolerância (`DP-21`) | Contabilizado como desperdício; reincidência sinalizada | 8 «Ayer no pudimos entregarte tu pan» | ✓ |
| 13 | `no_recogido` → `listo` | **admin** | Cliente aparece; produto existe | **Única reversão permitida** | — | ✓ **obrigatória** |
| 14 | `cancelado` → `reembolsado` | sistema/admin | Reembolso processado | `payments` atualizado | 5 ou 6 | ✓ |
| 15 | `no_recogido` → `reembolsado` | admin | Discricionário (`DP-22`) | Motivo obrigatório | — | ✓ |
| 16 | `recogido` → `reembolsado` | admin | Reclamação; excecional | Motivo obrigatório | — | ✓ |

## 13.3 Regras de integridade

| Regra | |
|---|---|
| **Transições fechadas** | Só as 16 acima. Qualquer outra é rejeitada pelo domínio |
| **`confirmado` implica pago** | Transição 2 só ocorre por webhook. **Nenhum perfil do painel a pode forçar** (`DA-01`) |
| **Estado a partir de `confirmado` é sempre pago** | Consequência: quem entrega no balcão nunca verifica se há algo a cobrar |
| **Uma só reversão** | Transição 13, exclusiva do administrador, sempre auditada |
| **Toda a transição gera histórico** | `order_status_history`, imutável |
| **Cancelamento com dois efeitos** | De encomenda paga gera reembolso; de `pendiente_pago` não gera nada |
| **`en_punto` só em pontos externos** | No obrador, `listo` → `recogido` diretamente |

## 13.4 Concorrência

Transições são feitas com bloqueio da linha da encomenda dentro de transação. Dois operadores a marcar a mesma encomenda: o segundo obtém o estado já atualizado e a operação é **idempotente** — marcar como preparado o que já está preparado não é erro.

---

# 14. Pontos de recolha

## 14.1 Modelo único

Obrador e parceiros partilham o **mesmo modelo**. Não existe caminho especial para «a loja» e outro para «os pontos» — essa separação criaria dívida no momento exato em que o negócio quisesse crescer, que é o objetivo 5 do Doc 02.

**Diferenças de comportamento, e são só duas:**
1. `obrador` não tem estado `en_punto` — `listo` → `recogido` diretamente.
2. `obrador` não tem lote de distribuição.

## 14.2 Zero herança de valores

> **Premissa obrigatória (Doc 02 §6):** o sistema não assume que dois pontos partilham dias, horários, produtos ou capacidade.

| Atributo | Regra |
|---|---|
| Horário | Do próprio ponto. Obrador: **09:00–18:00** (`DA-02`). Externos: os seus |
| Dias de recolha | Linhas em `pickup_point_schedules`. **Ausência = não há recolha** |
| Janela | Por dia da semana; contida no horário do próprio ponto |
| Capacidade | Por dia da semana, com sobreposição por data |
| Produtos aceites | Explícitos. **Produto novo só no obrador por omissão** |

**Um ponto criado sem configuração não opera.** É a opção conservadora: um obrador prefere um cliente que não conseguiu comprar a um compromisso que não consegue cumprir.

## 14.3 Três conceitos distintos

O ponto de confusão mais caro do produto (Doc 02 §6.3, Doc 03 §12.6):

| Conceito | Significado | Condiciona o calendário? |
|---|---|---|
| **Horário de abertura** | Quando o estabelecimento está aberto | **Não** — é conteúdo |
| **Dias de recolha** | Em que dias o FUERZA entrega ali | **Sim** |
| **Janela de recolha** | Intervalo dentro do dia para levantar | **Sim** |

Modelados em campos **separados**, nunca derivados uns dos outros.

## 14.4 Precedência de calendário

```
1. closures (global)              ← vence sempre; não há produção
2. pickup_point_exceptions        ← sobrepõe-se ao padrão do ponto
3. pickup_point_schedules         ← padrão semanal
```

## 14.5 Capacidade

Materializada em `pickup_point_daily_capacity` por (ponto, data), a partir do horário ou da exceção. **Materializar é necessário** para que o incremento seja atómico (§8.3) — calcular em tempo de leitura impossibilitaria a garantia.

Geração: pela tarefa agendada, com antecedência, e ao criar a primeira reserva de uma data ainda não materializada.

## 14.6 Desativação bloqueada

**Regra estruturante (Doc 02 §5.12):** um ponto não pode ser desativado enquanto tiver encomendas ativas. O painel bloqueia e apresenta as encomendas afetadas, exigindo resolução explícita — transferir com consentimento do cliente, ou cancelar com reembolso total.

## 14.7 Lotes de distribuição

`pickup_batches`, um por (data, ponto externo). Agrupa as encomendas transportadas. A marcação de entrega é **em lote e atómica** — marcar 40 encomendas uma a uma não acontece na prática, e um sistema que não é usado produz dados falsos (Doc 02 §9.4).

## 14.8 Responsável do ponto

Contacto interno, **nunca publicado**. Utilizador de painel com papel `point_manager`, âmbito restrito ao seu ponto e às datas relevantes — **fase 2** (`DP-06`, pendente).

---

# 15. Produção

## 15.1 Princípio

> **Totais derivados de encomendas confirmadas. Nunca mantidos à mão.**

Um contador manual paralelo dessincroniza-se, e a partir daí o obrador deixa de confiar no sistema — o que é pior do que não ter sistema.

## 15.2 Mapa de produção

Para uma data, agregações derivadas das encomendas em `confirmado` ou posterior:

| Vista | Agregação | Uso |
|---|---|---|
| **Por produto** | Soma de quantidades por variante | A lista que vai para o forno |
| **Por variante** | Detalhe com peso e ordem de fabrico | Planeamento da amassadura |
| **Por ponto** | Soma por ponto, com detalhe por produto | A lista que vai na carrinha |
| **Encomendas** | Lista com código, cliente, itens, ponto, estado | Preparação e resolução |

## 15.3 Materialização

`production_batches` e `pickup_batches` guardam o **estado operacional** — preparado, entregue — e uma **cópia** dos totais no momento do fecho da data.

**Enquanto a data estiver aberta, os totais são recalculados a cada consulta.** Depois da hora-limite, congelam. Isto suporta o requisito de Doc 02 §17.7: quem imprime uma lista de uma data ainda aberta **tem de ser avisado** de que a lista pode mudar.

## 15.4 Impressão e exportação

**Requisito de primeira classe** — é a forma como a informação chega ao forno (Doc 03 §16.4). Vista dedicada, sem navegação, preto sobre branco, com quebras corretas, cabeçalho com data e hora de impressão, e casas de verificação. Exportação CSV para a mesma agregação.

## 15.5 Coerência com os estados

O estado de preparação **nunca contradiz** o estado da encomenda. Marcar um lote como preparado transita as encomendas correspondentes; um estado de lote sem correspondência nas encomendas é uma inconsistência detetada pela verificação periódica (§24.7).

---

# 16. Clientes e autenticação

## 16.1 Compra sem conta

**Caminho de primeira classe, não caso degradado** (Doc 02 §3.2).

- Cria `customer_profiles` sem `user_id`.
- Acesso à encomenda por **ligação assinada com prazo**, enviada ao email da encomenda.
- O código de recolha **não é credencial** e não dá acesso a dados pessoais.

## 16.2 Criação de conta e vinculação

Oferecida **depois** da confirmação, quando o cliente já tem valor em mãos.

**Vinculação de histórico:** encomendas anteriores associadas ao mesmo email são ligadas à nova conta **apenas após verificação do email** — nunca por simples coincidência de endereço (Doc 02 §3.2). É uma superfície de fuga de dados evidente se for feita de outra forma.

## 16.3 Autenticação

Supabase Auth. Email e palavra-passe, com recuperação por email. Ligação mágica como alternativa a avaliar — reduz uma superfície de risco (palavras-passe) mas depende inteiramente da entrega de email.

Sessões com expiração; renovação silenciosa; expiração mais curta no painel.

## 16.4 Papéis

| Papel | Âmbito | Fase |
|---|---|---|
| `customer` | Os seus próprios dados | 1 |
| `operator` | Produção e estados operacionais; **sem preços nem dados financeiros** | 1 |
| `admin` | Total, incluindo reembolsos e gestão de utilizadores | 1 |
| `point_manager` | **Apenas o seu ponto** e as datas relevantes | 2 |

**Minimização aplica-se internamente:** `operator` não vê totais nem dados financeiros porque não precisa deles para produzir.

## 16.5 Modelo de autorização — decisão importante

> **Recomendação: toda a lógica de negócio e todo o acesso a dados passam pelo servidor da aplicação. O navegador nunca fala diretamente com a base de dados.**

**Porquê.** Um invariante como «nunca sobrevender» **não pode** ser garantido a partir do cliente. A reserva atómica, a validação de preços e as transições de estado exigem transações do lado do servidor. Usar o Supabase como base de dados gerida — e não como serviço de acesso direto pelo navegador — é o que torna os invariantes de §2.10 possíveis.

**Consequência:** a segurança em linha (RLS) é **defesa em profundidade**, não o portão principal.

## 16.6 Segurança em linha — nível conceptual

*Sem políticas SQL. Apenas o modelo.*

| Princípio | |
|---|---|
| **Negar por omissão** | Toda a tabela com segurança em linha ativa e sem acesso concedido por omissão |
| **Ligação privilegiada** | Usada apenas pela camada de domínio no servidor, nunca exposta ao navegador |
| **Âmbito do cliente** | Um cliente autenticado só alcança linhas cujo perfil lhe pertence |
| **Âmbito do operador** | Leitura de encomendas e produção; sem colunas financeiras |
| **Âmbito do responsável de ponto** | Apenas encomendas do seu ponto, apenas datas relevantes |
| **Auditoria** | Apenas inserção. **Sem atualização, sem eliminação, para ninguém** |
| **Tabelas de referência** | Leitura pública apenas do que é publicável |

**Teste de aceitação:** com as credenciais de um cliente, nenhuma consulta direta devolve dados de outro cliente, encomendas de outros, capacidades, custos ou registos de auditoria (§27.9).

---

# 17. Subscrições

**Fase 2. Arquitetura definida agora** para que a fase 1 não a bloqueie.

## 17.1 Modelo

Depende de `DP-28` — **pendente**. A recomendação registada no Doc 02 §7.3 é **frequência fixa**, por servir o objetivo de previsibilidade e por se resolver com os mecanismos nativos do processador. A arquitetura abaixo assume esse modelo; a alternativa de crédito exigiria um livro de saldos com reconciliação própria, e essa complexidade é a razão principal para a não recomendar.

## 17.2 Estrutura

| Elemento | Onde |
|---|---|
| Plano, frequência, preço, estado | `subscriptions` |
| Conteúdo (produto ou família) | `subscription_items` |
| Ponto e dia habituais | `subscriptions` |
| Entregas planeadas | `subscription_deliveries` |
| Encomendas geradas | `orders` com `origin = 'subscription'` |

## 17.3 Cobrança

Delegada ao Stripe Subscriptions: ciclo, renovação, falha e recuperação são nativos. O sistema **reage** aos eventos, não os orquestra — é o que evita construir um motor de faturação.

## 17.4 Geração de entregas

Por ciclo, com antecedência suficiente para alimentar o planeamento (`DP-31`, pendente):

1. Calcular as datas do ciclo a partir da frequência e do dia habitual.
2. Validar cada data contra encerramentos, dias do ponto e dias de produção.
3. **Reservar a capacidade** — incrementar `qty_subscription_reserved` (§7.5).
4. Criar as encomendas em `confirmado`, com `origin = 'subscription'`.
5. Notificar o cliente do conteúdo e das datas.

**Data inválida:** desloca para a seguinte válida, com notificação (Doc 02 §7.8).
**Sem capacidade:** **falha explicitamente**, exceção crítica, alerta. Nunca sobrevende, nunca falha em silêncio.

## 17.5 Prioridade de stock

> **A regra que dá valor real ao Plan de Pan.** A capacidade das subscrições é reservada **antes** de a disponibilidade ser aberta à venda avulsa (Doc 02 §7.9).

Sem ela, a subscrição é apenas um débito automático sem contrapartida. Com ela, o assinante nunca fica sem o seu pão porque a venda pública o esgotou.

Mecanismo: a venda avulsa lê `capacity_total − qty_subscription_reserved − …`. A separação existe **desde a fase 1**.

## 17.6 Pausa, salto e cancelamento

| Ação | Efeito |
|---|---|
| **Pausar** | Suspende geração e cobrança. **Não afeta entregas já geradas** — a interface diz isso antes de confirmar (Doc 02 §15 caso 8) |
| **Saltar** | Cancela uma entrega concreta, até à hora-limite. Efeito no pagamento: `DP-32`, pendente |
| **Cancelar** | Autónomo, sem contactar ninguém. Efeito: `DP-35`, pendente. Entregas pagas cumprem-se |

## 17.7 Falha de pagamento

**Suspende, nunca cancela.** `pago_fallido` → recuperação → `impagada` se esgotar. Durante a recuperação **não se geram novas reservas**; as já geradas e pagas cumprem-se. Recuperação bem-sucedida devolve a `activa`.

Cancelar automaticamente por falha de pagamento destruiria a relação por um problema técnico.

## 17.8 Alteração de preço

Aviso prévio obrigatório (`DP-37`, pendente — recomendação de 30 dias, a validar juridicamente), com direito de cancelar sem custo. Ciclos já cobrados nunca são afetados.

## 17.9 As cinco defesas da fase 1

**Nenhuma exige construir a subscrição.** Todas são decisões de forma com custo próximo de zero agora e alto se adiadas (Doc 02 §16.4).

| # | Risco de incompatibilidade | Defesa na fase 1 | Onde |
|---|---|---|---|
| 1 | Motor de disponibilidade sem noção de reserva prioritária | **`qty_subscription_reserved` existe desde já**, sempre zero, mas presente na coluna, na fórmula e na restrição | §7.1, `availability_limits` |
| 2 | Encomendas sem origem identificada | **`orders.origin` preenchido desde a primeira encomenda** | `orders` |
| 3 | Modelo de cliente sem espaço para subscrição | **Cliente e encomenda são entidades separadas**; a encomenda nunca é a raiz | §5.1, §5.6 |
| 4 | Pagamentos desenhados só para transação única | **`payments` separado de `orders`** desde a fase 1 | §5.7 |
| 5 | Notificações codificadas caso a caso | **Sistema de eventos com modelos** desde o primeiro email; acrescentar os eventos 11–18 é configuração | §18 |

---

# 18. Notificações e emails

## 18.1 Princípio

> **O envio de email nunca bloqueia a confirmação da encomenda.**

Doc 02 §15 caso 12: nenhum estado de domínio depende da entrega de um email. O ecrã de confirmação e a área de cliente são a verdade.

## 18.2 Eventos de domínio

As operações de domínio emitem eventos; o domínio de notificações traduz cada evento em zero, uma ou várias notificações enfileiradas. **Enfileirar é uma escrita local que não pode falhar a operação principal.**

Os 20 eventos estão definidos em Doc 02 §11.2. Os eventos 1–10, 19 e 20 pertencem à fase 1.

## 18.3 Fila

`notifications` é a fila. Sem sistema de filas dedicado — uma tabela mais um cron resolvem o mesmo com uma dependência a menos, e o volume de um obrador pequeno não justifica mais.

| Aspeto | Regra |
|---|---|
| Estados | `queued` → `sending` → `sent` \| `failed` |
| Envio | Tarefa agendada frequente (§24) |
| Tentativas | Limitadas, com espaçamento crescente |
| Falha definitiva | `operational_exceptions` + visível na encomenda |
| Idempotência | Um evento gera no máximo uma notificação por destinatário |

## 18.4 Modelos

Em `emails/`, em **es-ES**, na voz da marca (Doc 01 §21, Doc 03 §18). Versionados com o código — beneficiam de revisão como qualquer alteração.

**Conteúdo obrigatório decorrente de `DA-01`:** os emails 1, 2 e 3 dizem explicitamente que **não há nada a pagar na recolha**. É a informação que evita o mal-entendido mais provável do fluxo.

## 18.5 Transacional vs. marketing

| Tipo | Base legal | Optável | Verificação antes de enviar |
|---|---|:--:|---|
| Transacional | Execução do contrato | ✗ | Nenhuma |
| Marketing | Consentimento | ✓ | **Consentimento válido no momento do envio**, não no momento de enfileirar |

A distinção é verificada no envio porque o consentimento pode ser retirado entre uma coisa e outra.

## 18.6 Retorno do fornecedor

`email_events` regista entrega, devolução e reclamação. Devolução permanente marca o contacto para verificação. **Nenhum evento de email altera estado de encomenda.**

---

# 19. Conteúdo e CMS

## 19.1 A pergunta

Um CMS externo é **realmente** necessário?

## 19.2 O que existe de conteúdo

| Tipo | Volume | Frequência | Quem edita |
|---|---|---|---|
| **Catálogo** | ~10–30 produtos | Semanal | Obrador — **já no painel** |
| **Disponibilidade, pontos, encerramentos** | Contínuo | Diária | Obrador — **já no painel** |
| Prosa institucional | ~8 páginas | 1–2 vezes/ano | Raro |
| Avisos e textos curtos | Poucos | Ocasional | Obrador |
| Legais | 5 páginas | Muito raro | Com revisão jurídica |
| **Diário** | — | — | **Fase 3** |

**Observação decisiva:** o conteúdo que o obrador edita com frequência é **operacional** — produtos, disponibilidade, pontos, encerramentos — e é gerido pelo painel que já está a ser construído. O que resta é prosa que muda uma ou duas vezes por ano.

## 19.3 Comparação

| Opção | A favor | Contra |
|---|---|---|
| **Ficheiros no repositório** | Versionado; revisível; zero custo; zero dependência; publica com o código | Exige uma alteração de código para editar prosa |
| **Tabela + painel próprio** | Obrador edita sozinho; sem vendedor novo; mesma autenticação e auditoria | Construir editor decente dá trabalho; sem pré-visualização |
| **Sanity** | Editor excelente; pré-visualização; boa experiência de conteúdo | **Vendedor novo**, esquema novo, autenticação nova, custo novo, sincronização nova. Conteúdo separado da base onde vivem os produtos |
| **Outro CMS gerido** | Idem | Idem |

## 19.4 Recomendação

> ### Sem CMS externo nas fases 1 e 2. Modelo híbrido.

| Conteúdo | Onde | Porquê |
|---|---|---|
| Prosa institucional e legais | **Ficheiros no repositório** | Muda 1–2 vezes/ano; beneficia de revisão; versionado com o código |
| Catálogo, pontos, disponibilidade, encerramentos | **Painel** (já existe) | É o trabalho diário do obrador |
| Avisos e textos curtos que mudam | **`content_blocks` no painel** | Conjunto pequeno e fechado de chaves |
| Imagens | **Supabase Storage** via painel | §20 |

**Fundamentação.** Introduzir Sanity acrescentaria um quarto serviço externo, um segundo modelo de conteúdo, uma segunda autenticação e um segundo sítio onde procurar quando algo está errado — para gerir oito páginas que mudam duas vezes por ano. **Não passa o teste do objetivo 7** (simplicidade para uma equipa pequena).

**Reavaliação na fase 3.** Se o diário se concretizar com publicação frequente, a decisão reabre-se — e mesmo então, **uma tabela `posts` no painel existente vence um vendedor novo**, porque reutiliza autenticação, auditoria, imagens e implantação.

*Registado como ADR-06 (§30).*

---

# 20. Imagens e ativos

## 20.1 Armazenamento

**Supabase Storage** — já faz parte da plataforma escolhida; evita um quarto serviço.

| Contentor | Conteúdo | Acesso |
|---|---|---|
| `products` | Fotografias de produto | Leitura pública |
| `content` | Imagens institucionais | Leitura pública |
| `admin` | Anexos internos | Privado |

## 20.2 Carregamento

Pelo painel, com validação no servidor: tipo permitido, limite de tamanho, dimensões mínimas por uso (Doc 03 §8.5), nome normalizado com identificador único, **texto alternativo em es-ES obrigatório** salvo declaração explícita de imagem decorativa.

## 20.3 Otimização

**AVIF com fallback WebP**, `srcset` e `sizes` sempre, dimensões declaradas (CLS < 0,05), prioridade alta apenas na imagem principal de cada página, carregamento diferido no resto. Transformação pelo otimizador de imagem do Next.js, com cache no CDN.

## 20.4 Ilustrações SVG

> **Bloqueio a resolver antes do lançamento** (Doc 01, Doc 03 §7.1).

- Servidas como **componentes SVG em linha**, não como imagens — permite herdar cor e animar traço.
- **Nunca recortes do JPEG.** Dariam contornos sujos, sem transparência, impossíveis de recolorir e de animar, no ativo de identidade primária da marca.
- Otimizadas; distinção informativa/decorativa aplicada à acessibilidade (Doc 03 §7.4).
- Versionadas no repositório, não no armazenamento — fazem parte do sistema de design.

## 20.5 Ciclo de vida

Substituição cria nova versão e mantém a anterior durante um período de segurança. Eliminação é lógica; a remoção física só depois de confirmar que nenhuma encomenda ou conteúdo a referencia.

---

# 21. Segurança

## 21.1 Validação no servidor

**Toda a entrada é validada por esquema no servidor**, incluindo o que já foi validado no cliente. A validação no navegador é experiência de utilizador; a do servidor é segurança.

## 21.2 Autorização

Verificada **em cada operação**, nunca apenas na rota. Uma rota do painel que esqueça a verificação não deve dar acesso, porque o domínio verifica outra vez.

## 21.3 Segurança em linha

Defesa em profundidade (§16.5–16.6). Negar por omissão; auditoria apenas por inserção; ligação privilegiada nunca exposta ao navegador.

## 21.4 CSRF e XSS

Ações mutáveis com proteção contra falsificação de pedidos. Conteúdo do utilizador escapado por omissão; sem inserção de HTML não sanitizado. Política de segurança de conteúdo restritiva.

## 21.5 Injeção

Consultas sempre parametrizadas. Nenhuma concatenação de entrada em SQL. Identificadores nunca interpolados.

## 21.6 Limitação de taxa e abuso

| Superfície | Proteção |
|---|---|
| Autenticação | Limite por IP e por conta; atraso crescente |
| **Pesquisa por código de recolha** | **Limite agressivo** — impede enumeração |
| Criação de checkout | Limite por sessão |
| Criação de reserva | Limite por sessão — impede bloqueio malicioso de stock |
| Formulários públicos | Limite + verificação anti-automação |
| Webhook | Limite + assinatura verificada antes de processar |

**Abuso de checkout** — um agente automatizado que crie reservas repetidas para esgotar a disponibilidade sem pagar. Mitigação combinada: reserva só a partir da revisão (não ao adicionar ao carrinho), limite por sessão, prazo curto de reserva, e alerta quando a taxa de reservas expiradas sai do normal.

## 21.7 Enumeração

- Identificadores UUID v7 — sem sequência adivinhável nem fuga de volume de negócio.
- Acesso de convidado por **ligação assinada com prazo**, não por identificador simples.
- **Código de recolha não é credencial**: sozinho não devolve dados pessoais; serve para identificar no balcão e pesquisar no painel autenticado.
- Mensagens de autenticação genéricas — não revelam se um email existe.

## 21.8 Segredos

Apenas no servidor. Nunca no pacote enviado ao navegador. Rotação documentada. **Nenhum segredo no repositório**, verificado em CI.

## 21.9 Registos

**Sem dados pessoais nos registos de aplicação.** Sem emails, telefones, moradas nem dados de pagamento. Identificadores em vez de valores; correlação faz-se pela base de dados, com autorização.

## 21.10 Cópias de segurança

Cópias automáticas geridas pela plataforma, com recuperação a um ponto no tempo. **Restauro testado periodicamente** — uma cópia nunca testada não é uma cópia. Retenção conforme `DP-44`, pendente.

---

# 22. Privacidade e RGPD

## 22.1 Minimização

**Todo o campo pedido ao cliente tem um uso identificado nos documentos.** Se não tiver, não se recolhe. O telefone só existe porque serve para avisar de um problema no dia da recolha; se esse uso desaparecer, o campo desaparece.

Morada **não é recolhida** — o FUERZA não entrega ao domicílio. Só entraria com faturação com dados fiscais (`DP-43`, pendente).

## 22.2 Base legal

| Tratamento | Base |
|---|---|
| Encomenda e recolha | Execução do contrato |
| Faturação e contabilidade | Obrigação legal |
| Emails transacionais | Execução do contrato |
| Emails de marketing | **Consentimento** |
| Analítica | **Consentimento** (`DP-45`, pendente) |
| Auditoria | Interesse legítimo |

## 22.3 Consentimentos

`consent_records` **imutável**: revogar cria nova linha. Regista tipo, valor, versão do texto, origem e momento. Retirar é tão fácil como dar, com efeito imediato. **Nunca pré-marcado, nunca condição de compra.**

## 22.4 Exportação

Formato legível por máquina, com perfil, encomendas, consentimentos e subscrições. Autenticada e limitada em taxa.

## 22.5 Eliminação e anonimização

**Anonimização, não eliminação:**

| Dado | Ação |
|---|---|
| Nome, email, telefone | Substituídos por marcadores irreversíveis |
| Encomendas | **Mantidas**, desassociadas da identidade |
| Faturação | Mantida pelo prazo legal (`DP-44`, pendente) |
| Consentimentos | Mantidos como prova, anonimizados |
| Subscrição ativa | Cancelada como parte do processo |

O cliente é informado da exceção legal **antes** de confirmar.

## 22.6 Conservação

| Dado | Prazo |
|---|---|
| Carrinhos e reservas expiradas | Curto, definido tecnicamente |
| Encomendas e faturação | **`DP-44`, pendente** — assessoria jurídica |
| Auditoria | **`DP-55`, pendente** |
| Registos de aplicação | Curto |
| Consentimentos | Enquanto houver relação + prazo de prova |

## 22.7 Cookies

Estritamente necessários (sessão, carrinho, proteção) sem consentimento. Analítica e marketing só após consentimento explícito, com **recusa tão acessível como a aceitação**.

## 22.8 Acesso administrativo

Consulta de dados pessoais no painel é **registada em auditoria** (§23). O painel mostra o mínimo necessário por papel: `operator` não vê dados financeiros; `point_manager` vê apenas o necessário para entregar.

---

# 23. Auditoria

## 23.1 Estrutura

Cada registo em `audit_logs`: **ator** (tipo e identificador) · **ação** · **entidade** (tipo e identificador) · **valor anterior** · **valor novo** · **momento** · **origem** (painel, API, cron, webhook) · **motivo** quando obrigatório.

**Imutável: sem atualização, sem eliminação, para ninguém** — incluindo o administrador.

## 23.2 O que é registado

| Domínio | Ações |
|---|---|
| **Catálogo** | Preço, estado, dias de produção, publicação, descatalogação |
| **Alergénios** | Toda a alteração, com **confirmação explícita e responsável identificado** |
| **Capacidade** | Alteração de limite (com valor anterior), reserva de subscrição |
| **Disponibilidade** | Abertura/fecho de data, alteração de hora-limite |
| **Encerramentos** | Criação e remoção |
| **Encomendas** | Toda a transição de estado, com ator e origem |
| **Reembolsos** | Total e parcial, **motivo obrigatório** |
| **Pontos** | Estado, horários, janelas, capacidades, produtos aceites |
| **Utilizadores** | Atribuição e remoção de papéis |
| **Subscrições** | Alterações de plano, preço, pausa, cancelamento |
| **Consentimentos** | Em `consent_records`, com a mesma imutabilidade |
| **Acesso a dados pessoais** | Quem consultou que cliente no painel |

## 23.3 Motivo obrigatório

Reembolso · cancelamento pelo obrador · alteração de preço · redução de limite de capacidade. Sem motivo, a operação não se completa.

## 23.4 Utilização

Investigar uma reclamação · reconstruir o histórico de uma encomenda · perceber uma alteração de capacidade · responder a um pedido de acesso RGPD · investigar uma inconsistência detetada pela reconciliação.

---

# 24. Tarefas agendadas

## 24.1 Mecanismo

**Vercel Cron** — um só agendador, um só sítio para monitorizar. Handlers como rotas protegidas por segredo, **todos idempotentes**.

Alternativa considerada: `pg_cron` no Postgres, que sobreviveria a problemas da plataforma de alojamento. **Recusada para a fase 1** por dividir a lógica agendada entre dois sítios — a equipa passaria a ter de saber em qual procurar. A simplicidade vence.

## 24.2 Correção não depende do agendador

> **Princípio que reduz a criticidade de toda esta secção.**

As tarefas são **reconciliação**, não sequência. Nenhuma delas é o único caminho para um resultado correto:

| Tarefa | Se falhar | Porquê não é crítico |
|---|---|---|
| Expirar reservas | Capacidade continua correta | **Expiração é lida** (§7.4) |
| Marcar não recolhidos | Estado atrasado | Detetado na execução seguinte |
| Enviar notificações | Email atrasado | **Estado de domínio não depende de email** |
| Reconciliar pagamentos | Divergência não detetada | Detetada na execução seguinte |
| Gerar entregas | Ciclo por gerar | Alerta; ação manual possível |

**As tarefas recuperam sozinhas na execução seguinte.** Uma falha isolada não corrompe estado.

## 24.3 Catálogo de tarefas

| Tarefa | Frequência recomendada | O que faz | Fase |
|---|---|---|---|
| **Expirar reservas** | Cada 2–5 min | Marca expiradas, liberta contadores, encerra encomendas em `pendiente_pago` | 1 |
| **Enviar notificações** | Cada 1–2 min | Processa a fila com retentativas | 1 |
| **Marcar não recolhidos** | De hora a hora | Transita após janela + tolerância (`DP-21`) | 1 |
| **Lembretes de recolha** | 1×/dia | Envia o lembrete da véspera (`DP-51`) | 1 |
| **Reconciliar pagamentos** | Cada 15–30 min | Compara Stripe e base de dados; abre exceções | 1 |
| **Materializar capacidade de pontos** | 1×/dia | Gera linhas de (ponto, data) para o horizonte | 1 |
| **Verificar inconsistências** | 1×/dia | Valida invariantes; alerta em caso de violação | 1 |
| **Congelar totais de produção** | Após a hora-limite | Fixa os totais da data fechada | 1 |
| **Limpar sessões e carrinhos** | 1×/dia | Remove expirados fora do prazo de retenção | 1 |
| **Gerar entregas de subscrição** | 1×/dia | Gera o ciclo com antecedência | 2 |
| **Avisar renovação** | 1×/dia | Aviso prévio de cobrança (`DP-30`) | 2 |
| **Recuperar pagamentos falhados** | 1×/dia | Acompanha a recuperação | 2 |

## 24.4 Requisitos comuns

Idempotência; execução com limite de tempo e retomável; registo de início, fim e resultado; **alerta quando uma tarefa falha ou não corre** (§25.4); nunca processar tudo de uma vez — sempre em lotes com limite.

---

# 25. Observabilidade

## 25.1 Registos

Estruturados, com identificador de correlação por pedido, sem dados pessoais (§21.9). Níveis usados com critério — aviso significa «alguém deve ver isto».

## 25.2 Erros

Captura centralizada com rastreio, versão e contexto anonimizado. Agrupamento por assinatura. **Erros de domínio esperados** — sem capacidade, hora-limite passada — **não são erros de aplicação** e não poluem o canal.

## 25.3 Métricas

| Métrica | Porquê |
|---|---|
| Reservas por dia e por ponto | Saúde do negócio |
| Taxa de conversão do checkout, por passo | Onde se perde |
| **Taxa de reservas expiradas** | Anomalia pode indicar abuso |
| **Taxa de falha de pagamento** | Problema de integração ou de fornecedor |
| **Latência do webhook** | Atraso na confirmação |
| Taxa de não recolhidos | Desperdício real |
| Taxa de esgotamento por produto | Procura reprimida |
| Notificações falhadas | Entregabilidade |
| Exceções abertas | Dívida operacional |

## 25.4 Alertas

| Alerta | Gravidade |
|---|---|
| **Invariante de capacidade violado** | **Crítico** — não deveria ser possível |
| **Encomenda confirmada sem pagamento pago** | **Crítico** — viola `DA-01` |
| Pagamento sem encomenda | **Crítico** |
| Webhook a falhar repetidamente | **Crítico** |
| Reserva expirada com pagamento bem-sucedido | **Crítico** |
| Tarefa agendada falhada ou não executada | Aviso |
| Taxa de falha de pagamento acima do normal | Aviso |
| Fila de notificações a crescer | Aviso |
| Exceções abertas há demasiado tempo | Aviso |

**Alertas críticos chegam a uma pessoa**, não apenas a um painel. Alertas de aviso agrupam-se num resumo.

---

# 26. Performance

## 26.1 Objetivos

Doc 01 (Prioridade 4) e Doc 02 §13.10:

| Métrica | Alvo | Referência |
|---|---|---|
| Caminho crítico | < 200 KB | ~1 707 KB |
| Pedidos iniciais | < 20 | 66 |
| LCP | < 2,0 s | — |
| CLS | < 0,05 | — |
| INP | < 200 ms | — |

## 26.2 Componentes de servidor

Por omissão. JavaScript no cliente **apenas** onde há interação real: seletor de quantidade, calendário, carrinho, checkout, filtros, menu, painel.

Consequência: as páginas institucionais e a maior parte do catálogo enviam **quase nada** de JavaScript.

## 26.3 Cache por tipo de dado

| Dado | Estratégia |
|---|---|
| Páginas institucionais | **Estáticas**, revalidadas na implantação |
| Catálogo (sem disponibilidade) | Estático com revalidação por etiqueta ao alterar produtos |
| Ficha (sem disponibilidade) | Idem |
| **Disponibilidade** | **§26.4** |
| Área do cliente | **Nunca cacheada** |
| Painel | **Nunca cacheado** |
| Imagens | Cache longa com nome versionado |
| Fontes | Cache longa, auto-alojadas |

## 26.4 Disponibilidade — estratégia explícita

> **Regra do enunciado, e é a correta:** não usar cache para dados de stock sem estratégia explícita de invalidação.

| Contexto | Estratégia |
|---|---|
| Cartão de catálogo | Cache **muito curta** (segundos), com invalidação por etiqueta a cada alteração de contador |
| Calendário da ficha | Cache muito curta, mesma invalidação |
| **Entrada na revisão** | **Sem cache. Leitura direta e escrita atómica** |
| **Confirmação do pagamento** | **Sem cache. Transação** |

**Regra:** a disponibilidade cacheada é **informativa**. A disponibilidade **vinculativa** é sempre lida e escrita na base de dados, dentro de transação. Uma leitura cacheada nunca autoriza uma reserva.

## 26.5 Consultas

Sem N+1 — a lista de pontos válidos para um carrinho é **uma** consulta com junção. Agregações de produção feitas na base de dados, não em memória. Paginação por cursor no histórico e nas listas do painel. Índices de §5 desenhados para as consultas de §7.6 e §15.2, e revistos com dados reais.

## 26.6 Pacote e fontes

Duas famílias variáveis, auto-alojadas, subconjunto latino, ≤ 120 KB (Doc 03 §4.4). Sem bibliotecas de ícones completas — só os ícones usados. Sem bibliotecas de animação (Doc 03 §19.4).

---

# 27. Testes

## 27.1 Estratégia

Testar **onde o risco está**, não uniformemente. Concentração em: disponibilidade e concorrência, checkout e pagamentos, estados, permissões, acessibilidade.

## 27.2 Unitários

Domínio puro, sem base de dados nem rede: fórmula de disponibilidade (as sete condições e os sete motivos), transições de estado, aritmética monetária em cêntimos, cálculo de hora-limite **com mudança de hora**, resolução de datas de subscrição, regras de fusão de carrinho.

## 27.3 Integração

Com base de dados real, em transação revertida: repositórios, reserva atómica, restrições de verificação, precedência de calendário, materialização de capacidade.

## 27.4 Base de dados

**As restrições são testadas diretamente**, não só através da aplicação: tentativa de violar o invariante de capacidade → rejeitada; tentativa de reduzir limite abaixo do reservado → rejeitada; tentativa de duplicar evento de webhook → rejeitada; tentativa de atualizar auditoria → rejeitada.

## 27.5 Pagamentos e webhooks

Com o modo de teste do processador: fluxo completo bem-sucedido; recusa; **evento duplicado → um só efeito**; **evento fora de ordem → estado convergente**; evento atrasado após expiração da reserva → exceção crítica; assinatura inválida → rejeitado; reembolso total e parcial.

## 27.6 Disponibilidade

Cada uma das sete condições isolada; cada um dos sete motivos; precedência de encerramentos; reserva expirada ignorada à leitura **sem o cron correr**; capacidade de subscrição a reduzir a venda avulsa.

## 27.7 Concorrência — o teste central

> **Dois clientes, uma unidade. Exatamente um ganha.**

| Cenário | Critério |
|---|---|
| **2 pedidos simultâneos, 1 unidade** | Um sucesso, uma recusa limpa com motivo. **Nunca dois** |
| **50 pedidos simultâneos, 10 unidades** | Exatamente 10 sucessos. `qty_held` = 10 |
| **Carrinhos com múltiplos itens em ordens diferentes** | **Zero impasses** (ordem determinística, §8.4) |
| **Capacidade de variante suficiente, de ponto esgotada** | Recusa com motivo `point_full`, **não** `variant_sold_out` |
| **Expiração durante a confirmação** | Exceção crítica; **nunca cobrança sem encomenda nem encomenda sem cobrança** |
| **Duplo envio do checkout** | Uma encomenda, uma reserva (idempotência) |

**Executado em cada integração.** É o teste que protege o critério de aprovação n.º 1.

## 27.8 Checkout ponta a ponta

Fluxo completo com conta e **sem conta**; falha de pagamento; stock perdido na revisão; hora-limite a passar durante o fluxo; mudança de ponto com item incompatível; cancelamento dentro e fora do prazo.

## 27.9 Permissões

Cliente não alcança dados de outro cliente · `operator` não vê dados financeiros · `point_manager` só o seu ponto · não autenticado não alcança conta nem painel · **auditoria não é alterável por ninguém** · consulta direta com credenciais de cliente não devolve dados alheios (§16.6).

## 27.10 Acessibilidade

Automatizada em CI (Doc 02 §17.11): contraste, etiquetas, um `<h1>`, `lang`, `alt`, alvos de toque, conteúdo sem JavaScript.

Manual por versão: reserva completa **só com teclado**; percurso com leitor de ecrã; movimento reduzido; JavaScript desativado.

## 27.11 Ponta a ponta, mobile e regressão visual

Percursos críticos em navegador real, a 360 px e em desktop: reservar sem conta, reservar com conta, cancelar, painel — ver produção, marcar lote, imprimir.

Regressão visual nos componentes do sistema de design e nas páginas-chave, para apanhar deriva do sistema (Doc 03 §24.3).

---

# 28. Ambientes

## 28.1 Os cinco

| Ambiente | Base de dados | Stripe | Emails | Dados |
|---|---|---|---|---|
| **Local** | Supabase local | Teste | Capturados, não enviados | Sementes |
| **Desenvolvimento** | Projeto partilhado | Teste | Capturados | Sementes |
| **Pré-visualização** (por PR) | Ramo efémero | Teste | Capturados | Sementes |
| **Staging** | Projeto próprio | Teste | Enviados só para lista permitida | Realistas, **anonimizados** |
| **Produção** | Projeto próprio | **Live** | Enviados | Reais |

## 28.2 Regras invioláveis

| Regra | |
|---|---|
| **Bases separadas** | Produção nunca partilha base com nenhum outro ambiente |
| **Chaves live só em produção** | Verificado no arranque; a aplicação recusa arrancar com chave live fora de produção |
| **Emails de não-produção nunca chegam a clientes reais** | Lista permitida obrigatória |
| **Staging protegido** | Autenticação de acesso; **nunca indexável** |
| **Dados reais nunca copiados** para outro ambiente sem anonimização |

## 28.3 Variáveis de ambiente

Validadas por esquema **no arranque**: falta uma → a aplicação não arranca, com mensagem clara. Separação explícita entre públicas e secretas. **Nenhum segredo no repositório**, verificado em CI.

Configuráveis (não codificados): duração da reserva temporária (`DP-19`) · hora-limite (`DP-02`) · tolerância de não recolhido (`DP-21`) · horizonte de reserva · limiar de «poucas unidades» · limites de taxa.

## 28.4 Migrações e sementes

Migrações versionadas, incrementais, revistas em PR, aplicadas automaticamente em pré-visualização e staging e **com aprovação explícita em produção**.

Sementes por ambiente: catálogo mínimo, dois pontos com **horários e capacidades diferentes** (para exercitar a ausência de herança), datas de produção, encerramento e cliente de teste.

---

# 29. Deployment

## 29.1 Fluxo

```
  PR ──► CI (lint · tipos · unitários · integração · a11y · concorrência)
      ──► Pré-visualização (ramo de BD efémero)
      ──► Revisão
      ──► Merge ──► Produção
```

## 29.2 Portões de CI

**Bloqueiam o merge:** tipos · lint (incluindo regras do sistema de design, §30 ADR-03) · unitários · integração · **testes de concorrência** · acessibilidade · **verificação de texto marcador** · orçamento de desempenho · sem segredos no diff.

## 29.3 Pré-visualização

Um ambiente por PR, com ramo de base de dados efémero — permite testar migrações sem tocar em nada partilhado.

## 29.4 Migrações em produção

Aplicadas antes da nova versão. **Sempre compatíveis com a versão anterior** — nunca uma migração que quebre a versão em execução. Alterações destrutivas em dois passos e duas implantações.

## 29.5 Reversão

Reversão instantânea da aplicação pela plataforma. **A base de dados não reverte automaticamente** — daí a regra de compatibilidade anterior. Alterações destrutivas exigem plano de reversão escrito antes de serem aplicadas.

## 29.6 Cópias de segurança

Automáticas com recuperação a um ponto no tempo. **Restauro testado periodicamente.** Cópia manual antes de qualquer migração destrutiva.

## 29.7 Monitorização pós-implantação

Primeiros 30 minutos: taxa de erro, latência, **taxa de sucesso de webhooks**, fila de notificações, exceções abertas. Alerta imediato em qualquer degradação.

---

# 30. Decisões arquiteturais

| # | Decisão | Opções analisadas | Escolha | Motivo | Consequência | Estado |
|---|---|---|---|---|---|---|
| **ADR-01** | Framework | Next.js App Router · Remix · Astro+ilhas · SvelteKit | **Next.js App Router** | Estático por omissão com dinâmico onde é preciso; ecossistema maduro; alinhado com o alojamento | Disciplina rigorosa de cache, sobretudo em disponibilidade (§26.4) | **Aprovada** |
| **ADR-02** | Linguagem | TypeScript · JavaScript | **TypeScript estrito** | Domínio com dinheiro, estados e invariantes; erros de unidade monetária apanhados no compilador | Custo inicial de tipos | **Aprovada** |
| **ADR-03** | Estilo | Tailwind com tema **substituído** · Tailwind com tema estendido · CSS Modules · CSS-in-JS | **Tailwind com o tema por omissão substituído, não estendido** | Rapidez sem sacrificar o sistema de design | **Ver nota abaixo** | **Aprovada com condição** |
| **ADR-04** | Base de dados | Supabase Postgres · Neon · Postgres auto-gerido | **Supabase Postgres** | Postgres é obrigatório (transações, restrições); gerido reduz operação; traz auth e armazenamento | Acoplamento ao fornecedor, mitigado por ser Postgres normalizado | **Aprovada** |
| **ADR-05** | Acesso a dados | Servidor apenas · Cliente direto com RLS | **Servidor apenas; RLS como defesa em profundidade** | **Invariantes não são garantíveis a partir do cliente** (§16.5) | Sem acesso direto do navegador; toda a lógica no servidor | **Aprovada** |
| **ADR-06** | CMS | Sem CMS (híbrido) · Sanity · outro gerido | **Sem CMS externo nas fases 1–2** | 8 páginas que mudam 2×/ano não justificam um quarto fornecedor (§19) | Prosa editada por PR; blocos curtos no painel | **Aprovada** |
| **ADR-07** | Autenticação | Supabase Auth · Auth.js · Clerk | **Supabase Auth** | Já incluída; **maioria dos clientes nem sequer cria conta** | Acoplamento ao fornecedor | **Aprovada** |
| **ADR-08** | Pagamentos | Stripe · Adyen · Redsys | **Stripe** | Subscrições nativas (fase 2); webhooks fiáveis; melhor experiência de programação | Custo por transação; dependência crítica | **Aprovada** |
| **ADR-09** | Emails | Resend · Postmark · SES | **Resend** | Simplicidade e modelos em React; adequado ao volume | Se a entregabilidade se degradar, **Postmark é a alternativa** | **Aprovada, com revisão** |
| **ADR-10** | Controlo de stock | Atualização atómica condicional · bloqueio otimista · pessimista | **Atómica condicional + transação + restrição de verificação** | Uma ida à BD; sem repetições; **restrição torna a sobrevenda impossível** (§8.3) | Ordem determinística obrigatória (§8.4) | **Aprovada** |
| **ADR-11** | Reserva temporária | Na revisão · ao adicionar ao carrinho · sem reserva | **Na revisão, com expiração lida** | Não estrangula stock pequeno; **correção não depende do cron** (§7.4) | Janela curta de disputa entre revisão e pagamento | **Aprovada** · duração `DP-19` |
| **ADR-12** | Tarefas agendadas | Vercel Cron · pg_cron · misto | **Vercel Cron apenas** | Um mecanismo, um sítio para monitorizar | Depende da plataforma; **mitigado por §24.2** | **Aprovada** |
| **ADR-13** | Alojamento | Vercel · Fly/Railway · Cloudflare | **Vercel** | Integração nativa; pré-visualizações por PR; latência baixa em Espanha | Acoplamento; custo previsível a este volume | **Aprovada** |
| **ADR-14** | Fila de mensagens | Tabela + cron · fila dedicada | **Tabela + cron** | Volume não justifica infraestrutura adicional | Menos garantias; suficientes para email | **Aprovada** |
| **ADR-15** | Modelo de subscrição | Frequência fixa · crédito mensal | **Adiada** | Recomendação registada: frequência fixa (Doc 02 §7.3) | Estrutura preparada para ambas (§17.9) | **`DP-28`, pendente** |

## Nota sobre ADR-03 — a condição

Tailwind é adotado com uma condição que não é negociável:

> **O tema por omissão é substituído, não estendido.**

Se o tema for apenas estendido, continuam disponíveis `gray-500`, `rounded-full`, `shadow-lg` e os gradientes — exatamente os anti-padrões que o Doc 03 §23 proíbe, ao alcance de um descuido. Substituindo o tema, **essas classes deixam de existir** e a violação do sistema de design passa a ser um erro de compilação em vez de uma questão de disciplina.

Consequência prática: a paleta disponível é a de Doc 03 §3; os raios são os cinco de §6.1 (**sem cápsula**); a sombra só existe para modal e gaveta; a escala de espaço é a de §5.1.

**É a forma mais barata de impedir que o sistema derive para aspeto genérico ao longo de meses de desenvolvimento.**

---

# 31. Faseamento técnico

## 31.1 Fase 1 — reservar e produzir

| Bloco | Âmbito |
|---|---|
| Fundação | Projeto, tipos, tokens do sistema de design, CI com todos os portões |
| Catálogo | 7 entidades; painel de gestão; publicação bloqueada se incompleto |
| Pontos | 5 entidades; **horários, dias, janelas e capacidades independentes** |
| **Disponibilidade** | 4 entidades; fórmula das sete condições; **reserva atómica + restrição**; expiração lida |
| Carrinho | 2 entidades; revalidação; fusão |
| Checkout | 12 passos; idempotência; reserva temporária |
| Pagamentos | Payment Intent; **webhook como fonte de verdade**; reconciliação; reembolsos |
| Encomendas | Máquina de 16 transições; código de recolha; histórico |
| Conta | Registo, sessão, histórico, próximas recolhas, consentimentos, eliminação; **compra sem conta completa** |
| Produção | Mapa derivado; lotes; ações em lote; **impressão** |
| Emails | Eventos 1–10, 19, 20; fila; retentativas |
| Painel | Producción, Pedidos, Disponibilidad, Catálogo, Puntos, Cierres, Clientes, **Excepciones** |
| Conteúdo | Prosa no repositório; blocos no painel |
| Tarefas | 9 tarefas de fase 1 |
| Observabilidade | Registos, erros, métricas, **alertas críticos** |

**Tabelas de subscrição criadas e vazias.** As cinco defesas de §17.9 implementadas.

## 31.2 Fase 2 — Plan de Pan

Subscrições (3 entidades ativas) · geração de ciclos · **ativação da prioridade de stock** · gestão de plano na conta · métodos de pagamento guardados · repetir encomenda · **portal do responsável de ponto** (`DP-06`) · eventos 11–18 · painel de subscrições e utilizadores.

## 31.3 Fase 3 — comunidade e futuro

Diário (**reavaliar CMS**, §19.4) · fidelização · cartões oferta · lista de espera · outros canais de notificação (`DP-50`) · alocação por produto × ponto × data (nível 3 de Doc 02 §4.10) · faturação avançada (`DP-43`).

---

# 32. Riscos técnicos

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| **1** | **Sobrevenda** | **Crítico** — compromisso impossível de cumprir | **Três camadas** (§8.3): atómica condicional + transação + **restrição de BD**. Testes de concorrência em cada integração. Alerta crítico se o invariante for violado |
| **2** | **Webhook atrasado ou perdido** | Alto — cliente paga e não vê confirmação | Ecrã de confirmação lê o estado real e mostra espera honesta; **reconciliação periódica**; alerta em falhas repetidas; processamento convergente e fora de ordem (§12.4) |
| **3** | **Pagamento confirmado sem encomenda** | **Crítico** — cliente paga e não recebe | Reserva mantida durante o pagamento; reprocessamento idempotente; **exceção crítica com alerta imediato**; nunca reversão automática depois do dinheiro (§11.3) |
| **4** | **Reserva expira durante o pagamento** | Alto | `payment_in_progress` protege da expiração; se ainda assim ocorrer, exceção crítica e decisão humana (§9.4) |
| **5** | **Falha de tarefa agendada** | Médio | **Correção não depende do agendador** (§24.2). Expiração lida (§7.4). Tarefas idempotentes e auto-recuperáveis. Alerta em não execução |
| **6** | **Ponto encerrado com encomendas** | Médio | **Desativação bloqueada** enquanto houver encomendas ativas; resolução explícita obrigatória (§14.6) |
| **7** | **Erro de configuração de capacidade** | Médio | Redução abaixo do reservado **rejeitada pela restrição**; auditoria com valor anterior; painel mostra o comprometido antes de alterar |
| **8** | **Perda de dados** | **Crítico** | Cópias automáticas com recuperação a um ponto no tempo; **restauro testado**; migrações compatíveis; cópia manual antes de alterações destrutivas |
| **9** | **Dependência excessiva de terceiros** | Médio | Apenas três (Supabase, Stripe, Resend), todos com alternativa identificada; Postgres normalizado; Resend substituível por Postmark; **sem CMS externo** (§19) |
| **10** | **Complexidade do CMS** | Baixo | **Evitado por decisão** (ADR-06). Reavaliação apenas na fase 3 |
| **11** | **Custos de infraestrutura** | Baixo | Escalões gratuitos ou baratos cobrem o volume esperado; sem infraestrutura ociosa; alertas de consumo |
| **12** | **Deriva do sistema de design** | Médio | **Tema substituído, não estendido** (ADR-03) — as classes proibidas não existem; regressão visual; teste das duas homes (Doc 03 §24.9) |
| **13** | **Ilustrações sem SVG original** | **Bloqueante para lançamento** | Registado desde o Doc 01. Desenvolvimento avança com marcadores; **lançamento não** |
| **14** | **Sobre-engenharia** | Médio | Princípio 2.6; ADRs justificam cada dependência; critério de aprovação n.º 10 (§33) |

---

# 33. Critérios de aprovação

O documento só deve ser aprovado se **todos** se verificarem.

| # | Critério | Como se verifica | Estado |
|---|---|---|---|
| **1** | **Não existe caminho de sobrevenda** | Três camadas de §8.3, sendo a última uma **restrição de base de dados** que nenhum defeito de aplicação pode contornar. Testes de concorrência de §27.7 em cada integração | ✓ |
| **2** | **O pagamento é reconciliável** | Webhook como fonte de verdade (§12.2); `webhook_events` com identificador único; reconciliação periódica com seis divergências tipificadas (§12.5); nenhuma discrepância descartada em silêncio | ✓ |
| **3** | **Os estados são consistentes** | Máquina fechada de 16 transições (§13); `confirmado` implica sempre pago (`DA-01`); uma só reversão, auditada; histórico imutável | ✓ |
| **4** | **Compras sem conta são suportadas** | `customer_profiles` sem `user_id`; acesso por ligação assinada; vinculação só após verificação de email (§16.1–16.2) | ✓ |
| **5** | **Pontos externos são configuráveis** | Modelo único, **zero herança de valores**; horário, dias, janela, capacidade e produtos independentes; ponto sem configuração não opera (§14.2) | ✓ |
| **6** | **Subscrições futuras são compatíveis** | Cinco defesas implementadas na fase 1 (§17.9), sendo a principal a separação de capacidade desde o primeiro dia | ✓ |
| **7** | **Dados pessoais estão protegidos** | Minimização com uso justificado por campo; anonimização em vez de eliminação; consentimentos imutáveis; sem dados pessoais em registos; acesso administrativo auditado (§22) | ✓ |
| **8** | **Operações críticas são auditadas** | `audit_logs` imutável com ator, ação, valores anterior e novo, momento e origem; motivo obrigatório nas quatro ações sensíveis (§23) | ✓ |
| **9** | **Uma equipa pequena consegue operar o sistema** | Monólito modular; três serviços externos; um agendador; **correção não depende do cron**; fila de exceções que centraliza tudo o que precisa de decisão humana | ✓ |
| **10** | **A arquitetura não está sobredimensionada** | Sem microserviços, sem filas dedicadas, sem cache distribuída, sem CMS externo, sem API pública. Cada dependência justificada num ADR | ✓ |

---

## Decisões pendentes que afetam a arquitetura

**Nenhuma é decidida aqui.** O sistema define o mecanismo; o valor vem da configuração.

| ID | Decisão | O que fica à espera | Bloqueia? |
|---|---|---|---|
| `DP-02` | **Hora-limite de reserva** | `cutoff_at` calculado a partir de configuração; mecanismo completo | **Sim** — fase 1 |
| `DP-19` | Duração da reserva temporária | Configurável; mecanismo completo | Não |
| `DP-28` | **Modelo de subscrição** | ADR-15 adiada; estrutura preparada | **Sim** — antes da fase 1, por condicionar o modelo de disponibilidade |
| `DP-12` | Enquadramento de IVA | `tax_cents` existe; regra de cálculo pendente | **Sim** — fase 1 |
| `DP-13` | Preços | `price_cents` existe; valores pendentes | **Sim** — fase 1 |
| `DP-25` | Dados dos pontos | Modelo completo; valores pendentes | **Sim** — fase 1 |
| `DP-21` | Tolerância de não recolhido | Configurável | Não |
| `DP-27` | Quem confirma a recolha | Transições 10 e 11 previstas para ambos | Não |
| `DP-43`/`DP-48` | Faturação e numeração | Fora do modelo da fase 1 | Fase 1, para faturação |
| `DP-44`/`DP-55` | Prazos de conservação | Anonimização implementada; prazos configuráveis | **Sim** — RGPD |
| `DP-47` | Autorizar vs. capturar | Ambos suportados; recomendação registada | Não |

---

## Próximos documentos

| Doc | Título | Dependências |
|---|---|---|
| **05** | Conteúdo em es-ES | Doc 01 §21, Doc 02 §12, Doc 03 |
| **06** | Plano de implementação | Este documento + resolução das decisões bloqueantes |

---

*Sem código, sem SQL, sem migrations. Nomes de tabelas, campos e estados são vocabulário de domínio, definidos para não serem improvisados durante a implementação. Nenhum preço, morada, horário de ponto externo, capacidade ou política comercial aqui referido é real.*
