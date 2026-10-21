# meatualiza

Plataforma de monitoria de Lógica de Programação. Encontros presenciais às segundas e quartas, das 11h30 às 12h30, no SENAI Dendezeiros, laboratório de informática L7, para até dez alunos por sessão.

## Executar localmente

Use Node.js 24 e npm. As versões resolvidas estão em `package-lock.json`.

```sh
npm ci
npm run dev
```

Abra <http://localhost:3000>. A rota `/` apresenta a landing page compacta em tema escuro, com a lista de assuntos recolhida por padrão. `/entrar` oferece acesso Google e `/aluno` apresenta a identificação da conta autenticada. O fluxo foi implementado e testado com emuladores em F2-B; a validação OAuth real aguarda ADC do servidor. Agenda e inscrições vêm nas próximas entregas.

## Verificar

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:firebase
npm run build
npx playwright install chromium
npm test
npm run test:auth
```

Os testes iniciam o servidor de produção em `127.0.0.1:3100`; execute o build antes deles. Incluem conteúdo da monitoria, FAQ e navegação por teclado, menu móvel, acesso e retorno, e ausência de rolagem horizontal entre 320 e 1440 pixels. Capturas ficam em `test-results/`. A suíte `test:auth` inicia os emuladores e um servidor Next.js de desenvolvimento em `127.0.0.1:3101`, com configuração demo explícita e compilação isolada em `.next/auth-tests`; ela não usa serviços reais nem interrompe um servidor de desenvolvimento já aberto. Não execute as duas suítes de emuladores simultaneamente, pois compartilham as portas locais.

`npm run format` formata os arquivos. O hook Husky executa ESLint e Prettier via lint-staged nos arquivos preparados para commit. O workflow `.github/workflows/ci.yml` executa as verificações e os testes em PRs e alterações na branch `main`.

## Estrutura

- `src/app`: páginas, metadados, fontes locais e tema.
- `src/components/ui`: componentes Shadcn UI.
- `src/components/site`: marca, cabeçalho e rodapé compartilhados.
- `src/features/landing`: seções da apresentação pública.
- `src/lib/monitoria.ts`: informações publicadas da monitoria e assuntos aprovados.
- `src/lib/firebase`: inicialização separada do Auth no navegador e do Admin SDK no servidor.
- `src/lib/auth` e `src/app/api/auth`: validação de identidade, perfil, CSRF e cookies de sessão.
- `src/features/auth`: entrada Google e saída com estados de falha e nova tentativa.
- `tests/auth`: fluxo de navegador com o popup Google do Auth Emulator.
- `tests/landing.spec.ts`: navegação e responsividade com Playwright.
- `tests/firebase`: configuração, isolamento dos emuladores e regras de acesso, com o test runner do Node.

As cores são definidas por variáveis CSS em `src/app/globals.css`. As fontes Geist são servidas localmente e sua licença está em `src/app/fonts/LICENSE.txt`.

## Firebase e desenvolvimento local

F2-A prepara os SDKs e F2-B implementa o acesso do aluno. Use Node.js 24 e Java 21 ou superior para os emuladores. A CLI Firebase está nas dependências de desenvolvimento e usa a versão resolvida no lockfile.

```sh
cp .env.example .env.local
npm run emulators
```

Em outro terminal, execute `npm run dev`. Auth usa `127.0.0.1:9099` e Firestore usa `127.0.0.1:8080`. Os comandos `emulators`, `test:firebase` e `test:auth` sempre selecionam `demo-meatualiza`; não precisam de conta Google, projeto de nuvem nem credencial administrativa. As duas suítes de testes iniciam e encerram os serviços automaticamente. A primeira execução pode baixar o emulador do Firestore.

As funções validam a configuração antes de inicializar. Projetos `demo-` exigem emuladores; projetos reais não podem ser usados com eles. Emuladores são recusados em produção. Reinicie o Next.js após alterar as variáveis públicas; elas entram no bundle durante o build.

O Auth do navegador mantém tokens apenas em memória. O Admin SDK é protegido por `server-only` e usa Application Default Credentials fora dos emuladores. Uma sessão de login do Firebase CLI/MCP não fornece automaticamente credenciais ao servidor Next.js. Para acesso real, configure ADC no ambiente de execução ou informe `GOOGLE_APPLICATION_CREDENTIALS` apontando para um arquivo privado fora do Git, por exemplo em `.secrets/`. Nunca use `NEXT_PUBLIC_` para credenciais administrativas.

Para configurar o app real, obtenha os valores públicos com:

```sh
npx firebase apps:sdkconfig web 1:450905441860:web:6ea0a56d73d65d42bf5e11 --project meatualiza-monitoria
```

Preencha as quatro variáveis públicas correspondentes, configure `APP_ORIGIN` com a origem exata do aplicativo (protocolo, domínio e porta; `http://localhost:3000` no desenvolvimento), defina `NEXT_PUBLIC_FIREBASE_USE_EMULATORS=false` e `FIREBASE_PROJECT_ID=meatualiza-monitoria` e remova as duas variáveis `EMULATOR_HOST`. `.env.example` contém somente valores fictícios locais; `.env.local`, logs e credenciais não são versionados.

