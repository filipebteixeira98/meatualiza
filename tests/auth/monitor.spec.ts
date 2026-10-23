import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { googlePopup } from "./google";
import {
  openMonitorAccount,
  openMonitorNavigation,
} from "./monitor-navigation";

test.setTimeout(90_000);

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
  await expect(
    page.getByRole("heading", { name: "Acesso de monitor ativo." }),
  ).toBeVisible();
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
  await openMonitorAccount(page);
  await expect(page.getByText(user.email!, { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Abrir menu da conta" }),
  ).toBeFocused();
  const mobileTrigger = page.getByRole("button", {
    name: "Abrir navegação do monitor",
  });
  if (await mobileTrigger.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(mobileTrigger).toBeFocused();
  }
  for (const path of ["/entrar", "/aluno", "/aluno/duvida"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/monitor$/);
  }
  await openMonitorNavigation(page);
  await expect(
    page.getByRole("link", { name: "Painel", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Agenda", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/monitor\/agenda$/);
  await expect(
    page.getByRole("heading", { name: "Prepare o próximo encontro." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openMonitorNavigation(page);
  await expect(
    page.getByRole("link", { name: "Agenda", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "Painel", exact: true }),
  ).not.toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Painel", exact: true }).click();
  await expect(page).toHaveURL(/\/monitor$/);
  const response = await page.reload();
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByRole("heading", { name: "Acesso de monitor ativo." }),
  ).toBeVisible();
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
  await openMonitorNavigation(page);
  await page.screenshot({
    path: info.outputPath("monitor-menu-mobile.png"),
    animations: "disabled",
    style: "nextjs-portal { display: none; }",
  });
  await page.getByRole("button", { name: "Abrir menu da conta" }).click();
  await page.route("**/api/auth/session", (route) =>
    route.request().method() === "DELETE"
      ? route.abort("failed")
      : route.continue(),
  );
  await page.getByRole("menuitem", { name: "Sair da conta" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText(
    "Sua sessão continua ativa",
  );
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(page).toHaveURL(/\/monitor$/);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "meatualiza_session",
    ),
  ).toBe(true);
  await page.unroute("**/api/auth/session");
  await page.getByRole("menuitem", { name: "Sair da conta" }).click();
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

test("remover privilégio bloqueia a navegação mesmo com layout persistente e cookie antigo", async ({
  page,
}) => {
  const user = await enterMonitor(page);
  await auth.setCustomUserClaims(user.uid, {});
  await openMonitorNavigation(page);
  await page.getByRole("link", { name: "Agenda", exact: true }).click();
  await expect(page).toHaveURL(/\/aluno\/agenda$/);
  await page.reload();
  await expect(page).toHaveURL(/\/aluno\/agenda$/);
  await expect(page.getByText("Acesso de monitor ativo.")).toHaveCount(0);
  await page.goto("/monitor");
  await expect(page).toHaveURL(/\/aluno$/);
});
