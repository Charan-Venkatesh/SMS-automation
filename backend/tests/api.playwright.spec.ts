import { test, expect } from '@playwright/test';

test('backend health check API', async ({ request }) => {
  const response = await request.get('http://localhost:3000/health');
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json).toHaveProperty('status');
});
