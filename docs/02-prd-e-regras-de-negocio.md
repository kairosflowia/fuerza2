# FUERZA — PRD e Regras de Negócio

**Documento 02** · Especificação funcional operacional
Data: 3 de agosto de 2026
Estado: proposta para validação — sem código, sem schemas, sem componentes
Fonte principal: [Documento 01 — Análise e Direção Criativa](01-analise-e-direcao-criativa.md)

---

## Nota de leitura

**Idioma.** O documento está escrito em português para a equipa técnica. **Todos os nomes de produto, estados visíveis, textos de interface, exemplos de comunicação e conceitos apresentados ao cliente final estão em espanhol de Espanha (es-ES)** e aparecem sempre «entre aspas angulares» ou em tabelas identificadas como *rótulo visível*. Identificadores internos de estado estão em `snake_case` neutro — são vocabulário de domínio, não código, e existem para que ninguém os invente durante a implementação.

**Renumeração.** O Documento 01 previa que o Documento 02 fosse o Sistema de Design. A ordem foi alterada: o PRD passa a ser o 02 e o Sistema de Design passa para 03. É a ordem correta — as regras de negócio condicionam componentes que o sistema de design terá de prever (faixa de disponibilidade, seletor de data, estados de encomenda).

**Decisões.** Há dois marcadores, e a distinção é importante:

- **`DA-nn` — decisão aprovada.** Tomada pelos responsáveis do FUERZA. É **regra do produto** e não se reabre durante a implementação. Recolhidas em §18.0.
- **`DP-nn` — decisão pendente.** Ainda por responder. Onde apresento uma recomendação, ela é uma recomendação — não um facto. Recolhidas em §18.1.

Com exceção do que está fixado em §18.0, nenhum preço, morada, horário de ponto externo, capacidade ou política comercial neste documento é real: são todos variáveis à espera de valor.

**Histórico de revisões**

| Data | Alteração |
|---|---|
| 2026-08-03 | Versão inicial |
| 2026-08-03 | `DA-01` (pagamento antecipado) e `DA-02` (horário do obrador) aprovadas. `DP-18` removida das pendentes. `DP-02` mantém-se pendente |

**Conflitos.** Onde uma experiência mais sofisticada colide com a capacidade operacional de um obrador pequeno, o conflito está assinalado com **⚖️** e resolvido com a recomendação mais sustentável, como pedido.

---

# 1. Visão geral do produto

## 1.1 Problema que o produto resolve

FUERZA é um obrador artesanal de masa madre situado nas Astúrias, com produção limitada por natureza: um forno, uma equipa pequena, e um produto que leva entre um e dois dias a fazer. Este modelo produz três problemas simultâneos que hoje não têm solução digital:

**Do lado do obrador.** A produção é decidida por estimativa. Assar a mais gera desperdício de um produto que não dura; assar a menos gera clientes que saem de mãos vazias. Nenhum dos dois erros é recuperável no dia seguinte.

**Do lado do cliente.** Não há forma de garantir que o pão que quer estará lá quando chegar. Quem trabalha e só pode passar às 19h aprende que às 19h já não há. O cliente fiel é penalizado pela sua própria fidelidade.

**Do lado da expansão.** Vender apenas no balcão do obrador limita o alcance ao raio de caminhada. Pontos de recolha noutros locais — dentro e fora de Avilés — exigem saber com antecedência quanto levar a cada um. Sem reserva digital, essa expansão é impossível de operar.

A referência analisada no Documento 01 não resolve nenhum destes problemas: Casa de Panaderos não tem catálogo, não mostra disponibilidade, e delega a encomenda a um domínio externo (§3 e §10 do Documento 01). O FUERZA parte, portanto, de um espaço em aberto.

## 1.2 Proposta de valor

> **Reservas el pan antes de que lo horneemos. Nosotros hacemos exactamente el que hace falta.**

A promessa funciona nos dois sentidos e é honesta em ambos: o cliente garante o seu pão, e o obrador sabe quanto fazer. Não é uma loja online que vende excedente — é um sistema de encomenda antecipada que transforma a limitação de produção em vantagem para os dois lados.

Isto está alinhado com a voz da marca definida em §21 do Documento 01: números concretos em vez de adjetivos, honestidade sobre a escala. Uma mensagem de esgotado no FUERZA não pede desculpa — informa:

> «Hoy ya no queda. Mañana a las 7 salen 40 más.»

## 1.3 Público principal

**Decisão pendente `DP-01`** — os segmentos abaixo são uma hipótese de trabalho derivada do posicionamento da marca, não investigação de mercado validada. Devem ser confirmados pelos responsáveis do FUERZA antes de condicionarem decisões de produto.

| Segmento | Necessidade dominante | Capacidade comercial que serve |
|---|---|---|
| Residente de proximidade (Avilés) | Pão bom, sem filas, sem falhar | Reserva y recoge |
| Cliente recorrente semanal | Não ter de decidir todas as semanas | Plan de Pan (subscrição) |
| Cliente com restrição alimentar | Saber exatamente o que leva | Ficha de produto com alergénios |
| Cliente fora do raio do obrador | Aceder ao produto sem deslocação longa | Pontos de recolha externos |

## 1.4 Contexto do obrador

Premissas operacionais que condicionam **todo** o desenho do produto:

- **Equipa pequena.** Qualquer funcionalidade que exija vigilância constante de um ecrã não será usada. O sistema tem de funcionar com consultas curtas, uma ou duas vezes por dia.
- **Produção em lote, não contínua.** Assa-se num número limitado de fornadas. A unidade de planeamento é a **data de produção**, não a hora.
- **Produto perecível.** Não há stock que transite de um dia para o outro. Toda a disponibilidade é por data e expira.
- **Ciclo de decisão antecipado.** A massa mãe é alimentada e a massa é amassada com muitas horas de antecedência. A hora-limite de encomendas não é uma escolha de interface — é uma restrição física do processo (`DP-02`, pendente).
- **Horário laboral das 09:00 às 18:00** (`DA-02`, §6.2.1). É o horário de funcionamento do obrador principal. **Não é a hora-limite de reserva** e não se aplica a pontos externos.
- **Distribuição própria.** O pão para pontos externos sai do mesmo forno e tem de ser transportado. Cada ponto adicional é trabalho logístico real.

## 1.5 Produto artesanal, produção limitada e reserva digital

Esta é a articulação central do produto e merece ser explícita, porque é onde a maioria dos sistemas de encomenda falha.

**A escassez do FUERZA é real, não é marketing.** O Documento 01 (§ Prioridade 2, ponto 11) estabelece que a produção limitada é um valor declarado da marca e que mostrá-la é simultaneamente verdadeiro e persuasivo. Daqui decorre uma regra de produto que atravessa todo o sistema:

> **Regra fundadora.** A disponibilidade apresentada ao cliente é sempre a disponibilidade real. O sistema nunca simula escassez, nunca esconde stock existente, e nunca aceita uma reserva que não consegue cumprir.

Consequência técnica direta: **não pode existir sobrevenda.** Uma reserva aceite é um compromisso de produção. Isto obriga a decremento atómico de disponibilidade e a reservas temporárias durante o checkout (§5.4 e §15).

Consequência de comunicação: a interface mostra quantidades restantes quando são baixas, e mostra a data em que volta a haver. Não usa contadores regressivos artificiais nem «só restam 2!» quando restam 40.

## 1.6 Compra avulsa vs. subscrição

São dois modelos com finalidades comerciais distintas, e o sistema deve tratá-los como tal:

| | **Reserva y recoge** (avulsa) | **Plan de Pan** (subscrição) |
|---|---|---|
| Iniciativa | Cliente, a cada compra | Cliente, uma vez |
| Frequência | Irregular | Definida no plano |
| Previsibilidade para o obrador | Só após a hora-limite | Semanas de antecedência |
| Compromisso de stock | No momento da reserva | Reservado antes da venda pública |
| Pagamento | Por encomenda | Recorrente |
| Fricção de recompra | Repetida a cada vez | Zero |
| Fase | **1** | **2** |

**A diferença que mais importa é a de prioridade de stock.** A subscrição só tem valor real para o cliente se garantir o pão — caso contrário é apenas um débito automático. Por isso a regra: **a procura das subscrições é reservada antes de a disponibilidade ser aberta à venda avulsa** (§7.9). É esta regra que torna o Plan de Pan defensável, e é ela que a fase 1 tem de deixar possível mesmo antes de a subscrição existir (§16.4).

---

# 2. Objetivos de negócio

Objetivos qualitativos ordenados por prioridade. **Não são atribuídas metas quantitativas** — nenhuma foi fornecida, e inventá-las tornaria os critérios de aceitação falsos.

| # | Objetivo | Como o produto o serve | Meta |
|---|---|---|---|
| 1 | **Reduzir desperdício** | Assar contra procura conhecida em vez de estimativa | `DP-03` |
| 2 | **Antecipar a produção** | Hora-limite de encomendas + mapa de produção do dia seguinte | `DP-03` |
| 3 | **Aumentar a previsibilidade da procura** | Reserva antecipada e, na fase 2, subscrições com procura conhecida com semanas de antecedência | `DP-03` |
| 4 | **Gerar receita recorrente** | Plan de Pan (fase 2) | `DP-03` |
| 5 | **Facilitar a expansão para novos pontos** | Modelo de pontos de recolha independentes desde a fase 1 | `DP-03` |
| 6 | **Criar relação direta com os clientes** | Conta, histórico, comunicação própria — sem intermediário | `DP-03` |
| 7 | **Manter o processo simples para uma equipa pequena** | Restrição transversal — ver abaixo | — |

**O objetivo 7 é uma restrição, não uma aspiração.** Tem poder de veto sobre os outros seis. Sempre que uma funcionalidade sirva os objetivos 1 a 6 mas aumente a carga operacional diária, a decisão por omissão é não a construir na fase em que essa carga não é sustentável. Este princípio é aplicado explicitamente em §7 (modelo de subscrição), §9 (âmbito do painel) e §16 (faseamento).

**Não-objetivos declarados** — coisas que este produto explicitamente não tenta ser:

- Não é um marketplace nem vende produtos de terceiros.
- Não faz entrega ao domicílio (`DP-04` — se vier a fazer, é um novo âmbito, não uma variação da recolha).
- Não é um ERP, nem gestão de stock de matérias-primas, nem contabilidade (§9).
- Não é uma plataforma de franquia. A referência dedica uma página inteira a esse tema; o FUERZA, no âmbito conhecido, não tem esse modelo de negócio.

---

# 3. Tipos de utilizador

Sete perfis. Os três últimos são perfis do painel e partilham a mesma superfície com permissões diferentes.

## 3.1 Visitante

*Rótulo visível:* não aplicável — não se identifica como perfil na interface.

Chega ao site sem sessão. Quer perceber o que é o FUERZA, o que se faz, e se pode comprar.

| | |
|---|---|
| **Necessidades** | Compreender a marca; ver produtos e preços; perceber onde e quando pode levantar; ver disponibilidade real antes de investir tempo |
| **Permissões** | Ler todo o conteúdo público e o catálogo com disponibilidade; iniciar uma reserva |
| **Ações principais** | Navegar; consultar ficha de produto; consultar pontos de recolha; iniciar checkout |
| **Não pode** | Ver encomendas; ver dados de outros; aceder à conta |

## 3.2 Cliente sem conta (*«Cliente invitado»*)

Completa uma reserva sem se registar. **É um perfil de primeira classe, não um caso degradado.**

**Recomendação:** permitir a compra sem registo na fase 1. Obrigar ao registo antes da primeira compra é a fricção mais cara que se pode adicionar a um ticket pequeno e a uma compra de repetição rápida. O registo é oferecido **depois** da confirmação, quando o cliente já tem valor em mãos (`DP-05`).

| | |
|---|---|
| **Necessidades** | Comprar depressa; receber comprovativo; saber onde e quando levantar |
| **Permissões** | Criar encomenda; receber notificações; consultar a sua encomenda por ligação assinada enviada por email |
| **Ações principais** | Reservar; consultar o estado da encomenda; cancelar dentro do prazo (`DP-08`) |
| **Não pode** | Ver histórico; guardar métodos de pagamento; subscrever um plano |

**Regra de identidade.** Uma encomenda sem conta identifica-se por email + código de recolha. Se mais tarde o mesmo email criar conta, as encomendas anteriores associadas a esse email são vinculadas à nova conta, **após verificação do email** — nunca por simples coincidência de endereço.

## 3.3 Cliente registado (*«Cliente»*)

| | |
|---|---|
| **Necessidades** | Repetir a compra com menos passos; consultar histórico; alterar dados sem contactar ninguém |
| **Permissões** | Tudo o que o cliente sem conta pode, mais: histórico, moradas guardadas, métodos de pagamento guardados, preferências, gestão de consentimentos, eliminação de conta |
| **Ações principais** | Reservar; repetir encomenda anterior; consultar próximas recolhas; gerir dados; eliminar conta |
| **Não pode** | Ver dados de outros clientes; aceder ao painel |

## 3.4 Assinante (*«Suscriptor»*)

Cliente registado com um Plan de Pan ativo. **Fase 2.**

| | |
|---|---|
| **Necessidades** | Não pensar no assunto; ter o pão garantido; poder ausentar-se sem penalização; alterar sem falar com ninguém |
| **Permissões** | Tudo o que o cliente registado pode, mais: gerir plano, pausar, retomar, saltar entrega, trocar produto, mudar ponto habitual, cancelar |
| **Ações principais** | Ver próximas entregas; pausar/retomar; saltar uma entrega; alterar plano; cancelar |
| **Garantia distintiva** | Stock reservado antes da abertura à venda avulsa (§7.9) |

## 3.5 Administrador do obrador (*«Administrador»*)

| | |
|---|---|
| **Necessidades** | Saber o que produzir; gerir catálogo, disponibilidade e pontos; resolver exceções |
| **Permissões** | Acesso total ao painel, incluindo catálogo, preços, limites, pontos, encerramentos, reembolsos e gestão de utilizadores do painel |
| **Ações principais** | Publicar produtos; definir limites por data; abrir/fechar datas e pontos; emitir reembolsos; resolver casos da fila de exceções (§15) |
| **Restrição** | Todas as ações administrativas com impacto comercial são registadas em histórico auditável (§14.9) |

## 3.6 Operador de produção (*«Obrador»*)

O perfil de quem está de facto na cozinha. **Deve poder trabalhar com o telemóvel, com as mãos sujas, em três toques.**

| | |
|---|---|
| **Necessidades** | Ver a lista do que fazer hoje e amanhã; marcar o que está feito; marcar o que saiu para cada ponto |
| **Permissões** | Ler o mapa de produção; alterar estado de preparação e de entrega ao ponto; confirmar recolhas no obrador; consultar uma encomenda por código |
| **Não pode** | Alterar preços, catálogo, limites ou dados de clientes; emitir reembolsos |

## 3.7 Responsável por ponto de recolha externo (*«Responsable de punto»*)

Pessoa de um estabelecimento parceiro que recebe e entrega encomendas do FUERZA. **Fase 2** (`DP-06`).

| | |
|---|---|
| **Necessidades** | Saber o que vai receber; confirmar o que recebeu; entregar ao cliente certo |
| **Permissões** | Ler apenas as encomendas **do seu ponto** e **das datas relevantes**; confirmar receção do lote; confirmar entrega ao cliente |
| **Não pode** | Ver outros pontos; ver dados financeiros; ver o catálogo completo; ver o contacto do cliente além do necessário para a entrega (`DP-07`) |

> **⚖️ Conflito experiência × operação.** Dar acesso a um painel a pessoal de estabelecimentos parceiros cria trabalho de suporte, gestão de credenciais e risco de dados. **Recomendação:** na fase 1, os pontos externos operam com uma **lista impressa ou PDF** entregue com o lote, e a confirmação de entrega é feita pelo operador do FUERZA ou pelo cliente. O acesso a painel só se justifica quando o número de pontos tornar o papel insustentável — não antes.

## 3.8 Matriz resumida de permissões

| Ação | Visitante | Invitado | Cliente | Suscriptor | Punto | Obrador | Admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Ver catálogo e disponibilidade | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Criar reserva | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Ver a própria encomenda | — | ✓¹ | ✓ | ✓ | — | — | ✓ |
| Ver histórico | — | — | ✓ | ✓ | — | — | ✓ |
| Gerir subscrição | — | — | — | ✓ | — | — | ✓ |
| Ver mapa de produção | — | — | — | — | — | ✓ | ✓ |
| Marcar preparado / entregue ao ponto | — | — | — | — | — | ✓ | ✓ |
| Confirmar recolha do cliente | — | — | — | — | ✓² | ✓ | ✓ |
| Gerir catálogo, limites e pontos | — | — | — | — | — | — | ✓ |
| Emitir reembolso | — | — | — | — | — | — | ✓ |
| Gerir utilizadores do painel | — | — | — | — | — | — | ✓ |

¹ Por ligação assinada enviada por email. · ² Fase 2, apenas o seu ponto.

---

# 4. Catálogo de produtos

## 4.1 Famílias de produto

Agrupamento de primeiro nível, usado para navegação e filtragem em `/pan`.

> **O Documento 01 (§18) atribui uma cor a cada família como sistema de classificação visual.** Reafirma-se aqui o que o próprio documento estabelece: **essa atribuição é referência de design, não regra comercial.** A cor não determina preço, disponibilidade, política de subscrição nem qualquer comportamento do sistema. É um auxiliar de orientação para o utilizador e nada mais. A taxonomia comercial das famílias — quantas, com que nomes — é `DP-09`.

| Atributo | Descrição |
|---|---|
| Nome | *Rótulo visível*, es-ES |
| Slug | Identificador para URL |
| Descrição | Texto curto de apresentação |
| Cor de classificação | Referência visual (Documento 01 §18) |
| Ordem | Ordenação manual na navegação |
| Estado | `activa` / `oculta` |

