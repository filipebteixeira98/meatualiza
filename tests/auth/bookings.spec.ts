import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { upcomingSessions, sessionLabel } from "../../src/lib/schedule";
import { googlePopup } from "./google";
import { openMonitorNavigation } from "./monitor-navigation";

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

async function book(
  page: Page,
  id: string,
  description = "Como controlar a repetição no meu algoritmo?",
) {
  await page.goto(`/aluno/duvida?sessao=${id}`);
  await page.getByLabel("Assunto", { exact: true }).selectOption("repeticao");
  await page.getByLabel("Sua dúvida", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Revisar dúvida" }).click();
  await page
    .getByRole("button", { name: "Confirmar inscrição", exact: true })
    .click();
  await expect(page).toHaveURL(/\/aluno\/agenda$/);
  await expect(page.getByText("Sua inscrição está confirmada.")).toBeVisible();
}

test("inscrição, resposta perdida, edição, troca, cancelamento e agenda do monitor", async ({
  page,
  browser,
}, info) => {
  const slots = upcomingSessions(Date.now() + 5 * 60_000).map(({ id }) => id);
  const offset = info.project.name === "mobile" ? 2 : 0;
  test.skip(
    slots.length < offset + 2,
    "A janela restante não contém duas sessões isoladas para este viewport; transações são testadas com relógio fixo.",
  );
  const [source, target] = slots.slice(offset, offset + 2);
  for (const id of [source, target])
    await database.recursiveDelete(database.doc(`sessions/${id}`));
  const email = `agenda.${randomUUID()}@example.test`;
  await page.goto("/aluno/agenda");
  await expect(page).toHaveURL(/\/entrar$/);
  await googlePopup(page, email);
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
  const student = await auth.getUserByEmail(email);
  await page.getByRole("link", { name: "Minha agenda", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "Lista", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(slots.length);
  await page.getByRole("button", { name: "Calendário", exact: true }).click();

  await page.goto(`/aluno/duvida?sessao=${source}`);
  await page.getByLabel("Assunto", { exact: true }).selectOption("repeticao");
  await page
    .getByLabel("Sua dúvida", { exact: true })
    .fill("Como controlar a repetição no meu algoritmo?");
  await page.getByRole("button", { name: "Revisar dúvida" }).click();
  let requestStage = "cross-origin";
  await page.route("**/aluno/duvida?*", async (route) => {
    if (
      requestStage === "cross-origin" &&
      route.request().method() === "POST"
    ) {
      requestStage = "lose-response";
      const response = await route.fetch({
        headers: {
          ...route.request().headers(),
          origin: "https://invalid.example",
        },
      });
      await route.fulfill({ response });
    } else if (
      requestStage === "lose-response" &&
      route.request().method() === "POST"
    ) {
      requestStage = "continue";
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Confirmar inscrição", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  expect((await database.doc(`sessions/${source}`).get()).exists).toBe(false);
  await page
    .getByRole("button", { name: "Confirmar inscrição", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "conexão falhou",
  );
  await expect(
    page.getByText("Como controlar a repetição no meu algoritmo?", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar inscrição", exact: true })
    .click();
  await expect(page).toHaveURL(/\/aluno\/agenda$/);
  await page.unroute("**/aluno/duvida?*");
  await expect(page.getByText("Sua inscrição está confirmada.")).toBeVisible();
  expect(
    (await database.doc(`sessions/${source}`).get()).get("enrolledCount"),
  ).toBe(1);
  expect(
    (
      await database
        .doc(`sessions/${source}/registrations/${student.uid}`)
        .get()
    ).get("version"),
  ).toBe(1);
  await page.reload();
  await expect(page.getByText("1/10 inscritos", { exact: true })).toBeVisible();
  await page.getByText("Ver minha dúvida", { exact: true }).click();
  await expect(
    page.getByText("Como controlar a repetição no meu algoritmo?", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("agenda-aluno.png"),
    fullPage: true,
    style: "nextjs-portal { display: none; }",
  });

  await page.getByRole("link", { name: "Editar dúvida", exact: true }).click();
  await expect(page.getByLabel("Sua dúvida", { exact: true })).toHaveValue(
    "Como controlar a repetição no meu algoritmo?",
  );
  await page
    .getByLabel("Sua dúvida", { exact: true })
    .fill("Dúvida revisada: por que o contador não avança?");
  await page.getByRole("button", { name: "Revisar dúvida" }).click();
  await page
    .getByRole("button", { name: "Salvar dúvida", exact: true })
    .click();
  await expect(page).toHaveURL(/\/aluno\/agenda$/);
  await expect(page.getByText("Sua inscrição está confirmada.")).toBeVisible();
  await page.getByLabel("Trocar sessão", { exact: true }).selectOption(target);
  await page
    .getByRole("button", { name: "Confirmar troca", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveAccessibleName(
    `Sessão de ${sessionLabel(target)}`,
  );
  await expect(page.getByText("Sua inscrição está confirmada.")).toBeVisible();
  expect(
    (await database.doc(`sessions/${source}`).get()).get("enrolledCount"),
  ).toBe(0);
  expect(
    (
      await database
        .doc(`sessions/${target}/registrations/${student.uid}`)
        .get()
    ).get("helpRequest.description"),
  ).toBe("Dúvida revisada: por que o contador não avança?");
  await page
    .getByRole("button", { name: "Cancelar inscrição", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar cancelamento", exact: true })
    .click();
  await expect(
    page.getByText("Inscrição cancelada.", { exact: false }),
  ).toBeVisible();
  expect(
    (await database.doc(`sessions/${target}`).get()).get("enrolledCount"),
  ).toBe(0);
  await book(page, target);

  const monitorContext = await browser.newContext({
    viewport: page.viewportSize() ?? undefined,
  });
  const monitorPage = await monitorContext.newPage();
  try {
    const monitorEmail = `agenda.monitor.${randomUUID()}@example.test`;
    await monitorPage.goto("http://127.0.0.1:3101/entrar");
    await googlePopup(monitorPage, monitorEmail);
    await expect(monitorPage).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    const monitor = await auth.getUserByEmail(monitorEmail);
    await auth.setCustomUserClaims(monitor.uid, { monitor: true });
    await monitorPage.getByRole("button", { name: "Sair da conta" }).click();
    await expect(monitorPage).toHaveURL(/\/$/);
    await monitorPage.goto("http://127.0.0.1:3101/entrar");
    await googlePopup(monitorPage, monitorEmail);
    await expect(monitorPage).toHaveURL(/\/monitor$/, { timeout: 25_000 });
    await expect(
      monitorPage.getByRole("heading", { name: "Acesso de monitor ativo." }),
    ).toBeVisible();
    await openMonitorNavigation(monitorPage);
    await monitorPage
      .getByRole("link", { name: "Agenda", exact: true })
      .click();
    if (target.slice(0, 7) !== slots[0].slice(0, 7))
      await monitorPage.getByRole("button", { name: "Próximo mês" }).click();
    await monitorPage
      .getByRole("button", { name: new RegExp(`^${sessionLabel(target)} —`) })
      .click();
    await expect(
      monitorPage.getByText("1/10 inscritos", { exact: true }),
    ).toBeVisible();
    await monitorPage.screenshot({
      path: info.outputPath("agenda-monitor.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    await monitorPage
      .getByRole("button", { name: "Cancelar sessão", exact: true })
      .click();
    await monitorPage
      .getByLabel("Motivo do cancelamento")
      .fill("Laboratório L7 em manutenção.");
    await monitorPage.setViewportSize({ width: 320, height: 800 });
    expect(
      await monitorPage.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await monitorPage
      .getByRole("button", {
        name: "Confirmar cancelamento da sessão",
        exact: true,
      })
      .click();
    await expect(
      monitorPage.getByText("Sessão cancelada.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Laboratório L7 em manutenção.", { exact: false }),
    ).toBeVisible();
    await page.setViewportSize({ width: 320, height: 800 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await expect(
      page.getByText("0/10 inscritos", { exact: true }),
    ).toBeVisible();
  } finally {
    await monitorContext.close();
    for (const id of [source, target])
      await database.recursiveDelete(database.doc(`sessions/${id}`));
  }
});
