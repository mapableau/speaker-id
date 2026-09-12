import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation has no detectable WCAG A/AA violations and supports keyboard focus", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);

  const expected = ["Message to speak", "Load synthetic speech", "Confirm", "Speak", "Clear"];
  for (const name of expected) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    if (name === "Message to speak") await expect(focused).toHaveAttribute("id", "message");
    else await expect(focused).toHaveAccessibleName(name);
    const outlineStyle = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe("none");
  }

  await page.getByRole("button", { name: "Load synthetic speech" }).click();
  await expect(page.getByRole("status")).toContainText(/low confidence/i);
});
