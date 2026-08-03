# FUERZA — Conteúdo e Copywriting

**Documento 05** · Todo o conteúdo textual do website, em espanhol de Espanha
Data: 3 de agosto de 2026
Estado: proposta para validação — sem código, sem páginas

**Fontes:**
[Doc 01 — Direção Criativa](01-analise-e-direcao-criativa.md) ·
[Doc 02 — PRD](02-prd-e-regras-de-negocio.md) ·
[Doc 03 — Sistema de Design](03-sistema-de-design.md) ·
[Doc 04 — Arquitetura Técnica](04-arquitetura-tecnica-e-modelo-de-dados.md)

----

## Nota de leitura

**Idioma.** O enquadramento está em português para a equipa. **Todo o conteúdo dentro de blocos de citação, tabelas de copy e listas de rótulos está em espanhol de Espanha e é literal — vai para o site tal como está escrito.**

**Marcadores.** Dois tipos, e não se confundem:

| Marcador | Significado |
|---|---|
| `[Nombre del pan]` | **Variável** — preenchida com dados reais em execução ou pelo obrador |
| `[Pendiente de decisión comercial]` | **Bloqueio** — o texto não pode ser escrito até a decisão existir |

> **Aviso à equipa.** O Doc 02 §13.9 estabelece uma verificação de CI que **quebra o build** ao encontrar `[` no HTML gerado. Todos os marcadores deste documento têm de ser resolvidos antes da publicação. É deliberado: é a defesa contra o defeito mais grave da referência — dezoito ocorrências de texto por configurar numa página comercial (Doc 01 §10).

**O que não inventei.** Nomes de produtos, preços, moradas, horários de pontos externos, nomes de moinhos, produtores, pessoas da equipa, datas de fundação e políticas ainda pendentes. Onde eram necessários, estão marcados.

**O que é confirmado:** Asturias · Avilés · «Obrador de masa madre» · pagamento antecipado (`DA-01`) · horário do obrador 09:00–18:00 (`DA-02`).

---

# 1. Guia de voz e tom

## 1.1 Personalidade verbal

FUERZA fala como **um obrador pequeno que sabe o que faz e não precisa de o gritar**.

| Atributo | Como se manifesta |
|---|---|
| **Humana** | Escreve como uma pessoa fala ao balcão |
| **Direta** | Diz a coisa principal na primeira frase |
| **Próxima** | Trata por *tú*, sem familiaridade forçada |
| **Honesta** | Diz «no queda» sem rodeios, e diz porquê |
| **Artesanal** | Fala de horas, farinhas e mãos — não de processos nem de soluções |
| **Simples** | Uma ideia por frase |
| **Calorosa** | Sem exclamações. O calor vem do conteúdo, não da pontuação |

## 1.2 Regras de escrita

| Regra | Especificação |
|---|---|
| **Pessoa** | Primeira do plural: «hacemos», «horneamos», «te esperamos» |
| **Tratamento** | **`tú`** em todo o site. `usted` **apenas** em textos legais |
| **Comprimento** | Frase de interface: ≤ 12 palavras. Frase de narrativa: ≤ 20. Parágrafo: ≤ 4 frases |
| **Verbos** | Concretos e físicos: amasar, reposar, hornear, recoger, esperar |
| **Números** | Reais e concretos: «[n] horas de fermentación», nunca «larga fermentación» |
| **Maiúsculas** | **Nunca em frases inteiras** no corpo. Maiúsculas espacejadas apenas em etiquetas curtas e *eyebrows* (Doc 03 §4.6) |
| **Pontuação** | **Sem pontos de exclamação em todo o site.** Sem reticências decorativas. Interrogação só em perguntas reais |
| **Aspas** | Angulares «» em citações de marca |
| **Datas** | «el sábado 12 de [mes]», «el [fecha]» |
| **Horas** | Formato de 24 horas: «de 9:00 a 18:00» |
| **Preços** | «12,50 €» — vírgula decimal, símbolo depois |

## 1.3 Vocabulário recomendado

**Do produto:** masa madre · harina · fermentación · reposo · horno · corteza · miga · alveolado · hornada · obrador · amasar · hornear

**Do serviço:** reservar · recoger · punto de recogida · pedido · hora de cierre · franja de recogida · plan

**De marca:** tiempo · manos · cerca · barrio · Asturias · pequeño · de verdad · lo justo

## 1.4 Vocabulário proibido

| Proibido | Porquê | Em vez disso |
|---|---|---|
| «experiencia única» | Vazio | Descrever o que acontece |
| «producto premium» | Elitista; contradiz «obrador pequeño» | «pan de masa madre» |
| «calidad excepcional» | Auto-elogio sem prova | Dizer as horas, a farinha, o processo |
| «pasión por lo que hacemos» | Cliché de setor | «llevamos [n] horas con esta masa» |
| «soluciones» | Linguagem corporativa | Nomear a coisa concreta |
| «descubre un mundo de…» | Publicidade genérica | «mira lo que sale hoy del horno» |
| **«click and collect»** | Anglicismo | **«Reserva y recoge»** |
| «usuario» | Trata o cliente como software | «tú», ou nada |
| «gestionar tu experiencia» | Corporativo | «cambiar tu pedido» |
| «¡Últimas unidades!» | Escassez simulada; contradiz Doc 02 §1.5 | «Quedan [n]» |
| «Lo sentimos mucho, disculpa las molestias» | Desculpa em excesso | «Sentimos el trastorno» — uma vez, e seguir |
| «Error 500» ao cliente | Técnico | «Algo se nos ha roto» |
| «exclusivo», «selecto», «gourmet» | Elitista | Nada. O produto fala |

## 1.5 Tom por situação

### Venda — informar, não empurrar

> ✅ «Hoy salen [n] [Nombre del pan]. Se reservan hasta el [fecha] a las [hora].»
> ❌ «¡No te quedes sin el tuyo! Unidades muy limitadas.»

### Erros — nunca culpar o cliente

> ✅ «No hemos podido cobrar tu pedido, así que no queda reservado.»
> ❌ «Has introducido datos de pago incorrectos.»

### Confirmações — curtas, com o dado útil primeiro

> ✅ «Tu pan está reservado. Te esperamos el [fecha] en [punto].»
> ❌ «¡Enhorabuena! Tu pedido se ha realizado con éxito.»

### Operacional — o dado, sem adorno

> ✅ «Pedidos para el [fecha] hasta el [fecha] a las [hora].»
> ❌ «Recuerda que nuestro innovador sistema cierra los pedidos con antelación.»

### Situações negativas — o quê, o porquê, e a saída

Estrutura obrigatória de três partes (Doc 03 §11.1):

> ✅ «Agotado para el [fecha]. Volvemos a hornear [Nombre del pan] el [fecha]. → Ver ese día»
> ❌ «Producto no disponible.»

## 1.6 Ausência de exclamações — decisão declarada

**Nenhum ponto de exclamação em todo o site**, incluindo confirmações e emails.

A marca declara-se pequena e honesta. A exclamação é o sinal de pontuação da publicidade e do entusiasmo fabricado. O calor de FUERZA vem de dizer coisas verdadeiras e concretas — não de subir o volume.

*Única exceção admissível:* nenhuma.

---

# 2. Mensagens principais da marca

## 2.1 O que já existe — e não se toca

A folha de identidade já contém assinaturas verbais (Doc 01 §13). **São património da marca e devem ser reutilizadas, não substituídas:**

> «Pan artesanal de masa madre elaborado con harinas locales y tiempo real. Transformamos lo simple en algo que alimenta de verdad.»

> «FUERZA ES MÁS QUE PAN, ES CULTURA, ES ORIGEN, ES ALGO QUE SE COMPARTE.»

> «SOMOS UN OBRADOR PEQUEÑO, PERO CON MUCHA FUERZA.»

> «PAN QUE NUTRE HISTORIAS QUE PERDURAN.»

> «HECHO CON TIEMPO Y FUERZA»

E o descritor fixo, que acompanha o logótipo:

> **OBRADOR DE MASA MADRE · ASTURIAS · ESPAÑA**

## 2.2 Frase principal — propostas

O conceito criativo é **«El pan que se levanta entre dos»** (Doc 01 §17). O enunciado pede que não o assuma como slogan final. Avaliei-o como slogan público:

| # | Proposta | A favor | Contra |
|---|---|---|---|
| **A** | **«El pan que se levanta entre dos.»** | Fiel ao Doc 01; duplo sentido — a massa que leveda e o pão erguido a dois | É um fragmento sem oração principal; como assinatura isolada fica em suspenso |
| **B** | **«El pan no se levanta solo.»** | **Oração completa.** Duplo sentido intacto. Constrói por oposição, como a marca já faz («más que pan», «pequeño, pero…»). Curta e memorável | Ligeiramente mais abstrata; pede o logótipo ao lado |
| **C** | «Lo levantamos entre todos.» | Primeira pessoa do plural; comunidade | Perde a palavra «pan» |
| **D** | «Hace falta ser dos para levantar un pan.» | Explícita e calorosa | Longa para assinatura |
| **E** | «Pan hecho entre dos.» | Clara e simples | Sem tensão; qualquer padaria a poderia dizer |

## 2.3 Recomendação

> ### Conceito criativo (interno): **«El pan que se levanta entre dos»**
> ### Slogan público: **«El pan no se levanta solo.»**

**Fundamentação.** O conceito é a plataforma que orienta imagem, ilustração e narrativa — mantém-se tal como o Doc 01 o definiu. O slogan é a sua expressão pública, e aí a proposta **B** funciona melhor por três razões:

1. **É uma oração completa**, o que uma assinatura precisa de ser para funcionar sozinha debaixo de um logótipo.
2. **Mantém os dois sentidos** — a massa não leveda sozinha, e o pão não se faz sozinho — que são exatamente o gesto do logótipo.
3. **Constrói por oposição**, que é o mecanismo retórico que a marca já usa nas suas assinaturas existentes. É coerente com o que ela é, não uma voz nova.

**Risco assumido:** B é ligeiramente mais abstrata que A. Mitigação: aparece sempre junto ao logótipo, onde as duas figuras a erguer o pão tornam o sentido imediato.

> **Decisão final dos responsáveis do FUERZA.** As duas linhas convivem sem conflito; se preferirem usar A também em público, nada no sistema quebra.

## 2.4 Blocos de marca

**Subtítulo (acompanha o slogan)**
> Obrador de masa madre en Asturias.

**Descrição curta** — 90 caracteres, para metadados e redes
> Pan de masa madre con harinas locales y fermentación lenta. Reserva y recoge en Asturias.

**Descrição longa** — para «Nosotros», metadados longos e imprensa
> Somos un obrador pequeño de masa madre en Asturias. Hacemos pan con harinas locales, agua, sal y el tiempo que haga falta. Cada día horneamos una cantidad limitada: la que podemos hacer bien. Tú reservas, nosotros lo horneamos, y lo recoges cuando te venga bien.

**Assinatura**
> Hecho con tiempo y fuerza.

**Proposta de valor** — a promessa em duas frases
> Reservas el pan antes de que lo horneemos.
> Nosotros hacemos exactamente el que hace falta.

**Promessa de reserva**
> Lo que reservas, lo horneamos para ti. No lo vendemos dos veces.

**Produção limitada** — honesta, não como técnica de venda
> Somos un obrador pequeño. Cada día hacemos una cantidad limitada, y cuando se acaba, se acaba. Por eso puedes reservar: para que no dependa de a qué hora llegues.

**Comunidade**
> El pan no se hace solo. Hay quien cultiva el cereal, quien lo muele, quien amasa y quien espera. Nosotros estamos en medio.

**Origem asturiana**
> Trabajamos con harinas de aquí. Asturias tiene molinos y tiene cereal, y usarlos es lo que hace que este pan sepa a este sitio y no a cualquier otro.

---

# 3. Navegação

## 3.1 Menu principal

