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
