# FUERZA — Relatório de Análise e Direção Criativa

**Documento 01** · Base estratégica e técnica para todo o desenvolvimento
Data: 3 de agosto de 2026
Estado: análise concluída — sem código, sem componentes, sem páginas

---

## Sumário executivo

Analisei os dois materiais em profundidade: o espelho funcional do site Casa de Panaderos (238 ficheiros, 16 MB, 4 páginas principais) e os dois ficheiros de identidade visual do FUERZA.

**A conclusão central é que os dois materiais têm forças opostas, e é exatamente aí que está a oportunidade.**

Casa de Panaderos tem um bom *guião narrativo* — a sequência de argumentação sobre fermentação lenta é genuinamente eficaz — mas está assente numa base técnica frágil: WordPress + Elementor, ~1,7 MB de CSS/JS antes de imagens, zero `<h1>` em três das quatro páginas, `lang="pt-PT"` num site em espanhol, formulários sem `<label>`, texto corrido que falha o contraste mínimo WCAG AA, e conteúdo *placeholder* em inglês visível em produção. Visualmente, é um site sustentado apenas por fotografia: não tem sistema gráfico próprio.

FUERZA tem exatamente o que falta a Casa de Panaderos: **um sistema gráfico completo e proprietário** — um elenco de personagens ilustradas, um padrão de repetição, seis cores, iconografia de valores, e um sistema de embalagem já resolvido. A marca já sabe o que é. O que ainda não existe é o código.

A direção que proponho é, portanto: **não replicar a estética de Casa de Panaderos, mas herdar apenas a sua lógica de argumentação, e construir a superfície visual inteiramente a partir do sistema ilustrado do FUERZA.** É esse sistema — que a referência não possui e não pode possuir — que torna impossível ler o resultado como cópia.

Há um risco real de proximidade que identifico e trato na secção 8: ambas as marcas partilham a dupla creme + terracota. A diferenciação tem de vir do preto puro, do trio cromático secundário e das ilustrações, não da cor base.

---

# PARTE I — Análise: Casa de Panaderos

## 1. Arquitetura e stack

| Camada | Implementação |
|---|---|
| CMS | WordPress 7.0.2 |
| Construtor | Elementor 3.33.4 Pro + tema Hello Elementor |
| Cache | AccelerateWP |
| Localizador de lojas | `superstorefinder-wp` (plugin de terceiros) |
| Hotspots de imagem | `devvn-image-hotspot` |
| Depoimentos | `jet-engine` (Custom Post Type) |
| Encomenda online | Externo — `fermento.food2home.es` |
| Consentimento | CookieHub (CDN externo) |

**Leitura crítica.** É uma arquitetura de *montagem*, não de *construção*. Cada funcionalidade nova chegou como plugin, e cada plugin trouxe o seu próprio CSS, o seu próprio JS e as suas próprias fontes de ícones. O resultado é um site cujo peso não é proporcional ao que ele faz.

O sintoma mais claro: o CPT de depoimentos existe (jet-engine) mas serve **um único depoimento**. Instalou-se um motor de conteúdo dinâmico para gerir um registo.

## 2. Estrutura de páginas e navegação

```
/                                  Home
/casas-de-panaderos/               Localizador de lojas
/trabaja-con-nosotros/             Franquia
/testimonios/                      Índice de depoimentos
/testimonios/az-nutricion/         Depoimento individual
/politica-de-privacidad-y-cookies/
/terminos-y-condiciones/
```

**Problema de navegação — o menu tem apenas dois itens:** «Trabaja con Nosotros» e «Casas de Panaderos». Não há link para «Testimonios» (a página existe e está indexada, mas é órfã na navegação principal). Não há link explícito para a loja online no menu — o Click & Collect vive numa secção da home e num botão do rodapé.

**Consequência direta:** a ação comercial mais importante do site — comprar pão — não tem presença permanente na navegação. O utilizador que chega a meio da página e quer encomendar tem de fazer scroll à procura.

**Problema de arquitetura de marca:** o site usa três nomes em simultâneo — «Casa de Panaderos», «Fermento» e «Fermento – Casa de Panaderos». O `<title>` da home é `Homepage - Fermento - Casa de Panaderos`. O rodapé diz «comunidade de Fermento». O menu diz «Casas de Panaderos». O visitante não sabe como se chama a marca.

## 3. Ritmo da home e estrutura dos blocos

A sequência de blocos, pela ordem em que o utilizador os encontra:

| # | Bloco | Função narrativa |
|---|---|---|
| 1 | Hero — «NUESTRO INGREDIENTE SECRETO NO ESTÁ EN LA MASA, ESTÁ EN EL TIEMPO.» | Tese / posicionamento |
| 2 | «Pan artesanal de larga fermentación» | Categoria |
| 3 | «Pide y recoge» → Click & Collect | Ação comercial precoce |
| 4 | «El valor de la fermentación lenta» + 3 parágrafos | Argumentação |
| 5 | 3 benefícios (Bienestar digestivo / Energía natural / Sabor real) via hotspots | Prova |
| 6 | Depoimento (AZ Nutrición) | Validação externa |
| 7 | Click & Collect — passos 01/02/03 | Conversão |
| 8 | Rodapé + newsletter | Retenção |

**O que está bem feito e vale a pena herdar:**

O arco narrativo é sólido. Abre com uma afirmação de posicionamento memorável (*o ingrediente secreto é o tempo*), desenvolve o argumento técnico (fermentação lenta), converte esse argumento em benefícios concretos para o corpo, valida com uma nutricionista, e só depois pede a compra. É uma estrutura de persuasão correta: **razão antes de pedido**.