| Rótulo | Destino |
|---|---|
| **Pan** | `/pan` |
| **Obrador** | `/obrador` |
| **Nosotros** | `/nosotros` |
| **Plan de Pan** | `/suscripciones` |
| **Dónde estamos** | `/donde-estamos` |
| **Reserva y recoge** | CTA — botão principal |

## 3.2 Rótulos globais

| Elemento | Rótulo |
|---|---|
| Conta | **Mi cuenta** |
| Carrinho | **Carrito** |
| Painel | **Panel del obrador** |
| Entrar | **Iniciar sesión** |
| Sair | **Cerrar sesión** |
| Registar | **Crear cuenta** |
| Voltar | **Volver** |
| Voltar a uma página | **Volver a [página]** |
| Fechar | **Cerrar** |
| Continuar | **Continuar** |
| Guardar | **Guardar** |
| Cancelar (ação) | **Cancelar** |
| Ver mais | **Ver más** |
| Ver todos | **Ver todos los panes** |

## 3.3 Menu mobile

| Elemento | Texto |
|---|---|
| Abrir | «Abrir menú» *(nome acessível)* |
| Fechar | «Cerrar menú» *(nome acessível)* |
| Rodapé da gaveta | «Mi cuenta» · «Dónde estamos» |
| Ligação de salto | **«Saltar al contenido»** |

## 3.4 Migalhas

Separador: `/` ou a espiga a 12 px (Doc 03 §17.6).

> Inicio / Pan / [Nombre del pan]
> Inicio / Mi cuenta / Pedido [código]

Mobile: só o nível anterior — «← Volver a Pan».

## 3.5 Navegação da conta

Mi cuenta · Próximas recogidas · Mis pedidos · Mi plan *(fase 2)* · Mis datos · Cerrar sesión

## 3.6 Rodapé

| Coluna | Título |
|---|---|
| 1 | *(wordmark)* «Obrador de masa madre · Asturias · España» |
| 2 | **El pan** — Pan · Obrador · Nosotros · Plan de Pan |
| 3 | **Tu cuenta** — Mi cuenta · Mis pedidos · Reserva y recoge |
| 4 | **Dónde estamos** — [Punto] · Horario: de 9:00 a 18:00 · Cómo llegar |

Rodapé inferior:
> © [año] FUERZA. Obrador de masa madre. Asturias, España.
> Aviso legal · Privacidad · Cookies · Condiciones de compra

---

# 4. Home

## 4.1 Hero

> **EL PAN NO SE LEVANTA SOLO** *(eyebrow, maiúsculas espacejadas)*
>
> # Pan de masa madre, hecho entre dos manos y el tiempo.
>
> Somos un obrador pequeño en Asturias. Harina de aquí, fermentación lenta y la cantidad que podemos hacer bien.
>
> **[Reserva y recoge]** **[Ver el pan de hoy]**

*Texto de apoio, por baixo dos botões:*
> Reservas, lo horneamos y lo recoges. Pagas al reservar.

*Texto alternativo da ilustração:*
> Dos personas levantan juntas una hogaza de pan más grande que ellas.

## 4.2 Lo que sale del horno

> **HOY EN EL HORNO** *(eyebrow)*
>
> ## Esto es lo que estamos horneando
>
> Cada día hacemos una cantidad limitada. Aquí ves lo que queda de verdad, no lo que nos gustaría tener.

*Estados dos cartões* — remetem para §8.

> **[Ver todos los panes]**

*Se não houver produção na data selecionada:*
> Hoy no horneamos. El siguiente día es el [fecha].
> **[Ver el [fecha]]**

## 4.3 El proceso

> **CÓMO SE HACE** *(eyebrow)*
>
> ## El tiempo es el ingrediente que no se ve
>
> No usamos levadura industrial. Usamos masa madre, que es harina y agua vivas, y que necesita horas para hacer su trabajo. Estas son esas horas.

**Etapas da cronologia** *(o número de horas de cada etapa é dado real — `[Pendiente de datos del obrador]`)*

| # | Título | Texto |
|---|---|---|
| 01 | **Alimentamos la masa madre** | Cada día le damos harina y agua. Sin eso, no hay pan al día siguiente. |
| 02 | **Amasamos** | Harina, agua, sal. Nada más. La masa se trabaja poco y descansa mucho. |
| 03 | **Reposo largo — [n] horas** | Aquí no pasa nada visible y pasa todo. La masa se vuelve digerible, y coge sabor y aroma. |
| 04 | **Formamos a mano** | Pieza a pieza. Por eso no hay dos panes exactamente iguales. |
| 05 | **Al horno** | Corteza gruesa, miga húmeda. El horno termina lo que empezó el tiempo. |
| 06 | **Al punto de recogida** | Sale del horno y va a donde lo has reservado. |

> **[Ver el obrador]**

## 4.4 Lo que nos mueve

> **LO QUE NOS MUEVE** *(eyebrow)*
>
> ## Cuatro cosas que no negociamos

| Valor | Título | Texto |
|---|---|---|
| Tradição | **Tradición que se siente** | Hacemos pan como se hacía antes de que hubiera prisa. No por nostalgia: porque sale mejor. |
| Ingredientes | **Ingredientes que cuentan** | Harina, agua, sal y masa madre. Si un ingrediente no hace falta, no está. |
| Tempo | **Tiempo que transforma** | La fermentación lenta no se puede acelerar. Es la parte del trabajo que hace el reloj. |
| Comunidade | **Comunidad que nos inspira** | Un obrador pequeño vive de la gente que vuelve. Nos conocemos por el nombre. |

## 4.5 De dónde viene

> **ORIGEN** *(eyebrow)*
>
> ## Harina de aquí
>
> Asturias tiene cereal y tiene molinos. Trabajamos con harinas locales porque están cerca, porque sabemos quién las hace, y porque es lo que da a este pan un sabor que no se copia en otro sitio.
>
> Trabajamos con [Nombre del molino], en [Localidad], que nos muele [Tipo de harina].
> `[Pendiente de datos del obrador — no inventar nombres de molinos ni productores]`
>
> **[Conocer el obrador]**

## 4.6 Plan de Pan

**Versão fase 1** — o plano ainda não existe. Honesto, sem simular:

> **PLAN DE PAN** *(eyebrow)*
>
> ## Tu pan, sin tener que acordarte
>
> Estamos preparando algo para quien quiere el mismo pan cada semana sin tener que reservarlo cada vez. Te avisamos cuando esté.
>
> [Campo de email] **[Avisadme]**
>
> Solo para esto. No te escribiremos por nada más.

**Versão fase 2** — quando o plano existir:

> **PLAN DE PAN** *(eyebrow)*
>
> ## Tu pan, sin tener que acordarte
>
> Eliges qué pan y cada cuánto. Nosotros lo horneamos y te lo guardamos, aunque ese día se agote para todos los demás.
>
> - Te reservamos el pan antes de abrir la venta del día
> - Cambias de producto o de punto cuando quieras
> - Pausas el plan si te vas fuera
> - Lo cancelas tú, sin llamar a nadie
>
> **[Ver el Plan de Pan]**

## 4.7 Reserva y recoge

> **CÓMO FUNCIONA** *(eyebrow)*
>
> ## Tres pasos y ya está

| # | Título | Texto |
|---|---|---|
| **01** | **Eliges tu pan y el día** | Ves lo que queda de verdad para cada fecha. |
| **02** | **Pagas al reservar** | Así sabemos exactamente cuánto hornear. En el punto de recogida no tienes que pagar nada. |
| **03** | **Lo recoges** | Vas al punto que hayas elegido dentro de su franja horaria y dices tu código. |

> **[Reserva y recoge]**
>
> Los pedidos de cada día se cierran el [fecha] a las [hora].
> `[Pendiente de decisión comercial — DP-02, hora de cierre]`

## 4.8 Quién lo hace

> **EL OBRADOR** *(eyebrow)*
>
> ## Somos pocos, y eso se nota
>
> Detrás de cada hogaza hay dos manos que la han formado. No es una forma de hablar: es que somos así de pequeños.

*Estrutura por pessoa* — `[Pendiente de datos del obrador y de fotografía]`

| Campo | Formato |
|---|---|
| Nome | `[Nombre]` |
| Função | `[Lo que hace en el obrador]` — em linguagem natural: «Amasa y hornea», não «Responsable de producción» |
| Frase | Uma frase na primeira pessoa, ≤ 20 palavras |
| Fotografia | A trabalhar, não posada (Doc 03 §8.3) |

> **[Conocer el obrador]**

## 4.9 Newsletter

> ## Te contamos lo que sale del horno
>
> Una vez cada [periodicidad]. Lo que horneamos, lo que cambia y poco más.
>
> [Campo: Tu correo] **[Suscribirme]**
>
> ☐ Quiero recibir novedades de FUERZA por correo. Puedo darme de baja cuando quiera.
>
> Tratamos tus datos como explicamos en la [Política de privacidad].

---

# 5. Catálogo — `/pan`

## 5.1 Cabeçalho

> # El pan
>
> Esto es todo lo que hacemos. No todo se hornea todos los días, así que empieza eligiendo el día.

## 5.2 Filtro por data — o elemento principal

> **¿Para qué día lo quieres?**
> [Seletor de data]
>
> Estás viendo lo que queda para el **[fecha]**.

## 5.3 Filtros e ordenação

| Elemento | Texto |
|---|---|
| Filtro de família | «Tipo de pan» |
| Opção todas | «Todo» |
| Limpar filtros | «Quitar los filtros» |
| Ordenação | «Ordenar por» |
| Opções | «Los que quedan primero» · «Nombre» · «Precio» |
| Contagem | «[n] panes para el [fecha]» |
| Um só resultado | «1 pan para el [fecha]» |

## 5.4 Famílias

`[Pendiente de decisión comercial — DP-09, taxonomía de familias]`

Nomes propostos, **a confirmar pelo obrador**:

| Cor | Nome proposto | Descrição curta |
|---|---|---|
| Terracota | Panes de masa madre | Las hogazas y las barras de cada día. |
| Amarelo | Bollería | Lo dulce, hecho con la misma masa madre. |
| Verde | Edición limitada | Panes que hacemos cuando toca y mientras dura. |
| Azul | Despensa | Café, harina y cosas que acompañan al pan. |

## 5.5 Estados

**Sem resultados com filtros**
> No hay nada con estos filtros para el [fecha].
> **[Quitar los filtros]** · **[Ver otro día]**

**Sem produção nesse dia**
> El [fecha] no horneamos.
> Los días que sí: [días]. El siguiente es el [fecha].
> **[Ver el [fecha]]**

**Produto esgotado (no cartão)**
> Agotado para el [fecha]
> **[Ver disponibilidad]**

**Produto sazonal**
> De temporada · Disponible hasta el [fecha]

**Próxima disponibilidade**
> Vuelve el [fecha]

## 5.6 Ações

| Elemento | Texto |
|---|---|
| Reservar | **«Reservar»** |
| Ver produto | **«Ver el pan»** |
| Esgotado | **«Ver disponibilidad»** |
| Ficha técnica no cartão | «[Tipo de harina] · [n] h de fermentación · [n] g» |

---

# 6. Ficha de produto

## 6.1 Estrutura de conteúdo

**Nenhum produto é inventado.** Estrutura com variáveis, para o obrador preencher.

| Campo | Formato | Exemplo de estrutura |
|---|---|---|
| **Nome** | `[Nombre del pan]` | 1–3 palavras |
| **Família** | `[Familia]` | Etiqueta |
| **Descrição curta** | 1 frase, ≤ 15 palavras. Para o cartão e resultados | «[Qué es, en una frase concreta].» |
| **Descrição longa** | 2–3 parágrafos, ≤ 4 frases cada. Voz da marca | §6.2 |
| **Farinha** | `[Tipo de harina]` | «Trigo y centeno» |
| **Origem** | `[Molino o zona]` | `[Pendiente de datos]` |
| **Fermentação** | `[n] horas` | Número real, nunca «larga» |
| **Peso** | «Peso aproximado: [n] g» | Aproximado, sempre |
| **Ingredientes** | Lista por peso decrescente | «Harina de [tipo], agua, masa madre, sal.» |
| **Alergénios** | §6.3 | Requisito legal |
| **Conservação** | §6.4 | |
| **Preço** | «[n],[nn] €» | IVA incluído |

