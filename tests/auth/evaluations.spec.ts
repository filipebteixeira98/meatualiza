import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { sessionDetails, sessionLabel } from "../../src/lib/schedule";
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

test("aluno avalia uma vez, recupera envio e monitor acompanha resultados e pendências", async ({
  page,
  browser,
}, info) => {
  const ids =
    info.project.name === "desktop"
      ? ["2026-10-12", "2026-10-19"]
      : ["2026-10-14", "2026-10-21"];
  const [first, second] = ids;
  const studentEmail = `evaluation.student.${randomUUID()}@example.test`;
  const otherEmail = `evaluation.other.${randomUUID()}@example.test`;
  const name = `Marina ${info.project.name === "desktop" ? "Souza" : "Lima"}`;
  const description =
    "Como organizar a condição de parada e atualizar o contador?";
  const comment =
    "Consegui identificar o contador, mas ainda preciso praticar o laço.";
  const otherContext = await browser.newContext(info.project.use);
  const other = await otherContext.newPage();
  let studentId = "";
  let otherId = "";
  try {
    await page.goto("/aluno/avaliacoes");
    await expect(page).toHaveURL(/\/entrar$/);
    await googlePopup(page, studentEmail);
    await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    studentId = (await auth.getUserByEmail(studentEmail)).uid;
    await other.goto("http://127.0.0.1:3101/monitor/avaliacoes");
    await expect(other).toHaveURL(/\/entrar$/);
    await googlePopup(other, otherEmail);
    await expect(other).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    otherId = (await auth.getUserByEmail(otherEmail)).uid;
    await database.doc(`users/${studentId}`).update({ displayName: name });
    for (const id of ids) {
      const detail = sessionDetails(id)!;
      const stamp = Timestamp.fromMillis(Date.parse(detail.endsAt));
      const reference = database.doc(`sessions/${id}`);
      await database.recursiveDelete(reference);
      await reference.set({
        ...detail,
        status: "completed",
        enrolledCount: id === first ? 2 : 1,
        cancellationReason: null,
      });
      await reference
        .collection("registrations")
        .doc(studentId)
        .set({
          studentId,
          status: "confirmed",
          attendance: "present",
          version: 1,
          helpRequest: { topicId: "repeticao", description },
          cancellationReason: null,
          lastOperationId: randomUUID(),
          lastOperationHash: "seed",
          createdAt: stamp,
          updatedAt: stamp,
        });
      if (id === first)
        await reference
          .collection("registrations")
          .doc(otherId)
          .set({
            studentId: otherId,
            status: "confirmed",
            attendance: "present",
            version: 1,
            helpRequest: {
              topicId: "condicionais",
              description: "Outra pergunta confidencial",
            },
            cancellationReason: null,
            lastOperationId: randomUUID(),
            lastOperationHash: "seed",
            evaluation: {
              resolution: "resolved",
              comment: "Aprendi a distinguir os dois ramos da condição.",
              helpRequest: {
                topicId: "condicionais",
                description: "Outra pergunta confidencial",
              },
              submittedAt: stamp,
              operationId: randomUUID(),
              operationHash: "seed",
            },
            createdAt: stamp,
            updatedAt: stamp,
          });
    }
    await page.goto("/aluno");
    await expect(
      page.getByRole("region", {
        name: "Avaliações dos atendimentos",
        exact: true,
      }),
    ).toContainText("2 aguardando avaliação");
    await openNavigation(page, "aluno");
    await page.getByRole("link", { name: "Avaliações", exact: true }).click();
    await expect(page).toHaveURL(/\/aluno\/avaliacoes$/);
    await expect(
      page.getByRole("heading", {
        name: "Sua dúvida foi resolvida?",
        exact: true,
      }),
    ).toBeVisible();
    expect(await page.content()).not.toContain("Outra pergunta confidencial");
    expect(await page.content()).not.toContain(
      "Aprendi a distinguir os dois ramos da condição.",
    );
    const card = page.getByRole("article", {
      name: `Atendimento de aluno em ${sessionLabel(first)}`,
      exact: true,
    });
    await card.getByText("Ver dúvida atendida", { exact: true }).click();
    await expect(card.getByText(description, { exact: true })).toBeVisible();
    const choice = card.getByRole("radio", {
      name: "Parcialmente resolvida",
      exact: true,
    });
    await choice.focus();
    await page.keyboard.press("Space");
    await expect(choice).toBeChecked();
    const feedback = card.getByLabel("Comentário (opcional)", { exact: true });
    await expect(feedback).toHaveAttribute("maxlength", "1000");
    await feedback.fill(comment);
    await page.screenshot({
      path: info.outputPath("student-evaluation.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    let stage = "cross-origin";
    await page.route("**/aluno/avaliacoes", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      if (stage === "cross-origin") {
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
    const registration = database.doc(
      `sessions/${first}/registrations/${studentId}`,
    );
    await card
      .getByRole("button", { name: "Enviar avaliação", exact: true })
      .click();
    await expect(card.getByRole("alert")).toBeVisible();
    expect((await registration.get()).get("evaluation")).toBeUndefined();
    await card
      .getByRole("button", { name: "Enviar avaliação", exact: true })
      .click();
    await expect(card.getByRole("alert")).toContainText("conexão falhou");
    await expect(card.getByRole("alert")).toBeFocused();
    expect((await registration.get()).get("evaluation.resolution")).toBe(
      "partial",
    );
    await expect(feedback).toHaveValue(comment);
    await card
      .getByRole("button", { name: "Enviar avaliação", exact: true })
      .click();
    await expect(card.getByRole("form")).toHaveCount(0);
    await expect(
      card.getByText("Parcialmente resolvida", { exact: true }),
    ).toBeVisible();
    expect((await registration.get()).get("version")).toBe(2);
    expect(
      (
        await database
          .collection(`sessions/${first}/registrations/${studentId}/history`)
          .get()
      ).size,
    ).toBe(1);
    await page.unroute("**/aluno/avaliacoes");
    await registration.update({
      helpRequest: {
        topicId: "funcoes-procedimentos",
        description: "Descrição alterada após a avaliação",
      },
    });
    await page.reload();
    await card.getByText("Ver dúvida atendida", { exact: true }).click();
    await expect(card.getByText(description, { exact: true })).toBeVisible();
    await expect(card.getByText(comment, { exact: true })).toBeVisible();
    expect(await card.textContent()).not.toContain(
      "Descrição alterada após a avaliação",
    );
    await page.setViewportSize({ width: 320, height: 850 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.goto("/aluno");
    const summary = page.getByRole("region", {
      name: "Avaliações dos atendimentos",
      exact: true,
    });
    await expect(
      summary.getByText("1 aguardando avaliação · 1 respondida", {
        exact: true,
      }),
    ).toBeVisible();
    const prepare = page.getByRole("link", {
      name: "Preparar minha dúvida",
      exact: true,
    });
    if (await prepare.isVisible()) {
      await prepare.click();
      await expect(page.getByLabel("Assunto", { exact: true })).toBeEnabled();
    }
    await other.goto("http://127.0.0.1:3101/monitor/avaliacoes");
    await expect(other).toHaveURL(/\/aluno\/avaliacoes$/);
    await expect(
      other.getByText("Aprendi a distinguir os dois ramos da condição.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(await other.content()).not.toContain(comment);
    await auth.setCustomUserClaims(otherId, { monitor: true });
    await signOut(other, "aluno");
    await expect(other).toHaveURL(/\/$/);
    await other.goto("http://127.0.0.1:3101/entrar");
    await googlePopup(other, otherEmail);
    await expect(other).toHaveURL(/\/monitor$/, { timeout: 25_000 });
    const resolution = other.getByRole("region", {
      name: "Resolução das dúvidas",
      exact: true,
    });
    await expect(resolution).toContainText(/\b[1-9]\d* avaliações recebidas/);
    await expect(
      resolution
        .locator("div")
        .filter({
          has: other.getByText("Parcialmente resolvida", { exact: true }),
        })
        .locator("dd"),
    ).not.toHaveText("0");
    await other.screenshot({
      path: info.outputPath("monitor-resolution.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    await other
      .getByRole("link", { name: "Ver avaliações", exact: true })
      .click();
    await expect(other).toHaveURL(/\/monitor\/avaliacoes$/);
    const monitorCard = other.getByRole("article", {
      name: `Atendimento de ${name} em ${sessionLabel(first)}`,
      exact: true,
    });
    await expect(
      monitorCard.getByText("Parcialmente resolvida", { exact: true }),
    ).toBeVisible();
    await expect(monitorCard.getByText(comment, { exact: true })).toBeVisible();
    await expect(other.getByRole("form")).toHaveCount(0);
    const pending = other.getByRole("article", {
      name: `Atendimento de ${name} em ${sessionLabel(second)}`,
      exact: true,
    });
    await expect(pending).toContainText("Aguardando avaliação do aluno.");
    await other.screenshot({
      path: info.outputPath("monitor-evaluations.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    await other.setViewportSize({ width: 320, height: 850 });
    expect(
      await other.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  } finally {
    await otherContext.close();
    for (const id of ids)
      await database.recursiveDelete(database.doc(`sessions/${id}`));
    for (const uid of [studentId, otherId].filter(Boolean))
      await database.doc(`users/${uid}`).delete();
  }
});
