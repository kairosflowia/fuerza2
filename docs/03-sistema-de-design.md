# FUERZA — Sistema de Design

**Documento 03** · Sistema visual e de interface
Data: 3 de agosto de 2026
Estado: proposta para validação — sem código, sem componentes, sem páginas

**Fontes:**
[Documento 01 — Análise e Direção Criativa](01-analise-e-direcao-criativa.md) ·
[Documento 02 — PRD e Regras de Negócio](02-prd-e-regras-de-negocio.md) ·
Identidade visual em `/public`

---

## Nota de leitura

**Idioma.** Documento em português para a equipa. **Todo o texto visível ao cliente está em espanhol de Espanha (es-ES)** e aparece «entre aspas angulares» ou identificado como *rótulo visível*. O site é integralmente em es-ES.

**Contraste.** Todos os rácios neste documento foram **calculados**, não estimados. Cada par cor/fundo que proponho foi verificado contra WCAG 2.2 AA antes de entrar no sistema.

**Decisões herdadas do Documento 02** — já aprovadas, condicionam a interface:

| ID | Decisão | Consequência visual |
|---|---|---|
| `DA-01` | Pagamento sempre antecipado; encomenda só confirmada após pagamento; **sem pagamento na recolha** | O checkout termina no pagamento. Nenhum ecrã de recolha tem afordância de cobrança |
| `DA-02` | Horário do obrador 09:00–18:00 | Valor publicável. **Não é hora-limite de reserva** |
| `DP-02` | Hora-limite de reserva | **Pendente.** A interface reserva-lhe espaço; nunca a inventa |

**O que este documento não faz.** Não escreve código, não cria componentes, não define páginas implementáveis, não decide regras comerciais pendentes e não usa nenhuma biblioteca de UI como identidade visual pronta.

---

# 1. Princípios de design

Oito princípios. Quando dois colidirem, vence o de número mais baixo.

## 1.1 Artesanal, humano e próximo

A interface tem de parecer feita por pessoas, para pessoas. Ligeiras irregularidades, calor e imperfeição são qualidades, não defeitos. **O oposto do que evitamos é a perfeição fria de um produto de software.**

Teste: se um ecrã pudesse pertencer a qualquer *startup*, falhou.

## 1.2 Mobile first, a sério

Desenha-se a partir de 360 px. O ecrã grande é a adaptação, nunca o ponto de partida. Isto não é uma preferência técnica: é uma leitura de quem usa o produto — alguém a caminho do trabalho a reservar pão, e um padeiro a consultar a produção com o telemóvel na bancada.

**Proibida a duplicação de conteúdo no DOM** para variantes responsive — o defeito estrutural da referência (Documento 01 §6).

## 1.3 Simples para o cliente e para uma equipa pequena

A interface serve dois utilizadores com necessidades opostas: um cliente que usa o site uma vez por semana durante dois minutos, e um obrador que o usa todos os dias durante trinta segundos. **Ambos precisam de menos, não de mais.**

O objetivo 7 do Documento 02 — simplicidade operacional — tem poder de veto aqui como lá.

## 1.4 Acessível por construção

WCAG 2.2 AA não é uma revisão final; é uma restrição de partida. Cada token, cada componente e cada estado nasce já verificado. A referência falhava o contraste no texto corrido e no botão principal (Documento 01 §7): **falhas dessas não podem existir aqui, e a paleta FUERZA não obriga a nenhum compromisso para as evitar.**

## 1.5 Sem aparência de SaaS genérico

Nada de gradientes tecnológicos, *glassmorphism*, cartões flutuantes com sombras suaves, ou o aspeto por omissão de uma biblioteca de componentes. O FUERZA tem sistema gráfico próprio — usá-lo é a razão pela qual o site não se parecerá com nenhum outro (§23).

## 1.6 Sem excesso de efeitos

O movimento acompanha a leitura; nunca é a condição de acesso ao conteúdo. **Todo o conteúdo é visível sem JavaScript** (§19). Esta regra corrige diretamente o defeito mais grave da referência: conteúdo que nasce invisível e depende de JS para aparecer (Documento 01 §5).

## 1.7 Papel, tinta, ilustração e produto real

A metáfora material do sistema, e a decisão mais consequente de todo o documento:

> **O creme é papel. O preto é tinta. O terracota é a côdea e a ação.**

A página deve ler-se como material impresso — um cartaz, um saco, uma etiqueta — e não como uma interface. Daqui decorrem escolhas concretas: superfícies definidas por filete e não por elevação, sombras quase ausentes, cantos pouco arredondados, e ilustração antes de fotografia.

## 1.8 Disponibilidade e informação operacional sempre claras

O produto vende escassez real (Documento 02 §1.5). A interface tem de comunicar disponibilidade, datas, pontos e prazos com **precisão e sem ambiguidade**, e sempre com uma alternativa concreta quando a resposta é «não».

Uma mensagem de indisponibilidade que não diz *porquê* nem *o que fazer a seguir* é um defeito, não uma limitação.

---

# 2. Direção visual

## 2.1 O conceito

> ### «El pan que se levanta entre dos.»

O logótipo contém a ideia inteira: duas pessoas erguem, juntas, um pão maior do que elas. Fuerza não é a força de uma pessoa — é o que duas conseguem levantar. É o padeiro e o moleiro; é o obrador e o bairro.

A frase que separa esta marca da referência:

> **Casa de Panaderos fala do tempo. FUERZA fala das pessoas que esperam por ele.**

## 2.2 As sete aplicações do conceito

### 1. Pessoas como centro

O herói visual do FUERZA são as pessoas, não o pão. Onde a referência colocaria uma fotografia de produto, o FUERZA coloca figuras a trabalhar. O pão aparece — é o produto — mas quase nunca sozinho.

### 2. Ilustração como linguagem principal

O elenco de silhuetas planas é a camada de identidade primária. Está no hero, nos blocos de valores, nos estados vazios, nas confirmações e no rodapé. É o ativo que a referência não tem e não pode ter (Documento 01 §15).

### 3. Fotografia como apoio

A fotografia entra onde a ilustração não chega: mostrar o pão real, os rostos reais, o obrador real. **Nunca é a estrutura da página** — é o conteúdo dentro dela. Regra prática: numa página típica, a ilustração define a composição e a fotografia preenche-a (§8).

### 4. Creme como papel

`#F5F1E8` é o fundo dominante e quase omnipresente. Não há «modo escuro» na fase 1 (§3.8). Superfícies mais claras existem, mas de forma quase impercetível — a diferenciação faz-se por filete, não por luminosidade.

### 5. Preto como tinta

`#000000` puro para texto, ilustração e traço. **É a maior diferença visível face à referência**, que evita o preto e usa `#333333` e cinzentos (Documento 01 §23). A três metros de distância, é isto que distingue as duas marcas.

### 6. Terracota como ação e produto

`#E4572E` aparece em dois sítios e só nesses: **onde há côdea** (o pão nas ilustrações) e **onde há ação** (o botão principal). Esta dupla função é intencional — ensina o utilizador que terracota significa «isto é o pão» e «isto faz avançar».

### 7. Cores secundárias como classificação

Amarelo, verde e azul **não decoram: classificam.** Cada família de produto tem a sua cor (§3.6). O utilizador aprende o código em dois ecrãs e passa a orientar-se por ele. É uma decisão gráfica que se torna ferramenta de navegação — e uma assinatura cromática que a referência não pode ter, porque estas três cores não existem no seu universo.

## 2.3 O que a marca nunca deve parecer

Industrial · apressada · luxuosa · minimalista-fria · corporativa · grande.

---

# 3. Paleta e tokens de cor

## 3.1 Paleta de marca

Extraída da folha de identidade (Documento 01 §14). **Não é alterável.**

| Cor | Hex | Papel |
|---|---|---|
| Creme | `#F5F1E8` | Fundo dominante — o papel |
| Preto | `#000000` | Tinta: tipografia, ilustração, traço |
| Terracota | `#E4572E` | Côdea e ação |
| Amarelo | `#F2C14E` | Classificação |
| Verde | `#2E7D67` | Classificação |
| Azul | `#4C78A8` | Classificação |

> A folha de identidade escreve o terracota como `#E4S72E`. É gralha; o valor correto é **`#E4572E`** (Documento 01 §14).

## 3.2 Extensão funcional da paleta

**Declaração honesta:** a paleta de marca tem seis cores e a interface precisa de comunicar sucesso, aviso, erro e informação com contraste suficiente para texto. Três das cores de marca não o conseguem — verde (4,39:1), azul (4,09:1) e amarelo (1,49:1) falham AA sobre creme para texto normal.

**Solução:** cada cor funcional é uma **variante escurecida da cor de marca correspondente**, não uma cor nova. Mantém-se a família cromática e ganha-se legibilidade. A única exceção é o erro, que trato a seguir.

| Token funcional | Hex | Deriva de | Sobre creme | Branco sobre ela |
|---|---|---|---|---|
| `--success` | `#276A57` | Verde `#2E7D67` | **5,67:1** ✓ | 6,39:1 ✓ |
| `--info` | `#3C6086` | Azul `#4C78A8` | **5,80:1** ✓ | 6,54:1 ✓ |
| `--warning` | `#8F6717` | Amarelo `#F2C14E` | **4,52:1** ✓ | — |
| `--error` | `#A32E17` | *(ver abaixo)* | **6,29:1** ✓ | 7,09:1 ✓ |

**Porque é que o erro não usa terracota.** Seria a escolha óbvia — é a cor quente da paleta — e seria um erro grave: **terracota é a cor da ação principal.** Se o botão «Continuar al pago» e a mensagem de erro forem da mesma cor, o utilizador deixa de conseguir distinguir «avançar» de «algo correu mal». `--error` é por isso um vermelho-tijolo mais profundo e dessaturado, claramente distinto de `#E4572E` mas da mesma família térmica.

## 3.3 Tokens semânticos

**Regra de utilização:** os componentes usam **sempre** o token semântico, nunca o valor bruto. Trocar a paleta deve ser possível num só ficheiro.

### Superfícies

| Token | Hex | Uso | Nota |
|---|---|---|---|
| `--bg` | `#F5F1E8` | Fundo dominante | O papel |
| `--surface` | `#FAF8F2` | Cartões, painéis | Contraste com `--bg`: 1,06:1 — **deliberadamente quase invisível** |
| `--surface-sunken` | `#EDE8DC` | Zonas recuadas, cabeçalhos de tabela | Preto por cima: 17,18:1 |
| `--surface-inverse` | `#000000` | Rodapé, faixas de destaque | Creme por cima: 18,63:1 |

> **Decisão estruturante.** `--surface` distingue-se de `--bg` por **1,06:1** — praticamente nada. Isto é intencional: **os cartões são definidos por um filete, não por elevação nem por preenchimento.** É a diferença entre uma página impressa e uma interface de software, e é o que impede o sistema de cair no aspeto de cartões flutuantes que §23 proíbe.

### Texto

| Token | Hex | Sobre `--bg` | Uso |
|---|---|---|---|
| `--text` | `#000000` | **18,63:1** | Texto corrido e títulos |
| `--text-muted` | `#5A5750` | **6,39:1** | Metadados, legendas, texto de apoio |
| `--text-inverse` | `#F5F1E8` | 18,63:1 sobre preto | Texto em superfícies escuras |
| `--text-disabled` | `#8A8271` | 3,38:1 | **Só em controlos desativados** — ver §3.7 |

> `--text-muted` é um **cinzento quente**, não o cinzento frio `#7A7A7A` da referência, que falhava AA a 3,95:1 (Documento 01 §7). A 6,39:1, este passa com folga e mantém-se na temperatura do papel.

### Contornos

| Token | Hex | Sobre `--bg` | Uso |
|---|---|---|---|
| `--border` | `#CFC8B6` | 1,48:1 | Filete decorativo — separadores, contorno de cartão |
| `--border-strong` | `#8A8271` | **3,38:1** | **Limite de componente de interface** — campos, seletores, botões secundários. Cumpre o mínimo de 3:1 da WCAG 1.4.11 |

**Regra:** todo o contorno que **define um controlo interativo** usa `--border-strong`. `--border` é para divisões visuais sem função.

### Ações

| Token | Fundo | Texto | Rácio | Nota |
|---|---|---|---|---|
| `--action-primary` | `#E4572E` | `#000000` | **5,70:1** ✓ | **Texto preto, nunca branco** |
| `--action-primary-hover` | `#D64E27` | `#000000` | 4,98:1 ✓ | |
| `--action-primary-active` | `#CF4923` | `#000000` | 4,63:1 ✓ | Limite inferior aceitável |
| `--action-secondary` | transparente | `#000000` | 18,63:1 ✓ | Contorno `--border-strong` |
| `--action-secondary-hover` | `#EDE8DC` | `#000000` | 17,18:1 ✓ | |
| `--action-text` | — | `#000000` | 18,63:1 ✓ | Sublinhado permanente |
| `--action-destructive` | transparente | `#A32E17` | 6,29:1 ✓ | Contorno na mesma cor |

> **Branco sobre terracota é proibido em todo o sistema** — 3,68:1, falha AA. É exatamente o defeito do botão principal da referência (3,94:1, Documento 01 §7). Copiá-lo seria importar um erro conhecido. Ver §23.
>
> A boa notícia continua a ser dupla: preto sobre terracota é **a escolha acessível e a mais fiel à marca**, porque o logótipo já usa preto puro como tinta dominante.

### Estados do sistema

Cada estado tem três tokens: superfície suave, contorno/ícone, e texto. **O texto sobre superfícies suaves é sempre `--text` preto** — máxima legibilidade e coerência com o princípio da tinta.

| Estado | Superfície | Acento | Texto | Preto sobre superfície |
|---|---|---|---|---|
| `--success-*` | `#E3EDE9` | `#276A57` | `#000000` | 17,56:1 ✓ |
| `--warning-*` | `#FBEFD2` | `#8F6717` | `#000000` | 18,38:1 ✓ |
| `--error-*` | `#F6E2DC` | `#A32E17` | `#000000` | 16,83:1 ✓ |
| `--info-*` | `#E4EAF1` | `#3C6086` | `#000000` | 17,34:1 ✓ |

### Foco

| Token | Hex | Uso |
|---|---|---|
| `--focus` | `#000000` | Anel de foco em superfícies claras |
| `--focus-inverse` | `#F5F1E8` | Anel de foco em superfícies escuras |
| `--focus-offset` | `#F5F1E8` | Halo entre o elemento e o anel |

**Especificação do anel:** 2 px sólidos + 2 px de afastamento. Nunca removido, nunca substituído por sombra difusa. Visível sobre creme (18,63:1), sobre terracota (5,70:1) e sobre superfícies suaves de estado (≥16,8:1).

### Desativado

| Token | Hex | Nota |
|---|---|---|
| `--disabled-surface` | `#EDE8DC` | |
| `--disabled-text` | `#8A8271` | 3,38:1 — abaixo de AA **por desenho** |
| `--disabled-border` | `#CFC8B6` | |

> A WCAG isenta controlos desativados dos requisitos de contraste. Mesmo assim: **o desativado nunca é o único sinal.** Um controlo desativado traz sempre `aria-disabled` e uma explicação em texto legível ao lado (§20.9). O utilizador tem de saber *porquê*, não apenas que não pode.

## 3.4 Tokens de disponibilidade

Os tokens que servem o princípio 1.8 e as regras do Documento 02 §5.7 e §11.

| Token | Superfície | Acento | Texto | *Rótulo visível* |
|---|---|---|---|---|
| `--stock-available` | `#E3EDE9` | `#276A57` | `#000000` | «Disponible» |
| `--stock-low` | `#FBEFD2` | `#8F6717` | `#000000` | «Quedan pocos» |
| `--stock-soldout` | `#EDE8DC` | `#5A5750` | `#000000` | «Agotado» |
| `--stock-unavailable` | `#EDE8DC` | `#8A8271` | `#5A5750` | «No disponible» |
| `--subscription` | `#E4EAF1` | `#3C6086` | `#000000` | «Incluido en tu plan» |

**Esgotado é neutro, não vermelho.** Esgotar não é um erro nem culpa de ninguém — é o funcionamento normal de um obrador com produção limitada. Pintá-lo de vermelho contradiria a mensagem da marca, que trata a escassez como facto e não como falha (Documento 02 §1.5).

**`--subscription` usa azul** — a cor que o Documento 01 §18 já atribui a subscrições. Coerência entre classificação de produto e classificação de estado.

## 3.5 Uso do terracota — regras precisas

| Uso | Permitido | Rácio |
|---|:--:|---|
| Fundo de botão principal com texto preto | ✓ | 5,70:1 |
| Título grande (≥ 24 px, ou ≥ 18,7 px a negrito) sobre creme | ✓ | 3,27:1 — cumpre o mínimo de 3:1 para texto grande |
| Ícones e elementos gráficos sobre creme | ✓ | 3,27:1 — cumpre o mínimo de 3:1 para componentes |
| O pão nas ilustrações | ✓ | Decorativo |
| **Texto corrido sobre creme** | ✗ | 3,27:1 — **falha AA** |
| **Texto branco sobre terracota** | ✗ | 3,68:1 — **falha AA** |

