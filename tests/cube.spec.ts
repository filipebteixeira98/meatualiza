import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    cubeDrawCalls: number;
  }
}

test("o cubo gira faces, permite embaralhar e reiniciar, e não renderiza ocioso", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.cubeDrawCalls = 0;
    const original = WebGL2RenderingContext.prototype.drawArraysInstanced;
    WebGL2RenderingContext.prototype.drawArraysInstanced = function (...args) {
      window.cubeDrawCalls++;
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  const cube = page.getByRole("figure", { name: "Cubo mágico interativo" });
  await cube.scrollIntoViewIfNeeded();
  const shuffle = cube.getByRole("button", { name: "Embaralhar cubo" });
  const reset = cube.getByRole("button", { name: "Reiniciar cubo" });
  await expect(shuffle).toBeEnabled();
  await expect
    .poll(() => page.evaluate(() => window.cubeDrawCalls))
    .toBeGreaterThan(0);
  const canvas = cube.getByRole("application");
  await expect(cube.getByRole("status")).toHaveText("Cubo organizado.");
  await canvas.focus();
  expect(
    await canvas.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "f",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ),
  ).toBe(true);
  await page.keyboard.press("f");
  await expect(cube.getByRole("status")).toHaveText("Cubo embaralhado.");
  await page.keyboard.press("Shift+f");
  await expect(cube.getByRole("status")).toHaveText("Cubo organizado.");

  const bounds = await canvas.boundingBox();
  await canvas.click({
    position: { x: bounds!.width / 2, y: bounds!.height / 2 },
  });
  await expect(cube.getByRole("status")).toHaveText("Cubo embaralhado.");
  await reset.click();
  await expect(cube.getByRole("status")).toHaveText("Cubo organizado.");
  await page.evaluate(() => {
    Math.random = () => 0.25;
  });
  await shuffle.click();
  await expect(cube.getByRole("status")).toHaveText("Cubo embaralhado.");
  await reset.click();
  await expect(cube.getByRole("status")).toHaveText("Cubo organizado.");

  await cube.locator("summary").click();
  await cube.getByRole("button", { name: "Girar face: Direita" }).click();
  await expect(cube.getByRole("status")).toHaveText("Cubo embaralhado.");
  await reset.click();
  await cube.locator("summary").click();

  const idle = await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const before = window.cubeDrawCalls;
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { before, after: window.cubeDrawCalls };
  });
  expect(idle.after).toBe(idle.before);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await canvas.focus();
  const before = await page.evaluate(() => window.cubeDrawCalls);
  await page.keyboard.press("r");
  await expect(cube.getByRole("status")).toHaveText("Cubo embaralhado.");
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(
    (await page.evaluate(() => window.cubeDrawCalls)) - before,
  ).toBeLessThanOrEqual(1);
  await reset.click();
  await expect(cube.getByRole("status")).toHaveText("Cubo organizado.");
  await cube.screenshot({
    path: info.outputPath("cube.png"),
    scale: "css",
    animations: "disabled",
  });
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
  await expect(
    cube.getByRole("button", { name: "Embaralhar cubo" }),
  ).toBeEnabled();
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
