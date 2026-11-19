export const tours = {
  student: [
    {
      title: "Acompanhe suas inscrições",
      text: "No painel, confira seus próximos encontros, as dúvidas que registrou, os avisos de cancelamento e as avaliações pendentes.",
      href: "/aluno",
      link: "Abrir painel",
    },
    {
      title: "Registre sua dúvida",
      text: "Em Nova inscrição, escolha o assunto, descreva onde travou e selecione uma sessão com vaga. Revise o pedido antes de confirmar.",
      href: "/aluno/duvida",
      link: "Abrir Nova inscrição",
    },
    {
      title: "Consulte a agenda",
      text: "Alterne entre calendário e lista para encontrar sessões. Antes do início do encontro, você pode editar a dúvida, trocar de sessão ou cancelar sua inscrição.",
      href: "/aluno/agenda",
      link: "Abrir agenda",
    },
    {
      title: "Avalie o atendimento",
      text: "Depois que o monitor marcar a sessão como realizada e registrar sua presença, informe se sua dúvida foi resolvida. O comentário é opcional.",
      href: "/aluno/avaliacoes",
      link: "Abrir avaliações",
    },
    {
      title: "Converse no fórum",
      text: "Abra um tópico sobre Lógica de Programação ou responda a uma pergunta. Alunos e monitor podem ler o que você publicar no fórum.",
      href: "/aluno/forum",
      link: "Abrir fórum",
    },
  ],
  monitor: [
    {
      title: "Acompanhe as demandas",
      text: "No painel, veja os pedidos recebidos, os assuntos mais procurados, a ocupação das sessões e os resultados dos atendimentos.",
      href: "/monitor",
      link: "Abrir painel",
    },
    {
      title: "Prepare os encontros",
      text: "Na agenda, confira quantos alunos são esperados, quem se inscreveu e quais dúvidas foram enviadas. Você também pode bloquear datas ou cancelar uma sessão com motivo.",
      href: "/monitor/agenda",
      link: "Abrir agenda",
    },
    {
      title: "Registre o comparecimento",
      text: "Na agenda, registre as presenças e marque a sessão como realizada após o horário de término. Você pode consultar os encontros na aba Recentes.",
      href: "/monitor/agenda",
      link: "Abrir agenda",
    },
    {
      title: "Consulte as avaliações",
      text: "Veja quais alunos já avaliaram o atendimento e quais respostas estão pendentes. Cada aluno presente informa se sua dúvida foi resolvida.",
      href: "/monitor/avaliacoes",
      link: "Abrir avaliações",
    },
    {
      title: "Participe e modere o fórum",
      text: "Responda a tópicos de Lógica de Programação. Em Moderar, você pode ocultar uma publicação com motivo e restaurá-la quando necessário.",
      href: "/monitor/forum",
      link: "Abrir fórum",
    },
  ],
} as const;
