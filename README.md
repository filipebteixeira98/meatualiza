# meatualiza

Plataforma de monitoria de Lógica de Programação. Encontros presenciais às segundas e quartas, das 11h30 às 12h30, no SENAI Dendezeiros, laboratório de informática L7, para até dez alunos por sessão.

## Executar localmente

Use Node.js 24 e npm. As versões resolvidas estão em `package-lock.json`.

```sh
npm ci
npm run dev
```

Abra <http://localhost:3000>. A rota `/` apresenta a landing page compacta em tema escuro, com a lista de assuntos recolhida por padrão. `/entrar` oferece acesso Google e `/aluno` apresenta a identificação do aluno e `/monitor` atende a conta autorizada como monitor. A entrada escolhe a área no servidor. O fluxo foi implementado e testado com emuladores em F2-B; o responsável confirmou entrada Google real e redirecionamento em 22/10/2026, após sincronizar o relógio por NTP. A matriz de validação restante está no plano da F2. `/aluno/duvida` permite escolher uma sessão, revisar a dúvida e confirmar a inscrição. `/aluno/agenda` reúne calendário, inscrições e alterações; `/monitor/agenda` mostra ocupação e cancelamento/bloqueio com motivo.

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

Para ADC com login de usuário, o Firebase Auth exige um cliente OAuth próprio do tipo Desktop; as credenciais geradas pelo cliente padrão do gcloud não são aceitas. Siga os [requisitos de ADC do Admin SDK](https://firebase.google.com/docs/admin/setup#test-with-gcloud-end-user-credentials). ADC real foi configurada e conseguiu consultar o Firebase Auth; nenhuma credencial do CLI/MCP foi copiada para a aplicação.

As regras de Firestore negam todo acesso direto do cliente, inclusive de usuários com claim de monitor. Elas foram publicadas e conferidas no projeto real. O Admin SDK ignora essas regras: as operações de sessão e perfil já verificam a identidade e a titularidade no servidor. Novas operações também deverão verificar os privilégios pertinentes. Os testes verificam escrita administrativa e recusam leitura/escrita de clientes sem login, alunos e monitores, usando somente dados fictícios nos emuladores.

Google foi habilitado no projeto real por configuração administrativa; o e-mail de suporte não é versionado. Para repetir em outro projeto, habilite Google em Authentication → Sign-in method, configure marca e suporte e revise Settings → Authorized domains. No projeto atual estão autorizados os domínios Firebase, `localhost` e `127.0.0.1`; o domínio de hospedagem definitivo será definido em F8. Em 22/10/2026, o responsável confirmou entrada Google real e redirecionamento. B.6 tem recarga, logout e conta pessoal confirmados; celular real ainda aguarda validação; os testes automatizados usam exclusivamente o Auth Emulator.

## Sessão do aluno

O popup Google fornece um ID token recente, trocado por um cookie de cinco dias após o servidor validar origem, CSRF e identidade e persistir `users/{uid}`. A gravação é idempotente e preserva `createdAt`; o cliente não informa UID ou papel. O cookie é `HttpOnly`, `SameSite=Lax`, host-only e `Secure` em produção; use HTTPS fora do desenvolvimento. O token do navegador permanece apenas em memória e é descartado após a troca, inclusive em falhas.

A área `/aluno` lê somente o perfil do UID verificado e recusa sessões expiradas, revogadas ou de contas desabilitadas. Logout limpa a sessão do navegador atual, sem revogar outras sessões. A navegação é recarregada após entrada/saída para evitar dados antigos no cache. Falhas do serviço exibem nova tentativa; elas não são tratadas como uma sessão inexistente. Não há renovação automática. O acesso do monitor usa a claim booleana `monitor: true` na sessão e a permissão atual no Firebase; contas sem essa autorização permanecem como aluno.

## Acesso administrativo do monitor

A F2-C reutiliza a mesma autenticação Google e o mesmo cookie. `/entrar` direciona a sessão para `/aluno` ou `/monitor`; o navegador não escolhe o papel. Acessar `/monitor` como aluno retorna à sua própria área, e acessar sem sessão exige login. A área inicial do monitor mostra identificação e logout; agenda, inscritos e métricas continuam nas fases seguintes.

Concessão e remoção são operações administrativas locais, sem endpoint público. Confira o UID da conta Google do responsável no projeto correto, mantenha `.env.local` privado com a configuração real/ADC e execute:

```sh
npm run monitor:access -- grant UID_CONFIRMADO
npm run monitor:access -- revoke UID_CONFIRMADO
```

Execute apenas a operação desejada. `grant` exige conta Google ativa e preserva outras claims; depois, saia e entre com Google novamente para obter uma sessão com o privilégio. `revoke` remove somente a claim de monitor e revoga as sessões da conta em todos os navegadores, sem apagar seu perfil. O comando exige UID explícito e não publica identidade ou credenciais.

Uma sessão antiga de aluno não ganha acesso após a concessão. Nas leituras do monitor, o servidor verifica também a claim administrativa atual: isso bloqueia o cookie antigo após a remoção, inclusive antes de a revogação com precisão de segundos ser detectada. Essa proteção acrescenta uma consulta ao Auth por leitura do monitor. Indisponibilidade do Auth é exibida como falha de serviço; não concede acesso nem muda silenciosamente o perfil.

## Relógio do sistema e diagnóstico de acesso

Mantenha o computador que executa o Next.js com o relógio sincronizado por NTP. Em 22/10/2026, o responsável confirmou que corrigir um adiantamento de cerca de oito minutos restabeleceu a entrada Google e o redirecionamento para sua área. A janela de autenticação recente continua em cinco minutos; não aumentá-la para contornar um relógio incorreto.

`GET /api/auth/csrf` com sucesso seguido de `POST /api/auth/session` com `401` indica recusa da credencial/sessão, mas não identifica sozinho a causa. Confira relógio, correspondência do projeto e validade da autenticação antes de alterar regras ou testes. Nunca compartilhe ID tokens, cookies, arquivos ADC ou conteúdo integral de `.env.local` em logs/PRs.

## Serviços e próximas integrações

Configuração e verificação em 20/10/2026:

| Serviço             | Situação                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase            | Projeto `meatualiza-monitoria`, app Meatualiza Web registrado, Google habilitado e banco Firestore Standard `(default)` em `southamerica-east1` (São Paulo). Emuladores e regras de acesso fechado preparados em F2-A. |
| Sentry              | Conexão disponível; a busca por Meatualiza na organização acessível não encontrou projeto correspondente. Integração prevista para F7.                                                                                 |
| PostHog             | Conexão disponível com projeto ativo chamado “Default project”; ainda é necessário definir o projeto destinado à plataforma antes de instrumentar eventos e surveys.                                                   |
| Hospedagem e GitHub | Repositório em [filipebteixeira98/meatualiza](https://github.com/filipebteixeira98/meatualiza), com remoto `origin` configurado e workflow de CI para PRs. Hospedagem ainda não vinculada.                             |

A coleta de analytics permanece desabilitada; Sentry e PostHog não recebem dados de alunos nesta etapa. O projeto Firebase dedicado foi criado a pedido do responsável; Sentry e PostHog permanecem sem alterações. A conta Google ativa no MCP foi confirmada como a conta do monitor; seu UID foi conferido privadamente e o privilégio de monitor foi atribuído em 22/10/2026, com confirmação no Firebase. O responsável confirmou o redirecionamento real para `/monitor` após o novo login. Inscrições, painéis completos, tour e avaliações seguem nas fases seguintes do [roadmap](./ROADMAP.md).

O pipeline de publicação será configurado na fase F8, após definir a hospedagem. As regras aprovadas estão em [INSTRUCTIONS.md](./INSTRUCTIONS.md), e os termos do domínio em [GLOSSARY.md](./GLOSSARY.md).

A base Firebase, o planejamento e as entregas de acesso foram integrados à `main` nos PRs #3–#6. Entrada, recarga, logout, conta pessoal e área real do monitor foram confirmados pelo responsável. OAuth em celular real permanece pendente em B.6 do [plano F2](./PLANO-F2.md). F3 foi integrada no PR #7 e validada pelo responsável. A [F4](./PLANO-F4.md) implementa agenda e inscrição atômica nesta branch; os painéis completos, presença e avaliação serão a próxima entrega, em F5.

## Agenda e inscrição (F4)

Na área do aluno, **Minha agenda** abre `/aluno/agenda`, com calendário e lista das próximas quatro semanas. **Preparar minha dúvida** abre `/aluno/duvida`: escolha uma sessão, um assunto aprovado ou “Outro assunto / não sei classificar”, descreva a dificuldade, revise e confirme. O pedido e a inscrição são gravados juntos no Firestore, com confirmação automática quando houver vaga. Recarregar a agenda mantém a inscrição confirmada.

A descrição é obrigatória, com até 2.000 caracteres após remover espaços das bordas. Antes de confirmar, o texto existe apenas na página e é descartado ao sair/recarregar. Depois da confirmação, **Editar dúvida** carrega o pedido salvo sem ocupar outra vaga. A agenda oferece cancelamento com confirmação e troca de sessão; uma troca malsucedida preserva a inscrição anterior. Inscrição, edição, cancelamento e troca encerram no início do encontro, pelo relógio do servidor.

Na área do monitor, a sidebar reúne **Painel** (`/monitor`) e **Agenda** (`/monitor/agenda`), com ícones e indicação da página ativa. No celular e tablet, o botão **Abrir navegação do monitor** abre o menu lateral; selecionar uma página fecha o menu. A conta Google e a opção **Sair da conta** ficam no menu da conta, no rodapé da sidebar. Se a saída falhar, a sessão permanece ativa e o menu permite tentar novamente.

A agenda do monitor mostra a quantidade prevista sobre dez alunos. **Bloquear data** ou **Cancelar sessão** exige motivo, cancela as inscrições afetadas e mostra o motivo aos alunos no aplicativo. Ocupação é atualizada ao carregar, usar **Atualizar agenda** ou concluir uma alteração. Comparecimento efetivo, lista de inscritos/dúvidas e histórico de sessões passadas serão completados em F5. Tour, preferências e feedback serão incluídos na navegação quando seus fluxos estiverem disponíveis.

O grupo de rotas `(site)` mantém o cabeçalho e o rodapé públicos na landing, no acesso e na área do aluno, preservando suas URLs. `/monitor` usa layout próprio; cada página e operação mantém a autorização junto aos dados, inclusive durante navegação com layout persistente.

Não há migração ou configuração de nuvem adicional: as operações usam o Admin SDK e a autorização existentes; acesso direto do navegador ao Firestore continua negado. O contrato, as transações, a proteção de reenvios e a janela exata estão em [PLANO-F4.md](./PLANO-F4.md). Execute `npm run test:domain`, `npm run test:firebase` e `npm run test:auth` para verificar as regras e o navegador nos emuladores.

## Verificação das entregas

Build de produção, tipagem, lint e dez verificações de navegador passaram localmente. Dois casos específicos de viewport são pulados no projeto ao qual não se aplicam. As imagens de desktop e celular foram inspecionadas visualmente.

F2-B/F2-C ampliam a suíte Firebase para 28 testes: configuração, regras, Google emulado, sessão, isolamento, reenvios, expiração/revogação, CSRF, falhas e autorização/concessão/remoção do monitor. Doze testes de navegador cobrem entrada, cancelamento do popup, falhas, recuperação, ambas as áreas, remoção do privilégio e interação após carregamento dos scripts em desktop e celular. O CI prepara Java 21 e executa essas suítes junto à regressão da landing. F2-C acrescenta autorização do monitor, roteamento por perfil e procedimento administrativo testado. A entrada real foi confirmada pelo responsável após o ajuste NTP; recarga, logout e conta pessoal também foram confirmados; a validação real em celular permanece pendente em PLANO-F2.md.

F3 acrescenta seis testes de domínio e quatro cenários de navegador, totalizando 16 no acesso/formulário. Eles cobrem validação, revisão/edição, limites, texto de código, foco, bloqueio antes da hidratação, restrição por perfil e descarte após recarga. As capturas estão em `docs/screenshots/`.

F4 totaliza **81 testes locais aprovados**: 12 de domínio, 41 de Firebase/servidor, 18 de acesso/inscrições no navegador e dez da landing. Formatação, lint, tipos e build passaram. O fluxo inclui origem inválida, resposta perdida após gravação, décima vaga e cancelamentos com motivo. A navegação do monitor também verifica página ativa, teclado, foco, menu móvel, nova tentativa de saída e remoção de privilégio sem recarregar o layout. Evidência e limites estão em [PLANO-F4.md](./PLANO-F4.md).

`npm audit --omit=dev` não encontrou vulnerabilidades. Um override de `@grpc/grpc-js` para `^1.14.6` evita a versão antiga transitiva do SDK Firestore e o [alerta de validação de certificados](https://github.com/advisories/GHSA-m9gg-hp2v-232j); os testes exercitam o SDK com essa versão. Remover o override quando o Firebase adotar uma versão corrigida compatível.

A auditoria completa ainda registra 15 entradas nas ferramentas de desenvolvimento (11 altas e quatro moderadas), incluindo o [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), já presente em F1, e dependências da CLI Firebase. `npm audit fix` aplicou as correções compatíveis disponíveis. Não aplicar downgrade incompatível sugerido por correção forçada. Revisar essas dependências quando houver atualização compatível; elas não fazem parte da auditoria de produção acima.
