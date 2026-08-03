# FUERZA — Roadmap de implementação

## Propósito e contexto

Este documento transforma as decisões de produto, operação, identidade e tecnologia do FUERZA numa sequência de entregas pequenas e verificáveis para Claude Code. O produto é um site em espanhol de Espanha para um obrador artesanal de massa mãe nas Astúrias.

Regras de negócio transversais:

- O pagamento é sempre antecipado e a encomenda só fica confirmada após pagamento bem-sucedido.
- Não existe pagamento na recolha.
- O horário geral do obrador é 09:00–18:00, mas horários operacionais devem ser configuráveis.
- É possível comprar sem conta.
- A disponibilidade apresentada tem de ser real e nunca pode ultrapassar a capacidade.
- Pontos externos podem ter dias, horários, produtos e capacidades próprios.
- O modelo de dados e o motor de disponibilidade devem admitir subscrições futuras sem as implementar antecipadamente.
- A solução deve continuar operável por uma equipa pequena.

## 1. Princípios de execução

1. Executar uma fase de cada vez e dividir qualquer fase que deixe de ser pequena, testável ou reversível.
2. Não avançar com build, lint, tipos, testes obrigatórios ou critérios de aceitação por cumprir.
3. Separar infraestrutura, domínio e interface sempre que a separação reduza risco; não criar camadas sem necessidade concreta.
4. Fazer commits pequenos, coerentes e reversíveis, sem misturar correções alheias à fase.
5. Validar no browser os fluxos alterados, incluindo viewport móvel e ausência de erros na consola.
6. Validar teclado, foco, semântica, contraste, leitor de ecrã quando aplicável e redução de movimento.
7. Nunca apresentar dados fictícios como reais. Seeds e fixtures devem ser identificados como fictícios e limitados a desenvolvimento/teste.
8. Registar decisões relevantes, alternativas rejeitadas, migrações e alterações de contrato.
9. Não reabrir uma fase aprovada sem uma justificação, análise de impacto e testes de regressão.
10. Preservar compatibilidade futura com subscrições nos modelos de produto, capacidade, calendário, encomenda e pagamento, sem construir a funcionalidade antes da Fase 18.
11. Preferir configuração a regras hardcoded e soluções simples a plataformas genéricas.
12. Tratar webhooks e operações financeiras como idempotentes e auditáveis.
13. Nunca guardar segredos no Git nem misturar ambientes ou dados de teste e produção.
14. Cada fase termina com evidência automática e validação humana registada.

## 2. Preparação do repositório

Esta preparação pertence ao início da Fase 0 e não deve ser executada ao criar este documento.

- Inventariar a estrutura e preservar documentação, ativos, histórico e trabalho existente.
- Confirmar estado, branch, remotos e política de proteção do Git.
- Decidir se `develop` acrescenta valor; por omissão, usar branches curtas a partir de `main`.
- Confirmar versões suportadas de Node e npm e fixá-las pelos mecanismos acordados.
- Criar `.env.example` apenas com nomes e placeholders seguros.
- Definir convenções de pastas, nomes, imports, idioma da interface e limites entre servidor e cliente.
- Configurar lint, formatação, typecheck e testes.
- Configurar CI inicial para instalação reproduzível, lint, tipos, testes e build.
- Criar guia de contribuição com fluxo local, Git, testes, segurança e revisão.

Gate: a preparação só termina depois de as convenções e a estratégia Git serem aceites e todos os ficheiros existentes permanecerem preservados.

## 3. Estratégia de branches e commits

