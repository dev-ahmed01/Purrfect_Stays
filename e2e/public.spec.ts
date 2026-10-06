import { expect, test } from '@playwright/test';

test('public discovery renders live catalogue and property detail', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Travel Across India/i }),
  ).toBeVisible();

  await page.goto('/stays?destination=Goa');
  await expect(
    page.getByRole('heading', { name: /Pet-friendly stays in Goa/i }),
  ).toBeVisible();
  await expect(page.getByText('The Paw Villa').first()).toBeVisible();

  await page.goto('/stays/the-paw-villa');
  await expect(
    page.getByRole('heading', { name: 'The Paw Villa' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Sign in to book/i })).toBeVisible();
});


test('public surfaces keep basic accessibility contracts', async ({ page }) => {
  await page.goto('/');

  const main = page.locator('main#main-content');
  await expect(main).toHaveCount(1);
  await expect(main).toBeVisible();
  await expect(page.getByRole('link', { name: /Skip to content/i })).toHaveCount(1);

  const imagesMissingAlt = await page.locator('img:not([alt])').count();
  expect(imagesMissingAlt).toBe(0);

  const unlabeledFields = await page
    .locator('input:not([type="hidden"]), select, textarea')
    .evaluateAll((elements) =>
      elements.filter((element) => {
        const control = element as HTMLInputElement;
        return (
          control.labels?.length === 0 &&
          !control.getAttribute('aria-label') &&
          !control.getAttribute('aria-labelledby')
        );
      }).length,
    );
  expect(unlabeledFields).toBe(0);

  const unnamedButtons = await page.locator('button').evaluateAll((buttons) =>
    buttons.filter((button) => {
      const text = button.textContent?.trim();
      return (
        !text &&
        !button.getAttribute('aria-label') &&
        !button.getAttribute('aria-labelledby') &&
        !button.getAttribute('title')
      );
    }).length,
  );
  expect(unnamedButtons).toBe(0);
});
