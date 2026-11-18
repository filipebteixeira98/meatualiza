import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { upcomingSessions, sessionLabel } from "../../src/lib/schedule";
import { googlePopup } from "./google";
import { signOut } from "./workspace";

test.setTimeout(150_000);
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

test("monitor registra comparecimento e realização, recupera resposta perdida e consulta métricas", async ({
  page,
}, info) => {
  const now = Date.now();
  const recent = upcomingSessions(now - 28 * 86_400_000).filter(
    (session) => Date.parse(session.endsAt) < now,
  );
  const session = recent.at(info.project.name === "desktop" ? -1 : -2);
  test.skip(
    !session,
    "Sem sessão encerrada no período aprovado para este viewport.",
  );
  const detail = session!;
  const studentId = `attendance-${randomUUID()}`;
  const otherId = `attendance-${randomUUID()}`;
  const email = `attendance.monitor.${randomUUID()}@example.test`;
  const reference = database.doc(`sessions/${detail.id}`);
  const upcoming = upcomingSessions(now);
  const future =
    upcoming.length >= 6
      ? upcoming.at(info.project.name === "desktop" ? -1 : -2)
      : undefined;
  const futureReference = future ? database.doc(`sessions/${future.id}`) : null;
  const stamp = Timestamp.fromMillis(Date.parse(detail.startsAt) - 60_000);
  await database.recursiveDelete(reference);
  try {
    await reference.set({
      ...detail,
      status: "scheduled",
      enrolledCount: 2,
      cancellationReason: null,
    });
    for (const [uid, name, topic] of [
      [studentId, "Ana Souza", "repeticao"],
      [otherId, "Bruno Lima", "condicionais"],
    ]) {
      await database.doc(`users/${uid}`).set({ displayName: name });
      await reference
        .collection("registrations")
        .doc(uid)
        .set({
          studentId: uid,
          status: "confirmed",
          version: 1,
          helpRequest: {
            topicId: topic,
            description: "Como organizar os passos deste algoritmo?",
          },
          cancellationReason: null,
          lastOperationId: randomUUID(),
          lastOperationHash: "seed",
          createdAt: stamp,
          updatedAt: stamp,
        });
    }
    if (future && futureReference) {
      await futureReference.set({
        ...future,
        status: "scheduled",
        enrolledCount: 2,
        cancellationReason: null,
      });
      for (const [uid, topic] of [
        [studentId, "repeticao"],
        [otherId, "condicionais"],
      ])
        await futureReference
          .collection("registrations")
          .doc(uid)
          .set({
            studentId: uid,
            status: "confirmed",
            version: 1,
            helpRequest: {
              topicId: topic,
              description: "Como preparar o próximo algoritmo?",
            },
            cancellationReason: null,
            lastOperationId: randomUUID(),
            lastOperationHash: "seed",
            createdAt: Timestamp.fromMillis(now - 60_000),
            updatedAt: stamp,
          });
    }
    await page.goto("/entrar");
    await googlePopup(page, email);
    await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    const monitor = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(monitor.uid, { monitor: true });
    await signOut(page, "aluno");
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/entrar");
    await googlePopup(page, email);
    await expect(page).toHaveURL(/\/monitor$/, { timeout: 25_000 });
    await page.goto(`/monitor/agenda?sessao=${detail.id}`);
    await expect(
      page.getByRole("button", { name: "Recentes · 28 dias", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const card = page.getByRole("article", {
      name: `Sessão de ${sessionLabel(detail.id)}`,
      exact: true,
    });
    const attendance = card.getByLabel("Comparecimento de Ana Souza", {
      exact: true,
    });
    await expect(attendance).toHaveValue("unrecorded");
    await expect(
      card.getByLabel("Comparecimento de Bruno Lima", { exact: true }),
    ).toHaveValue("unrecorded");
    let stage = "cross-origin";
    await page.route("**/monitor/agenda?*", async (route) => {
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
    await attendance.selectOption("present");
    await expect(card.getByRole("alert")).toBeVisible();
    expect(
      (await reference.collection("registrations").doc(studentId).get()).get(
        "attendance",
      ),
    ).toBeUndefined();
    await attendance.selectOption("present");
    await expect(card.getByRole("alert")).toContainText("conexão falhou");
    expect(
      (await reference.collection("registrations").doc(studentId).get()).get(
        "attendance",
      ),
    ).toBe("present");
    await attendance.selectOption("present");
    await expect(card.getByRole("alert")).toHaveCount(0);
    await expect(attendance).toHaveValue("present");
    expect(
      (await reference.collection("registrations").doc(studentId).get()).get(
        "version",
      ),
    ).toBe(2);
    await page.unroute("**/monitor/agenda?*");
    await card
      .getByRole("button", { name: "Marcar como realizada", exact: true })
      .click();
    await card
      .getByRole("button", { name: "Confirmar realização", exact: true })
      .click();
    await expect(
      card.getByText("Sessão realizada.", { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByLabel("Comparecimento de Bruno Lima", { exact: true }),
    ).toHaveValue("unrecorded");
    expect((await reference.get()).get("enrolledCount")).toBe(2);
    await page.reload();
    await expect(attendance).toHaveValue("present");
    await page.screenshot({
      path: info.outputPath("attendance.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
    await page.setViewportSize({ width: 320, height: 850 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.goto("/monitor");
    const history = page.getByRole("region", {
      name: "Últimos 28 dias",
      exact: true,
    });
    await expect(
      history
        .locator("div")
        .filter({ has: page.getByText("Presenças", { exact: true }) })
        .locator("dd"),
    ).not.toHaveText("0");
    await expect(
      history
        .locator("div")
        .filter({ has: page.getByText("Sessões realizadas", { exact: true }) })
        .locator("dd"),
    ).not.toHaveText("0");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.setViewportSize(
      info.project.name === "desktop"
        ? { width: 1440, height: 1000 }
        : { width: 393, height: 851 },
    );
    await page.screenshot({
      path: info.outputPath("monitor-metrics.png"),
      fullPage: true,
      style: "nextjs-portal { display: none; }",
    });
  } finally {
    await database.recursiveDelete(reference);
    if (futureReference) await database.recursiveDelete(futureReference);
    for (const uid of [studentId, otherId])
      await database.doc(`users/${uid}`).delete();
  }
});