**Quando for mesmo necessário terracota em texto de tamanho normal**, usa-se `--accent-text` = `#B03D1B` (5,28:1 sobre creme). É a mesma cor, escurecida o suficiente para ler.

## 3.6 Cores de classificação de família

Do Documento 01 §18. **Reafirma-se o que o Documento 02 §4.1 estabelece: é classificação visual, não regra comercial.** A cor não determina preço, disponibilidade nem comportamento do sistema.

| Cor | Família (exemplo) | Uso na interface |
|---|---|---|
| Terracota `#E4572E` | Panes de masa madre | Filete de topo do cartão, filtro ativo, marcador de categoria |
| Amarelo `#F2C14E` | Bollería y dulces | idem |
| Verde `#2E7D67` | Edición limitada | idem |
| Azul `#4C78A8` | Café y despensa | idem |

**Regras de aplicação:**

1. A cor aparece como **filete** (2–3 px) ou como **ponto marcador**, nunca como preenchimento de cartão. Cartões coloridos matam o efeito de papel.
2. A cor **nunca é o único identificador** da família. Aparece sempre acompanhada do nome da família em texto (§20.9).
3. A taxonomia real das famílias é **`DP-09`, pendente**. As designações acima são exemplos, não decisões.

## 3.7 Regra transversal — cor nunca é o único sinal

Requisito WCAG 1.4.1 e princípio de desenho do sistema. Aplica-se a: estados de stock, famílias de produto, estados de encomenda, validação de formulários, estados de data no calendário e estados do painel.

**Todo o estado comunicado por cor traz simultaneamente:** um rótulo em texto, e — onde o espaço o permita — uma forma ou ícone distintivo.

## 3.8 Modo escuro

**Fora de âmbito nas fases 1 e 2.** A metáfora da marca é papel impresso; um modo escuro seria uma segunda identidade a manter, com um custo desproporcionado para o benefício.

Mitigação: o sistema respeita as preferências de contraste e de movimento do utilizador, e a paleta clara já cumpre AA com larga margem no texto corrido (18,63:1).

---

# 4. Tipografia

## 4.1 O que a marca pede

Da folha de identidade (Documento 01 §13):

> *«Tipografía principal: estilo hecho a mano. Secundaria: limpia, simple y legible.»*

E há um dado que condiciona a escolha: **as duas imagens da marca mostram dois wordmarks diferentes** — uma serifa de alto contraste no logótipo, uma sem-serifa geométrica muito espacejada na folha (Documento 01 §12).

**Clarificação necessária, e que evita uma escolha errada:** o wordmark FUERZA é um **logótipo desenhado, entregue como SVG**. Não é composto numa fonte web. A tipografia do site não tem, portanto, de *reproduzir* o wordmark — tem de ser **compatível** com ele. Isto liberta a escolha do display de uma restrição que não existe.

## 4.2 Comparação das cinco candidatas

| Família | Classe | A favor | Contra | Papel |
|---|---|---|---|---|
| **Fraunces** | Serifa variável | Eixos `SOFT` e `WONK` produzem irregularidade deliberada — a tradução tipográfica direta de *«hecho a mano»*. Amplitude total de pesos e tamanhos óticos. Compatível com o wordmark serifado | Usada com frequência em marcas artesanais; exige afinação dos eixos para não soar genérica | **Display — recomendada** |
| **Instrument Serif** | Serifa display | Alto contraste, muito próxima da variante serifada do wordmark. Elegante | **Um só peso**, sem itálico útil, desenhada só para tamanhos grandes. Não sustenta preços, tabelas nem UI | Alternativa apenas para o hero |
| **Bricolage Grotesque** | Grotesca variável | Irregularidades deliberadas; eixos de largura e tamanho ótico. Corresponde ao wordmark sem-serifa | Sendo sem-serifa, colide com a secundária: duas sans no mesmo sistema reduzem o contraste tipográfico | Alternativa se a marca preferir sem-serifa |
| **Inter** | Sem-serifa neutra | Legibilidade excecional em ecrã. **Algarismos tabulares** — decisivo para preços, quantidades e o painel de produção. Variável, cobertura ampla | Neutra ao ponto da invisibilidade — mas é isso que se pretende | **Corpo — recomendada** |
| **Public Sans** | Sem-serifa neutra | Sólida, licença aberta, boa legibilidade | Sem o refinamento ótico do Inter; algarismos menos versáteis | Alternativa ao Inter |

## 4.3 Combinação recomendada

> ## **Fraunces** (display) + **Inter** (corpo)

**Fundamentação.**

**Fraunces para display**, porque o eixo `WONK` faz exatamente aquilo que a marca pede em palavras: introduz irregularidade controlada, o equivalente tipográfico do traço de recorte manual das ilustrações. Sendo variável, uma só descarga cobre toda a escala de pesos — resolvendo o desperdício da referência, que servia quatro famílias para usar duas (Documento 01 §4). E é uma serifa, o que dá contraste real com a secundária.

**Inter para corpo**, sobretudo por uma razão pouco glamorosa e muito importante: **algarismos tabulares**. Este produto está cheio de números que têm de alinhar — preços no catálogo, quantidades no seletor, gramas na ficha, e a tabela de produção que o obrador imprime todos os dias. Uma fonte sem algarismos tabulares transforma essa tabela numa coluna torta.

**Risco assumido, declarado com honestidade.** Fraunces é uma escolha popular em marcas artesanais e, mal afinada, pode soar a fórmula. A mitigação é usar os eixos com intenção — `WONK` ativo, `SOFT` moderado, e um peso alto reservado para os títulos maiores — e nunca em pesos intermédios inexpressivos. Deve ser validada com uma prova impressa e com o teste de §24.9.

**Configuração de partida a testar:** `Fraunces` com `WONK 1`, `SOFT 30–50`, ótico ajustado ao tamanho.

## 4.4 Requisitos técnicos

- **Duas famílias, no máximo.** Ambas variáveis, ambas efetivamente usadas.
- **Auto-alojadas**, subconjunto latino + `latin-ext` (necessário para `ñ`, acentos e `·`).
- `font-display: swap`; pré-carregamento apenas da fonte do primeiro título visível.
- Orçamento tipográfico total: **≤ 120 KB**, dentro do limite de 200 KB do caminho crítico (Documento 01, Prioridade 4).

## 4.5 Escala tipográfica

Escala fluida entre o mínimo (360 px de viewport) e o máximo (1280 px). Interpolação contínua — **sem saltos por breakpoint**.

| Nível | Mín. | Máx. | Família | Peso | Altura de linha | Uso |
|---|---:|---:|---|---|---|---|
| `display` | 40 | 88 | Fraunces | 700 | 1,02 | Hero da home. Uma vez por página, no máximo |
| `h1` | 32 | 56 | Fraunces | 700 | 1,08 | Título de página |
| `h2` | 26 | 40 | Fraunces | 600 | 1,15 | Título de secção |
| `h3` | 21 | 28 | Fraunces | 600 | 1,25 | Título de bloco, nome de produto na ficha |
| `h4` | 18 | 21 | Inter | 600 | 1,35 | Nome de produto no cartão, subtítulos |
| `body-lg` | 17 | 19 | Inter | 400 | 1,65 | Entradas de secção, descrições longas |
| `body` | 16 | 17 | Inter | 400 | 1,60 | Texto corrido |
| `body-sm` | 14 | 15 | Inter | 400 | 1,55 | Metadados, ajuda, legendas |
| `caption` | 12 | 13 | Inter | 500 | 1,45 | Notas de rodapé, microcópia |
| `label` | 12 | 13 | Inter | 600 | 1,3 | Etiquetas em maiúsculas, *eyebrows*, navegação |
| `price` | 18 | 24 | Inter | 600 | 1,2 | Preços — **algarismos tabulares** |
| `price-sm` | 15 | 16 | Inter | 600 | 1,2 | Preços em contexto secundário |
| `numeric` | 14 | 16 | Inter | 500 | 1,4 | Quantidades, tabelas do painel — **tabulares** |

**Mínimo absoluto: 12 px.** Nada no site é menor. Não existe «letra pequena».

## 4.6 Espaçamento entre letras

| Contexto | Valor | Razão |
|---|---|---|
| `display`, `h1` | −0,02 em | Títulos grandes precisam de aperto ótico |
| `h2`, `h3` | −0,01 em | |
| Corpo | 0 | |
| **`label` e *eyebrows* em maiúsculas** | **+0,14 em** | **Traço de marca — ver abaixo** |
| Navegação | +0,08 em | |
| Wordmark em texto | +0,22 em | Só quando «FUERZA» aparece como palavra composta |

> **O espacejamento largo em maiúsculas é o traço tipográfico distintivo da marca** — «F U E R Z A», «ASTURIAS · ESPAÑA», «OBRADOR DE MASA MADRE». Deve migrar para o site em etiquetas, *eyebrows* e navegação, porque produz uma textura de página imediatamente distinta da referência, que usa maiúsculas condensadas e pesadas (Documento 01 §23).
>
> **Nunca em texto corrido**, onde destrói a legibilidade e a velocidade de leitura.

## 4.7 Regras por contexto

**Títulos.** Fraunces. Equilíbrio de quebra de linha ativo. Máximo de 20 palavras em `h1`. Nunca em maiúsculas totais acima de `h3` — Fraunces em versaletes grandes torna-se difícil de ler.

**Corpo.** Inter regular. **Medida máxima de 68 caracteres** — regra rígida. Nunca justificado; alinhado à esquerda sempre, incluindo em pt e es.

**Etiquetas.** Inter 600, maiúsculas, +0,14 em. Curtas: uma a três palavras. Usadas para *eyebrows* de secção, estados e classificações.

**Preços.** Inter 600 com algarismos tabulares. Formato es-ES: **`12,50 €`** — vírgula decimal, espaço fino antes do símbolo, símbolo depois do número. Nunca `€12.50`.

**Navegação.** Inter 600, 14–15 px, +0,08 em. Maiúsculas apenas na navegação principal; sentença nas restantes.

**Números operacionais** (painel, quantidades, gramas). Tabulares sempre. Unidades em `body-sm` `--text-muted` a seguir ao número, nunca do mesmo tamanho.

---

# 5. Espaçamento e layout

## 5.1 Escala de espaçamento

Base de **4 px**. Progressão que acelera nos valores altos, para separar blocos de conteúdo de forma decisiva.

| Token | px | Uso típico |
|---|---:|---|
| `space-1` | 4 | Separação mínima entre elementos coladas |
| `space-2` | 8 | Ícone ↔ texto |
| `space-3` | 12 | Interior de controlos pequenos |
| `space-4` | 16 | Interior de controlos, separação de campos |
| `space-5` | 24 | Interior de cartão, entre parágrafos |
| `space-6` | 32 | Entre elementos de um bloco |
| `space-7` | 48 | Entre blocos relacionados |
| `space-8` | 64 | Entre sub-secções |
| `space-9` | 96 | Entre secções (mobile) |
| `space-10` | 128 | Entre secções (desktop) |
| `space-11` | 176 | Respiro maior, transições narrativas |

**Regra de uso:** só valores da escala. Nenhum espaçamento arbitrário em nenhum componente.

## 5.2 Ritmo vertical

O ritmo é o instrumento narrativo da página — a correção direta ao problema identificado no Documento 01 §5, em que as secções da referência se leem como «slides empilhados».

| Tipo de secção | Espaço vertical (mobile → desktop) |
|---|---|
| Hero | 64 → 112 px |
| Secção normal | 96 → 128 px |
| Secção densa (catálogo, painel) | 64 → 80 px |
| Transição narrativa (antes de um bloco-chave) | 128 → 176 px |
| Interior de bloco | 32 → 48 px |

**Regra de alternância.** Secções consecutivas nunca repetem a mesma altura nem a mesma estrutura de colunas. A monotonia de ritmo é o que faz uma página parecer um template (§23).

## 5.3 Larguras de conteúdo

| Token | Máx. | Uso |
|---|---:|---|
| `measure` | 68 ch (~640 px) | Texto corrido — limite de legibilidade |
| `content` | 1200 px | Largura por omissão das secções |
| `wide` | 1400 px | Catálogo, painel, galerias |
| `full` | — | Faixas de cor, padrão, imagens de largura total |

## 5.4 Margens laterais

| Viewport | Margem |
|---|---:|
| 360–479 | 20 px |
| 480–767 | 24 px |
| 768–1023 | 32 px |
| 1024–1279 | 48 px |
| ≥ 1280 | 64 px, com o conteúdo centrado até `content`/`wide` |

## 5.5 Breakpoints

**Mobile first — todos por largura mínima.**

| Nome | A partir de | Mudança principal |
|---|---:|---|
| `base` | 0 | Uma coluna |
| `sm` | 480 | Cartões em 2 colunas; botões deixam de ser de largura total |
| `md` | 768 | Navegação horizontal substitui o menu; layouts divididos |
| `lg` | 1024 | Catálogo em 3 colunas; painel em 2 painéis |
| `xl` | 1280 | Larguras máximas atingidas; margens estabilizam |

> A referência é *desktop-first* com quatro breakpoints por largura máxima e conteúdo duplicado por variante (Documento 01 §6). Este sistema é o oposto: mínimo, ascendente, **sem duplicação**.

## 5.6 Grelhas

| Contexto | base | sm | md | lg |
|---|:--:|:--:|:--:|:--:|
| Catálogo de produtos | 1 | 2 | 2 | 3 |
| Valores da marca | 1 | 2 | 2 | 4 |
| Pontos de recolha | 1 | 1 | 2 | 2 |
| Blocos divididos (texto + imagem) | 1 | 1 | 2 | 2 |
| Painel — produção | 1 | 1 | 1 | 2 |

**Nunca três colunas iguais em todas as secções.** É o anti-padrão mais visível e está explicitamente proibido em §23. A alternância entre 2, 3 e 4 colunas — e entre grelhas simétricas e assimétricas — é o que dá carácter à página.

**Grelha assimétrica preferida em blocos divididos:** 5/7 ou 7/5, nunca 6/6. A simetria perfeita lê-se como template.

## 5.7 Densidade de cartões

| Contexto | Interior | Espaço entre |
|---|---:|---:|
| Cartão de produto (catálogo) | 20 px | 20 → 32 px |
| Cartão de ponto de recolha | 24 px | 16 → 24 px |
| Cartão de subscrição | 24 → 32 px | 24 px |
| Linha do painel | 12 px vertical | 0 — separadas por filete |
| Resumo de encomenda | 20 px | 16 px |

**O painel é deliberadamente mais denso** que o site público. São contextos com objetivos opostos: o site convida a ler, o painel exige ver muito de uma vez.

## 5.8 Comportamento responsive

Regras invioláveis:

1. **Uma marcação, vários layouts.** Zero duplicação de conteúdo no DOM.
2. **Sem deslocamento horizontal** em nenhuma largura a partir de 320 px.
3. **Tabelas largas** (painel, resumo de encomenda) deslocam-se dentro do seu próprio contentor, nunca arrastam a página.
4. **Ordem de leitura estável.** O que reordena visualmente em desktop mantém uma ordem lógica no DOM; nada muda de significado ao mudar de tamanho.
5. **A imagem mais pesada** de cada página tem prioridade de carregamento declarada; todas as outras carregam de forma diferida.

## 5.9 Áreas seguras para elementos ilustrados

As ilustrações são silhuetas com formas irregulares — pernas, braços erguidos, espigas — e cortam mal se forem tratadas como imagens retangulares.

| Regra | Especificação |
|---|---|
| **Margem de respiro** | Mínimo `space-5` (24 px) livre à volta de qualquer figura. Nada de texto encostado |
| **Nunca cortar figuras humanas** | Uma personagem aparece inteira ou não aparece. Cortar uma figura pela cintura destrói a leitura de silhueta |
| **Corte permitido** | Apenas em elementos abstratos — padrão e espigas — e sempre pela margem da página, nunca a meio do conteúdo |
| **Sobreposição a texto** | Proibida. As figuras convivem com texto lado a lado, nunca por baixo |
| **Altura mínima** | 64 px para figuras de corpo inteiro; abaixo disso a silhueta deixa de ser legível — usar a espiga ou o pão |
| **Zona de proteção do wordmark** | Igual à altura da letra «F» em todos os lados |
| **Ponto de ancoragem** | As figuras assentam numa linha de base implícita partilhada com o texto adjacente. Figuras a «flutuar» sem referência parecem coladas |

---

# 6. Formas e superfícies

Secção onde o princípio 1.7 (papel e tinta) se torna mais concreto — e onde o sistema mais claramente se afasta do aspeto de software genérico.

## 6.1 Raio de canto

Cantos **pouco arredondados**. Papel cortado tem cantos vivos; interfaces de software têm cantos moles.

