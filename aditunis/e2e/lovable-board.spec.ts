import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class FakeUtterance { constructor(public text: string) {} }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance, configurable: true });
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak: () => undefined, cancel: () => undefined }, configurable: true
    });
  });
});

test("Lovable board hands participant-built text to the Aditunis confirmation gate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Board" }).click();
  await expect(page.getByRole("heading", { name: "Communication board" })).toBeVisible();

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations).toEqual([]);

  await page.getByRole("button", { name: "Build sentence" }).click();
  await page.getByRole("button", { name: /I need water, phrase 1/i }).click();
  await page.getByRole("button", { name: /I am hungry, phrase 2/i }).click();
  await expect(page.getByLabel("Sentence being built")).toContainText("I need water I am hungry");
  await page.getByRole("button", { name: "Send to composer" }).click();

  const message = page.getByLabel("Message to speak");
  await expect(message).toHaveValue("I need water I am hungry");
  await expect(page.getByRole("button", { name: "Speak" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(/review and confirm/i);
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("button", { name: "Speak" })).toBeEnabled();
});

test("emergency phrase board remains communication-only", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Board" }).click();
  await page.getByRole("tab", { name: "Emergency" }).click();
  await expect(page.getByText(/do not place an emergency call/i)).toBeVisible();
});
