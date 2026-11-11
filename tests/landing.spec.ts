import { expect, test } from "@playwright/test";

test("apresenta a monitoria e os assuntos aprovados", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/meatualiza.*Lógica de Programação/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Deu um nó",
  );
  await expect(
    page.getByRole("heading", { name: "Segunda-feira", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quarta-feira", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("11h30–12h30", { exact: true })).toHaveCount(2);
  const topics = page.locator("#conteudos");
  const disclosure = topics.getByRole("button", {
    name: "Explorar os 9 assuntos",
  });
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await expect(topics.getByRole("list")).not.toBeVisible();
  await disclosure.click();
  await expect(topics.getByRole("listitem")).toHaveCount(9);
  await expect(
    topics.getByText("Teste de mesa e depuração", { exact: true }),
  ).toBeVisible();
  await disclosure.click();
  await expect(topics.getByRole("list")).not.toBeVisible();
  await expect(page.locator("#conteudos")).toContainText(
    "Outro assunto / não sei classificar",
  );
  await expect(
    page.getByText("SENAI Dendezeiros", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Laboratório de informática L7", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: testInfo.outputPath("landing.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("abre as perguntas frequentes por teclado", async ({ page }) => {
  await page.goto("/#perguntas");
  const question = page.getByRole("button", {
    name: "Onde e quando acontecem os encontros?",
  });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("region", { name: "Onde e quando acontecem os encontros?" }),
  ).toContainText("até 10 alunos");
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "false");
});

test("permite pular a navegação pelo teclado", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("leva ao estado real do acesso e permite voltar", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Acessar plataforma" }).last().click();
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Vamos continuar?",
  );
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  await expect(
    page.getByText(/SENAI|Laboratório|Segundas e quartas/),
  ).toHaveCount(0);
  const illustration = page.locator('img[src*="sign-in-illustration"]');
  if (info.project.name === "desktop") {
    await expect(illustration).toBeVisible();
    await expect
      .poll(() =>
        illustration.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  } else {
    await expect(illustration).toBeHidden();
  }
  await expect(
    page.getByRole("button", { name: "Entrar com Google" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar com Google" }).locator("img"),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("button", { name: "Entrar com Google" })
        .locator("img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: info.outputPath("entrar.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  await page.getByRole("link", { name: "Voltar para a monitoria" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Deu um nó",
  );
});

test("menu móvel navega e devolve o foco ao fechar", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Interação específica do menu móvel");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Navegação móvel" })
    .getByRole("link", { name: "Assuntos" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL(/#conteudos$/);
});

test("mantém a landing responsiva e o acesso centralizado sem rolagem", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Larguras verificadas em um único projeto");
  await page.goto("/");
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow, `Overflow horizontal na largura ${width}`).toBe(false);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("button", { name: "Explorar os 9 assuntos" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  await page.goto("/entrar");
  for (const [width, height] of [
    [320, 480],
    [320, 568],
    [393, 851],
    [768, 1024],
    [844, 390],
    [1024, 390],
    [1024, 768],
    [1366, 768],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(
        () =>
          page.evaluate(() => ({
            horizontal: document.documentElement.scrollWidth > innerWidth,
            vertical: document.documentElement.scrollHeight > innerHeight,
          })),
        { message: `Rolagem no acesso em ${width} × ${height}` },
      )
      .toEqual({ horizontal: false, vertical: false });
    await expect(
      page.getByRole("button", { name: "Entrar com Google" }),
    ).toBeInViewport();
    await expect(
      page.getByRole("link", { name: "Voltar para a monitoria" }),
    ).toBeInViewport();
    const centerOffset = await page.getByRole("main").evaluate((main) => {
      const bounds = main.getBoundingClientRect();
      const form = main.querySelector("section")!.getBoundingClientRect();
      return Math.abs(
        form.top + form.height / 2 - (bounds.top + bounds.height / 2),
      );
    });
    expect(centerOffset, `Centralização em ${width} × ${height}`).toBeLessThan(
      1,
    );
  }
});