## 4.2 Produto

Unidade de catálogo. Estrutura derivada da **etiqueta de produto da própria marca** (Documento 01 §13), que já define o formato de ficha técnica que o FUERZA usa em papel: *PAN DE MASA MADRE / TRIGO Y CENTENO / HARINA LOCAL / FERMENTACIÓN LENTA / HECHO EN ASTURIAS*. A ficha digital deve reproduzir esta estrutura — é coerência de marca e poupa uma decisão de design.

| Atributo | Obrigatório | Notas |
|---|:--:|---|
| Nome | ✓ | es-ES |
| Slug | ✓ | Estável; alterações exigem redirecionamento (§13.6) |
| Família | ✓ | Uma só |
| Descrição curta | ✓ | Para cartão de catálogo e resultados |
| Descrição longa | — | Para ficha; voz da marca (Doc 01 §21) |
| Tipo de farinha | ✓ | Campo destacado — argumento central |
| Origem da farinha / moinho | — | Documento 01 §17: converte valor em facto verificável |
| Fermentação | ✓ | Em horas, número concreto |
| Ingredientes | ✓ | Lista ordenada por peso decrescente |
| Alergénios | ✓ | Ver §4.5 — requisito legal |
| Fotografias | — | Ver §4.6 |
| Estado | ✓ | Ver §4.8 |
| Dias de produção | ✓ | Ver §4.9 |
| Pontos onde está disponível | ✓ | Ver §4.11 |
| Ordem de exibição | — | Manual |
| Metadados SEO | — | Herdados do produto se não preenchidos (§13) |

**Regra de integridade.** Um produto sem variante ativa, sem preço ou sem dias de produção definidos **não pode ser publicado**. O sistema impede a publicação e indica o que falta. É a defesa direta contra o defeito mais grave encontrado na referência: conteúdo por configurar visível em produção (Documento 01 §10).

## 4.3 Variante

Nem todos os produtos têm variantes. Quando têm, a variante é a unidade que se reserva, que tem preço e que tem stock.

| Atributo | Notas |
|---|---|
| Nome | es-ES — ex.: *«Media»* / *«Entera»* |
| Peso | Ver §4.4 |
| Preço | Ver §4.7 |
| Limite por data | Ver §4.10 |
| Estado | Ativa / inativa |

**Regra.** Um produto sem variantes declaradas comporta-se como tendo **uma variante implícita única**. O modelo de dados deve ser uniforme — nunca dois caminhos, um «com variantes» e outro «sem». Esta uniformidade evita a duplicação de lógica que se acumula em todos os sistemas de catálogo.

## 4.4 Peso

Declarado em gramas, na variante. **É peso aproximado e deve ser comunicado como tal** — o pão artesanal não tem peso constante e prometer exatidão é criar reclamações.

*Rótulo visível sugerido:* «Peso aproximado: [n] g»

`DP-10` — margem de tolerância a comunicar, se alguma.

## 4.5 Alergénios

**Requisito legal, não funcionalidade.** O Regulamento (UE) n.º 1169/2011 exige a declaração dos 14 alergénios de declaração obrigatória em alimentos não pré-embalados vendidos ao consumidor final, incluindo venda à distância — e na venda à distância a informação tem de estar disponível **antes da conclusão da compra** e sem custo adicional.

Requisitos:

- Lista fechada dos 14 alergénios do anexo II do regulamento. Não é campo de texto livre.
- Cada alergénio declarado como **presente** ou **possível presença por contaminação cruzada** — a distinção importa e é frequente num obrador pequeno com um só espaço de trabalho.
- Visível na ficha de produto **e** consultável no checkout antes da confirmação.
- Filtrável no catálogo (`DP-11` — confirmar se se filtra por «sem X» na fase 1).

> **Aviso à equipa.** A responsabilidade legal pela exatidão desta informação é do FUERZA, não do sistema. O painel deve exigir confirmação explícita ao publicar ou alterar alergénios, e registar quem confirmou e quando (§14.9).

## 4.6 Fotografias

- Formatos modernos obrigatórios: AVIF com *fallback* WebP (Documento 01, Prioridade 4, ponto 20).
- Dimensões sempre declaradas — a referência não o fazia consistentemente e sofria de deslocamento de layout.
- Texto alternativo em es-ES **obrigatório e descritivo**. A referência tinha 8 de 12 `alt` vazios (Documento 01 §7). Um `alt` vazio só é aceitável em imagem estritamente decorativa.
- Uma imagem principal; galeria opcional.
- **Produto sem fotografia é publicável**, com marcador visual de ausência. A alternativa — bloquear a publicação — levaria o obrador a publicar fotografias más só para desbloquear.

## 4.7 Preço

- Definido na variante, em euros, **com IVA incluído** — obrigatório na venda a consumidor final em Espanha.
- A taxa de IVA aplicável a cada produto é `DP-12`: o pão comum e a bolaria não têm necessariamente o mesmo enquadramento, e a decisão tem de vir de assessoria fiscal do FUERZA, não da equipa de produto.
- **Não são definidos preços neste documento.** Todos os preços são `DP-13`.
- Alteração de preço **nunca altera encomendas já confirmadas**. O preço é fixado no momento da confirmação e guardado com a linha da encomenda. Esta regra não é negociável — é a base da integridade do histórico e da faturação.
- Preços promocionais, descontos e códigos: **fora do âmbito** das fases 1 e 2 (`DP-14`).

## 4.8 Estados do produto

| Estado | *Rótulo visível* | Aparece no catálogo | Reservável | Uso |
|---|---|:--:|:--:|---|
| `activo` | — | ✓ | ✓ | Normal |
| `agotado` | «Agotado» | ✓ | ✗ | Sem disponibilidade na data selecionada |
| `estacional` | «De temporada» | ✓ | Depende da data | Só produzido em certas datas |
| `no_disponible` | «No disponible ahora» | ✓ | ✗ | Pausado temporariamente pelo obrador |
| `descatalogado` | — | ✗ | ✗ | Retirado; URL mantém-se com redirecionamento (§13.6) |
| `borrador` | — | ✗ | ✗ | Em preparação, nunca público |

**Regra de honestidade (Documento 01, §1.5 deste documento).** `agotado` é um estado **calculado por data**, não um interruptor manual. Um produto está esgotado numa data se as reservas dessa data atingiram o limite. Manter um produto visível mas esgotado é deliberado: mostra o que existe e quando volta, em vez de o fazer desaparecer.

*Exemplo de comunicação, es-ES:*
> «Agotado para el [fecha]. Vuelve a haber el [próxima fecha disponible].»

## 4.9 Dias de produção

Define em que dias da semana um produto é feito. É o primeiro filtro do calendário de reserva.

- Padrão semanal (quais dias da semana).
- Exceções por data — produção extraordinária ou suspensão pontual.
- Interseção obrigatória com os dias do ponto de recolha (§6) e com o calendário de encerramentos (§6.9).

**Uma data só é selecionável se satisfizer simultaneamente:** o produto é produzido nessa data **e** o ponto opera nessa data **e** a data não está encerrada **e** a hora-limite ainda não passou **e** há disponibilidade.

## 4.10 Quantidade máxima por data

O mecanismo central de proteção contra sobrevenda. Três níveis de limite, que se aplicam **todos** e em cascata:

| Nível | Limite | Pergunta que responde |
|---|---|---|
| 1 | **Variante × data** | Quantas unidades deste pão consigo assar neste dia? |
| 2 | **Ponto × data** | Quantas unidades no total consigo transportar e o ponto consegue guardar? |
| 3 | *(Opcional)* **Variante × ponto × data** | Deste pão, quantas vão para este ponto? |

**Recomendação:** implementar os níveis 1 e 2 na fase 1. O nível 3 acrescenta precisão que um obrador com poucos pontos não precisa, e triplica a superfície de configuração diária.

> **⚖️ Conflito experiência × operação.** O nível 3 permitiria alocação fina por ponto e evitaria que um ponto esgote um produto que sobra noutro. Mas obriga o obrador a definir, todos os dias, uma matriz de produto × ponto. **Recomendação: níveis 1 e 2 na fase 1.** O nível 3 fica previsto no modelo mas desligado, e só se ativa se a operação mostrar que faz falta.

**Regras de limite:**

- Um limite **nunca pode ser reduzido abaixo da quantidade já reservada** nessa data. O sistema recusa e informa quantas unidades já estão comprometidas (§15, caso 13).
- Aumentar um limite é sempre permitido e tem efeito imediato.
- Limite por omissão para uma data sem configuração explícita: `DP-15`. **Recomendação: zero** — nada é reservável até ser explicitamente aberto. É a opção conservadora, e um obrador prefere um cliente que não conseguiu comprar a um compromisso que não consegue cumprir.

## 4.11 Produtos disponíveis apenas em certos pontos

Cada produto declara em que pontos pode ser levantado. Cenários reais que isto suporta: um produto frágil que não viaja bem; uma edição limitada só no obrador; um ponto com espaço frio limitado.

- Por omissão, um produto novo está disponível **apenas no obrador principal**. Adicionar pontos é uma ação explícita.
- Se o cliente já tem itens no carrinho e muda de ponto, os produtos não aceites nesse ponto são sinalizados **antes** de a mudança se confirmar, com escolha explícita: remover os itens ou manter o ponto anterior. Nunca remover silenciosamente.

*Rótulo visível sugerido:*
> «Este producto solo se recoge en [nombre del punto].»

---

# 5. Reserva y recoge

Capacidade central da fase 1. *Nome visível ao cliente:* **«Reserva y recoge»**.

## 5.1 Princípios do fluxo

1. **A data e o ponto são decisões estruturantes** — condicionam tudo o resto. Devem ser resolvidas cedo, não no fim.
2. **Nunca mostrar uma opção que não se pode cumprir.** Datas sem produção, sem capacidade ou depois da hora-limite não aparecem selecionáveis.
3. **O cliente deve poder chegar ao fim sem criar conta.**
4. **A confirmação não depende do email.** O ecrã de confirmação é a fonte de verdade primária (§15, caso 12).

## 5.2 Fluxo completo

| # | Passo | O que acontece | Regra crítica |
|---|---|---|---|
| 1 | Escolher produto | Catálogo ou ficha | Mostra disponibilidade por data desde o início |
| 2 | Escolher quantidade | Seletor com máximo | Máximo = mínimo entre disponibilidade restante e limite por cliente (`DP-16`) |
| 3 | Escolher data | Calendário só com datas válidas | Interseção das cinco condições de §4.9 |
| 4 | Escolher ponto | Lista de pontos válidos | Filtrada pelos pontos que aceitam **todos** os itens do carrinho |
| 5 | Identificar cliente | Convidado ou sessão | Mínimo: nome, email, telefone (`DP-17`) |
| 6 | Rever pedido | Resumo completo | **Reserva temporária criada aqui** (§5.4) |
| 7 | **Pagar** | Pagamento antecipado obrigatório | **`DA-01`** — ver §5.3 |
| 8 | Receber confirmação | Ecrã + email | Só após pagamento concluído. Código de recolha gerado (§5.13) |
| 9 | Recolher | No ponto, na janela | Confirmação de recolha (§6.12). **Nada a pagar no balcão** |

**Ordem dos passos 3 e 4.** Podem ser apresentados em qualquer ordem, mas **a ordem tem de ser estável** e a segunda escolha tem de refiltrar a primeira. Recomendação: **ponto primeiro, data depois** — o ponto é a decisão mais rígida na vida do cliente (é onde ele passa), a data é mais flexível.

**O passo 7 não é opcional e não tem variantes.** Não existe caminho no fluxo que chegue ao passo 8 sem pagamento concluído.

## 5.3 Pagamento — `DA-01` · decisão aprovada

> **`DA-01` — Pagamento antecipado obrigatório.** Aprovada pelos responsáveis do FUERZA. Não é uma recomendação: é regra do produto e não tem exceções.

**Regras:**

1. **O pagamento é sempre antecipado.** Faz-se no momento da reserva, através do site.
2. **A encomenda só é confirmada depois de o pagamento ser concluído com sucesso.** A confirmação do pagamento vem do processador (§10.4) — nunca do retorno do navegador.
3. **Não existe pagamento no momento da recolha.** Nem no obrador principal, nem em pontos externos. Nenhum ponto cobra dinheiro em nome do FUERZA.
4. **Se o pagamento falhar, for abandonado ou expirar, a encomenda não é confirmada.** Permanece em `pendiente_pago` e termina em `cancelado` (§5.11, §5.14).
5. **O stock fica reservado temporariamente durante o checkout** e é libertado se o pagamento falhar, for abandonado ou expirar (§5.4).

**Fundamentação registada.** O objetivo comercial n.º 1 é reduzir desperdício, e uma reserva sem custo não é um compromisso: é uma intenção. Um obrador que assa contra intenções continua a desperdiçar, apenas com melhor informação. O pagamento antecipado é também a única modalidade que funciona sem alterações em pontos externos — o que a torna a opção compatível com o objetivo 5 (expansão), sem obrigar parceiros a manusear dinheiro, a emitir recibos ou a reconciliar caixa em nome do FUERZA.

**Consequências desta decisão noutras secções:**

| Secção | Consequência |
|---|---|
| §5.4 | A reserva temporária é o único mecanismo que protege o stock durante o pagamento |
| §5.11 | Falha de pagamento nunca produz encomenda confirmada |
| §5.14 | `confirmado` implica sempre `pagado`. Não existe encomenda confirmada por pagar |
| §6.12 | A recolha é apenas entrega e identificação. Não há cobrança nem caixa |
| §10.1 | A modalidade «pagamento na recolha» deixa de existir no produto |
| §10.5 | Todo o cancelamento com direito a devolução gera reembolso real |
| §15 | Casos 3, 5, 14 e 17 seguem esta regra |

**Nota de desenho que se mantém.** Encomenda e pagamento continuam a ser entidades separadas (§10.4, §16.4 ponto 4). Isto não é uma abertura à modalidade B — é o que permite reembolsos, reconciliação e auditoria. A separação é técnica; a regra comercial é única.

*Rótulo visível ao cliente, es-ES:*
> «Pagas al reservar. El día de la recogida solo tienes que recoger.»

## 5.4 Reserva temporária de stock

Sem este mecanismo, dois clientes podem pagar a mesma última unidade. Com `DA-01`, é também **o único mecanismo que protege o stock durante o pagamento** — daí a sua importância acrescida.

| Regra | Valor |
|---|---|
| Momento da criação | Entrada no passo 6 (rever pedido) |
| Efeito | Decremento atómico da disponibilidade |
| Duração | `DP-19` — **recomendação: 15 minutos** |
| Prolongamento | Uma vez, ao iniciar o pagamento |
| **Libertação** | **Expiração do prazo · abandono do checkout · falha definitiva de pagamento.** Nos três casos o stock volta a ficar disponível |
| Conversão | Torna-se definitiva quando o pagamento é confirmado e a encomenda passa a `confirmado` |

**Nunca há stock comprometido sem pagamento concluído nem prazo a correr.** Uma reserva temporária ou converte em encomenda paga, ou liberta. Não existe terceiro destino.

**Porquê no passo 6 e não ao adicionar ao carrinho.** Com stock diário pequeno, reservar ao adicionar ao carrinho estrangularia a disponibilidade: carrinhos abandonados bloqueariam unidades durante minutos. Reservar apenas quando o cliente demonstra intenção real — chegou à revisão — é o equilíbrio correto.

## 5.4 Reserva temporária de stock

Sem este mecanismo, dois clientes podem pagar a mesma última unidade.

| Regra | Valor |
|---|---|
| Momento da criação | Entrada no passo 6 (rever pedido) |
| Efeito | Decremento atómico da disponibilidade |
| Duração | `DP-19` — **recomendação: 15 minutos** |
| Prolongamento | Uma vez, ao iniciar o pagamento |
| Libertação | Expiração, abandono explícito, ou falha definitiva de pagamento |
| Conversão | Torna-se definitiva quando a encomenda passa a `confirmado` |

**Porquê no passo 6 e não ao adicionar ao carrinho.** Com stock diário pequeno, reservar ao adicionar ao carrinho estrangularia a disponibilidade: carrinhos abandonados bloqueariam unidades durante minutos. Reservar apenas quando o cliente demonstra intenção real — chegou à revisão — é o equilíbrio correto.

*Rótulo visível durante a reserva temporária:*
> «Te guardamos el pan durante [n] minutos.»

## 5.5 Prazo limite de reserva (*hora de corte*) — `DP-02` · **continua pendente**

O momento a partir do qual já não se aceitam encomendas para uma data. **É uma restrição física do processo de fermentação, não uma escolha de interface.**

> **Não confundir com o horário laboral.** `DA-02` fixou o horário de funcionamento do obrador em 09:00–18:00 (§6.2.1). **Isso não define a hora-limite de reserva.** As duas coisas respondem a perguntas diferentes: o horário diz quando há alguém no obrador; a hora-limite diz quando é que a produção de um dia deixa de poder mudar. A segunda depende do tempo de fermentação e pode ser muito anterior às 18:00 — ou cair na véspera. **`DP-02` mantém-se pendente e continua bloqueante para a fase 1.**

| Opção | Descrição | Nota |
|---|---|---|
| **A. Hora fixa no dia anterior** | Ex.: encomendas para amanhã fecham hoje às [hora] | Simples de comunicar e de operar. **Recomendada.** |
| **B. Antecedência em horas** | Ex.: [n] horas antes da janela de recolha | Mais justo em pontos com horários diferentes; mais difícil de explicar |
| **C. Por produto** | Cada produto tem a sua antecedência | Fiel ao processo real (fermentações diferentes); demasiado complexo para a fase 1 |

