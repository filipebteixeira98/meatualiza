import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    cubeDrawCalls: number;
  }
}

async function watchDraws(page: Page) {
  await page.addInitScript(() => {
    window.cubeDrawCalls = 0;
    const original = WebGL2RenderingContext.prototype.drawArraysInstanced;
    WebGL2RenderingContext.prototype.drawArraysInstanced = function (...args) {
      window.cubeDrawCalls++;
      return original.apply(this, args);
    };
  });
}

async function observeDraws(page: Page) {
  return page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const before = window.cubeDrawCalls;
    const start = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      draws: window.cubeDrawCalls - before,
      elapsed: performance.now() - start,
    };
  });
}

test("o cubo permite interação manual sem animação com movimento reduzido", async ({
  page,
  isMobile,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await watchDraws(page);
  await page.goto("/");
  const cube = page.getByRole("figure", { name: "Cubo mágico interativo" });
  await cube.scrollIntoViewIfNeeded();
  const canvas = cube.getByRole("application");
  await expect(canvas).toBeVisible();
  await expect(cube.getByRole("status")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.cubeDrawCalls))
    .toBeGreaterThan(0);
  await expect(cube.getByRole("button")).toHaveCount(0);
  await expect(cube.locator("details, figcaption")).toHaveCount(0);
  await cube.screenshot({
    path: info.outputPath("cube.png"),
    scale: "css",
    animations: "disabled",
  });

  await canvas.focus();
  expect(
    await canvas.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ),
  ).toBe(true);
  const initial = await canvas.screenshot();
  await page.keyboard.press("ArrowRight");
  const rotated = await canvas.screenshot();
  expect(rotated.equals(initial)).toBe(false);
  await page.keyboard.press("ArrowLeft");
  const beforeDrag = await canvas.screenshot();
  const bounds = (await canvas.boundingBox())!;
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let step = 1; step <= 8; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + step * 9, y: y + step * 3 }],
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 72, y + 24, { steps: 8 });
    await page.mouse.up();
  }
  const afterDrag = await canvas.screenshot();
  expect(afterDrag.equals(beforeDrag)).toBe(false);

  expect((await observeDraws(page)).draws).toBe(0);
  await page.getByRole("link", { name: "Acessar plataforma" }).first().click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.goBack();
  await cube.scrollIntoViewIfNeeded();
  await expect(cube.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("o cubo gira lentamente e pausa por interação e movimento reduzido", async ({
  page,
  isMobile,
}) => {
  // Software WebGL shares CPU with the other parallel browser tests.
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await watchDraws(page);
  await page.setViewportSize({
    width: page.viewportSize()!.width,
    height: 600,
  });
  await page.goto("/");
  const cube = page.getByRole("figure", { name: "Cubo mágico interativo" });
  await cube.scrollIntoViewIfNeeded();
  const canvas = cube.getByRole("application");
  await expect(canvas).toBeVisible();
  await expect(cube.getByRole("status")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.cubeDrawCalls))
    .toBeGreaterThan(0);
  const initial = await canvas.screenshot();
  const motion = await observeDraws(page);
  expect(motion.draws).toBeGreaterThan(0);
  expect(motion.draws).toBeLessThanOrEqual(
    Math.ceil((motion.elapsed / 1000) * 30) + 1,
  );
  expect((await canvas.screenshot()).equals(initial)).toBe(false);

  if (isMobile) await canvas.tap();
  else await canvas.click();
  expect((await observeDraws(page)).draws).toBe(0);
  await canvas.press("Space");
  await canvas.dispatchEvent("keydown", { key: " ", repeat: true });
  expect((await observeDraws(page)).draws).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await observeDraws(page)).draws).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect((await observeDraws(page)).draws).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("pausa a rotação fora da tela, em abas ocultas e ao sair da página", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await watchDraws(page);
  await page.setViewportSize({
    width: page.viewportSize()!.width,
    height: 600,
  });
  await page.goto("/");
  const cube = page.getByRole("figure", { name: "Cubo mágico interativo" });
  await cube.scrollIntoViewIfNeeded();
  await expect(cube.getByRole("application")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cubeDrawCalls))
    .toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect((await observeDraws(page)).draws).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect((await observeDraws(page)).draws).toBeGreaterThan(0);
  await page.locator("#perguntas").scrollIntoViewIfNeeded();
  expect((await observeDraws(page)).draws).toBe(0);
  await cube.scrollIntoViewIfNeeded();
  expect((await observeDraws(page)).draws).toBeGreaterThan(0);
  await page
    .getByRole("link", { name: "Acessar plataforma" })
    .first()
    .evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/entrar$/);
  expect((await observeDraws(page)).draws).toBe(0);
  expect(errors).toEqual([]);
});

test("carrega perto da área visível e trata perda do contexto gráfico", async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const cube = page.getByRole("figure", { name: "Cubo mágico interativo" });
  if (isMobile) await expect(cube.locator("canvas")).toHaveCount(0);
  await cube.scrollIntoViewIfNeeded();
  await expect(cube.getByRole("application")).toBeVisible();
  await expect(cube.getByRole("status")).toHaveCount(0);
  await cube.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    canvas
      .getContext("webgl2")!
      .getExtension("WEBGL_lose_context")!
      .loseContext();
  });
  await expect(cube.getByRole("status")).toHaveText(
    "O cubo 3D está indisponível neste navegador.",
  );
  await expect(cube.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Comece pela sua dúvida" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("preserva o conteúdo da monitoria quando WebGL não está disponível", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...options: unknown[]
    ) {
      if (type === "webgl2") return null;
      return getContext.call(this, type as "2d", ...options);
    } as typeof getContext;
  });
  await page.goto("/#como-funciona");
  const cube = page.getByRole("figure", { name: "Cubo mágico interativo" });
  await expect(cube.getByRole("status")).toHaveText(
    "O cubo 3D está indisponível neste navegador.",
  );
  await expect(
    page.getByRole("heading", { name: "Pratique e avance" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
