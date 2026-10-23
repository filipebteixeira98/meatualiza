import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { googlePopup } from "./google";
import { upcomingSessions } from "../../src/lib/schedule";
const available = upcomingSessions().at(-1)?.id;
test.skip(
  !available,
  "Período da monitoria encerrado; o contrato continua coberto pelos testes de domínio.",
);

test.setTimeout(60_000);

test("aluno prepara, valida, revisa e edita a dúvida sem enviá-la", async ({
  page,
}, info) => {
  await page.goto("/aluno/duvida");
  await expect(page).toHaveURL(/\/entrar$/);
  await googlePopup(page, `duvida.${randomUUID()}@example.test`);
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
  await page.getByRole("link", { name: "Preparar minha dúvida" }).click();
  await expect(page).toHaveURL(/\/aluno\/duvida$/);

  await page
    .getByLabel("Sessão de monitoria", { exact: true })
    .selectOption(available!);
  const topic = page.getByLabel("Assunto", { exact: true });
  const description = page.getByLabel("Sua dúvida", { exact: true });
  const review = page.getByRole("button", { name: "Revisar dúvida" });
  await review.click();
  await expect(topic).toBeFocused();
  await expect(topic).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(2);
  await topic.selectOption("repeticao");
  await description.fill("  \n ");
  await review.click();
  await expect(description).toBeFocused();
  await expect(
    page.getByText("Descreva sua dúvida.", { exact: true }),
  ).toBeVisible();

  const doubt =
    "Meu laço não termina.\nComo atualizar o contador e testar a condição de parada?";
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.postData()?.includes("Meu laço não termina")) {
      sent.push(request.url());
    }
  });
  await description.fill(`  ${doubt}  `);
  await expect(page.locator("#description-count")).toHaveText(
    `${doubt.length + 4} / 2000 caracteres`,
  );
  await page.screenshot({
    path: info.outputPath("duvida.png"),
    fullPage: true,
    style: "nextjs-portal { display: none; }",
  });
  await review.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Confira sua dúvida." }),
  ).toBeFocused();
  await expect(page.getByRole("definition").nth(1)).toHaveText(
    "Estruturas de repetição",
  );
  await expect(page.getByRole("definition").nth(2)).toHaveText(doubt);
  await expect(
    page.getByText(/Sua inscrição só será confirmada/),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("revisao.png"),
    fullPage: true,
    style: "nextjs-portal { display: none; }",
  });
  await page.getByRole("button", { name: "Editar dúvida" }).click();
  await expect(description).toBeFocused();
  await expect(description).toHaveValue(`  ${doubt}  `);
  await expect(topic).toHaveValue("repeticao");

  const code =
    "<script>window.doubtExecuted = true</script>\n" + "x".repeat(300);
  await description.fill(code);
  await review.click();
  await expect(page.getByRole("definition").nth(2)).toHaveText(code);
  expect(await page.evaluate(() => "doubtExecuted" in window)).toBe(false);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(sent).toEqual([]);
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("Meu laço não termina");

  await page.reload();
  await expect(description).toHaveValue("");
  await expect(topic).toHaveValue("");
});

test("opção livre, limite da descrição e saída da página protegida", async ({
  page,
}) => {
  await page.goto("/entrar");
  await googlePopup(page, `outro.${randomUUID()}@example.test`);
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
  await page.getByRole("link", { name: "Preparar minha dúvida" }).click();
  await page
    .getByLabel("Sessão de monitoria", { exact: true })
    .selectOption(available!);
  const topic = page.getByLabel("Assunto", { exact: true });
  const description = page.getByLabel("Sua dúvida", { exact: true });
  await expect(topic.getByRole("option")).toHaveCount(11);
  await topic.selectOption("outro");
  await description.fill("a".repeat(2000));
  await expect(page.locator("#description-count")).toHaveText(
    "2000 / 2000 caracteres",
  );
  await description.press("End");
  await description.press("b");
  await expect(description).toHaveValue("a".repeat(2000));
  await page.getByRole("button", { name: "Revisar dúvida" }).click();
  await expect(page.getByRole("definition").nth(1)).toHaveText(
    "Outro assunto / não sei classificar",
  );
  let release!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/**/*.js", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: "commit" });
    await expect(description).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Revisar dúvida" }),
    ).toBeDisabled();
  } finally {
    release();
  }
  await expect(description).toBeEnabled();
  await expect(description).toHaveValue("");
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/aluno/duvida");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole("textbox", { name: "Sua dúvida" })).toHaveCount(
    0,
  );
});