**Recomendação: A**, com possibilidade de sobreposição por produto no modelo de dados (para não bloquear C mais tarde) mas sem interface na fase 1.

*Rótulo visível sugerido:*
> «Pedidos para el [fecha] hasta el [fecha anterior] a las [hora].»

**Regra:** a hora-limite é avaliada no fuso horário de Espanha peninsular (`Europe/Madrid`), incluindo mudanças de hora. Uma data deixa de ser selecionável no instante em que a hora-limite passa, **sem necessidade de recarregar a página** — a validação repete-se no servidor antes de confirmar.

## 5.6 Limite de unidades por produto e por data

Ver §4.10. Do lado do cliente:

- A quantidade máxima selecionável é a disponibilidade real restante.
- Limite por cliente por data (para evitar que um cliente esgote a produção do dia): `DP-16`. **Recomendação: implementar o campo, deixar sem limite por omissão,** e ativar apenas se surgir o problema. Limitar preventivamente irrita clientes bons por causa de um problema hipotético.

## 5.7 Capacidade do ponto de recolha

Limite de nível 2 (§4.10): total de unidades que um ponto aceita numa data.

- Se o ponto atinge a capacidade, **todos** os produtos ficam indisponíveis nesse ponto nessa data, mesmo que haja produção.
- A mensagem tem de distinguir claramente os dois motivos de indisponibilidade, porque as saídas para o cliente são diferentes:

| Motivo | *Mensagem, es-ES* | Saída para o cliente |
|---|---|---|
| Produto esgotado | «Agotado para el [fecha].» | Outra data |
| Ponto completo | «[Punto] ya está completo el [fecha].» | **Outro ponto, mesma data** |

## 5.8 Alteração e cancelamento

**Cancelamento pelo cliente** — `DP-08`.

| Opção | A favor | Contra |
|---|---|---|
| **A. Até à hora-limite, reembolso total** | Simples, justo, alinhado com a produção: antes da hora-limite o pão ainda não foi decidido | Cancelamentos tardios continuam possíveis até tarde |
| **B. Até [n] horas antes da hora-limite** | Mais margem para o obrador | Regra que o cliente não compreende intuitivamente |
| **C. Sem cancelamento** | Máxima previsibilidade | Hostil; gera pedidos de reembolso manuais na mesma |

**Recomendação: A.** A hora-limite já é o momento em que a produção se fixa. Usá-la também como limite de cancelamento dá **uma só regra para o cliente memorizar**, e alinha a política comercial com a realidade física do obrador. Simplicidade é aqui uma vantagem operacional, não uma concessão.

**Alteração pelo cliente** — `DP-20`.

> **⚖️ Conflito experiência × operação.** Permitir editar quantidade, data e ponto é excelente experiência, mas cada alteração é uma transação composta (libertar stock antigo, verificar novo, ajustar pagamento) e multiplica os estados intermédios e os casos de erro.
>
> **Recomendação para a fase 1: não permitir alteração — permitir cancelar e voltar a reservar.** Resolve 100% dos casos com uma fração da complexidade, e é compreensível de imediato. A edição direta entra na fase 2, se os dados mostrarem que é usada.

**Cancelamento pelo obrador.** Sempre possível, com motivo obrigatório, reembolso total automático e notificação imediata (§11). Cenários: avaria do forno, doença, encerramento imprevisto.

## 5.9 Pedido não recolhido

Uma encomenda passa a `no_recogido` quando a janela de recolha termina sem confirmação.

- A transição é automática, com atraso de tolerância após o fim da janela (`DP-21` — **recomendação: 1 hora**, para absorver o cliente que chega quase à hora).
- **Não elimina a encomenda nem o registo.**
- Política de reembolso: `DP-22`.

> **Efeito de `DA-01` neste caso.** Com pagamento antecipado, uma encomenda não recolhida está **sempre já paga**. A decisão `DP-22` deixa de ser sobre cobrar ou não cobrar — passa a ser exclusivamente sobre **devolver ou não devolver dinheiro já recebido**. Isto torna a política mais fácil de operar (não há dívida a perseguir) e mais sensível de comunicar (o cliente pagou e não levou). A política publicada tem de ser explícita e escrita antes do lançamento.

| Opção | Nota |
|---|---|
| **A. Sem reembolso** | O pão foi feito e perdeu-se; o custo é real. Prática habitual no setor |
| **B. Reembolso parcial** | Gesto comercial; exige critério e trabalho manual |
| **C. Crédito para a próxima** | Fideliza; exige sistema de créditos que não existe na fase 1 |

**Recomendação: A como política publicada**, com poder discricionário do administrador para reembolsar caso a caso a partir do painel. Publicar uma política generosa cria expectativa automática; publicar uma política clara e ser generoso na exceção é mais sustentável para um obrador pequeno — e mais alinhado com a proximidade da marca.

**Recorrência.** Se um cliente acumula não-levantamentos, o painel deve **sinalizar** (não bloquear automaticamente). A decisão é humana. `DP-23` para o limiar de sinalização.

## 5.10 Produto esgotado durante o checkout

Ver §15, casos 1 e 2. Comportamento resumido: a última verificação de disponibilidade acontece **no servidor, no momento da confirmação**. Se falhar, o cliente volta à revisão com os itens afetados assinalados e alternativas concretas (outra data, outro ponto) — **nunca uma mensagem de erro genérica**.

*Mensagem, es-ES:*
> «Se ha agotado [producto] para el [fecha] mientras terminabas. Todavía hay para el [próxima fecha] o en [otro punto].»

## 5.11 Pagamento falhado, abandonado ou expirado

Os três desfechos negativos do passo 7 têm o mesmo resultado material: **não há encomenda e o stock volta ao mercado.**

| Desfecho | O que acontece |
|---|---|
| **Falha** | Pagamento recusado ou erro do processador |
| **Abandono** | O cliente sai do checkout sem concluir |
| **Expiração** | A reserva temporária esgota o prazo (§5.4) |

**Regras comuns aos três:**

- A encomenda **nunca é criada como confirmada**. Fica em `pendiente_pago`.
- A reserva temporária mantém-se durante a tentativa em curso, e só durante ela (§5.4).
- O cliente pode tentar de novo com o mesmo carrinho enquanto a reserva não expirar.
- Após falha definitiva, abandono ou expiração, **a reserva liberta-se e o stock volta a estar disponível de imediato**, e a encomenda em `pendiente_pago` termina em `cancelado`.
- **Nunca duplicar encomendas por múltiplas tentativas de pagamento** (§10.8).
- **Não existe saída alternativa.** Com `DA-01`, não há a possibilidade de manter a reserva para pagar depois nem de pagar no balcão. Isto tem de ser dito ao cliente no momento, sem ambiguidade.

*Mensagem, es-ES:*
> «No hemos podido cobrar tu pedido, así que no queda reservado. Puedes intentarlo otra vez.»

## 5.12 Ponto de recolha indisponível após existirem encomendas

Ver §15, caso 4. Regra estruturante:

> **Um ponto não pode ser desativado enquanto tiver encomendas ativas.** O painel bloqueia a ação e apresenta a lista de encomendas afetadas com duas saídas: transferir para outro ponto (com notificação e consentimento do cliente) ou cancelar com reembolso total.

## 5.13 Código de recolha

- Formato curto, legível em voz alta, sem caracteres ambíguos (0/O, 1/I/l). Proposta: **`FZ-` + 4 caracteres alfanuméricos**, ex.: `FZ-4K7M`. Formato final: `DP-24`.
- Único dentro de uma janela razoável — não precisa de ser único para sempre.
- Aparece no ecrã de confirmação, no email e na área de cliente.
- Serve para procura no painel e para identificação no balcão.
- **Não é segredo nem credencial.** Não dá acesso a dados pessoais. O acesso à encomenda por parte de um cliente sem conta faz-se por ligação assinada e com prazo, enviada ao email da encomenda.

## 5.14 Estados da encomenda

| Estado | *Rótulo visível* | Significado | Pago? | Transições possíveis |
|---|---|---|:--:|---|
| `borrador` | — | Carrinho, ainda não é encomenda | ✗ | → `pendiente_pago`, expira |
| `pendiente_pago` | «Pendiente de pago» | Reserva temporária ativa, pagamento em curso. **Não é um compromisso de produção** | ✗ | → `confirmado`, `cancelado`, expira |
| `confirmado` | «Confirmado» | Stock comprometido, produção garantida | **✓ sempre** | → `en_preparacion`, `cancelado` |
| `en_preparacion` | «En preparación» | O obrador começou | ✓ | → `listo`, `cancelado` |
| `listo` | «Listo para recoger» | Pronto no obrador | ✓ | → `en_punto`, `recogido`, `no_recogido` |
| `en_punto` | «Ya está en [punto]» | Entregue ao ponto externo | ✓ | → `recogido`, `no_recogido` |
| `recogido` | «Recogido» | **Estado terminal de sucesso** | ✓ | → `reembolsado` (exceção) |
| `no_recogido` | «No recogido» | Janela expirou sem recolha. **Já paga** (§5.9) | ✓ | → `reembolsado` (discricionário) |
| `cancelado` | «Cancelado» | Por cliente, por obrador, ou por pagamento não concluído | Depende | → `reembolsado` |
| `reembolsado` | «Reembolsado» | Total ou parcial (§10) | — | Terminal |

**Regras de transição:**
- **`confirmado` implica sempre pagamento concluído** (`DA-01`). A transição `pendiente_pago` → `confirmado` só ocorre por confirmação do processador de pagamentos (§10.4). **Não existe encomenda confirmada por pagar**, e nenhum perfil do painel pode forçar esta transição manualmente.
- A partir de `confirmado`, **todos** os estados seguintes são de encomenda paga. Consequência operacional: quem entrega no balcão nunca tem de verificar se há algo a cobrar (§6.12).
- `cancelado` tem duas origens com efeitos diferentes: cancelamento de uma encomenda **paga** (gera reembolso, §10.5) ou encerramento de uma `pendiente_pago` que não chegou a pagar (não gera nada — não houve cobrança).
- `en_punto` só existe para pontos externos. No obrador principal, `listo` → `recogido` diretamente.
- Nenhuma transição retrocede, com uma exceção auditada: o administrador pode reverter `no_recogido` → `listo` quando o cliente aparece atrasado e o produto ainda existe (§15, caso 5).
- Toda a transição regista quem a fez, quando, e por que meio (§14.9).

---

# 6. Pontos de recolha

O sistema trata **todos** os pontos com o mesmo modelo, incluindo o obrador. Não existe um caminho especial para «a loja» e outro para «os parceiros» — essa separação criaria dívida no momento exato em que o negócio quisesse crescer, que é o objetivo 5.

> **Premissa obrigatória, do enunciado:** o sistema **não deve assumir** que todos os pontos partilham dias, horários, produtos ou capacidade. Cada um destes atributos é independente por ponto.

## 6.1 Tipos de ponto

| Tipo | Descrição | Diferenças de comportamento |
|---|---|---|
| `obrador` | O obrador principal | Sem estado `en_punto`; sem logística de transporte. Horário conhecido — ver §6.2.1 |
| `externo` | Estabelecimento parceiro | Requer entrega de lote; tem responsável; pode ter produtos restritos. Horário próprio, **nunca herdado do obrador** |

## 6.2 Atributos

| Atributo | Notas |
|---|---|
| Nome | *Rótulo visível*, es-ES |
| Tipo | `obrador` / `externo` |
| Morada | Rua, número, código postal — **`DP-25`, nenhuma é conhecida** |
| Cidade | Avilés ou outra. O modelo não assume Avilés |
| Coordenadas | Para mapa e indicações |
| Instruções de recolha | Texto livre, es-ES. Ex.: onde perguntar, o que dizer |
| Horário de abertura | Do estabelecimento, informativo |
| Dias de recolha | Em que dias se pode levantar aqui — **≠ horário** |
| Janela de recolha | Intervalo dentro do dia para levantar encomendas |
| Capacidade por data | Ver §6.7 |
| Produtos aceites | Ver §6.8 |
| Datas excecionais | Ver §6.9 |
| Estado | Ver §6.10 |
| Responsável | Ver §6.11 |
| Ordem | Ordenação na lista |

**Os valores concretos continuam a ser `DP-25`, com uma exceção: o horário do obrador principal** (§6.2.1). Não se conhece nenhuma morada, dia de recolha, janela ou capacidade real. O sistema tem de ser inteiramente configurável sem alterações de código.

### 6.2.1 Horário do obrador principal — `DA-02` · decisão aprovada

> **`DA-02` — O horário laboral do obrador é das 09:00 às 18:00.** Aprovada pelos responsáveis do FUERZA.

**O que este valor é:**

- O **horário geral de funcionamento** do obrador principal (`Europe/Madrid`).
- O horário publicado em `/donde-estamos` e nos dados estruturados `LocalBusiness` (§13.5).
- O intervalo dentro do qual a janela de recolha do obrador tem de estar contida.

**O que este valor não é** — três não-inferências que a equipa não deve fazer:

| Não assumir | Porquê |
|---|---|
| **Que 18:00 é a hora-limite de reserva** | A hora-limite continua a ser **`DP-02`, pendente**. É uma restrição do processo de fermentação, não do horário de porta aberta (§5.5). Pode ser bastante anterior às 18:00, e pode até cair na véspera |
| **Que a janela de recolha do obrador é 09:00–18:00** | A janela é um atributo próprio (§6.4) e pode ser mais curta — o pão pode só sair do forno a meio da manhã. Continua em `DP-25` |
| **Que os pontos externos partilham este horário** | Cada ponto tem horário, dias e janela próprios. **O horário do obrador nunca é herdado nem usado como valor por omissão de um ponto externo** (§6.3). Um parceiro pode abrir às 07:00 ou fechar às 21:00 |

**Regra de configuração.** O horário do obrador é um valor configurável como o de qualquer outro ponto — `DA-02` preenche-o, não o codifica. Se o obrador mudar de horário, é uma alteração de configuração.

## 6.3 Dias de recolha vs. horário de abertura

Distinção que se perde facilmente e depois custa caro:

- **Horário de abertura** — quando o estabelecimento está aberto. Informação para o cliente.
- **Dias de recolha** — em que dias o FUERZA entrega ali. Um parceiro pode abrir todos os dias e receber pão só à terça e à sexta.
- **Janela de recolha** — intervalo dentro do dia de recolha em que a encomenda está disponível. Pode ser mais curta que o horário de abertura: o pão chega às 10h, o parceiro abre às 8h.

**Só os dias de recolha e a janela condicionam o calendário.** O horário é conteúdo.

**Independência entre pontos — requisito, não detalhe.** Cada ponto define os três valores acima de forma autónoma. `DA-02` fixa o horário **do obrador principal** e não produz qualquer valor por omissão para os restantes. Um ponto externo criado sem horário configurado fica sem horário — não herda 09:00–18:00.

## 6.4 Janela de recolha

- Início e fim, por dia da semana.
- Pode variar por dia.
- Define quando a encomenda transita para `no_recogido` (§5.9).
- Comunicada em todas as confirmações e lembretes.
- **Tem de estar contida no horário de funcionamento do respetivo ponto.** No obrador principal, isso significa dentro de 09:00–18:00 (`DA-02`); em cada ponto externo, dentro do horário próprio desse ponto. O painel recusa uma janela que caia fora do horário configurado.

## 6.5 Instruções de recolha

Campo de texto por ponto, em es-ES, apresentado na confirmação e no lembrete. Resolve o atrito real do primeiro levantamento num sítio desconhecido.

*Exemplo de formato:*
> «Pregunta por tu pedido en el mostrador y di tu código.»

## 6.6 Datas excecionais

Sobreposições pontuais ao padrão semanal, por ponto:

- **Encerramento** — o ponto não opera nesta data, apesar de ser um dia normal.
- **Abertura extraordinária** — o ponto opera numa data que normalmente não operaria.
- **Capacidade alterada** — mais ou menos que o normal.

## 6.7 Capacidade

- Limite de unidades totais por data (nível 2 de §4.10).
- Por omissão: `DP-15` (**recomendação: zero até ser configurado**).
- Ao atingir-se, o ponto deixa de ser selecionável nessa data — com a mensagem específica de §5.7, distinta da de produto esgotado.

## 6.8 Produtos aceites

- Cada ponto declara que produtos aceita, ou aceita todos.
- A lista de pontos apresentada no checkout mostra apenas pontos que aceitam **todos** os itens do carrinho.
- Se nenhum ponto aceitar a combinação, o cliente é informado de qual o item que restringe — nunca fica sem saber porquê.

## 6.9 Encerramentos e feriados

Dois níveis, com precedência clara:

1. **Calendário global do obrador** — férias, feriados, encerramento anual. Bloqueia **todas** as datas em **todos** os pontos.
2. **Calendário por ponto** — §6.6.

**Precedência:** o encerramento global vence sempre. Nenhum ponto pode operar numa data em que o obrador está encerrado — não há produção.

**Feriados:** não são calculados automaticamente. Os feriados de Espanha, das Astúrias e do município não coincidem, e um obrador pode trabalhar num feriado e fechar noutro. **São introduzidos manualmente** no calendário global. `DP-26` — confirmar se se pré-carregam feriados nacionais como sugestão editável.

## 6.10 Estado do ponto

| Estado | *Rótulo visível* | Comportamento |
|---|---|---|
| `activo` | — | Normal |
| `temporalmente_no_disponible` | «Temporalmente no disponible» | Visível em `/donde-estamos`, **não selecionável** no checkout |
| `inactivo` | — | Não visível, não selecionável |
| `proximamente` | «Próximamente» | Visível, não selecionável — serve a expansão (objetivo 5) |

**Regra de bloqueio (§5.12):** a transição para `temporalmente_no_disponible` ou `inactivo` é recusada enquanto existirem encomendas ativas nesse ponto.

