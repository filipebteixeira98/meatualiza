**Objetivo:** Atuar como Desenvolvedor Full-Stack Senior e Arquiteto de Software para orientar, planejar e implementar uma aplicação web moderna de forma incremental e modular.

**Contexto do produto:** Plataforma para organizar a monitoria **em grupo** da disciplina **Lógica de Programação**. Estudantes devem poder registrar suas dúvidas, indicar o assunto do conteúdo programático, consultar o calendário e se inscrever nas sessões coletivas. O monitor deve ter um painel próprio para acompanhar solicitações, agenda, demandas e quantidade de alunos previstos em cada horário.

**Regras confirmadas:** Monitorias presenciais em grupo às segundas e quartas-feiras, com **uma sessão de 60 minutos, das 11h30 às 12h30**, no fuso **America/Bahia**, para **até dez alunos por sessão**. Local: **SENAI Dendezeiros, laboratório de informática L7**. Qualquer pessoa autenticada com Google pode solicitar monitoria, com confirmação automática da inscrição quando houver vaga. A agenda abre as próximas **quatro semanas**, respeitando o término previsto em **11/12/2026**. Pela recorrência informada, a última sessão regular será em **09/12/2026**.

**Participação:** Cada aluno pode ter uma inscrição ativa por sessão, vinculada ao pedido de ajuda, e editar a descrição das dúvidas sem criar outra inscrição. Inscrição, cancelamento e troca de sessão são permitidos antes do início do encontro, sem antecedência mínima. A presença é registrada manualmente pelo monitor. Ao cancelar uma sessão, o monitor informa o motivo e suas inscrições são canceladas; os alunos veem a situação e o motivo no aplicativo.

---

### **1. Stack Tecnológica Base**

- **Core:** React, Next.js (App Router), TypeScript.
- **Styling & UI:** Tailwind CSS, Shadcn UI, Lucide Icons.
- **Formulários & Validação:** React Hook Form + Zod.
- **Outras:** Adicionar bibliotecas necessárias conforme a evolução do projeto.

---

### **2. Arquitetura, Design System & Boas Práticas**

- **Clean Code & Nomenclatura:** Adotar padrões claros de nomenclatura, Clean Architecture e princípios SOLID.
- **Modularidade:** Utilizar o _Composition Pattern_ para isolar responsabilidades e criar componentes enxutos, objetivos e reutilizáveis.
- **Design System:**
  - Utilizar a paleta neutra e tons de cinza padrão do Shadcn UI.
  - **Zero Hardcoded:** Definir todas as cores e temas via variáveis CSS/Tailwind para facilitar customizações futuras e dinâmicas.
- **Boas Práticas de UI/UX:** Aplicar conceitos focados na experiência do usuário e microinterações fluidas.

---

### **3. Fluxo de Trabalho & Engenharia de Software**

- **Commits Incrementais:** Seguir a convenção _Conventional Commits_ (ex: `feat(auth): add Google OAuth login`), incluindo escopo e mensagens sempre em **inglês**.
- **Pull Requests:** Cada funcionalidade deve ser implementada em uma _feature branch_ individual e submetida via Pull Request (PR) para revisão.
- **Qualidade & CI/CD:**
  - O repositório deve conter pipeline de CI/CD automatizado com execução de testes.
  - Configurar _pre-commit hooks_ (Husky / lint-staged) para garantir a formatação de código (Prettier/ESLint) antes de cada commit.
- **Eficiência de Comunicação:** Respostas objetivas, diretas e pragmáticas para economizar contexto e tokens.

---

### **4. Integrações & MCPs Disponíveis**

A aplicação contará com os seguintes serviços e ferramentas já configurados via MCPs:

- **Firebase:** Autenticação e Firestore (Banco de Dados).
- **Analytics & Observabilidade:** Firebase Analytics, Sentry (monitoramento de erros) e PostHog (surveys e métricas de comportamento).

---

### **5. Escopo Inicial de Funcionalidades**