## 6.2 Modelo de descrição longa

*Estrutura a seguir para cada produto — não é texto final:*

> **Párrafo 1 — qué es.** [Nombre del pan] es [qué tipo de pan], hecho con [tipo de harina] y [n] horas de fermentación.
>
> **Párrafo 2 — cómo es.** Corteza [cómo], miga [cómo]. [Qué se nota al comerlo].
>
> **Párrafo 3 — para qué.** Aguanta bien [n] días. Va bien con [con qué].

> **Regra de escrita:** descrever, não elogiar. «Corteza gruesa y miga húmeda» é informação. «Una experiencia de sabor incomparable» é ruído.

## 6.3 Alergénios — bloco obrigatório

Requisito legal (Regulamento UE 1169/2011; Doc 02 §4.5). **Nunca escondido atrás de um acordeão.**

> ## Alérgenos
>
> **Contiene:** [alérgenos presentes].
>
> **Puede contener trazas de:** [alérgenos por contaminación cruzada].
>
> Trabajamos en un obrador pequeño donde manipulamos [alérgenos del obrador] en el mismo espacio. Si tienes una alergia, escríbenos antes de reservar y te decimos con seguridad qué puedes tomar.

*Se não houver contaminação cruzada declarada:*
> **No contiene trazas declaradas.**

## 6.4 Conservação, congelação e corte

> ## Cómo guardarlo
>
> **Conservación.** [Guárdalo en bolsa de tela o boca abajo sobre la tabla]. Aguanta [n] días en buen estado. No lo metas en la nevera: se seca antes.
>
> **Congelar.** Se congela bien. Córtalo antes en rebanadas y congélalo el mismo día. Para descongelar, [n] minutos a temperatura ambiente o directamente a la tostadora.
>
> **Cortar.** Espera a que esté frío del todo. Un pan recién salido del horno todavía está terminando por dentro.

`[Pendiente de datos del obrador — días de conservación y método]`

## 6.5 Bloco de reserva

> ## Reservar
>
> **¿Dónde lo recoges?** [Seletor de ponto]
> **¿Qué día?** [Calendário]
> **¿Cuántos?** [Seletor de quantidade]
>
> [Estado de disponibilidade — §8]
>
> **[Reservar · [n],[nn] €]**
>
> Pagas ahora. El día de la recogida solo tienes que recogerlo.

## 6.6 Relacionados

> ## También horneamos

---

# 7. Reserva y recoge — fluxo

## 7.1 Nomes dos passos

| # | Título |
|---|---|
| 1 | **Tu pedido** |
| 2 | **¿Dónde lo recoges?** |
| 3 | **¿Qué día?** |
| 4 | **Tus datos** |
| 5 | **Revisa tu pedido** |
| 6 | **Pago** |
| 7 | **Todo listo** |

Indicador mobile: «Paso [n] de 6».

## 7.2 Passo 1 — Tu pedido

> # Tu pedido
>
> Revisa lo que llevas antes de seguir.

| Elemento | Texto |
|---|---|
| Quantidade | «Cantidad» |
| Remover | «Quitar» *(nome acessível: «Quitar [Nombre del pan] del pedido»)* |
| Subtotal | «Subtotal» |
| Vazio | §22 |
| Continuar | **«Continuar»** |
| Seguir a ver | **«Seguir viendo panes»** |

## 7.3 Passo 2 — ¿Dónde lo recoges?

> # ¿Dónde lo recoges?
>
> Elige el punto que mejor te venga. Cada uno tiene sus días y su horario.

*Por ponto:*
> **[Nombre del punto]**
> [Dirección]
> **Horario:** [horario del establecimiento]
> **Días de recogida:** [días]
> **Franja de recogida:** de [hora] a [hora]
> [Instrucciones]
> **[Recoger aquí]**

*Obrador:*
> **Horario:** de 9:00 a 18:00

*Nota sob a lista:*
> El horario es cuando el sitio está abierto. La franja de recogida es cuando tu pan está allí esperándote. No siempre coinciden.

## 7.4 Passo 3 — ¿Qué día?

> # ¿Qué día?
>
> Solo puedes elegir días en los que horneamos [Nombre del pan] y en los que [Nombre del punto] recibe pan.

*Legenda do calendário:*
> ● Disponible · ◐ Quedan pocas · ○ Agotado · — No horneamos · ⏱ Pedidos cerrados

*Nota da hora-limite:*
> Los pedidos para el [fecha] se cierran el [fecha] a las [hora].
> `[Pendiente de decisión comercial — DP-02]`

## 7.5 Passo 4 — Tus datos

> # Tus datos
>
> Los necesitamos para avisarte si pasa algo con tu pedido.

**Duas opções com igual peso:**
> **[Continuar sin cuenta]** **[Iniciar sesión]**

*Nota:*
> No hace falta cuenta para reservar. Si quieres una, te la ofrecemos al final.

| Campo | Etiqueta | Ajuda |
|---|---|---|
| Nome | «Nombre y apellidos» | — |
| Email | «Correo electrónico» | «Aquí te mandamos la confirmación y el código de recogida.» |
| Telefone | «Teléfono» | «Solo lo usamos para avisarte si hay algún problema el día de la recogida.» |

☐ He leído y acepto las [Condiciones de compra] y la [Política de privacidad].

## 7.6 Passo 5 — Revisa tu pedido

> # Revisa tu pedido
>
> Es el último paso antes de pagar.

| Bloco | Título |
|---|---|
| Produtos | «Tu pedido» |
| Alergénios | «Alérgenos de este pedido» |
| Recolha | «Dónde y cuándo lo recoges» |
| Dados | «Tus datos» |
| Total | «Total» |

*Total:*
> **Total: [n],[nn] €** · IVA incluido

*Nota de pagamento antecipado (`DA-01`):*
> Pagas ahora. El día de la recogida solo tienes que recogerlo: en el punto no se paga nada.

*Reserva temporária ativa:*
> Te guardamos el pan durante [mm:ss].

*Política:*
> Puedes cancelar y te devolvemos el importe hasta el [fecha] a las [hora].
> `[Pendiente de decisión comercial — DP-08]`

> **[Continuar al pago]**

## 7.7 Passo 6 — Pago

> # Pago
>
> Último paso.

| Elemento | Texto |
|---|---|
| Resumo | «Tu pedido · [n],[nn] €» |
| Segurança | «El pago se procesa de forma segura. No guardamos los datos de tu tarjeta.» |
| Botão | **«Confirmar y pagar [n],[nn] €»** |
| Em curso | «Procesando el pago…» |
| Contagem | «Te guardamos el pan durante [mm:ss].» |

## 7.8 Passo 7 — Confirmación

Ver §11.

---

# 8. Disponibilidade

**Estrutura obrigatória de três partes** (Doc 03 §11.1): o quê · porquê · alternativa concreta.

## 8.1 Estados positivos

**Disponível**
> Disponible para el [fecha]

**Poucas unidades**
> **Quedan [n] para el [fecha].**
> Se reservan hasta el [fecha] a las [hora].

**Última unidade**
> **Queda una para el [fecha].**
> Si la reservas, es tuya.

**Garantido por subscrição** *(fase 2)*
> **Incluido en tu plan.**
> Te lo guardamos: no depende de las unidades que queden ese día.

## 8.2 Estados negativos

**Esgotado**
> **Agotado para el [fecha].**
> Volvemos a hornear [Nombre del pan] el [fecha].
> **[Ver el [fecha]]**

**Disponível noutra data**
> **Para el [fecha] ya no queda.**
> Sí tenemos para el [fecha].
> **[Cambiar al [fecha]]**

**Disponível noutro ponto**
> **En [Nombre del punto] ya no queda para el [fecha].**
> Ese mismo día sí lo tenemos en [Otro punto].
> **[Recoger en [Otro punto]]**

**Não produzido nesse dia**
> **El [fecha] no horneamos [Nombre del pan].**
> Lo hacemos los [días].
> **[Elegir un día que sí]**

**Ponto completo** — mensagem distinta de esgotado, porque a saída é outra
> **[Nombre del punto] ya está completo el [fecha].**
> Ese día no nos cabe más pan allí. Todavía puedes recogerlo en [Otro punto].
> **[Cambiar a [Otro punto]]**

**Ponto fechado**
> **[Nombre del punto] no abre el [fecha].**
> Puedes recogerlo el [fecha] o en [Otro punto].
> **[Ver otros días]** · **[Ver otros puntos]**

**Hora-limite ultrapassada**
> **Ya hemos cerrado los pedidos del [fecha].**
> La masa de ese día ya está en marcha. El siguiente día disponible es el [fecha].
> **[Reservar para el [fecha]]**

**Produto incompatível com o ponto**
> **[Nombre del pan] solo se recoge en [puntos].**
> **[Ver esos puntos]** · **[Quitarlo del pedido]**

**Limite máximo por cliente atingido**
> **De momento puedes reservar hasta [n] por día.**
> Somos un obrador pequeño y así llega a más gente. Si necesitas más, escríbenos.

## 8.3 Durante o checkout

**Reserva temporária ativa**
> Te guardamos el pan durante [mm:ss].

**Reserva prestes a expirar** *(≤ 2 min)*
> Te quedan [mm:ss] para terminar. Después soltamos el pan.

**Reserva expirada**
> **Se ha acabado el tiempo que teníamos guardado tu pan.**
> Lo hemos devuelto al mostrador, así que otra persona puede reservarlo. Todavía puedes intentarlo otra vez.
> **[Volver a intentarlo]**

**Stock alterado durante o checkout**
> **Se ha agotado [Nombre del pan] para el [fecha] mientras terminabas.**
> No te hemos cobrado nada. Todavía hay para el [fecha], o puedes recogerlo en [Otro punto] ese mismo día. El resto de tu pedido sigue guardado.
> **[Cambiar la fecha]** · **[Cambiar el punto]** · **[Quitarlo del pedido]**

---

# 9. Carrinho

| Elemento | Texto |
|---|---|
| Título | «Tu pedido» |
| Item | «[Nombre del pan] · [Variante]» |
| Quantidade | «Cantidad» |
| Remover | «Quitar» |
| Ponto | «Recoges en [Nombre del punto]» · **«Cambiar»** |
| Data | «El [fecha]» · **«Cambiar»** |
| Subtotal | «Subtotal» |
| Total | «Total» |
| IVA | «IVA incluido» |
| Continuar | **«Continuar»** |
| Rever | **«Revisar el pedido»** |
| Seguir a ver | **«Seguir viendo panes»** |

**Vazio**
> **Tu pedido está vacío.**
> Mira lo que estamos horneando estos días.
> **[Ver el pan]**

**Incompatibilidade ao mudar de ponto**
> **En [Nombre del punto] no podemos darte [Nombre del pan].**
> Puedes quitarlo y recoger el resto ahí, o seguir en [Punto actual].
> **[Quitar y cambiar]** · **[Seguir en [Punto actual]]**

**Preço alterado**
> **Ha cambiado el precio de [Nombre del pan].**
> Ahora son [n],[nn] €. Lo hemos actualizado en tu pedido.

**Disponibilidade alterada**
> **[Nombre del pan] ya no está disponible para el [fecha].**
> **[Cambiar la fecha]** · **[Quitarlo]**

**Carrinho expirado**
> **Ha pasado un tiempo y hemos tenido que soltar tu pedido.**
> No te preocupes: no habíamos guardado ningún pan todavía. Puedes volver a montarlo.
> **[Ver el pan]**

---

# 10. Checkout

## 10.1 Identificação

> # Tus datos
>
> No hace falta cuenta para reservar.