- `main`: sempre estável, protegida e potencialmente publicável.
- `develop`: criar apenas se existirem várias frentes simultâneas que precisem de integração prolongada. Não é obrigatória.
- Trabalho: `phase/<numero>-<nome>` ou `feat/<tema>`, criada a partir da branch estável acordada.
- Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`), com uma intenção verificável por commit.
- Pull request: obrigatório antes de integrar mudanças funcionais; pequeno, com âmbito, riscos, evidências e rollback.
- Tags: apenas para entregas aprovadas e publicáveis, no formato `v0.x.0`; não criar uma tag por commit.
- Rollback: preferir `git revert` do merge/commit identificado e migrações compatíveis; nunca reescrever histórico partilhado.
- Proibido: force push em branches protegidas, commits com segredos e mudanças não relacionadas.

## 4–24. Fases de implementação

### Fase 0 — Fundação técnica

**Objetivo:** obter uma aplicação mínima, reproduzível e publicável, sem funcionalidades de negócio.

**Entregáveis:** Next.js com App Router, React, TypeScript, Tailwind, tokens visuais fundamentais, fonte segura via `next/font`, estrutura mínima de pastas, lint, formatação, typecheck, testes, variáveis de ambiente documentadas, CI, configuração local de Supabase, Stripe e Resend apenas em modo de teste, documentação operacional e página técnica mínima em espanhol.

**Dependências:** preparação do repositório e decisões de runtime. **Riscos:** instalar integrações antes de serem necessárias, expor segredos, fechar prematuramente decisões visuais. **Testes:** instalação limpa, lint, format check, typecheck, unitário mínimo, build, arranque local e smoke test no browser/mobile.

**Aceitação:** build e CI limpos; preview acessível; nenhum segredo no Git; página abre sem erros; configuração de serviços de teste está isolada e documentada. A integração local pode limitar-se a configuração verificável: não criar domínio, tabelas ou fluxos comerciais.

### Fase 1 — Design System base

**Objetivo:** criar primitivas visuais acessíveis e consistentes, sem páginas comerciais.

**Entregáveis:** cores, tipografia, espaçamento, `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Badge`, `Alert`, `Modal`, `Drawer`, `Loading`, `EmptyState` e `ErrorState`, incluindo tamanhos, estados, foco, erro e disabled. Storybook ou alternativa apenas se reduzir efetivamente o custo de revisão.

**Dependências:** Fase 0. **Riscos:** aparência genérica, abstração precoce e API incompatível com formulários futuros. **Testes:** unitários de comportamento, acessibilidade automatizada, teclado, mobile e snapshots/regressão visual estável.

**Aceitação:** catálogo isolado dos componentes revisto; WCAG AA; APIs preparadas para formulários, checkout e subscrições futuras sem incluir lógica dessas áreas.

### Fase 2 — Estrutura pública e navegação

**Objetivo:** tornar todas as áreas públicas navegáveis com conteúdo local estruturado.

**Entregáveis:** layout, Header, menu móvel, Footer, breadcrumbs, metadados SEO, sitemap, robots, 404, erro e loading globais; estruturas de Home, Pan, Obrador, Nosotros, Plan de Pan, Dónde estamos, Reserva y recoge, Contacto e páginas legais.

**Dependências:** Fases 0–1. **Riscos:** confundir estrutura com conteúdo final. **Testes:** rotas, links, landmarks, teclado, SEO básico, viewport móvel e ausência de overflow.

**Aceitação:** todas as rotas carregam, são navegáveis e semanticamente corretas; nenhum conteúdo placeholder é apresentado como definitivo.

### Fase 3 — Conteúdo e identidade visual

**Objetivo:** aplicar a identidade aprovada e o conteúdo real, sem comércio completo.

**Entregáveis:** textos aprovados, ilustrações e fotografias disponíveis, paleta, tipografia, composição e narrativa da Home, movimento responsivo e `prefers-reduced-motion`.

**Dependências:** Fases 1–2 e ativos/conteúdos aprovados. **Riscos:** regressão visual, imitação da referência e excesso de movimento. **Testes:** regressão visual, WCAG AA, mobile, reduced motion e comparação lado a lado a 25%.

**Aceitação:** identidade claramente distinta da Casa de Panaderos; sem dependência visual genérica de shadcn; conteúdo real identificado; revisão humana de marca aprovada.

### Fase 4 — Base de dados e autenticação

**Objetivo:** estabelecer identidade, autorização e persistência seguras, mantendo compra sem conta.

**Entregáveis:** Supabase, migrações versionadas, `users`, `customer_profiles`, roles, autenticação, conta, suporte explícito a guest checkout e vínculo posterior de encomendas, RLS e auditoria básica. Seeds apenas fictícios e marcados como desenvolvimento.

**Dependências:** Fase 0; decisões de privacidade e contratos de domínio mínimos. **Riscos:** RLS incompleta, acoplamento entre encomenda e conta. **Testes:** migrações limpa/upgrade, integração de auth, matriz de RLS e isolamento entre clientes.

**Aceitação:** cliente não vê dados alheios; operador não altera preços; admin tem apenas permissões aprovadas; compra sem conta continua possível por desenho.

### Fase 5 — Catálogo

**Objetivo:** gerir e apresentar produtos vendáveis com informação real.

**Entregáveis:** famílias, produtos, variantes, ingredientes, alergénios, imagens, estados, preços, dias de produção, associação produto–ponto e painel mínimo; catálogo, filtros, cartões e detalhe. Disponibilidade simplificada, mas calculada de dados reais.

**Dependências:** Fases 1–4. **Riscos:** modelo rígido e confusão entre publicação e disponibilidade. **Testes:** domínio, preços, filtros, alergénios, permissões e páginas.

**Aceitação:** alterações autorizadas refletem-se no frontend; produtos inativos não são vendáveis; preços e alergénios são consistentes.

### Fase 6 — Pontos de recolha e calendário

**Objetivo:** modelar regras diferentes por local e data sem hardcoding.

**Entregáveis:** obrador e pontos externos, horários, dias, janelas, exceções, encerramentos, produtos aceites, capacidade, mapa/lista e gestão mínima.

**Dependências:** Fases 4–5. **Riscos:** regras temporais ambíguas e fusos horários. **Testes:** calendários, DST/fuso, exceções e permissões.

**Aceitação:** dois pontos podem ter regras diferentes; ponto fechado não é selecionável; produto incompatível é bloqueado; regras vêm de configuração persistida.

### Fase 7 — Motor de disponibilidade

**Objetivo:** responder, de forma determinística e segura, quanto pode ser reservado para variante, data e ponto.

**Entregáveis:** capacidade por variante/data e ponto/data, confirmadas, holds temporários, encerramentos, produção, cutoff configurável, extensão futura para subscrições e mensagens de estado.

**Dependências:** Fases 4–6. **Riscos:** overselling, race conditions e divergência de relógio. **Testes obrigatórios:** disponível, esgotado, ponto completo, produto não produzido, ponto fechado, cutoff ultrapassado, libertação e dois clientes na última unidade.

**Aceitação:** invariantes protegidas transacionalmente; testes de concorrência aprovados. Esta fase bloqueia carrinho e checkout e não pode ser dispensada.

### Fase 8 — Carrinho e reserva temporária

**Objetivo:** construir a seleção do cliente e criar holds apenas no momento definido.

**Entregáveis:** carrinho anónimo/autenticado, persistência, fusão pós-login, data, ponto, quantidades, incompatibilidades, hold, expiração, contador e libertação.

**Dependências:** Fases 5–7. **Riscos:** carrinho ser confundido com reserva e stock órfão. **Testes:** domínio, integração de expiração, mudança de data/ponto, fusão, múltiplos separadores e E2E.

**Aceitação:** adicionar ao carrinho não reserva; criação de hold é explícita; expiração devolve capacidade; qualquer alteração relevante recalcula tudo.

### Fase 9 — Checkout e Stripe

**Objetivo:** cobrar antecipadamente e confirmar exatamente uma encomenda por pagamento válido.

**Entregáveis:** revisão, dados do cliente, tentativa de encomenda, Payment Intent, webhook verificado, idempotência, sucesso/falha/duplicação, reconciliação e reembolso técnico.

**Dependências:** Fases 4, 7 e 8. **Riscos:** duplicação, confirmação pelo cliente em vez do webhook e estados financeiros divergentes. **Testes:** Stripe test, assinaturas, repetição/ordem de eventos, falhas internas e E2E.

**Aceitação:** webhook é a fonte final de verdade; aprovado gera uma encomenda; falhado não confirma; repetição não duplica; aprovado com falha interna entra em reconciliação.

### Fase 10 — Encomendas e estados

**Objetivo:** gerir o ciclo de vida auditável após pagamento.

**Entregáveis:** estados, histórico, transições, cancelamento, reembolso, não recolhido, código de recolha, conta, detalhe e próxima recolha; acesso de convidado por ligação segura e revogável.

**Dependências:** Fase 9. **Riscos:** transições inválidas e links de convidado expostos. **Testes:** máquina de estados, autorização, expiração/revogação, integração financeira e E2E.

**Aceitação:** transições inválidas bloqueadas; tudo auditado; cliente só vê as próprias encomendas; convidado só acede à encomenda autorizada.

### Fase 11 — Painel de produção

**Objetivo:** dar à equipa a vista operacional mínima para hoje e amanhã.

**Entregáveis:** produção por data, totais por produto/variante/ponto, pedidos, impressão, lotes, ações em massa e estados pronto, entregue ao ponto, recolhido e não recolhido.

**Dependências:** Fases 5–10. **Riscos:** ações em massa irreversíveis e interface inutilizável em mobile/impressão. **Testes:** agregações, permissões, transições, impressão, mobile e E2E operacional.

**Aceitação:** totais reconciliam com pedidos; ações são auditáveis; hoje/amanhã, telemóvel e impressão aprovados. Não incluir dashboards analíticos.

### Fase 12 — Emails e notificações

**Objetivo:** comunicar eventos sem tornar a encomenda dependente do email.

**Entregáveis:** confirmação, falha de pagamento, lembrete, pronto, entregue no ponto, cancelamento, reembolso, conta, recuperação, tentativas, falhas e histórico.

**Dependências:** Fases 9–11; recuperação de conta pode começar após a Fase 4. **Riscos:** duplicação, dados sensíveis e falha silenciosa. **Testes:** templates, filas/retries, idempotência, links e integração em sandbox.

**Aceitação:** falha de email nunca desfaz uma encomenda confirmada; tentativas são observáveis e reprocessáveis.

### Fase 13 — Conteúdo administrativo

**Objetivo:** permitir à equipa manter apenas conteúdo e regras necessários.

**Entregáveis:** edição de produtos, preços, alergénios, imagens, disponibilidade, pontos, horários, encerramentos e, se a arquitetura aprovada permitir, textos institucionais.

**Dependências:** Fases 4–6 e 11. **Riscos:** construir um CMS genérico. **Testes:** autorização, validação, auditoria e regressão frontend.

**Aceitação:** tarefas frequentes são executáveis sem acesso técnico; não existe funcionalidade administrativa sem uso aprovado.

### Fase 14 — Segurança, privacidade e legal

**Objetivo:** endurecer o sistema e operacionalizar obrigações confirmadas.

**Entregáveis:** consentimentos, cookies, políticas, exportação, eliminação, anonimização, conservação, rate limiting, endpoints protegidos, webhooks verificados, logs sem dados sensíveis e backups.

**Dependências:** Fases 4–13 e validação jurídica. **Riscos:** declarar conformidade sem parecer jurídico e eliminar dados incompatíveis com obrigações. **Testes:** autorização, abuso, privacy workflows, restore e análise de logs.

**Aceitação:** controlos técnicos testados; itens dependentes de validação jurídica permanecem explicitamente pendentes.

### Fase 15 — Performance e acessibilidade

**Objetivo:** auditar e corrigir a experiência completa antes de QA final.

**Entregáveis:** auditorias Lighthouse e axe, teclado, leitor de ecrã, Core Web Vitals, bundle, imagens, fontes, caching, queries, mobile e reduced motion.

**Dependências:** Fases públicas e comerciais estabilizadas. **Riscos:** otimização cosmética e regressão funcional. **Testes:** automatizados, laboratório, dispositivo real e revisão humana.

**Aceitação:** WCAG AA; zero erro crítico; objetivo de LCP documentado e cumprido; CLS controlado; INP aceitável; conteúdo essencial não depende de JavaScript para ficar escondido.

### Fase 16 — QA e pré-produção

**Objetivo:** provar os fluxos completos num ambiente equivalente a produção.

**Entregáveis:** matriz de browsers/dispositivos; checkout, webhooks, concorrência, cancelamentos, reembolsos, emails, horários, pontos, encerramentos, erros e recuperação; checklist de lançamento.

**Dependências:** Fases 0–15. **Riscos:** ambiente pouco representativo e cenários críticos omitidos. **Testes:** E2E, exploratório, concorrência, segurança e recuperação.

**Aceitação:** zero bloqueador ou crítico aberto; restantes riscos aceites e documentados; checklist assinado.

### Fase 17 — Produção

**Objetivo:** lançar de forma controlada e reversível.

**Entregáveis:** domínio, DNS, Vercel, Supabase produção, Stripe live, Resend, secrets, migrações, backups, monitorização, rollback e validação pós-deploy.

**Dependências:** Fase 16. **Riscos:** secrets errados, migração destrutiva e mistura de dados. **Testes:** smoke pós-deploy, pagamento real controlado conforme autorização, webhooks, email, backup/restore e observabilidade.

**Aceitação:** ambientes isolados; dados de teste ausentes; monitorização e rollback prontos; checklist pós-deploy aprovado.

### Fase 18 — Subscrições

**Objetivo:** acrescentar recorrência apenas após o fluxo avulso estar estável em produção.

**Entregáveis:** planos, frequência fixa, prioridade de stock, cobrança, geração de entregas, pausa, retoma, salto, alteração, cancelamento, falha de pagamento, portal, emails e painel.

**Dependências:** Fase 17, estabilidade medida do fluxo avulso e decisões comerciais aprovadas. **Riscos:** dupla contagem de capacidade e estados financeiros complexos. **Testes:** recorrência temporal, concorrência, billing, retries, capacidade e E2E.

**Aceitação:** subscrição e compra avulsa partilham invariantes sem regressão; prioridade e capacidade são explícitas; falhas são recuperáveis.

### Fase 19 — Pontos externos avançados

**Objetivo:** delegar operações por ponto quando a necessidade real estiver demonstrada.

**Entregáveis:** portal do responsável, receção de lote, confirmação de recolha, permissões por ponto, relatórios e incidências.

**Dependências:** Fases 11, 14 e 17. **Riscos:** isolamento insuficiente e burocracia operacional. **Testes:** autorização por ponto, auditoria e E2E de lote/recolha.

**Aceitação:** responsável só vê/atua no seu ponto; incidências e ações são auditadas; fluxo foi validado com utilizadores reais.

### Fase 20 — Funcionalidades futuras

**Objetivo:** manter oportunidades fora do âmbito corrente.

**Backlog sem implementação:** diário, fidelização, cartões oferta, promoções, códigos, entrega ao domicílio, mais obradores, multi-idioma, analytics avançada e previsão de produção.

**Entrada futura:** cada item exige problema validado, regras aprovadas, impacto em privacidade/capacidade e uma fase própria. A presença nesta lista não autoriza implementação.

## 25. Dependências entre fases

| Fase | Depende de | Bloqueia | Pode correr em paralelo | Risco de retrabalho |
|---|---|---|---|---|
| 0 Fundação | Preparação | Todas | Nenhuma | Médio |
| 1 Design System | 0 | 2, 3, interfaces seguintes | Contratos iniciais da 4 | Médio |
| 2 Estrutura pública | 0, 1 | 3 | Modelação inicial da 4 | Baixo |
| 3 Conteúdo/identidade | 1, 2 | 15, 16 | 4, 5 com contratos estáveis | Médio |
| 4 Dados/auth | 0 | 5–14 | 2, 3 | Alto |
| 5 Catálogo | 1, 4 | 6–13 | Final da 3 | Alto |
| 6 Pontos/calendário | 4, 5 | 7–13 | Polimento da 3 | Alto |
| 7 Disponibilidade | 4–6 | 8, 9 | Nenhuma no mesmo domínio | Muito alto |
| 8 Carrinho/holds | 5–7 | 9 | Preparação de templates da 12 | Alto |
| 9 Checkout/Stripe | 4, 7, 8 | 10–12 | Conteúdo administrativo não financeiro | Muito alto |
| 10 Encomendas | 9 | 11, 12 | Partes isoladas da 13 | Alto |
| 11 Produção | 5–10 | 13, 16 | Templates da 12 | Médio |
| 12 Notificações | 9–11 | 16 | 13 | Médio |
| 13 Administração | 4–6, 11 | 16 | 12, partes da 14 | Médio |
| 14 Segurança/legal | 4–13 | 16, 17 | 12, 13, início da 15 | Alto |
| 15 Performance/a11y | Interfaces estáveis | 16 | Final da 14 | Médio |
| 16 QA | 0–15 | 17 | Nenhuma alteração funcional ampla | Muito alto |
| 17 Produção | 16 | 18, 19 | Nenhuma | Muito alto |
| 18 Subscrições | 17 + estabilidade | — | 19, se equipas/contratos isolados | Muito alto |
| 19 Pontos avançados | 11, 14, 17 | — | 18 com contratos congelados | Alto |
| 20 Futuro | Necessidade validada | — | Não aplicável | Indeterminado |

Paralelo significa trabalho em branches e contratos acordados; não dispensa integração sequencial nem gates.

## 26. Critérios de entrada e saída

Aplicam-se a todas as fases, além dos critérios específicos descritos acima.

| Elemento | Critério obrigatório |
|---|---|
| Pré-condições | Fases dependentes aprovadas; decisões e dados necessários disponíveis; branch atualizada; âmbito e rollback definidos |
| Entregáveis | Lista fechada, documentação atualizada e migrações/configuração incluídas quando aplicável |
| Testes | Suite da fase e regressão afetada verdes em ambiente limpo/CI |
| Validação humana | Browser desktop/mobile; acessibilidade e operação relevantes; produto/design/negócio quando aplicável |
| Condição para avançar | Critérios de aceitação demonstrados; zero bloqueador; riscos residuais registados; PR aprovado e integrado |

Se uma pré-condição faltar, a fase deve parar sem preencher a lacuna com uma suposição comercial. Se um teste falhar, corrigir dentro do âmbito ou abrir um bloqueio explícito; nunca reduzir o teste para obter verde.

## 27. Estratégia de testes por fase

| Fase(s) | Unitários | Integração | E2E | Visual | A11y | Concorrência | Segurança | Manual |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | Básico | CI/config | Smoke | Página mínima | Básica | — | Secrets | Desktop/mobile |
| 1 | Forte | Componentes | — | Forte | Forte | — | — | Teclado/mobile |
| 2–3 | Médio | Rotas/SEO | Navegação | Forte | Forte | — | Headers básicos | Marca/responsive |
| 4 | Forte | Forte | Auth/guest | — | Formulários | — | Muito forte/RLS | Matriz de roles |
| 5–6 | Forte | Forte | Catálogo/pontos | Médio | Forte | Casos de capacidade | Roles | Regras operacionais |
| 7 | Muito forte | Muito forte | Cenários críticos | — | Mensagens | Obrigatória | Integridade | Casos-limite |
| 8 | Forte | Muito forte | Carrinho/expiração | Médio | Forte | Obrigatória | Sessão | Multi-tab/mobile |
| 9 | Forte | Muito forte | Checkout | Médio | Forte | Webhooks | Muito forte | Stripe test |
| 10–13 | Forte | Forte | Cliente/operação | Médio | Forte | Ações simultâneas | Roles/links | Mobile/impressão |
| 14 | Médio | Forte | Privacy | — | Consentimento | Rate limits | Muito forte | Restore/legal |
| 15 | Regressão | Performance | Fluxos | Muito forte | Muito forte | — | Regressão | Dispositivos reais |
| 16 | Regressão | Completa | Muito forte | Forte | Forte | Muito forte | Forte | Exploratória |
| 17 | Smoke | Serviços live | Jornada controlada | Smoke | Smoke | Monitorizada | Secrets/webhooks | Pós-deploy |
| 18–19 | Muito forte | Muito forte | Muito forte | Médio | Forte | Muito forte | Muito forte | Operação real |

## 28. Estratégia de prompts para Claude Code

Cada prompt deve:

1. Identificar uma única fase e, se necessário, um sub-bloco pequeno dessa fase.
2. Explicar o objetivo e apenas o contexto mínimo necessário, referenciando documentos em vez de os reinterpretar.
3. Enumerar ficheiros/diretórios permitidos e proibidos; exigir preservação do trabalho existente.
4. Dar tarefas ordenadas, critérios observáveis e fora de âmbito explícito.
5. Indicar testes obrigatórios e comandos de validação, sem aceitar remoção de testes ou supressões como solução.
6. Definir comportamento em erro: parar antes de push, diagnosticar, documentar bloqueio e não alargar âmbito.
7. Exigir resumo final com alterações, decisões, testes, riscos e estado Git.
8. Definir branch, commits, PR, push e tag conforme a política da fase.
9. Pedir inspeção antes de edição e proibir pressupor que o repositório está vazio.
10. Nunca usar pedidos vagos como “implementa tudo”.

Um prompt não deve autorizar deploy, dados live, alterações destrutivas ou serviços pagos por implicação; essas ações devem ser explícitas.

## 29. Template de prompt de implementação

```text
# [Fase N — Nome / subfase]

