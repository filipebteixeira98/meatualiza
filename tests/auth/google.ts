import type { Page } from "@playwright/test";

export async function googlePopup(page: Page, email: string) {
  const opened = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Entrar com Google" }).click();
  const popup = await opened;
  await popup.waitForLoadState("domcontentloaded");
  const addAccount = popup.getByRole("button", { name: /add new account/i });
  if (await addAccount.isVisible()) await addAccount.click();
  await popup.getByLabel(/email/i).fill(email);
  await popup.getByLabel(/display name/i).fill("Aluno Monitoria");
  await popup.getByRole("button", { name: /sign in/i }).click();
}