| Token | px | Uso |
|---|---:|---|
| `radius-0` | 0 | Filetes, divisórias, faixas de largura total, padrão |
| `radius-1` | 2 | Etiquetas, marcadores, campos |
| `radius-2` | 4 | Botões, cartões, superfícies |
| `radius-3` | 8 | Modais, painéis grandes |
| `radius-full` | 50% | **Exclusivamente** para elementos circulares reais — avatares, ponto marcador de família |

> **Não existe raio de cápsula.** A referência usa `border-radius: 150px` em botões e etiquetas (Documento 01 §4). É a forma mais reconhecível do seu sistema e, adotá-la, seria a semelhança mais imediata. **O botão do FUERZA é quase reto** — 4 px. É uma diferença pequena em número e muito grande em leitura.

## 6.2 Filetes e bordas

O filete é o instrumento principal de separação do sistema — substitui a sombra.

| Espessura | Cor | Uso |
|---|---|---|
| 1 px | `--border` | Separação entre blocos, contorno de cartão |
| 1 px | `--border-strong` | Contorno de controlo interativo (mínimo 3:1) |
| 2 px | `--text` | Ênfase: cartão em destaque, estado selecionado |
| 2–3 px | Cor de família | Filete de topo do cartão de produto |
| 3 px | `--text` | Divisória de secção maior, aspeto tipográfico de impressão |

**Filete duplo** — duas linhas de 1 px separadas por 3 px — permitido como recurso decorativo de impressão, no rodapé e em separadores de secção. É um gesto de tipografia clássica e ajuda a estabelecer a leitura de material impresso.

## 6.3 Sombras

**Quase inexistentes.** Papel não flutua.

| Token | Uso | Especificação |
|---|---|---|
| `shadow-none` | **Por omissão em tudo** | — |
| `shadow-overlay` | **Só** em modais e gavetas | Sombra ampla e muito subtil, para separar do fundo |

**Proibido:** sombra em cartões, em botões, em estado *hover*, em campos de formulário e em cabeçalhos fixos. **A elevação não é o vocabulário deste sistema.** A profundidade, quando é necessária, faz-se por filete, por espaço ou por inversão de cor.

## 6.4 Cartões

| Aspeto | Especificação |
|---|---|
| Fundo | `--surface` — quase igual ao fundo, deliberadamente (§3.3) |
| Contorno | 1 px `--border` |
| Raio | `radius-2` (4 px) |
| Sombra | Nenhuma |
| Interior | §5.7 |
| *Hover* | Contorno passa a `--text` (1 px → 2 px, sem deslocação de layout). **Sem elevação, sem deslocamento, sem escala** |
| Selecionado | Contorno 2 px `--text` + marcador visível |

**O cartão de produto acrescenta** um filete de 2–3 px na cor da família, no topo. É o único uso cromático forte do cartão.

## 6.5 Etiquetas

Blocos pequenos que comunicam estado ou classificação.

| Aspeto | Especificação |
|---|---|
| Tipografia | `label` — Inter 600, maiúsculas, +0,14 em |
| Interior | 4 px vertical, 8 px horizontal |
| Raio | `radius-1` (2 px) |
| Variante suave | Superfície de estado + texto preto (§3.3) |
| Variante contornada | Fundo transparente + 1 px de contorno + texto na cor do acento |
| Variante sólida | Só em terracota e amarelo, ambas com **texto preto** |

Toda a etiqueta traz texto. **Nunca existe uma etiqueta só de cor.**

## 6.6 Superfícies com aparência de papel

Recursos que reforçam a metáfora material, todos de custo próximo de zero:

| Recurso | Aplicação |
|---|---|
| **Filete de topo e base** | Secções em `--surface-sunken` delimitadas por filete em cima e em baixo, como um caderno de impressão |
| **Faixa invertida** | Blocos em `--surface-inverse` (preto) com texto creme — usados com parcimónia, dois a três por página no máximo |
| **Margem de impressão** | Nas páginas institucionais, um filete vertical fino junto à margem, evocando a marca de guilhotina |
| **Numeração tipográfica** | Passos numerados com algarismos grandes em Fraunces, à maneira de um cartaz — herda a clareza do `01/02/03` da referência (Documento 01 §3) sem herdar a sua forma |

## 6.7 Texturas

**Uma textura, subtil, e opcional.**

- Grão de papel muito ligeiro sobre `--bg`, no máximo a 3% de opacidade.
- Implementado como camada única, leve, e **desativável**.
- **Nunca sobre texto** nem sobre superfícies de formulário — reduz a legibilidade e prejudica a nitidez em ecrãs de baixa densidade.
- Verificação obrigatória: com e sem textura, o contraste medido tem de manter-se acima de AA.

**Decisão pendente de design (não comercial):** a textura entra na fase 1 ou fica para depois? **Recomendação: prototipar, medir, e só incluir se não custar nada em desempenho nem em legibilidade.** É um refinamento, não um requisito.

## 6.8 Uso do padrão gráfico

O padrão — repetição dispersa de personagens, pães e espigas — é o elemento mais forte e mais fácil de estragar do sistema. **Em toda a superfície, cansa e transforma-se em papel de parede.**

**Três usos permitidos, e apenas três** (do Documento 01 §18):

| Onde | Como |
|---|---|
| Fundo do rodapé | Densidade baixa, `--border` sobre `--surface-inverse` ou creme muito suave |
| Faixa de confirmação de encomenda | Momento de celebração — o único sítio onde pode ganhar presença |
| Cabeçalho de páginas secundárias | Faixa fina, muito discreta |

**Proibido:** fundo de secções de conteúdo, fundo de cartões, atrás de texto corrido, e no painel do obrador.

**Regra de contraste:** onde houver texto sobre padrão, o contraste é medido **contra o ponto mais desfavorável do padrão**, não contra a cor média.

---

# 7. Iconografia e ilustrações

## 7.1 Bloqueio a resolver primeiro

> **Os ficheiros vetoriais originais das ilustrações são um pré-requisito, não um detalhe de produção.**

As ilustrações existem apenas dentro de dois JPEG comprimidos. **Recortes desse JPEG não podem ser usados como ativos finais** — dariam contornos sujos, sem transparência, impossíveis de recolorir e impossíveis de animar, num sistema em que a ilustração é a camada de identidade primária.

**Necessário:** SVG, AI ou EPS de cada figura, do pão, da espiga e do pássaro. Enquanto não existirem, o desenvolvimento pode avançar com marcadores de posição — mas **não pode ser lançado**.

## 7.2 O elenco e o seu posto

Cada personagem tem uma função, não é intermutável (Documento 01 §18):

| Personagem | Onde | Papel |
|---|---|---|
| Mulher com travessa | Bloco «Tradición» | Informativa |
| Homem de chapéu com espigas | «Ingredientes» / origem das farinhas | Informativa |
| Mulher de avental com baguete | «Tiempo» / cronologia de fermentação | Informativa |
| Padeiro com pá de forno | «Comunidad» / equipa | Informativa |
| Figura a caminhar com pão | Fluxo de reserva e recolha | Informativa |
| As duas figuras a erguer o pão | Hero, confirmação de encomenda | **Marca** |

## 7.3 Espiga, pão e pássaro

**Espiga** — o elemento mais versátil, porque é abstrato.

| Uso | Tamanho |
|---|---|
| Divisória entre secções | 24–32 px, centrada, `--text` |
| Marca de canto em cartões de destaque | 16–20 px |
| Marcador de item em listas de marca | 12–16 px |
| Elemento do padrão | Variável |

**Pão** — o único objeto da identidade com cor (terracota).

- Marcador de família «panes»; indicador de quantidade em estados de disponibilidade; elemento do padrão.
- **Nunca recolorido** para outra cor da paleta. O pão é terracota; é uma constante da marca.

**Pássaro verde** — o elemento raro, e é a raridade que lhe dá valor.

| Uso | Nota |
|---|---|
| Estados vazios | «Aquí todavía no hay nada» |
| Confirmação de encomenda | Momento de recompensa |
| Página 404 | O único momento de humor permitido |

**Máximo de uma aparição do pássaro por sessão de utilizador.** Se aparecer em todo o lado, deixa de ser um achado e passa a ser uma mascote — e a marca não tem mascote.

## 7.4 Ilustração informativa vs. decorativa

Distinção com consequências diretas em acessibilidade:

| | Informativa | Decorativa |
|---|---|---|
| Acrescenta significado? | Sim | Não |
| Exemplos | Personagem que identifica um valor; pão que marca uma família; ícone de estado | Espiga divisória; padrão; figura de ambiente no hero |
| Texto alternativo | **Descritivo, em es-ES** | **Vazio**, e escondida de tecnologia de apoio |
| Se falhar o carregamento | O significado tem de sobreviver no texto adjacente | Nada se perde |

**Regra rígida:** nenhuma informação existe **apenas** numa ilustração. Se uma figura identifica «Tradición», o texto «Tradición» está lá ao lado, sempre.

## 7.5 Ícones de interface

As personagens da marca **não servem** como ícones de interface. Não se usa uma figura humana para representar «fechar» ou «carrinho».

| Aspeto | Especificação |
|---|---|
| Estilo | Traço, geométrico, ponta arredondada |
| Espessura | 1,5 px a 20–24 px; 2 px acima de 32 px |
| Grelha | 24 × 24 px |
| Cor | Herdada do texto envolvente |
| Conjunto | Mínimo — só o que é usado. **Nunca uma biblioteca completa** (a referência servia 144 KB de CSS de ícones, Documento 01 §8) |
| Acessibilidade | Ícone sozinho num controlo exige nome acessível em es-ES |

**Tamanhos:** 16 px (em linha com texto), 20 px (controlos), 24 px (por omissão), 32 px (destaque).

## 7.6 Tamanhos e posições das ilustrações

| Contexto | Altura | Posição |
|---|---:|---|
| Hero (as duas figuras) | 200 → 400 px | Ao lado do título; nunca por trás |
| Bloco de valor | 80 → 120 px | Acima do título do bloco |
| Estado vazio | 100 → 140 px | Centrada, acima da mensagem |
| Confirmação de encomenda | 140 → 200 px | Centrada |
| Espiga divisória | 24 → 32 px | Centrada entre secções |
| Marcador em cartão | 16 → 20 px | Canto superior direito |

Sempre respeitando as áreas seguras de §5.9.

## 7.7 Comportamento responsive

- As ilustrações **reduzem, nunca cortam** (§5.9).
- Abaixo do mínimo legível, a figura é substituída por um elemento mais simples — espiga ou pão — não espremida.
- Em mobile, a ilustração do hero passa para **cima** do título, não para o lado: preserva a leitura de silhueta completa.
- Ilustrações puramente decorativas podem desaparecer abaixo de `sm`. Ilustrações informativas **nunca desaparecem**.

## 7.8 Animações permitidas

Detalhadas em §19. Em resumo: desenho de traço em SVG (espiga, cronologia), entrada com subida curta, e nada mais. **Sem Lottie** — a referência carregava 247 KB de biblioteca para dois *fades* (Documento 01 §5).

---

# 8. Fotografia

## 8.1 O papel da fotografia

A fotografia é **apoio**, não estrutura (§2.2). A ilustração define a composição; a fotografia prova que aquilo existe: este pão, esta pessoa, esta farinha, este sítio.

É também a segunda linha de defesa contra a semelhança com a referência: Casa de Panaderos é **100% fotográfica** (Documento 01 §23). Um FUERZA liderado por fotografia de produto seria, visualmente, o mesmo site.

## 8.2 Direção geral

| Atributo | Especificação |
|---|---|
| **Luz** | Natural, lateral ou de janela. Sombras presentes e definidas. **Nunca luz de estúdio plana, nunca flash frontal** |
| **Cor** | Quente, fiel. Sem virar para o dourado publicitário. Os cremes têm de coincidir com `#F5F1E8` — se não coincidirem, é a fotografia que se ajusta |
| **Fundo** | Materiais reais: madeira, farinha, papel kraft, metal do forno, azulejo. **Nunca fundo branco de catálogo** |
| **Grão** | Aceitável e desejável. Uma imagem demasiado limpa parece de banco de imagens |
| **Pós-produção** | Mínima. Sem HDR, sem saturação forçada, sem vinhetas, sem filtro identificável |

## 8.3 Por categoria

**Produto**
- Um pão por imagem, em contexto — sobre madeira, papel ou pano.
- Preferir **pão cortado** ao pão inteiro: o alvéolo é o argumento da fermentação lenta.
- Ângulo: 45° por omissão; topo apenas para conjuntos.
- Proporção **4:5** no cartão, **3:2** na galeria da ficha.

**Obrador**
- O espaço em funcionamento, não arrumado para a fotografia.
- Farinha no ar, bancada usada, forno aberto.
- Proporção **3:2** ou **16:9**.

**Equipa**
- Pessoas com nome, a trabalhar — **não posadas de braços cruzados**.
- Olhar para o trabalho, não para a câmara, exceto num retrato por pessoa.
- Proporção **1:1** para retratos, **4:5** para meio corpo.

**Ingredientes**
- Farinha, cereal, massa mãe, água, sal. Macro permitido.
- Textura acima de composição.
- Proporção **1:1** ou **4:5**.

**Pontos de recolha**
- A fachada e a entrada, de forma reconhecível para quem vai lá pela primeira vez.
- Com luz de dia, sem trânsito à frente.
- Proporção **3:2**.

**Processo**
- Sequência: massa mãe → amassadura → repouso → forno → arrefecimento.
- Mãos presentes em todas as imagens — é o argumento do «hecho a mano».
- Proporção **1:1** para a cronologia; **3:2** para blocos.

## 8.4 Presença de pessoas

**Regra:** pelo menos **metade** das fotografias de uma página tem pessoas ou mãos visíveis.

É a tradução fotográfica do conceito (§2.1). Uma galeria só de produto contradiz a tese da marca e aproxima-se da referência.

## 8.5 Formatos e proporções

| Uso | Proporção | Largura máxima servida |
|---|---|---:|
| Hero | 4:5 (mobile) / 3:2 (desktop) | 1600 px |
| Cartão de produto | 4:5 | 800 px |
| Galeria da ficha | 3:2 | 1200 px |
| Bloco dividido | 4:5 ou 3:2 | 1200 px |
| Retrato de equipa | 1:1 | 600 px |
| Ponto de recolha | 3:2 | 900 px |
| Cronologia | 1:1 | 500 px |

**Requisitos técnicos** (Documento 01, Prioridade 4, ponto 20; Documento 02 §13.8): AVIF com *fallback* WebP; `srcset` e `sizes` sempre; dimensões declaradas para CLS < 0,05; prioridade alta apenas na imagem principal; carregamento diferido em todo o resto; `alt` descritivo em es-ES.

## 8.6 O que evitar

- Fundo branco de catálogo de comércio eletrónico.
- Pessoas a sorrir para a câmara com uma baguete ao peito.
- Vista de topo perfeitamente simétrica com utensílios distribuídos («*flat lay*»).
- Farinha atirada ao ar em contraluz — o cliché da fotografia de padaria.
- Filtros identificáveis, HDR, saturação forçada.
- Imagens de banco genéricas. **Melhor não ter fotografia do que ter uma que não é do FUERZA.**
- Fotografia de produto sem contexto nem escala.

---

# 9. Botões e ações

## 9.1 Princípios

1. **Uma ação principal por ecrã.** Duas ações principais competem e anulam-se.
2. **O rótulo diz o que acontece a seguir** — «Continuar al pago», não «Enviar».
3. **Terracota significa avançar.** Não se usa terracota em ações neutras nem destrutivas.
4. **Todos os rótulos em es-ES.**

## 9.2 Variantes

### Principal (`primary`)

A ação que faz avançar. Uma por ecrã.

| Aspeto | Especificação |
|---|---|
| Fundo | `#E4572E` |
| Texto | **`#000000`** — 5,70:1 ✓ |
| Contorno | Nenhum |
| Raio | `radius-2` (4 px) |
| Altura | 48 px (mobile) / 44 px (desktop) |
| Interior | 16 px vertical, 24 px horizontal |
| Tipografia | Inter 600, 16 px |

*Rótulos:* «Reservar» · «Reserva y recoge» · «Continuar al pago» · «Confirmar y pagar» · «Añadir al pedido»

### Secundário (`secondary`)

Alternativa válida à ação principal.

| Aspeto | Especificação |
|---|---|
| Fundo | Transparente |
| Texto | `#000000` — 18,63:1 ✓ |
| Contorno | 1,5 px `--border-strong` — 3,38:1 ✓ |
| Restante | Igual ao principal |

*Rótulos:* «Ver disponibilidad» · «Seguir comprando» · «Cambiar punto» · «Volver»

### Texto (`text`)

Ação terciária, inserida no fluxo de leitura.

| Aspeto | Especificação |
|---|---|
| Fundo | Nenhum |
| Texto | `#000000` |
| **Sublinhado** | **Permanente**, 1 px, deslocado da linha de base |
| Interior | Só horizontal, 4 px |

> O sublinhado é permanente e não aparece só no *hover*. Um link que não se distingue do texto até ser apontado é inacessível a quem não usa rato.

*Rótulos:* «Ver todos los panes» · «Cambiar fecha» · «Más información»

### Destrutivo (`destructive`)