## Objetivo
[Um resultado funcional e verificável.]

## Âmbito
Incluído:
- [...]

Fora de âmbito:
- [...]

## Leitura mínima necessária
- docs/06-roadmap-de-implementacao.md: [secções]
- [documentos/ficheiros relevantes]

## Antes de alterar
- Inspeciona estado Git, branch, estrutura e implementação existente.
- Não assumes que o diretório está vazio.
- Regista conflitos ou pré-condições em falta e para se alterarem o âmbito.

## Alterações permitidas
- [ficheiros/diretórios]

## Ficheiros proibidos
- [ficheiros/diretórios]
- Não apagar nem substituir documentação ou ativos existentes.

## Restrições
- [regras de negócio, segurança e arquitetura]
- Não implementar fases futuras.
- Não adicionar dependências sem justificar.

## Tarefas
1. [...]
2. [...]

## Critérios de aceitação
- [...]

## Testes obrigatórios
- [unitários/integração/E2E/visual/a11y/manual]

## Comandos de validação
- [comandos concretos existentes no projeto]

## Comportamento em caso de erro
- Não remover testes, reduzir garantias ou fazer push com validações falhadas.
- Diagnostica apenas dentro do âmbito; documenta bloqueios e pede decisão quando necessário.

## Git
- Branch: [nome e base]
- Commits: [convenção]
- Push/PR/tag: [ações autorizadas]
- Proibido force push e reescrita de histórico partilhado.