A numeração `01 / 02 / 03` no fluxo de encomenda reduz a fricção percebida — comunica «são só três passos».

**O que está mal resolvido:**

- **A ação comercial aparece duas vezes** (blocos 3 e 7) com pesos diferentes e sem hierarquia clara entre elas. O bloco 3 interrompe a argumentação antes de ela existir.
- **Os três benefícios estão escondidos atrás de hotspots.** O texto que explica *porque é que* o pão assenta melhor — o argumento mais forte do site — só aparece se o utilizador clicar. Em mobile, esse padrão é hostil. O conteúdo existe no DOM mas está invisível por omissão.
- **Um único depoimento** apresentado como se fosse uma secção de depoimentos.
- **Não há produtos no site.** Uma padaria cujo website não mostra o pão que faz. Não há catálogo, não há preços, não há descrição de referências. O utilizador é enviado para um domínio externo para descobrir o que existe.

## 4. Sistema de design

Os valores abaixo foram extraídos do CSS real aplicado, não estimados visualmente.

**Paleta**

| Token | Hex | Uso |
|---|---|---|
| Creme | `#F9F5EF` | Fundo dominante |
| Creme claro | `#FFFCF8` | Fundo alternado |
| Creme escuro | `#EEEAE4` | Divisores, cartões |
| Tan | `#D3A474` | Destaque quente |
| Terracota | `#C9633C` | CTA / acento |
| Tinta | `#333333` | Títulos |
| Corpo | `#7A7A7A` | Texto corrido |

**Achado crítico — o design kit está vazio.** O kit global do Elementor (`post-6.css`) ainda contém integralmente os valores de fábrica: `--e-global-color-primary: #6EC1E4` (azul), `--e-global-color-accent: #61CE70` (verde), tipografia global `Roboto` / `Roboto Slab`. Nenhum destes valores corresponde ao design visível.

Ou seja: **não existe sistema de design.** O aspeto do site é produzido por 38 regras CSS de ID único por página (`.elementor-206 .elementor-element-1030e1f{...}`) — estilos escritos à mão widget a widget, sem herança e sem tokens. Mudar a cor de acento implica editar dezenas de widgets manualmente em várias páginas.

**Tipografia**

Aplicadas: `Lato` (corpo/UI) e `Biryani` (display). Declaradas no kit e carregadas na mesma: `Roboto` e `Roboto Slab`. **Quatro famílias descarregadas, duas usadas** — 111 KB de CSS de fontes servido para nada.

Escala em uso: 13px → 100px, o que é uma amplitude saudável e dá bom contraste tipográfico ao hero.

**Layout:** container de 1140px. Botões e etiquetas com `border-radius: 150px` (forma de cápsula). Breakpoints: 479 / 767 / 1024 / 1366px, com a troca principal aos 767px.

## 5. Animações e movimento

Inventário real do que corre na home:

- 9 animações de entrada Elementor: `fadeIn` (5) e `fadeInDown` (4)
- 18 referências a `motion_fx`
- 32 referências a `_transform`
- **Lottie carregado: 247 KB de JavaScript**
- Zero elementos *sticky*, zero paralaxe, zero vídeo de fundo

**Leitura crítica.** O vocabulário de movimento é pobre e genérico — dois efeitos de *fade*, aplicados por widget, sem intenção narrativa. Não há continuidade entre secções: cada bloco aparece isoladamente, o que produz a sensação de «slides empilhados» em vez de uma página com corrente própria.

E o custo é desproporcionado: **247 KB de biblioteca Lottie** carregados no caminho crítico. É a maior peça de JavaScript do site — maior que o jQuery — para servir animações que, no essencial, são dois *fades* que o CSS faria em 300 bytes.

Além disso, as animações Elementor funcionam adicionando a classe `elementor-invisible` ao elemento e removendo-a por JavaScript. Se o JS falhar, atrasar ou for bloqueado, **o conteúdo fica permanentemente invisível.** É movimento que compromete o acesso ao conteúdo.

## 6. Responsive

A abordagem é a de *duplicar e esconder*: 3 blocos marcados `elementor-hidden-desktop`, 3 `elementor-hidden-mobile`, 3 `elementor-hidden-tablet`, 3 `elementor-hidden-laptop`.

Isto explica os títulos repetidos que encontrei na extração de conteúdo: «Bienestar digestivo», «Energía de forma natural» e «Sabor real» aparecem **duas vezes** no DOM. A navegação do rodapé aparece **quatro vezes**.

**Três consequências, todas más:**
1. Todo o utilizador descarrega a versão que nunca vai ver.
2. Os leitores de ecrã podem anunciar conteúdo duplicado.
3. Cada alteração de conteúdo tem de ser feita em dois ou quatro sítios — e mais cedo ou mais tarde dessincronizam-se.

Não é *mobile-first*: é *desktop-first com variantes remendadas*.

## 7. Acessibilidade

Auditoria com resultados verificados:

| Verificação | Resultado |
|---|---|
| `<h1>` na home | **0** |
| `<h1>` no localizador | **0** |
| `<h1>` na franquia | **0** |
| `<h1>` em depoimentos | 1 ✓ |
| `<label>` em formulários | **0** |
| `lang` do documento | **`pt-PT`** (site em espanhol) |
| Texto corrido `#7A7A7A` sobre `#F9F5EF` | **3,95:1 — falha AA** (mínimo 4,5:1) |
| Terracota `#C9633C` sobre creme | **3,63:1 — falha AA** |
| Branco sobre terracota (botão principal) | **3,94:1 — falha AA** |
| `alt` em imagens | 12/12 presentes, 8 vazios |
| `aria-label` | 5 ocorrências |