1. **Autenticação e perfis:** Login social via Google OAuth (Firebase Auth), com perfis de aluno e monitor e acesso de aluno aberto a qualquer conta Google. A conta do monitor deve ser configurada de forma segura; alunos não podem atribuir esse perfil a si mesmos. Autorizações devem proteger também os dados e as operações.
2. **Solicitações de monitoria:** Registrar assunto do conteúdo programático e descrição da dúvida no pedido vinculado à inscrição em uma sessão. Permitir acompanhamento pelo aluno e pelo monitor e edição da descrição sem nova inscrição. A lista inicial de assuntos foi aprovada e está em ROADMAP.md. Incluir acompanhamento da resolução da dúvida, além da inscrição e da presença.
3. **Calendário e inscrições em grupo:** Exibir sessões nas próximas quatro semanas, dentro da disponibilidade e do período informados, no fuso America/Bahia. Permitir até dez alunos por sessão, com confirmação automática e uma inscrição ativa por aluno. Garantir o limite também sob inscrições simultâneas. Inscrição, cancelamento e remarcação pelo aluno encerram no início da sessão. Cancelamentos liberam a vaga; remarcação malsucedida preserva a inscrição anterior. O monitor pode bloquear datas e cancelar sessões com motivo visível aos inscritos.
4. **Painel do aluno:** Apresentar suas solicitações, dúvidas, próximos agendamentos e situação dos atendimentos, com acesso ao calendário e à criação de pedidos de ajuda. Disponibilizar a avaliação do atendimento após a sessão ser marcada como realizada e a presença do aluno ser registrada, sem bloquear novos agendamentos por falta de avaliação.
5. **Painel do monitor:** Apresentar solicitações recebidas, agenda e, em cada sessão, **quantidade de alunos com presença prevista sobre a capacidade de dez**, lista de inscritos, dúvidas por aluno e assunto e registro manual de presença. Contar alunos distintos com inscrição ativa; manter comparecimento efetivo separado da previsão. Incluir demanda por assunto, ocupação, sessões realizadas e acompanhamento da resolução e das avaliações recebidas ou aguardadas, com definições documentadas para cada métrica.
6. **Onboarding e tour guiado:** Apresentação por perfil dos recursos efetivamente disponíveis na plataforma, com opção de pular e reabrir o tour, persistência da conclusão e funcionamento em dispositivos móveis e por teclado.
7. **Privacidade e LGPD:** Apresentar termos e preferências de coleta; distinguir aceite dos termos de consentimentos opcionais, persistir escolhas e permitir alterá-las depois. A coleta opcional deve respeitar recusa e revogação.
8. **Feedback sobre a plataforma:** Utilizar PostHog Surveys para sugestões e relatos de problemas da aplicação, com acesso pelo menu de ajuda/feedback. Manter esse feedback separado das dúvidas acadêmicas e verificar a chegada de uma resposta de teste ao PostHog.
9. **Navegação (Sidebar):**
   - Menu lateral responsivo para navegação entre rotas.
   - Dropdown no rodapé da Sidebar com atalho para Logout e configurações rápidas de perfil.
   - Acesso ao tour guiado, preferências de privacidade e feedback da plataforma.
10. **Responsividade e acessibilidade:** Todo o aplicativo, incluindo painéis, calendário, formulários, tour e surveys, deve funcionar em celulares, tablets e desktops. Prever foco visível, rótulos, navegação por teclado e respeito à preferência por movimento reduzido.
11. **Estados e observabilidade:** Prever carregamento, ausência de dados, falha e nova tentativa nos fluxos pertinentes; integrar Sentry para erros e delimitar responsabilidades de Firebase Analytics e PostHog, evitando eventos duplicados e envio de textos de dúvidas ou dados pessoais desnecessários.
12. **Resolução das dúvidas e avaliação do atendimento:** Coletar do próprio aluno uma avaliação por inscrição/sessão, considerando o pedido de ajuda como um todo, com seu assunto e descrição. O aluno informa “resolvida”, “parcialmente resolvida” ou “não resolvida”, com comentário opcional, após a sessão realizada e sua presença registrada pelo monitor. Enquanto não houver resposta de um atendimento elegível, mostrar “aguardando avaliação”; não inferir dúvida não resolvida nem bloquear novos agendamentos. O monitor acompanha as respostas e pendências em seu painel. O feedback sobre a plataforma via PostHog permanece um fluxo distinto.
13. **Landing page e direção visual:** Disponibilizar página pública compacta, em tema escuro por padrão, com identidade ligada à monitoria no laboratório L7. Apresentar funcionamento, dias/horários, local, capacidade, perguntas frequentes e acesso à plataforma. Mostrar a lista completa de assuntos somente quando solicitada pelo visitante. Interfaces simples, modernas e responsivas, com hierarquia clara, tipografia legível e paleta neutra. A página de acesso deve comunicar o estado real da autenticação enquanto a integração estiver em preparação.

O detalhamento incremental, os critérios de aceite e as regras aprovadas estão em [ROADMAP.md](./ROADMAP.md). O vocabulário do domínio está em [GLOSSARY.md](./GLOSSARY.md).

---

### **6. Entregáveis Iniciais Solicitados**

Antes de codificar, por favor forneça:

1. **Roadmap & Planejamento Incremental:** Divisão do projeto em fases e pequenas tarefas granulares.
2. **Tabela de Acompanhamento (Kanban/Backlog):** Uma matriz/tabela contendo as tarefas divididas nas colunas: `A Fazer`, `Em Andamento` e `Concluído`.
3. **Sugestões de Melhorias:** Ideias complementares de UI/UX, arquitetura ou funcionalidades que agreguem valor à aplicação nesta fase inicial.
