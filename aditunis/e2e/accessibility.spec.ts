import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectVisibleFocus(page: import("@playwright/test").Page, name: string) {
  const focused = page.locator(":focus");
  if (name === "Message to speak") await expect(focused).toHaveAttribute("id", "message");
  else await expect(focused).toHaveAccessibleName(name);
  const outlineStyle = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outlineStyle).not.toBe("none");
}

test("foundation has no detectable WCAG A/AA violations and supports keyboard focus", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);

  // Native disabled buttons must be skipped by sequential keyboard navigation.
  for (const name of ["Message to speak", "Load synthetic speech", "Clear"]) {
    await page.keyboard.press("Tab");
    await expectVisibleFocus(page, name);
  }

  // Once text exists, Confirm becomes keyboard-reachable.
  const message = page.getByLabel("Message to speak");
  await message.fill("hello");
  await message.focus();
  await page.keyboard.press("Tab");
  await expectVisibleFocus(page, "Load synthetic speech");
  await page.keyboard.press("Tab");
  await expectVisibleFocus(page, "Confirm");

  // Keyboard confirmation enables Speak; the next Tab reaches it.
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expectVisibleFocus(page, "Speak");

  await page.getByRole("button", { name: "Load synthetic speech" }).click();
  await expect(page.getByRole("status")).toContainText(/low confidence/i);
});