## Resultado esperado
No fim informa: ficheiros alterados; dependências; decisões; resultados dos testes; validação manual; riscos/bloqueios; commits; push/PR/tag. Confirma que não alteraste o que estava fora do âmbito.
```

## 30. Estratégia de Git por fase

1. **Branch:** criar `phase/<numero>-<slug>` a partir de `main` atualizada, salvo decisão explícita de integração via `develop`.
2. **Commit inicial:** não criar commit vazio. O primeiro commit deve conter a menor fundação coerente da fase.
3. **Intermediários:** separar configuração, domínio, interface, testes e documentação quando cada parte for isoladamente válida; evitar WIP em remoto partilhado.
4. **Commit final:** testes/documentação finais ou ajuste coerente; não usar um commit “final” vazio.
5. **Mensagem:** Conventional Commits com âmbito quando útil, por exemplo `feat(availability): enforce pickup capacity`.
6. **Tag:** apenas após uma entrega publicável aprovada; formato definido no repositório.
7. **Push:** apenas com validações locais relevantes verdes; publicar a branch, não forçar.
8. **PR:** incluir resumo, fora de âmbito, screenshots quando visual, migrações, evidências, riscos e plano de rollback.
9. **Rollback:** reverter o merge/commit; usar migrações forward-compatible e feature flags apenas quando justificadas; nunca apagar dados automaticamente.

## 31. Riscos de execução

| Risco | Mitigação |
|---|---|
| Fases demasiado grandes | Dividir por resultado vertical pequeno, limitar ficheiros e exigir um gate por subfase |
| Código antes de decisão | Gate de entrada e registo de decisão; parar perante regra comercial ambígua |
| Excesso de abstração | Implementar para casos atuais e uma extensão conhecida; rever abstrações só após repetição real |
| Testes ignorados | CI obrigatório e proibição de merge/push publicável com falhas |
| Dados fictícios em produção | Separar ambientes; marcar seeds; impedir execução de seeds de dev em produção |
| Dependência excessiva de Claude | Revisão humana, documentação de decisões, testes independentes e PRs pequenos |
| Documentação desatualizada | Atualização documental como critério de saída e revisão no PR |
| Regressão visual | Baselines aprovadas, comparação por viewport e revisão de marca |
| Dívida técnica | Registar com impacto e condição de resolução; reservar correções antes de fases dependentes |
| Sobreengenharia | Métrica de necessidade, dependências justificadas e rejeição de plataformas genéricas sem caso atual |
| Overselling/concorrência | Invariantes na base de dados, transações e testes concorrentes antes do checkout |
| Divergência pagamento–encomenda | Webhook idempotente, estados explícitos, reconciliação e auditoria |
| Regras hardcoded | Modelar horários, capacidades, cutoffs e compatibilidades como configuração validada |
| Mistura de ambientes | Projetos, chaves, dados e pipelines separados; guardas de ambiente |

O maior risco é aceitar mais encomendas do que a capacidade real, especialmente sob concorrência entre hold, pagamento e webhook. A mitigação central é proteger invariantes de disponibilidade de forma transacional e bloquear a Fase 8 até os testes concorrentes da Fase 7 passarem.

## 32. Ordem final recomendada

| Nº | Fase | Objetivo | Duração relativa | Risco | Valor entregue | Condição de aprovação |
|---:|---|---|---|---|---|---|
| 0 | Fundação técnica | Base reproduzível | Curta | Médio | Aplicação publicável mínima | CI/build/smoke verdes |
| 1 | Design System | Primitivas acessíveis | Média | Médio | Base visual reutilizável | Estados, a11y e mobile aprovados |
| 2 | Estrutura pública | Rotas e navegação | Curta | Baixo | Site navegável | Rotas/SEO/teclado aprovados |
| 3 | Conteúdo e identidade | Marca e narrativa reais | Média | Médio | Presença pública coerente | Marca, AA e mobile aprovados |
| 4 | Dados e autenticação | Persistência e acesso | Longa | Alto | Base segura e guest-ready | Migrações/RLS/roles aprovadas |
| 5 | Catálogo | Produtos geríveis | Média | Alto | Oferta consultável | Dados/preços/alergénios corretos |
| 6 | Pontos e calendário | Regras por local/data | Média | Alto | Recolha configurável | Exceções e compatibilidades aprovadas |
| 7 | Disponibilidade | Capacidade real | Longa | Muito alto | Venda sem overselling | Concorrência obrigatoriamente verde |
| 8 | Carrinho e holds | Seleção e reserva temporária | Longa | Alto | Pré-checkout funcional | Expiração/recalculo/E2E verdes |
| 9 | Checkout e Stripe | Pagamento antecipado | Longa | Muito alto | Compra paga | Webhook/idempotência/reconciliação verdes |
| 10 | Encomendas | Ciclo de vida | Média | Alto | Consulta e gestão pós-compra | Estados/autorização aprovados |
| 11 | Produção | Operação diária | Média | Médio | Plano hoje/amanhã | Totais, mobile e impressão aprovados |
| 12 | Notificações | Comunicação resiliente | Média | Médio | Cliente informado | Falhas/retries/idempotência aprovados |
| 13 | Administração | Autonomia operacional mínima | Média | Médio | Manutenção sem equipa técnica | Roles/auditoria/usabilidade aprovadas |
| 14 | Segurança/legal | Proteção e privacidade | Longa | Alto | Sistema endurecido | Controlos testados; pareceres pendentes marcados |
| 15 | Performance/a11y | Qualidade transversal | Média | Médio | Experiência inclusiva e rápida | AA e metas web aprovadas |
| 16 | QA/pré-produção | Prova integral | Longa | Muito alto | Confiança de lançamento | Zero bloqueador e checklist assinado |
| 17 | Produção | Lançamento controlado | Média | Muito alto | Serviço live | Smoke, monitorização e rollback prontos |
| 18 | Subscrições | Recorrência | Longa | Muito alto | Planos recorrentes | Fluxo avulso estável e regressão verde |
| 19 | Pontos avançados | Delegação por ponto | Longa | Alto | Operação externa escalável | Necessidade real e isolamento aprovados |
| 20 | Futuro | Backlog controlado | Curta | Indeterminado | Direção sem scope creep | Nenhuma implementação sem nova aprovação |

## 33. Próximo prompt recomendado — Fase 0

O texto seguinte está pronto para copiar para Claude Code. Deve ser ajustado apenas se a inspeção inicial revelar uma base técnica já existente ou uma política Git diferente aprovada.

```text
Inicia a Fase 0 — Fundação Técnica do projeto FUERZA.

