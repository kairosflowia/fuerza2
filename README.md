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

Na Fase 0, as variáveis podem permanecer vazias: ainda não existem integrações com serviços externos. Nunca coloques secrets ou ficheiros `.env*` reais no Git.

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

## Documentação

As decisões do projeto estão em [`docs/`](./docs/). O plano de execução encontra-se em [`docs/06-roadmap-de-implementacao.md`](./docs/06-roadmap-de-implementacao.md).

## Vercel

O projeto usa a configuração padrão do Next.js. Na Vercel, o Root Directory deve permanecer na raiz do repositório, onde se encontra o `package.json`; o comando de build é `npm run build`.
