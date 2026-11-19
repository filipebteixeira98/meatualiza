import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { googlePopup } from "./google";
import { openNavigation, signOut } from "./workspace";

test.setTimeout(180_000);
let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let database: ReturnType<typeof getFirestore>;
test.beforeAll(() => {
  expect(process.env.GCLOUD_PROJECT).toBe("demo-meatualiza");
  expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe("127.0.0.1:9099");
  expect(process.env.FIRESTORE_EMULATOR_HOST).toBe("127.0.0.1:8080");
  app = initializeApp({ projectId: "demo-meatualiza" });
  auth = getAuth(app);
  database = getFirestore(app);
});
test.afterAll(async () => {
  if (app) await deleteApp(app);
});

test("duas contas de aluno colaboram e o monitor responde, oculta e restaura publicações", async ({
  page,
  browser,
}, info) => {
  const otherContext = await browser.newContext(info.project.use);
  const monitorContext = await browser.newContext(info.project.use);
  const other = await otherContext.newPage();
  const monitor = await monitorContext.newPage();
  const seedIds: string[] = [];
  let topicId = "";
  const email = `forum.${randomUUID()}@example.test`;
  const otherEmail = `forum.other.${randomUUID()}@example.test`;
  const monitorEmail = `forum.monitor.${randomUUID()}@example.test`;
  const title = "Por que meu laço não termina?";
  const body =
    "O contador começa em zero, mas o programa repete sem parar.\nenquanto (contador < 10) { escreva(contador); }";
  const answer =
    "Incremente o contador dentro do laço. Assim, a condição será falsa ao chegar a dez.";
  const monitorAnswer =
    "Isso mesmo. Faça um teste de mesa com os valores de 0 a 10 e observe quando a condição deixa de ser verdadeira.";
  try {
    await page.goto("/aluno/forum");
    await expect(page).toHaveURL(/\/entrar$/);
    await googlePopup(page, email);
    await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    const studentId = (await auth.getUserByEmail(email)).uid;
    await database
      .doc(`users/${studentId}`)
      .update({ displayName: "Marina Souza" });
    await openNavigation(page, "aluno");
    await page.getByRole("link", { name: "Fórum", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Uma dúvida. Mais de um caminho.",
    );
    const newTopic = page.getByText("Novo tópico", { exact: true });
    await newTopic.focus();
    await page.keyboard.press("Enter");
    const create = page.getByRole("form", {
      name: "Criar tópico",
      exact: true,
    });
    await create.getByLabel("Título", { exact: true }).fill(title);
    await create
      .getByLabel("Assunto", { exact: true })
      .selectOption("repeticao");
    await create.getByLabel("Descrição", { exact: true }).fill(body);
    await expect(
      create.getByLabel("Descrição", { exact: true }),
    ).toHaveAttribute("maxlength", "4000");
    let stage = "origin";
    await page.route("**/aluno/forum", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      if (stage === "origin") {
        stage = "lose-response";
        const response = await route.fetch({
          headers: {
            ...route.request().headers(),
            origin: "https://invalid.example",
          },
        });
        await route.fulfill({ response });
      } else if (stage === "lose-response") {
        stage = "continue";
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    });
    await create
      .getByRole("button", { name: "Publicar tópico", exact: true })
      .click();
    await expect(create.getByRole("alert")).toBeVisible();
    await create
      .getByRole("button", { name: "Publicar tópico", exact: true })
      .click();
    await expect(create.getByRole("alert")).toContainText("conexão falhou");
    await expect(create.getByRole("alert")).toBeFocused();
    await expect(create.getByLabel("Descrição", { exact: true })).toHaveValue(
      body,
    );
    await create
      .getByRole("button", { name: "Publicar tópico", exact: true })
      .click();
    await expect(page).toHaveURL(/\/aluno\/forum\/[\da-f-]{36}$/);
    topicId = new URL(page.url()).pathname.split("/").at(-1)!;
    expect(
      (
        await database
          .collection("forumTopics")
          .where("authorId", "==", studentId)
          .get()
      ).size,
    ).toBe(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await openNavigation(page, "aluno");
    await expect(
      page
        .getByRole("navigation", { name: "Navegação do aluno", exact: true })
        .getByRole("link", { name: "Fórum", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    if (await page.getByRole("dialog").isVisible())
      await page.keyboard.press("Escape");

    await other.goto(`http://127.0.0.1:3101/aluno/forum/${topicId}`);
    await expect(other).toHaveURL(/\/entrar$/);
    await googlePopup(other, otherEmail);
    await expect(other).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    const otherId = (await auth.getUserByEmail(otherEmail)).uid;
    await database
      .doc(`users/${otherId}`)
      .update({ displayName: "Bruno Lima" });
    await other.goto(`/aluno/forum/${topicId}`);
    await expect(
      other
        .getByRole("article", { name: "Publicação inicial", exact: true })
        .getByText("Editar", { exact: true }),
    ).toHaveCount(0);
    const unsafe = "<script>window.forumExecuted = true</script>";
    await other
      .getByRole("form", { name: "Responder tópico", exact: true })
      .getByLabel("Sua resposta", { exact: true })
      .fill(unsafe);
    await other
      .getByRole("button", { name: "Publicar resposta", exact: true })
      .click();
    const ownReply = other.getByRole("article", {
      name: "Resposta de Bruno Lima",
      exact: true,
    });
    await expect(
      ownReply.getByRole("paragraph").filter({ hasText: unsafe }),
    ).toBeVisible();
    expect(await other.evaluate(() => "forumExecuted" in window)).toBe(false);
    await ownReply.getByText("Editar", { exact: true }).click();
    await ownReply
      .getByRole("form", { name: "Editar publicação" })
      .getByLabel("Sua resposta", { exact: true })
      .fill(answer);
    await ownReply
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await expect(
      ownReply.getByRole("paragraph").filter({ hasText: answer }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole("article", { name: "Resposta de Bruno Lima", exact: true })
        .getByText("Editar", { exact: true }),
    ).toHaveCount(0);
    expect(await page.content()).not.toContain(otherEmail);

    await monitor.goto("http://127.0.0.1:3101/entrar");
    await googlePopup(monitor, monitorEmail);
    await expect(monitor).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    const monitorId = (await auth.getUserByEmail(monitorEmail)).uid;
    await auth.setCustomUserClaims(monitorId, { monitor: true });
    await signOut(monitor, "aluno");
    await expect(monitor).toHaveURL(/\/$/);
    await monitor.goto("http://127.0.0.1:3101/entrar");
    await googlePopup(monitor, monitorEmail);
    await expect(monitor).toHaveURL(/\/monitor$/, { timeout: 25_000 });
    await database
      .doc(`users/${monitorId}`)
      .update({ displayName: "Filipe Teixeira" });
    await monitor.goto(`/aluno/forum/${topicId}`);
    await expect(monitor).toHaveURL(new RegExp(`/monitor/forum/${topicId}$`));
    await monitor
      .getByRole("form", { name: "Responder tópico" })
      .getByLabel("Sua resposta", { exact: true })
      .fill(monitorAnswer);
    await monitor
      .getByRole("button", { name: "Publicar resposta", exact: true })
      .click();
    const moderatedReply = monitor.getByRole("article", {
      name: "Resposta de Bruno Lima",
      exact: true,
    });
    await moderatedReply.getByText("Moderar", { exact: true }).click();
    await moderatedReply
      .getByLabel("Motivo da ocultação", { exact: true })
      .fill("Resposta em revisão pelo monitor.");
    await moderatedReply
      .getByRole("button", { name: "Ocultar publicação", exact: true })
      .click();
    await expect(
      moderatedReply.getByText("Rever ocultação", { exact: true }),
    ).toBeVisible();
    await expect(
      moderatedReply.getByText("Resposta em revisão pelo monitor.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    expect(
      (await page.content()).includes(answer),
      "A resposta ocultada deve ser removida do HTML e dos dados serializados do aluno.",
    ).toBe(false);
    await expect(
      page.getByText("Publicação ocultada pela moderação.", { exact: true }),
    ).toBeVisible();
    await expect(
      monitor.getByRole("button", { name: "Publicar resposta", exact: true }),
    ).toBeEnabled();
    await monitor.getByRole("main").focus();
    await monitor.evaluate(() =>
      window.scrollTo({ top: 0, behavior: "instant" }),
    );
    await monitor.screenshot({
      path: info.outputPath("forum-monitor.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    await moderatedReply.getByText("Rever ocultação", { exact: true }).click();
    await moderatedReply
      .getByRole("button", { name: "Restaurar publicação", exact: true })
      .click();
    await expect(
      moderatedReply.getByText("Moderar", { exact: true }),
    ).toBeVisible();
    const original = monitor.getByRole("article", {
      name: "Publicação inicial",
      exact: true,
    });
    await original.getByText("Moderar", { exact: true }).click();
    await original
      .getByLabel("Motivo da ocultação", { exact: true })
      .fill("Revisão temporária da discussão.");
    await original
      .getByRole("button", { name: "Ocultar publicação", exact: true })
      .click();
    await expect(
      original.getByText("Rever ocultação", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Tópico ocultado pela moderação",
    );
    expect(
      (await page.content()).includes(monitorAnswer),
      "Um tópico ocultado deve retirar também suas respostas da leitura do aluno.",
    ).toBe(false);
    await expect(
      page.getByRole("form", { name: "Responder tópico" }),
    ).toHaveCount(0);
    await original.getByText("Rever ocultação", { exact: true }).click();
    await original
      .getByRole("button", { name: "Restaurar publicação", exact: true })
      .click();
    await expect(original.getByText("Moderar", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(monitorAnswer, { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("article", {
          name: "Resposta de Filipe Teixeira",
          exact: true,
        })
        .getByText("Monitor", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publicar resposta", exact: true }),
    ).toBeEnabled();
    await page.screenshot({
      path: info.outputPath("forum-student.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: 320, height: 800 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.setViewportSize(viewport);

    const examples = [
      ["Como escolher entre enquanto e para?", "repeticao"],
      ["Qual a diferença entre inteiro e real?", "variaveis-tipos"],
      ["Organizando uma função para calcular a média", "funcoes-procedimentos"],
      ["Como percorrer um vetor sem ultrapassar o limite?", "vetores-matrizes"],
      ["Teste de mesa com duas condições", "teste-mesa-depuracao"],
      ["Quando usar uma variável auxiliar?", "variaveis-tipos"],
      ["Como decompor um problema em passos?", "algoritmos"],
      ["Entrada e saída de dados no pseudocódigo", "entrada-saida"],
      ["Entendendo a ordem dos operadores", "operadores-expressoes"],
      ["Como combinar duas expressões lógicas?", "condicionais"],
      ["Reutilizando um procedimento", "funcoes-procedimentos"],
    ];
    for (const [index, [example, subject]] of examples.entries()) {
      const id = randomUUID();
      seedIds.push(id);
      const stamp = Timestamp.fromMillis(Date.now() - (index + 1) * 86_400_000);
      await database.doc(`forumTopics/${id}`).set({
        title: example,
        topicId: subject,
        body: "Vamos discutir este assunto juntos.",
        authorId: otherId,
        authorName: "Bruno Lima",
        authorRole: "student",
        hidden: false,
        moderationReason: "",
        version: 1,
        replyCount: 0,
        createdAt: stamp,
        updatedAt: stamp,
      });
    }
    await page.goto("/aluno/forum");
    await expect(
      page
        .getByRole("region", { name: "Tópicos recentes" })
        .getByRole("listitem"),
    ).toHaveCount(10);
    await expect(
      page.getByRole("button", {
        name: "Publicar tópico",
        exact: true,
        includeHidden: true,
      }),
    ).toBeEnabled();
    await page.screenshot({
      path: info.outputPath("forum-feed.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    await page
      .getByRole("link", { name: "Próxima página", exact: true })
      .click();
    await expect(page).toHaveURL(/\?cursor=/);
    await expect(
      page.getByRole("link", { name: "Voltar ao início", exact: true }),
    ).toBeVisible();
  } finally {
    for (const id of [topicId, ...seedIds].filter(Boolean))
      await database.recursiveDelete(database.doc(`forumTopics/${id}`));
    await otherContext.close();
    await monitorContext.close();
  }
});