Ação que desfaz algo. **Nunca terracota** — seria confundida com avançar.

| Aspeto | Especificação |
|---|---|
| Fundo | Transparente |
| Texto | `#A32E17` — 6,29:1 ✓ |
| Contorno | 1,5 px `#A32E17` |
| Confirmação | **Sempre**, em modal (§21.26) |

*Rótulos:* «Cancelar pedido» · «Cancelar mi plan» · «Eliminar mi cuenta»

### Ícone (`icon`)

Só ícone, sem rótulo visível.

| Aspeto | Especificação |
|---|---|
| Dimensão | **44 × 44 px mínimo** — área de toque |
| Ícone | 20–24 px, centrado |
| Nome acessível | **Obrigatório**, em es-ES |
| Uso | Fechar, menu, aumentar/diminuir quantidade |

### Largura total (`full`)

Modificador, não variante. **Por omissão em mobile** para ações principais em formulários e checkout. A partir de `sm`, largura pelo conteúdo.

## 9.3 Estados

| Estado | Principal | Secundário | Texto | Destrutivo |
|---|---|---|---|---|
| **Default** | `#E4572E` / preto | Transparente / contorno | Sublinhado | Contorno vermelho |
| **Hover** | `#D64E27` (4,98:1 ✓) | Fundo `#EDE8DC` | Sublinhado engrossa para 2 px | Fundo `#F6E2DC` |
| **Focus** | Anel 2 px `#000000` + 2 px de afastamento | idem | idem | idem |
| **Active** | `#CF4923` (4,63:1 ✓) | Fundo `#E4DED0` | — | — |
| **Loading** | Indicador + rótulo alterado; **largura mantida** | idem | idem | idem |
| **Disabled** | `#EDE8DC` / `#8A8271` | idem | idem | idem |

**Sem deslocação, sem escala, sem sombra em nenhum estado.** A mudança é cromática e de espessura, nunca espacial. Botões que saltam ao passar o rato são vocabulário de interface genérica — a referência usava `translateY(-2px)` (Documento 01 §11); este sistema não usa.

**Estado *loading*:**
- Rótulo muda para a forma progressiva: «Reservando…», «Procesando el pago…».
- **A largura do botão não muda** — evita saltos de layout.
- Anúncio a leitores de ecrã através de região ativa.
- Novo clique impedido (defesa contra duplicação, Documento 02 §10.8).

**Estado *disabled*:**
- Sempre acompanhado de explicação legível ao lado. Nunca desativado em silêncio.
- Exemplo: «Elige una fecha para continuar».

## 9.4 Vocabulário de rótulos em es-ES

| Contexto | Rótulo |
|---|---|
| Reservar um produto | «Reservar» |
| Ação de marca / hero | «Reserva y recoge» |
| Avançar no checkout | «Continuar al pago» |
| Confirmar e pagar | «Confirmar y pagar» |
| Ver disponibilidade | «Ver disponibilidad» |
| Gerir subscrição | «Gestionar mi plan» |
| Cancelar encomenda | «Cancelar pedido» |
| Pausar plano | «Pausar el plan» |
| Retomar plano | «Reanudar el plan» |
| Saltar entrega | «Saltar esta entrega» |
| Voltar | «Volver» |
| Fechar | «Cerrar» |
| Tentar de novo | «Intentar de nuevo» |
| Imprimir (painel) | «Imprimir» |
| Marcar preparado (painel) | «Marcar como preparado» |
| Marcar lote entregue (painel) | «Marcar lote entregado» |

**Regras de escrita:** infinitivo ou imperativo em segunda pessoa (a marca trata o cliente por *tú*, coerente com a proximidade declarada). Sem exclamações. Sem maiúsculas totais nos botões — o espacejamento largo em maiúsculas é para etiquetas, não para ações.

---

# 10. Formulários

## 10.1 Regra fundadora

> **Toda a etiqueta é visível, sempre.** *Placeholder* nunca substitui `label`.

A referência tinha **zero** elementos `<label>` (Documento 01 §7): os campos identificavam-se só por *placeholder*, que desaparece assim que o utilizador escreve. Para um leitor de ecrã, o campo era anónimo. É o defeito de acessibilidade mais fácil de evitar e um dos mais graves.

## 10.2 Anatomia de um campo

Ordem vertical fixa:

1. **Etiqueta** — Inter 600, 14 px, `--text`. Sempre visível, acima do campo.
2. **Ajuda** (opcional) — 13 px, `--text-muted`, entre a etiqueta e o campo. Antes, não depois: o utilizador lê antes de escrever.
3. **Campo**.
4. **Erro** (condicional) — 13 px, `#A32E17`, com ícone, ligado ao campo por relação programática.

## 10.3 Especificação do campo

| Aspeto | Especificação |
|---|---|
| Altura | 48 px (mobile) / 44 px (desktop) |
| Interior | 12 px vertical, 14 px horizontal |
| Fundo | `--surface` |
| Contorno | 1,5 px `--border-strong` (3,38:1 ✓) |
| Raio | `radius-1` (2 px) |
| Tipografia | Inter 400, **16 px mínimo** — evita o zoom automático em iOS |
| *Focus* | Contorno passa a 2 px `--text` + anel de foco |
| Erro | Contorno 2 px `#A32E17` + ícone + mensagem |
| Desativado | `--disabled-surface`, `--disabled-text`, com explicação ao lado |

## 10.4 Placeholder

- **Opcional e sempre dispensável.** Nenhuma informação necessária vive só ali.
- Serve para **exemplo de formato**, não para nomear o campo: `«ej.: 600 000 000»`.
- Cor: `--text-muted` (6,39:1) — legível, mas distinta do valor introduzido.

## 10.5 Campos obrigatórios

- **Marcam-se os opcionais, não os obrigatórios.** Na maioria dos formulários deste produto quase tudo é obrigatório; marcar tudo com asterisco é ruído.
- *Rótulo do opcional:* «(opcional)», em `--text-muted`, a seguir à etiqueta.
- A obrigatoriedade é comunicada também de forma programática, para tecnologia de apoio.

## 10.6 Validação

| Momento | Comportamento |
|---|---|
| Ao escrever | **Nenhuma validação.** Validar a cada tecla anuncia erros enquanto o utilizador ainda escreve |
| Ao sair do campo | Validação **suave**: só assinala se o campo já tinha sido validado antes |
| Ao submeter | Validação completa |
| Depois de um erro | Revalidação ao escrever, para o erro desaparecer assim que corrigido |

**Ao submeter com erros:** o foco vai para o primeiro campo com erro; um resumo anuncia quantos erros existem; a página não perde nenhum dado introduzido.

## 10.7 Mensagens de erro em es-ES

**Específicas e acionáveis.** Nunca «Campo inválido».

| Situação | Mensagem |
|---|---|
| Campo vazio obrigatório | «Necesitamos tu [campo] para poder avisarte.» |
| Email mal formado | «Este correo no parece completo. Revisa que tenga @ y el dominio.» |
| Telefone mal formado | «El teléfono debe tener 9 dígitos.» |
| Palavra-passe curta | «La contraseña necesita al menos [n] caracteres.» |
| Consentimento em falta | «Necesitamos que aceptes las condiciones para continuar.» |
| Quantidade acima do disponível | «Solo quedan [n] para el [fecha].» |

## 10.8 Controlos específicos

**Checkbox**
- 24 × 24 px; área de toque 44 × 44 px.
- Contorno 1,5 px `--border-strong`; marcado: fundo `--text`, marca creme.
- Etiqueta clicável, à direita, alinhada pelo topo.
- Estado indeterminado disponível para seleção em lote no painel.

**Radio**
- 24 × 24 px, circular (`radius-full` — uso legítimo).
- Marcado: anel `--text` 2 px + ponto central preenchido.
- **Agrupados sempre** com um título de grupo visível.
- Preferir radios a `select` quando há ≤ 5 opções — mais rápidos e mais acessíveis em mobile.

**Select**
- Aspeto igual ao campo de texto, com ícone de seta à direita.
- **Elemento nativo por omissão.** O seletor nativo do sistema operativo é melhor em mobile do que qualquer substituto — mais rápido, mais acessível, e sem JavaScript.
- Substituto personalizado apenas quando for indispensável mostrar mais do que texto (ex.: ponto de recolha com morada e horário) — e nesse caso implementado com o padrão de listbox acessível completo.

**QuantitySelector**
- Três partes: `−` · valor · `+`.
- Cada botão 44 × 44 px; valor com algarismos tabulares, largura fixa.
- **O valor é editável por teclado**, não só pelos botões.
- `−` desativado em 1; `+` desativado no máximo disponível, **com explicação**: «Solo quedan [n]».
- Mudanças anunciadas a leitores de ecrã.

**Telefone**
- Teclado numérico em mobile.
- Um só campo; prefixo internacional apenas se `DP-17` o exigir.
- Ajuda que explica **porquê** se pede: «Solo lo usamos para avisarte si hay algún problema con tu pedido.» — coerente com o princípio de minimização do Documento 02 §14.3.

**Email**
- Teclado de email em mobile; preenchimento automático ativo.
- Verificação de formato ao submeter, nunca ao escrever.

**Autenticação**
- Palavra-passe com opção de mostrar/esconder (botão de ícone, nome acessível em es-ES).
- Preenchimento automático de gestores de palavra-passe **nunca bloqueado**.
- Erro de credenciais genérico por segurança: «El correo o la contraseña no coinciden.»
- Recuperação sempre visível ao lado do campo, nunca escondida.

**Consentimento**
- **Nunca pré-marcado.** Nunca condição de compra.
- Transacional e marketing **em blocos separados**, com bases legais distintas (Documento 02 §8.7).
- Texto completo visível; ligação à política a abrir sem perder o formulário.

## 10.9 Formulários em mobile

- Uma coluna, sempre.
- Botão principal de largura total, fixo ao fundo do ecrã nos formulários longos (checkout), **sem tapar o último campo**.
- Espaço entre campos: `space-5` (24 px).
- Tipo de teclado correto por campo.
- Nunca mais de 7 campos por ecrã: dividir em passos (§14).

---

# 11. Disponibilidade e stock

A secção que serve o princípio 1.8 e a regra fundadora do Documento 02 §1.5: **a disponibilidade apresentada é sempre real.**

## 11.1 Regra de comunicação

Toda a mensagem de indisponibilidade tem **três partes obrigatórias**:

1. **O quê** — o que se passa.
2. **Porquê** — a razão, em linguagem humana.
3. **Alternativa concreta** — outra data, outro ponto, ou outro produto. Com ação clicável.

Uma mensagem sem a terceira parte é um beco sem saída, e conta como defeito.

## 11.2 Os oito estados

| Estado | Superfície | Acento | *Rótulo, es-ES* | Forma |
|---|---|---|---|---|
| **Disponível** | `#E3EDE9` | `#276A57` | «Disponible» | Círculo cheio |
| **Poucas unidades** | `#FBEFD2` | `#8F6717` | «Quedan [n]» | Círculo meio cheio |
| **Esgotado** | `#EDE8DC` | `#5A5750` | «Agotado» | Círculo vazio |
| **Não produzido nesse dia** | `#EDE8DC` | `#8A8271` | «No horneamos este día» | Traço |
| **Hora-limite ultrapassada** | `#EDE8DC` | `#8A8271` | «Ya ha cerrado» | Relógio |
| **Ponto completo** | `#FBEFD2` | `#8F6717` | «Punto completo» | Quadrado cheio |
| **Produto não aceite no ponto** | `#EDE8DC` | `#8A8271` | «No disponible en este punto» | Cruz |
| **Garantido por subscrição** | `#E4EAF1` | `#3C6086` | «Incluido en tu plan» | Estrela |

Cada estado tem **cor + rótulo + forma** — nunca só cor (§3.7).

## 11.3 Mensagens completas em es-ES

**Disponível, poucas unidades**
> **Quedan [n] para el [fecha].**
> Se reservan hasta el [fecha límite].

**Esgotado numa data**
> **Agotado para el [fecha].**
> Volvemos a hornear [producto] el [próxima fecha].
> → «Ver el [próxima fecha]»

**Não produzido nesse dia**
> **Este día no horneamos [producto].**
> Lo hacemos los [días de producción].
> → «Elegir un día que sí»

**Hora-limite ultrapassada**
> **Ya hemos cerrado los pedidos del [fecha].**
> La masa ya está en marcha. El siguiente día disponible es el [fecha].
> → «Reservar para el [fecha]»

**Ponto completo** — mensagem distinta da de produto esgotado, porque a saída é outra:
> **[Punto] ya está completo el [fecha].**
> Todavía puedes recogerlo en [otro punto] ese mismo día.
> → «Cambiar a [otro punto]»

**Produto não aceite no ponto**
> **[Producto] solo se recoge en [punto(s)].**
> → «Ver puntos donde sí está» · «Quitarlo del pedido»

**Garantido por subscrição**
> **Incluido en tu plan.**
> Te lo guardamos: no depende de las unidades del día.

> **Distinguir «esgotado» de «ponto completo» é o requisito mais importante desta secção.** São situações com causas e saídas opostas — noutro caso o cliente muda de dia, neste muda de sítio. Confundi-las obriga-o a procurar sozinho (Documento 02 §5.7).

## 11.4 Onde aparece a disponibilidade

| Contexto | Forma |
|---|---|
| Cartão de produto | Etiqueta compacta no canto |
| Ficha de produto | Bloco completo, junto ao seletor de data |
| Calendário | Estado por data (§12) |
| Seletor de ponto | Estado por ponto |
| Carrinho | Revalidação a cada alteração |
| Revisão do pedido | **Última verificação visível antes do pagamento** |

## 11.5 O tom da escassez

A voz da marca (Documento 01 §21) trata a escassez como facto, não como técnica de venda.

**Sim:** «Hoy ya no queda. Mañana a las 7 salen 40 más.»
**Não:** «¡Últimas unidades!» · «¡Date prisa!» · contadores regressivos artificiais · «solo quedan 2» quando restam 40.

**Regras:**
- O número real só se mostra abaixo de um limiar configurável.
- Acima desse limiar mostra-se «Disponible», sem número — a quantidade exata não é informação útil, é pressão.
- **Nunca se simula escassez.** É a regra fundadora do Documento 02 §1.5.

---

# 12. Seletor de data e ponto

## 12.1 Ordem recomendada

**Ponto primeiro, data depois** (Documento 02 §5.2): o ponto é a decisão mais rígida na vida do cliente — é onde ele passa — e a data é a mais flexível. A ordem tem de ser **estável** em todo o produto, e a segunda escolha refiltra sempre a primeira.

## 12.2 Calendário — estados por data

| Estado | Aspeto | Selecionável | *Nome acessível, es-ES* |
|---|---|:--:|---|
| **Disponível** | Fundo `--surface`, contorno `--border-strong`, número preto | ✓ | «[fecha], disponible» |
| **Poucas unidades** | + ponto amarelo por baixo do número | ✓ | «[fecha], quedan pocas unidades» |
| **Esgotada** | Fundo `--surface-sunken`, número `--text-muted`, **traço diagonal** | ✗ | «[fecha], agotado» |
| **Sem produção** | Fundo transparente, número `--text-disabled`, sem contorno | ✗ | «[fecha], no horneamos» |
| **Fechada** (encerramento/feriado) | Fundo `--surface-sunken`, número `--text-disabled`, **ponto preto** | ✗ | «[fecha], cerrado» |
| **Após a hora-limite** | Fundo `--surface-sunken`, número `--text-muted`, **ícone de relógio** | ✗ | «[fecha], pedidos cerrados» |
| **Selecionada** | Fundo `--text` preto, número creme, contorno 2 px | ✓ | «[fecha], seleccionado» |
| **Hoje** | Sublinhado 2 px sob o número, independentemente do estado | conforme | «hoy» acrescentado |

**Cinco estados indisponíveis distinguem-se entre si por forma**, não só por cor: traço, ausência de contorno, ponto preto, relógio. Um utilizador com daltonismo distingue todos.

## 12.3 Comportamento do calendário

- **Mês corrente por omissão**, com a primeira data disponível já em foco.
- Navegação por teclado completa: setas movem entre dias, `PageUp`/`PageDown` entre meses, `Home`/`End` nos extremos da semana.
- A janela de datas selecionáveis é definida pelas **cinco condições** do Documento 02 §4.9 e por um limite máximo de antecedência (`DP-03` do Documento 02 — pendente).
- Ao mudar de mês, o motivo de indisponibilidade da primeira data é anunciado.
- **Legenda sempre visível** — não escondida atrás de um ícone de ajuda.

**Mobile:** um mês por ecrã, células de 44 × 44 px mínimo, deslizamento horizontal entre meses **com botões visíveis em alternativa** (o gesto nunca é o único caminho).

## 12.4 A hora-limite na interface

> **`DP-02` está pendente e este documento não a inventa.**

O que o sistema define desde já:

- Existe **um lugar fixo e permanente** onde a hora-limite se comunica: por baixo do calendário, e repetido na revisão do pedido.
- O formato do texto está definido; **o valor vem da configuração**:
  > «Pedidos para el [fecha] hasta el [fecha límite] a las [hora].»
