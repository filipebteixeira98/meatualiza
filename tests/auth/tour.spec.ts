import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { googlePopup } from "./google";
import { signOut } from "./workspace";

test.setTimeout(120_000);

test("tour per role supports keyboard, retries, reopening and persisted decisions", async ({
  page,
}, info) => {
  expect(process.env.GCLOUD_PROJECT).toBe("demo-meatualiza");
  expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe("127.0.0.1:9099");
  expect(process.env.FIRESTORE_EMULATOR_HOST).toBe("127.0.0.1:8080");
  const app = initializeApp({ projectId: "demo-meatualiza" });
  try {
    const email = `tour.${randomUUID()}@example.test`;
    await page.goto("/entrar");
    await googlePopup(page, email);
    await expect(page).toHaveURL(/\/aluno$/, { timeout: 25_000 });
    const auth = getAuth(app);
    const { uid } = await auth.getUserByEmail(email);
    const profile = getFirestore(app).doc(`users/${uid}`);
    const invite = page.getByRole("complementary", {
      name: "Convite para o tour",
    });
    const start = invite.getByRole("button", { name: "Iniciar tour" });
    const help = page.getByRole("button", { name: "Ajuda", exact: true });
    const dialog = page.getByRole("dialog");
    const next = dialog.getByRole("button", { name: "Próximo", exact: true });

    await expect(start).toBeEnabled();
    await start.focus();
    await page.keyboard.press("Enter");
    await expect(
      dialog.getByRole("heading", { name: "Acompanhe suas inscrições" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(start).toBeFocused();
    expect((await profile.get()).get("tour")).toBeUndefined();

    await start.press("Enter");
    await next.click();
    await expect(
      dialog.getByRole("heading", { name: "Registre sua dúvida" }),
    ).toBeFocused();
    await expect(
      dialog.getByRole("link", { name: "Abrir Nova inscrição" }),
    ).toHaveAttribute("href", "/aluno/duvida");
    const viewport = page.viewportSize()!;
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 520 });
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: "Acompanhe suas inscrições" }),
    ).toBeFocused();
    await page.setViewportSize(viewport);
    await next.click();
    await page.screenshot({
      path: info.outputPath("student-tour.png"),
      animations: "disabled",
      scale: "css",
      style: "nextjs-portal { display: none; }",
    });

    // Lose the response after the server saves, then retry the same decision.
    let loseResponse = true;
    await page.route("**/aluno", async (route) => {
      if (route.request().method() !== "POST" || !loseResponse)
        return route.continue();
      loseResponse = false;
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    });
    const skip = dialog.getByRole("button", { name: "Pular tour" });
    await skip.click();
    await expect(dialog.getByRole("alert")).toBeFocused();
    expect((await profile.get()).get("tour.student")).toBe("skipped");
    await skip.click();
    await expect(dialog).toHaveCount(0);
    await expect(invite).toHaveCount(0);
    await expect(help).toBeFocused();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(invite).toHaveCount(0);
    await help.click();
    await dialog.getByText("Consultar guia em texto", { exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: "Converse no fórum" }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Rever tour" }).click();
    await next.click();
    await dialog.getByRole("link", { name: "Abrir Nova inscrição" }).click();
    await expect(page).toHaveURL(/\/aluno\/duvida$/);
    await expect(dialog).toHaveCount(0);

    await auth.setCustomUserClaims(uid, { monitor: true });
    await signOut(page, "aluno");
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/entrar");
    await googlePopup(page, email);
    await expect(page).toHaveURL(/\/monitor$/, { timeout: 25_000 });
    await start.click();
    await expect(
      dialog.getByRole("heading", { name: "Acompanhe as demandas" }),
    ).toBeFocused();
    for (let i = 0; i < 4; i++) await next.click();
    await expect(
      dialog.getByRole("heading", { name: "Participe e modere o fórum" }),
    ).toBeFocused();
    await expect(
      dialog.getByRole("link", { name: "Abrir fórum" }),
    ).toHaveAttribute("href", "/monitor/forum");
    await page.screenshot({
      path: info.outputPath("monitor-tour.png"),
      animations: "disabled",
      scale: "css",
      style: "nextjs-portal { display: none; }",
    });
    await dialog.getByRole("button", { name: "Concluir tour" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(help).toBeFocused();
    expect((await profile.get()).get("tour")).toEqual({
      student: "skipped",
      monitor: "completed",
    });
    await page.reload();
    await help.click();
    await expect(invite).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "Rever tour" }),
    ).toBeVisible();
  } finally {
    await deleteApp(app);
  }
});