## 6.11 Pessoa responsável

- Nome e contacto interno, por ponto.
- **Não é publicado no site.**
- Recebe as comunicações operacionais (lote a caminho, alterações).
- Utilizador de painel: fase 2 e `DP-06` (ver §3.7).

## 6.12 Controlo de entrega ao ponto e confirmação de recolha

> **A recolha não movimenta dinheiro.** Com `DA-01`, toda a encomenda que chega ao balcão está paga. O ato de recolha é **identificação e entrega**, nada mais: o cliente diz o código, recebe o pão, e vai-se embora. Nenhum ponto — nem o obrador, nem um parceiro — cobra, dá troco, emite recibo de venda ou reconcilia caixa em nome do FUERZA.
>
> Isto simplifica materialmente a operação em pontos externos e é uma das razões pelas quais `DA-01` serve o objetivo 5 (expansão): abrir um ponto novo não exige acordo financeiro nem confiança de tesouraria com o parceiro.

Duas confirmações distintas, e confundi-las torna a operação impossível de auditar:

**1. Entrega do lote ao ponto** (`en_punto`)
- Quem: operador do FUERZA que transporta.
- Quando: à chegada ao ponto.
- Como: marca o lote inteiro como entregue, não encomenda a encomenda.
- Efeito: todas as encomendas do lote passam a `en_punto`; os clientes são notificados (§11).

**2. Recolha pelo cliente** (`recogido`)
- Quem: `DP-27` — operador/responsável do ponto, ou o próprio cliente.

| Opção | A favor | Contra |
|---|---|---|
| **A. Confirma o pessoal do ponto** | Fiável; regista o momento real | Exige acesso de painel — que §3.7 recomenda adiar |
| **B. Confirma o cliente** | Sem custo operacional | Pouco fiável; clientes esquecem-se |
| **C. Automática no fim da janela** | Zero esforço | Assume sucesso; corrompe os dados de não-levantamento |

**Recomendação para a fase 1:** **A no obrador principal** (o operador já lá está e tem o painel) e, para pontos externos, **lista impressa com marcação em papel, reconciliada por um operador do FUERZA**. Adia o problema de credenciais até haver pontos suficientes para o justificar — coerente com §3.7 e com o objetivo 7.

---

# 7. Subscrições — «Plan de Pan»

**Implementação na fase 2. Arquitetura contemplada desde a fase 1.**

*Nome visível ao cliente:* **«Plan de Pan»**

**Nenhum plano está definido.** Esta secção estrutura o espaço de decisão e recomenda um caminho; não declara planos, frequências nem preços.

## 7.1 As duas formas possíveis

**A — Frequência fixa.** O cliente escolhe um ritmo (uma vez por semana, duas por mês, uma por mês, ou outra frequência configurável) e um conteúdo. O sistema gera automaticamente uma reserva por ciclo, no dia habitual, no ponto habitual.

**B — Crédito mensal.** O cliente paga um ciclo e recebe N reservas para usar quando quiser dentro do ciclo, respeitando as regras do plano.

## 7.2 Comparação

| Critério | A — Frequência fixa | B — Crédito mensal |
|---|---|---|
| **Facilidade para o cliente** | Alta — decide uma vez e esquece. É a promessa «não pensar no assunto» | Média — tem de se lembrar de usar os créditos, e de os gastar antes do fim do ciclo |
| **Previsibilidade de produção** | **Muito alta** — a procura é conhecida com semanas de antecedência | **Baixa** — sabe-se quanto foi vendido, não quando será consumido. Um obrador pode ter 200 créditos por usar e não saber se saem na terça ou no sábado |
| **Complexidade operacional** | Baixa — gerar reservas a partir de um padrão | Alta — livro de créditos, saldos, validade, expiração, reconciliação |
| **Flexibilidade** | Média — resolvida com «saltar entrega» e pausa | Alta por natureza |
| **Gestão de ausências** | Explícita: pausar ou saltar. Requer ação do cliente | Implícita: não gasta o crédito. Sem ação — mas gera saldo por usar e conflito no fim do ciclo |
| **Implementação com Stripe** | **Direta.** Subscrição com intervalo de faturação; ciclo, renovação, falha e recuperação são nativos | **Indireta.** Stripe cobra o ciclo, mas o saldo de créditos, o consumo e a expiração são um sistema próprio a construir e a reconciliar |
| **Adequação a um pequeno obrador** | **Alta** | **Baixa** |

## 7.3 Recomendação

> **Recomendação: A — frequência fixa.** Decisão final: `DP-28`.

**Fundamentação.**

O objetivo comercial n.º 3 é **aumentar a previsibilidade da procura**. O modelo de crédito não a aumenta — desloca-a. Converte uma incerteza («quantos clientes vêm esta semana?») noutra («quando é que estes 200 créditos serão usados?»), e a segunda é mais difícil de planear porque cria um passivo de produção com data desconhecida. Um obrador pequeno passaria a assar contra um saldo em vez de contra um calendário.

O modelo de crédito é também aquele em que o cliente pode **pagar e não receber nada**, por esquecimento. É legal, é comum, e é exatamente o oposto da promessa da marca — «somos un obrador pequeño», proximidade, honestidade (Documento 01 §16). Um plano que lucra com o esquecimento do cliente não é este produto.

Quanto à flexibilidade, que é a única vantagem real de B: obtém-se em A com dois mecanismos muito mais simples — **«Saltar esta entrega»** e **«Pausar el plan»** (§7.11 e §7.12). Cobrem os casos reais (uma semana fora, um mês de férias) sem construir um livro de créditos.

Por fim, com Stripe, A resolve-se com um objeto de subscrição e ciclos nativos. B exige que a faturação viva no Stripe e o consumo viva noutro sítio, com reconciliação permanente entre os dois — precisamente o tipo de complexidade que o objetivo 7 manda evitar.

**Se o FUERZA preferir B**, a recomendação é adiá-lo para a fase 3 como *«Plan Flexible»* **adicional**, nunca substituto, e com validade de crédito curta e comunicada com clareza. Mesmo assim, mantenho a reserva quanto à previsibilidade.

## 7.4 Escolha do plano

O cliente define, na subscrição:

| Elemento | Notas |
|---|---|
| Frequência | Entre as oferecidas — `DP-29` |
| Conteúdo | Produto/variante concretos, ou família com escolha do obrador (§7.5) |
| Quantidade por entrega | Por item |
| Ponto habitual | Um dos pontos ativos |
| Dia habitual | Dentro dos dias válidos para o ponto e o conteúdo |
| Data de início | Primeira entrega |
| Preço | `DP-13` |

## 7.5 Produto ou família incluída

| Opção | *Rótulo visível* | Nota |
|---|---|---|
| **Produto fixo** | «Siempre [producto]» | O cliente sabe exatamente o que recebe. Menos flexível para o obrador |
| **Família com escolha do obrador** | «Lo que horneemos esa semana» | Muito bom para o obrador — absorve variações de produção. Requer confiança, e a marca tem-na. Obriga a comunicar o conteúdo antes da entrega |

**Recomendação: oferecer as duas**, e apresentar a segunda como a proposta com mais carácter — está alinhada com a voz da marca e com a realidade de um obrador que varia o que faz. Se só uma for possível na fase 2, começar por **produto fixo**, que é a mais simples de operar e de explicar.

## 7.6 Renovação

- Automática no fim do ciclo, no ciclo de faturação do plano.
- Notificação **antes** da cobrança (`DP-30` — **recomendação: 3 dias**). Não é apenas boa prática: para contratos de subscrição com consumidores em Espanha, o aviso prévio de renovação e a facilidade de cancelamento são expectativas regulatórias e de mercado.
- A renovação gera as reservas do ciclo seguinte **apenas após a cobrança ser bem-sucedida**.

## 7.7 Geração de reservas a partir da subscrição

O mecanismo central. Executa-se por ciclo, com antecedência suficiente para alimentar o planeamento de produção.

1. Para cada subscrição ativa, calcular as datas de entrega do ciclo.
2. Validar cada data contra encerramentos, dias do ponto e dias de produção.
3. **Reservar a capacidade antes de a disponibilidade ser aberta à venda avulsa** (§7.9).
4. Criar as encomendas correspondentes em `confirmado`, marcadas como originadas por subscrição.
5. Notificar o cliente do conteúdo e das datas do ciclo.

**Antecedência de geração:** `DP-31`. **Recomendação: gerar o ciclo completo no início do ciclo**, para que o obrador veja com semanas de antecedência — que é o benefício que justifica o produto.

## 7.8 Datas inválidas dentro do ciclo

Se uma data de entrega calhar num encerramento:

| Opção | Nota |
|---|---|
| **A. Deslocar para a data válida seguinte** | Mantém a contagem de entregas. **Recomendada** |
| **B. Saltar a entrega e creditar** | Introduz créditos — precisamente o que §7.3 evita |
| **C. Perguntar ao cliente** | Melhor experiência, mas exige resposta; o silêncio tem de ter um comportamento por omissão de qualquer forma |

**Recomendação: A, com notificação clara.** O cliente é informado da nova data e pode saltá-la se não lhe servir.

## 7.9 Prioridade de stock dos assinantes

> **Regra estruturante.** A capacidade necessária às subscrições de uma data é reservada **antes** de a disponibilidade dessa data ser aberta à venda avulsa.

É esta regra que dá valor real ao Plan de Pan: o assinante nunca fica sem o seu pão porque a venda pública o esgotou. Sem ela, a subscrição é apenas um débito automático sem contrapartida.

**Implicação para a fase 1** (§16.4): o cálculo de disponibilidade tem de distinguir, desde o início, **capacidade total** de **capacidade disponível para venda avulsa**, mesmo enquanto a segunda for igual à primeira. Introduzir esta distinção depois obrigaria a rever todo o motor de disponibilidade.

## 7.10 Trocar produto e mudar de ponto

- Ambos permitidos ao assinante, com efeito a partir do **ciclo seguinte** por omissão.
- Aplicação imediata ao ciclo atual: só se as encomendas ainda não geradas ou ainda antes da hora-limite. Caso contrário, é tratado como alteração de encomenda individual (§5.8).
- Mudar de ponto exige revalidar que o novo ponto aceita o conteúdo do plano (§6.8) e tem capacidade.

## 7.11 Saltar uma entrega

*Rótulo visível:* **«Saltar esta entrega»**

- Cancela uma entrega concreta sem interromper o plano.
- Prazo: até à hora-limite dessa data.
- Efeito no pagamento: `DP-32`.

| Opção | Nota |
|---|---|
| **A. Sem efeito** | Simples; o cliente perde valor. Aceitável apenas com limite generoso de saltos |
| **B. Desconto no ciclo seguinte** | Justo; exige lógica de proração |
| **C. Estende o fim do plano** | Justo e sem dinheiro a mover. Mais fácil com Stripe do que parece |

**Recomendação: C**, se o plano for de ciclo fixo com número conhecido de entregas. Evita movimentos de dinheiro e é fácil de explicar: *«Tu plan termina una semana más tarde.»*

- Limite de saltos por ciclo: `DP-33`.

## 7.12 Pausa e férias

*Rótulo visível:* **«Pausar el plan»**

- Suspende geração de reservas **e** cobrança.
- Com data de retoma definida (*«férias»*) ou indefinida.
- Limite de duração: `DP-34`. **Recomendação: máximo definido**, com retoma automática ou conversão em cancelamento após aviso — uma subscrição pausada para sempre é ruído no painel.
- **Pausa não é cancelamento:** o plano, o preço e as condições mantêm-se.

**Caso crítico** (§15, caso 8): se o cliente pausa depois de uma reserva já ter sido gerada, a pausa aplica-se às entregas **ainda não geradas**. A entrega já gerada segue as regras normais de cancelamento (§5.8) e o cliente é informado disso **no mesmo ecrã em que pausa**, antes de confirmar. Nunca depois.

## 7.13 Cancelamento

- Sempre possível, sem contactar ninguém, a partir da área de cliente. É um requisito, não uma cortesia.
- Efeito: `DP-35`.

| Opção | Nota |
|---|---|
| **A. Imediato, com reembolso proporcional** | Melhor para o cliente; movimenta dinheiro |
| **B. No fim do ciclo pago** | **Recomendada** — o cliente recebe o que pagou, sem reembolsos |

- Entregas já geradas e pagas cumprem-se.
- *Rótulo visível:* «Tu plan sigue activo hasta el [fecha]. Después no se renovará.»

## 7.14 Falha de pagamento e recuperação

| Fase | Comportamento |
|---|---|
| Falha inicial | Subscrição → `pago_fallido`. Notificação imediata com ligação direta para atualizar o método |
| Recuperação | Novas tentativas automáticas segundo a política do processador. Número e intervalo: `DP-36` |
| Durante a recuperação | **Não se geram novas reservas.** As já geradas e pagas cumprem-se |
| Falha definitiva | Subscrição → `impagada`. Notificação final. Sem geração de reservas |
| Sucesso na recuperação | Volta a `activa`; geração retoma no ciclo seguinte |

**Regra:** nunca cancelar automaticamente por falha de pagamento na fase 2. `impagada` é um estado suspenso e recuperável — o cliente que troca de cartão volta com um clique. Cancelar destrói a relação por um problema técnico.

## 7.15 Alteração de preço do plano

- Aviso prévio obrigatório antes da entrada em vigor: `DP-37`. **Recomendação: mínimo 30 dias**, com confirmação de que o cliente pode cancelar sem custo antes da nova cobrança. Alterar o preço de uma subscrição a consumidores sem aviso prévio e sem direito de cancelamento é juridicamente frágil em Espanha e na UE — a decisão final deve ser validada por assessoria jurídica do FUERZA.
- Preço fixado ao ciclo: nenhuma alteração afeta um ciclo já cobrado.
- Assinantes existentes com preço anterior mantido (*grandfathering*): `DP-38`.

## 7.16 Créditos não usados

Se `DP-28` for A (recomendado), **não existem créditos** e esta secção não se aplica — o que é, por si, um argumento a favor de A.

Se for B: política de expiração, transporte para o ciclo seguinte e reembolso ao cancelar têm de ser definidas antes de qualquer implementação (`DP-39`). Créditos que expiram sem uso e sem reembolso são um risco reputacional e jurídico que a marca não deve correr.

## 7.17 Limites

- Número de subscrições por cliente: `DP-40`. **Recomendação: uma** na fase 2.
- Quantidade máxima por entrega: `DP-41`.
- Capacidade máxima total de subscrições por ponto e por data: **necessária** — protege o obrador de vender mais subscrições do que consegue cumprir. `DP-42`.

## 7.18 Estados da subscrição

| Estado | *Rótulo visível* | Gera reservas | Cobra |
|---|---|:--:|:--:|
| `borrador` | — | ✗ | ✗ |
| `activa` | «Activo» | ✓ | ✓ |
| `pausada` | «En pausa» | ✗ | ✗ |
| `pago_fallido` | «Problema con el pago» | ✗ | Em recuperação |
| `impagada` | «Suspendido» | ✗ | ✗ |
| `cancelacion_programada` | «Activo hasta el [fecha]» | ✓ até à data | ✗ |
| `cancelada` | «Cancelado» | ✗ | ✗ |

---

# 8. Área do cliente

*Nome visível:* **«Mi cuenta»** · Rota: `/cuenta`

## 8.1 Âmbito por fase

| Funcionalidade | Fase 1 | Fase 2 | Fase 3 |
|---|:--:|:--:|:--:|
| Consulta de encomenda por ligação (sem conta) | ✓ | | |
| Registo, sessão, recuperação de palavra-passe | ✓ | | |
| Dados pessoais | ✓ | | |
| Histórico de encomendas | ✓ | | |
| Detalhe de encomenda | ✓ | | |
| Próximas recolhas | ✓ | | |
| Cancelar encomenda dentro do prazo | ✓ | | |
| Consentimentos e comunicações | ✓ | | |
| Eliminação de conta | ✓ | | |
| Exportação de dados pessoais | ✓ | | |
| Repetir encomenda anterior | | ✓ | |
| Subscrição: ver, pausar, retomar, saltar, cancelar | | ✓ | |
| Métodos de pagamento guardados | | ✓ | |
| Moradas guardadas | | | ✓ |
| Preferências de produto | | | ✓ |

**Nota sobre moradas.** O FUERZA **não faz entrega ao domicílio** (§2, não-objetivos). Uma morada só é necessária para faturação com dados fiscais completos (`DP-43`). Colocar «moradas» na fase 1 seria pedir dados que não são usados — mau para a experiência e mau em proteção de dados. Fica na fase 3 e só se a faturação o exigir.

## 8.2 Dados pessoais

- Mínimo para reservar: nome, email, telefone (`DP-17`).
- **Justificação obrigatória do telefone:** é o canal para avisar de um problema no dia da recolha. Se não houver esse uso, não deve ser recolhido — princípio da minimização (RGPD, art.º 5.º).
- Todos os campos editáveis pelo cliente.
- Alterar o email exige verificação do novo endereço.

## 8.3 Encomendas e detalhe

**Lista:** ordenada por data de recolha, com as futuras em primeiro. Cada linha: data, ponto, estado (*rótulo visível* de §5.14), total, código.

**Detalhe:** itens com preço fixado na compra; data e janela; ponto com morada e instruções; código destacado; estado com histórico datado; ligação ao recibo; ação de cancelar quando aplicável.

## 8.4 Próximas recolhas

Bloco destacado no topo, com a próxima recolha em primeiro plano: **data, janela, ponto e código**, sem necessidade de abrir nada. É a informação de que o cliente precisa no momento em que abre a área de cliente — normalmente a caminho de levantar.

## 8.5 Subscrição — fase 2

