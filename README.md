# meatualiza

Plataforma de monitoria de Lógica de Programação. Encontros presenciais às segundas e quartas, das 11h30 às 12h30, no SENAI Dendezeiros, laboratório de informática L7, para até dez alunos por sessão.

## Executar localmente

Use Node.js 24 e npm. As versões resolvidas estão em `package-lock.json`.

```sh
npm ci
npm run dev
```

Abra <http://localhost:3000>. A rota `/` apresenta a landing page compacta em tema escuro, com a lista de assuntos recolhida por padrão. `/entrar` informa que o acesso está em preparação; o login Google será implementado na fase F2.

## Verificar

```sh
npm run format:check
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Os testes iniciam o servidor de produção em `127.0.0.1:3100`; execute o build antes deles. Incluem conteúdo da monitoria, FAQ e navegação por teclado, menu móvel, acesso e retorno, e ausência de rolagem horizontal entre 320 e 1440 pixels. Capturas ficam em `test-results/`.

`npm run format` formata os arquivos. O hook Husky executa ESLint e Prettier via lint-staged nos arquivos preparados para commit. O workflow `.github/workflows/ci.yml` executa as verificações e os testes em PRs e alterações na branch `main`.

## Estrutura

- `src/app`: páginas, metadados, fontes locais e tema.
- `src/components/ui`: componentes Shadcn UI.
- `src/components/site`: marca, cabeçalho e rodapé compartilhados.
- `src/features/landing`: seções da apresentação pública.
- `src/lib/monitoria.ts`: informações publicadas da monitoria e assuntos aprovados.
- `tests`: verificações de navegação e responsividade com Playwright.

As cores são definidas por variáveis CSS em `src/app/globals.css`. As fontes Geist são servidas localmente e sua licença está em `src/app/fonts/LICENSE.txt`.

## Serviços e próximas integrações

Configuração e verificação em 20/10/2026:

| Serviço             | Situação                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase            | Projeto dedicado `meatualiza-monitoria` criado com autorização e selecionado no MCP para esta pasta. App web, provedor Google, Firestore e configuração local reproduzível ainda serão preparados em F2-A. |
| Sentry              | Conexão disponível; a busca por Meatualiza na organização acessível não encontrou projeto correspondente. Integração prevista para F7.                                                                     |
| PostHog             | Conexão disponível com projeto ativo chamado “Default project”; ainda é necessário definir o projeto destinado à plataforma antes de instrumentar eventos e surveys.                                       |
| Hospedagem e GitHub | Repositório em [filipebteixeira98/meatualiza](https://github.com/filipebteixeira98/meatualiza), com remoto `origin` configurado e workflow de CI para PRs. Hospedagem ainda não vinculada.                 |

Esta etapa não coleta analytics nem envia dados de alunos aos serviços. O projeto Firebase dedicado foi criado a pedido do responsável; Sentry e PostHog permanecem sem alterações. A conta Google ativa no MCP foi confirmada como a conta do monitor; seu privilégio será atribuído pelo UID após o primeiro acesso. Autenticação, inscrições, painéis, tour e avaliações seguem nas fases seguintes do [roadmap](./ROADMAP.md).

O pipeline de publicação será configurado na fase F8, após definir a hospedagem. As regras aprovadas estão em [INSTRUCTIONS.md](./INSTRUCTIONS.md), e os termos do domínio em [GLOSSARY.md](./GLOSSARY.md).

A base e a landing foram integradas à `main` no [PR #1](https://github.com/filipebteixeira98/meatualiza/pull/1). A próxima entrega está detalhada no [plano da fase F2: identidade e autorização](./PLANO-F2.md), com tarefas, dependências e critérios de aceite.

## Verificação da primeira entrega

Build de produção, tipagem, lint e dez verificações de navegador passaram localmente. Dois casos específicos de viewport são pulados no projeto ao qual não se aplicam. As imagens de desktop e celular foram inspecionadas visualmente.

`npm audit --omit=dev` não encontrou vulnerabilidades. A auditoria completa identifica nove entradas de severidade alta nas ferramentas de desenvolvimento, derivadas do alerta de [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Não havia versão corrigida publicada de `braces` na verificação; `npm audit fix` não resolveu o alerta. A correção forçada sugerida implica downgrade incompatível de ferramentas. Essa pendência deve ser revisada quando houver atualização compatível.