- Quando a hora-limite passa **com o cliente na página**, a data deixa de ser selecionável sem recarregar, com aviso anunciado a tecnologia de apoio (Documento 02 §5.5).
- **`DA-02` — o horário 09:00–18:00 — nunca é apresentado como hora-limite.** É o horário de funcionamento, e aparece no cartão do ponto e em «Dónde estamos» (§12.6).

## 12.5 Seletor de ponto

Lista de cartões, não um `select` — cada ponto tem morada, horário e janela, informação que não cabe numa linha.

**Ordenação:** obrador principal primeiro; restantes por ordem configurada. Sem geolocalização na fase 1 (pede uma permissão intrusiva para benefício pequeno com poucos pontos).

## 12.6 Cartão de ponto de recolha

| Elemento | Conteúdo |
|---|---|
| Nome | «Obrador FUERZA» ou nome do parceiro |
| Distintivo de tipo | «Obrador» / «Punto de recogida» |
| Morada | Rua, número, cidade |
| **Horário de funcionamento** | Do estabelecimento. No obrador: **09:00–18:00** (`DA-02`). Em pontos externos: o seu próprio, **nunca herdado** |
| **Dias de recolha** | Em que dias há pão aqui — **conceito distinto do horário** |
| **Janela de recolha** | Intervalo em que a encomenda está disponível |
| Instruções | Texto do ponto: onde perguntar, o que dizer |
| Estado | §12.7 |
| Ação | «Recoger aquí» |

> **A distinção entre horário, dias de recolha e janela é a mais difícil de comunicar de todo o produto** (Documento 02 §6.3) e a que mais frustração evita. Os três valores aparecem **sempre juntos e sempre rotulados**, nunca condensados numa linha. Um parceiro pode abrir todos os dias e receber pão só à terça e à sexta, entre as 10:00 e as 13:00 — e o cliente tem de perceber isso ao primeiro olhar.

## 12.7 Estados do ponto

| Estado | Aspeto | *Rótulo, es-ES* |
|---|---|---|
| Disponível | Normal, selecionável | — |
| Selecionado | Contorno 2 px `--text` + marca | «Seleccionado» |
| Completo nessa data | `--surface-sunken`, ação desativada | «Completo el [fecha]» |
| Temporariamente indisponível | `--surface-sunken`, ação desativada | «Temporalmente no disponible» |
| Não aceita o pedido | Normal com aviso destacado | «No admite [producto]» |
| Próximo a abrir | Contorno tracejado, sem ação | «Próximamente» |

**«Próximamente» é uma decisão de produto, não decoração:** serve o objetivo 5 do Documento 02 (facilitar a expansão), mostrando ao cliente que a rede está a crescer.

## 12.8 Produtos incompatíveis ao mudar de ponto

Comportamento obrigatório (Documento 02 §4.11, §17.4): **nada é removido em silêncio.**

Um diálogo apresenta o conflito antes de confirmar:

> **En [punto] no podemos darte [producto].**
> Puedes quitarlo del pedido y recoger el resto ahí, o seguir con [punto actual].
> → «Quitar [producto] y cambiar» · «Seguir en [punto actual]»

---

# 13. Cartão e ficha de produto

## 13.1 Cartão de produto

Componente mais repetido do site. Tem de ser legível a 160 px de largura e continuar a respirar a 380 px.

**Estrutura vertical:**

| # | Elemento | Especificação |
|---|---|---|
| 1 | **Filete de família** | 3 px no topo, na cor da família |
| 2 | **Imagem** | 4:5, cobre a largura. Sem raio no topo — encosta ao filete |
| 3 | **Etiqueta de disponibilidade** | Sobreposta ao canto inferior da imagem, sobre superfície sólida |
| 4 | **Nome** | `h4` — Inter 600, 18–21 px |
| 5 | **Família** | `label` maiúsculas espacejadas, `--text-muted` |
| 6 | **Ficha técnica** | Linha única: «[harina] · [n] h de fermentación · [n] g», `body-sm` `--text-muted` |
| 7 | **Preço** | `price` — Inter 600, tabulares, formato «12,50 €» |
| 8 | **Ação** | «Reservar» (principal) ou «Ver disponibilidad» se esgotado hoje |

**A ficha técnica no cartão é uma decisão de conteúdo.** Farinha, fermentação e peso são os três argumentos do produto (Documento 01 §13) e devem estar visíveis **antes** de o cliente abrir a ficha. É o que distingue este catálogo de uma grelha de comércio eletrónico genérico.

**Estados do cartão:**

| Estado | Aspeto |
|---|---|
| Normal | Contorno 1 px `--border` |
| *Hover* | Contorno 2 px `--text`. **Sem elevação, sem deslocação** |
| *Focus* | Anel de foco em todo o cartão |
| Esgotado hoje | Imagem a 70% de opacidade; etiqueta «Agotado»; ação passa a «Ver disponibilidad» |
| Indisponível | `--surface-sunken`, ação desativada com explicação |

**Alvo de clique:** o cartão inteiro leva à ficha; o botão «Reservar» é um alvo distinto dentro dele — sem aninhamento inválido de elementos interativos.

## 13.2 Ficha de produto

Estrutura fiel à **etiqueta física da marca** (Documento 01 §13; Documento 02 §12.3) — coerência de marca que poupa uma decisão de design.

**Desktop:** duas colunas, 7/5. Galeria à esquerda, decisão à direita (fixa ao deslocar).
**Mobile:** uma coluna, na ordem abaixo.

| # | Bloco | Conteúdo |
|---|---|---|
| 1 | **Galeria** | Imagem principal 3:2 + até 4 miniaturas. Setas e teclado; **sem rotação automática** |
| 2 | **Cabeçalho** | Família (etiqueta com cor) · Nome (`h1`) · Preço |
| 3 | **Descrição** | 2–3 parágrafos, medida de 68 caracteres, voz da marca |
| 4 | **Ficha técnica** | Lista de definição: Harina · Origen · Fermentación · Peso aproximado · Elaboración |
| 5 | **Ingredientes** | Lista ordenada por peso decrescente |
| 6 | **Alergénios** | Bloco próprio e destacado — §13.3 |
| 7 | **Variantes** | Radios (≤ 5) ou cartões. Preço e peso por variante |
| 8 | **Ponto** | Seletor compacto; ligação a «Dónde estamos» |
| 9 | **Data** | Calendário com disponibilidade real |
| 10 | **Quantidade** | QuantitySelector com máximo real |
| 11 | **Disponibilidade** | Bloco de estado (§11) |
| 12 | **Ação** | «Reservar» + nota «Pagas al reservar» (`DA-01`) |
| 13 | **Origem** | Moinho e farinha — ligação a «Obrador» |
| 14 | **Relacionados** | 3 produtos da mesma família |

## 13.3 Bloco de alergénios

Requisito legal (Regulamento UE 1169/2011; Documento 02 §4.5), **não elemento de design**.

| Aspeto | Especificação |
|---|---|
| Posição | Sempre acima do bloco de reserva. **Nunca atrás de um acordeão fechado** |
| Distinção | Três estados por alergénio: presente · possível contaminação cruzada · ausente |
| Forma | Lista com ícone + texto. **Nunca só ícones** |
| Contraste | Texto preto sobre `--surface-sunken` (17,18:1) |
| Repetição | Resumo também na revisão do pedido, antes do pagamento — exigência da venda à distância |

*Formato, es-ES:*
> **Alérgenos**
> Contiene: gluten (trigo, centeno).
> Puede contener trazas de: sésamo, frutos de cáscara.
> Elaborado en un obrador donde también trabajamos con [ ].

## 13.4 Elemento fixo em desktop

A coluna de decisão (variante, ponto, data, quantidade, ação) acompanha o deslocamento em `lg` e acima.

**Condições:** nunca ultrapassa a altura do conteúdo; desativado se o bloco for mais alto que o viewport; desativado com `prefers-reduced-motion`; **inexistente em mobile**, onde a ação surge em barra fixa inferior.

---

# 14. Carrinho e checkout

## 14.1 As sete etapas

O checkout é **linear e curto**. Cada passo tem um objetivo e nada mais.

| # | Etapa | *Título, es-ES* | Objetivo |
|---|---|---|---|
| 1 | Produtos | «Tu pedido» | Rever e ajustar |
| 2 | Ponto | «¿Dónde lo recoges?» | Escolher ponto |
| 3 | Data | «¿Qué día?» | Escolher data |
| 4 | Dados | «Tus datos» | Identificar |
| 5 | Revisão | «Revisa tu pedido» | Última verificação — **reserva temporária ativa** |
| 6 | Pagamento | «Pago» | Pagar |
| 7 | Confirmação | «Todo listo» | Comprovativo e código |

**Passos 2 e 3 podem fundir-se num ecrã** em desktop (ponto à esquerda, data à direita) — reduz um passo sem perder clareza. Em mobile mantêm-se separados.

## 14.2 Indicador de progresso

- Visível do passo 1 ao 6; ausente no 7.
- Mobile: «Paso [n] de 6» + barra fina.
- Desktop: passos nomeados; os concluídos são clicáveis para trás.
- **Nunca permite saltar para a frente.**
- Estado comunicado de forma programática, não só visual.

## 14.3 Reserva temporária de stock

Momento crítico do fluxo (Documento 02 §5.4). **Cria-se na entrada do passo 5.**

**Apresentação:**

| Aspeto | Especificação |
|---|---|
| Posição | Faixa no topo do conteúdo, sempre visível nos passos 5 e 6 |
| Superfície | `--info-*` — azul suave, texto preto (17,34:1) |
| Texto | «Te guardamos el pan durante [mm:ss].» |
| Contagem | Minutos, sem décimos. Passa a segundos abaixo de 1 minuto |
| Aviso | A 2 minutos, muda para `--warning-*` e é anunciada |
| Expiração | Diálogo com o resultado e a saída |

> **A contagem informa, não pressiona.** O tom distingue o FUERZA de um sistema de bilhetes: o objetivo é dizer ao cliente que o pão está guardado, não apressá-lo. Sem cores alarmantes, sem pulsação, sem som.

*Ao expirar:*
> **Se ha acabado el tiempo que teníamos guardado tu pan.**
> Lo hemos devuelto al mostrador, así que otra persona puede reservarlo. Todavía puedes intentarlo otra vez.
> → «Volver a intentarlo»

## 14.4 Passo 4 — dados do cliente

- **Comprar sem conta é caminho de primeira classe** (Documento 02 §3.2). Duas opções apresentadas com igual peso visual: «Continuar sin cuenta» e «Entrar en mi cuenta».
- **Nunca** um formulário de registo disfarçado de checkout.
- Campos mínimos conforme `DP-17` (pendente); cada um com a sua justificação em texto de ajuda.
- A criação de conta é oferecida **depois** da confirmação, no passo 7.

## 14.5 Passo 5 — revisão

Última oportunidade de verificar. Contém:

- Itens com nome, variante, quantidade, preço unitário e subtotal.
- **Resumo de alergénios** de todos os itens (§13.3).
- Ponto com morada, dia, janela e instruções.
- Data escolhida.
- Dados do cliente.
- **Total, com IVA incluído.**
- **Nota de pagamento antecipado** (`DA-01`): «Pagas ahora. El día de la recogida solo tienes que recogerlo.»
- Ligação às condições de cancelamento.
- Ação: «Continuar al pago».

**Revalidação de disponibilidade** ao entrar neste passo — a segunda de três verificações (catálogo, revisão, confirmação no servidor).

## 14.6 Passo 6 — pagamento

**Antecipado e obrigatório** (`DA-01`). Não existe outra via, e a interface não sugere que exista.

| Aspeto | Especificação |
|---|---|
| Superfície | Limpa, sem distrações, sem navegação secundária |
| Resumo | Total e ponto/data sempre visíveis ao lado ou acima |
| Contagem | Continua visível |
| Confiança | Indicação de pagamento seguro, **sem selos genéricos de comércio eletrónico** |
| Ação | «Confirmar y pagar [total]» — o valor no próprio rótulo |
| Durante | Estado *loading* bloqueia repetição (Documento 02 §10.8) |

## 14.7 Pagamento falhado, abandonado ou expirado

Os três desfechos negativos têm o mesmo resultado material (Documento 02 §5.11): **não há encomenda e o stock volta ao mercado.** A interface diz isso sem rodeios.

> **Tu pedido no se ha completado.**
> No hemos podido cobrarlo, así que **no queda reservado** y el pan vuelve a estar disponible para otras personas.
> Si quieres, puedes intentarlo otra vez.
> → «Intentar de nuevo» · «Volver al pedido»

**Nunca sugerir uma via alternativa que não existe** — nada de «paga en la recogida», porque não é possível (`DA-01`).

## 14.8 Stock perdido durante o checkout

Verificação final no servidor (Documento 02 §5.10, §15 caso 1). **Sem cobrança.**

> **Se ha agotado [producto] para el [fecha] mientras terminabas.**
> Todavía hay para el [próxima fecha], o puedes recogerlo en [otro punto] ese mismo día.
> El resto de tu pedido sigue guardado.
> → «Cambiar la fecha» · «Cambiar el punto» · «Quitarlo del pedido»

Regras: o item afetado é assinalado no contexto, não numa mensagem solta; **o resto do carrinho mantém-se**; o total recalcula-se de forma visível.

## 14.9 Passo 7 — confirmação

Momento de recompensa, e o único onde o sistema gráfico ganha presença total.

| # | Elemento |
|---|---|
| 1 | **Ilustração das duas figuras** com o pão — o gesto da marca |
| 2 | **Faixa de padrão** — um dos três usos permitidos (§6.8) |
| 3 | «Tu pan está reservado.» (`h1`) |
| 4 | **Código de recolha**, em destaque (§14.10) |
| 5 | Data, janela e ponto, com morada e instruções |
| 6 | Itens e total pago |
| 7 | Nota: «Ya está pagado. El día de la recogida solo tienes que recogerlo.» |
| 8 | «Añadir al calendario» |
| 9 | Oferta de criação de conta — **oferta, nunca exigência** |
| 10 | Nota de que o email foi enviado — **informativa, não essencial** |

> **A confirmação não depende do email** (Documento 02 §5.1). Este ecrã contém tudo o que o cliente precisa; se o email nunca chegar, nada se perde.

## 14.10 Código de recolha

| Aspeto | Especificação |
|---|---|
| Formato | `FZ-` + 4 caracteres, sem ambíguos (0/O, 1/I/l). Formato final: `DP-24` (pendente) |
| Tipografia | Fraunces 700, 32–44 px, espacejamento +0,1 em |
| Superfície | Bloco em `--surface-sunken` com filete duplo — aspeto de talão impresso |
| Ação | «Copiar código», com confirmação visível |
| Legibilidade | Legível em voz alta ao telefone e reconhecível num ecrã com brilho baixo |
| Onde aparece | Confirmação · email · área de cliente · pesquisa do painel |

---

# 15. Área do cliente

## 15.1 Princípio

A área de cliente responde a **uma pergunta dominante**: *quando e onde levanto o meu pão?* Tudo o resto é secundário e vive mais abaixo.

## 15.2 Próximas recolhas

**Bloco de topo, sem necessidade de abrir nada.** É a informação de que o cliente precisa no momento em que abre a área de cliente — normalmente a caminho de levantar.

| Elemento | Especificação |
|---|---|
| Destaque | A próxima recolha em cartão grande; as seguintes em lista compacta |
| Conteúdo | Data · janela · ponto com morada · **código em destaque** · estado |
| Ações | «Ver detalle» · «Cómo llegar» · «Cancelar pedido» (se dentro do prazo) |
| Vazio | Ilustração do pássaro + «Todavía no tienes nada reservado.» + «Ver el pan de esta semana» |

## 15.3 Histórico

- Ordenado por data de recolha, **futuras primeiro**.
- Linha: data · ponto · estado · total · código.
- Filtros por estado e por ano.
- Paginação, não deslocamento infinito — permite voltar ao mesmo sítio.

## 15.4 Detalhe da encomenda

Itens com preço fixado na compra · data, janela e ponto · código · **linha temporal de estados com data e hora** · recibo · ação de cancelar quando aplicável.

## 15.5 Estados da encomenda

Os dez estados do Documento 02 §5.14, apresentados como **linha temporal**, não como etiqueta solta — o cliente vê onde está e o que falta.

| Estado | *Rótulo, es-ES* | Cor |
|---|---|---|
| `pendiente_pago` | «Pendiente de pago» | `--warning-*` |
| `confirmado` | «Confirmado» | `--success-*` |
| `en_preparacion` | «En preparación» | `--info-*` |
| `listo` | «Listo para recoger» | `--success-*` |
| `en_punto` | «Ya está en [punto]» | `--success-*` |
| `recogido` | «Recogido» | Neutro |
| `no_recogido` | «No recogido» | `--warning-*` |
| `cancelado` | «Cancelado» | Neutro |
| `reembolsado` | «Reembolsado» | `--info-*` |