| Elemento | Texto |
|---|---|
| Sem conta | **«Continuar sin cuenta»** |
| Com conta | **«Iniciar sesión»** |
| Nota | «Si ya tienes cuenta, entrar te ahorra rellenar los datos.» |
| Nome | «Nombre y apellidos» |
| Email | «Correo electrónico» |
| Ajuda email | «Aquí te mandamos la confirmación y el código de recogida.» |
| Telefone | «Teléfono» |
| Ajuda telefone | «Solo lo usamos para avisarte si hay algún problema el día de la recogida.» |

## 10.2 Consentimentos

☐ He leído y acepto las [Condiciones de compra] y la [Política de privacidad].

☐ Quiero recibir novedades de FUERZA por correo. *(opcional)*

*Nota:*
> Lo segundo es opcional y puedes darte de baja cuando quieras.

## 10.3 Pagamento — as três coisas que têm de ficar claras

Decorrente de `DA-01`. **Aparecem no resumo, no botão e na confirmação:**

> **1.** «Pagas ahora, al reservar.»
> **2.** «Tu pedido queda confirmado cuando se completa el pago.»
> **3.** «En el punto de recogida no se paga nada.»

*Texto do resumo:*
> Pagas ahora. El día de la recogida solo tienes que recogerlo: en el punto no se paga nada.

*Segurança:*
> El pago se procesa de forma segura. No guardamos los datos de tu tarjeta.

## 10.4 Erros de pagamento

Ver §21.

## 10.5 Estado de espera

*Quando o pagamento passou mas a confirmação ainda não chegou (Doc 04 §11.2):*

> **Estamos confirmando tu pago.**
> Suele tardar unos segundos. No cierres esta página.

---

# 11. Confirmação da encomenda

> *(ilustração das duas figuras + faixa de padrão)*
>
> # Tu pan está reservado
>
> Te esperamos el **[fecha]**, de **[hora]** a **[hora]**, en **[Nombre del punto]**.

**Código de recolha**
> **Tu código**
> ## FZ-XXXX
> Dilo al recoger. **[Copiar código]**

**Ponto**
> **[Nombre del punto]**
> [Dirección]
> [Instrucciones de recogida]
> **[Cómo llegar]**

**Produtos**
> **Tu pedido**
> [n] × [Nombre del pan] — [n],[nn] €
> **Total pagado: [n],[nn] €** · IVA incluido

**Pagamento**
> Ya está pagado. El día de la recogida solo tienes que recogerlo.

**Email**
> Te hemos mandado todo esto a [email]. Si no llega en unos minutos, mira en spam.

**Calendário**
> **[Añadir a mi calendario]**

**Criar conta**
> **¿Quieres guardar tus pedidos?**
> Si creas una cuenta, tendrás aquí todo lo que reserves y podrás repetir en dos clics.
> **[Crear cuenta]** · «Sin cuenta también funciona todo.»

**Problema**
> ¿Algo no cuadra? Escríbenos a [correo] con tu código y lo miramos.

---

# 12. Estados da encomenda

Cada explicação responde: **o que aconteceu · o que o cliente tem de fazer · qual é o próximo passo.**

| Estado | Rótulo | Explicação |
|---|---|---|
| `pendiente_pago` | **Pendiente de pago** | Todavía no hemos podido cobrar este pedido, así que no está reservado. Si quieres el pan, tendrás que volver a intentarlo. **[Intentar de nuevo]** |
| `confirmado` | **Confirmado** | Ya está pagado y te lo hemos apuntado. Lo hornearemos para el [fecha]. No tienes que hacer nada hasta ese día. |
| `en_preparacion` | **En preparación** | Estamos con ello. Te avisamos en cuanto esté listo. |
| `listo` | **Listo para recoger** | Tu pan está hecho. Puedes pasar a recogerlo el [fecha], de [hora] a [hora], en [Nombre del punto]. Lleva tu código. |
| `en_punto` | **Ya está en [Nombre del punto]** | Lo hemos llevado al punto. Está allí esperándote hasta las [hora] del [fecha]. Di tu código al recogerlo. |
| `recogido` | **Recogido** | Lo recogiste el [fecha]. Esperamos que estuviera bueno. |
| `no_recogido` | **No recogido** | El [fecha] se acabó la franja de recogida y el pan se quedó allí. Si crees que ha habido un error, escríbenos. |
| `cancelado` | **Cancelado** | Este pedido se canceló el [fecha]. [Motivo si lo hay]. No lo hornearemos. |
| `reembolsado` | **Reembolsado** | Te hemos devuelto [n],[nn] € al mismo método con el que pagaste. Suele tardar unos días en aparecer en tu cuenta. |

---

# 13. Área do cliente

## 13.1 Entrada

> # Hola, [Nombre]

## 13.2 Próximas recolhas

> ## Lo próximo que recoges

*Cartão em destaque:*
> **[fecha]**, de [hora] a [hora]
> **[Nombre del punto]** · [Dirección]
> Código: **FZ-XXXX**
> **[Ver detalle]** · **[Cómo llegar]**

*Vazio:*
> **Ahora mismo no tienes nada reservado.**
> **[Ver el pan de esta semana]**

## 13.3 Histórico

> ## Mis pedidos

| Elemento | Texto |
|---|---|
| Filtro | «Todos» · «Próximos» · «Recogidos» · «Cancelados» |
| Linha | «[fecha] · [Nombre del punto] · [Estado] · [n],[nn] €» |
| Ver | **«Ver detalle»** |
| Vazio | «Todavía no has hecho ningún pedido.» **[Ver el pan]** |

## 13.4 Detalhe

> # Pedido FZ-XXXX

Blocos: «Estado» · «Qué llevas» · «Dónde y cuándo» · «Pago» · «Recibo»

| Elemento | Texto |
|---|---|
| Recibo | **«Descargar el recibo»** |
| Linha temporal | «Reservado el [fecha]» · «Confirmado el [fecha]» · … |

## 13.5 Cancelar

> **[Cancelar pedido]**

*Modal:*
> **¿Cancelamos tu pedido del [fecha]?**
> Te devolvemos [n],[nn] € al mismo método con el que pagaste. Suele tardar unos días en aparecer.
> **[Sí, cancelar]** · **[No, mantenerlo]**

*Fora do prazo:*
> **Este pedido ya no se puede cancelar desde aquí.**
> Cerramos los pedidos del [fecha] el [fecha] a las [hora], y a partir de ahí ya estamos con la masa. Si te ha surgido algo, escríbenos a [correo] y lo miramos.
> `[Pendiente de decisión comercial — DP-08]`

## 13.6 Dados pessoais

> ## Mis datos

| Campo | Etiqueta |
|---|---|
| Nome | «Nombre y apellidos» |
| Email | «Correo electrónico» |
| Telefone | «Teléfono» |
| Guardar | **«Guardar cambios»** |
| Guardado | «Datos guardados.» |

*Alteração de email:*
> Te hemos mandado un correo a [email] para confirmar el cambio. Hasta que lo confirmes, seguimos usando el anterior.

## 13.7 Consentimentos

> ## Correos y avisos
>
> **Avisos de tus pedidos.** Te escribimos cuando reservas, cuando tu pan está listo y si pasa algo. Esto no se puede desactivar: forma parte del pedido.
>
> ☐ **Novedades de FUERZA.** Lo que horneamos y lo que cambia. Puedes quitarlo cuando quieras.

## 13.8 Eliminar conta

> ## Eliminar mi cuenta
>
> Borramos tus datos personales: nombre, correo y teléfono.
>
> Hay una parte que tenemos que guardar por obligación legal — la información de facturación de tus pedidos —, pero queda sin poder relacionarse contigo.
>
> Si tienes un plan activo, lo cancelamos como parte de esto.
>
> Esto no se puede deshacer.
>
> **[Eliminar mi cuenta]** · **[Volver]**

*Confirmação:*
> **¿Seguro que quieres eliminar tu cuenta?**
> Escribe «ELIMINAR» para confirmarlo.

## 13.9 Sessão e palavra-passe

| Situação | Texto |
|---|---|
| Entrar | «Iniciar sesión» · «Correo electrónico» · «Contraseña» |
| Esqueceu | **«¿No recuerdas la contraseña?»** |
| Recuperar | «Escribe tu correo y te mandamos un enlace para cambiarla.» |
| Enviado | «Si ese correo tiene cuenta, te llegará un enlace en unos minutos.» |
| Nova palavra-passe | «Nueva contraseña» · «Mínimo [n] caracteres.» |
| Alterada | «Contraseña cambiada. Ya puedes entrar.» |
| Sessão expirada | §21 |

## 13.10 Conta criada após compra

> **Ya tienes cuenta.**
> Hemos guardado aquí el pedido que acabas de hacer y todos los que hicieras antes con este correo.

---

# 14. Plan de Pan

> **Nenhum plano, frequência ou preço é inventado.** Os nomes abaixo estão marcados como propostas.

## 14.1 Apresentação

> # Plan de Pan
>
> ## Tu pan, sin tener que acordarte
>
> Si compras el mismo pan casi todas las semanas, esto te ahorra el paso de reservarlo cada vez. Eliges qué y cada cuánto, y nosotros lo horneamos y te lo guardamos.

## 14.2 Como funciona

> ## Cómo funciona

| # | Título | Texto |
|---|---|---|
| **01** | **Eliges tu pan** | Uno fijo, o dejas que elijamos nosotros entre lo que horneemos esa semana. |
| **02** | **Eliges cada cuánto** | Y qué día y en qué punto te viene bien recogerlo. |
| **03** | **Nosotros lo apuntamos** | Te reservamos el pan antes de abrir la venta del día. Aunque se agote, el tuyo está. |

## 14.3 O benefício central

> ## Tu pan está guardado antes de que abramos
>
> Esto es lo que de verdad cambia. Reservamos el pan de los planes antes de poner el resto a la venta. Si un día se agota para todo el mundo, el tuyo sigue ahí.

## 14.4 Escolhas do plano

| Elemento | Texto |
|---|---|
| Frequência | «¿Cada cuánto?» — `[Pendiente de decisión comercial — DP-29]` |
| Produto | «¿Qué pan?» |
| Produto fixo | «Siempre [Nombre del pan]» |
| Escolha do obrador | «Lo que horneemos esa semana» |
| Quantidade | «¿Cuántos por entrega?» |
| Ponto habitual | «¿Dónde lo recoges normalmente?» |
| Dia habitual | «¿Qué día te viene bien?» |
| Preço | `[Pendiente de decisión comercial — DP-13]` |

*Nota sobre a escolha do obrador:*
> Si nos dejas elegir, te decimos qué te toca antes de cada entrega. Suele ser lo que mejor esté esa semana.

## 14.5 Nomes de plano — propostas

> **Propostas, não decisões.** `[Pendiente de decisión comercial — DP-29]`

| Proposta | Ideia |
|---|---|
| **Plan Semanal** | Descritivo, claro |
| **Plan Quincenal** | idem |
| **Pan de cada semana** | Mais próximo da voz da marca |
| **El de siempre** | Caloroso; funciona bem como nome do plano de produto fixo |

## 14.6 Pagamento recorrente

> ## El pago
>
> Se cobra [cada cuánto], por adelantado, con la tarjeta que dejes guardada. Te avisamos [n] días antes de cada cobro.
> `[Pendiente de decisión comercial — DP-30]`

## 14.7 Gestão do plano

| Ação | Rótulo | Texto |
|---|---|---|
| Pausar | **«Pausar el plan»** | «No te cobramos ni preparamos nada mientras esté en pausa. Cuando quieras, lo reanudas.» |
| Retomar | **«Reanudar el plan»** | «Volvemos a amasar para ti. Tu próxima entrega es el [fecha].» |
| Saltar | **«Saltar esta entrega»** | «Esta semana no te preparamos nada. [Efecto en el cobro].» `[Pendiente — DP-32]` |
| Trocar produto | **«Cambiar el pan»** | «El cambio se aplica a partir de la siguiente entrega.» |
| Mudar ponto | **«Cambiar el punto»** | «Comprobamos que el punto nuevo pueda darte lo que llevas.» |
| Cancelar | **«Cancelar mi plan»** | §14.8 |