**Os três defeitos mais graves:**

**`lang="pt-PT"` num site inteiramente em espanhol.** É a razão pela qual o *skip link* diz «Pular para o conteúdo» em português. Um leitor de ecrã vai pronunciar o espanhol com fonética portuguesa — o site torna-se incompreensível para utilizadores cegos. O Google também usa este atributo para segmentação linguística.

**Ausência total de `<label>`.** Os campos do formulário identificam-se só por *placeholder*, que desaparece assim que o utilizador escreve. Para um leitor de ecrã, o campo é anónimo.

**A cor do texto corrido falha o contraste mínimo.** Não é uma subtileza: é o texto de leitura de todo o site, e o botão de ação principal falha na mesma medida.

## 8. Performance

Medição do caminho crítico da home:

| Recurso | Quantidade | Peso (não comprimido) |
|---|---|---|
| HTML | 1 | 171 KB |
| CSS | **36 ficheiros** | 509 KB |
| JavaScript | **30 ficheiros** | 1 027 KB |
| **Total antes de imagens/fontes** | **66 pedidos** | **≈ 1,7 MB** |

Imagens: 9,4 MB em `uploads`. Ficheiro individual mais pesado: 864 KB (`Fermento_06.png` — uma fotografia guardada em PNG). Formatos: apenas JPG e PNG. **Zero WebP, zero AVIF, zero `<picture>`.** Apenas 6 das 12 imagens da home têm `loading="lazy"`; nas páginas de localizador e franquia, nenhuma tem.

Maiores desperdícios identificados:

| Ficheiro | Peso | Avaliação |
|---|---|---|
| `lottie.min.js` | 247 KB | Para dois *fades* |
| `fontawesome-all.min.css` | 104 KB | + 23 KB + 17 KB de *shims* |
| `roboto.css` + `robotoslab.css` | 111 KB | Fontes nunca usadas no design |
| `jquery.min.js` | 86 KB | Dependência do Elementor |
| `mega-superstorefinder.js` | 55 KB | Localizador de lojas |

Só na soma de Lottie + Font Awesome + fontes não usadas estão **~500 KB de peso removível sem perder uma única funcionalidade visível.**

## 9. SEO

| Elemento | Estado |
|---|---|
| `<title>` da home | `Homepage - Fermento - Casa de Panaderos` |
| `meta description` | 69 caracteres (curta; o ideal são 150–160) |
| `<h1>` | Ausente em 3 das 4 páginas |
| Open Graph | 7 tags ✓ |
| Twitter Card | 7 tags ✓ |
| JSON-LD | 1 bloco |
| `hreflang` | Ausente |
| `lang` | Incorreto (`pt-PT`) |

O `<title>` começa pela palavra «Homepage» — um termo sem valor de pesquisa a ocupar a posição de maior peso. Combinado com a ausência de `<h1>`, o Google não recebe nenhum sinal forte sobre o tema da página.

Não encontrei `LocalBusiness` nem `Bakery` em dados estruturados — para um negócio com lojas físicas e ambição de franquia, é a omissão de SEO mais cara do site.

## 10. Conteúdo *placeholder* em produção

O achado mais surpreendente. A página do localizador de lojas serve, no HTML público, as etiquetas de fábrica do plugin, em inglês:

> «Placeholder store name.» · «Placeholder address.» · «Custom Field 1 placeholder» · «Custom Field 2 placeholder» *(até ao 6)* · «Website placeholder» · «Email placeholder» · «Telephone placeholder» · «Fax placeholder» · «Description placeholder» · «Contact Store» · «Close» · «Send Message» · «I have consent to use Google Maps and having this website store my submitted information so they can respond to my inquiry»

Uma marca que se vende como premium, e que anuncia prémios de melhor franquia, tem texto de configuração por traduzir na página que os potenciais franquiados visitam. Inclui um campo «Fax».

## 11. Avaliação da reconstrução (`template/`)

A pasta `template/` é uma reconstrução limpa em HTML/CSS/JS puro (1 572 linhas, sem *build*, sem dependências). É materialmente melhor que o original e merece ser reconhecida como tal:

**Pontos fortes:** tokens de design reais em CSS custom properties; escala tipográfica fluida com `clamp()`; *skip link*; `aria-expanded`/`aria-controls` no menu; fecho com `Escape` com devolução de foco; `:focus-visible` visível; `prefers-reduced-motion` respeitado em CSS **e** em JS; `width`/`height` nas imagens (evita *layout shift*); `loading="lazy"` abaixo da dobra; numeração de passos por *counter* CSS em vez de texto; `IntersectionObserver` com `unobserve` após revelar.

**Limitações para o nosso caso:** herda a paleta e as fontes da referência (têm de sair); herda o problema de contraste do texto corrido; não tem catálogo de produtos, carrinho, reservas, subscrições nem painel de administração — que são precisamente os quatro sistemas que o FUERZA precisa; e é estático, sem CMS.

**Decisão:** o `template/` serve como *referência de boas práticas de acessibilidade e de tokens*. Não serve como base de código para o FUERZA, porque o âmbito funcional do FUERZA é substancialmente maior.

---

# PARTE II — Análise: identidade FUERZA

Extraída integralmente das duas imagens em `public/`.

## 12. Leitura do logótipo (`fuerza.jpeg`)

**Composição, de cima para baixo:** espiga de cereal → pão terracota → duas figuras a erguer o pão → «DESDE» / «2024» a flanquear → «FUERZA» → «OBRADOR DE MASA MADRE» → «ASTURIAS · ESPAÑA».