**`recogido` e `cancelado` são neutros, não verdes nem vermelhos** — são desfechos, não juízos.

## 15.6 Cancelamento

- Ação destrutiva com confirmação em modal.
- **O modal diz o que vai acontecer ao dinheiro** — com `DA-01`, há sempre reembolso a explicar.

> **¿Cancelamos tu pedido del [fecha]?**
> Te devolvemos [importe] al mismo método con el que pagaste. Suele tardar unos días en aparecer.
> → «Sí, cancelar» (destrutivo) · «No, mantenerlo»

- Fora do prazo, a ação não aparece: em seu lugar, explicação e contacto.

## 15.7 Dados pessoais

Formulário simples; alteração de email exige verificação; consentimentos de marketing em bloco separado, com retirada tão fácil como a adesão; **eliminação de conta visível**, não escondida (Documento 02 §8.8), com aviso claro sobre os registos de retenção legal.

## 15.8 Subscrição — fase 2

**Requisito de desenho:** ver, pausar e cancelar **na mesma vista**, sem fluxos escondidos e sem obrigar a contactar o obrador. Esconder o cancelamento é padrão manipulador e contradiz frontalmente a proximidade da marca (Documento 02 §8.5).

| Bloco | Conteúdo |
|---|---|
| Estado | Etiqueta + próxima data |
| Plano | Conteúdo, frequência, quantidade, ponto e dia habituais |
| Próximas entregas | Lista com ação «Saltar esta entrega» por linha |
| Pagamento | Próxima data e valor; método |
| Ações | «Cambiar productos» · «Cambiar punto» · «Pausar el plan» · «Cancelar mi plan» |

**Pausa** — diálogo que mostra o efeito **antes** de confirmar, incluindo o caso crítico de já existir uma entrega gerada (Documento 02 §15 caso 8):

> **¿Pausamos tu plan?**
> No te cobramos ni preparamos nada mientras esté en pausa.
> **La entrega del [fecha] ya está preparada y se mantiene.** Si tampoco la quieres, puedes cancelarla aparte.
> → «Pausar el plan» · «Pausar y cancelar la entrega del [fecha]» · «Volver»

**Retoma:** «Reanudar el plan» + primeira data seguinte.
**Alteração de plano:** efeito no ciclo seguinte, indicado com clareza.

---

# 16. Painel do obrador

## 16.1 Princípio

> **Funcional, não decorativo.**

O painel responde a uma pergunta: *quantos produtos temos de preparar e distribuir em cada data e ponto?* Tudo o que não ajude a responder é secundário (Documento 02 §9.1).

**Contexto de uso real:** telemóvel na bancada, mãos ocupadas, trinta segundos. **A lista imprime-se e vai para o forno.**

## 16.2 Diferenças face ao site público

| | Site público | Painel |
|---|---|---|
| Densidade | Generosa | **Compacta** |
| Ilustração | Central | **Ausente**, exceto estados vazios |
| Padrão | Três usos permitidos | **Nenhum** |
| Tipografia | Fraunces + Inter | **Inter dominante**; Fraunces só em números grandes |
| Cor | Expressiva | **Funcional** — só estado e classificação |
| Movimento | Vocabulário completo | **Nenhum**, exceto transições de estado |

**O painel partilha os tokens, não a expressão.** É reconhecivelmente FUERZA — mesmo papel, mesma tinta, mesmas cores de estado — mas não tenta ser bonito à custa de ser rápido.

## 16.3 Vista principal — «Producción»

Ecrã de entrada. Por omissão, **amanhã**.

**1. Cabeçalho fixo**
- Seletor de data com navegação rápida: «Hoy» · «Mañana» · calendário.
- Totais: unidades e encomendas, em Fraunces grande — legíveis de longe.
- **Estado da hora-limite:** «Pedidos abiertos» (aviso) ou «Pedidos cerrados» (confirmação).

> **Aviso obrigatório quando a data ainda está aberta:** «Esta lista todavía puede cambiar.» Quem imprime tem de saber que o número pode aumentar (Documento 02 §17.7).

**2. «Por producto»** — a lista que vai para o forno
- Produto · variante · **total em Fraunces grande** · repartição por ponto.
- Ordenada por ordem de fabrico, se configurada; alfabética caso contrário.
- Casa de verificação por linha, para marcar em produção.

**3. «Por punto»** — a lista que vai na carrinha
- Ponto · total · discriminação por produto · nº de encomendas.
- Ação «Marcar lote entregado en [punto]».

**4. «Pedidos»**
- Tabela: código · cliente · itens · ponto · estado.
- Origem visível: avulsa ou subscrição (fase 2).

## 16.4 Impressão

**Requisito de primeira classe, não um extra.** É a forma como a informação chega ao forno.

- Folha limpa: sem navegação, sem cor de fundo, sem ilustração.
- Preto sobre branco; filetes a 100% de preto.
- Cabeçalho com data, ponto e hora de impressão.
- Quebras de página corretas — nunca um produto dividido entre folhas.
- Casas de verificação impressas, para marcar à mão.
- Uma folha por ponto, opcional.

## 16.5 Ações em lote

Obrigatórias (Documento 02 §9.4). Marcar 40 encomendas uma a uma não acontece na prática — **e um sistema que não é usado produz dados falsos, o que é pior do que não ter dados.**

| Ação | Alvo |
|---|---|
| «Marcar como preparado» | Seleção ou lote inteiro |
| «Marcar lote entregado en [punto]» | Ponto × data |
| «Confirmar recogida» | Encomenda |
| «Imprimir» | Vista atual |
| «Exportar CSV» | Vista atual |

Barra de ações fixa ao fundo quando há seleção, com contagem: «[n] pedidos seleccionados». Botões de 48 px mínimo — o painel usa-se com as mãos ocupadas.

## 16.6 Exceções

Fila de casos que exigem decisão humana (Documento 02 §9.3, §15). **Distintivo permanente com contagem na navegação** — não pode passar despercebida.

Cada caso: o que aconteceu · a encomenda ou cliente afetado · quando · **as ações possíveis**. Ordenada por gravidade e depois por antiguidade.

## 16.7 Mobile

- Cabeçalho com totais compacto e fixo.
- «Por producto» e «Por punto» em separadores, não lado a lado.
- Tabelas convertem-se em lista de cartões — **sem esconder colunas**.
- Ações principais ao alcance do polegar.
- Sem deslocamento horizontal.

---

# 17. Navegação

## 17.1 Cabeçalho

| Aspeto | Especificação |
|---|---|
| Altura | 64 px (mobile) / 72 px (desktop) |
| Fundo | `--bg` sólido — **sem transparência, sem desfoque** |
| Separação | Filete 1 px `--border` em baixo |
| Comportamento | **Fixo** ao deslocar |
| Sombra | Nenhuma — o filete basta |

**Sem desfoque de fundo.** É um efeito de interface moderna e contradiz o princípio 1.7: papel não é translúcido.

**Conteúdo:** wordmark (SVG) à esquerda · navegação ao centro/direita · CTA à direita · ícone de conta.

## 17.2 Menu público

| Item | Destino |
|---|---|
| **Pan** | `/pan` — catálogo |
| **Obrador** | `/obrador` — processo |
| **Nosotros** | `/nosotros` — pessoas e origem |
| **Plan de Pan** | `/suscripciones` |
| **Dónde estamos** | `/donde-estamos` |
| **Reserva y recoge** | **CTA — botão principal** |

**Seis itens, dos quais um é ação.** A referência tinha **dois** itens de menu e nenhuma ligação permanente à compra (Documento 01 §2) — o utilizador que queria encomendar tinha de procurar. Aqui a ação comercial está **sempre presente**.

**Estilo:** Inter 600, 14–15 px, maiúsculas, +0,08 em. Página atual marcada com filete inferior 2 px `--text` **e** indicação programática — nunca só cor.

## 17.3 Menu mobile

- Abaixo de `md` (768 px), a navegação passa a gaveta.
- Botão de menu à direita, 44 × 44 px, com nome acessível «Abrir menú» / «Cerrar menú».
- **Painel de largura total** que desliza da direita. Sem *overlay* desfocado.
- **A CTA «Reserva y recoge» permanece visível no cabeçalho**, fora da gaveta — quem já decidiu não deve ter de abrir um menu.
- Itens grandes: 56 px de altura, Fraunces 21 px.
- Rodapé da gaveta: ligação à conta e a «Dónde estamos».

**Acessibilidade obrigatória** (o único ponto em que a referência acertou, Documento 01 §11): estado expandido/fechado programático; foco preso dentro do painel; fecho com `Escape` **devolvendo o foco ao botão**; fecho ao navegar; conteúdo de fundo inerte.

## 17.4 CTA permanente

`Reserva y recoge` está presente no cabeçalho em **todos** os tamanhos e em **todas** as páginas públicas.

Exceção: dentro do checkout, onde é substituído pelo indicador de progresso — não se convida alguém a começar o que já está a fazer.

## 17.5 Rodapé

Superfície de marca e de utilidade. **Um dos três usos permitidos do padrão** (§6.8).

| Aspeto | Especificação |
|---|---|
| Fundo | `--surface-inverse` (preto) com padrão a baixa densidade, ou creme com filete duplo |
| Texto | `--text-inverse` (18,63:1) |
| Colunas | 1 (mobile) → 2 (`sm`) → 4 (`lg`) |

**Blocos:** wordmark + «Obrador de masa madre · Asturias · España» | Navegação | «Tu cuenta» | «Dónde estamos» com horário do obrador (**09:00–18:00**, `DA-02`) | Newsletter com consentimento explícito | Legais e redes sociais.

## 17.6 Migalhas

- Em ficha de produto, páginas de conta e do painel. **Não na home nem nas páginas de primeiro nível.**
- `body-sm`, `--text-muted`, separador «/» ou espiga a 12 px.
- Último item é o atual, não clicável, marcado programaticamente.
- Mobile: só o nível anterior — «← Volver a Pan».

## 17.7 Navegação da conta

Desktop: coluna lateral. Mobile: separadores horizontais deslizantes com o ativo visível.

«Próximas recogidas» · «Mis pedidos» · «Mi plan» *(fase 2)* · «Mis datos» · «Cerrar sesión»

## 17.8 Navegação do painel

Desktop: coluna lateral fixa e estreita, com ícone e rótulo. Mobile: barra inferior com as quatro vistas mais usadas + «Más».

«Producción» · «Pedidos» · «Disponibilidad» · «Catálogo» · «Puntos» · «Cierres» · «Clientes» · «Excepciones» *(com contagem)*

## 17.9 Ligação de salto

Primeiro elemento focável de todas as páginas: **«Saltar al contenido»**, em es-ES.

> A referência servia esta ligação **em português** num site em espanhol, por ter `lang="pt-PT"` (Documento 01 §7). Aqui, `lang="es-ES"` e o texto está em espanhol.

---

# 18. Feedback e estados do sistema

## 18.1 Princípios

1. **Dizer o que aconteceu, porquê, e o que fazer a seguir.**
2. **Voz da marca**: frases curtas, primeira pessoa do plural, sem exclamações, sem desculpas em excesso, dados concretos (Documento 01 §21).
3. **Nunca culpar o utilizador.**
4. **Sempre uma saída.**

## 18.2 Tipos

| Tipo | Superfície | Acento | Uso |
|---|---|---|---|
| Sucesso | `#E3EDE9` | `#276A57` | Ação concluída |
| Erro | `#F6E2DC` | `#A32E17` | Falhou; requer ação |
| Aviso | `#FBEFD2` | `#8F6717` | Atenção; não impede |
| Informação | `#E4EAF1` | `#3C6086` | Contexto útil |

Todos com **texto preto** (≥ 16,8:1) e ícone próprio (§3.7).

**Apresentação:** em linha, junto ao que descreve — por omissão. Faixa no topo do conteúdo para o que afeta a página. **Notificação flutuante apenas para confirmações efémeras**, com duração mínima de 6 segundos, sem fechar sozinha se contiver ação, e sempre anunciada.

## 18.3 Mensagens em es-ES

**Sucesso**
> «Pedido cancelado. Te devolvemos [importe].»
> «Datos guardados.»
> «Tu plan está en pausa. Cuando quieras, lo reanudas.»

**Erro de pagamento**
> **No hemos podido cobrar tu pedido.**
> El banco no ha autorizado el pago, así que el pedido no queda reservado.
> → «Intentar de nuevo» · «Usar otra tarjeta»

**Erro de disponibilidade** — §14.8.

**Sessão expirada**
> **Se ha cerrado tu sesión.**
> Ha pasado un rato sin actividad. Entra otra vez y sigues donde estabas.
> → «Entrar»

**Offline**
> **Parece que no hay conexión.**
> Lo que has escrito sigue aquí. En cuanto vuelva, puedes continuar.

**404**
> **Esta página no existe.**
> *(ilustração do pássaro verde — um dos seus três usos, §7.3)*
> Igual buscabas el pan, el obrador o dónde recogerlo.
> → «Ver el pan» · «Ir al inicio»

**500**
> **Algo se nos ha roto.**
> No es culpa tuya. Ya lo estamos mirando.
> → «Intentar de nuevo»

## 18.4 Carregamento

| Situação | Padrão |
|---|---|
| Página completa | **Nada** — a página é estática por omissão |
| Disponibilidade a atualizar | Marcador subtil no bloco, sem substituir conteúdo |
| Ação em botão | Estado *loading* do botão (§9.3) |
| Lista a carregar | Espaços reservados **com a forma real do conteúdo**, sem animação de brilho |
| Painel a carregar | Barra fina no topo |

**Sem animação de brilho.** É um vocabulário de interface genérica e contradiz o princípio 1.5. Espaços reservados são retângulos calmos em `--surface-sunken`.

**Regra:** toda a operação acima de 400 ms mostra estado; toda a operação acima de 3 s explica-se em texto.

## 18.5 Estados vazios

Estrutura fixa: ilustração (o pássaro ou uma figura) · título · uma frase · uma ação.

| Contexto | Título | Ação |
|---|---|---|
| Sem encomendas | «Todavía no tienes nada reservado.» | «Ver el pan de esta semana» |
| Carrinho vazio | «Tu pedido está vacío.» | «Ver el pan» |
| Sem resultados no filtro | «No hay nada con estos filtros.» | «Quitar los filtros» |
| Sem produção na data | «Este día no horneamos.» | «Ver los días que sí» |
| Painel sem encomendas | «Nada para el [fecha] todavía.» | «Ver otro día» |

**Nunca um ecrã vazio sem explicação nem saída.**

---

# 19. Movimento

## 19.1 Princípio

> **Nada se move sem razão, e nada se esconde à espera de JavaScript.**

Correção direta ao defeito mais grave da referência: as animações do Elementor tornam o conteúdo invisível e removem essa invisibilidade por JavaScript. **Se o JS falhar, o conteúdo desaparece permanentemente** (Documento 01 §5).

**Regra inversa, inviolável:** o conteúdo é **visível por omissão**; o movimento é enriquecimento progressivo que pode falhar sem consequências.

## 19.2 Vocabulário

Cinco gestos. **Não há um sexto.**

| # | Gesto | Especificação | Onde |
|---|---|---|---|
| 1 | **Subida curta** | 16–24 px para cima + opacidade 0→1. Aceleração suave, 400–500 ms | Entrada de blocos |
| 2 | **Escala mínima** | 0,98 → 1, acompanhando a subida | Cartões e imagens, na entrada |
| 3 | **Desenho de traço SVG** | Traço desenha-se de 0 a 100%, 600–900 ms | Espiga divisória, contorno de figura |
| 4 | **Cronologia que se preenche** | Linha vertical desenha-se ao deslocar | Cronologia de fermentação em «Obrador» |
| 5 | **Transição de estado** | Cor e contorno, 150–200 ms | Botões, campos, cartões, estados de stock |

**Gestos 1 e 2 juntos evocam a massa a crescer** — e é a repetição consistente de **um só gesto** que dá corrente à página, em vez dos *fades* isolados da referência, que produzem a sensação de «slides empilhados».

## 19.3 Duração e aceleração

| Categoria | Duração | Aceleração |
|---|---|---|
| Micro (cor, contorno) | 150 ms | Padrão |
| Controlos (botão, campo) | 200 ms | Saída suave |
| Entrada de bloco | 400–500 ms | Saída suave lenta |
| Desenho SVG | 600–900 ms | Entrada e saída suaves |
| Gaveta e modal | 250 ms | Saída suave |

**Nada acima de 900 ms.** Nada com efeito de mola nem de ressalto — são vocabulário de interface lúdica e a marca não é isso.

## 19.4 Proibições

| Proibido | Razão |
|---|---|
| **Lottie** | 247 KB para dois *fades* na referência (Documento 01 §5). Todo o vocabulário desta secção corre em CSS nativo |
| **Deslocamento sequestrado** | Retira o controlo ao utilizador |
| **Paralaxe** | Gesto de agência digital; contradiz a metáfora do papel |
| **Contadores animados** | Decorativos, e prejudicam leitores de ecrã |
| **Rotação automática de carrosséis** | Movimento não solicitado |
| **Animação de entrada em texto corrido** | Atrasa a leitura |
| **Pulsação e brilho** | Vocabulário de interface genérica |
| **Movimento em estado *hover* que desloque layout** | Provoca instabilidade |