Diretório do projeto:
/Users/diogovidal/Documents/ProyectoIA/fuerza

## Objetivo

Criar uma fundação técnica mínima, reproduzível e funcional com Next.js, React, TypeScript e Tailwind, pronta para as fases seguintes. Não implementar funcionalidades de negócio.

## Leitura mínima obrigatória

Antes de alterar, lê:
- docs/06-roadmap-de-implementacao.md, especialmente as secções 1–4, 26–30 e 33;
- os restantes documentos do projeto que definam identidade, arquitetura ou restrições da Fase 0.

## Antes de alterar

1. Inspeciona o estado Git, branch, remotos, ficheiros existentes, versões de Node/npm e qualquer estrutura técnica parcial.
2. Não assumes que o diretório está vazio.
3. Preserva .git/, docs/, public/, ativos, histórico e alterações existentes.
4. Confirma a estratégia Git antes de criar a branch `phase/0-foundation`; se a política já aprovada for diferente, segue-a e explica.
5. Se encontrares alterações não relacionadas que entrem em conflito, para e informa; não as descartes.

## Alterações permitidas

- Ficheiros de configuração na raiz necessários à aplicação e qualidade.
- src/ e testes da fundação.
- .github/workflows/ para CI inicial.
- Documentação técnica/contributiva da Fase 0.
- .env.example sem valores reais.

