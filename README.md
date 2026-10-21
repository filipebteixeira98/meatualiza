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
npm run test:firebase
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
- `src/lib/firebase`: inicialização separada do Auth no navegador e do Admin SDK no servidor.
- `tests/landing.spec.ts`: navegação e responsividade com Playwright.
- `tests/firebase`: configuração, isolamento dos emuladores e regras de acesso, com o test runner do Node.

As cores são definidas por variáveis CSS em `src/app/globals.css`. As fontes Geist são servidas localmente e sua licença está em `src/app/fonts/LICENSE.txt`.

## Firebase e desenvolvimento local

A preparação de F2-A adiciona os SDKs e os testes; a autenticação na interface será entregue em F2-B. Use Node.js 24 e Java 21 ou superior para os emuladores. A CLI Firebase está nas dependências de desenvolvimento e usa a versão resolvida no lockfile.

```sh
cp .env.example .env.local
npm run emulators
```

Em outro terminal, execute `npm run dev`. Auth usa `127.0.0.1:9099` e Firestore usa `127.0.0.1:8080`. Os comandos `emulators` e `test:firebase` sempre selecionam `demo-meatualiza`; não precisam de conta Google, projeto de nuvem nem credencial administrativa. `test:firebase` inicia e encerra os dois serviços automaticamente. A primeira execução pode baixar o emulador do Firestore.

As funções validam a configuração antes de inicializar. Projetos `demo-` exigem emuladores; projetos reais não podem ser usados com eles. Emuladores são recusados em produção. Reinicie o Next.js após alterar as variáveis públicas; elas entram no bundle durante o build.

O Auth do navegador mantém tokens apenas em memória. O Admin SDK é protegido por `server-only` e usa Application Default Credentials fora dos emuladores. Uma sessão de login do Firebase CLI/MCP não fornece automaticamente credenciais ao servidor Next.js. Para acesso real, configure ADC no ambiente de execução ou informe `GOOGLE_APPLICATION_CREDENTIALS` apontando para um arquivo privado fora do Git, por exemplo em `.secrets/`. Nunca use `NEXT_PUBLIC_` para credenciais administrativas.

Para configurar o app real, obtenha os valores públicos com:

```sh
npx firebase apps:sdkconfig web 1:450905441860:web:6ea0a56d73d65d42bf5e11 --project meatualiza-monitoria
```

Preencha as quatro variáveis públicas correspondentes, defina `NEXT_PUBLIC_FIREBASE_USE_EMULATORS=false` e `FIREBASE_PROJECT_ID=meatualiza-monitoria` e remova as duas variáveis `EMULATOR_HOST`. `.env.example` contém somente valores fictícios locais; `.env.local`, logs e credenciais não são versionados.

As regras de Firestore negam todo acesso direto do cliente, inclusive de usuários com claim de monitor. Elas foram publicadas e conferidas no projeto real. O Admin SDK ignora essas regras: cada operação de servidor nas próximas entregas deverá verificar identidade, titularidade e privilégio. Os testes verificam escrita administrativa e recusam leitura/escrita de clientes sem login, alunos e monitores, usando somente dados fictícios nos emuladores.

Google foi habilitado no projeto real por configuração administrativa; o e-mail de suporte não é versionado. Para repetir em outro projeto, habilite Google em Authentication → Sign-in method, configure marca e suporte e revise Settings → Authorized domains. No projeto atual estão autorizados os domínios Firebase, `localhost` e `127.0.0.1`; o domínio de hospedagem definitivo será definido em F8. O teste de OAuth real no navegador pertence a F2-B/F2-C.

## Serviços e próximas integrações

Configuração e verificação em 20/10/2026:

| Serviço             | Situação                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase            | Projeto `meatualiza-monitoria`, app Meatualiza Web registrado, Google habilitado e banco Firestore Standard `(default)` em `southamerica-east1` (São Paulo). Emuladores e regras de acesso fechado preparados em F2-A. |
| Sentry              | Conexão disponível; a busca por Meatualiza na organização acessível não encontrou projeto correspondente. Integração prevista para F7.                                                                                 |
| PostHog             | Conexão disponível com projeto ativo chamado “Default project”; ainda é necessário definir o projeto destinado à plataforma antes de instrumentar eventos e surveys.                                                   |
| Hospedagem e GitHub | Repositório em [filipebteixeira98/meatualiza](https://github.com/filipebteixeira98/meatualiza), com remoto `origin` configurado e workflow de CI para PRs. Hospedagem ainda não vinculada.                             |

Esta etapa não coleta analytics nem envia dados de alunos aos serviços. O projeto Firebase dedicado foi criado a pedido do responsável; Sentry e PostHog permanecem sem alterações. A conta Google ativa no MCP foi confirmada como a conta do monitor; seu privilégio será atribuído pelo UID após o primeiro acesso. Autenticação, inscrições, painéis, tour e avaliações seguem nas fases seguintes do [roadmap](./ROADMAP.md).

O pipeline de publicação será configurado na fase F8, após definir a hospedagem. As regras aprovadas estão em [INSTRUCTIONS.md](./INSTRUCTIONS.md), e os termos do domínio em [GLOSSARY.md](./GLOSSARY.md).

A base Firebase foi integrada à `main` no [PR #3](https://github.com/filipebteixeira98/meatualiza/pull/3), em 21/10/2026. A próxima entrega, F2-B, está detalhada no [plano da fase F2](./PLANO-F2.md): sete tarefas para ambiente, sessão, perfil, acesso, saída e validação. O mesmo documento prepara as três tarefas seguintes de autorização do monitor em F2-C; todas permanecem a fazer no [quadro do roadmap](./ROADMAP.md).

## Verificação das entregas

Build de produção, tipagem, lint e dez verificações de navegador passaram localmente. Dois casos específicos de viewport são pulados no projeto ao qual não se aplicam. As imagens de desktop e celular foram inspecionadas visualmente.

F2-A acrescenta oito testes de configuração, emuladores e regras, todos aprovados. O CI prepara Java 21 e executa esses testes junto às verificações existentes. Login Google e concessão do privilégio de monitor ainda não foram implementados na aplicação.

`npm audit --omit=dev` não encontrou vulnerabilidades. Um override de `@grpc/grpc-js` para `^1.14.6` evita a versão antiga transitiva do SDK Firestore e o [alerta de validação de certificados](https://github.com/advisories/GHSA-m9gg-hp2v-232j); os testes exercitam o SDK com essa versão. Remover o override quando o Firebase adotar uma versão corrigida compatível.

A auditoria completa ainda registra 15 entradas nas ferramentas de desenvolvimento (11 altas e quatro moderadas), incluindo o [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), já presente em F1, e dependências da CLI Firebase. `npm audit fix` aplicou as correções compatíveis disponíveis. Não aplicar downgrade incompatível sugerido por correção forçada. Revisar essas dependências quando houver atualização compatível; elas não fazem parte da auditoria de produção acima.