## 19.5 Movimento reduzido

Com `prefers-reduced-motion: reduce`:

| Elemento | Comportamento |
|---|---|
| Entradas | **Desligadas.** Conteúdo aparece de imediato |
| Desenho SVG | Desligado; traço completo desde o início |
| Cronologia | Desligada; linha completa |
| Transições de estado | **Mantidas** — são informativas, e ≤ 200 ms |
| Gaveta e modal | Sem deslizamento; aparecem diretamente |

**Nenhuma informação se perde.** É o critério de aceitação CA-A5 do Documento 02.

## 19.6 Sem JavaScript

- **Todo** o conteúdo visível e legível.
- Navegação funcional; menu mobile degrada para lista visível.
- Formulários submetíveis.
- Catálogo e disponibilidade legíveis (renderizados no servidor).

Verificado em CI (Documento 02 §17.11, CA-A4).

---

# 20. Acessibilidade

Regras obrigatórias, verificáveis, derivadas do Documento 02 §13.

## 20.1 Norma

**WCAG 2.2 nível AA** em todo o site, incluindo painel e emails. Verificação automatizada em CI: uma falha **quebra o build**.

## 20.2 Contraste

| Requisito | Mínimo | Estado |
|---|---|---|
| Texto normal | 4,5:1 | `--text` 18,63:1 · `--text-muted` 6,39:1 ✓ |
| Texto grande (≥ 24 px ou ≥ 18,7 px negrito) | 3:1 | Terracota 3,27:1 ✓ (só nesta condição) |
| Componentes de interface | 3:1 | `--border-strong` 3,38:1 ✓ |
| Botão principal | 4,5:1 | Preto sobre terracota 5,70:1 ✓ |

**Proibições verificadas automaticamente:** branco sobre terracota (3,68:1); terracota em texto normal (3,27:1); amarelo em qualquer texto (1,49:1); cinzentos frios de baixo contraste.

## 20.3 Teclado

- **Todo** o fluxo de reserva completável só com teclado (CA-A1).
- Ordem de foco lógica, coincidente com a ordem visual.
- Sem armadilhas de foco, exceto as intencionais em modal e gaveta — sempre com saída por `Escape`.
- Calendário com navegação por setas (§12.3).
- QuantitySelector operável por teclado, com valor editável.
- Nenhuma funcionalidade exclusiva de rato ou de gesto.

## 20.4 Foco visível

- Anel 2 px `--focus` + 2 px de afastamento. **Nunca removido.**
- Contraste ≥ 3:1 contra qualquer fundo adjacente — verificado sobre creme, terracota, preto e as quatro superfícies de estado.
- Visível também em elementos personalizados e dentro de modais.

## 20.5 Etiquetas

- `<label>` associado a **todos** os campos, sem exceção (CA-A3).
- *Placeholder* nunca substitui etiqueta (§10.1).
- Botões de ícone com nome acessível em es-ES.
- Grupos de radio e checkbox com título de grupo.
- Ligações com texto significativo — nunca «clic aquí».

## 20.6 Erros

- Ligados ao campo por relação programática.
- Anunciados a leitores de ecrã ao aparecerem.
- **Específicos e acionáveis** (§10.7).
- Resumo com contagem ao submeter, e foco no primeiro erro.

## 20.7 Áreas de toque

- **Mínimo 44 × 44 px** em todos os alvos interativos.
- Separação mínima de 8 px entre alvos adjacentes.
- Células do calendário: 44 × 44 px em mobile.
- Botões do QuantitySelector: 44 × 44 px.

## 20.8 Hierarquia semântica

- **Exatamente um `<h1>` por página**, descritivo (CA-A6). A referência não tinha `<h1>` em três de quatro páginas (Documento 01 §7).
- Hierarquia de cabeçalhos sem saltos.
- Landmarks semânticos.
- Listas marcadas como listas; tabelas com cabeçalhos associados.
- `lang="es-ES"` no documento.

## 20.9 Cor nunca é o único sinal

Requisito WCAG 1.4.1, aplicado a:

| Contexto | Sinal adicional |
|---|---|
| Estados de stock | Rótulo em texto + forma (§11.2) |
| Famílias de produto | Nome da família em texto |
| Estados de data | Traço, relógio, ponto, ausência de contorno (§12.2) |
| Erros de formulário | Ícone + mensagem + contorno mais espesso |
| Estados de encomenda | Rótulo + posição na linha temporal |
| Página atual na navegação | Filete + marcação programática |

## 20.10 Leitores de ecrã

- Alterações dinâmicas anunciadas por região ativa (disponibilidade, contagem da reserva, resultados de filtro).
- Estados de carregamento anunciados.
- Ilustrações decorativas escondidas; informativas descritas em es-ES (§7.4).
- Modal e gaveta com papel, título e gestão de foco corretos.
- Passos do checkout anunciados na mudança.

## 20.11 Verificação em CI

| Verificação | Falha o build |
|---|:--:|
| Contraste abaixo de AA | ✓ |
| Campo sem etiqueta | ✓ |
| Página sem `<h1>` ou com mais de um | ✓ |
| `lang` incorreto | ✓ |
| Imagem sem `alt` | ✓ |
| Alvo de toque abaixo de 44 px | ✓ |
| Conteúdo dependente de JS | ✓ |
| Texto marcador em produção | ✓ |

---

# 21. Componentes necessários

Inventário. **Nenhum é implementado neste documento.**

Formato de cada entrada: **objetivo · variantes · estados · conteúdo · acessibilidade · mobile**.

---

### 21.1 Header
- **Objetivo:** identidade, navegação e acesso permanente à ação comercial.
- **Variantes:** público · conta · painel · checkout (reduzido).
- **Estados:** topo · deslocado · menu aberto.
- **Conteúdo:** wordmark SVG, navegação, CTA, acesso à conta.
- **Acessibilidade:** landmark de navegação; página atual marcada; ligação de salto como primeiro elemento focável.
- **Mobile:** 64 px; navegação colapsa; **CTA permanece visível**.

### 21.2 MobileMenu
- **Objetivo:** navegação completa abaixo de `md`.
- **Variantes:** público · conta.
- **Estados:** fechado · a abrir · aberto · a fechar.
- **Conteúdo:** itens grandes em Fraunces, acesso à conta, ligação a «Dónde estamos».
- **Acessibilidade:** estado expandido programático; foco preso; `Escape` devolve foco ao botão; fundo inerte.
- **Mobile:** exclusivo. Painel de largura total; itens de 56 px.

### 21.3 Footer
- **Objetivo:** utilidade, legais e superfície de marca.
- **Variantes:** completo · reduzido (checkout).
- **Estados:** —
- **Conteúdo:** wordmark, descritor, navegação, horário do obrador (`DA-02`), newsletter, legais, redes.
- **Acessibilidade:** landmark; contraste 18,63:1 em superfície invertida; padrão nunca sob texto.
- **Mobile:** uma coluna; newsletter no fim.

### 21.4 Button
- **Objetivo:** desencadear ações.
- **Variantes:** principal · secundário · texto · destrutivo · ícone · largura total.
- **Estados:** default · hover · focus · active · loading · disabled.
- **Conteúdo:** rótulo es-ES; ícone opcional à esquerda.
- **Acessibilidade:** 44 px mínimo; nome acessível em botões de ícone; *loading* anunciado; desativado sempre com explicação.
- **Mobile:** 48 px; largura total em formulários e checkout.

### 21.5 Input
- **Objetivo:** recolher texto.
- **Variantes:** texto · email · telefone · palavra-passe · área de texto · com prefixo/sufixo.
- **Estados:** default · focus · preenchido · erro · desativado · só leitura.
- **Conteúdo:** etiqueta visível, ajuda, campo, mensagem de erro.
- **Acessibilidade:** `<label>` sempre; erro ligado programaticamente; 16 px mínimo.
- **Mobile:** 48 px; teclado correto por tipo.

### 21.6 Select
- **Objetivo:** escolher de uma lista.
- **Variantes:** nativo (por omissão) · personalizado (só quando indispensável).
- **Estados:** default · focus · aberto · selecionado · erro · desativado.
- **Conteúdo:** etiqueta, opções, opção vazia descritiva.
- **Acessibilidade:** nativo por omissão; personalizado exige padrão de listbox completo.
- **Mobile:** nativo sempre que possível — o seletor do sistema é superior.

### 21.7 Checkbox
- **Objetivo:** escolha binária ou múltipla.
- **Variantes:** simples · com descrição · de consentimento.
- **Estados:** desmarcado · marcado · indeterminado · focus · erro · desativado.
- **Conteúdo:** etiqueta clicável; descrição opcional.
- **Acessibilidade:** área de toque 44 px; grupos com título; consentimento nunca pré-marcado.
- **Mobile:** etiqueta em várias linhas alinhada pelo topo.

### 21.8 Radio
- **Objetivo:** escolha única entre poucas opções.
- **Variantes:** simples · cartão (variantes de produto).
- **Estados:** desmarcado · marcado · focus · desativado.
- **Conteúdo:** etiqueta; detalhe opcional (preço, peso).
- **Acessibilidade:** grupo com título; setas navegam dentro do grupo.
- **Mobile:** preferido a `select` com ≤ 5 opções.

### 21.9 QuantitySelector
- **Objetivo:** escolher unidades dentro do máximo real.
- **Variantes:** normal · compacto (carrinho).
- **Estados:** default · no mínimo · no máximo · desativado · a validar.
- **Conteúdo:** `−`, valor tabular, `+`, e nota de limite.
- **Acessibilidade:** botões 44 px; valor editável; alterações anunciadas; máximo explicado em texto.
- **Mobile:** botões grandes, valor com largura fixa.

### 21.10 ProductCard
- **Objetivo:** apresentar um produto no catálogo com disponibilidade real.
- **Variantes:** normal · compacto (relacionados) · horizontal (carrinho).
- **Estados:** normal · hover · focus · esgotado · indisponível.
- **Conteúdo:** filete de família, imagem, etiqueta de stock, nome, família, ficha técnica, preço, ação (§13.1).
- **Acessibilidade:** cartão e botão como alvos distintos; disponibilidade em texto; imagem com `alt`.
- **Mobile:** uma coluna abaixo de `sm`; ação de largura total.

### 21.11 ProductDetail
- **Objetivo:** dar toda a informação e permitir reservar.
- **Variantes:** com e sem variantes.
- **Estados:** disponível · esgotado na data · indisponível no ponto · a validar.
- **Conteúdo:** os 14 blocos de §13.2.
- **Acessibilidade:** um `<h1>`; alergénios nunca escondidos; galeria navegável por teclado; alterações de disponibilidade anunciadas.
- **Mobile:** uma coluna; ação em barra fixa inferior.

### 21.12 AvailabilityBadge
- **Objetivo:** comunicar o estado de disponibilidade num relance.
- **Variantes:** compacta (cartão) · completa (ficha) · em linha (carrinho).
- **Estados:** os oito de §11.2.
- **Conteúdo:** forma + rótulo es-ES (+ número quando aplicável).
- **Acessibilidade:** nunca só cor; texto sempre presente.
- **Mobile:** versão compacta abrevia o rótulo, nunca o elimina.

### 21.13 StockIndicator
- **Objetivo:** explicar o motivo da indisponibilidade e oferecer alternativa.
- **Variantes:** por produto · por ponto · por data.
- **Estados:** os oito de §11.2.
- **Conteúdo:** **as três partes obrigatórias** — o quê, porquê, alternativa clicável (§11.1).
- **Acessibilidade:** anunciado ao mudar; alternativa é um controlo real, não texto.
- **Mobile:** ações empilhadas de largura total.

### 21.14 DatePicker
- **Objetivo:** escolher uma data válida entre as reais.
- **Variantes:** em linha (ficha) · em painel (checkout).
- **Estados:** os oito estados de data de §12.2.
- **Conteúdo:** grelha do mês, navegação, legenda visível, nota da hora-limite.
- **Acessibilidade:** navegação por setas/página/início-fim; nome acessível por dia com o motivo; legenda não escondida.
- **Mobile:** um mês por ecrã; células 44 px; botões além do gesto.

### 21.15 PickupPointCard
- **Objetivo:** apresentar um ponto com a informação necessária para lá ir.
- **Variantes:** selecionável (checkout) · informativa («Dónde estamos») · compacta (confirmação).
- **Estados:** disponível · selecionado · completo · indisponível · incompatível · próximamente.
- **Conteúdo:** nome, tipo, morada, **horário, dias de recolha e janela — os três rotulados em separado** (§12.6), instruções, estado, ação.
- **Acessibilidade:** cartão inteiro selecionável; estado em texto; morada semanticamente marcada.
- **Mobile:** uma coluna; mapa colapsado por omissão.

### 21.16 Cart
- **Objetivo:** rever e ajustar antes do checkout.
- **Variantes:** gaveta · página · resumo em linha.
- **Estados:** vazio · com itens · a validar · com conflito de disponibilidade.
- **Conteúdo:** itens, quantidades, subtotais, total, ponto e data escolhidos, ação.
- **Acessibilidade:** alterações anunciadas; remoção com confirmação; foco preservado após alterar.
- **Mobile:** gaveta de altura total; ação fixa ao fundo.

### 21.17 CheckoutSteps
- **Objetivo:** situar o cliente no fluxo.
- **Variantes:** compacta (mobile) · nomeada (desktop).
- **Estados:** por fazer · atual · concluído.
- **Conteúdo:** nomes es-ES dos sete passos (§14.1).
- **Acessibilidade:** passo atual marcado programaticamente; mudança anunciada; passos concluídos navegáveis.
- **Mobile:** «Paso [n] de 6» + barra.

### 21.18 OrderSummary
- **Objetivo:** mostrar o que se reserva, onde, quando e por quanto.
- **Variantes:** revisão · confirmação · detalhe · email.
- **Estados:** editável · fixo.
- **Conteúdo:** itens, resumo de alergénios, ponto, data, janela, total com IVA, **nota de pagamento antecipado**.
- **Acessibilidade:** estrutura de lista de definição; total anunciado ao mudar.
- **Mobile:** colapsável **com o total sempre visível**.

### 21.19 PaymentStatus
- **Objetivo:** comunicar o estado do pagamento.
- **Variantes:** em curso · sucesso · falha · expirado.
- **Estados:** os sete estados de pagamento do Documento 02 §10.2.
- **Conteúdo:** estado, explicação, ação. **Nunca sugerir pagar na recolha** (`DA-01`).
- **Acessibilidade:** anunciado; ação sempre presente; nunca só cor.
- **Mobile:** ecrã completo durante o processamento; sem navegação a distrair.

### 21.20 PickupCode
- **Objetivo:** dar ao cliente a chave da recolha.
- **Variantes:** destaque (confirmação) · em linha (lista) · impressão.
- **Estados:** normal · copiado.
- **Conteúdo:** código, ação de copiar, instrução breve.
- **Acessibilidade:** legível caractere a caractere por leitores de ecrã; cópia confirmada por texto, não só por ícone.
- **Mobile:** grande, com contraste alto — legível com brilho baixo.

### 21.21 SubscriptionCard
- **Objetivo:** apresentar e gerir o Plan de Pan *(fase 2)*.
- **Variantes:** oferta (venda) · ativa (conta) · compacta.
- **Estados:** os sete estados de subscrição do Documento 02 §7.18.
- **Conteúdo:** plano, conteúdo, frequência, ponto e dia habituais, próxima entrega, próximo pagamento, ações.
- **Acessibilidade:** **pausar e cancelar na mesma vista**, nunca escondidos; efeito explicado antes de confirmar.
- **Mobile:** ações empilhadas; a destrutiva claramente separada.

### 21.22 OrderStatus
- **Objetivo:** mostrar onde está a encomenda e o que falta.
- **Variantes:** linha temporal (detalhe) · etiqueta (lista) · em linha (painel).
- **Estados:** os dez estados do Documento 02 §5.14.
- **Conteúdo:** estado atual, histórico datado, próximo passo esperado.
- **Acessibilidade:** rótulo + posição; nunca só cor; desfechos em tom neutro.
- **Mobile:** linha temporal vertical compacta.

### 21.23 ProductionTable
- **Objetivo:** dizer ao obrador o que fazer e para onde vai.
- **Variantes:** por produto · por ponto · por encomenda · **impressão**.
- **Estados:** data aberta (aviso) · data fechada · vazia · a carregar.
- **Conteúdo:** totais em Fraunces grande, discriminação, casas de verificação, ações em lote.
- **Acessibilidade:** cabeçalhos associados; seleção anunciada com contagem; ações de 48 px.
- **Mobile:** cartões em vez de tabela, **sem esconder colunas**; separadores entre vistas.

