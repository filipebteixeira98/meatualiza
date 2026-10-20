import { expect, test } from "@playwright/test";

test("apresenta a monitoria e os assuntos aprovados", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/meatualiza.*Lógica de Programação/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Destrave sua lógica.",
  );
  await expect(
    page.getByRole("heading", { name: "Segunda-feira", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quarta-feira", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("11h30–12h30", { exact: true })).toHaveCount(2);
  await expect(page.locator("#conteudos").getByRole("listitem")).toHaveCount(9);
  await expect(page.locator("#conteudos")).toContainText(
    "Outro assunto / não sei classificar",
  );
  await expect(
    page.getByText("SENAI Dendezeiros", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Laboratório de informática L7", { exact: true }),
  ).toBeVisible();
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

test("leva ao estado real do acesso e permite voltar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Acessar plataforma" }).last().click();
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Estamos preparando",
  );
  await expect(
    page.getByText("O acesso à plataforma ainda não está disponível.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar para a monitoria" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Destrave sua lógica.",
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
    .getByRole("link", { name: "Conteúdos" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL(/#conteudos$/);
});

test("não cria rolagem horizontal em telas pequenas e grandes", async ({
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
});