**O gesto central é a coisa mais importante da marca.** Duas pessoas — uma mulher de avental e coque, um homem de calças claras — erguem em conjunto um pão maior do que elas. Não é uma padaria a exibir produto: é **duas pessoas a levantar algo pesado, juntas**. O nome «FUERZA» não descreve o pão, descreve o esforço partilhado que o produz.

Isto tem uma consequência direta na direção do site, e volto a ela na Parte V: **o herói do FUERZA são as pessoas, não o pão.** Casa de Panaderos fotografa produto; FUERZA ilustra trabalho.

**Estilo de ilustração:** silhuetas planas a preto puro, traço de recorte manual, sem gradientes e sem volume. Rostos de perfil reduzidos ao mínimo — um ponto para o olho, uma linha para o nariz. Textura ligeira de impressão no pão, que evoca serigrafia ou xilogravura. É uma linguagem de **cartaz popular**, não de ilustração digital.

**Nota sobre o logótipo:** as duas imagens mostram **duas variantes do wordmark** — no logótipo principal, uma serifa de alto contraste com hastes fortes; na folha de identidade, uma sem-serifa geométrica com grande espacejamento. Isto não é um erro: corresponde ao que a folha declara — «Tipografía principal: estilo hecho a mano; secundaria: limpia, simple y legible». São duas expressões da mesma marca e o site deve saber quando usar cada uma.

## 13. Leitura da folha de identidade (`fuerza_info.jpeg`)

**A ideia, nas palavras da própria marca:**

> «Pan artesanal de masa madre elaborado con harinas locales y tiempo real. Transformamos lo simple en algo que alimenta de verdad.»

> «FUERZA ES MÁS QUE PAN, ES CULTURA, ES ORIGEN, ES ALGO QUE SE COMPARTE.»

**Lo que nos mueve** (cinco pilares declarados):
Hecho a mano · Ingredientes locales · Proceso lento y natural · Respeto por la tradición · Comunidad y cercanía

**Os quatro valores com ícone próprio** — e cada um já tem uma personagem atribuída:

| Valor | Personagem |
|---|---|
| Tradición que se siente | Mulher a servir pão numa travessa |
| Ingredientes que cuentan | Homem de chapéu com molho de espigas |
| Tiempo que transforma | Mulher de avental com baguete |
| Comunidad que nos inspira | Padeiro com pá de forno |

**Assinaturas verbais recolhidas:**
- «SOMOS UN OBRADOR PEQUEÑO, PERO CON MUCHA FUERZA.»
- «PAN QUE NUTRE HISTORIAS QUE PERDURAN.»
- «HECHO CON TIEMPO Y FUERZA» *(autocolante)*

**Etiqueta de produto** — revela a estrutura de ficha técnica que a marca já usa:
PAN DE MASA MADRE / TRIGO Y CENTENO / HARINA LOCAL / FERMENTACIÓN LENTA / HECHO EN ASTURIAS

## 14. Paleta

| Cor | Hex | Papel |
|---|---|---|
| Creme | `#F5F1E8` | Fundo dominante — o «papel» da marca |
| Preto | `#000000` | Tinta: tipografia, ilustração, traço |
| Terracota | `#E4572E` | Acento primário — a cor da côdea |
| Amarelo | `#F2C14E` | Secundária |
| Verde | `#2E7D67` | Secundária |
| Azul | `#4C78A8` | Secundária |

> A folha de identidade escreve o terracota como `#E4S72E`. É uma gralha tipográfica — a leitura correta é **`#E4572E`**, confirmada pela amostra de cor. Registo aqui para não se propagar para o código.

**Auditoria de contraste que fiz a esta paleta** (fundamental, e determina decisões de design já a seguir):

| Combinação | Rácio | Veredicto |
|---|---|---|
| Preto sobre creme | **18,63:1** | AAA — excelente |
| Verde sobre creme | 4,39:1 | Falha AA para texto normal; OK para UI/texto grande |
| Azul sobre creme | 4,09:1 | Falha AA para texto normal; OK para UI/texto grande |
| Terracota sobre creme | 3,27:1 | Só para texto grande e elementos gráficos |
| Amarelo sobre creme | 1,49:1 | **Nunca para texto** — apenas preenchimento |
| **Preto sobre terracota** | **5,70:1** | **AA ✓** |
| Branco sobre terracota | 3,68:1 | **Falha** |
| Preto sobre amarelo | 12,51:1 | AA ✓ — excelente |
| Branco sobre verde | 4,95:1 | AA ✓ |
| Branco sobre azul | 4,61:1 | AA ✓ |

**Duas decisões saem diretamente destes números:**

**1. O botão principal do FUERZA é terracota com texto PRETO, não branco.** Branco sobre terracota falha (3,68:1); preto passa com folga (5,70:1). E isto é uma boa notícia dupla: é a escolha acessível *e* a escolha mais fiel à marca, porque o logótipo já usa preto puro como tinta dominante. Acessibilidade e identidade apontam para o mesmo lado — não há compromisso a fazer.

Sublinho o contraste com a referência: o botão principal de Casa de Panaderos é branco sobre terracota, a 3,94:1. **Falha.** Copiar esse padrão seria importar um defeito.

**2. O texto corrido do FUERZA é preto sobre creme, a 18,63:1.** Casa de Panaderos usa cinzento `#7A7A7A` a 3,95:1, que falha. A escolha do FUERZA é simultaneamente mais legível e mais fiel — a marca é desenhada a tinta preta.

## 15. Sistema gráfico

Este é o ativo mais valioso do FUERZA, e é o que a referência não tem.

