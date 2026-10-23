import type { Page } from "@playwright/test";

export async function openMonitorNavigation(page: Page) {
  const trigger = page.getByRole("button", {
    name: "Abrir navegação do monitor",
  });
  if (
    (await trigger.isVisible()) &&
    (await trigger.getAttribute("aria-expanded")) !== "true"
  ) {
    await trigger.click();
  }
}

export async function openMonitorAccount(page: Page) {
  await openMonitorNavigation(page);
  await page.getByRole("button", { name: "Abrir menu da conta" }).click();
}