*Pausa com entrega já gerada — o caso crítico:*
> **¿Pausamos tu plan?**
> No te cobramos ni preparamos nada mientras esté en pausa.
> **La entrega del [fecha] ya está preparada y se mantiene.** Si tampoco la quieres, puedes cancelarla aparte.
> **[Pausar el plan]** · **[Pausar y cancelar la entrega del [fecha]]** · **[Volver]**

## 14.8 Cancelamento

> **¿Cancelamos tu plan?**
> Tu plan sigue activo hasta el [fecha]. Las entregas que ya has pagado se mantienen. Después no se renueva.
> Puedes volver cuando quieras.
> **[Sí, cancelar el plan]** · **[Volver]**
> `[Pendiente de decisión comercial — DP-35]`

## 14.9 Falha de pagamento

> **No hemos podido cobrar tu plan.**
> Lo volveremos a intentar en los próximos días. Mientras tanto no preparamos entregas nuevas, pero tu plan sigue ahí: en cuanto actualices la tarjeta, seguimos donde estábamos.
> **[Actualizar la tarjeta]**

*Após esgotar tentativas:*
> **Tu plan está suspendido.**
> No hemos conseguido cobrarlo. No lo hemos cancelado: si actualizas la tarjeta, se reanuda.
> **[Actualizar la tarjeta]**

## 14.10 Alteração de preço

> **Cambia el precio de tu Plan de Pan.**
> A partir del [fecha], tu plan pasa a costar [n],[nn] €. Te lo decimos con [n] días de antelación para que decidas.
> Si no te encaja, puedes cancelarlo antes de esa fecha sin ningún coste.
> `[Pendiente de validación jurídica — DP-37]`

---

# 15. Pontos de recolha

## 15.1 Página «Dónde estamos»

> # Dónde estamos
>
> Puedes recoger tu pan en el obrador o en los puntos con los que trabajamos. Cada sitio tiene sus días y su horario, así que míralo antes de reservar.

## 15.2 Obrador principal

> **El obrador**
> [Dirección], Avilés, Asturias
> **Horario:** de 9:00 a 18:00
> **Días de recogida:** [días]
> **Franja de recogida:** de [hora] a [hora]
> [Instrucciones]
> **[Cómo llegar]**

`[Pendiente de datos — DP-25: dirección, días y franja]`

## 15.3 Pontos externos

> **[Nombre del punto]**
> [Dirección], [Ciudad]
> **Horario del sitio:** de [hora] a [hora]
> **Días en que hay pan de FUERZA:** [días]
> **Franja de recogida:** de [hora] a [hora]
> [Instrucciones]
> **[Cómo llegar]**

`[Pendiente de datos — DP-25]`

## 15.4 Nota explicativa — a distinção que evita mais confusão

> **Tres cosas distintas**
>
> El **horario** es cuando el sitio está abierto.
> Los **días de recogida** son los días en que llevamos pan allí.
> La **franja de recogida** es el rato en que tu pedido está esperándote.
>
> No siempre coinciden: un sitio puede abrir todos los días y recibir pan nuestro solo dos.

## 15.5 Estados

**Temporariamente indisponível**
> **Temporalmente no disponible**
> Ahora mismo no estamos llevando pan a [Nombre del punto]. Volveremos a hacerlo en cuanto podamos.

**Próximo ponto**
> **Próximamente**
> Estamos a punto de empezar a llevar pan aquí. Te avisamos cuando abra.

**Fechado numa data**
> **[Nombre del punto] no abre el [fecha].**

## 15.6 Mapa e direções

| Elemento | Texto |
|---|---|
| Mapa | «Ver en el mapa» |
| Direções | **«Cómo llegar»** |
| Sem mapa carregado | «Cargar el mapa» — «El mapa lo carga un servicio externo. Al cargarlo aceptas sus cookies.» |

---

# 16. Obrador — `/obrador`

## 16.1 Cabeçalho

> # El obrador
>
> Aquí se hace el pan. Somos pocos, el sitio es pequeño y el horno tiene un límite. Todo lo que sigue sale de ahí.

## 16.2 Massa mãe

> ## La masa madre
>
> No usamos levadura industrial. Usamos masa madre: harina y agua que fermentan solas y que hay que alimentar cada día, como cualquier cosa viva.
>
> Si un día se te olvida, el pan del día siguiente lo nota. Por eso alguien viene a alimentarla también los días que no abrimos.

## 16.3 Fermentação

> ## La fermentación
>
> Después de amasar, la masa reposa [n] horas. Durante ese tiempo no hacemos nada: solo esperamos.
>
> En esas horas pasan dos cosas. El pan se vuelve más fácil de digerir, porque la fermentación descompone parte de lo que cuesta más asimilar. Y coge sabor, que es lo que no se puede acelerar de ninguna manera.

`[Pendiente de datos del obrador — horas de fermentación]`

## 16.4 O forno

> ## El horno
>
> Formamos cada pieza a mano y va al horno con vapor. La corteza se hace en los primeros minutos; el resto es dejar que termine.
>
> Cuando sale, todavía no está hecho del todo: sigue trabajando por dentro mientras se enfría. Por eso conviene esperar antes de cortarlo.

## 16.5 Produção limitada

> ## Por qué hay una cantidad limitada
>
> No es una estrategia. Es que tenemos un horno, unas manos y unas horas.
>
> Cada día podemos hacer una cantidad concreta de cada pan. Si hiciéramos más, saldría peor. Si hiciéramos de más por si acaso, se tiraría.
>
> Por eso pedimos que reserves: así hacemos exactamente el pan que hace falta.

## 16.6 A rotina

> ## Cómo es un día aquí
>
> Se empieza temprano, porque la masa lleva su tiempo y no se puede adelantar. Se amasa, se espera, se forma, se hornea y se reparte.
>
> El horario del obrador es de 9:00 a 18:00, pero la masa del día siguiente ya está trabajando cuando cerramos.

## 16.7 Desperdício

> ## Lo que no se tira
>
> El pan no dura, y eso es lo normal en un pan sin conservantes. Lo que no queremos es tirarlo.
>
> Trabajar con reservas nos deja hacer las cuentas casi exactas: sabemos cuánto pan tiene dueño antes de encender el horno. Es la razón principal de que este sitio funcione así.

## 16.8 CTA

> **[Ver el pan de esta semana]**

> **Nota de escrita para esta página.** Descrever o trabalho, não idealizá-lo. Sem «amor», sem «alma», sem «secreto de familia». O que torna esta página credível é o detalhe concreto — horas, temperaturas, o que corre mal — não o adjetivo.

---

# 17. Nosotros — `/nosotros`

## 17.1 Cabeçalho

> # Nosotros
>
> Somos un obrador pequeño de masa madre en Asturias.

## 17.2 História

> ## Cómo empezó esto
>
> [Cómo empezó, en 2–3 frases concretas: quién, qué hacía antes, por qué el pan.]
> `[Pendiente de datos del obrador — no inventar fechas, nombres ni acontecimientos]`

## 17.3 Pessoas

> ## Quién lo hace
>
> Somos [n] personas. Cada hogaza pasa por unas manos concretas, y esas manos tienen nombre.

*Por pessoa:*
> **[Nombre]**
> [Lo que hace, en lenguaje llano]
> «[Una frase suya, en primera persona.]»
> `[Pendiente de datos y de fotografía]`

## 17.4 Asturias

> ## Por qué aquí
>
> Asturias tiene cereal, tiene molinos y tiene gente que sabe de esto. Hacer pan aquí con harina de fuera no tendría mucho sentido.
>
> Estamos en Avilés. Trabajamos con [productores locales], y cuando podemos decir de dónde viene una harina, lo decimos en la ficha del pan.
> `[Pendiente de datos — no inventar nombres de molinos ni productores]`

## 17.5 Comunidade

> ## El pan no se levanta solo
>
> Hay quien cultiva el cereal, quien lo muele, quien amasa y quien espera al otro lado del mostrador. Nosotros estamos en medio de todo eso.
>
> El nombre viene de ahí: hace falta ser más de uno para levantar algo que pesa.

## 17.6 Valores

Reutiliza os quatro blocos de §4.4.

## 17.7 Obrador pequeno

> ## Somos un obrador pequeño, pero con mucha fuerza
>
> No queremos ser grandes. Queremos hacer bien la cantidad que podemos hacer, conocer a quien nos compra, y que el pan de la semana que viene sea igual de bueno que el de esta.

## 17.8 CTA

> **[Ver el pan]** · **[Dónde estamos]**

---

# 18. Contacto — `/contacto`

## 18.1 Cabeçalho

> # Contacto
>
> Si tienes una duda sobre un pedido, escríbenos con tu código y lo miramos. Para cualquier otra cosa, también estamos aquí.

## 18.2 Nota importante

> **¿Es sobre un pedido que ya tienes?**
> En [Mi cuenta] puedes ver el estado, cambiar cosas y cancelarlo si todavía estás a tiempo. Suele ser más rápido que escribirnos.

## 18.3 Formulário

| Campo | Etiqueta | Ajuda |
|---|---|---|
| Motivo | «¿Sobre qué nos escribes?» | Opções: «Un pedido» · «Alergias e ingredientes» · «El Plan de Pan» · «Puntos de recogida» · «Otra cosa» |
| Código | «Código del pedido» *(opcional)* | «Si es sobre un pedido, ponlo aquí y vamos más rápido.» |
| Nome | «Nombre» | — |
| Email | «Correo electrónico» | «Te respondemos aquí.» |
| Telefone | «Teléfono (opcional)» | «Solo si prefieres que te llamemos.» |
| Mensagem | «Cuéntanos» | — |
| Consentimento | ☐ He leído la [Política de privacidad] y acepto que uséis mis datos para responderme. | — |
| Enviar | **«Enviar»** | |

## 18.4 Estados

**Sucesso**
> **Mensaje enviado.**
> Te respondemos en [plazo]. Si es urgente y es sobre un pedido de hoy, llámanos al [teléfono].
> `[Pendiente de datos — plazo de respuesta y teléfono]`

**Erro**
> **No hemos podido enviar tu mensaje.**
> Puede ser cosa de la conexión. Inténtalo otra vez, o escríbenos directamente a [correo].

**Alergias — nota destacada junto ao motivo correspondente**
> Si es por una alergia, escríbenos **antes de reservar**. Trabajamos en un obrador pequeño y preferimos decírtelo con seguridad.

---

# 19. FAQ

## 19.1 Reservar y pagar

**¿Cómo reservo?**
> Eliges el pan, el punto donde lo quieres recoger y el día. Pagas y ya está: te mandamos un código y te esperamos.

**¿Cuándo se paga?**
> Al reservar. En el punto de recogida no se paga nada.

**¿Por qué hay que pagar antes?**
> Porque así sabemos exactamente cuánto pan hornear. Si la gente reservara sin pagar, seguiríamos haciendo pan a ojo, y eso acaba en pan tirado.

**¿Cuándo está confirmado mi pedido?**
> Cuando se completa el pago. Hasta ese momento no lo damos por hecho ni te guardamos el pan.

**¿Hasta cuándo puedo reservar para un día?**
> Cerramos los pedidos de cada día el [fecha] a las [hora]. A partir de ahí la masa ya está en marcha y no podemos añadir nada.
> `[Pendiente de decisión comercial — DP-02]`

**¿Hace falta crear una cuenta?**
> No. Puedes reservar sin cuenta. Si luego quieres una, te la ofrecemos al terminar, y ahí guardamos también los pedidos que hayas hecho antes con ese correo.

## 19.2 Recoger

**¿Dónde recojo el pan?**
> En el obrador o en cualquiera de los puntos con los que trabajamos. Los tienes todos en [Dónde estamos], con sus días y sus horarios.

**¿Y si no puedo ir en la franja de recogida?**
> Puede ir otra persona en tu lugar: solo tiene que decir tu código. Si no te va a dar tiempo, cancela y reserva otro día.