**Elenco de personagens** — pelo menos seis figuras distintas já desenhadas: mulher com travessa, homem de chapéu com espigas, mulher com baguete, padeiro com pá, figura a caminhar com pão, mulher de avental. Todas na mesma linguagem: silhueta preta, plana, traço manual.

**Elementos gráficos:** espiga de cereal (usada isolada como marca de canto), pão terracota (o único objeto com cor), pássaro/ganso verde (aparece nos autocolantes — nota de fauna asturiana).

**Padrão:** repetição dispersa e irregular de personagens, pães e espigas sobre creme. Aplicado em papel manteca, caixa de produto e saco de papel. Densidade baixa, distribuição orgânica — não é uma grelha.

**Sistema de embalagem já resolvido** — copo de café, papel manteca, embrulho de pão, autocolantes, caixa de produto, saco de papel, saco de pão, etiqueta pendente. Substrato kraft e creme; nunca superfícies brilhantes.

## 16. Personalidade e tom

**Personalidade:** calorosa, terrena, coletiva, honesta, sem pretensão. A marca diz-se pequena — «somos un obrador pequeño» — e transforma isso em força, não em desculpa.

**Tom de comunicação:** frases curtas, declarativas, em primeira pessoa do plural. Constrói por oposição («más que pan», «pequeño, pero con mucha fuerza») e por atribuição de agência ao tempo («tiempo que transforma»). Não usa superlativos, não usa vocabulário técnico, não usa linguagem de marketing.

**O que a marca nunca deve parecer:** industrial, apressada, luxuosa, minimalista-fria, corporativa, ou grande.

---

# PARTE III — Relatório comparativo

| Dimensão | Casa de Panaderos | FUERZA (potencial) | Vantagem |
|---|---|---|---|
| Sistema gráfico | Inexistente — só fotografia | Elenco ilustrado + padrão + iconografia | **FUERZA, decisivamente** |
| Paleta | Creme + terracota + cinzentos | Creme + preto + terracota + trio secundário | FUERZA |
| Contraste de texto | Falha AA (3,95:1) | 18,63:1 possível | FUERZA |
| Tipografia | Lato + Biryani (genéricas) | Display manual + secundária limpa | FUERZA |
| Arquitetura | WordPress + Elementor + 6 plugins | A definir — livre | FUERZA |
| Peso do caminho crítico | ~1,7 MB, 66 pedidos | Alvo < 200 KB | FUERZA |
| Narrativa | **Boa — arco sólido** | A construir sobre a mesma lógica | **Referência** |
| Fluxo de encomenda | Externo, marca perdida | Interno, marca mantida | FUERZA |
| Catálogo de produtos | **Não existe** | Necessário | FUERZA |
| Reservas | Não existe | Necessário | FUERZA |
| Subscrições | Não existe | Necessário | FUERZA |
| Painel de administração | WP-Admin genérico | Desenhado à medida | FUERZA |
| Movimento | 2 *fades* + 247 KB de Lottie | A definir, em CSS | FUERZA |
| Responsive | Duplicar-e-esconder | Mobile-first genuíno | FUERZA |
| SEO | Sem `<h1>`, `lang` errado | Correto de raiz | FUERZA |
| Identidade de marca | Três nomes em conflito | Um nome, um sistema | FUERZA |
| Sentido de lugar | Genérico | Astúrias, explícito | FUERZA |

**A única coluna em que a referência ganha é a narrativa.** É por isso que essa é a única coisa que devemos herdar dela — e mesmo essa, reescrita.

---

# PARTE IV — Oportunidades de melhoria

Ordenadas por impacto sobre o esforço.

## Prioridade 1 — Corrigir por omissão

Erros da referência que o FUERZA evita simplesmente por não os cometer. Custo zero, benefício alto.

1. `lang="es"` correto, com `hreflang` se houver versão em asturiano ou inglês.
2. Exatamente **um** `<h1>` por página, descritivo.
3. `<label>` explícito em todos os campos de formulário.
4. Contraste AA em todo o texto — a paleta FUERZA já o permite (ver §14).
5. Zero conteúdo *placeholder* em produção — validação automática antes de publicar.
6. Zero duplicação de DOM para responsive — uma marcação, vários layouts.
7. Um só nome de marca, em todo o lado.
8. `<title>` que comece pela proposta de valor, nunca por «Homepage».

## Prioridade 2 — Funcionalidade que a referência não tem

9. **Catálogo de produtos.** Uma padaria tem de mostrar o seu pão. Cada referência com fotografia, farinha, tempo de fermentação, alergénios, peso, preço e dias de fabrico. A etiqueta de produto da folha de identidade já define esta estrutura de ficha — o site deve usá-la tal e qual.

10. **Encomenda dentro do domínio.** Casa de Panaderos envia o cliente para `food2home.es` e perde a marca no momento da compra. O FUERZA tem de manter carrinho, escolha de dia/hora de levantamento e pagamento na sua própria casa.

11. **Reservas com produção limitada.** «Produção limitada» é um valor declarado da marca — o sistema deve refleti-lo de forma honesta: quantidade disponível por dia e por referência, com fecho de encomendas a uma hora definida. A escassez aqui é real, e mostrá-la é ao mesmo tempo verdadeiro e persuasivo.

12. **Subscrições.** É o modelo natural do pão: um produto que se compra todas as semanas. Plano semanal ou quinzenal, escolha de referências, pausa e retoma sem contactar ninguém, alteração de morada e cancelamento autónomo. Reduz a fricção de recompra a zero e transforma receita variável em receita previsível.