Vista única com: plano, conteúdo, frequência, próximo pagamento e valor, próximas entregas, e as ações de §7.10–7.13.

**Requisito:** pausar e cancelar têm de estar **na mesma vista**, sem fluxos escondidos e sem obrigar a contactar o obrador. Esconder o cancelamento é um padrão manipulador e contradiz frontalmente a proximidade da marca.

## 8.6 Métodos de pagamento — fase 2

- Nunca são guardados dados de cartão nos sistemas do FUERZA — apenas referências do processador.
- Adicionar, definir como principal, remover.
- Não se pode remover o único método de uma subscrição ativa sem o substituir.

## 8.7 Comunicações e consentimento

Separação obrigatória, com base legal distinta:

| Tipo | Base legal | Optável |
|---|---|:--:|
| **Transacionais** (confirmação, lembrete, alteração, cancelamento, pagamento) | Execução do contrato | ✗ |
| **Marketing** (novidades, diário, promoções) | Consentimento | ✓ |

- O consentimento de marketing é **sempre opt-in explícito**, nunca pré-marcado, nunca em condição de compra.
- Retirar o consentimento é tão fácil como dá-lo, e tem efeito imediato.
- Registo auditável de quando e como cada consentimento foi dado ou retirado.

## 8.8 Eliminação de conta

- Ação disponível ao cliente, com confirmação explícita.
- Efeito: dados pessoais eliminados ou anonimizados.
- **Exceção:** registos com obrigação legal de conservação — faturação e contabilidade — são retidos pelo prazo legal aplicável, em forma anonimizada onde possível. O período de conservação exato é `DP-44`, a validar com assessoria fiscal e jurídica do FUERZA.
- O cliente é informado desta exceção **antes** de confirmar.
- Subscrição ativa é cancelada como parte do processo.

## 8.9 Privacidade

- Política de privacidade e de cookies em es-ES, publicada antes do lançamento.
- Direitos RGPD acessíveis: acesso, retificação, apagamento, portabilidade, oposição.
- Exportação de dados em formato legível por máquina.
- Consentimento de cookies com recusa tão acessível como a aceitação.
- Analítica: apenas após consentimento, salvo se estritamente necessária e sem identificação pessoal (`DP-45`).

---

# 9. Painel do obrador

*Rota:* `/admin` · Acesso: `Administrador`, `Obrador`, `Responsable de punto` (fase 2)

## 9.1 A pergunta que o painel responde

> **«Cuántos productos tenemos que preparar y distribuir en cada fecha y punto de recogida?»**

Tudo o que não ajude a responder a esta pergunta é secundário. O Documento 01 (§24) já estabelece o risco de um painel demasiado ambicioso, e o objetivo 7 dá-lhe poder de veto.

> **⚖️ Conflito experiência × operação.** Há tentação de construir gráficos, previsões, análises de coorte e relatórios. Um obrador pequeno não usa nada disso — usa uma lista impressa. **Recomendação: a fase 1 do painel é uma lista de produção que se pode imprimir, e o mínimo à volta dela para a manter verdadeira.** Análises entram quando alguém as pedir por nome.

## 9.2 Vista principal — «Producción»

Ecrã de entrada. Por omissão, **amanhã**.

**Estrutura:**

1. **Cabeçalho:** seletor de data, total de unidades, número de encomendas, estado da hora-limite (aberta/fechada).
2. **Por produto** *(a lista que se leva para o forno)* — produto, variante, total de unidades, repartição por ponto.
3. **Por ponto** *(a lista que se leva na carrinha)* — ponto, total, discriminação por produto, número de encomendas.
4. **Encomendas** — lista detalhada com código, cliente, itens, ponto, estado.

**Requisitos:**
- Legível em telemóvel. É onde vai ser consultada.
- **Imprimível** — folha limpa, sem navegação, com quebras corretas. Não é um extra: é a forma como a informação chega ao forno.
- Exportável em CSV.
- Distingue visualmente as encomendas de subscrição das avulsas (fase 2).
- Indica claramente se a data ainda está aberta a encomendas — uma lista de uma data aberta ainda vai mudar, e quem a imprime tem de saber disso.

## 9.3 Restantes vistas

| Vista | Fase | Conteúdo |
|---|:--:|---|
| **Producción** | 1 | §9.2 |
| **Pedidos** | 1 | Lista filtrável (data, ponto, estado, código, cliente); detalhe; alterar estado; cancelar; reembolsar |
| **Disponibilidad** | 1 | Calendário com limites por data e ponto; abrir/fechar datas; ajustar limites |
| **Catálogo** | 1 | Produtos, variantes, preços, fotografias, alergénios, dias de produção, estados |
| **Puntos** | 1 | Pontos, horários, dias, janelas, capacidades, produtos aceites, datas excecionais, estado |
| **Cierres** | 1 | Calendário global de encerramentos e feriados |
| **Clientes** | 1 | Consulta e procura. **Sem edição de dados pessoais** salvo pedido documentado do titular |
| **Excepciones** | 1 | Fila de casos que exigem decisão humana (§15) |
| **Suscripciones** | 2 | Lista, estados, próximas entregas, resolução de falhas de pagamento |
| **Usuarios** | 2 | Utilizadores do painel e permissões |
| **Contenido** | 2 | Páginas institucionais e diário |

## 9.4 Preparação de lotes e estados operacionais

Ações do perfil `Obrador`, desenhadas para poucos toques:

| Ação | Efeito | Nível |
|---|---|---|
| «Marcar como preparado» | `confirmado` → `en_preparacion` → `listo` | Encomenda ou **lote inteiro** |
| «Marcar lote entregado en [punto]» | Todas as encomendas do ponto → `en_punto` | Ponto × data |
| «Confirmar recogida» | → `recogido` | Encomenda |
| «Buscar por código» | Abre a encomenda | — |

**A operação em lote é obrigatória.** Marcar 40 encomendas uma a uma não acontecerá na prática — e um sistema que não é usado produz dados falsos, que é pior do que não ter dados.

## 9.5 Limites, encerramentos e auditoria

- Alterar um limite tem efeito imediato na disponibilidade pública.
- **Nunca abaixo do já reservado** (§4.10, §15 caso 13).
- Encerrar uma data com encomendas exige resolução explícita de cada uma (§15, caso 11).
- **Todas** as ações com impacto comercial — preço, limite, estado, encerramento, cancelamento, reembolso — ficam registadas com autor, momento, valor anterior e valor novo (§14.9).

## 9.6 Permissões

Ver §3.8. Regras adicionais:

- Autenticação obrigatória para todo o `/admin`, com segundo fator para `Administrador` (`DP-46`).
- Sessões do painel expiram por inatividade.
- `Obrador` **não vê** preços totais nem dados financeiros — não precisa deles para produzir, e a minimização também se aplica internamente.
- `Responsable de punto` vê apenas o seu ponto e apenas as datas relevantes.

---

# 10. Pagamentos e reembolsos

Especificação **funcional**. A integração técnica com Stripe pertence ao Documento 04 (Arquitetura Técnica).

**Todo o pagamento é antecipado e online** (`DA-01`, §5.3).

## 10.1 Modalidades

| Modalidade | Fase | Aplicação |
|---|:--:|---|
| Pagamento avulso antecipado | 1 | Uma reserva |
| Pagamento recorrente | 2 | Plan de Pan |

**Não existe pagamento na recolha.** A modalidade foi eliminada do produto por `DA-01` e não deve ser prevista, nem como caso de exceção, nem como configuração desativada. Nenhum ponto de recolha tem meios de cobrança associados ao FUERZA.

## 10.2 Estados do pagamento

| Estado | *Rótulo visível* | Significado |
|---|---|---|
| `pendiente` | «Pendiente» | Iniciado, sem resultado |
| `autorizado` | «Autorizado» | Fundos reservados, ainda não capturados |
| `pagado` | «Pagado» | Capturado |
| `fallido` | «Pago fallido» | Recusado ou erro |
| `cancelado` | «Cancelado» | Abandonado ou autorização libertada |
| `parcialmente_reembolsado` | «Parcialmente reembolsado» | Devolução de parte |
| `reembolsado` | «Reembolsado» | Devolução total |

## 10.3 Autorizar vs. capturar

`DP-47`.

| Opção | Nota |
|---|---|
| **A. Captura imediata** | Simples. Reembolso é um movimento real. **Recomendada** para a fase 1 |
| **B. Autorizar e capturar na preparação** | Menos reembolsos; mas autorizações caducam (tipicamente ~7 dias) e limitariam a antecedência das reservas — incompatível com reservas com semanas de antecedência |

**Recomendação: A.** A opção B parece elegante e colide com o modelo de reserva antecipada, que é o coração do produto.

**Nota:** `DP-47` continua pendente, mas é uma decisão **interna de tesouraria**, não comercial. Qualquer das opções cumpre `DA-01` — em ambas o cliente paga no momento da reserva e nada deve no balcão. A diferença está apenas em quando os fundos são capturados.

## 10.4 Ligação entre pagamento e encomenda

- Relação **1 encomenda ↔ 1 pagamento** na fase 1. Sem pagamentos parciais nem divididos.
- A encomenda só passa a `confirmado` com confirmação de pagamento vinda do processador — **nunca com base no retorno do navegador**, que pode ser perdido, repetido ou forjado.
- **Nenhuma encomenda pode existir em `confirmado` ou em qualquer estado posterior sem um pagamento em `pagado` associado** (`DA-01`). É um invariante do sistema, verificável automaticamente e monitorizado como o de §14.10. Uma violação é um alerta crítico, não um aviso.
- Nenhum perfil do painel — incluindo `Administrador` — pode confirmar manualmente uma encomenda por pagar. Se for necessário oferecer uma encomenda, o caminho é uma encomenda paga e depois reembolsada, ou um mecanismo próprio a definir; **nunca contornar o invariante**.
- Toda a notificação do processador é processada de forma **idempotente**: a mesma notificação recebida cinco vezes produz o mesmo resultado que uma.
- Se chegar um pagamento sem encomenda correspondente, ou uma encomenda sem pagamento passado o prazo, o caso entra na fila **«Excepciones»** (§9.3) para resolução humana. **Nunca se descarta silenciosamente.**

## 10.5 Reembolsos

Com `DA-01`, **toda a encomenda cancelada depois de confirmada envolve dinheiro já cobrado**. O reembolso deixa de ser um caso de exceção e passa a ser o mecanismo normal de reversão.

| Cenário | Reembolso | Automático |
|---|---|:--:|
| Cliente cancela dentro do prazo | Total | ✓ |
| Obrador cancela | Total | ✓ |
| Ponto encerra e o cliente recusa alternativa | Total | ✓ |
| Item em falta na entrega ao ponto | Parcial, valor do item | ✗ — decisão do administrador |
| Não recolhido | Conforme `DP-22` | ✗ |
| Reclamação de qualidade | Discricionário | ✗ |
| **Pagamento não concluído** (falha, abandono, expiração) | **Nenhum — não houve cobrança** | — |

- Reembolso parcial exige motivo obrigatório e fica registado.
- O reembolso é sempre para o método original.
- Uma encomenda que nunca saiu de `pendiente_pago` **não gera reembolso**, porque nada foi cobrado. É a única linha da tabela em que o cancelamento não movimenta dinheiro (§5.14).

## 10.6 Recibos e faturas

- **Recibo** em todas as encomendas pagas: por email e na área de cliente.
- **Fatura com dados fiscais** (NIF, razão social) a pedido do cliente: `DP-43`. Decisão sobre se se pede sempre, nunca, ou opcionalmente no checkout. **Recomendação: opcional no checkout**, atrás de «¿Necesitas factura?» — não penaliza os 95% que não precisam.
- Numeração, série e requisitos fiscais: `DP-48`, a definir com assessoria fiscal do FUERZA. Inclui verificar a aplicabilidade dos requisitos de faturação verificável em vigor em Espanha.

## 10.7 Devoluções e cancelamentos — enquadramento legal

`DP-49`, a validar juridicamente. Nota factual relevante para a equipa: na legislação de consumo espanhola e da UE, o direito de desistência de 14 dias **não se aplica** a bens perecíveis nem a bens confecionados segundo especificações do consumidor. É provável que as reservas do FUERZA se enquadrem nessas exceções — mas a confirmação é jurídica, não técnica, e a política publicada tem de declarar isto de forma explícita e compreensível.

## 10.8 Duplicações

- Botão de pagamento bloqueado após o primeiro envio.
- Chave de idempotência por tentativa de checkout.
- Se forem detetados dois pagamentos para a mesma encomenda: o segundo é reembolsado automaticamente e o caso entra em **«Excepciones»** com notificação ao administrador.
- Recarregar a página de confirmação nunca cria uma segunda encomenda.

---

# 11. Notificações

## 11.1 Princípios

1. **Nenhum estado do sistema depende da entrega de um email.** O ecrã de confirmação e a área de cliente são a verdade (§15, caso 12).
2. **Transacional e marketing são canais separados**, com bases legais distintas (§8.7).
3. **Tom da marca** (Documento 01 §21): frases curtas, primeira pessoa do plural, dados concretos, sem exclamações.
4. **Uma notificação por evento.** Sem lembretes repetidos.
5. **Assunto informativo**, legível na pré-visualização do telemóvel.

## 11.2 Catálogo de notificações

Canal na fase 1: **email**. SMS e WhatsApp: fase 3 (`DP-50`).

| # | Evento | Destinatário | Momento | Objetivo | *Assunto, es-ES* |
|---|---|---|---|---|---|
| 1 | Encomenda confirmada | Cliente | **Após pagamento concluído** | Comprovativo com código, data, janela, ponto e valor pago | «Tu pan está reservado» |
| 2 | Lembrete de recolha | Cliente | Véspera (`DP-51`) | Evitar não-levantamento; **recordar que já está pago** | «Mañana recoges tu pan» |
| 3 | Encomenda pronta | Cliente | Ao passar a `listo`/`en_punto` | Informar que já pode ir | «Tu pan ya está listo» |
| 4 | Encomenda alterada | Cliente | Imediato | Informar da mudança | «Hemos cambiado algo de tu pedido» |
| 5 | Encomenda cancelada pelo cliente | Cliente | Imediato | Confirmar e informar do reembolso | «Pedido cancelado» |
| 6 | Encomenda cancelada pelo obrador | Cliente | Imediato | Explicar, pedir desculpa, confirmar reembolso | «No podemos preparar tu pedido» |
| 7 | Mudança de ponto ou horário | Cliente | Assim que se sabe | Evitar deslocação inútil | «Cambia el punto de recogida de tu pedido» |
| 8 | Não recolhido | Cliente | Após a janela + tolerância | Registo e abertura de contacto | «Ayer no pudimos entregarte tu pan» |
| 9 | Pagamento não concluído (avulso) | Cliente | Imediato | Informar que **não ficou reservado** e permitir nova tentativa | «Tu pedido no se ha completado» |
| 10 | Produto novamente disponível | Cliente inscrito | Ao repor stock | Recuperar procura perdida | «Vuelve a haber [producto]» |
| 11 | Renovação de subscrição | Assinante | Antes de cobrar (`DP-30`) | Transparência | «Tu Plan de Pan se renueva el [fecha]» |
| 12 | Ciclo gerado | Assinante | Ao gerar o ciclo | Mostrar datas e conteúdo | «Estas son tus próximas entregas» |
| 13 | Pagamento de subscrição falhado | Assinante | Imediato | Recuperar | «Problema con el pago de tu plan» |
| 14 | Subscrição pausada | Assinante | Imediato | Confirmar e dizer quando volta | «Tu plan está en pausa» |
| 15 | Subscrição retomada | Assinante | Imediato | Confirmar e dar a próxima data | «Volvemos a amasar para ti» |
| 16 | Subscrição cancelada | Assinante | Imediato | Confirmar e dar a última data | «Tu plan queda cancelado» |
| 17 | Alteração de preço do plano | Assinante | Aviso prévio (`DP-37`) | Requisito legal | «Cambia el precio de tu Plan de Pan» |
| 18 | Lote a caminho | Responsável do ponto | No envio | Preparar receção | «Sale hacia [punto]» |
| 19 | Resumo diário de produção | Obrador | Após a hora-limite | Iniciar preparação | «Producción del [fecha]» |
| 20 | Exceção a resolver | Administrador | Imediato | Casos de §15 | «Hay algo que revisar» |

## 11.3 Exemplos na voz da marca

*Confirmação (1):*
> **Tu pan está reservado.**
> Te esperamos el [fecha], entre las [hora] y las [hora], en [punto].
> Tu código: **[código]**
> Ya está pagado: el día de la recogida solo tienes que recogerlo.
> [instrucciones del punto]

*Lembrete de recolha (2):*
> **Mañana recoges tu pan.**
> [punto], entre las [hora] y las [hora].
> Tu código: **[código]**
> No tienes que pagar nada al recogerlo.

*Pagamento não concluído (9):*
> **Tu pedido no se ha completado.**
> No hemos podido cobrarlo, así que **no queda reservado** y el pan vuelve a estar disponible.
> Si quieres, puedes intentarlo otra vez.

*Cancelamento pelo obrador (6):*
> **No podemos preparar tu pedido del [fecha].**
> [motivo, en una frase]
> Te hemos devuelto [importe]. Tarda unos días en aparecer en tu cuenta.
> Sentimos el trastorno.

*Produto novamente disponível (10):*
> **Vuelve a haber [producto].**
> El [fecha] salen [n] del horno. Se reservan hasta el [fecha] a las [hora].

O tom segue o Documento 01 §21: informativo, honesto, sem superlativos e sem pedir desculpa em excesso.

**Regra de conteúdo decorrente de `DA-01`.** As notificações 1, 2 e 3 dizem explicitamente que **não há nada a pagar no momento da recolha**. É a informação que evita o mal-entendido mais provável do fluxo — o cliente que chega ao balcão com dinheiro na mão — e que um cliente habituado a padarias de bairro assume por omissão.