**¿Qué pasa si no lo recojo?**
> El pan se queda allí y se pierde. [Política de no recogida].
> `[Pendiente de decisión comercial — DP-22]`

## 19.3 Cambios y cancelaciones

**¿Puedo cancelar?**
> Sí, hasta el [fecha] a las [hora]. Te devolvemos el importe al mismo método con el que pagaste.
> `[Pendiente de decisión comercial — DP-08]`

**¿Puedo cambiar el día, el punto o la cantidad?**
> De momento no se puede editar un pedido. Lo que sí puedes es cancelarlo, si todavía estás a tiempo, y hacer otro.
> `[Pendiente de decisión comercial — DP-20]`

**¿Y si cerráis un punto o pasa algo con mi pedido?**
> Te avisamos en cuanto lo sepamos y te damos una alternativa. Si no te sirve, te devolvemos el importe entero.

## 19.4 El pan

**¿Cómo funcionan los alérgenos?**
> Cada pan tiene su lista en la ficha, con lo que contiene y lo que puede contener por trabajar todo en el mismo obrador. Si tienes una alergia, escríbenos antes de reservar.

**¿Cuánto aguanta el pan?**
> Depende del pan; lo pone en cada ficha. En general, un pan de masa madre aguanta bastante más que uno normal. No lo metas en la nevera.

**¿Se puede congelar?**
> Sí, y se congela bien. Córtalo en rebanadas el mismo día y congélalo. Luego va directo a la tostadora.

**¿Por qué se agota tan pronto?**
> Porque hacemos una cantidad limitada de cada pan. No es una estrategia: es el tamaño del horno y el de la plantilla.

**¿Podéis avisarme cuando vuelva a haber?**
> Sí. En la ficha del pan agotado puedes pedir que te avisemos.

## 19.5 Plan de Pan

**¿Qué es el Plan de Pan?**
> Es para quien compra lo mismo casi todas las semanas. Eliges qué pan y cada cuánto, y nosotros te lo guardamos y lo horneamos sin que tengas que reservarlo cada vez.

**¿Me aseguro el pan aunque se agote?**
> Sí. Reservamos el pan de los planes antes de abrir la venta del día.

**¿Puedo pausarlo si me voy de vacaciones?**
> Sí. Lo pausas desde tu cuenta y no te cobramos ni preparamos nada. Cuando vuelvas, lo reanudas.

**¿Puedo cancelarlo cuando quiera?**
> Sí, desde tu cuenta y sin tener que llamar a nadie.
> `[Pendiente de decisión comercial — DP-35]`

**¿Cuánto cuesta?**
> `[Pendiente de decisión comercial — DP-13]`

## 19.6 Otras

**¿Hacéis envíos a casa?**
> No. Solo reserva y recogida.

**¿Puedo pagar en el punto de recogida?**
> No. Todo se paga al reservar.

**No encuentro respuesta a lo mío.**
> Escríbenos desde [Contacto] y te respondemos.

---

# 20. Emails transacionais

**Regras comuns:** remetente «FUERZA»; assunto ≤ 45 caracteres, legível na pré-visualização do telemóvel; *preheader* que acrescenta, nunca repete; sem exclamações; **os emails 1, 3 e 4 dizem explicitamente que não há nada a pagar na recolha** (`DA-01`).

## 20.1 Confirmação de encomenda

> **Assunto:** Tu pan está reservado
> **Preheader:** [fecha], de [hora] a [hora], en [Nombre del punto]

> **Tu pan está reservado.**
>
> Te esperamos el **[fecha]**, de **[hora]** a **[hora]**, en **[Nombre del punto]**.
>
> **Tu código: FZ-XXXX**
>
> [Dirección]
> [Instrucciones de recogida]
>
> **Tu pedido**
> [n] × [Nombre del pan] — [n],[nn] €
> **Total pagado: [n],[nn] €** · IVA incluido
>
> **Ya está pagado.** El día de la recogida solo tienes que recogerlo.
>
> [Ver mi pedido] · [Cómo llegar]
>
> Si algo no cuadra, respóndenos a este correo con tu código.

## 20.2 Pagamento não concluído

> **Assunto:** Tu pedido no se ha completado
> **Preheader:** No hemos podido cobrarlo, así que no queda reservado

> **Tu pedido no se ha completado.**
>
> No hemos podido cobrarlo, así que **no queda reservado** y el pan ha vuelto a estar disponible para otras personas.
>
> Si lo quieres, todavía puedes intentarlo.
>
> [Intentar de nuevo]

## 20.3 Lembrete de recolha

> **Assunto:** Mañana recoges tu pan
> **Preheader:** [Nombre del punto], de [hora] a [hora]

> **Mañana recoges tu pan.**
>
> **[fecha]**, de **[hora]** a **[hora]**
> **[Nombre del punto]** · [Dirección]
>
> **Tu código: FZ-XXXX**
>
> No tienes que pagar nada al recogerlo.
>
> [Cómo llegar]

## 20.4 Pronto para recolher

> **Assunto:** Tu pan ya está listo
> **Preheader:** Puedes pasar a recogerlo hasta las [hora]

> **Tu pan ya está listo.**
>
> Puedes pasar a recogerlo el **[fecha]**, hasta las **[hora]**, en **[Nombre del punto]**.
>
> **Tu código: FZ-XXXX**
>
> Ya está pagado: solo tienes que recogerlo.

## 20.5 Entregue no ponto

> **Assunto:** Tu pan ya está en [Nombre del punto]
> **Preheader:** Te espera hasta las [hora] del [fecha]

> **Tu pan ya está en [Nombre del punto].**
>
> Lo hemos llevado esta mañana. Te espera hasta las **[hora]** del **[fecha]**.
>
> **Tu código: FZ-XXXX**
> [Dirección] · [Instrucciones]
>
> [Cómo llegar]

## 20.6 Cancelamento pelo cliente

> **Assunto:** Pedido cancelado
> **Preheader:** Te devolvemos [n],[nn] €

> **Hemos cancelado tu pedido del [fecha].**
>
> Te devolvemos **[n],[nn] €** al mismo método con el que pagaste. Suele tardar unos días en aparecer en tu cuenta.
>
> Cuando quieras, aquí seguimos.
>
> [Ver el pan]

## 20.7 Cancelamento pelo obrador

> **Assunto:** No podemos preparar tu pedido
> **Preheader:** Te devolvemos el importe completo

> **No podemos preparar tu pedido del [fecha].**
>
> [Motivo, en una frase].
>
> Te devolvemos **[n],[nn] €** al mismo método con el que pagaste. Tarda unos días en aparecer.
>
> Sentimos el trastorno.

## 20.8 Reembolso

> **Assunto:** Te hemos devuelto [n],[nn] €
> **Preheader:** Pedido FZ-XXXX

> **Te hemos devuelto [n],[nn] €.**
>
> Del pedido **FZ-XXXX** del [fecha]. [Motivo].
>
> Va al mismo método con el que pagaste y suele tardar unos días en aparecer en tu cuenta.

## 20.9 Mudança de ponto

> **Assunto:** Cambia el punto de recogida de tu pedido
> **Preheader:** Ahora lo recoges en [Nuevo punto]

> **Cambia dónde recoges tu pedido del [fecha].**
>
> [Punto anterior] no va a poder darte el pedido ese día. Lo hemos pasado a **[Nuevo punto]**.
>
> **[Nuevo punto]** · [Dirección]
> De **[hora]** a **[hora]**
> Tu código sigue siendo el mismo: **FZ-XXXX**
>
> Si no te viene bien, cancélalo y te devolvemos el importe entero.
>
> [Ver mi pedido] · [Cancelar el pedido]

## 20.10 Encerramento

> **Assunto:** El [fecha] no abrimos
> **Preheader:** Cómo afecta a tu pedido

> **El [fecha] no vamos a hornear.**
>
> [Motivo, en una frase].
>
> Tu pedido de ese día [se ha movido al [fecha] / se ha cancelado y te devolvemos [n],[nn] €].
>
> [Ver mi pedido]

## 20.11 Conta criada

> **Assunto:** Ya tienes cuenta en FUERZA
> **Preheader:** Aquí guardamos tus pedidos

> **Ya tienes cuenta.**
>
> Aquí vas a tener todos tus pedidos, lo próximo que recoges y tus datos.
>
> Si habías reservado antes con este correo, ya lo hemos guardado todo.
>
> [Ir a mi cuenta]

## 20.12 Recuperação de palavra-passe

> **Assunto:** Cambiar tu contraseña
> **Preheader:** El enlace vale [n] hora(s)

> **Para cambiar tu contraseña, entra aquí.**
>
> [Cambiar la contraseña]
>
> El enlace vale **[n] hora(s)**. Si no has sido tú, no hagas nada: tu contraseña sigue igual.

## 20.13 Subscrição criada — fase 2

> **Assunto:** Tu Plan de Pan ya está en marcha
> **Preheader:** Primera entrega: [fecha]

> **Tu Plan de Pan ya está en marcha.**
>
> **Qué llevas:** [contenido]
> **Cada cuánto:** [frecuencia]
> **Dónde:** [Nombre del punto]
> **Primera entrega:** [fecha]
>
> Te reservamos el pan antes de abrir la venta del día. Aunque se agote, el tuyo está.
>
> [Ver mi plan]

## 20.14 Renovação — fase 2

> **Assunto:** Tu plan se renueva el [fecha]
> **Preheader:** [n],[nn] € · Puedes pausarlo antes

> **Tu Plan de Pan se renueva el [fecha].**
>
> Te cobraremos **[n],[nn] €** ese día.
>
> Si te vas fuera o esta vez no te viene bien, puedes pausarlo o saltar una entrega desde tu cuenta antes de esa fecha.
>
> [Ver mi plan]

## 20.15 Pausa — fase 2

> **Assunto:** Tu plan está en pausa
> **Preheader:** No te cobramos nada mientras tanto

> **Tu plan está en pausa.**
>
> No te cobramos ni preparamos nada. [Se reanuda el [fecha] / Lo reanudas cuando quieras].
>
> [Reanudar el plan]

## 20.16 Retoma — fase 2

> **Assunto:** Volvemos a amasar para ti
> **Preheader:** Próxima entrega: [fecha]

> **Volvemos a amasar para ti.**
>
> Tu plan está otra vez activo. La próxima entrega es el **[fecha]** en **[Nombre del punto]**.
>
> [Ver mi plan]

## 20.17 Falha de pagamento da subscrição — fase 2

> **Assunto:** Problema con el pago de tu plan
> **Preheader:** No lo hemos cancelado

> **No hemos podido cobrar tu plan.**
>
> Lo volveremos a intentar en los próximos días. Mientras tanto no preparamos entregas nuevas.
>
> **No lo hemos cancelado.** En cuanto actualices la tarjeta, seguimos donde estábamos.
>
> [Actualizar la tarjeta]

## 20.18 Cancelamento de subscrição — fase 2

> **Assunto:** Tu plan queda cancelado
> **Preheader:** Sigue activo hasta el [fecha]

> **Tu Plan de Pan queda cancelado.**
>
> Sigue activo hasta el **[fecha]**, y las entregas que ya has pagado se mantienen. Después no se renueva.
>
> Puedes volver cuando quieras.
>
> [Ver el pan]

---

# 21. Mensagens de erro

**Regra:** nunca culpar o cliente; nunca mostrar códigos técnicos; sempre uma saída.