13. **Painel de administração à medida.** O WP-Admin obriga um padeiro a navegar um CMS genérico. O painel do FUERZA deve responder às perguntas que um obrador faz de facto: *quantos pães tenho de fazer amanhã?*, *que subscrições saem esta semana?*, *que encomendas ficaram por levantar?*. Vista principal = mapa de produção do dia seguinte.

## Prioridade 3 — Experiência e narrativa

14. **Revelar os benefícios em vez de os esconder.** Os hotspots de Casa de Panaderos ocultam o melhor argumento do site. No FUERZA, o conteúdo equivalente deve estar visível por omissão — o movimento pode acompanhar a leitura, mas nunca ser a condição de acesso ao conteúdo.

15. **Uma só ação comercial na home, no momento certo.** Depois do argumento, não antes. CTA permanente no cabeçalho para quem já decidiu.

16. **Mostrar o processo como cronologia.** «Fermentación lenta» é uma afirmação abstrata até se traduzir em horas. Uma linha temporal — massa mãe alimentada → amassadura → repouso de 18h → forno → loja — transforma o argumento em prova, e é conteúdo que a referência nunca constrói.

17. **Ancorar nas Astúrias.** «ASTURIAS · ESPAÑA» está no logótipo. Nomear os moinhos e as farinhas locais converte uma declaração de valor em facto verificável.

18. **Storytelling pelas pessoas.** O logótipo diz que a marca são duas pessoas a erguer um pão. O site deve apresentar quem faz o pão, com nome e rosto.

## Prioridade 4 — Técnico

19. **Orçamento de performance explícito.** Alvo: < 200 KB no caminho crítico (contra ~1,7 MB da referência); LCP < 2,0 s; CLS < 0,05; INP < 200 ms. Verificado em CI, não à mão.

20. **Imagens modernas.** AVIF com fallback WebP, `<picture>` com `srcset`, dimensões sempre declaradas, `fetchpriority="high"` na imagem do hero e `loading="lazy"` em todo o resto.

21. **Fontes: só o que se usa.** Auto-alojadas, subconjunto latino, `font-display: swap`, `preload` da fonte do hero. Nunca as quatro famílias da referência para usar duas.

22. **Ilustrações em SVG, não em bitmap.** Todo o elenco de personagens é de silhueta plana — o formato ideal é SVG. Escala infinita, poucos KB, animável por CSS, e pode herdar cor por `currentColor`.

23. **Dados estruturados.** `Bakery`, `LocalBusiness` com horários e morada, `Product` com disponibilidade, `FAQPage`. É a omissão de SEO mais cara da referência.

24. **Movimento em CSS.** Nada de 247 KB de Lottie. Todo o vocabulário de movimento proposto na §19 corre em transições e *keyframes* nativos.

---

# PARTE V — Direção criativa proposta

## 17. Conceito: **«El pan que se levanta entre dos.»**

O logótipo já contém a ideia inteira: duas pessoas erguem um pão maior do que elas. Fuerza não é a força de uma pessoa — é o que duas conseguem levantar juntas. É o padeiro e o moleiro. É o obrador e o bairro.

Esta é a diferença essencial face à referência, e é o que garante que ninguém lê o resultado como cópia:

> **Casa de Panaderos fala do tempo. FUERZA fala das pessoas que esperam por ele.**

Casa de Panaderos posiciona-se sobre um processo (fermentação lenta) e fotografa produto. FUERZA posiciona-se sobre uma relação (quem faz, para quem) e ilustra trabalho. O argumento da fermentação lenta continua a existir no FUERZA — é verdade sobre o produto — mas deixa de ser a tese e passa a ser prova. A tese é a comunidade.

## 18. Sistema visual

**O creme é papel, o preto é tinta.** Toda a página deve ler-se como material impresso: cartaz, saco, etiqueta. Não como interface.

**A cor é escassa e faz sentido.** O terracota aparece onde há côdea e onde há ação — pão, botões, acentos. O trio secundário (amarelo, verde, azul) não decora: **classifica**. Proponho atribuir uma cor a cada família de produto, exatamente como a marca já faz nos autocolantes:

| Cor | Família |
|---|---|
| Terracota `#E4572E` | Pães de massa mãe |
| Amarelo `#F2C14E` | Bolaria e doces |
| Verde `#2E7D67` | Assinatura / edições limitadas |
| Azul `#4C78A8` | Subscrições e café |

Assim uma decisão gráfica torna-se uma ferramenta de navegação: o utilizador aprende as cores em dois ecrãs e passa a orientar-se por elas.

**As ilustrações trabalham, não enfeitam.** Cada personagem tem um posto:

| Personagem | Onde |
|---|---|
| Mulher com travessa | Bloco «Tradición» |
| Homem com espigas | Bloco «Ingredientes» / origem das farinhas |
| Mulher com baguete | Bloco «Tiempo» / cronologia de fermentação |
| Padeiro com pá | Bloco «Comunidad» / equipa |
| Figura a caminhar com pão | Fluxo de encomenda e levantamento |
| Espiga isolada | Divisor entre secções, marca de canto |
| Pássaro verde | Estados vazios, confirmações, momentos de surpresa |

**O padrão é reservado.** Em toda a superfície, cansa. Proponho três usos apenas: fundo do rodapé, faixa de confirmação de encomenda e cabeçalhos de páginas secundárias. Fica raro, e por isso continua a ter efeito.

## 19. Movimento

Princípio: **nada se move sem razão, e nada se esconde à espera de JavaScript.**

Isto é uma correção direta à referência, onde o conteúdo nasce invisível (`elementor-invisible`) e só aparece se o JS correr. No FUERZA, o conteúdo é visível por omissão; o movimento é um enriquecimento progressivo que pode falhar sem consequências.

