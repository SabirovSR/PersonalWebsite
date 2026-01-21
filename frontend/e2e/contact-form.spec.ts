import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Navigate to contact section
    await page.getByRole('link', { name: /контакты/i }).first().click();
    await page.waitForTimeout(500); // Wait for smooth scroll
  });

  test('displays contact form', async ({ page }) => {
    await expect(page.getByText('Давайте общаться!')).toBeVisible();
    await expect(page.getByPlaceholderText(/Как вас зовут/i)).toBeVisible();
    await expect(page.getByPlaceholderText(/Расскажите о вашем проекте/i)).toBeVisible();
  });

  test('displays contact links', async ({ page }) => {
    await expect(page.getByText('contact@sabirov.tech')).toBeVisible();
    await expect(page.getByRole('link', { name: /Telegram/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /GitHub/i })).toBeVisible();
  });

  test('shows channel selection buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Telegram/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Телефон/i })).toBeVisible();
  });

  test('can select multiple contact channels', async ({ page }) => {
    // Telegram is selected by default
    await expect(page.getByPlaceholderText('@username')).toBeVisible();
    
    // Click to add email
    await page.getByRole('button', { name: /Email/i }).click();
    
    // Email input should appear
    await expect(page.getByPlaceholderText('your@email.com')).toBeVisible();
    
    // Both inputs should be visible
    await expect(page.getByPlaceholderText('@username')).toBeVisible();
    await expect(page.getByPlaceholderText('your@email.com')).toBeVisible();
  });

  test('validates required fields on submission', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Отправить сообщение/i });
    await submitButton.click();
    
    // Error message should appear
    await expect(page.getByText(/заполните все обязательные поля/i)).toBeVisible();
  });

  test('validates channel contact information', async ({ page }) => {
    // Fill name and message but not contact
    await page.getByPlaceholderText(/Как вас зовут/i).fill('Test User');
    await page.getByPlaceholderText(/Расскажите о вашем проекте/i).fill('Test message');
    
    // Submit without filling telegram contact
    await page.getByRole('button', { name: /Отправить сообщение/i }).click();
    
    // Error message should appear
    await expect(page.getByText(/укажите контакт для канала/i)).toBeVisible();
  });

  test('successfully submits form with valid data', async ({ page }) => {
    // Mock API response
    await page.route('**/api/public/contact', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'queued',
          message: 'Your message has been received',
          id: 'test-id-123',
        }),
      });
    });
    
    // Fill form
    await page.getByPlaceholderText(/Как вас зовут/i).fill('Иван Петров');
    await page.getByPlaceholderText(/Расскажите о вашем проекте/i).fill('Хочу обсудить проект');
    await page.getByPlaceholderText('@username').fill('@ivanpetrov');
    
    // Submit form
    await page.getByRole('button', { name: /Отправить сообщение/i }).click();
    
    // Success message should appear
    await expect(page.getByText(/Сообщение отправлено/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows loading state during submission', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/public/contact', async (route) => {
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'queued',
          id: 'test-id',
        }),
      });
    });
    
    // Fill and submit form
    await page.getByPlaceholderText(/Как вас зовут/i).fill('Test User');
    await page.getByPlaceholderText(/Расскажите о вашем проекте/i).fill('Test');
    await page.getByPlaceholderText('@username').fill('@test');
    
    await page.getByRole('button', { name: /Отправить сообщение/i }).click();
    
    // Loading state should be visible
    await expect(page.getByText(/Отправка.../i)).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/public/contact', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal server error',
        }),
      });
    });
    
    // Fill and submit form
    await page.getByPlaceholderText(/Как вас зовут/i).fill('Test User');
    await page.getByPlaceholderText(/Расскажите о вашем проекте/i).fill('Test');
    await page.getByPlaceholderText('@username').fill('@test');
    
    await page.getByRole('button', { name: /Отправить сообщение/i }).click();
    
    // Error message should appear
    await expect(page.getByText(/Не удалось отправить/i)).toBeVisible({ timeout: 5000 });
  });

  test('form works on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Form should be visible
    await expect(page.getByPlaceholderText(/Как вас зовут/i)).toBeVisible();
    
    // Can fill fields
    await page.getByPlaceholderText(/Как вас зовут/i).fill('Mobile User');
    await page.getByPlaceholderText(/Расскажите о вашем проекте/i).fill('Mobile test');
    
    // Channel selection works
    await page.getByRole('button', { name: /Email/i }).click();
    await expect(page.getByPlaceholderText('your@email.com')).toBeVisible();
  });

  test('clears form after successful submission', async ({ page }) => {
    // Mock API response
    await page.route('**/api/public/contact', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'queued',
          id: 'test-id',
        }),
      });
    });
    
    const nameInput = page.getByPlaceholderText(/Как вас зовут/i);
    const messageInput = page.getByPlaceholderText(/Расскажите о вашем проекте/i);
    const telegramInput = page.getByPlaceholderText('@username');
    
    // Fill form
    await nameInput.fill('Test User');
    await messageInput.fill('Test message');
    await telegramInput.fill('@testuser');
    
    // Submit
    await page.getByRole('button', { name: /Отправить сообщение/i }).click();
    
    // Wait for success
    await expect(page.getByText(/Сообщение отправлено/i)).toBeVisible({ timeout: 5000 });
    
    // Form should be cleared
    await expect(nameInput).toHaveValue('');
    await expect(messageInput).toHaveValue('');
    await expect(telegramInput).toHaveValue('');
  });
});