## 11.4 Falha de entrega

- Falhas registadas e visíveis no painel, por encomenda.
- Reenvio automático limitado; depois disso, o caso vai para **«Excepciones»**.
- Email inválido detetado marca o contacto para verificação.
- **Nenhuma falha de email altera o estado da encomenda.**

---

# 12. Conteúdo institucional

Mantém-se a arquitetura de informação do Documento 01 (§ Parte VI), com as alterações justificadas em §12.11.

## 12.1 Home `/`

Mantém-se o ritmo de nove blocos proposto no Documento 01 §22. Ajustes decorrentes das regras funcionais:

- **Bloco 2 («O que sai do forno hoje»)** passa a mostrar **disponibilidade real por data**, ligada ao motor de §4.10. Deixa de ser conteúdo editorial e passa a ser dados em direto. Requisito de cache: curta, para não exibir disponibilidade desatualizada.
- **Bloco 6 (Subscrição)** na fase 1 apresenta o Plan de Pan como **«Próximamente»** com recolha de interesse por email — construindo procura antes do lançamento. Não simula uma funcionalidade que não existe.
- **Bloco 7 (Encomenda em três passos)** liga diretamente a `/reservas`.

**H1:** um só, com a proposta de valor. Nunca «Bienvenidos» nem «Home» — o erro exato da referência (Documento 01 §9).

## 12.2 `/pan` — catálogo

- Grelha de produtos com nome, descrição curta, preço, fotografia e **estado de disponibilidade**.
- Filtro por família (com a cor de classificação como auxiliar visual, §4.1).
- Filtro por data: *«¿Para qué día lo quieres?»* — reordena e refiltra por disponibilidade real. **É a decisão de UX mais importante desta página**, porque alinha o catálogo com o modelo mental de quem compra pão: primeiro o dia, depois o pão.
- Filtro por alergénios: `DP-11`.
- Estado vazio, se nada estiver disponível na data escolhida, com a próxima data com produção.

## 12.3 `/pan/[slug]` — ficha de produto

Estrutura fiel à etiqueta física da marca (Documento 01 §13):

1. Fotografia e nome
2. Descrição
3. **Ficha técnica:** tipo de farinha · origem · fermentação em horas · peso aproximado
4. Ingredientes
5. **Alergénios** (§4.5)
6. Variantes e preços
7. **Disponibilidade por data e ponto**
8. Ação de reserva
9. Produtos relacionados da mesma família

**Dados estruturados `Product`** com preço e disponibilidade (§13.5).

## 12.4 `/obrador` — o processo

Cronologia de fermentação com horas concretas (Documento 01, Prioridade 3, ponto 16). Conteúdo institucional, sem funcionalidade. **Requisito de acessibilidade:** a cronologia é legível sem JavaScript e sem animação — o movimento acompanha, nunca condiciona (Documento 01 §19).

## 12.5 `/nosotros` — pessoas e origem

Equipa com nome e rosto; farinhas, moinhos e Astúrias (Documento 01, pontos 17 e 18). Alimenta os dados estruturados de `LocalBusiness`.

## 12.6 `/suscripciones`

- **Fase 1:** página explicativa com recolha de interesse. Estado honesto: *«Estamos preparándolo.»*
- **Fase 2:** planos, preços, funcionamento, regras de pausa e cancelamento **antes** da subscrição, e FAQ.

**Requisito de transparência:** as condições de pausa, salto e cancelamento têm de estar visíveis **antes** de subscrever, não apenas nos termos. É requisito de confiança e coerente com a marca.

## 12.7 `/reservas`

Explica o funcionamento em três passos, a hora-limite, os pontos e a política de cancelamento. É a página que responde às perguntas antes de o cliente entrar no fluxo — reduz abandono e reduz contactos ao obrador.

## 12.8 `/donde-estamos`

- Todos os pontos, incluindo `proximamente` (apoia o objetivo 5).
- Por ponto: morada, mapa, indicações, dias de recolha, janela, instruções e estado.
- Dados estruturados `LocalBusiness` por ponto.

## 12.9 `/contacto`

Formulário com `<label>` em todos os campos (Documento 01 §7 — a referência tinha zero). Contactos diretos. **Não substitui a área de cliente** para gestão de encomendas.

## 12.10 Páginas legais

Aviso legal · Política de privacidade · Política de cookies · Termos e condições de venda · Política de cancelamento e reembolso.

**Requisito de bloqueio:** nenhuma pode conter texto genérico por adaptar. É o defeito mais grave encontrado na referência (Documento 01 §10) e a validação de §13.9 deve detetá-lo automaticamente.

## 12.11 Alterações à arquitetura de informação do Documento 01

| Alteração | Justificação |
|---|---|
| `/cuenta` ganha sub-rotas (`/pedidos`, `/suscripcion`, `/datos`) | Consequência do âmbito de §8 |
| `/reservas` passa a ser página explicativa; o fluxo vive em `/pan` e no checkout | Separa «compreender» de «comprar». Uma página que faz as duas coisas faz mal as duas |
| `/admin` ganha `/produccion`, `/pedidos`, `/disponibilidad`, `/puntos`, `/cierres`, `/excepciones` | Consequência de §9 |
| `/diario` mantém-se na fase 3 | Confirma o Documento 01 |

**Nada mais se altera.** A arquitetura proposta no Documento 01 resistiu ao detalhe funcional, o que é um bom sinal sobre ela.

---

# 13. SEO, acessibilidade e qualidade

Conversão das conclusões do Documento 01 em **requisitos verificáveis**. Cada linha tem de ser testável automaticamente; o que não for verificável em CI não é um requisito, é uma intenção.

## 13.1 Idioma

| Requisito | Verificação |
|---|---|
| `lang="es-ES"` em todas as páginas | Automática — falha o *build* |
| Todo o conteúdo visível em es-ES | Revisão + deteção de padrões noutras línguas |
| Datas, horas e moeda em formato espanhol (`Europe/Madrid`, €, dd/mm/aaaa) | Testes unitários de formatação |
| `hreflang` se houver mais do que uma língua | `DP-52` |

> A referência serve `lang="pt-PT"` num site inteiramente em espanhol (Documento 01 §7). É o erro mais barato de evitar e o mais caro de manter.

## 13.2 Estrutura de cabeçalhos

- **Exatamente um `<h1>` por página**, descritivo. Verificação automática; falha o *build*.
- Hierarquia sem saltos.
- Landmarks semânticos: `header`, `nav`, `main`, `footer`.
- *Skip link* funcional, em es-ES.

## 13.3 Formulários

- **`<label>` associado a todos os campos.** Sem exceções. *Placeholder* nunca substitui `label`.
- Erros associados por `aria-describedby`, anunciados a leitores de ecrã e **específicos**: nunca «Error en el formulario».
- Campos obrigatórios indicados visualmente e programaticamente.
- Validação no envio, não a cada tecla — evita anunciar erros enquanto o utilizador ainda escreve.

## 13.4 Contraste, teclado e movimento

- **WCAG 2.2 nível AA** em todo o texto e componente de interface.
- Aplicar a auditoria de contraste do Documento 01 §14: botão principal terracota com **texto preto** (5,70:1). Branco sobre terracota (3,68:1) é **proibido**.
- Verificação automática de contraste em CI.
- Todo o fluxo de reserva completável **só com teclado**.
- Foco sempre visível; ordem de foco lógica; foco gerido em diálogos e devolvido ao fechar.
- `prefers-reduced-motion` desliga o movimento decorativo e mantém o informativo.
- **Nenhum conteúdo depende de JavaScript para ser visível** (Documento 01 §5 — o defeito `elementor-invisible` da referência).

## 13.5 Dados estruturados

| Tipo | Onde |
|---|---|
| `Bakery` / `LocalBusiness` | Home, `/donde-estamos`, por ponto |
| `Product` + `Offer` com disponibilidade | Ficha de produto |
| `BreadcrumbList` | Todas as páginas com hierarquia |
| `FAQPage` | `/reservas`, `/suscripciones` |
| `Organization` | Global |

## 13.6 Metadados, canonical e redirecionamentos

- `<title>` único por página, **começando pela proposta de valor** — nunca por «Home» (Documento 01 §9).
- `meta description` de 150–160 caracteres, única, escrita — não gerada.
- Open Graph e Twitter Card com imagem própria.
- `canonical` absoluto e correto em todas as páginas.
- Filtros e parâmetros de listagem **não geram URLs indexáveis** duplicadas.
- Alterar o slug de um produto cria redirecionamento permanente automático.
- Produto `descatalogado` mantém a URL com conteúdo e ligação a alternativas — não devolve 404.

## 13.7 Sitemap e robots

- `sitemap.xml` gerado automaticamente, sem páginas privadas (`/cuenta`, `/admin`, checkout).
- `robots.txt` bloqueia `/admin`, `/cuenta` e o checkout.
- Páginas de estado (confirmação, erro) com `noindex`.

## 13.8 Imagens

- AVIF com *fallback* WebP.
- `srcset` e `sizes` sempre.
- Dimensões declaradas — CLS < 0,05.
- `fetchpriority="high"` na imagem principal da home; `loading="lazy"` no resto.
- `alt` descritivo em es-ES; vazio **apenas** em imagem decorativa.

## 13.9 Conteúdo real, sem *placeholders*

**Requisito de bloqueio de publicação**, e o mais importante desta secção. A referência publicou dezoito ocorrências de texto de configuração em inglês numa página comercial (Documento 01 §10).

- Verificação automática em CI que procura padrões de *placeholder* (`[`, `Lorem`, `TODO`, `placeholder`, `Custom Field`, `xxx`) no HTML gerado.
- **Falha o *build*.** Não é um aviso.
- Um produto sem campos obrigatórios não pode ser publicado (§4.2).

## 13.10 Orçamento de performance

Do Documento 01 (Prioridade 4, ponto 19), verificado em CI:

| Métrica | Alvo | Referência |
|---|---|---|
| Caminho crítico (CSS+JS+HTML) | < 200 KB | ~1 707 KB |
| Pedidos iniciais | < 20 | 66 |
| LCP | < 2,0 s | — |
| CLS | < 0,05 | — |
| INP | < 200 ms | — |
| Famílias tipográficas | 2, ambas usadas | 4, duas usadas |

## 13.11 Estados de erro acessíveis

- Toda a mensagem de erro é anunciada a tecnologia de apoio.
- Erros **específicos e acionáveis**: dizem o que aconteceu e o que fazer a seguir.
- Uma falha de disponibilidade no checkout apresenta alternativas concretas (§5.10), nunca um erro genérico.
- Páginas 404 e 500 com navegação útil, em es-ES.

---

# 14. Requisitos não funcionais

## 14.1 Mobile first

- Desenhado a partir do ecrã pequeno; o grande é a adaptação.
- **Uma marcação, vários layouts.** Proibida a duplicação de conteúdo para responsive — o padrão «duplicar e esconder» da referência (Documento 01 §6).
- Alvos de toque com dimensão adequada.
- Fluxo de reserva completável com uma mão.
- O painel de produção é legível e utilizável em telemóvel (§9.2).

## 14.2 Segurança

- HTTPS obrigatório; HSTS.
- Palavras-passe com algoritmo de derivação moderno; nunca reversíveis.
- Proteção contra força bruta na autenticação e nos códigos de recolha.
- Proteção CSRF em todas as ações com efeito.
- Cabeçalhos de segurança, incluindo CSP.
- **Nenhum dado de cartão nos sistemas do FUERZA.**
- Ligações de acesso a encomendas de convidado: assinadas, com prazo, sem dados sensíveis na URL.
- Painel: autenticação obrigatória, sessões com expiração, segundo fator para `Administrador` (`DP-46`).
- Limitação de taxa em endpoints de escrita e de autenticação.

## 14.3 Privacidade

- **Minimização:** recolher apenas o que é usado. Todo o campo pedido ao cliente tem de ter um uso identificado neste documento.
- Consentimento separado por finalidade (§8.7).
- Prazos de conservação definidos por tipo de dado (`DP-44`).
- Encarregado de proteção de dados: `DP-53` — a avaliar se é obrigatório para o volume do FUERZA.
- Registo de atividades de tratamento.
- Subcontratantes com contrato adequado.

## 14.4 Performance

Ver §13.10. Adicionalmente:

- Conteúdo institucional estático por omissão.
- Só a disponibilidade e o carrinho são dinâmicos.
- Disponibilidade com cache curta e invalidação ao mudar (`DP-54`).
- O painel pode ser mais lento que o site público — é usado por poucas pessoas e não afeta conversão nem SEO.

## 14.5 Manutenção

- Um pequeno conjunto de componentes reutilizados (Documento 01, Parte VII).
- Tokens de design num só lugar.
- Conteúdo institucional editável sem programador.
- **Toda a regra de negócio configurável neste documento é configurável na aplicação** — limites, horas-limite, janelas, capacidades, prazos. Nada codificado à mão.

## 14.6 Observabilidade

- Registo estruturado de erros de aplicação.
- Alertas para: falhas de pagamento acima do normal, falhas de notificação, exceções por resolver, tarefas periódicas falhadas.
- Métricas operacionais mínimas: reservas por dia, taxa de não-levantamento, taxa de conversão do checkout, taxa de esgotamento por produto.
- **Nenhuma ferramenta concreta é escolhida aqui** — depende da arquitetura (Documento 04).

## 14.7 Escalabilidade moderada

Dimensionar para um obrador pequeno com vários pontos, **não** para escala nacional. Sobredimensionar custa dinheiro e complexidade que o objetivo 7 não tolera.

- Ponto de pressão real e conhecido: **o momento de abertura de disponibilidade de uma data popular**, se for anunciado. É concorrência sobre poucas unidades — o desenho de §5.4 e §15 responde a isso.
- Adicionar um ponto de recolha é configuração, **nunca desenvolvimento**. Este requisito serve diretamente o objetivo 5.

## 14.8 Resiliência

- Falha do processador de pagamentos: o checkout mostra erro claro e **não perde o carrinho**.
- Falha do serviço de email: encomendas continuam a ser criadas; notificações vão para fila (§11.4).
- Falha do CMS: o conteúdo publicado continua servido.
- Tarefas periódicas (expiração de reservas, transição para não recolhido, geração de ciclos) são **idempotentes** e recuperáveis: correr duas vezes não duplica efeitos.

## 14.9 Auditabilidade de alterações administrativas

**Requisito explícito.** Registo imutável de todas as ações com impacto comercial ou pessoal:

| O que se regista | Exemplos |
|---|---|
| Alterações de catálogo | Preço, alergénios, estado, dias de produção |
| Alterações de disponibilidade | Limites, encerramentos, capacidades |
| Alterações de estado de encomenda | Quem marcou preparado, entregue, recolhido, cancelado |
| Movimentos financeiros | Reembolsos totais e parciais, com motivo |
| Alterações de pontos | Estado, janelas, capacidades |
| Acessos a dados pessoais no painel | Quem consultou que cliente |

Cada registo: autor, momento, ação, valor anterior, valor novo. Consultável por administrador. Retenção: `DP-55`.

**Motivo obrigatório** em: reembolso, cancelamento pelo obrador, alteração de preço, redução de limite.

## 14.10 Proteção contra venda acima da capacidade

Requisito não funcional mais crítico do sistema. Já especificado funcionalmente em §5.4 e §15.

| Regra | |
|---|---|
| Decremento de disponibilidade | **Atómico.** Duas reservas simultâneas nunca podem ambas ter sucesso na última unidade |
| Verificação final | **No servidor**, imediatamente antes de confirmar. A validação do cliente é conveniência, não garantia |
| Limites | Nunca reduzíveis abaixo do reservado |
| Invariante do sistema | **A soma das unidades reservadas para uma data e ponto nunca excede o limite configurado.** Verificável automaticamente e monitorizado |

## 14.11 Consistência entre pagamento, stock e encomenda

Os três podem divergir e o sistema tem de o detetar em vez de o ignorar.

- Estado do pagamento vindo do processador é a **autoridade** sobre se houve pagamento.
- O estado da encomenda no FUERZA é a **autoridade** sobre o compromisso de produção.
- Uma reconciliação periódica compara os dois e leva as divergências para **«Excepciones»** (§9.3).

**Divergências a detetar:**

| Divergência | Ação |
|---|---|
| Pago sem encomenda confirmada | Exceção + alerta imediato |
| Encomenda confirmada sem pagamento | Exceção + alerta imediato |
| Reserva temporária expirada com pagamento em curso | Exceção; **o cliente nunca perde o que pagou** |
| Reservas somam mais que o limite | Alerta crítico — violação do invariante de §14.10 |
| Pagamento duplicado | Reembolso automático do segundo + exceção (§10.8) |

---

# 15. Estados e casos extremos

Matriz de comportamento esperado. **Nenhum destes casos deve ser resolvido durante a implementação** — todos estão decididos aqui.

