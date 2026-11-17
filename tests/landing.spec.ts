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
  const agenda = page.getByRole("complementary", {
    name: "Agenda da monitoria",
  });
  await expect(agenda).toContainText("Segundas e quartas · 11h30–12h30");
  await expect(agenda.getByText("11h30–12h30", { exact: true })).toHaveCount(1);
  const topics = page.locator("#conteudos");
  await expect(
    topics.getByRole("list", { name: "Assuntos da monitoria" }),
  ).toBeVisible();
  await expect(topics.getByRole("listitem")).toHaveCount(9);
  await expect(
    topics.getByRole("button", {
      name: "Teste de mesa e depuração",
      exact: true,
    }),
  ).toBeVisible();
  await expect(topics.getByRole("button")).toHaveCount(9);
  await expect(page.locator("#conteudos")).toContainText(
    "Outro assunto / não sei classificar",
  );
  await expect(
    agenda.getByText("SENAI Dendezeiros", { exact: true }),
  ).toBeVisible();
  await expect(
    agenda.getByText("Laboratório de informática L7", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect
    .poll(() =>
      page
        .locator('img[src*="untangle"]')
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("landing.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("revela os assuntos por hover, teclado e toque", async ({
  page,
  isMobile,
}, info) => {
  await page.goto("/#conteudos");
  const topics = page.locator("#conteudos");
  const first = topics.getByRole("button", {
    name: "Algoritmos e representação",
    exact: true,
  });
  const second = topics.getByRole("button", {
    name: "Variáveis e tipos",
    exact: true,
  });
  const label = page.getByRole("tooltip");
  await expect(label).toHaveCount(0);
  if (isMobile) await first.tap();
  else await first.hover();
  await expect(label).toHaveText("Algoritmos e representação");
  await expect(page.locator('[data-slot="topic-tooltip"]')).toBeVisible();
  if (!isMobile) {
    await page.locator('[data-slot="topic-tooltip"]').hover();
    await expect(label).toHaveText("Algoritmos e representação");
  }
  await topics.screenshot({
    path: info.outputPath("topics.png"),
    scale: "css",
    animations: "disabled",
  });
  if (isMobile) await second.tap();
  else {
    await second.hover();
    const bounds = (await second.boundingBox())!;
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 1,
      bounds.y + bounds.height / 2,
    );
  }
  await expect(label).toHaveCount(1);
  await expect(label).toHaveText("Variáveis e tipos");
  await topics.getByRole("heading", { level: 2 }).click();
  await expect(label).toHaveCount(0);

  await first.focus();
  await expect(label).toHaveText("Algoritmos e representação");
  await page.keyboard.press("Escape");
  await expect(label).toHaveCount(0);
  await expect(first).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(second).toBeFocused();
  await expect(label).toHaveText("Variáveis e tipos");
});

test("navega no carrossel por botões, teclado e rolagem", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", {
    name: "Imagens para destravar a lógica",
  });
  const track = carousel.getByRole("group", { name: "Galeria de imagens" });
  const currentSlide = carousel.getByRole("group", {
    name: /^Imagem \d de 3$/,
  });
  const previous = carousel.getByRole("button", { name: "Imagem anterior" });
  const next = carousel.getByRole("button", { name: "Próxima imagem" });
  await carousel.scrollIntoViewIfNeeded();
  await expect(previous).toBeDisabled();
  await expect(currentSlide.getByText("Desate a dúvida.")).toBeVisible();

  await next.click();
  await expect(currentSlide.getByText("Conecte as ideias.")).toBeVisible();
  await track.focus();
  await page.keyboard.press("ArrowRight");
  await expect(currentSlide.getByText("Um passo adiante.")).toBeVisible();
  await expect(next).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(currentSlide.getByText("Conecte as ideias.")).toBeVisible();
  await previous.click();
  await expect(previous).toBeDisabled();
  await expect
    .poll(() => track.evaluate((element) => element.scrollLeft))
    .toBe(0);

  await track.evaluate((element) => {
    element.scrollTo({ left: element.clientWidth * 2, behavior: "instant" });
  });
  await expect(currentSlide.getByText("Um passo adiante.")).toBeVisible();
  await expect(currentSlide).toBeInViewport({ ratio: 0.98 });
  await expect(carousel.getByRole("img")).toHaveCount(1);
  await expect
    .poll(() =>
      currentSlide
        .getByRole("img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(track).toHaveCSS("scroll-behavior", "auto");
  await track.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(currentSlide.getByText("Conecte as ideias.")).toBeVisible();
});

