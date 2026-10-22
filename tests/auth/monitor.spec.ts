import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { googlePopup } from "./google";

test.setTimeout(60_000);

let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
test.beforeAll(() => {
  expect(process.env.GCLOUD_PROJECT).toBe("demo-meatualiza");
  expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe("127.0.0.1:9099");
  app = initializeApp({ projectId: "demo-meatualiza" });
  auth = getAuth(app);
});
test.afterAll(async () => {
  if (app) await deleteApp(app);
});

async function enterMonitor(page: Page) {
  const email = `monitor.${randomUUID()}@example.test`;
  await page.goto("/entrar");
  await googlePopup(page, email);
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { monitor: true });
  await page.reload();
  await expect(page).toHaveURL(/\/aluno$/);
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/entrar");
  await googlePopup(page, email);
  await expect(page).toHaveURL(/\/monitor$/, { timeout: 25_000 });
  return user;
}

test("monitor tem área própria, recarga, direcionamento e saída", async ({
  page,
  context,
}, info) => {
  await page.goto("/monitor");
  await expect(page).toHaveURL(/\/entrar$/);
  const user = await enterMonitor(page);
  await expect(
    page.getByRole("heading", { name: "Acesso de monitor ativo." }),
  ).toBeVisible();
  await expect(page.getByText(user.email!, { exact: true })).toBeVisible();
  for (const path of ["/entrar", "/aluno", "/aluno/duvida"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/monitor$/);
  }
  await page.goto("/monitor/agenda");
  await expect(page).toHaveURL(/\/monitor\/agenda$/);
  await page.goto("/monitor");
  const response = await page.reload();
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByRole("heading", { name: "Acesso de monitor ativo." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sair da conta" }),
  ).toBeEnabled();
  await page.screenshot({
    path: info.outputPath("monitor.png"),
    fullPage: true,
    style: "nextjs-portal { display: none; }",
  });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "meatualiza_session",
    ),
  ).toBe(false);
  await page.goBack();
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByText(user.email!, { exact: true })).toHaveCount(0);
  await page.goto("/monitor");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("remover privilégio bloqueia o cookie antigo sem depender da revogação", async ({
  page,
}) => {
  const user = await enterMonitor(page);
  await auth.setCustomUserClaims(user.uid, {});
  await page.reload();
  await expect(page).toHaveURL(/\/aluno$/);
  await expect(page.getByText("Acesso de monitor ativo.")).toHaveCount(0);
  await page.goto("/monitor");
  await expect(page).toHaveURL(/\/aluno$/);
});