Vocabulário proposto, todo em CSS:

- **A massa que cresce.** Blocos entram com uma subida curta (16–24 px) e uma escala mínima (0,98 → 1), com ease-out lento. Evoca fermentação. Um só gesto, aplicado com consistência — é isso que dá corrente à página, em vez dos *fades* isolados da referência.
- **A tinta que assenta.** Títulos entram com opacidade e um deslocamento horizontal quase impercetível, como impressão a assentar no papel.
- **O elenco que caminha.** As personagens em silhueta permitem animação de traço em SVG: a espiga desenha-se, a figura desliza para dentro do bloco. Custo: alguns KB.
- **A cronologia que se preenche.** Na linha temporal de fermentação, a linha desenha-se ao scroll — o utilizador *vê* passar o tempo.
- **Sem paralaxe, sem scroll sequestrado, sem contadores.** São gestos de agência digital, e a marca não é isso.

`prefers-reduced-motion` desliga tudo o que é decorativo e mantém tudo o que informa.

## 20. Tipografia

O que a marca pede: *«principal: estilo hecho a mano; secundaria: limpia, simple y legible».*

**Display** — precisa de carácter de impressão manual, com peso. Direções a testar, todas com licença aberta:
- **Bricolage Grotesque** — grotesca contemporânea com irregularidades deliberadas; variável, muito eficiente
- **Fraunces** — serifa variável com eixo *«soft»* e *«wonk»*, ajustável até ficar próxima do wordmark do logótipo
- **Instrument Serif** — alto contraste, próximo da variante serifada do wordmark

**Secundária** — legibilidade sem personalidade a competir:
- **Inter** ou **Public Sans** — neutras, excelente legibilidade em ecrã, variáveis

**Regra:** duas famílias, no máximo. Variáveis, para uma só descarga cobrir toda a escala de pesos. Auto-alojadas.

**Nota tipográfica de marca:** o wordmark usa grande espacejamento em maiúsculas («F U E R Z A», «ASTURIAS · ESPAÑA»). É um traço distintivo e deve migrar para o site — em *eyebrows*, etiquetas e navegação — mas **nunca em texto corrido**, onde destrói a legibilidade.

## 21. Voz

Herdar da folha de identidade, sem invenção:

- Primeira pessoa do plural. «Hacemos», «amasamos», «esperamos».
- Frases curtas e declarativas.
- Dar agência ao tempo: «tiempo que transforma».
- Honestidade sobre a escala: «somos un obrador pequeño».
- Números concretos em vez de adjetivos: «18 horas de fermentación», não «larga fermentación».

Aplicado à interface, e não só ao marketing: uma encomenda esgotada diz «Hoy ya no queda. Mañana a las 7 salen 40 más.» — informativo, honesto, e na voz da marca.

---

# PARTE VI — Arquitetura de informação

```
/                        Home
/pan                     Catálogo — filtrável por família (cor)
  /pan/[slug]            Ficha de produto (estrutura da etiqueta da marca)
/obrador                 Processo — cronologia de fermentação
/nosotros                Pessoas, Astúrias, farinhas, moinhos
/suscripciones           Planos de subscrição
/reservas                Reserva e levantamento
/donde-estamos           Loja(s), horários, mapa
/diario                  Notas do obrador — SEO e comunidade
/contacto
/legal/*

/cuenta                  Área de cliente — encomendas, subscrição, dados
/admin                   Painel do obrador
  /admin/produccion      Mapa de produção do dia seguinte (vista principal)
  /admin/pedidos
  /admin/suscripciones
  /admin/productos
  /admin/contenido
```

**Diferenças face à referência, e porquê:**

- **`/pan` existe.** A referência não tem catálogo — é a sua maior falha funcional.
- **`/suscripciones` e `/reservas` são páginas de primeiro nível**, não secções perdidas numa home.
- **`/obrador` separa o processo da empresa.** Em Casa de Panaderos, ambos estão comprimidos na home.
- **`/testimonios` não existe como página.** A referência tem uma página inteira para um depoimento, e nem sequer a liga no menu. As provas sociais vivem junto do que provam: no produto, no plano de subscrição.
- **`/diario` é novo.** Conteúdo regular do obrador — porta de entrada de SEO de cauda longa e ferramenta de comunidade que a referência não tem.

## 22. Ritmo da home proposto

| # | Bloco | Função | Diferença face à referência |
|---|---|---|---|
| 1 | Hero — as duas figuras, tese de marca | Posicionamento | Ilustração, não fotografia de produto |
| 2 | O que sai do forno hoje — 3–4 produtos com disponibilidade real | Produto + escassez honesta | **Não existe na referência** |
| 3 | Cronologia de fermentação | Prova | Substitui os hotspots escondidos |
| 4 | Os quatro valores, com as personagens da marca | Identidade | Usa iconografia própria |
| 5 | Origem — Astúrias, farinhas, moinhos | Credibilidade | **Não existe na referência** |
| 6 | Subscrição | Conversão recorrente | **Não existe na referência** |
| 7 | Encomenda e levantamento — três passos | Conversão | Herda a clareza do 01/02/03 |
| 8 | As pessoas do obrador | Comunidade | **Não existe na referência** |
| 9 | Rodapé com padrão + newsletter | Retenção | Superfície de marca |

O produto aparece no bloco 2, não no fim. É a maior correção de ritmo face à referência: quem chega a um site de padaria quer ver pão, e Casa de Panaderos nunca lho mostra.

---

# PARTE VII — Direção técnica

Proposta para decisão — não é uma escolha fechada.