| # | Situação | Comportamento esperado | Quem é informado |
|---|---|---|---|
| **1** | **Stock termina durante o checkout** | A verificação final no servidor recusa. O cliente volta à revisão com o item assinalado e alternativas concretas (outra data, outro ponto). O resto do carrinho mantém-se. Sem cobrança | Cliente, no ecrã |
| **2** | **Dois clientes disputam a última unidade** | Decremento atómico na criação da reserva temporária (§5.4). O primeiro fica com ela. O segundo recebe recusa imediata com alternativas. **Nunca ambos** | Cliente perdedor |
| **3** | **Pagamento aprovado, confirmação interna falha** | O pagamento é a autoridade. A notificação do processador é reprocessada de forma idempotente até a encomenda existir. Se não resolver em [prazo], entra em «Excepciones» com alerta imediato. **O cliente nunca perde o que pagou.** Se o ecrã de confirmação falhar, o email e a área de cliente cobrem | Administrador (imediato); cliente por email |
| **4** | **Ponto fecha depois de existirem encomendas** | O painel **recusa** desativar o ponto. Apresenta as encomendas afetadas e exige resolução: transferir para outro ponto (com consentimento do cliente) ou cancelar com reembolso total | Administrador (bloqueio); clientes afetados |
| **5** | **Cliente chega no dia errado** | O operador procura pelo código e vê a data correta. Se for antes: informa a data certa; a encomenda mantém-se. Se for depois e já `no_recogido`: o administrador pode reverter para `listo` se o produto existir; caso contrário aplica-se `DP-22`. **Todas as reversões são auditadas.** Em nenhum caso se cobra ou devolve dinheiro ao balcão — a encomenda já está paga e qualquer devolução é feita pelo painel (`DA-01`) | Cliente, no balcão |
| **6** | **Encomenda não levantada** | Transição automática para `no_recogido` após a janela + tolerância (`DP-21`). Notificação ao cliente. Sem reembolso automático (`DP-22`). Contabilizada como desperdício nas métricas. Reincidência sinalizada, nunca bloqueada automaticamente | Cliente; painel |
| **7** | **Subscrição tenta gerar encomenda sem capacidade** | **Não deveria acontecer** — §7.9 reserva a capacidade dos assinantes antes da venda pública. Se acontecer, é um erro de configuração: a geração **falha explicitamente**, entra em «Excepciones» com alerta crítico, e o administrador resolve aumentando o limite ou deslocando a entrega. **Nunca falha em silêncio; nunca sobrevende** | Administrador (crítico); cliente só após decisão humana |
| **8** | **Cliente pausa depois de a reserva já ter sido gerada** | A pausa aplica-se às entregas ainda **não geradas**. A já gerada segue as regras normais de cancelamento (§5.8). **O ecrã de pausa mostra isto antes de confirmar**, com a opção de cancelar também essa entrega | Cliente, antes de confirmar |
| **9** | **Produto deixa de ser produzido** | Passa a `descatalogado`. Encomendas confirmadas **cumprem-se**. Subscrições que o contenham são sinalizadas e exigem resolução do administrador: substituir ou contactar o cliente. **Nunca substituição automática** | Administrador; assinantes afetados |
| **10** | **Alteração de preço do plano** | Aviso prévio (`DP-37`) com direito de cancelar sem custo. Ciclos já cobrados não são afetados. Sem aviso, a alteração não entra em vigor | Assinantes, com antecedência |
| **11** | **Feriado ou encerramento imprevisto** | Se não houver encomendas: bloqueia a data. Se houver: o painel exige resolução de cada uma (deslocar ou cancelar com reembolso). Subscrições com entrega nessa data seguem §7.8 | Administrador; clientes afetados |
| **12** | **Falha de envio de email** | **Nenhum estado muda.** A encomenda existe e é válida. Reenvio automático limitado; depois, «Excepciones». A confirmação no ecrã e a área de cliente garantem que o cliente tem a informação | Administrador |
| **13** | **Administrador reduz a quantidade abaixo do já reservado** | **Recusado.** Mensagem indica quantas unidades estão comprometidas. Para reduzir de facto, o administrador tem de cancelar encomendas primeiro — explicitamente, uma a uma, com notificação | Administrador (bloqueio) |
| **14** | **Cliente reserva e a hora-limite passa antes de pagar** | A reserva temporária mantém-se válida até expirar (§5.4), **mesmo depois da hora-limite**. Quem chegou a tempo mantém o lugar e pode concluir o pagamento. Se não concluir, a reserva liberta-se e **não é possível recomeçar para essa data** — não há caminho alternativo, porque não existe reservar agora e pagar depois (`DA-01`) | Cliente, no ecrã |
| **15** | **Item em falta na entrega ao ponto** | O operador marca a falta na encomenda. O cliente é notificado **antes** de se deslocar, com opção de reembolso parcial ou substituição. Reembolso parcial exige aprovação do administrador | Cliente (imediato); administrador |
| **16** | **Cliente envia outra pessoa para levantar** | Permitido: quem apresentar o código levanta. **Regra a publicar explicitamente.** O código não dá acesso a dados pessoais (§5.13). Confirmação: `DP-27` | Publicado nas condições |
| **17** | **Reserva temporária expira durante o pagamento** | O pagamento é interrompido se ainda for possível. Se já tiver sido cobrado, entra em «Excepciones» com alerta imediato e o administrador decide: cumprir (se houver capacidade) ou reembolsar totalmente. **O cliente nunca paga sem receber nem fica sem resposta** | Administrador (imediato); cliente |
| **18** | **Duas subscrições do mesmo cliente para o mesmo dia e ponto** | Permitido se `DP-40` o permitir; caso contrário recusado na criação com explicação | Cliente, no momento |
| **19** | **Cliente chega ao balcão a querer pagar** | O operador informa que já está pago e entrega. **Não há caixa, não há cobrança e não há exceção possível** (`DA-01`). Se o cliente insiste que não pagou, o operador verifica pelo código: se a encomenda existe, está paga; se não existe, não há encomenda — e não pode ser criada no balcão | Cliente, no balcão |
| **20** | **Cliente abandona o checkout com a reserva ativa** | Tratado exatamente como falha de pagamento (§5.11): a reserva expira no prazo definido e o stock volta a estar disponível. **Nenhuma encomenda é criada.** Não se envia notificação de abandono na fase 1 — seria recuperação de carrinho, funcionalidade não prevista | Ninguém |
| **21** | **Pagamento concluído depois de a encomenda ter sido cancelada por expiração** | Situação de corrida entre a expiração e a confirmação do processador. O pagamento é a autoridade: entra em «Excepciones» com alerta imediato e o administrador decide — recriar a encomenda se ainda houver capacidade, ou reembolsar totalmente. **O cliente nunca fica sem pão e sem dinheiro** | Administrador (imediato); cliente |

---

# 16. MVP e fases

## 16.1 Fase 1 — Reservar e produzir

**Objetivo:** um cliente reserva pão para uma data e um ponto, paga, levanta; o obrador vê exatamente o que tem de fazer.

| Âmbito | Detalhe |
|---|---|
| Site institucional | Home, `/pan`, ficha, `/obrador`, `/nosotros`, `/reservas`, `/donde-estamos`, `/contacto`, legais |
| Catálogo | Famílias, produtos, variantes, alergénios, fotografias, estados |
| Disponibilidade | Limites por variante×data e por ponto×data; hora-limite; encerramentos |
| Reserva y recoge | Fluxo completo de §5.2 |
| Pagamento avulso | **Antecipado e online** (`DA-01`). Sem cobrança na recolha, em nenhum ponto |
| Pontos de recolha | Modelo completo de §6, incluindo pontos externos |
| Conta | Registo, sessão, histórico, próximas recolhas, consentimentos, eliminação |
| Compra sem conta | Completa, com acesso por ligação |
| Painel | Producción, Pedidos, Disponibilidad, Catálogo, Puntos, Cierres, Clientes, Excepciones |
| Notificações | Eventos 1–10, 19, 20 de §11.2 |
| Qualidade | Todos os requisitos de §13, verificados em CI |

**`/suscripciones` existe na fase 1** como página explicativa com recolha de interesse (§12.6) — constrói procura para a fase 2 sem simular o que não existe.

## 16.2 Fase 2 — Plan de Pan

| Âmbito | Detalhe |
|---|---|
| Subscrições | §7 completo, no modelo escolhido em `DP-28` |
| Prioridade de stock | Ativação de §7.9 |
| Área do assinante | §8.5 |
| Métodos de pagamento guardados | §8.6 |
| Repetir encomenda | §8.1 |
| Gestão avançada de pontos | Acesso de painel a responsáveis de ponto (`DP-06`) |
| Automações | Notificações 11–18; resumos automáticos |
| Painel | Suscripciones, Usuarios, Contenido |

## 16.3 Fase 3 — Comunidade e fidelização

| Âmbito | Justificação |
|---|---|
| `/diario` | SEO de cauda longa e comunidade (Documento 01) |
| Fidelização | Só com dados reais de recorrência — desenhar antes seria adivinhar |
| Cartões oferta | Procura sazonal previsível; exige regras de resgate que não existem |
| Lista de espera | Se os dados de esgotamento mostrarem procura reprimida |
| Moradas e faturação avançada | Se `DP-43` o exigir |
| Outros canais de notificação | SMS/WhatsApp (`DP-50`) |
| Alocação por produto×ponto×data | Nível 3 de §4.10, se a operação o exigir |

## 16.4 Compatibilidade entre fases

**Requisito explícito do enunciado:** a fase 1 não pode criar decisões incompatíveis com a fase 2. Cinco pontos onde isso poderia acontecer, e a defesa em cada um:

| # | Risco de incompatibilidade | Defesa a implementar na fase 1 |
|---|---|---|
| 1 | Motor de disponibilidade sem noção de reserva prioritária | Distinguir desde o início **capacidade total** de **capacidade disponível para venda avulsa**, mesmo enquanto forem iguais (§7.9) |
| 2 | Encomendas sem origem identificada | Toda a encomenda regista a sua **origem** (`avulsa` / `suscripcion`) desde o primeiro dia |
| 3 | Modelo de cliente sem espaço para subscrição | Cliente e encomenda são entidades separadas; a encomenda nunca é a raiz do modelo |
| 4 | Pagamentos só desenhados para transação única | Separar **encomenda** de **pagamento** desde a fase 1 (§10.4). Nunca tratar a encomenda como o objeto de cobrança |
| 5 | Notificações codificadas caso a caso | Sistema de eventos com modelos, desde o primeiro email. Adicionar os eventos 11–18 tem de ser configuração, não desenvolvimento |

**Nenhuma destas defesas exige construir a subscrição na fase 1.** Todas são decisões de forma, com custo próximo de zero se tomadas agora e custo alto se adiadas.

---

# 17. Critérios de aceitação

Formato **Dado / Quando / Então**. Textos visíveis em es-ES.

## 17.1 Reserva

**CA-R1 — Reserva completa com sucesso**
- **Dado** um produto ativo com disponibilidade numa data e num ponto
- **Quando** o cliente completa os passos de §5.2 e o pagamento é confirmado
- **Então** a encomenda é criada em `confirmado`, é gerado um código único, a disponibilidade é decrementada de forma definitiva, e o cliente vê o ecrã de confirmação com data, janela, ponto, código e instruções

**CA-R2 — Confirmação não depende do email**
- **Dado** que o serviço de email está indisponível
- **Quando** o cliente completa uma reserva
- **Então** a encomenda é criada normalmente, o ecrã de confirmação apresenta toda a informação necessária, e a notificação fica em fila para reenvio

**CA-R3 — Compra sem conta**
- **Dado** um visitante sem sessão
- **Quando** completa uma reserva fornecendo apenas os dados mínimos
- **Então** a encomenda é criada, recebe uma ligação assinada de consulta, e é-lhe **oferecida** — nunca exigida — a criação de conta

## 17.2 Controlo de stock

**CA-S1 — Não há sobrevenda em concorrência**
- **Dado** um produto com exatamente 1 unidade disponível numa data
- **Quando** dois clientes chegam simultaneamente ao passo de revisão
- **Então** apenas um obtém a reserva temporária; o outro recebe recusa imediata com alternativas; **a soma das reservas nunca excede o limite**

**CA-S2 — Verificação final no servidor**
- **Dado** um cliente na revisão com o produto ainda disponível na interface
- **Quando** o stock esgota antes de ele confirmar
- **Então** a confirmação é recusada, **não há cobrança**, e o cliente vê o item assinalado com alternativas concretas de data e ponto

**CA-S3 — Reserva temporária expira**
- **Dado** uma reserva temporária criada há mais tempo que a duração definida
- **Quando** o processo de expiração corre
- **Então** a disponibilidade é devolvida, a encomenda em `pendiente_pago` é cancelada, e correr o processo duas vezes produz o mesmo resultado

**CA-S4 — Limite não descia abaixo do reservado**
- **Dado** uma data com 20 unidades reservadas
- **Quando** o administrador tenta definir o limite em 15
- **Então** a ação é **recusada** com mensagem indicando que existem 20 unidades comprometidas

## 17.3 Seleção de data

**CA-D1 — Só datas válidas**
- **Dado** um produto com dias de produção definidos
- **Quando** o cliente abre o calendário
- **Então** só são selecionáveis datas que satisfazem **as cinco condições** de §4.9

**CA-D2 — Hora-limite fecha a data**
- **Dado** uma data cuja hora-limite acaba de passar
- **Quando** o cliente tenta confirmar sem recarregar a página
- **Então** a confirmação é recusada com explicação e é proposta a data válida seguinte

## 17.4 Seleção de ponto

**CA-P1 — Só pontos compatíveis**
- **Dado** um carrinho com um produto restrito a certos pontos
- **Quando** o cliente escolhe o ponto
- **Então** só aparecem pontos que aceitam **todos** os itens, com capacidade na data

**CA-P2 — Motivos distintos de indisponibilidade**
- **Dado** um ponto que atingiu a capacidade numa data
- **Quando** o cliente o seleciona
- **Então** a mensagem indica que **o ponto** está completo — não que o produto está esgotado — e sugere outro ponto na mesma data

**CA-P3 — Mudança de ponto com itens incompatíveis**
- **Dado** um carrinho com itens não aceites no novo ponto
- **Quando** o cliente muda de ponto
- **Então** é avisado **antes** de confirmar, com escolha explícita; **nada é removido em silêncio**

## 17.5 Pagamento

**CA-Pg0 — Não existe encomenda confirmada por pagar** *(`DA-01`)*
- **Dado** qualquer estado do sistema
- **Quando** se verifica o conjunto de encomendas em `confirmado` ou em estados posteriores
- **Então** **todas** têm um pagamento em `pagado` associado, e nenhum perfil do painel — incluindo `Administrador` — dispõe de ação que permita confirmar uma encomenda sem pagamento. **É um invariante verificado automaticamente**

**CA-Pg1 — Confirmação apenas pelo processador**
- **Dado** um pagamento iniciado
- **Quando** o retorno do navegador chega mas a notificação do processador não
- **Então** a encomenda **não** passa a `confirmado` até essa notificação chegar

**CA-Pg2 — Idempotência**
- **Dado** a mesma notificação de pagamento recebida cinco vezes
- **Quando** cada uma é processada
- **Então** existe **uma** encomenda confirmada e **um** registo de pagamento

**CA-Pg3 — Falha não perde o carrinho**
- **Dado** um pagamento recusado
- **Quando** o cliente volta ao checkout
- **Então** o carrinho está intacto e a reserva temporária mantém-se enquanto não expirar

**CA-Pg4 — Pagamento duplicado**
- **Dado** dois pagamentos bem-sucedidos para a mesma encomenda
- **Quando** a duplicação é detetada
- **Então** o segundo é reembolsado automaticamente e o caso entra em «Excepciones» com alerta

**CA-Pg5 — Falha, abandono e expiração libertam o stock** *(`DA-01`)*
- **Dado** uma reserva temporária ativa com uma unidade comprometida
- **Quando** o pagamento falha definitivamente, o cliente abandona o checkout, ou o prazo da reserva expira
- **Então** em **qualquer** dos três casos a unidade volta a estar disponível para outros clientes, a encomenda termina em `cancelado`, e **nenhuma encomenda confirmada é criada**

**CA-Pg6 — Não há cobrança na recolha** *(`DA-01`)*
- **Dado** uma encomenda em `listo` ou `en_punto`
- **Quando** o operador ou o responsável do ponto abre a encomenda para entregar
- **Então** **não existe** ação de cobrar, registar pagamento ou calcular troco em nenhuma interface de recolha; a encomenda apresenta-se como paga

## 17.6 Confirmação

**CA-C1 — Conteúdo completo**
- **Dado** uma encomenda confirmada
- **Quando** o cliente vê a confirmação
- **Então** apresenta código, data, janela, ponto com morada e instruções, itens com preços, total **pago**, política de cancelamento e a indicação explícita de que não há nada a pagar na recolha

**CA-C2 — Recarregar não duplica**
- **Dado** uma confirmação apresentada
- **Quando** o cliente recarrega a página
- **Então** vê a mesma encomenda; **não é criada uma segunda**

**CA-C3 — Confirmação só após pagamento** *(`DA-01`)*
- **Dado** um cliente que percorreu todos os passos até ao passo 7
- **Quando** o pagamento não é concluído
- **Então** **não** vê ecrã de confirmação, **não** recebe código de recolha, e **não** recebe a notificação 1 — recebe a notificação 9, que declara que o pedido não ficou reservado

## 17.7 Produção

**CA-Pr1 — Mapa correto**
- **Dado** um conjunto de encomendas confirmadas para uma data
- **Quando** o operador abre «Producción» nessa data
- **Então** vê o total por produto, o total por ponto, e a soma coincide **exatamente** com a soma das encomendas

**CA-Pr2 — Imprimível**
- **Dado** o mapa de produção
- **Quando** é impresso
- **Então** produz uma folha legível, sem navegação, com quebras de página corretas

**CA-Pr3 — Operação em lote**
- **Dado** 40 encomendas para um ponto numa data
- **Quando** o operador marca o lote como entregue
- **Então** todas passam a `en_punto` numa ação, e todos os clientes são notificados

**CA-Pr4 — Data aberta assinalada**
- **Dado** uma data cuja hora-limite ainda não passou
- **Quando** o operador vê o mapa
- **Então** é avisado de forma inequívoca de que a lista **ainda pode mudar**

## 17.8 Subscrição *(fase 2)*

