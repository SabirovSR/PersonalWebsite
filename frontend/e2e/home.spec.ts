import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully and shows hero section', async ({ page }) => {
    await expect(page).toHaveTitle(/sabirov\.tech/i);
    
    // Hero section should be visible
    await expect(page.getByText('Привет, я')).toBeVisible();
    await expect(page.getByText('Савелий Сабиров')).toBeVisible();
  });

  test('displays navigation menu', async ({ page }) => {
    await expect(page.getByText('sabirov.tech')).toBeVisible();
    await expect(page.getByText('обо мне')).toBeVisible();
    await expect(page.getByText('навыки')).toBeVisible();
    await expect(page.getByText('опыт')).toBeVisible();
    await expect(page.getByText('проекты')).toBeVisible();
    await expect(page.getByText('контакты')).toBeVisible();
  });

  test('shows online status badge', async ({ page }) => {
    await expect(page.getByText('Онлайн')).toBeVisible();
  });

  test('displays avatar image', async ({ page }) => {
    const avatar = page.getByAltText('Сабиров Савелий');
    await expect(avatar).toBeVisible();
  });

  test('has CTA buttons with correct links', async ({ page }) => {
    const contactButton = page.getByRole('link', { name: /Связаться/i });
    const projectsButton = page.getByRole('link', { name: /Смотреть проекты/i });
    
    await expect(contactButton).toBeVisible();
    await expect(contactButton).toHaveAttribute('href', '#contact');
    
    await expect(projectsButton).toBeVisible();
    await expect(projectsButton).toHaveAttribute('href', '#projects');
  });

  test('all main sections are present', async ({ page }) => {
    // Scroll through page and check sections
    const sections = ['hero', 'about', 'skills', 'experience', 'projects', 'contact'];
    
    for (const sectionId of sections) {
      const section = page.locator(`#${sectionId}`);
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
    }
  });

  test('typing animation in hero section works', async ({ page }) => {
    const subtitle = page.locator('text=/Software Developer/');
    
    // Wait for animation to complete
    await expect(subtitle).toBeVisible({ timeout: 5000 });
  });

  test('page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu button is visible
    const mobileMenuButton = page.getByRole('button', { name: /Меню/i });
    await expect(mobileMenuButton).toBeVisible();
    
    // Hero section should still be visible
    await expect(page.getByText('Савелий Сабиров')).toBeVisible();
  });

  test('theme toggle button is visible', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Переключить тему/i });
    await expect(themeToggle).toBeVisible();
  });

  test('footer is present at bottom', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Footer should be visible
    await expect(page.locator('footer')).toBeVisible();
  });
});