| Camada | Proposta | Razão |
|---|---|---|
| Framework | Next.js (App Router) | Renderização estática por omissão, com dinâmico só onde é preciso (stock, carrinho) |
| Estilo | CSS com tokens em custom properties | Um só sítio para a paleta; sem CSS morto |
| Conteúdo | CMS *headless* | O obrador tem de poder editar sem tocar em código |
| Comércio | Stripe (pagamentos + subscrições) | Subscrição resolvida sem construir faturação |
| Imagens | AVIF/WebP com `next/image` | Corrige o maior peso da referência |
| Ilustrações | SVG em componentes | Escaláveis, animáveis, herdam cor |
| Alojamento | *Edge* com CDN | LCP baixo em Espanha |
| Testes | Lighthouse CI + axe-core em CI | Um `<h1>` em falta ou um contraste abaixo de AA falham o *build* |

**Princípio arquitetural que resume a lição da referência:**

Casa de Panaderos instalou um plugin por cada necessidade e pagou o preço em peso, acessibilidade e coerência. **O FUERZA deve construir um pequeno conjunto de componentes próprios e reutilizá-los** — cartão de produto, faixa de disponibilidade, passo de cronologia, bloco de personagem, campo de formulário. Menos peças, usadas mais vezes.

---

# PARTE VIII — Riscos

## 23. Risco principal: parecer uma cópia

**É um risco real e devo ser direto sobre ele.** As duas marcas partilham a mesma dupla cromática de base — creme quente com acento terracota — e os valores estão muito próximos:

| | Casa de Panaderos | FUERZA |
|---|---|---|
| Creme | `#F9F5EF` | `#F5F1E8` |
| Terracota | `#C9633C` | `#E4572E` |

Se o site do FUERZA for construído sobre creme + terracota + fotografia de pão + retícula de três colunas, **vai parecer o mesmo site**, independentemente do conteúdo. É uma paleta comum a todo o setor da panificação artesanal.

**Mitigação — quatro separações deliberadas:**

1. **Preto puro como tinta dominante.** Casa de Panaderos evita o preto (usa `#333333` e cinzentos). O FUERZA é desenhado a preto puro. É a diferença mais visível a três metros de distância, e a paleta da marca já a exige.
2. **Ilustração no lugar da fotografia como camada primária.** A referência é 100% fotográfica. O FUERZA lidera com silhuetas. A fotografia entra como apoio — produto e pessoas reais — nunca como estrutura da página.
3. **O trio secundário usado a sério.** Amarelo, verde e azul não existem no universo de Casa de Panaderos. Usá-los como sistema de classificação de produto cria uma assinatura cromática que a referência não pode ter.
4. **Densidade tipográfica diferente.** A referência usa maiúsculas condensadas e pesadas no hero. O FUERZA usa maiúsculas *espacejadas* — o traço do wordmark. Produz uma textura de página imediatamente distinta.

**Verificação prática:** colocar as duas homes lado a lado, reduzidas a 25% e desfocadas. Se a mancha for distinguível, a separação está feita. Sugiro fazer este teste em cada revisão de design.

## 24. Outros riscos

| Risco | Mitigação |
|---|---|
| Produção limitada gera frustração | Comunicar disponibilidade com antecedência; lista de espera; subscrição garante lugar |
| Subscrição é complexa de operar | Começar com um plano semanal simples; alargar depois |
| Painel demasiado ambicioso para a fase 1 | Fase 1 = ver e imprimir a produção do dia seguinte. Nada mais |
| Ilustrações disponíveis só em JPEG achatado | **Necessário obter os originais vetoriais.** Ver próximos passos |
| Marca sem inventário fotográfico | Planear sessão de fotografia com direção de arte definida |

---

# Próximos passos

1. **Validar este relatório** — sobretudo o conceito da §17 e o risco da §23.
2. **Obter os ficheiros vetoriais originais** das ilustrações (SVG, AI ou EPS). É um bloqueio real: extrair o elenco de personagens de um JPEG comprimido produziria traçados de qualidade insuficiente para o ativo central da marca.
3. **Confirmar o âmbito da fase 1** — proponho: home, catálogo, ficha de produto, encomenda com levantamento, e painel de produção. Subscrições e diário na fase 2.
4. **Documento 02 — Sistema de Design.** Tokens, escala, componentes, vocabulário de movimento, com a auditoria de contraste da §14 já integrada.
5. **Documento 03 — Arquitetura Técnica.** Modelo de dados, stock, reservas, subscrições, painel.
6. **Documento 04 — Conteúdo.** Textos reais em espanhol, na voz da §21.

---

## Anexo — Métricas de referência

| Métrica | Casa de Panaderos | Alvo FUERZA |
|---|---|---|
| Caminho crítico (CSS+JS+HTML) | ~1 707 KB | < 200 KB |
| Pedidos HTTP (inicial) | 66 | < 20 |
| Ficheiros CSS | 36 | 1–2 |
| Ficheiros JS | 30 | < 5 |
| Famílias tipográficas descarregadas | 4 (2 usadas) | 2 (2 usadas) |
| Contraste do texto corrido | 3,95:1 ❌ | 18,63:1 ✓ |
| Contraste do CTA principal | 3,94:1 ❌ | 5,70:1 ✓ |
| `<h1>` por página | 0 em 3 de 4 páginas | 1, sempre |
| `<label>` em formulários | 0 | 100% |
| `lang` | `pt-PT` ❌ | `es` ✓ |
| Imagens em formato moderno | 0% | 100% |
| Conteúdo *placeholder* em produção | 18+ ocorrências | 0, validado em CI |

*Todos os valores da coluna «Casa de Panaderos» foram medidos no espelho, não estimados.*
