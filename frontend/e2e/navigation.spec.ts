import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navigates to different sections using menu', async ({ page }) => {
    const sections = [
      { link: 'обо мне', id: 'about' },
      { link: 'навыки', id: 'skills' },
      { link: 'опыт', id: 'experience' },
      { link: 'проекты', id: 'projects' },
      { link: 'контакты', id: 'contact' },
    ];
    
    for (const { link, id } of sections) {
      // Click navigation link
      await page.getByRole('link', { name: new RegExp(link, 'i') }).first().click();
      
      // Wait for scroll
      await page.waitForTimeout(500);
      
      // Check if section is in viewport
      const section = page.locator(`#${id}`);
      await expect(section).toBeInViewport();
    }
  });

  test('logo link scrolls to top', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    
    // Click logo
    await page.getByText('sabirov.tech').click();
    
    // Wait for scroll
    await page.waitForTimeout(500);
    
    // Should be at top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });

  test('navigation bar becomes sticky on scroll', async ({ page }) => {
    const nav = page.locator('nav');
    
    // Initially transparent/minimal
    await expect(nav).toBeVisible();
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(200);
    
    // Should have backdrop blur class
    const navClasses = await nav.getAttribute('class');
    expect(navClasses).toContain('backdrop-blur');
  });

  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuButton = page.getByRole('button', { name: /Меню/i });
    const mobileMenu = page.locator('ul').last(); // Mobile menu is last ul
    
    // Initially closed
    await expect(mobileMenu).toHaveClass(/-right-full/);
    
    // Open menu
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Should be open
    await expect(mobileMenu).toHaveClass(/right-0/);
    
    // Close menu
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Should be closed
    await expect(mobileMenu).toHaveClass(/-right-full/);
  });

  test('mobile menu closes when link is clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuButton = page.getByRole('button', { name: /Меню/i });
    const mobileMenu = page.locator('ul').last();
    
    // Open menu
    await menuButton.click();
    await expect(mobileMenu).toHaveClass(/right-0/);
    
    // Click a link
    await page.getByRole('link', { name: /обо мне/i }).last().click();
    
    // Menu should close
    await page.waitForTimeout(500);
    await expect(mobileMenu).toHaveClass(/-right-full/);
  });

  test('theme toggle changes theme', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Переключить тему/i });
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    
    // Click toggle
    await themeToggle.click();
    await page.waitForTimeout(300);
    
    // Theme should change
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });

  test('smooth scrolling works between sections', async ({ page }) => {
    // Click on contact link
    await page.getByRole('link', { name: /контакты/i }).first().click();
    
    // Start checking scroll position
    const initialY = await page.evaluate(() => window.scrollY);
    
    await page.waitForTimeout(100);
    
    const midScrollY = await page.evaluate(() => window.scrollY);
    
    // Should be scrolling (position changed)
    expect(midScrollY).toBeGreaterThan(initialY);
    
    // Wait for scroll to finish
    await page.waitForTimeout(500);
    
    const finalY = await page.evaluate(() => window.scrollY);
    expect(finalY).toBeGreaterThan(midScrollY);
  });

  test('all navigation links are keyboard accessible', async ({ page }) => {
    // Tab through navigation links
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // First nav link
    
    const activeElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(activeElement).toBeTruthy();
    
    // Should be able to activate with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Page should have scrolled
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('navigation is responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Desktop menu should be visible
    await expect(page.getByRole('link', { name: /обо мне/i }).first()).toBeVisible();
    
    // Mobile menu button should not be visible
    const mobileButton = page.getByRole('button', { name: /Меню/i });
    await expect(mobileButton).not.toBeVisible();
  });

  test('navigation works with browser back button', async ({ page }) => {
    // Click to navigate to contact
    await page.getByRole('link', { name: /контакты/i }).first().click();
    await page.waitForTimeout(500);
    
    // URL should update
    expect(page.url()).toContain('#contact');
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Should be at top or previous section
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(500);
  });
});
