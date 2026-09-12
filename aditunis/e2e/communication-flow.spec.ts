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

test("participant controls the final spoken message", async ({ page }) => {
  await page.goto("/");
  const message = page.getByLabel("Message to speak");
  await page.getByRole("button", { name: "Load synthetic speech" }).click();
  await expect(page.getByRole("status")).toContainText(/confidence/i);
  await expect(page.getByRole("button", { name: "Speak" })).toBeDisabled();
  await message.fill("Please call a taxi when I am ready");
  await expect(page.getByRole("button", { name: "Speak" })).toBeDisabled();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("button", { name: "Speak" })).toBeEnabled();
  await page.getByRole("button", { name: "Speak" }).click();
  await expect(page.getByRole("status")).toContainText(/speaking/i);
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(message).toHaveValue("");
  await message.fill("Manual typing still works");
  await expect(message).toHaveValue("Manual typing still works");
});