test("seleciona imagens pelos dots com mouse e teclado", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", {
    name: "Imagens para destravar a lógica",
  });
  const dots = carousel
    .getByRole("group", { name: "Escolher imagem" })
    .getByRole("button");
  const currentSlide = carousel.getByRole("group", {
    name: /^Imagem \d de 3$/,
  });
  await expect(dots).toHaveCount(3);
  await expect(dots.first()).toHaveAttribute("aria-current", "true");
  await expect(carousel.getByText(/^\d \/ \d$/)).toHaveCount(0);

  await dots.last().click();
  await expect(currentSlide).toHaveAccessibleName("Imagem 3 de 3");
  await expect(currentSlide).toBeInViewport({ ratio: 0.98 });
  await expect(dots.last()).toHaveAttribute("aria-current", "true");
  await expect(dots.first()).not.toHaveAttribute("aria-current");
  await expect(
    carousel.getByRole("button", { name: "Iniciar avanço automático" }),
  ).toBeEnabled();

  await dots.first().focus();
  await page.keyboard.press("Enter");
  await expect(currentSlide).toHaveAccessibleName("Imagem 1 de 3");
  await expect(currentSlide).toBeInViewport({ ratio: 0.98 });
  await expect(dots.first()).toHaveAttribute("aria-current", "true");
  await expect(dots.last()).not.toHaveAttribute("aria-current");
});

test("avança automaticamente a cada cinco segundos e permite pausar", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const carousel = page.getByRole("region", {
    name: "Imagens para destravar a lógica",
  });
  const currentSlide = carousel.getByRole("group", {
    name: /^Imagem \d de 3$/,
  });
  await expect(
    carousel.getByRole("button", { name: "Pausar avanço automático" }),
  ).toBeEnabled();

  for (const index of [2, 3, 1]) {
    await page.clock.fastForward(5_000);
    await expect(currentSlide).toHaveAccessibleName(`Imagem ${index} de 3`);
    await expect(currentSlide).toBeInViewport({ ratio: 0.98 });
    await expect(
      carousel.getByRole("button", {
        name: new RegExp(`^Mostrar imagem ${index}:`),
      }),
    ).toHaveAttribute("aria-current", "true");
  }
  await carousel
    .getByRole("button", { name: "Pausar avanço automático" })
    .click();
  await page.mouse.move(0, 0);
  await expect(
    carousel.getByRole("button", { name: "Iniciar avanço automático" }),
  ).toBeEnabled();
  await page.clock.fastForward(15_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 1 de 3");

  await carousel
    .getByRole("button", { name: "Iniciar avanço automático" })
    .click();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(4_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 1 de 3");
  await page.clock.fastForward(1_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 2 de 3");
});

test("pausa ao apontar o mouse e mantém a pausa após interação por teclado", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const carousel = page.getByRole("region", {
    name: "Imagens para destravar a lógica",
  });
  const currentSlide = carousel.getByRole("group", {
    name: /^Imagem \d de 3$/,
  });
  await expect(
    carousel.getByRole("button", { name: "Pausar avanço automático" }),
  ).toBeEnabled();
  await carousel.hover();
  await page.clock.fastForward(15_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 1 de 3");
  await page.mouse.move(0, 0);
  await page.clock.fastForward(5_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 2 de 3");

  await page.keyboard.press("Tab");
  await carousel.getByRole("group", { name: "Galeria de imagens" }).focus();
  await expect(
    carousel.getByRole("button", { name: "Iniciar avanço automático" }),
  ).toBeEnabled();
  await page.getByRole("main").focus();
  await page.clock.fastForward(15_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 2 de 3");
});

test("desativa o avanço automático com movimento reduzido e preserva os controles manuais", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const carousel = page.getByRole("region", {
    name: "Imagens para destravar a lógica",
  });
  const currentSlide = carousel.getByRole("group", {
    name: /^Imagem \d de 3$/,
  });
  const rotation = carousel.getByRole("button", {
    name: "Avanço automático desativado por movimento reduzido",
  });
  await expect(rotation).toBeDisabled();
  await page.clock.fastForward(15_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 1 de 3");
  await carousel.getByRole("button", { name: "Próxima imagem" }).click();
  await expect(currentSlide).toHaveAccessibleName("Imagem 2 de 3");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await carousel
    .getByRole("button", { name: "Iniciar avanço automático" })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(rotation).toBeDisabled();
  await page.clock.fastForward(15_000);
  await expect(currentSlide).toHaveAccessibleName("Imagem 2 de 3");
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
  await page
    .locator("#conteudos")
    .evaluate((section) =>
      section.scrollIntoView({ behavior: "instant", block: "center" }),
    );
  await page
    .locator("#conteudos")
    .getByRole("button", { name: "Teste de mesa e depuração", exact: true })
    .hover();
  await expect(page.getByRole("tooltip")).toHaveText(
    "Teste de mesa e depuração",
  );
  const tooltipBounds = (await page
    .locator('[data-slot="topic-tooltip"]')
    .boundingBox())!;
  expect(tooltipBounds.x).toBeGreaterThanOrEqual(0);
  expect(tooltipBounds.x + tooltipBounds.width).toBeLessThanOrEqual(320);
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
