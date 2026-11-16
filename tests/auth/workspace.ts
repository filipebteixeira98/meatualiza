import { expect, type Page, type TestInfo } from "@playwright/test";

export async function openNavigation(page: Page, role: "aluno" | "monitor") {
  await expect(
    page
      .getByRole("navigation", {
        name: `Navegação do ${role}`,
        exact: true,
        includeHidden: true,
      })
      .first(),
  ).toBeAttached();
  const trigger = page.getByRole("button", {
    name: `Abrir navegação do ${role}`,
  });
  if (
    (await trigger.isVisible()) &&
    (await trigger.getAttribute("aria-expanded")) !== "true"
  ) {
    await trigger.click();
  }
  await expect(
    page.getByRole("navigation", { name: `Navegação do ${role}`, exact: true }),
  ).toBeVisible();
}

export async function openAccount(page: Page, role: "aluno" | "monitor") {
  await openNavigation(page, role);
  await page.getByRole("button", { name: "Abrir menu da conta" }).click();
}

export async function checkCollapsibleSidebar(
  page: Page,
  role: "aluno" | "monitor",
  info: TestInfo,
) {
  const viewport = page.viewportSize()!;
  const sidebar = page.getByRole("complementary", {
    name: `Área do ${role}`,
    exact: true,
  });
  const collapse = page.getByRole("button", {
    name: "Recolher menu lateral",
    exact: true,
  });
  await expect(collapse).toBeEnabled();
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  const originalWidth = await sidebar.evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  const originalLeft = await page
    .getByRole("main")
    .evaluate((element) => element.getBoundingClientRect().left);
  await collapse.focus();
  await page.keyboard.press("Enter");
  const expand = page.getByRole("button", {
    name: "Expandir menu lateral",
    exact: true,
  });
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expect(expand).toBeFocused();
  expect(
    await sidebar.evaluate((element) => element.getBoundingClientRect().width),
  ).toBeLessThan(originalWidth);
  expect(
    await page
      .getByRole("main")
      .evaluate((element) => element.getBoundingClientRect().left),
  ).toBeLessThan(originalLeft);
  const agenda = sidebar.getByRole("link", { name: "Agenda", exact: true });
  await expect(agenda).toHaveAttribute("title", "Agenda");
  await expect(agenda.locator("svg")).toBeVisible();
  await openAccount(page, role);
  await expect(
    page.getByRole("menuitem", { name: "Sair da conta" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    sidebar.getByRole("button", { name: "Abrir menu da conta" }),
  ).toBeFocused();
  await agenda.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/${role}/agenda$`));
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expect(agenda).toHaveAttribute("aria-current", "page");
  await sidebar.getByRole("link", { name: "Painel", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}$`));
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("sidebar-collapsed.png"),
    scale: "css",
    animations: "disabled",
    style: "nextjs-portal { display: none; }",
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await openNavigation(page, role);
  await expect(expand).not.toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: `Navegação do ${role}`, exact: true })
      .getByRole("link", { name: "Agenda", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.keyboard.press("Escape");
  await page.setViewportSize(viewport);
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expand.click();
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  expect(
    await sidebar.evaluate((element) => element.getBoundingClientRect().width),
  ).toBe(originalWidth);
}

export async function signOut(page: Page, role: "aluno" | "monitor") {
  await openAccount(page, role);
  await page.getByRole("menuitem", { name: "Sair da conta" }).click();
}