**CA-Su1 — Geração de ciclo**
- **Dado** uma subscrição ativa com pagamento bem-sucedido
- **Quando** o ciclo é gerado
- **Então** são criadas encomendas em `confirmado` para todas as datas válidas, marcadas com origem `suscripcion`, e o cliente recebe a lista

**CA-Su2 — Prioridade de stock**
- **Dado** uma data com capacidade limitada e subscrições que a cobrem parcialmente
- **Quando** a disponibilidade é aberta à venda avulsa
- **Então** a capacidade dos assinantes **já está reservada** e a venda avulsa só acede ao restante

**CA-Su3 — Data inválida no ciclo**
- **Dado** uma entrega que calha num encerramento
- **Quando** o ciclo é gerado
- **Então** a entrega é deslocada para a data válida seguinte e o cliente é notificado da nova data

**CA-Su4 — Falha de pagamento não cancela**
- **Dado** uma subscrição com pagamento falhado
- **Quando** as tentativas de recuperação se esgotam
- **Então** fica `impagada` — **não** `cancelada` — sem gerar reservas, e recupera automaticamente se o cliente atualizar o método

## 17.9 Pausa *(fase 2)*

**CA-Pa1 — Pausa suspende geração e cobrança**
- **Dado** uma subscrição ativa
- **Quando** o cliente pausa
- **Então** não se geram novas reservas nem se cobra; o plano e o preço mantêm-se

**CA-Pa2 — Pausa com reserva já gerada**
- **Dado** uma entrega já gerada para esta semana
- **Quando** o cliente pausa
- **Então** o ecrã informa, **antes de confirmar**, que essa entrega se mantém, e oferece cancelá-la também

## 17.10 Cancelamento

**CA-Ca1 — Cancelamento dentro do prazo**
- **Dado** uma encomenda confirmada — e portanto paga (`DA-01`) — antes da hora-limite
- **Quando** o cliente cancela
- **Então** passa a `cancelado`, o **reembolso total é emitido automaticamente** para o método original, a disponibilidade é devolvida, e o cliente é notificado

**CA-Ca2 — Cancelamento fora do prazo**
- **Dado** uma encomenda após a hora-limite
- **Quando** o cliente tenta cancelar
- **Então** a ação **não está disponível**, com explicação clara e um contacto para casos excecionais

**CA-Ca3 — Cancelamento de subscrição autónomo**
- **Dado** um assinante
- **Quando** cancela na área de cliente
- **Então** consegue fazê-lo **sem contactar ninguém**, vê a data até à qual o plano continua ativo, e as entregas pagas cumprem-se

## 17.11 Acessibilidade

**CA-A1 — Reserva só com teclado**
- **Dado** um utilizador que navega apenas por teclado
- **Quando** percorre todo o fluxo de reserva
- **Então** completa-o na íntegra, com foco sempre visível e ordem lógica

**CA-A2 — Contraste**
- **Dado** qualquer ecrã
- **Quando** é analisado automaticamente
- **Então** todo o texto e componente cumpre WCAG 2.2 AA; o botão principal é terracota com **texto preto**

**CA-A3 — Formulários etiquetados**
- **Dado** qualquer formulário
- **Quando** é analisado
- **Então** **todos** os campos têm `<label>` associado e os erros estão ligados por `aria-describedby`

**CA-A4 — Conteúdo sem JavaScript**
- **Dado** JavaScript desativado
- **Quando** se carrega qualquer página de conteúdo
- **Então** **todo** o conteúdo é visível e legível

**CA-A5 — Movimento reduzido**
- **Dado** `prefers-reduced-motion: reduce`
- **Quando** se navega no site
- **Então** o movimento decorativo não ocorre e nenhuma informação se perde

**CA-A6 — Um H1, idioma correto**
- **Dado** qualquer página
- **Quando** é analisada em CI
- **Então** tem exatamente um `<h1>` e `lang="es-ES"`; falhar **quebra o build**

## 17.12 Mobile

**CA-M1 — Reserva em ecrã pequeno**
- **Dado** um ecrã de 360 px de largura
- **Quando** o cliente completa uma reserva
- **Então** consegue fazê-lo sem deslocamento horizontal e com alvos de toque adequados

**CA-M2 — Sem duplicação de conteúdo**
- **Dado** qualquer página
- **Quando** se inspeciona o HTML gerado
- **Então** **nenhum** conteúdo aparece duplicado para variantes responsive

**CA-M3 — Painel de produção em telemóvel**
- **Dado** um operador com telemóvel no obrador
- **Quando** abre «Producción»
- **Então** lê os totais por produto e por ponto e marca lotes **sem zoom**

## 17.13 Qualidade de conteúdo

**CA-Q1 — Sem placeholders**
- **Dado** o site pronto a publicar
- **Quando** a verificação de CI corre
- **Então** não existe nenhum padrão de *placeholder* no HTML gerado; **encontrar um quebra o build**

**CA-Q2 — Produto incompleto não publica**
- **Dado** um produto sem preço, sem alergénios ou sem dias de produção
- **Quando** o administrador tenta publicá-lo
- **Então** a publicação é recusada, indicando **exatamente** o que falta

---

# 18. Decisões

## 18.0 Decisões aprovadas

Decisões já tomadas pelos responsáveis do FUERZA. **São regra do produto, não recomendações.** Não se reabrem durante a implementação.

| ID | Decisão | Regra | Secções afetadas | Data |
|---|---|---|---|---|
| **`DA-01`** | **Pagamento antecipado obrigatório** | O pagamento é sempre antecipado e online. A encomenda só é confirmada após o pagamento ser concluído com sucesso. **Não existe pagamento na recolha**, nem no obrador nem em pontos externos. Se o pagamento falhar, for abandonado ou expirar, a encomenda não é confirmada e a reserva temporária de stock é libertada | §1.4, §5.2, §5.3, §5.4, §5.9, §5.11, §5.14, §6.12, §10.1, §10.4, §10.5, §11.2, §11.3, §15 (3, 5, 14, 17, 19–21), §16.1, §17.5, §17.6, §17.10 | 2026-08-03 |
| **`DA-02`** | **Horário laboral do obrador: 09:00–18:00** | Horário geral de funcionamento do obrador principal (`Europe/Madrid`). **Não é a hora-limite de reserva** (`DP-02`, pendente) e **não se aplica a pontos externos**, que têm horário próprio | §1.4, §5.5, §6.1, §6.2.1, §6.3, §6.4 | 2026-08-03 |

## 18.1 Decisões pendentes

Todas as decisões que ainda exigem resposta dos responsáveis do FUERZA. **Não pode começar implementação das áreas marcadas como bloqueantes sem resposta.**

**Legenda de responsável:** `FUERZA` = responsáveis do obrador · `Fiscal/Jurídico` = assessoria do FUERZA · `Produto` = equipa de produto com validação do FUERZA

| ID | Decisão | Opções | Recomendação | Impacto | Responsável | Estado |
|---|---|---|---|---|---|---|
| **DP-01** | Segmentos de público | Confirmar ou corrigir os quatro de §1.3 | Validar com dados reais de balcão | Conteúdo e prioridades | FUERZA | Pendente |
| **DP-02** | **Hora-limite de reserva** | A: hora fixa na véspera · B: antecedência em horas · C: por produto | **A** | **Bloqueante** — condiciona calendário e produção. **Não resolvida por `DA-02`**: o horário laboral não é a hora de corte | FUERZA | **Pendente** |
| **DP-03** | Metas quantitativas dos objetivos | — | Definir após 3 meses de dados | Métricas | FUERZA | Pendente |
| **DP-04** | Entrega ao domicílio | Sim / não / mais tarde | **Não** nas fases 1–2 | Âmbito | FUERZA | Pendente |
| **DP-05** | Registo obrigatório antes de comprar | Obrigatório / opcional | **Opcional**, oferecido após a compra | **Bloqueante** — condiciona o checkout | Produto | Pendente |
| **DP-06** | Acesso de painel a responsáveis de ponto | Fase 1 / fase 2 / nunca | **Fase 2** | Âmbito do painel | Produto | Pendente |
| **DP-07** | Dados do cliente visíveis ao ponto externo | Nome só / nome+telefone | **Nome e código apenas** | Privacidade | FUERZA + Jurídico | Pendente |
| **DP-08** | Prazo de cancelamento pelo cliente | A: até à hora-limite · B: [n]h antes · C: sem cancelamento | **A** | **Bloqueante** — política publicada | FUERZA | Pendente |
| **DP-09** | Taxonomia comercial das famílias | Quantas e com que nomes | Começar com poucas | **Bloqueante** — estrutura do catálogo | FUERZA | Pendente |
| **DP-10** | Tolerância de peso a comunicar | Margem ou «aproximado» | «Peso aproximado» sem margem | Ficha de produto | FUERZA | Pendente |
| **DP-11** | Filtro por alergénios na fase 1 | Sim / fase 2 | **Fase 2** — declaração na ficha basta legalmente | Catálogo | Produto | Pendente |
| **DP-12** | Enquadramento de IVA por produto | — | — | **Bloqueante** — preços e faturação | Fiscal | Pendente |
| **DP-13** | **Todos os preços** | — | — | **Bloqueante** | FUERZA | Pendente |
| **DP-14** | Descontos e códigos promocionais | Fases 1/2/3 ou nunca | **Fora das fases 1 e 2** | Âmbito | FUERZA | Pendente |
| **DP-15** | Limite por omissão de data não configurada | Zero / ilimitado / valor | **Zero** | **Bloqueante** — disponibilidade | Produto | Pendente |
| **DP-16** | Limite de unidades por cliente e data | Sem limite / valor | Campo existe, sem limite por omissão | Disponibilidade | FUERZA | Pendente |
| **DP-17** | Dados mínimos para reservar | Nome+email / +telefone | **Nome, email, telefone**, com uso justificado | **Bloqueante** — checkout e RGPD | Produto + Jurídico | Pendente |
| **DP-19** | Duração da reserva temporária | 10 / 15 / 20 min | **15 min** | Concorrência de stock | Produto | Pendente |
| **DP-20** | Alteração de encomenda pelo cliente | Permitir / cancelar e refazer | **Cancelar e refazer** na fase 1 | Complexidade do checkout | Produto | Pendente |
| **DP-21** | Tolerância antes de marcar não recolhido | 30 min / 1 h / 2 h | **1 hora** | Estados | FUERZA | Pendente |
| **DP-22** | Política de não recolhido | A: sem reembolso · B: parcial · C: crédito | **A publicada**, generosidade caso a caso | **Bloqueante** — condições de venda | FUERZA | Pendente |
| **DP-23** | Limiar de sinalização de reincidência | Valor | 3 em 6 meses, como ponto de partida | Painel | FUERZA | Pendente |
| **DP-24** | Formato do código de recolha | `FZ-XXXX` ou outro | **`FZ-` + 4 alfanuméricos sem ambíguos** | Interface e operação | Produto | Pendente |
| **DP-25** | **Moradas, horários, dias, janelas e capacidades dos pontos** | — | — | **Bloqueante — nada é conhecido** | FUERZA | Pendente |
| **DP-26** | Pré-carregar feriados nacionais | Sim / não | **Sim, como sugestão editável** | Painel | Produto | Pendente |
| **DP-27** | Quem confirma a recolha | A: pessoal do ponto · B: cliente · C: automático | **A no obrador; papel nos pontos externos na fase 1** | Operação | FUERZA | Pendente |
| **DP-28** | **Modelo de subscrição** | A: frequência fixa · B: crédito mensal | **A** | **Bloqueante para a fase 2**; condiciona a arquitetura da fase 1 | FUERZA | Pendente |
| **DP-29** | Frequências oferecidas | Semanal / quinzenal / mensal / outras | Começar com **uma ou duas** | Fase 2 | FUERZA | Pendente |
| **DP-30** | Aviso prévio de renovação | 3 / 5 / 7 dias | **3 dias** | Fase 2 | FUERZA + Jurídico | Pendente |
| **DP-31** | Antecedência de geração do ciclo | Ciclo completo / semana a semana | **Ciclo completo** | Previsibilidade | Produto | Pendente |
| **DP-32** | Efeito de saltar uma entrega | A: sem efeito · B: desconto · C: estende o plano | **C** | Fase 2 | FUERZA | Pendente |
| **DP-33** | Limite de saltos por ciclo | Valor | — | Fase 2 | FUERZA | Pendente |
| **DP-34** | Duração máxima da pausa | Valor | Máximo definido, com retoma automática | Fase 2 | FUERZA | Pendente |
| **DP-35** | Efeito do cancelamento de plano | A: imediato com reembolso · B: fim do ciclo | **B** | Fase 2 | FUERZA | Pendente |
| **DP-36** | Política de recuperação de pagamento | N.º e intervalo de tentativas | Seguir o padrão do processador | Fase 2 | Produto | Pendente |
| **DP-37** | Aviso prévio de alteração de preço | 30 / 60 dias | **Mínimo 30 dias**, a validar | **Bloqueante para a fase 2** | Jurídico | Pendente |
| **DP-38** | Manter preço antigo a assinantes existentes | Sim / não | — | Fase 2 | FUERZA | Pendente |
| **DP-39** | Política de créditos não usados | Só aplicável se `DP-28` = B | Evitar escolhendo A | Fase 2 | FUERZA + Jurídico | Pendente |
| **DP-40** | Subscrições por cliente | Uma / várias | **Uma** na fase 2 | Fase 2 | Produto | Pendente |
| **DP-41** | Quantidade máxima por entrega | Valor | — | Fase 2 | FUERZA | Pendente |
| **DP-42** | Capacidade máxima de subscrições por ponto e data | Valor | **Necessária** — protege o obrador | Fase 2 | FUERZA | Pendente |
| **DP-43** | Faturação com dados fiscais | Sempre / nunca / opcional | **Opcional no checkout** | Checkout e conta | Fiscal | Pendente |
| **DP-44** | Prazos de conservação de dados | — | — | **Bloqueante** — RGPD e eliminação de conta | Jurídico | Pendente |
| **DP-45** | Analítica e cookies | Com consentimento / sem identificação | **Consentimento primeiro** | Privacidade | Jurídico | Pendente |
| **DP-46** | Segundo fator no painel | Obrigatório para admin / opcional | **Obrigatório para `Administrador`** | Segurança | Produto | Pendente |
| **DP-47** | Autorizar vs. capturar | A: captura imediata · B: autorização diferida | **A** | Pagamentos | Produto | Pendente |
| **DP-48** | Numeração e requisitos de faturação | — | — | **Bloqueante** — faturação | Fiscal | Pendente |
| **DP-49** | Direito de desistência em perecíveis | — | Provável exceção legal, **a confirmar** | **Bloqueante** — condições de venda | Jurídico | Pendente |
| **DP-50** | Canais além do email | SMS / WhatsApp / nenhum | **Fase 3** | Notificações | FUERZA | Pendente |
| **DP-51** | Momento do lembrete de recolha | Véspera à tarde / manhã do dia | Véspera | Notificações | FUERZA | Pendente |
| **DP-52** | Idiomas do site | Só es-ES / +asturiano / +inglês | **Só es-ES** na fase 1 | SEO e conteúdo | FUERZA | Pendente |
| **DP-53** | Necessidade de encarregado de proteção de dados | — | — | Conformidade | Jurídico | Pendente |
| **DP-54** | Duração da cache de disponibilidade | Valor | Curta, com invalidação | Performance | Produto | Pendente |
| **DP-55** | Retenção do registo de auditoria | Valor | — | Conformidade | Jurídico | Pendente |

## 18.2 Decisões bloqueantes da fase 1

Não é possível iniciar a implementação sem estas **onze**:

| ID | Decisão |
|---|---|
| **DP-02** | **Hora-limite de reserva** — a mais urgente das que restam |
| **DP-25** | Dados dos pontos de recolha |
| **DP-13** | Preços |
| **DP-12** | Enquadramento de IVA |
| **DP-09** | Taxonomia das famílias |
| **DP-08** | Prazo de cancelamento |
| **DP-22** | Política de não recolhido |
| **DP-17** | Dados mínimos do cliente |
| **DP-05** | Registo obrigatório ou opcional |
| **DP-44** | Prazos de conservação de dados |
| **DP-49** | Direito de desistência |

> Eram doze. **`DP-18` saiu da lista**: foi decidida e é agora `DA-01` (§18.0).

## 18.3 Decisão que condiciona a arquitetura da fase 1

**`DP-28` — modelo de subscrição.** Embora a subscrição pertença à fase 2, a escolha entre frequência fixa e crédito mensal muda o modelo de disponibilidade e de encomenda. **Deve ser respondida antes de começar a fase 1**, mesmo que a implementação fique para depois. É a única decisão de fase 2 com esta propriedade.

## 18.4 Estado das decisões

| | Contagem |
|---|---|
| Decisões aprovadas (`DA`) | **2** |
| Decisões pendentes (`DP`) | **54** |
| Das quais bloqueantes da fase 1 | 11 |
| Das quais dependentes de assessoria fiscal ou jurídica | 4 — `DP-12`, `DP-44`, `DP-48`, `DP-49` |

*Os identificadores `DP` não são renumerados quando uma decisão é aprovada. `DP-18` deixa de existir como pendente e passa a `DA-01`; a numeração dos restantes mantém-se estável para que referências externas ao documento não quebrem.*

---

## Próximos documentos

| Doc | Título | Dependências |
|---|---|---|
| **03** | Sistema de Design | Documento 01 §14–20 + estados e componentes deste documento |
| **04** | Arquitetura Técnica | `DA-01` (resolvida), `DP-28`, §14 e §15 deste documento |
| **05** | Conteúdo em es-ES | Documento 01 §21 + §12 deste documento |

---

*Nenhum preço, morada, horário, capacidade ou política comercial neste documento é real. Todos são variáveis à espera de decisão do FUERZA, identificadas em §18.*
