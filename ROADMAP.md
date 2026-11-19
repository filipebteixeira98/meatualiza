# Roadmap da plataforma de monitoria

Status: F1–F6 integradas à `main`, incluindo o fórum colaborativo no [PR #16](https://github.com/filipebteixeira98/meatualiza/pull/16). **Entrega atual: F7.1–F7.3**, tour guiado nos portais do aluno e do monitor. A próxima fase é F8, começando por termos e preferências de coleta, seguida de feedback e observabilidade. OAuth em celular real permanece como acompanhamento da F2-B.6.

Este documento detalha o escopo de [INSTRUCTIONS.md](./INSTRUCTIONS.md). Termos do domínio são definidos em [GLOSSARY.md](./GLOSSARY.md).

## Objetivo e escopo confirmado

Organizar a procura por reforço em **Lógica de Programação**, permitindo ao aluno explicitar sua dúvida, indicar o assunto e se inscrever em uma sessão coletiva. O monitor acompanha as solicitações e usa a agenda, a quantidade de alunos previstos e as métricas para preparar os atendimentos.

- Dois perfis: aluno e monitor, com painéis e permissões distintos.
- Monitoria presencial em grupo no **SENAI Dendezeiros, laboratório de informática L7**.
- Disponibilidade recorrente: **segundas e quartas-feiras, das 11h30 às 12h30**, no fuso **America/Bahia**.
- Uma sessão de **60 minutos** por janela, para **até dez alunos**.
- Inscrições abertas para as próximas **quatro semanas**, respeitando o término previsto de **11/12/2026**. A última sessão regular pela recorrência é **09/12/2026**, quarta-feira; 11/12 é sexta-feira e não acrescenta um encontro fora da recorrência.
- Calendário, registro de solicitações e inscrições com **confirmação automática**.
- Vários alunos podem se inscrever na mesma sessão; essas inscrições não são conflitos de horário.
- Uma inscrição ativa por aluno e sessão, vinculada ao pedido de ajuda; descrição das dúvidas editável sem nova inscrição.
- Inscrição, cancelamento e troca de sessão pelo aluno permitidos antes do início, sem antecedência mínima.
- Presença registrada manualmente pelo monitor; cancelamento de sessão cancela as inscrições afetadas e exibe o motivo no aplicativo.
- Painel do monitor com **quantidade de alunos previstos por sessão**, lista de inscritos e dúvidas por aluno e assunto.
- Acesso de aluno aberto a qualquer pessoa autenticada com Google.
- Lista inicial de assuntos da disciplina aprovada pelo monitor, apresentada neste documento.
- Resolução informada pelo próprio aluno em uma avaliação por inscrição/sessão, considerando o pedido de ajuda como um todo, com resultado e comentário opcional.
- Avaliação disponível após sessão realizada e presença registrada; ausência de resposta não bloqueia novos agendamentos.
- Fórum para interação assíncrona e colaboração entre alunos e monitores sobre Lógica de Programação.
- Onboarding e tour guiado por perfil, que pode ser pulado e reaberto.
- PostHog Surveys para sugestões e relatos de problemas da plataforma.
- Aplicativo responsivo, com acessibilidade e estados de carregamento, vazio e erro.
- Login Google, Firestore, termos, preferências de coleta, Sentry e instrumentação com responsabilidades definidas.

## Decisões confirmadas

| ID  | Decisão                       | Resposta do responsável                                                        | Situação                                                |
| --- | ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Q1  | Formato, duração e capacidade | Atendimento em grupo; 60 minutos e dez alunos, definidos em Q7                 | Confirmado                                              |
| Q2  | Fuso da agenda                | America/Bahia                                                                  | Confirmado                                              |
| Q3  | Confirmação das inscrições    | Automática                                                                     | Confirmado                                              |
| Q4  | Quem pode solicitar monitoria | Qualquer pessoa autenticada com Google                                         | Confirmado; não exigir convite ou domínio institucional |
| Q5  | Modalidade e local            | Presencial no SENAI Dendezeiros, laboratório de informática L7, definido em Q8 | Confirmado                                              |
| Q6  | Conteúdo programático         | Elaborar proposta inicial, aprovada em Q13                                     | Confirmado                                              |

### Segunda rodada: respostas confirmadas

| ID  | Decisão                              | Regra confirmada                                                                                                           |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Q7  | Duração e capacidade                 | Uma sessão coletiva de 60 minutos, das 11h30 às 12h30, com até dez alunos                                                  |
| Q8  | Local presencial                     | SENAI Dendezeiros, laboratório de informática L7                                                                           |
| Q9  | Relação entre dúvida e inscrição     | Pedido vinculado à sessão, uma inscrição ativa por aluno em cada sessão, descrição das dúvidas editável sem nova inscrição |
| Q10 | Prazos                               | Inscrição, cancelamento e troca até o início da sessão, sem antecedência mínima                                            |
| Q11 | Horizonte e término                  | Próximas quatro semanas, com término previsto em 11/12/2026                                                                |
| Q12 | Presença e cancelamento pelo monitor | Presença manual; cancelamento de sessão cancela inscrições e exibe motivo aos alunos no aplicativo                         |

### Operação da agenda

- A janela móvel de quatro semanas corresponde aos próximos 28 dias, respeitando também a data final do período, no fuso America/Bahia. Não abrir datas posteriores a 11/12/2026.
- Gerar uma sessão por segunda e quarta dentro dessa janela, das 11h30 às 12h30, excluindo datas bloqueadas pelo monitor.
- Permitir inscrição e confirmação automática enquanto a sessão estiver aberta, houver menos de dez inscritos ativos e o horário de início ainda não tiver chegado.
- A partir das 11h30 da sessão, encerrar inscrição, cancelamento e troca pelo aluno. Usar o horário confiável da operação, não depender somente do relógio exibido no navegador.
- Ao atingir dez inscritos ativos, exibir a sessão como lotada. Cancelamento antes do início libera a vaga; a aplicação não terá lista de espera nesta versão.
- Impedir uma segunda inscrição ativa do mesmo aluno na mesma sessão. Editar a descrição das dúvidas não altera a contagem de alunos nem ocupa outra vaga.
- Remarcar preservando a inscrição anterior se o destino estiver lotado, cancelado, iniciado ou indisponível. Não deixar o aluno inscrito nas duas sessões por uma falha parcial.
- Ao cancelar uma sessão, cancelar as inscrições ativas relacionadas e manter o motivo visível no histórico dos alunos. Bloquear uma data com inscritos deve seguir esse fluxo, sem apagar os registros.
- Registrar presença manualmente e manter os históricos de inscritos e cancelamentos, separados da contagem atual de participantes previstos.

### Terceira rodada: assuntos e resolução

| ID  | Decisão           | Resposta e situação                                                                                       |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------- |
| Q13 | Assuntos iniciais | Lista aprovada, incluindo “Outro assunto / não sei classificar”                                           |
| Q14 | Estados do fluxo  | Acrescentar controle da resolução das dúvidas com avaliação do próprio aluno; fluxo confirmado em Q15–Q17 |

Estados definidos para o fluxo:

| Elemento                 | Estados                                                          | Regra                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Sessão                   | Agendada, realizada ou cancelada                                 | O monitor registra realização ou cancelamento; passar do horário não comprova realização                                      |
| Inscrição                | Confirmada ou cancelada                                          | Confirmação automática; cancelamento pelo aluno antes do início ou pelo cancelamento da sessão                                |
| Comparecimento           | Não registrado, presente ou ausente                              | O monitor registra; inscrição não comprova presença e ausência de registro não significa falta                                |
| Resolução da dúvida      | Não avaliada, resolvida, parcialmente resolvida ou não resolvida | O próprio aluno avalia o pedido de ajuda da inscrição como um todo; presença e realização não geram resposta automaticamente  |
| Avaliação do atendimento | Aguardada ou respondida, quando já estiver disponível            | Disponível após sessão realizada e presença registrada; falta de resposta não é resposta negativa e não bloqueia agendamentos |

As solicitações do painel são os pedidos de ajuda associados às inscrições. Separar pedidos futuros “a atender”, dúvidas avaliadas como parcialmente/não resolvidas e avaliações aguardadas, sem criar uma fila de aprovação manual das inscrições.

### Quarta rodada: avaliação confirmada

As três decisões foram aprovadas pelo responsável.

| ID  | Decisão                                          | Regra confirmada                                                                                                                        |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Q15 | Unidade de avaliação                             | Avaliar o pedido de ajuda da inscrição como um todo, considerando assunto e descrição; uma avaliação por aluno e sessão                 |
| Q16 | Quem informa a resolução                         | O próprio aluno indica resolvida, parcialmente resolvida ou não resolvida, com comentário opcional; o monitor acompanha a resposta      |
| Q17 | Quando avaliar e efeito sobre novos agendamentos | Disponibilizar no aplicativo após sessão realizada e presença registrada; não bloquear novos agendamentos enquanto não houver avaliação |

O formulário contém o resultado da ajuda e um comentário opcional. A avaliação considera o assunto e a descrição do pedido da inscrição como um todo.

Árvore de decisões e dependências:

```text
Plataforma de monitoria
├── Confirmado
│   ├── Sessões coletivas presenciais de 60 minutos; SENAI Dendezeiros, L7
│   ├── Segundas e quartas, 11h30–12h30, America/Bahia
│   ├── Até dez alunos; uma inscrição ativa por aluno e sessão
│   ├── Próximas quatro semanas; término previsto em 11/12/2026
│   ├── Confirmação automática; acesso com qualquer conta Google
│   ├── Alterações pelo aluno antes do início; descrição editável
│   ├── Presença manual; cancelamento com motivo no aplicativo
│   ├── Quantidade prevista e lista de inscritos no painel do monitor
│   ├── Lista inicial de assuntos aprovada
│   ├── Avaliação do pedido como um todo, pelo próprio aluno
│   └── Avaliação após realização e presença; sem bloqueio de agendamentos
└── Preparação da implementação
    ├── Verificar projetos, credenciais, ambientes e hospedagem
    └── Inicializar Git, aplicação e verificações de qualidade
```

Cenários para verificar o modelo: dois alunos se inscrevem no mesmo horário e ambos aparecem no painel; o mesmo aluno tenta se inscrever novamente; alguém cancela e sai da contagem de previstos; o monitor cancela uma sessão com inscritos; uma dúvida permanece após o encontro. A contagem de alunos não deve confundir várias dúvidas de uma pessoa com várias pessoas.

## Assuntos iniciais aprovados

Lista inicial aprovada pelo responsável em Q13, sem presumir linguagem de programação específica.

| Assunto                    | Conteúdos abrangidos                                                |
| -------------------------- | ------------------------------------------------------------------- |
| Algoritmos e representação | Sequência de passos, pseudocódigo e fluxogramas                     |
| Variáveis e tipos de dados | Variáveis, constantes, atribuição e tipos básicos                   |
| Operadores e expressões    | Operadores aritméticos, relacionais e lógicos; precedência          |
| Entrada e saída            | Leitura de dados, conversões básicas e apresentação de resultados   |
| Estruturas condicionais    | Decisões simples, compostas e encadeadas                            |
| Estruturas de repetição    | Contadores, acumuladores e laços com diferentes condições de parada |
| Vetores e matrizes         | Índices, percursos e operações básicas com coleções                 |
| Funções e procedimentos    | Decomposição, parâmetros, retorno e escopo                          |
| Teste de mesa e depuração  | Rastreamento de execução, identificação de erros e casos de teste   |

Oferecer também “Outro assunto / não sei classificar”, exigindo a descrição da dúvida para que uma classificação incerta não impeça o pedido de ajuda. Não incluir conteúdo avançado sem relação confirmada com a disciplina.

## Painéis e fluxos

### Aluno

- Ver suas próximas inscrições, situação e local das sessões.
- Consultar o calendário e as sessões abertas para participação em grupo.
- Registrar assunto e descrição da dúvida, com validação e mensagens claras.
- Acompanhar suas solicitações e seus atendimentos.
- Consultar a resolução do pedido de ajuda e avaliá-lo após a sessão realizada e a presença registrada, com comentário opcional e sem bloqueio de novos agendamentos por falta de avaliação.
- Cancelar ou remarcar antes do início da sessão; editar a descrição das dúvidas sem outra inscrição.
- Criar tópicos e responder às dúvidas de outros participantes no fórum.
- Reabrir o tour, ajustar preferências e enviar feedback da plataforma.

### Monitor

- Ver agenda, próximas sessões e solicitações que exigem atenção.
- Ver em cada sessão a quantidade de alunos distintos com inscrição ativa, a lista de inscritos e suas dúvidas por assunto.
- Consultar aluno, assunto e descrição da dúvida para preparar o reforço coletivo.
- Filtrar solicitações por assunto, período, situação e resultado da resolução, conforme o fluxo de avaliação aprovado.
- Registrar presença manualmente e registrar a realização da sessão.
- Acompanhar avaliações recebidas e aguardadas, além de dúvidas parcialmente ou não resolvidas; não inferir o resultado de alunos que não responderam.
- Bloquear datas ou cancelar sessões com motivo, cancelando suas inscrições e mantendo o histórico visível aos alunos afetados.
- Consultar demanda por assunto e métricas de operação.
- Participar das discussões e moderar publicações no fórum.
- Acessar os resultados dos surveys no PostHog. Espelhar respostas dentro da aplicação não faz parte desta primeira versão.

### Métricas do monitor

F5.3 apresenta previsões para as próximas quatro semanas e realização/comparecimento nas sessões registradas iniciadas nos últimos 28 dias. F5.4–F5.6 acrescenta resultados de resolução e avaliações aguardadas considerando todas as sessões realizadas, com acesso às avaliações mesmo após a janela de 28 dias e o término do período.

As métricas usam os registros da aplicação; preferências de analytics não podem alterar a contagem operacional de solicitações e reservas.

| Métrica                     | Definição                                                                                                                                                                      | Dependência                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Solicitações recebidas      | Inscrições criadas nos últimos 28 dias, uma por aluno/sessão, incluindo canceladas e destinos de remarcação                                                                    | Registro de criação e filtro de período                                 |
| Solicitações a atender      | Pedidos de ajuda vinculados a inscrições confirmadas em sessões futuras não canceladas                                                                                         | Estados base de sessão e inscrição                                      |
| Alunos previstos por sessão | Quantidade de alunos distintos com inscrição ativa na sessão, de zero a dez; excluir cancelados e não multiplicar por quantidade de dúvidas                                    | Uma inscrição ativa por aluno e sessão, conforme Q9                     |
| Próximas sessões            | Sessões futuras não canceladas, com acesso ao total de alunos previstos de cada uma                                                                                            | Sessões de 60 minutos nas janelas confirmadas                           |
| Sessões realizadas          | Sessões explicitamente marcadas como realizadas no período; uma sessão coletiva conta uma vez                                                                                  | Registro de conclusão                                                   |
| Presenças registradas       | Quantidade de alunos com comparecimento registrado manualmente em cada sessão, separada da previsão de presença                                                                | Registro manual pelo monitor, conforme Q12                              |
| Assuntos mais demandados    | Número de inscrições confirmadas por assunto nas sessões futuras da janela de quatro semanas                                                                                   | Conteúdo programático aprovado                                          |
| Ocupação da sessão          | Alunos previstos divididos por dez; por exemplo, oito inscritos equivalem a 80%                                                                                                | Capacidade de dez alunos, conforme Q7                                   |
| Resultado da resolução      | Contagem das respostas em todas as sessões realizadas, uma por inscrição; manter avaliações aguardadas separadas dos três resultados                                           | O próprio aluno avalia o pedido de ajuda como um todo, conforme Q15–Q16 |
| Avaliações aguardadas       | Inscrições de alunos com presença registrada em sessões realizadas, sem avaliação recebida; não incluir sessões futuras, canceladas ou alunos ausentes/sem presença registrada | Disponibilidade confirmada em Q17                                       |

Ao mostrar resultados de resolução, informar também quantas avaliações foram recebidas e quantas estão aguardadas. Não apresentar a opinião de quem respondeu como resultado conhecido de todos os inscritos.

Exemplo de apresentação: “Segunda, 11h30–12h30 — 8/10 alunos previstos · 2 vagas”, com acesso à lista de inscritos e respectivas dúvidas e ao local “SENAI Dendezeiros — laboratório de informática L7”. A presença efetiva é registrada manualmente pelo monitor.

## Roadmap incremental

Cada tarefa de implementação deve gerar uma feature branch e um PR revisável, com Conventional Commits em inglês. Testes relevantes entram junto com o comportamento que validam.

Sequência: F2 → preparação de F3 → F4 com o pedido e a inscrição salvos juntos → F5 com acompanhamento, presença e avaliação. Após F5, seguir com F6 — fórum colaborativo → F7 — tour → F8 — privacidade, feedback e observabilidade → F9 — validação e publicação. O formulário de F3 não publica uma solicitação sem sessão. O plano de F2 divide acesso e autorização em três PRs, com validação junto de cada comportamento.

A navegação do monitor foi antecipada de F5 a pedido do responsável: sidebar responsiva com ícones para Painel e Agenda, indicação da página ativa e menu da conta no rodapé. F5.1b reutiliza essa navegação na área do aluno, com Painel, Agenda, Nova inscrição e saída no menu da conta. Novos recursos entram no menu quando forem entregues. Fórum está nas duas sidebars. Ajuda abre o tour da F7 nos dois portais. Privacidade e feedback seguem em F8.

F5.2 apresenta as inscrições confirmadas em cada sessão, com nome, assunto e descrição expansível da dúvida, no calendário e na lista do monitor. A leitura usa a mesma janela de quatro semanas e o botão “Atualizar agenda” para buscar alterações feitas por outros usuários. Dados da turma são selecionados somente para o monitor autorizado; alunos recebem apenas a própria inscrição. Perfis removidos ou sem nome não ocultam inscrições: o monitor vê “Aluno sem nome”. F5.3 acrescenta registro de presença e consulta das sessões persistidas iniciadas nos últimos 28 dias.

| Fase                                         | Resultado                                                                                                        | Critérios de aceite                                                                                                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0 — Regras e preparação                     | Regras funcionais consolidadas; verificar projetos, credenciais, ambientes e hospedagem                          | Q1–Q17 documentadas; acesso e configuração dos serviços verificados antes de implementar suas integrações                                                                                                              |
| F1 — Base, landing page e qualidade          | Inicializar Git, Next.js/TypeScript, Tailwind/Shadcn, tokens, página pública e automação                         | Landing page simples, moderna e responsiva; navegação e FAQ funcionam; build, tipagem, lint e testes passam localmente; CI e hooks configurados                                                                        |
| F2 — Identidade e autorização                | Login Google aberto, sessão, logout, perfis e persistência mínima                                                | Qualquer conta Google pode entrar como aluno; dados alheios e operações do monitor seguem protegidos; perfil privilegiado não pode ser escolhido pelo usuário                                                          |
| F3 — Preparação das solicitações             | Assuntos aprovados, formulário, validação e contrato do pedido vinculado à inscrição                             | Formulário preparado sem criar pedidos avulsos; gravação do pedido entregue junto à inscrição em F4; acompanhamento e resolução completos em F5                                                                        |
| F4 — Sessões e inscrições                    | Calendário de quatro semanas, sessões até o término informado, confirmação automática, cancelamento e remarcação | Até dez alunos distintos por sessão, inclusive sob concorrência; alterações pelo aluno encerram no início; remarcação falha preserva a inscrição anterior; cancelamento da sessão afeta suas inscrições e exibe motivo |
| F5 — Painéis, avaliação e navegação          | Painéis, inscritos, total por sessão, presença manual, avaliação do atendimento e acompanhamento da resolução    | O aluno avalia seu pedido uma vez por inscrição após realização e presença; monitor acompanha; falta de resposta não bloqueia agendamentos; resultados e falhas preservam dados e permissões                           |
| F6 — Fórum e colaboração assíncrona          | Tópicos por assunto, respostas entre alunos e monitores e moderação                                              | Participantes autenticados publicam e respondem; autoria e permissões são verificadas no servidor; navegação funciona por teclado e em celulares                                                                       |
| F7 — Onboarding e tour                       | Apresentação dos fluxos reais para cada perfil                                                                   | Tour pode ser pulado e reaberto; conclusão é persistida; teclado e celular funcionam; não cria agendamentos de teste reais                                                                                             |
| F8 — Privacidade, feedback e observabilidade | Termos/preferências, PostHog Surveys, Sentry e eventos definidos                                                 | Captura opcional respeita escolhas; resposta de teste chega ao survey; erro de teste chega ao Sentry sem dados pessoais desnecessários                                                                                 |
| F9 — Validação e publicação                  | Verificar jornadas, preparar preview, publicação e rollback                                                      | Fluxos de aluno e monitor, colaboração no fórum, concorrência, responsividade e acessibilidade verificados; deploy automatizado e operação documentados                                                                |

Responsividade, acessibilidade, estados de interface e testes são critérios de cada fase. A apresentação de termos e preferências deve estar pronta antes de receber alunos reais; a coleta opcional só pode ser habilitada depois de seus controles funcionarem.

## Quadro de tarefas

O quadro distingue regras definidas e entregas implementadas. F1–F6 estão integradas à `main`. F7.1–F7.3 compõem a entrega atual do tour guiado para revisão. Avisos de cobrança do GitHub Actions são desconsiderados; verificações locais continuam obrigatórias.

| A Fazer                                                                     | Em Andamento                                                                         | Concluído                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| —                                                                           | —                                                                                    | F0.1 — Definir duração de 60 minutos e capacidade de dez alunos                                            |
| —                                                                           | —                                                                                    | F0.2 — Definir SENAI Dendezeiros, laboratório de informática L7                                            |
| —                                                                           | —                                                                                    | F0.3 — Aprovar assuntos iniciais e incluir controle de resolução                                           |
| —                                                                           | —                                                                                    | F0.4 — Confirmar avaliação pelo aluno, por inscrição, após realização/presença e sem bloquear agendamentos |
| —                                                                           | —                                                                                    | Confirmar fuso, dias/horários e acesso com qualquer conta Google                                           |
| —                                                                           | —                                                                                    | Vincular pedido à inscrição, com uma inscrição ativa por aluno e sessão                                    |
| —                                                                           | —                                                                                    | F0.5 — Definir prazos, janela de quatro semanas, término, presença manual e cancelamento com motivo        |
| F0.6 — Definir/vincular projetos de serviços e hospedagem                   | —                                                                                    | Verificar conexões e criar repositório GitHub com remoto configurado                                       |
| —                                                                           | —                                                                                    | F1.1 — Inicializar Git, branch de funcionalidade e convenções de commit                                    |
| —                                                                           | —                                                                                    | F1.2 — Criar base Next.js/TypeScript, componentes Shadcn e tokens neutros                                  |
| —                                                                           | —                                                                                    | F1.3 — Configurar ESLint, Prettier, Husky, lint-staged, testes e workflow de CI                            |
| —                                                                           | —                                                                                    | F1.4 — Implementar landing page pública, horários/local, assuntos, FAQ e navegação responsiva              |
| —                                                                           | —                                                                                    | F1.5 — Verificar produção, teclado, menu móvel e larguras de 320 a 1440 pixels                             |
| —                                                                           | —                                                                                    | F1.6 — Refinar identidade do L7, tema escuro e assuntos recolhidos por padrão                              |
| —                                                                           | —                                                                                    | F1.7 — Renovar acesso responsivo com identidade do L7 e ícone oficial do Google no botão OAuth             |
| —                                                                           | —                                                                                    | Planejar F2 em três entregas com dependências e critérios de aceite documentados em PLANO-F2.md            |
| —                                                                           | —                                                                                    | Criar projeto Firebase dedicado meatualiza-monitoria e confirmar conta do monitor como a conta do MCP      |
| —                                                                           | —                                                                                    | F2.0/F2-A — Preparar Firebase, Google, Firestore fechado, SDKs e oito testes nos emuladores                |
| —                                                                           | —                                                                                    | Refinar F2-B/F2-C em tarefas, dependências e aceites; confirmar merge de F2-A                              |
| —                                                                           | —                                                                                    | F2-B.0 — Ambiente privado/ADC preparados e ciclo de cookie validado                                        |
| —                                                                           | —                                                                                    | F2-B.1 — Implementar troca do ID token Google por sessão, CSRF e verificação do cookie                     |
| —                                                                           | —                                                                                    | F2-B.2 — Persistir perfil pelo UID verificado, com reenvios seguros e createdAt preservado                 |
| —                                                                           | —                                                                                    | F2-B.3 — Implementar entrada Google e área inicial do aluno com estados e responsividade                   |
| —                                                                           | —                                                                                    | F2-B.4 — Implementar logout, limpeza da sessão e revalidação da navegação                                  |
| —                                                                           | —                                                                                    | F2-B.5 — Cobrir segurança, perfis, falhas e fluxo de navegador com Google emulado                          |
| —                                                                           | F2-B.6 — Entrada, recarga, logout e conta pessoal confirmados; celular real pendente | —                                                                                                          |
| —                                                                           | —                                                                                    | F2-C.1a — Conferir privadamente o UID da conta do monitor no projeto correto                               |
| —                                                                           | —                                                                                    | F2-C.1b — Conceder/remover claim administrativa, preservar outras claims e revogar sessões                 |
| —                                                                           | —                                                                                    | F2-C.2a — Centralizar papel e autorização junto às leituras protegidas no servidor                         |
| —                                                                           | —                                                                                    | F2-C.2b — Criar /monitor e direcionar cada perfil à sua área, com estados e logout                         |
| —                                                                           | —                                                                                    | F2-C.3a — Testar escalada de privilégio, isolamento e concessão/remoção, inclusive no mesmo segundo        |
| —                                                                           | —                                                                                    | F2-C.3b — Verificar ambos os perfis, recarga e saída em desktop/celular nos emuladores                     |
| —                                                                           | —                                                                                    | F2-C.3c — Confirmar área real do monitor e evidências do PR #6 integrado                                   |
| —                                                                           | —                                                                                    | F3.1 — Disponibilizar assuntos do programa aprovado                                                        |
| —                                                                           | —                                                                                    | F3.2 — Implementar formulário de dúvida e validações                                                       |
| —                                                                           | —                                                                                    | F3.3 — Definir contrato do pedido vinculado à inscrição; persistência em F4 e listagem/detalhes em F5      |
| —                                                                           | —                                                                                    | F4.1 — Gerar sessões de 60 minutos na janela móvel de quatro semanas e até o término em America/Bahia      |
| —                                                                           | —                                                                                    | F4.2 — Implementar calendário responsivo e alternativa em lista                                            |
| —                                                                           | —                                                                                    | F4.3 — Implementar inscrição automática, limite de dez, unicidade por aluno/sessão e contagem consistente  |
| —                                                                           | —                                                                                    | F4.4 — Implementar cancelamento e remarcação preservando consistência                                      |
| —                                                                           | —                                                                                    | F4.5 — Implementar bloqueios de datas e tratamento das reservas afetadas                                   |
| —                                                                           | —                                                                                    | F4.6 — Testar disputa pela décima vaga, repetição pelo mesmo aluno, prazos e período da agenda             |
| —                                                                           | —                                                                                    | F5.1a — Sidebar do monitor com Painel/Agenda, ícones, página ativa, menu da conta e adaptação móvel        |
| —                                                                           | —                                                                                    | F5.1b — Painel do aluno e navegação responsiva integrados no PR #10                                        |
| —                                                                           | —                                                                                    | F5.2 — Inscritos e dúvidas na agenda do monitor integrados no PR #13                                       |
| —                                                                           | —                                                                                    | F5.3 — Presença, realização, histórico recente e métricas integrados no PR #14                             |
| —                                                                           | —                                                                                    | F5.4 — Avaliação por inscrição integrada no PR #15                                                         |
| —                                                                           | —                                                                                    | F5.5 — Persistência, resolução e pendências integradas no PR #15                                           |
| —                                                                           | —                                                                                    | F5.6 — Permissões, reenvios, falhas e contagens verificados no PR #15                                      |
| —                                                                           | —                                                                                    | F6.1 — Dados, autoria e regras de moderação integrados no PR #16                                           |
| —                                                                           | —                                                                                    | F6.2 — Tópicos, respostas e paginação integrados no PR #16                                                 |
| —                                                                           | —                                                                                    | F6.3 — Edição e moderação integradas no PR #16                                                             |
| —                                                                           | —                                                                                    | F6.4 — Navegação por teclado e responsividade verificadas no PR #16                                        |
| —                                                                           | —                                                                                    | F6.5 — Autorização e colaboração verificadas no PR #16                                                     |
| —                                                                           | F7.1 — Guia em texto e cinco passos por perfil disponíveis para revisão              | —                                                                                                          |
| —                                                                           | F7.2 — Tour com opção de pular, concluir e reabrir disponível para revisão           | —                                                                                                          |
| —                                                                           | F7.3 — Foco, teclado e layout móvel verificados com Playwright                       | —                                                                                                          |
| F8.1 — Implementar termos, preferências, recusa e revogação                 | —                                                                                    | —                                                                                                          |
| F8.2 — Definir eventos e responsabilidades de Firebase Analytics e PostHog  | —                                                                                    | —                                                                                                          |
| F8.3 — Criar survey de feedback e integrar acesso pela aplicação            | —                                                                                    | —                                                                                                          |
| F8.4 — Verificar envio, erro e chegada da resposta de teste no PostHog      | —                                                                                    | —                                                                                                          |
| F8.5 — Integrar Sentry e filtrar dados pessoais                             | —                                                                                    | —                                                                                                          |
| F9.1 — Executar jornadas de aluno e monitor, incluindo colaboração no fórum | —                                                                                    | —                                                                                                          |
| F9.2 — Verificar responsividade e acessibilidade de todos os fluxos         | —                                                                                    | —                                                                                                          |
| F9.3 — Configurar preview, deploy e procedimento de rollback                | —                                                                                    | —                                                                                                          |

## Entrega atual de F5

O painel do aluno mostra somente suas inscrições confirmadas em sessões futuras
agendadas, com assunto e descrição da dúvida, data, horário e local. A contagem
exclui cancelamentos; estes aparecem separadamente, com o motivo registrado. O
botão de cada inscrição abre a sessão correspondente na agenda. Estados sem
inscrições ou sem novas sessões usam os dados reais, sem números de exemplo.

A leitura reutiliza `getAgenda`, com autorização e isolamento pelo UID no
servidor. A sidebar é compartilhada pelos dois perfis, enquanto páginas e ações
continuam verificando permissões. O painel cobre a mesma janela futura de 28
dias da agenda. A agenda do monitor já mostra os inscritos, assuntos e dúvidas
por sessão. A entrega F5.3 acrescenta ao monitor as sessões persistidas iniciadas
nos últimos 28 dias, inclusive quando já terminou a oferta de novas sessões.

- O monitor registra presente, ausente ou não registrado a partir das 11h30. Registros antigos sem esse campo são lidos como não registrados.
- A realização é confirmada manualmente a partir das 12h30. Inscrições e comparecimentos preservam seus estados quando a sessão é marcada como realizada.
- O monitor pode corrigir comparecimento após a realização. Cada alteração registra autoria e horário, verifica a versão atual e preserva a contagem de inscritos.
- Reenvios da mesma operação são conferidos no servidor. Uma versão antiga é rejeitada após outra alteração, com orientação para atualizar a agenda.
- A agenda oferece Próximas e Recentes, além de calendário/lista. Recentes começa pelo encontro mais recente e mostra somente sessões já persistidas.
- O painel apresenta solicitações a atender, sessões futuras, ocupação, demanda por assunto, pedidos recebidos, sessões realizadas, presenças, ausências e comparecimentos sem registro.
- Pedidos recebidos usam a criação da inscrição, incluindo canceladas e destinos de remarcação. Reinscrever o mesmo aluno na mesma sessão preserva a data de criação do registro.
- Ocupação é a soma dos inscritos futuros dividida pela capacidade total das sessões futuras agendadas, incluindo sessões vazias. Comparecimento usa inscrições confirmadas de sessões recentes agendadas/realizadas e exclui cancelamentos.

A entrega F5.4–F5.6 inclui a avaliação como um fluxo completo.

- Alunos e monitor acessam Avaliações na sidebar, com páginas próprias e resumos nos painéis.
- O aluno envia uma resposta por inscrição confirmada, após sessão realizada e presença registrada. Pode escolher resolvida, parcialmente resolvida ou não resolvida e acrescentar um comentário opcional de até 1.000 caracteres.
- O assunto e a descrição atendidos são copiados para a avaliação, com horário do servidor e identificação da operação. Alterações posteriores na dúvida preservam esse contexto.
- A resposta enviada pode ser consultada pelo aluno titular e pelo monitor. O monitor acompanha respostas e pendências, com contagens para todos os atendimentos realizados.
- Avaliações aguardadas incluem somente inscrições confirmadas com presença em sessões realizadas e sem resposta. Ausência, comparecimento sem registro e cancelamentos são excluídos dessa contagem.
- Correções posteriores de comparecimento preservam as respostas já recebidas. A elegibilidade é validada no momento do envio.
- A consulta de avaliações cobre todas as sessões realizadas persistidas, sem prazo de 28 dias para responder. A agenda operacional do monitor continua usando o histórico recente para presença e realização.
- Novas inscrições funcionam com avaliações aguardadas. Falhas de conexão permitem repetir a mesma operação, com uma única resposta e sem sobrescrever outra avaliação.

## Fórum e colaboração assíncrona — F6

O fórum amplia a monitoria com discussões sobre Lógica de Programação entre alunos e monitores. A fase vem após os fluxos de atendimento de F5 e antes do tour de F7, que também apresentará a colaboração assíncrona.

Decisões da primeira entrega de F6.1–F6.5.

- Qualquer participante autenticado com Google pode ler, criar tópicos e responder, independentemente de inscrição presencial ou do término do calendário.
- Tópicos têm título de 3 a 120 caracteres, assunto da lista aprovada e descrição. Descrições e respostas aceitam até 4.000 caracteres, com seletor de emojis, código em linha entre crases e blocos de código que preservam a indentação.
- Autoria e perfil são definidos no servidor. Cada publicação preserva o nome e o perfil no momento da escrita; nomes usados como e-mail recebem a identificação genérica “Participante”. E-mail, UID, registros de moderação e dados privados de inscrições/avaliações ficam fora da projeção compartilhada.
- A tela informa a visibilidade do nome e do texto antes da publicação. O fórum é acessado explicitamente pelas sidebars dos dois perfis.
- Tópicos começam pelos mais recentes. Respostas seguem a ordem cronológica. Ambas as listagens têm dez itens por página, desempate pelo ID e cursor persistente; edições e moderação preservam a ordem original. Publicações ocultadas ocupam seu lugar na paginação.
- O autor edita o próprio conteúdo visível com verificação de versão. A autoria, a data de criação e a contagem de respostas são preservadas; versões antigas são recusadas.
- O monitor pode ocultar ou restaurar tópicos e respostas. A ocultação exige motivo de até 300 caracteres. Cada operação registra autor, horário e alvo em coleção administrativa. O motivo e o texto original ocultado são visíveis ao monitor.
- Para alunos, o conteúdo ocultado é substituído por um aviso e removido da resposta do servidor. Ocultar um tópico também retira a conversa do acesso dos alunos e encerra novas respostas/edições até a restauração. Os dados são preservados.
- Cada tentativa usa um identificador e um hash do comando validados no servidor. Reenvios, falhas de conexão e concorrência preservam uma única escrita e a contagem de respostas. Alterar o conteúdo de uma tentativa já concluída é recusado.
- Os dados usam `forumTopics/{id}`, sua subcoleção `replies` e `forumOperations` para conferência de reenvios e auditoria. O acesso direto do cliente permanece fechado. A consulta usa os índices automáticos de criação/ID.
- A leitura ocorre ao abrir ou atualizar a página. Carregamento reutiliza os spinners dos portais, erros de leitura oferecem nova tentativa e erros de envio preservam os campos. A primeira versão usa publicação, leitura e resposta assíncronas.

O aceite inclui uma conversa entre duas contas de aluno e a conta do monitor, com persistência, edição pelo autor, ocultação/restauração, navegação por teclado, paginação e layout móvel. O tour de F7 apresentará esse fluxo.

## Tour guiado — F7

O tour tem cinco passos por perfil, com links para recursos disponíveis e um guia em texto no menu Ajuda.

- Aluno: painel de inscrições, registro da dúvida, agenda, avaliação e fórum.
- Monitor: painel de demandas, preparação de sessões e cancelamentos, comparecimento e realização, avaliações e moderação do fórum.
- O convite aparece no primeiro acesso de cada perfil, inclusive em links diretos. Pular ou concluir dispensa o convite. A opção **Rever tour** fica disponível em **Ajuda**.
- O Firestore guarda a decisão de pular ou concluir no perfil autenticado, por UID e papel. Concluir prevalece sobre pular, inclusive em reenvios concorrentes. O passo atual pertence à visita e o tour reabre no primeiro passo.
- A caixa de diálogo funciona mesmo com a sidebar recolhida ou com o menu móvel fechado. O foco acompanha cada passo e volta ao botão de origem ou a Ajuda ao fechar. O painel tem rolagem interna em telas baixas e funciona com movimento reduzido.
- Os links abrem as telas reais. Inscrições, publicações e registros de presença exigem as ações usuais do usuário nas respectivas telas.

## Avaliação do atendimento e resolução

O controle da resolução faz parte do acompanhamento pedagógico da aplicação. Persistir a avaliação e o resultado nos dados operacionais já previstos para o Firestore, acessíveis ao aluno envolvido e ao monitor. O recurso não deve depender de uma resposta armazenada apenas em uma ferramenta de analytics.

Fluxo aprovado em Q15–Q17:

1. O monitor registra a realização da sessão e a presença do aluno.
2. Com a sessão realizada e sua presença registrada, o aluno encontra no aplicativo o pedido de avaliação referente à sua inscrição.
3. Ele avalia o pedido de ajuda como um todo, considerando assunto e descrição: resolvida, parcialmente resolvida ou não resolvida, com comentário opcional.
4. A aplicação salva a resposta e mostra o resultado ao aluno e ao monitor.
5. Enquanto não há resposta, mostrar avaliação aguardada; não marcar a dúvida como não resolvida automaticamente.
6. Permitir novos agendamentos mesmo que existam avaliações aguardadas.

Prever confirmação de envio e nova tentativa em falhas, sem avaliações duplicadas por reenvio. Vincular a resposta ao assunto e à descrição avaliados, preservando esse contexto se houver edição posterior do pedido; uma edição não altera silenciosamente a avaliação salva nem cria outra inscrição. Não misturar o comentário pedagógico com relatos de problemas da plataforma.

## PostHog, surveys e feedback da plataforma

Os surveys desta seção são sobre a **plataforma**, não sobre o conteúdo da disciplina ou a resolução da dúvida. Pedidos de ajuda e avaliações pedagógicas permanecem no acompanhamento operacional da monitoria.

Proposta de survey curto, aberto pelo aluno no item “Enviar feedback”:

1. Tipo: “Sugestão de melhoria” ou “Problema na plataforma”.
2. Descrição: o que gostaria de melhorar ou qual problema encontrou.
3. Contexto opcional: página ou etapa em que ocorreu o problema, sem parâmetros sensíveis da URL.

Reutilizar a apresentação de survey do PostHog se atender ao design e à acessibilidade; uma interface própria só se houver necessidade comprovada. Verificar preenchimento, confirmação de envio, falha e chegada das respostas no projeto correto. Não prometer anonimato sem configurar e verificar esse comportamento.

Resultados ficam inicialmente no PostHog, para revisão pelo monitor. Espelhamento no painel, fluxo de tickets e notificações automáticas não são necessários para coletar o feedback solicitado. Pesquisas automáticas após ações específicas ficam como proposta futura, com audiência e momento a validar.

Definir responsabilidades antes de instrumentar: PostHog para comportamento e surveys, Sentry para erros, Firebase Analytics para o conjunto complementar de eventos efetivamente necessário. Não duplicar eventos sem finalidade explícita. Não enviar a descrição da dúvida acadêmica como propriedade de analytics. Com captura opcional recusada, respeitar a escolha; não habilitar rastreamento silenciosamente para permitir feedback.

## Segurança e consistência

- Inscrições, pedidos vinculados e avaliações são acessíveis ao aluno titular e ao monitor. Publicações do fórum são compartilhadas entre participantes autenticados, com edição pelo autor e moderação pelo monitor.
- A autorização deve existir junto das operações e dos dados, além da navegação por perfil.
- A atribuição do perfil de monitor deve ocorrer por configuração confiável, fora do controle do aluno.
- Validar assunto, descrição, identidade, horário, disponibilidade e transições de estado nas fronteiras de escrita.
- Permitir até dez alunos distintos na mesma sessão. Verificar capacidade e registrar a inscrição de forma atômica, incluindo a unicidade de inscrição ativa por aluno e sessão.
- Manter a quantidade de pessoas distintas correta sob inscrições simultâneas, reenvios, edições da descrição e cancelamentos. Não permitir que o mesmo aluno ocupe duas vagas na mesma sessão.
- Validar no momento da operação a janela móvel de quatro semanas, o término do período e o prazo anterior ao início. Esconder ou desabilitar um botão não substitui essa validação.
- Remarcação não pode cancelar a inscrição anterior se não for possível concluir a nova.
- Alterações de status e métricas devem distinguir inscrição futura, cancelamento, sessão realizada, presença registrada e resultado da resolução, conforme as regras aprovadas.
- Somente o aluno titular pode enviar a avaliação de sua inscrição; o monitor consulta a resposta. Validar na escrita a sessão realizada e a presença registrada; impedir respostas para inscrição cancelada ou aluno ausente/sem presença registrada.
- Garantir uma avaliação por inscrição e preservar o resultado em reenvios ou falhas, sem alterar sua vinculação à sessão nem o contexto avaliado.
- O acesso aberto com Google preserva a privacidade das dúvidas vinculadas a inscrições e da lista de participantes das sessões. Textos compartilhados no fórum são publicados explicitamente pelo autor.

## Verificação mínima

- Permissões: aluno A não lê inscrições, pedidos vinculados ou avaliações do aluno B e não executa ações do monitor. No fórum, lê publicações compartilhadas e edita somente as próprias.
- Inscrição coletiva: dois alunos diferentes podem se inscrever na mesma sessão com vagas; a quantidade prevista aumenta em dois.
- Contagem: reenvios, edição das dúvidas e tentativas simultâneas do mesmo aluno não geram duas inscrições ativas nem ocupam duas vagas; cancelados saem da previsão.
- Capacidade: com nove inscritos, duas tentativas concorrentes de alunos diferentes permitem somente uma nova inscrição; o total nunca supera dez.
- Agenda: rejeitar dias, horários e datas fora da oferta, após 11/12/2026, fora da janela de 28 dias ou bloqueados; a última sessão recorrente é 09/12/2026. Verificar limites em America/Bahia.
- Prazos: permitir inscrição, cancelamento e remarcação antes das 11h30; rejeitar essas operações pelo aluno a partir do início da sessão.
- Cancelamento: liberar a vaga; cancelamento da sessão cancela inscrições e mantém o motivo visível no histórico dos alunos.
- Remarcação: destino lotado ou indisponível preserva a inscrição original, inclusive em tentativas concorrentes.
- Presença: somente o monitor registra comparecimento; aluno sem registro permanece “não registrado”, em vez de ser marcado automaticamente como ausente.
- Avaliação: somente o aluno titular avalia o pedido de sua inscrição como um todo, uma vez por sessão, após realização e presença; rejeitar avaliação por outro aluno, pelo monitor em nome do aluno ou para inscrição cancelada/ausência de presença registrada.
- Resolução: distinguir resolvida, parcialmente resolvida, não resolvida e sem avaliação; uma falha ou reenvio não apaga nem duplica o resultado salvo.
- Pendências de avaliação: considerar somente atendimentos elegíveis sem resposta; não classificar cancelados, ausentes ou sessões futuras como avaliações aguardadas e não bloquear novos agendamentos por falta de avaliação.
- Edição da dúvida: manter a inscrição e preservar o contexto e a resposta já avaliados, sem recalcular a resolução automaticamente.
- Dados: rejeitar assunto inválido e dúvida sem conteúdo; preservar registros existentes em falhas.
- Métricas: verificar alunos distintos, cancelamentos, sessão sem inscritos e ocupação de 0%, 80% e 100%; distinguir sessões realizadas, participações individuais, avaliações recebidas/aguardadas e resultado da resolução.
- Experiência: executar o fluxo aluno → solicitação/inscrição → sessão coletiva → consulta dos inscritos pelo monitor → realização e presença → avaliação pelo fluxo aprovado → resolução exibida no painel.
- Fórum: criar tópico e trocar respostas entre alunos e monitor; verificar autenticação, edição pelo autor, moderação, paginação, reenvios sem duplicação, conteúdo seguro e uso por teclado/celular.
- Tour: pular, concluir e reabrir em desktop e celular, usando teclado.
- Privacidade/feedback: testar recusa e revogação de coleta e verificar uma resposta de survey no PostHog.
- CI: lint, tipos, testes relevantes e build antes da integração das mudanças.

## Limites da primeira versão

Sem pagamentos, chat, anexos, integração com calendários externos, aplicativo nativo, lista de espera ou notificações por e-mail/WhatsApp. Essas funções exigem necessidade confirmada antes de entrar no planejamento. Um único monitor é suficiente para o contexto informado.

As decisões da F2-A estão registradas no README: Firestore Standard em São Paulo, acesso direto fechado e SDK administrativo restrito ao servidor. Uma mudança futura da região do banco exigirá planejar a migração dos dados; não tratar essa alteração como simples troca de variável de ambiente.

## Referências consultadas

- [Next.js: autenticação e autorização próximas aos dados](https://nextjs.org/docs/app/guides/authentication).
- [Firebase: transações atômicas e concorrência](https://firebase.google.com/docs/firestore/manage-data/transactions).
- [Firebase: condições de segurança](https://firebase.google.com/docs/firestore/security/rules-conditions).
- [PostHog: criação e configuração de surveys](https://posthog.com/docs/surveys/creating-surveys).
- [PostHog: interfaces de survey](https://posthog.com/docs/surveys/implementing-custom-surveys).
- [PostHog: controles de captura](https://posthog.com/docs/libraries/js#opt-out-of-data-capture).
