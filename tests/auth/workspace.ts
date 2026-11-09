import { expect, type Page } from "@playwright/test";

export async function openNavigation(page: Page, role: "aluno" | "monitor") {
  await expect(
    page.getByRole("banner").getByText(`Área do ${role}`, { exact: true }),
  ).toBeVisible();
  const trigger = page.getByRole("button", {
    name: `Abrir navegação do ${role}`,
  });
  if (
    (await trigger.isVisible()) &&
    (await trigger.getAttribute("aria-expanded")) !== "true"
  ) {
    await trigger.click();
  }
}

export async function openAccount(page: Page, role: "aluno" | "monitor") {
  await openNavigation(page, role);
  await page.getByRole("button", { name: "Abrir menu da conta" }).click();
}

export async function signOut(page: Page, role: "aluno" | "monitor") {
  await openAccount(page, role);
  await page.getByRole("menuitem", { name: "Sair da conta" }).click();
}