## Ficheiros e ações proibidos

- Não apagar, substituir ou reescrever documentos e ativos existentes.
- Não alterar regras comerciais já aprovadas.
- Não criar catálogo, carrinho, reservas, checkout, encomendas, autenticação, base de dados de domínio, subscrições ou painel.
- Não usar credenciais live nem colocar qualquer segredo no Git.
- Não fazer deploy de produção.

## Tarefas

1. Inicializa ou completa o projeto na raiz com Next.js App Router, React, TypeScript, Tailwind, ESLint e alias `@/*`, sem criar uma subpasta adicional.
2. Usa uma versão suportada de Node/npm e documenta os requisitos para instalações reproduzíveis.
3. Cria a estrutura mínima de pastas; não cries abstrações ou diretórios vazios sem uso.
4. Configura os tokens visuais fundamentais já aprovados e uma única solução tipográfica segura via `next/font`; não feches o design system da Fase 1.
5. Configura scripts de desenvolvimento, build, start, lint, format check, typecheck e test.
6. Configura uma infraestrutura mínima de testes com pelo menos um teste útil da fundação.
7. Cria `.env.example` com placeholders para os serviços previstos, sem segredos, e garante que ficheiros de ambiente reais ficam ignorados.
8. Prepara configuração local/teste de Supabase, Stripe e Resend somente até ao necessário para documentar e validar o ambiente. Não cries tabelas, domínio, pagamentos, emails reais ou dependências sem necessidade técnica atual. Se uma CLI/SDK não for necessária na Fase 0, documenta a integração futura em vez de a instalar.
9. Configura CI para instalação limpa, lint, format check, typecheck, testes e build.
10. Cria uma página mínima em espanhol de Espanha que confirme a aplicação, os tokens e o ativo de marca, sem construir páginas comerciais.
11. Documenta instalação, ambiente, comandos, estrutura, contribuição, segurança de secrets e preview.

