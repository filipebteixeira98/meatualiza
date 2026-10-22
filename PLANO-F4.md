# F4 — Agenda e inscrição em grupo

Status: implementada na branch `feat/session-bookings`, verificada e aguardando
revisão e merge. F3 foi integrada no PR #7 e validada pelo responsável.

## Fluxos entregues

```text
Aluno → Minha agenda → calendário ou lista
  sessão → assunto e descrição → revisão → confirmar inscrição
  inscrição confirmada → editar dúvida / cancelar / trocar sessão
Monitor → Gerenciar agenda → quantidade prevista / 10
  bloquear data ou cancelar sessão → motivo → cancelar inscrições afetadas
```

Rotas: `/aluno/agenda`, `/aluno/duvida` e `/monitor/agenda`. Nenhum pedido é salvo
sem inscrição. O formulário preserva os campos ao revisar/editar e em falhas de
envio. Somente o texto ainda não confirmado fica temporário na página.

## Tempo e disponibilidade

- Uma sessão por segunda e quarta, 11h30–12h30, America/Bahia, até dez alunos.
  Local: SENAI Dendezeiros, laboratório de informática L7.
- Janela móvel de 28 × 24 horas: início estritamente depois de agora e antes
  de agora + 28 dias. A borda direita não está incluída. O servidor aplica
  novamente essa regra ao confirmar, inclusive nas repetições da transação.
- Término aprovado em 11/12/2026; última sessão regular em 09/12/2026. Após o
  último início não há novas sessões para inscrição; a interface mostra o vazio.
- UTC−03 é o deslocamento de America/Bahia no período aprovado. Instantes são
  armazenados como ISO 8601 UTC; rótulos usam explicitamente America/Bahia.
- Inscrição, edição da dúvida, cancelamento e troca pelo aluno exigem que a
  sessão de origem ainda não tenha começado. A troca também valida o destino
  na janela, com vaga, agendado e sem outra inscrição ativa do mesmo aluno.
- Sessões ainda sem documento são disponibilidade calculada, sem escrita na
  renderização. Primeira inscrição ou bloqueio cria o documento na transação.

## Persistência e autorização

```text
sessions/{YYYY-MM-DD}
  startsAt, endsAt, status, enrolledCount, cancellationReason, updatedAt
  registrations/{UID verificado}
    studentId, status, helpRequest {topicId, description}, version
    cancellationReason, createdAt, updatedAt, lastOperationId, lastOperationHash
    history/{operationId}
      type, at, reason ou target/from quando pertinente
```

- Uma referência determinística por aluno/sessão garante unicidade. Cancelar e
  reinscrever atualiza o registro e preserva os eventos anteriores; documentos
  de inscrição não são apagados. Edição não altera ocupação.
- Leituras retornam apenas ocupação e a inscrição do próprio aluno. O monitor
  recebe contagens nesta entrega; a listagem autorizada será completada em F5.
  Agenda usa uma transação de leitura para manter um snapshot consistente.
- `changeBooking` verifica novamente a sessão e o papel, valida comandos com
  Zod e deriva UID da identidade confiável. Não aceita UID, papel, capacidade,
  estados ou datas enviados pelo cliente. Somente o monitor cancela sessões;
  somente o aluno altera a própria inscrição.
- A Server Action exige a origem exata de `APP_ORIGIN`, além da proteção de
  origem/host do Next.js. Controles de formulário ficam desabilitados antes da
  hidratação. Regras do Firestore continuam negando acesso direto do cliente.
- Nenhum texto de dúvida é enviado a analytics, URLs ou armazenamento local.

## Consistência das alterações

- Inscrição lê sessão e registro do aluno, confere capacidade e escreve pedido,
  inscrição e nova ocupação juntos. Uma disputa pela décima vaga confirma só um.
- Cancelamento libera uma vaga. Troca lê origem e destino antes das escritas e
  confirma as duas alterações juntas; falha preserva o registro anterior.
- Cancelamento pelo monitor lê as inscrições ativas e cancela todas junto da
  sessão, zerando ocupação e registrando o motivo. Bloqueio de data sem inscritos
  usa a mesma operação. Não há exclusão de registros nem reabertura automática.
- Cada alteração tem UUID e hash do comando normalizado. Repetir a última
  operação confirma o resultado sem outra escrita. Versão esperada recusa
  operações antigas e alterações de outra aba; reutilizar UUID com outro
  conteúdo é recusado. O navegador mantém o UUID em memória ao tentar novamente
  após falha de conexão, inclusive se o servidor já gravou a primeira tentativa.
- Ocupação atualiza no carregamento, atualização manual e alterações concluídas.
  O servidor sempre confere as vagas de novo no envio.

## Validação e próxima entrega

Testes de domínio cobrem recorrência, fuso, bordas da janela, início, término e
contratos. Testes com Firestore/Auth Emulator cobrem disputa, reenvio, isolamento,
edição, cancelamento, troca, bloqueio e versões antigas. O relógio dos testes de
transação é injetado apenas na função de servidor; a Server Action não aceita
relógio do cliente. Assim, as regras do período continuam verificáveis depois de
2026 sem alterar a política real.

Navegador verifica calendário/lista, inscrição, edição, troca, cancelamento,
origem inválida, perda da resposta após gravação, ocupação do monitor e motivo
visível ao aluno. Casos de inscrição no navegador usam o período real; são
pulados quando não restam sessões suficientes para isolar os dois viewports.
Os testes de transações mantêm cobertura com período fixo.

Verificação local: **81 testes passaram** — 12 de domínio, 41 de servidor/Firebase,
18 de navegador para acesso e inscrições e dez da landing de produção. Dois
casos existentes específicos de viewport são pulados no projeto ao qual não se
aplicam. Formatação, lint, tipagem, build e diff passaram; capturas das agendas
foram inspecionadas em desktop e celular. O fluxo novo foi verificado nos
emuladores; validação com contas e inscrições controladas no Firebase real fica
para a revisão do responsável, sem publicar credenciais ou dados pessoais.

Próxima entrega: **F5**, com painéis e navegação completos, lista de inscritos e
dúvidas por sessão, histórico passado, presença manual, realização do encontro,
avaliação da resolução pelo aluno e métricas documentadas. Tour, PostHog Surveys,
privacidade e observabilidade continuam nas fases já aprovadas.
