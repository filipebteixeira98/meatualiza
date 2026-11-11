import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { googlePopup } from "./google";
import { openAccount, openNavigation, signOut } from "./workspace";

test.setTimeout(60_000);

test("entrada só fica disponível após os scripts tornarem a página interativa", async ({
  page,
}) => {
  let release!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/**/*.js", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto("/entrar", { waitUntil: "commit" });
    await expect(
      page.getByRole("button", { name: "Entrar com Google" }),
    ).toBeDisabled();
  } finally {
    release();
  }
  await expect(
    page.getByRole("button", { name: "Entrar com Google" }),
  ).toBeEnabled();
});

test("Google, perfil persistido, recarga e saída", async ({
  page,
  context,
}, info) => {
  const email = `aluno.${info.project.name}.${randomUUID()}@example.test`;
  await page.goto("/");
  await page.goto("/entrar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Seu lugar no L7.",
  );
  await expect(
    page.getByRole("button", { name: "Entrar com Google" }),
  ).toBeEnabled();
  await page.screenshot({
    path: info.outputPath("entrar.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
    style: "nextjs-portal { display: none; }",
  });
  await googlePopup(page, email);
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
  await expect(
    page.getByRole("heading", { name: "Nenhuma inscrição confirmada." }),
  ).toBeVisible();
  await openAccount(page, "aluno");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Abrir menu da conta" }),
  ).toContainText("Aluno Monitoria");
  await page.keyboard.press("Escape");
  const cookie = (await context.cookies()).find(
    (item) => item.name === "meatualiza_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "meatualiza_session",
  );
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("firebase:authUser"),
      ),
    ),
  ).toEqual([]);
  const response = await page.reload();
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await openAccount(page, "aluno");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Abrir menu da conta" }),
  ).toContainText("Aluno Monitoria");
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: info.outputPath("aluno.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
    style: "nextjs-portal { display: none; }",
  });
  await openNavigation(page, "aluno");
  await expect(
    page.getByRole("link", { name: "Painel", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Agenda", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/aluno\/agenda$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openNavigation(page, "aluno");
  await expect(
    page.getByRole("link", { name: "Agenda", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Painel", exact: true }).click();
  await expect(page).toHaveURL(/\/aluno$/);
  await page.setViewportSize({ width: 320, height: 800 });
  await openNavigation(page, "aluno");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Abrir navegação do aluno" }),
  ).toBeFocused();
  await page.goto("/monitor/agenda");
  await expect(page).toHaveURL(/\/aluno\/agenda$/);
  await page.goto("/monitor");
  await expect(page).toHaveURL(/\/aluno$/);
  await expect(page.getByText("Acesso de monitor ativo.")).toHaveCount(0);
  await signOut(page, "aluno");
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  expect(
    (await context.cookies()).find(
      (item) => item.name === "meatualiza_session",
    ),
  ).toBeUndefined();
  await page.goBack();
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByText(email, { exact: true })).toHaveCount(0);
  await page.goto("/aluno");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("cancelar o Google pelo teclado permite tentar novamente", async ({
  page,
}) => {
  await page.goto("/entrar");
  const button = page.getByRole("button", { name: "Entrar com Google" });
  await expect(button).toBeEnabled();
  await button.focus();
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  const popup = await opened;
  await expect(
    page.getByRole("button", { name: "Abrindo Google…" }),
  ).toBeDisabled();
  await popup.close();
  const notice = page.getByRole("main").getByRole("alert");
  await expect(notice).toContainText("A entrada foi cancelada", {
    timeout: 20_000,
  });
  await expect(notice).toBeFocused();
  await expect(button).toBeEnabled();
  await googlePopup(page, `retry.${randomUUID()}@example.test`);
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
});

test("falhas de entrada e saída preservam o estado e permitem nova tentativa", async ({
  page,
  context,
}) => {
  await page.goto("/entrar");
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Serviço indisponível. Tente novamente.",
      }),
    }),
  );
  const email = `failure.${randomUUID()}@example.test`;
  await googlePopup(page, email);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Serviço indisponível",
  );
  await expect(page.getByRole("main").getByRole("alert")).toBeFocused();
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "meatualiza_session",
    ),
  ).toBe(false);
  await page.unroute("**/api/auth/session");
  await googlePopup(page, email);
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });

  await page.route("**/api/auth/session", (route) => route.abort("failed"));
  await signOut(page, "aluno");
  await expect(page.getByRole("alert")).toContainText(
    "Sua sessão continua ativa",
  );
  await expect(page.getByRole("alert")).toBeFocused();
  await page.reload();
  await openAccount(page, "aluno");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.unroute("**/api/auth/session");
  await page.getByRole("menuitem", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/aluno");
  await expect(page).toHaveURL(/\/entrar$/);
});
