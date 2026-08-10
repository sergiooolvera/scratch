import { Page, expect } from '@playwright/test';

export interface TestUserCredentials {
  email: string;
  password: string;
}

export const TEST_USERS = {
  alumno: {
    email: 'e2e_alumno@iedch.edu.mx',
    password: 'Password123!',
  },
  profesor: {
    email: 'e2e_profesor@iedch.edu.mx',
    password: 'Password123!',
  },
  admin: {
    email: 'e2e_admin@iedch.edu.mx',
    password: 'Password123!',
  },
};

export async function loginAs(page: Page, user: TestUserCredentials) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  // Esperar a que navegue fuera de /login
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20000 });
}