## Critérios de aceitação

- package.json está na raiz e a instalação é reproduzível.
- Aplicação abre localmente e o preview funciona sem erros de consola.
- Página mínima é responsiva, não tem scroll horizontal e tem semântica e foco visível.
- Build, lint, format check, typecheck e testes passam localmente e em CI.
- Nenhum segredo, dado live ou funcionalidade de negócio foi criado.
- Nenhum documento, ativo, histórico ou alteração alheia foi apagado.
- Dependências adicionadas estão justificadas no resumo.

## Validação obrigatória

Usa os comandos definidos pelo package.json para:
- instalação limpa;
- lint;
- format check;
- typecheck;
- testes;
- build;
- arranque local/preview.

Valida no browser em desktop e mobile, incluindo consola, teclado, foco, semântica, contraste básico e ausência de overflow. Não repitas suites completas sem alteração relevante.

## Comportamento em caso de erro

- Não removas testes, regras de lint, garantias de tipos ou controlos para obter um resultado verde.
- Diagnostica dentro do âmbito da Fase 0.
- Se faltar uma decisão que altere arquitetura, custos, serviços externos ou dados, para e pede decisão.
- Não faças push nem abras PR com validações obrigatórias falhadas.

## Git

- Trabalha na branch acordada para a Fase 0, preferencialmente `phase/0-foundation` a partir de `main` atualizada.
- Usa Conventional Commits pequenos e coerentes.
- Não uses force push, não reescrevas histórico e não cries commits vazios.
- Depois de todas as validações, faz push da branch e abre PR apenas se estiveres autorizado e o acesso remoto estiver configurado.
- Não cries tag antes de a entrega ser revista e aprovada.

## Relatório final

Informa:
1. branch e estado Git;
2. ficheiros criados/alterados;
3. dependências e justificação;
4. versões de Node, npm e Next.js;
5. resultados de lint, format check, typecheck, testes, build e CI;
6. URL local/preview e validações manuais;
7. variáveis documentadas, sem revelar valores;
8. commit(s), push e PR;
9. problemas, decisões e riscos pendentes;
10. confirmação de que não implementaste fases futuras e não apagaste documentos ou ativos.
```

---

Este roadmap contém **21 fases**, numeradas de 0 a 20. Qualquer mudança de ordem deve explicar dependências, risco de retrabalho e o novo gate de aprovação.