| Situação | Mensagem |
|---|---|
| **Genérico** | **Algo no ha salido bien.** No es culpa tuya. Inténtalo otra vez en un momento. **[Intentar de nuevo]** |
| **Sem ligação** | **Parece que no hay conexión.** Lo que has escrito sigue aquí. En cuanto vuelva, puedes continuar. |
| **Sessão expirada** | **Se ha cerrado tu sesión.** Ha pasado un rato sin actividad. Entra otra vez y sigues donde estabas. **[Iniciar sesión]** |
| **Formulário inválido** | **Faltan [n] cosas por revisar.** Te las hemos marcado abajo. |
| **Email inválido** | Este correo no parece completo. Revisa que tenga @ y el dominio. |
| **Telefone inválido** | El teléfono debe tener 9 dígitos. |
| **Campo obrigatório** | Necesitamos tu [campo] para poder avisarte. |
| **Palavra-passe curta** | La contraseña necesita al menos [n] caracteres. |
| **Credenciais erradas** | El correo o la contraseña no coinciden. |
| **Pagamento recusado** | **No hemos podido cobrar tu pedido.** El banco no ha autorizado el pago, así que el pedido no queda reservado. **[Intentar de nuevo]** · **[Usar otra tarjeta]** |
| **Pagamento duplicado** | **Este pedido ya estaba pagado.** Hemos detectado un segundo cobro y te lo devolvemos automáticamente. Tarda unos días en aparecer. |
| **Encomenda não encontrada** | **No encontramos ese pedido.** Revisa el código: son cuatro caracteres después de FZ-. Si sigue sin salir, escríbenos. |
| **Código inválido** | Ese código no nos suena. Míralo en el correo de confirmación. |
| **Acesso não autorizado** | **Esto no es tuyo.** No tienes acceso a esta página. **[Ir a mi cuenta]** |
| **Erro de servidor** | **Algo se nos ha roto.** No es culpa tuya. Ya lo estamos mirando. **[Intentar de nuevo]** |
| **Página não encontrada (404)** | **Esta página no existe.** *(ilustração do pássaro)* Igual buscabas el pan, el obrador o dónde recogerlo. **[Ver el pan]** · **[Ir al inicio]** |
| **Manutenção** | **Estamos arreglando algo.** Volvemos en un rato. Los pedidos que ya tengas hechos están a salvo. |
| **Demasiadas tentativas** | **Demasiados intentos.** Espera [n] minutos y vuelve a probar. |

---

# 22. Estados vazios

**Estrutura:** ilustração · título · uma frase · uma ação.

| Contexto | Título | Frase | Ação |
|---|---|---|---|
| Sem encomendas | **Todavía no has hecho ningún pedido.** | Aquí irán apareciendo cuando reserves. | **[Ver el pan]** |
| Sem próximas recolhas | **Ahora mismo no tienes nada reservado.** | — | **[Ver el pan de esta semana]** |
| Sem produtos | **Todavía no hay nada publicado.** | Estamos preparándolo. | — |
| Sem resultados | **No hay nada con estos filtros.** | — | **[Quitar los filtros]** |
| Sem subscrição | **Todavía no tienes ningún plan.** | El Plan de Pan es para quien compra lo mismo casi todas las semanas. | **[Ver el Plan de Pan]** |
| Sem pontos próximos | **Todavía no llegamos por ahí.** | Estamos abriendo puntos poco a poco. | **[Ver dónde estamos]** |
| Sem notificações | **No hay avisos.** | — | — |
| Sem produção nesse dia | **El [fecha] no horneamos.** | Los días que sí: [días]. | **[Ver el [fecha]]** |
| Carrinho vazio | **Tu pedido está vacío.** | — | **[Ver el pan]** |

---

# 23. Painel do obrador

**Linguagem operacional, não de marketing.** Curta, concreta, no imperativo ou substantivada.

## 23.1 Navegação

| Rótulo |
|---|
| **Producción** |
| **Pedidos** |
| **Productos** |
| **Disponibilidad** |
| **Puntos de recogida** |
| **Clientes** |
| **Suscripciones** *(fase 2)* |
| **Excepciones** |
| **Configuración** |

## 23.2 Produção

| Elemento | Rótulo |
|---|---|
| Datas rápidas | «Hoy» · «Mañana» · «Elegir fecha» |
| Totais | «[n] unidades · [n] pedidos» |
| Vistas | «Por producto» · «Por punto» · «Pedidos» |
| Estado aberto | **«Pedidos abiertos — esta lista todavía puede cambiar»** |
| Estado fechado | «Pedidos cerrados» |
| Fechar | **«Cerrar pedidos del [fecha]»** |
| Imprimir | **«Imprimir»** |
| Exportar | **«Exportar CSV»** |

## 23.3 Ações

| Ação | Rótulo |
|---|---|
| Preparar | **«Marcar como preparado»** |
| Pronto | **«Marcar como listo»** |
| Entregar ao ponto | **«Marcar lote entregado en [punto]»** |
| Recolhido | **«Confirmar recogida»** |
| Não recolhido | **«Marcar como no recogido»** |
| Cancelar | **«Cancelar pedido»** |
| Reembolsar | **«Reembolsar»** |
| Reembolso parcial | **«Reembolsar parte»** |
| Procurar | «Buscar por código, nombre o correo» |
| Seleção | «[n] pedidos seleccionados» |
| Limpar seleção | «Quitar selección» |

## 23.4 Confirmações

| Ação | Texto |
|---|---|
| Reembolsar | «Vas a devolver [n],[nn] € del pedido FZ-XXXX. Indica el motivo.» |
| Cancelar | «Vas a cancelar el pedido FZ-XXXX y devolver [n],[nn] €. Indica el motivo.» |
| Fechar pedidos | «A partir de ahora no se aceptan más pedidos para el [fecha]. Los totales quedan fijados.» |
| Motivo | «Motivo (obligatorio)» |

## 23.5 Avisos e bloqueios

| Situação | Texto |
|---|---|
| Reduzir limite abaixo do reservado | **No se puede.** Ya hay [n] unidades reservadas para el [fecha]. Para bajar el límite tendrías que cancelar pedidos primero. |
| Desativar ponto com encomendas | **No se puede.** [Nombre del punto] tiene [n] pedidos activos. Muévelos a otro punto o cancélalos antes. |
| Publicar produto incompleto | **Falta información.** Para publicar [producto] necesitas: [lista de lo que falta]. |
| Confirmar alergénios | **Confirma los alérgenos de [producto].** Es información legal y queda registrada a tu nombre. |
| Lista de data aberta | **Esta lista todavía puede cambiar.** Los pedidos del [fecha] se cierran el [fecha] a las [hora]. |
| Cliente com faltas | Este cliente no ha recogido [n] pedidos en los últimos [n] meses. |

## 23.6 Exceções

| Elemento | Texto |
|---|---|
| Título | «Excepciones» |
| Contagem | «[n] sin resolver» |
| Vazio | «Nada pendiente.» |
| Resolver | **«Marcar como resuelta»** |
| Descartar | **«Descartar»** |
| Nota | «Nota de resolución» |

**Tipos:**

| Tipo | Descrição |
|---|---|
| Pago sem encomenda | «Hay un pago de [n],[nn] € sin pedido asociado.» |
| Encomenda sem pagamento | «El pedido FZ-XXXX está confirmado pero no consta pagado.» |
| Reserva expirada com pagamento | «Se ha cobrado [n],[nn] € pero la reserva ya había caducado.» |
| Pagamento duplicado | «Dos cobros para el pedido FZ-XXXX.» |
| Capacidade excedida | «Los pedidos del [fecha] superan el límite configurado.» |
| Subscrição sem capacidade | «No cabe la entrega del plan [id] para el [fecha].» |
| Email falhado | «No hemos podido enviar [tipo] al pedido FZ-XXXX.» |

---

# 24. SEO

**Regras:** `title` ≤ 60 caracteres, começa pela proposta de valor — **nunca por «Inicio»** (Doc 01 §9); `meta description` 150–160 caracteres, escrita, não gerada; um `<h1>` por página.

| Página | Campo | Conteúdo |
|---|---|---|
| **Home** | title | Pan de masa madre en Asturias — FUERZA |
| | description | Obrador de masa madre en Asturias. Harinas locales, fermentación lenta y cantidad limitada cada día. Reserva tu pan y recógelo cuando te venga bien. |
| | H1 | Pan de masa madre, hecho entre dos manos y el tiempo. |
| | slug | `/` |
| | OG title | FUERZA — Obrador de masa madre en Asturias |
| | OG description | Reservas el pan antes de que lo horneemos. Nosotros hacemos exactamente el que hace falta. |
| **Pan** | title | El pan que horneamos — FUERZA |
| | description | Panes de masa madre con harinas locales y fermentación lenta. Mira lo que queda de verdad para cada día y reserva el tuyo. |
| | H1 | El pan |
| | slug | `/pan` |
| | OG title | El pan de FUERZA |
| | OG description | Masa madre, harina local y fermentación lenta. Reserva y recoge en Asturias. |
| **Ficha** | title | [Nombre del pan] — Pan de masa madre — FUERZA |
| | description | [Nombre del pan]: [tipo de harina], [n] horas de fermentación y [n] g. Reserva el tuyo y recógelo en [ciudad]. |
| | H1 | [Nombre del pan] |
| | slug | `/pan/[slug]` |
| | OG title | [Nombre del pan] — FUERZA |
| | OG description | [Descripción corta del pan]. |
| **Obrador** | title | Cómo hacemos el pan — FUERZA |
| | description | Masa madre viva, fermentación lenta y una cantidad limitada cada día. Así trabajamos en nuestro obrador de Asturias. |
| | H1 | El obrador |
| | slug | `/obrador` |
| | OG title | El obrador de FUERZA |
| | OG description | Masa madre, tiempo y una cantidad limitada. Así se hace este pan. |
| **Nosotros** | title | Quiénes somos — FUERZA, obrador en Asturias |
| | description | Somos un obrador pequeño de masa madre en Avilés, Asturias. Trabajamos con harinas locales y con la gente que tenemos cerca. |
| | H1 | Nosotros |
| | slug | `/nosotros` |
| | OG title | Somos un obrador pequeño |
| | OG description | Masa madre en Asturias. Harina de aquí y las manos que hacen falta. |
| **Plan de Pan** | title | Plan de Pan — Tu pan cada semana — FUERZA |
| | description | Elige qué pan y cada cuánto. Te lo reservamos antes de abrir la venta del día y lo recoges donde te venga bien. |
| | H1 | Plan de Pan |
| | slug | `/suscripciones` |
| | OG title | Plan de Pan — FUERZA |
| | OG description | Tu pan, sin tener que acordarte. |
| **Reserva y recoge** | title | Cómo reservar y recoger tu pan — FUERZA |
| | description | Eliges el pan y el día, pagas al reservar y lo recoges en el punto que prefieras. En el punto no se paga nada. |
| | H1 | Reserva y recoge |
| | slug | `/reservas` |
| | OG title | Reserva y recoge — FUERZA |
| | OG description | Tres pasos: eliges, pagas y recoges. |
| **Dónde estamos** | title | Dónde recoger tu pan — FUERZA, Asturias |
| | description | Nuestro obrador y los puntos donde puedes recoger tu pan en Asturias, con sus días, horarios y franjas de recogida. |
| | H1 | Dónde estamos |
| | slug | `/donde-estamos` |
| | OG title | Dónde recoger tu pan |
| | OG description | El obrador y los puntos de recogida en Asturias. |
| **Contacto** | title | Contacto — FUERZA |
| | description | ¿Dudas con un pedido, con los alérgenos o con el Plan de Pan? Escríbenos y te respondemos. |
| | H1 | Contacto |
| | slug | `/contacto` |
| | OG title | Contacto — FUERZA |
| | OG description | Escríbenos y te respondemos. |

**Não indexáveis:** `noindex` em `/cuenta`, `/admin`, checkout e páginas de estado.

---

# 25. Microcopy de acessibilidade

Todos os nomes acessíveis em es-ES (Doc 03 §20).

## 25.1 Botões de ícone

| Elemento | Nome acessível |
|---|---|
| Menu | «Abrir menú» / «Cerrar menú» |
| Fechar | «Cerrar» |
| Carrinho | «Ver el carrito, [n] artículos» |
| Conta | «Mi cuenta» |
| Mostrar palavra-passe | «Mostrar la contraseña» / «Ocultar la contraseña» |
| Aumentar | «Añadir uno más de [Nombre del pan]» |
| Diminuir | «Quitar uno de [Nombre del pan]» |
| Remover | «Quitar [Nombre del pan] del pedido» |
| Copiar código | «Copiar el código de recogida» |
| Mês anterior | «Mes anterior» |
| Mês seguinte | «Mes siguiente» |