### 21.24 Notification
- **Objetivo:** dar retorno de uma ação ou informar de uma mudança.
- **Variantes:** sucesso · erro · aviso · informação; em linha · faixa · flutuante.
- **Estados:** a entrar · visível · a sair.
- **Conteúdo:** ícone, mensagem es-ES, ação opcional.
- **Acessibilidade:** região ativa com urgência adequada; ≥ 6 s; não fecha sozinha se tiver ação.
- **Mobile:** largura total no topo, abaixo do cabeçalho.

### 21.25 Modal
- **Objetivo:** exigir uma decisão que não pode ficar por resolver.
- **Variantes:** confirmação · destrutiva · informativa.
- **Estados:** fechado · a abrir · aberto · a fechar.
- **Conteúdo:** título, explicação **do que vai acontecer**, ações — a segura primeiro na ordem de leitura.
- **Acessibilidade:** papel de diálogo, título associado, foco preso, `Escape` fecha e devolve foco, fundo inerte.
- **Mobile:** encosta ao fundo do ecrã; ações de largura total empilhadas.

### 21.26 Drawer
- **Objetivo:** conteúdo secundário sem sair da página.
- **Variantes:** navegação · carrinho · filtros.
- **Estados:** fechado · a abrir · aberto · a fechar.
- **Conteúdo:** título, corpo, ação fixa ao fundo.
- **Acessibilidade:** igual ao modal; deslocamento de fundo bloqueado.
- **Mobile:** largura total; fecho por gesto **com botão sempre disponível**.

### 21.27 EmptyState
- **Objetivo:** explicar a ausência e oferecer saída.
- **Variantes:** por contexto (§18.5).
- **Estados:** —
- **Conteúdo:** ilustração, título, uma frase, uma ação.
- **Acessibilidade:** ilustração decorativa escondida; texto suficiente por si só.
- **Mobile:** ilustração reduzida; ação de largura total.

### 21.28 ErrorState
- **Objetivo:** explicar uma falha e permitir recuperar.
- **Variantes:** em linha · página completa · 404 · 500 · offline · sessão expirada.
- **Estados:** recuperável · não recuperável.
- **Conteúdo:** o que aconteceu, porquê, o que fazer. **Nunca códigos técnicos ao cliente.**
- **Acessibilidade:** anunciado; foco levado à mensagem; ação sempre presente.
- **Mobile:** ação de largura total.

---

## 21.29 Componentes adicionais que as regras exigem

Cinco componentes não listados no pedido mas obrigados pelas regras dos Documentos 01 e 02. Registo-os para que não sejam improvisados durante a implementação.

| Componente | Objetivo | Origem da obrigação |
|---|---|---|
| **AllergenList** | Declarar alergénios com três estados, nunca escondida | Requisito legal — Doc 02 §4.5 |
| **Illustration** | Servir SVG da marca com distinção informativa/decorativa e áreas seguras | §7.4, §5.9 |
| **Timeline** | Cronologia de fermentação e histórico de estados | Doc 01, Prioridade 3, ponto 16 |
| **ReservationTimer** | Contagem da reserva temporária, em tom informativo | `DA-01` + Doc 02 §5.4 |
| **PriceDisplay** | Preço com algarismos tabulares e formato es-ES «12,50 €» | §4.7 |

**Total inventariado: 33 componentes** — 28 pedidos + 5 exigidos pelas regras.

---

# 22. Páginas e composição

Blocos por página. Confirma a arquitetura de informação do Documento 01 (Parte VI) com os ajustes do Documento 02 §12.

## 22.1 Home

| # | Bloco | Nota |
|---|---|---|
| 1 | Hero — as duas figuras + tese de marca | Ilustração, **não fotografia de produto** |
| 2 | **«Lo que sale del horno»** — 3–4 produtos com disponibilidade real | Dados em direto. **A referência nunca mostra pão** |
| 3 | Cronologia de fermentação | Substitui os pontos ativos escondidos da referência |
| 4 | Os quatro valores, com as personagens | Iconografia própria |
| 5 | Origem — Astúrias, farinhas, moinhos | Não existe na referência |
| 6 | Plan de Pan | Fase 1: «Próximamente» com recolha de interesse |
| 7 | Reserva y recoge em três passos | Herda a clareza do `01/02/03` |
| 8 | As pessoas do obrador | Não existe na referência |
| 9 | Rodapé com padrão + newsletter | Superfície de marca |

**O produto aparece no bloco 2, não no fim.** É a maior correção de ritmo face à referência (Documento 01 §22).

**Alternância obrigatória:** larguras, número de colunas e cor de fundo variam entre blocos consecutivos (§5.2).

## 22.2 `/pan` — catálogo

Cabeçalho com `h1` e uma frase · **filtro por data em destaque** («¿Para qué día lo quieres?») · filtro por família com cores · grelha 1→2→3 · estado vazio com próxima data disponível.

> O filtro por data é a decisão de UX mais importante desta página: alinha o catálogo com o modelo mental de quem compra pão — **primeiro o dia, depois o pão** (Documento 02 §12.2).

## 22.3 `/pan/[slug]` — ficha

Os 14 blocos de §13.2.

## 22.4 `/obrador`

Hero com a mulher de avental e baguete · **cronologia de fermentação com horas concretas** · o que é masa madre · farinhas e moinhos · fotografia do processo · ligação ao catálogo.

**Requisito:** a cronologia é legível **sem JavaScript e sem animação** (§19.6).

## 22.5 `/nosotros`

Hero com o padeiro da pá · a história em prosa curta · **equipa com nome e rosto** · Astúrias e o sentido de lugar · os cinco pilares da folha de identidade · citação de marca em faixa invertida.

## 22.6 `/suscripciones`

**Fase 1:** explicação, benefícios, «Próximamente», recolha de interesse. **Estado honesto — não simula o que não existe.**
**Fase 2:** planos, funcionamento, **condições de pausa e cancelamento visíveis antes de subscrever** (Documento 02 §12.6), FAQ.

## 22.7 `/reservas`

Explica **antes** de o cliente entrar no fluxo: os três passos, a hora-limite (`DP-02`, com espaço reservado), os pontos, o pagamento antecipado (`DA-01`) e a política de cancelamento. Reduz abandono e reduz contactos ao obrador.

## 22.8 `/donde-estamos`

Todos os pontos, incluindo «Próximamente» · por ponto: morada, mapa, indicações, **horário + dias de recolha + janela rotulados em separado**, instruções, estado · horário do obrador **09:00–18:00** (`DA-02`).

## 22.9 `/cuenta`

§15. Próximas recolhas em destaque, o resto abaixo.

## 22.10 `/admin`

§16. Denso, funcional, imprimível, sem ilustração nem padrão.

## 22.11 `/contacto`

Formulário com etiquetas visíveis · contactos diretos · horário do obrador · nota de que a gestão de encomendas se faz na área de cliente, não aqui.

## 22.12 Páginas legais

Uma coluna, medida de 68 caracteres, hierarquia clara, índice se for longo.

**Requisito de bloqueio:** nenhuma pode conter texto genérico por adaptar. É o defeito mais grave encontrado na referência — dezoito ocorrências de texto de configuração em inglês numa página comercial (Documento 01 §10) — e a verificação de §20.11 deteta-o automaticamente.

---

# 23. Anti-padrões

**Lista de proibições. Cada linha corresponde a um defeito observado na referência ou a um risco real de o sistema derivar para aspeto genérico.**

| # | Proibido | Razão |
|---|---|---|
| 1 | **Aparência genérica de template** | Se um ecrã pudesse pertencer a qualquer marca, falhou o princípio 1.1 |
| 2 | **Excesso de cartões** | Nem tudo é um cartão. Texto corrido, listas e faixas são estruturas legítimas e mais próximas de papel impresso |
| 3 | **Branco sobre terracota** | **3,68:1 — falha AA.** Exatamente o defeito do botão principal da referência (3,94:1) |
| 4 | **Cinzentos frios de baixo contraste** | O `#7A7A7A` da referência falha a 3,95:1. `--text-muted` é quente e passa a 6,39:1 |
| 5 | **Conteúdo duplicado para responsive** | A referência duplica títulos e repete a navegação do rodapé quatro vezes. Uma marcação, vários layouts |
| 6 | **Animações que escondem conteúdo** | O conteúdo nasce visível. Nada depende de JS para aparecer |
| 7 | **Componentes de biblioteca com aspeto por omissão** | Uma biblioteca pode dar comportamento acessível; **nunca a identidade visual**. O aspeto é do FUERZA |
| 8 | **Gradientes tecnológicos** | Contradizem papel e tinta |
| 9 | **Vidro fosco e transparências** | Papel não é translúcido. Inclui o cabeçalho, que é sólido |
| 10 | **Excesso de sombras** | Sombra só em modal e gaveta. Superfícies definem-se por filete |
| 11 | **Ilustração como mera decoração** | Cada figura tem posto (§7.2). Ilustração a preencher espaço desvaloriza o ativo mais valioso da marca |
| 12 | **Três colunas iguais em todas as secções** | Monotonia de grelha é a assinatura do template. Alternar 2/3/4 e simétrico/assimétrico |
| 13 | **Botões em forma de cápsula** | `border-radius: 150px` é a forma mais reconhecível da referência. O FUERZA usa 4 px |
| 14 | **Movimento em *hover* que desloque layout** | A referência usa `translateY(-2px)`. Aqui a mudança é cromática |
| 15 | **Escassez simulada** | «¡Últimas unidades!» quando restam 40 contradiz a regra fundadora do Documento 02 §1.5 |
| 16 | **Erro a terracota** | Terracota é a ação. Confundir «avançar» com «falhou» é um defeito grave (§3.2) |
| 17 | **Placeholder em vez de etiqueta** | A referência tinha zero `<label>` |
| 18 | **Texto marcador em produção** | Dezoito ocorrências na referência. Falha o build |
| 19 | **Fotografia de banco de imagens** | Melhor não ter fotografia do que ter uma que não é do FUERZA |
| 20 | **Lottie ou bibliotecas de animação pesadas** | 247 KB para dois *fades* na referência |
| 21 | **Cor como único sinal de estado** | Falha WCAG 1.4.1 |
| 22 | **Padrão sob texto** | Torna o contraste imprevisível |
| 23 | **Cancelamento escondido** | Padrão manipulador; contradiz a proximidade da marca |
| 24 | **Bibliotecas de ícones completas** | A referência serve 144 KB de CSS de ícones. Só o que se usa |

---

# 24. Critérios de validação

Critérios verificáveis para aprovar o sistema. **Automatizáveis sempre que possível.**

## 24.1 Contraste

| Verificação | Critério | Método |
|---|---|---|
| Texto corrido | ≥ 4,5:1 | Automático em CI |
| Texto grande | ≥ 3:1 | Automático |
| Componentes e contornos | ≥ 3:1 | Automático |
| Botão principal | ≥ 4,5:1 (é 5,70:1) | Automático |
| Anel de foco | ≥ 3:1 sobre todos os fundos do sistema | Manual, matriz completa |
| Texto sobre padrão | ≥ 4,5:1 **no ponto mais desfavorável** | Manual |

**Falha uma, falha o build.**

## 24.2 Responsive

| Verificação | Critério |
|---|---|
| Sem deslocamento horizontal | 320 → 1920 px |
| Reserva completável | 360 px de largura |
| Painel de produção usável | 360 px, sem zoom |
| Alvos de toque | ≥ 44 × 44 px |
| **Zero conteúdo duplicado no DOM** | Verificação automática |
| Tabelas largas | Deslocam dentro do contentor |

## 24.3 Consistência

- Todos os espaçamentos vêm da escala de §5.1 — **nenhum valor arbitrário**.
- Todas as cores vêm dos tokens de §3.3 — **nenhum valor bruto em componentes**.
- Todos os tamanhos de texto vêm da escala de §4.5.
- Todos os raios vêm de §6.1. **Zero ocorrências de raio em cápsula.**
- Duas famílias tipográficas, ambas usadas.

## 24.4 Acessibilidade

Todos os critérios de §20.11, mais uma auditoria manual por versão: percurso completo de reserva só com teclado; percurso completo com leitor de ecrã; verificação com movimento reduzido; verificação com JavaScript desativado.

## 24.5 Clareza da disponibilidade

| Verificação | Critério |
|---|---|
| Os oito estados de §11.2 | Distinguíveis **sem cor** |
| «Esgotado» vs. «ponto completo» | Mensagens e saídas distintas |
| Toda a mensagem de indisponibilidade | Tem **as três partes** de §11.1 |
| Estados de data | Cinco estados indisponíveis distinguíveis por forma |
| Nenhum beco sem saída | Toda a negativa tem alternativa clicável |

**Teste com utilizador:** cinco pessoas identificam corretamente porque é que não podem reservar num dado dia, e o que fazer a seguir. **Critério: 5 em 5.**

## 24.6 Diferenciação face à Casa de Panaderos

| Verificação | Critério |
|---|---|
| Preto puro como tinta dominante | Sim — a referência evita o preto |
| Ilustração como camada primária | Sim — a referência é 100% fotográfica |
| Trio secundário em uso real | Sim — não existe no universo da referência |
| Maiúsculas espacejadas | Sim — a referência usa condensadas pesadas |
| **Ausência de forma em cápsula** | Zero ocorrências |
| Nenhuma secção reproduz o layout da referência | Revisão manual bloco a bloco |

## 24.7 Coerência com a marca

- Elementos da identidade usados conforme §7.2: **cada personagem no seu posto**.
- Padrão usado **apenas** nos três lugares permitidos.
- Pássaro **no máximo uma vez** por sessão.
- Terracota apenas em côdea e ação.
- Voz: sem exclamações, sem superlativos, primeira pessoa do plural, dados concretos.
- Ilustrações servidas a partir de **SVG originais**, nunca de recortes de JPEG.

## 24.8 Facilidade de uso

| Fluxo | Critério |
|---|---|
| Reserva completa | ≤ 7 passos, ≤ 3 minutos, primeira vez |
| Encontrar as próximas recolhas | ≤ 2 toques a partir da home |
| Painel: ver a produção de amanhã | **≤ 1 toque** após entrar |
| Painel: marcar um lote entregue | ≤ 3 toques |
| Cancelar uma encomenda | ≤ 3 toques, **sem contactar ninguém** |
| Pausar a subscrição *(fase 2)* | ≤ 3 toques, **sem contactar ninguém** |

## 24.9 Teste visual das duas homes

**Do Documento 01 §23.** A verificação mais rápida e mais reveladora de todo o sistema.

**Procedimento:** colocar a home do FUERZA e a home de Casa de Panaderos lado a lado, reduzidas a 25% e com desfoque aplicado.

**Critério de aprovação:** a mancha de cada uma tem de ser **imediatamente distinguível** — pela distribuição de preto, pela silhueta das ilustrações, pelo ritmo vertical e pela alternância de grelha. Se as duas manchas forem confundíveis, o sistema falhou, independentemente de qualquer outra métrica.

**Frequência: em cada revisão de design.** Não é um teste final.

## 24.10 Desempenho

Do Documento 01 (Prioridade 4) e Documento 02 §13.10:

| Métrica | Alvo | Referência |
|---|---|---|
| Caminho crítico | < 200 KB | ~1 707 KB |
| Pedidos iniciais | < 20 | 66 |
| LCP | < 2,0 s | — |
| CLS | < 0,05 | — |
| INP | < 200 ms | — |
| Famílias tipográficas | 2, ambas usadas | 4, duas usadas |
| Orçamento tipográfico | ≤ 120 KB | 111 KB só em fontes não usadas |

---

## Decisões pendentes que afetam o design

**Nenhuma é decidida aqui.** O sistema reserva-lhes espaço e formato; os valores vêm da configuração.

| ID | Decisão | O que fica à espera |
|---|---|---|
| `DP-02` | **Hora-limite de reserva** | Formato de texto e posição definidos (§12.4); **valor pendente** |
| `DP-09` | Taxonomia das famílias | Sistema cromático definido; **nomes e número pendentes** |
| `DP-13` | Preços | Formato «12,50 €» e tipografia definidos; **valores pendentes** |
| `DP-24` | Formato do código de recolha | Tipografia e superfície definidas; **formato pendente** |
| `DP-25` | Dados dos pontos | Cartão definido; **morada, horários, dias, janelas e capacidades pendentes** |
| `DP-17` | Dados mínimos do cliente | Formulário definido; **campos pendentes** |
| `DP-28` | Modelo de subscrição | SubscriptionCard previsto; **conteúdo depende do modelo** |

**Decisão de design em aberto** (não comercial): a textura de papel de §6.7 entra na fase 1 ou fica para depois. Recomendação: prototipar, medir, incluir só se não custar em desempenho nem em legibilidade.

---

## Próximos documentos

| Doc | Título | Dependências |
|---|---|---|
| **04** | Arquitetura Técnica | `DA-01` (resolvida), `DP-28`, Documento 02 §14 e §15 |
| **05** | Conteúdo em es-ES | Documento 01 §21, Documento 02 §12, e este documento |

---

*Todos os rácios de contraste deste documento foram calculados, não estimados. Nenhum preço, morada, horário de ponto externo, capacidade ou política comercial aqui referido é real.*