Para ADC com login de usuário, o Firebase Auth exige um cliente OAuth próprio do tipo Desktop; as credenciais geradas pelo cliente padrão do gcloud não são aceitas. Siga os [requisitos de ADC do Admin SDK](https://firebase.google.com/docs/admin/setup#test-with-gcloud-end-user-credentials). A disponibilidade de ADC real foi sondada em 21/10 e não foi confirmada neste ambiente; nenhuma credencial do CLI/MCP foi copiada para a aplicação.

As regras de Firestore negam todo acesso direto do cliente, inclusive de usuários com claim de monitor. Elas foram publicadas e conferidas no projeto real. O Admin SDK ignora essas regras: as operações de sessão e perfil já verificam a identidade e a titularidade no servidor. Novas operações também deverão verificar os privilégios pertinentes. Os testes verificam escrita administrativa e recusam leitura/escrita de clientes sem login, alunos e monitores, usando somente dados fictícios nos emuladores.

Google foi habilitado no projeto real por configuração administrativa; o e-mail de suporte não é versionado. Para repetir em outro projeto, habilite Google em Authentication → Sign-in method, configure marca e suporte e revise Settings → Authorized domains. No projeto atual estão autorizados os domínios Firebase, `localhost` e `127.0.0.1`; o domínio de hospedagem definitivo será definido em F8. O teste de OAuth real no navegador continua pendente em F2-B.6; os testes automatizados usam exclusivamente o Auth Emulator.

## Sessão do aluno

O popup Google fornece um ID token recente, trocado por um cookie de cinco dias após o servidor validar origem, CSRF e identidade e persistir `users/{uid}`. A gravação é idempotente e preserva `createdAt`; o cliente não informa UID ou papel. O cookie é `HttpOnly`, `SameSite=Lax`, host-only e `Secure` em produção; use HTTPS fora do desenvolvimento. O token do navegador permanece apenas em memória e é descartado após a troca, inclusive em falhas.

A área `/aluno` lê somente o perfil do UID verificado e recusa sessões expiradas, revogadas ou de contas desabilitadas. Logout limpa a sessão do navegador atual, sem revogar outras sessões. A navegação é recarregada após entrada/saída para evitar dados antigos no cache. Falhas do serviço exibem nova tentativa; elas não são tratadas como uma sessão inexistente. Não há renovação automática nem concessão de privilégio de monitor nesta entrega.

## Serviços e próximas integrações

Configuração e verificação em 20/10/2026:

| Serviço             | Situação                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase            | Projeto `meatualiza-monitoria`, app Meatualiza Web registrado, Google habilitado e banco Firestore Standard `(default)` em `southamerica-east1` (São Paulo). Emuladores e regras de acesso fechado preparados em F2-A. |
| Sentry              | Conexão disponível; a busca por Meatualiza na organização acessível não encontrou projeto correspondente. Integração prevista para F7.                                                                                 |
| PostHog             | Conexão disponível com projeto ativo chamado “Default project”; ainda é necessário definir o projeto destinado à plataforma antes de instrumentar eventos e surveys.                                                   |
| Hospedagem e GitHub | Repositório em [filipebteixeira98/meatualiza](https://github.com/filipebteixeira98/meatualiza), com remoto `origin` configurado e workflow de CI para PRs. Hospedagem ainda não vinculada.                             |

A coleta de analytics permanece desabilitada; Sentry e PostHog não recebem dados de alunos nesta etapa. O projeto Firebase dedicado foi criado a pedido do responsável; Sentry e PostHog permanecem sem alterações. A conta Google ativa no MCP foi confirmada como a conta do monitor; seu privilégio será atribuído pelo UID após o primeiro acesso. A autorização do monitor, inscrições, painéis completos, tour e avaliações seguem nas fases seguintes do [roadmap](./ROADMAP.md).

O pipeline de publicação será configurado na fase F8, após definir a hospedagem. As regras aprovadas estão em [INSTRUCTIONS.md](./INSTRUCTIONS.md), e os termos do domínio em [GLOSSARY.md](./GLOSSARY.md).

A base Firebase e o planejamento refinado foram integrados à `main` nos PRs #3 e #4. F2-B está em revisão nesta branch: sessão, perfil, entrada e saída implementados, com validação real ainda pendente. O [plano da fase F2](./PLANO-F2.md) e o [quadro do roadmap](./ROADMAP.md) distinguem a implementação local dessa pendência. F2-C, com autorização do monitor, será a próxima entrega após a validação.

## Verificação das entregas

Build de produção, tipagem, lint e dez verificações de navegador passaram localmente. Dois casos específicos de viewport são pulados no projeto ao qual não se aplicam. As imagens de desktop e celular foram inspecionadas visualmente.

F2-B amplia a suíte Firebase para 22 testes: configuração, regras, Google emulado, sessão, isolamento, reenvios, expiração/revogação, CSRF e falhas. O navegador cobre o fluxo de acesso, cancelamento do popup, falhas e recuperação em desktop e celular. O CI prepara Java 21 e executa essas suítes junto à regressão da landing. A concessão do privilégio de monitor continua em F2-C; OAuth real não foi validado.

`npm audit --omit=dev` não encontrou vulnerabilidades. Um override de `@grpc/grpc-js` para `^1.14.6` evita a versão antiga transitiva do SDK Firestore e o [alerta de validação de certificados](https://github.com/advisories/GHSA-m9gg-hp2v-232j); os testes exercitam o SDK com essa versão. Remover o override quando o Firebase adotar uma versão corrigida compatível.

A auditoria completa ainda registra 15 entradas nas ferramentas de desenvolvimento (11 altas e quatro moderadas), incluindo o [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), já presente em F1, e dependências da CLI Firebase. `npm audit fix` aplicou as correções compatíveis disponíveis. Não aplicar downgrade incompatível sugerido por correção forçada. Revisar essas dependências quando houver atualização compatível; elas não fazem parte da auditoria de produção acima.