## 25.2 Anúncios dinâmicos

| Evento | Anúncio |
|---|---|
| Item adicionado | «[Nombre del pan] añadido. Llevas [n] artículos.» |
| Item removido | «[Nombre del pan] quitado. Llevas [n] artículos.» |
| Quantidade | «Cantidad: [n].» |
| Total | «Total: [n],[nn] euros.» |
| Stock alterado | «[Nombre del pan] se ha agotado para el [fecha]. Hay alternativas más abajo.» |
| Data escolhida | «Has elegido el [fecha]. Quedan [n] unidades.» |
| Ponto escolhido | «Recoges en [Nombre del punto].» |
| Filtro aplicado | «[n] panes para el [fecha].» |
| Reserva a expirar | «Te quedan dos minutos para terminar el pedido.» |
| Passo do checkout | «Paso [n] de 6: [título].» |
| Carregando | «Cargando.» |
| Concluído | «Listo.» |
| Erro no formulário | «Hay [n] campos por revisar.» |

## 25.3 Calendário

| Estado | Nome acessível |
|---|---|
| Disponível | «[fecha], disponible» |
| Poucas | «[fecha], quedan pocas unidades» |
| Esgotada | «[fecha], agotado» |
| Sem produção | «[fecha], no horneamos» |
| Fechada | «[fecha], cerrado» |
| Após hora-limite | «[fecha], pedidos cerrados» |
| Selecionada | «[fecha], seleccionado» |
| Hoje | «hoy, [fecha], [estado]» |

## 25.4 Modais e gavetas

| Elemento | Texto |
|---|---|
| Título do modal | Coincide com o título visível |
| Fechar | «Cerrar» |
| Carrinho em gaveta | «Tu carrito» |
| Menu em gaveta | «Menú principal» |

## 25.5 Ajuda contextual

| Campo | Ajuda |
|---|---|
| Email | «Aquí te mandamos la confirmación y el código de recogida.» |
| Telefone | «Solo lo usamos para avisarte si hay algún problema el día de la recogida.» |
| Quantidade no máximo | «Es todo lo que queda para el [fecha].» |
| Botão desativado | «Elige una fecha para continuar.» |
| Pagamento | «El pago se procesa de forma segura. No guardamos los datos de tu tarjeta.» |

## 25.6 Ligação de salto e landmarks

| Elemento | Texto |
|---|---|
| Ligação de salto | «Saltar al contenido» |
| Navegação principal | «Navegación principal» |
| Rodapé | «Pie de página» |
| Migalhas | «Estás aquí» |

---

# 26. Conteúdo legal necessário

> **Lista de necessidades, não parecer jurídico.** Nenhum texto legal é redigido neste documento.

| # | Documento | Conteúdo mínimo | Validação |
|---|---|---|---|
| 1 | **Aviso legal** | Titular, dados fiscais, registo, contacto | **Jurídica + fiscal** |
| 2 | **Política de privacidad** | Responsável, finalidades, bases legais, prazos de conservação, direitos, subcontratantes | **Jurídica** — depende de `DP-44`, `DP-53` |
| 3 | **Política de cookies** | Tipos, finalidades, duração, gestão do consentimento | **Jurídica** — depende de `DP-45` |
| 4 | **Condiciones de compra** | Objeto, processo de reserva, **pagamento antecipado** (`DA-01`), preços com IVA, confirmação, recolha, obrigações | **Jurídica** — depende de `DP-12` |
| 5 | **Cancelaciones** | Prazo e condições | **Jurídica** — depende de `DP-08` |
| 6 | **Reembolsos** | Prazos, método, reembolso parcial | **Jurídica** |
| 7 | **No recogida** | O que acontece e se há devolução | **Jurídica** — depende de `DP-22` |
| 8 | **Suscripciones** *(fase 2)* | Renovação, aviso prévio, pausa, cancelamento, **alteração de preço** | **Jurídica** — depende de `DP-30`, `DP-35`, `DP-37` |
| 9 | **Información sobre alérgenos** | Declaração conforme Regulamento (UE) 1169/2011 e responsabilidade do obrador | **Jurídica + segurança alimentar** |
| 10 | **Derecho de desistimiento** | Aplicabilidade a bens perecíveis e a bens feitos por encomenda | **Jurídica** — `DP-49`, **provável exceção legal, por confirmar** |
| 11 | **Facturación** | Fatura simplificada e com dados fiscais, numeração, série | **Fiscal** — `DP-43`, `DP-48` |

**Nota transversal.** Os pontos 4, 5, 7 e 10 têm de ser coerentes entre si e com o que o site diz nas FAQ e no checkout. **Uma contradição entre a FAQ e as condições de compra é um problema legal, não editorial.**

---

# 27. Inventário final

**Estados:** `Pronto` · `Pend. dados` · `Pend. decisão` · `Pend. jurídico` · `Pend. fotografia`

| Página | Bloco | Texto necessário | Estado | Responsável | Dados pendentes | Validação |
|---|---|---|---|---|---|---|
| **Home** | Hero | Eyebrow, H1, subtítulo, 2 CTA, apoio | **Pronto** | — | — | Marca |
| | Lo que sale del horno | Título, intro, estados | **Pronto** | — | — | — |
| | El proceso | Título, intro, 6 etapas | Pend. dados | Obrador | Horas de fermentação | — |
| | Lo que nos mueve | 4 valores | **Pronto** | — | — | — |
| | De dónde viene | Título, texto, origem | Pend. dados | Obrador | **Moinhos e produtores** | — |
| | Plan de Pan | Versão fase 1 | **Pronto** | — | — | — |
| | Reserva y recoge | 3 passos | Pend. decisão | FUERZA | `DP-02` hora-limite | — |
| | Quién lo hace | Título, intro, estrutura | Pend. fotografia | Obrador | **Nomes e retratos** | — |
| | Newsletter | Título, campo, consentimento | Pend. dados | — | Periodicidade | Jurídica |
| **Pan** | Cabeçalho e filtros | Título, intro, filtros, ordenação | **Pronto** | — | — | — |
| | Famílias | 4 nomes e descrições | Pend. decisão | FUERZA | `DP-09` taxonomia | — |
| | Estados | Sem resultados, sem produção | **Pronto** | — | — | — |
| **Ficha** | Estrutura | Todos os campos | **Pronto** | — | — | — |
| | Conteúdo por produto | Nome, descrições, ficha técnica | Pend. dados | Obrador | **Todo o catálogo** | — |
| | Alergénios | Bloco e formato | **Pronto** | — | Dados por produto | **Jurídica** |
| | Conservação | Guardar, congelar, cortar | Pend. dados | Obrador | Dias de conservação | — |
| | Preços | Formato | Pend. decisão | FUERZA | `DP-13` | Fiscal (`DP-12`) |
| **Reserva** | 7 passos | Títulos, instruções, botões | **Pronto** | — | — | — |
| | Hora-limite | Nota | Pend. decisão | FUERZA | `DP-02` | — |
| | Política de cancelamento | Nota no resumo | Pend. decisão | FUERZA | `DP-08` | **Jurídica** |
| **Disponibilidade** | 15 mensagens | Todas | **Pronto** | — | — | — |
| **Carrinho** | Todos os estados | Rótulos e mensagens | **Pronto** | — | — | — |
| **Checkout** | Identificação e consentimentos | Campos, ajudas | **Pronto** | — | `DP-17` campos | **Jurídica** |
| | Pagamento | As 3 mensagens de `DA-01` | **Pronto** | — | — | — |
| **Confirmação** | Todos os blocos | Título, código, ponto, produtos | **Pronto** | — | Formato do código (`DP-24`) | — |
| **Estados** | 9 estados | Rótulos e explicações | **Pronto** | — | — | — |
| **Mi cuenta** | Todos os blocos | Boas-vindas, recolhas, histórico, dados | **Pronto** | — | — | — |
| | Cancelar | Modal e fora de prazo | Pend. decisão | FUERZA | `DP-08` | **Jurídica** |
| | Eliminar conta | Texto e confirmação | Pend. decisão | Jurídico | `DP-44` conservação | **Jurídica** |
| **Plan de Pan** | Apresentação e funcionamento | Títulos, benefícios | **Pronto** | — | — | — |
| | Planos e frequências | Nomes e opções | Pend. decisão | FUERZA | `DP-28`, `DP-29` | — |
| | Preços | — | Pend. decisão | FUERZA | `DP-13` | Fiscal |
| | Pausa, salto, cancelamento | Textos e modais | Pend. decisão | FUERZA | `DP-32`, `DP-35` | **Jurídica** |
| | Alteração de preço | Aviso | Pend. jurídico | Jurídico | `DP-37` | **Jurídica** |
| **Dónde estamos** | Intro e nota explicativa | Textos | **Pronto** | — | — | — |
| | Obrador e pontos | Dados de cada ponto | Pend. dados | FUERZA | **`DP-25` — nada é conhecido** | — |
| **Obrador** | 7 blocos | Todo o texto | Pend. dados | Obrador | Horas, rotina | — |
| **Nosotros** | História e pessoas | Todo o texto | Pend. dados | Obrador | **Nomes, história, produtores** | — |
| | Comunidade e valores | Textos | **Pronto** | — | — | — |
| **Contacto** | Formulário e estados | Campos, sucesso, erro | Pend. dados | FUERZA | Prazo de resposta, telefone | — |
| **FAQ** | 6 grupos | Perguntas e respostas | Parcial | FUERZA | `DP-02`, `DP-08`, `DP-13`, `DP-20`, `DP-22`, `DP-35` | **Jurídica** |
| **Emails** | 12 da fase 1 | Assunto, preheader, corpo | **Pronto** | — | — | — |
| | 6 da fase 2 | idem | **Pronto** | — | Depende de `DP-28` | — |
| **Erros** | 18 mensagens | Todas | **Pronto** | — | — | — |
| **Vazios** | 9 estados | Todos | **Pronto** | — | — | — |
| **Painel** | Navegação e ações | Todos os rótulos | **Pronto** | — | — | — |
| | Avisos e exceções | Mensagens | **Pronto** | — | — | — |
| **SEO** | 9 páginas | Title, description, H1, OG | **Pronto** | — | Ficha depende do catálogo | — |
| **Acessibilidade** | Microcopy | Nomes, anúncios, ajudas | **Pronto** | — | — | — |
| **Legais** | 11 documentos | Todos | **Pend. jurídico** | Jurídico/Fiscal | `DP-12`, `DP-43`, `DP-44`, `DP-48`, `DP-49` | **Jurídica + fiscal** |

## 27.1 Resumo do inventário

| Estado | Blocos |
|---|---:|
| **Pronto** | 30 |
| Pendente de dados do obrador | 10 |
| Pendente de decisão comercial | 10 |
| Pendente de validação jurídica ou fiscal | 11 |
| Pendente de fotografia | 1 |

## 27.2 Os três bloqueios maiores

1. **Catálogo de produtos** — nada pode ser escrito sem os produtos reais, farinhas, horas de fermentação, pesos, alergénios e preços. É o maior volume de conteúdo em falta.
2. **Dados dos pontos** (`DP-25`) — nenhuma morada, horário, dia ou janela é conhecido. Afeta a home, o checkout, «Dónde estamos» e todos os emails.
3. **Textos legais** — 11 documentos, todos dependentes de validação jurídica ou fiscal, vários dependentes de decisões comerciais ainda pendentes.

---

## Próximos documentos

| Doc | Título | Dependências |
|---|---|---|
| **06** | Plano de implementação | Docs 02–05 + resolução das decisões bloqueantes |

---

*Sem código, sem páginas, sem componentes. Nenhum produto, preço, morada, horário, nome de pessoa, moinho ou produtor foi inventado. Todos os marcadores `[…]` têm de ser resolvidos antes da publicação — a verificação de CI de Doc 02 §13.9 quebra o build se algum sobreviver.*
