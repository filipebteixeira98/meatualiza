# F3 — Preparação do pedido de ajuda

Status: integrada à `main` no [PR #7](https://github.com/filipebteixeira98/meatualiza/pull/7), com validação confirmada pelo responsável. Este documento registra a preparação entregue em F3; a inscrição persistida e a agenda são implementadas na [F4](./PLANO-F4.md).

Entrega: o aluno autenticado acessa **Preparar minha dúvida**, escolhe o assunto,
descreve a dificuldade, revisa e volta para editar. `/aluno/duvida` verifica a
sessão no servidor e direciona a conta do monitor para sua própria área.

## Contrato do conteúdo

`src/lib/help-request.ts` define o schema Zod e o tipo `HelpRequestDraft`, usados
pelo formulário React Hook Form e pelos testes de domínio:

```ts
{
  topicId: "repeticao",
  description: "Meu laço não termina. Como atualizar o contador?"
}
```

- `topicId`: identificador estável de um dos nove assuntos aprovados em
  `src/lib/monitoria.ts`, ou `outro` para “Outro assunto / não sei classificar”.
  Alterar um título não exige alterar o identificador.
- `description`: texto obrigatório, com espaços das bordas removidos e de 1 a
  2.000 caracteres após normalização. Preservar quebras de linha e código como
  texto, sem executar HTML.
- O contrato de conteúdo recusa campos extras. Identidade, sessão de monitoria,
  estados e datas não são conteúdo editável da dúvida.

Nesta entrega, o rascunho fica apenas na memória da página. Não existe endpoint
de envio, documento de pedido avulso, salvamento automático nem armazenamento
persistente no navegador. Recarregar ou sair descarta o texto; a tela avisa
antes da revisão e não apresenta confirmação de inscrição.

## Integração seguinte — F4

O pedido de ajuda será criado junto à inscrição na sessão escolhida. A operação
receberá o identificador da sessão e o conteúdo acima em `helpRequest`; o
servidor validará novamente o schema, derivará o UID da sessão autenticada e
definirá estados/datas. Nenhum UID ou privilégio virá do formulário.

1. Gerar e consultar sessões nas próximas quatro semanas, respeitando
   America/Bahia, segundas/quartas 11h30–12h30 e o término aprovado.
2. Disponibilizar agenda responsiva com alternativa em lista e seleção de sessão.
3. Confirmar inscrição e pedido juntos, com limite de dez e unicidade por aluno,
   inclusive sob concorrência. Falha não cria pedido órfão nem consome vaga.
4. Permitir edição da descrição sem outra inscrição e implementar cancelamento
   e troca até o início; remarcação malsucedida preserva a inscrição anterior.
5. Testar limites de horário, capacidade, repetição de operação e isolamento de
   alunos nos emuladores, além do fluxo de navegador em desktop e celular.

Histórico, lista de inscritos/dúvidas do monitor, presença, avaliação e métricas
seguem na F5. Regras completas permanecem em [ROADMAP.md](./ROADMAP.md).

## Aceite verificável

- Todos os assuntos aprovados e a opção livre estão disponíveis.
- Campos vazios, assunto desconhecido e descrição acima do limite são recusados.
- Erros identificam os campos e levam o foco ao primeiro inválido; a revisão e a
  volta para edição também recebem foco. Controles só ficam disponíveis após
  hidratação, evitando submissão nativa com texto na URL.
- Revisão preserva assunto e conteúdo; texto de código é exibido literalmente.
- Celular, teclado e texto longo não causam rolagem horizontal em 320 px.
- Ausência de login exige entrada; monitor não recebe o formulário de aluno.
- Suítes de domínio e navegador verificam o fluxo sem usar identidades reais.

Verificação local: seis testes de domínio, 16 de navegador para acesso/formulário,
28 de Firebase e dez da landing passaram (dois casos específicos de viewport
não se aplicam ao outro projeto). Formatação, lint, tipos e build passaram;
`npm audit --omit=dev` não encontrou vulnerabilidades. Capturas desktop/celular
foram inspecionadas. OAuth em celular real permanece como pendência da F2-B.6.
