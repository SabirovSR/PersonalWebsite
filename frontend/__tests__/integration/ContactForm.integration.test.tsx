import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Contact } from '@/components/Contact';

/**
 * Integration test for the complete contact form flow.
 * This simulates a real user interaction from start to finish.
 */
describe('Contact Form Integration', () => {
  beforeEach(() => {
    // Setup fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('completes full contact form submission flow', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'queued',
        message: 'Your message has been received',
        id: 'test-message-id-123',
      }),
    });

    const user = userEvent.setup();
    render(<Contact />);

    // Step 1: User sees the form
    expect(screen.getByText(/Давайте общаться!/i)).toBeInTheDocument();

    // Step 2: User fills in their name
    const nameInput = screen.getByPlaceholderText(/Как вас зовут/i);
    await user.type(nameInput, 'Иван Петров');

    // Step 3: User writes their message
    const messageInput = screen.getByPlaceholderText(/Расскажите о вашем проекте/i);
    await user.type(messageInput, 'Здравствуйте! Хочу обсудить разработку веб-приложения.');

    // Step 4: User selects additional contact methods
    const emailButton = screen.getByRole('button', { name: /Email/i });
    await user.click(emailButton);

    // Step 5: User fills in contact information
    const telegramInput = screen.getByPlaceholderText('@username');
    await user.type(telegramInput, '@ivanpetrov');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('your@email.com');
    await user.type(emailInput, 'ivan@example.com');

    // Step 6: User submits the form
    const submitButton = screen.getByRole('button', { name: /Отправить сообщение/i });
    await user.click(submitButton);

    // Step 7: Loading state is shown
    expect(screen.getByText(/Отправка.../i)).toBeInTheDocument();

    // Step 8: API call is made with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/public/contact',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'api-key': expect.any(String),
          }),
        })
      );
    });

    // Verify request body
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);
    expect(requestBody).toEqual({
      name: 'Иван Петров',
      message: 'Здравствуйте! Хочу обсудить разработку веб-приложения.',
      channels: ['telegram', 'email'],
      contacts: {
        telegram: '@ivanpetrov',
        email: 'ivan@example.com',
      },
    });

    // Step 9: Success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Сообщение отправлено/i)).toBeInTheDocument();
    });

    // Step 10: Form is cleared
    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(messageInput).toHaveValue('');
      expect(telegramInput).toHaveValue('');
    });
  });

  it('handles network error gracefully during submission', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<Contact />);

    // Fill form
    await user.type(screen.getByPlaceholderText(/Как вас зовут/i), 'Test User');
    await user.type(
      screen.getByPlaceholderText(/Расскажите о вашем проекте/i),
      'Test message'
    );
    await user.type(screen.getByPlaceholderText('@username'), '@testuser');

    // Submit
    await user.click(screen.getByRole('button', { name: /Отправить сообщение/i }));

    // Error message should be shown
    await waitFor(() => {
      expect(screen.getByText(/Не удалось отправить/i)).toBeInTheDocument();
    });

    // Form should still contain data (not cleared on error)
    expect(screen.getByPlaceholderText(/Как вас зовут/i)).toHaveValue('Test User');
  });

  it('handles rate limit error with proper message', async () => {
    // Mock rate limit response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        detail: 'Rate limit exceeded. Try again later.',
      }),
    });

    const user = userEvent.setup();
    render(<Contact />);

    // Fill and submit form
    await user.type(screen.getByPlaceholderText(/Как вас зовут/i), 'Test User');
    await user.type(
      screen.getByPlaceholderText(/Расскажите о вашем проекте/i),
      'Test message'
    );
    await user.type(screen.getByPlaceholderText('@username'), '@testuser');
    await user.click(screen.getByRole('button', { name: /Отправить сообщение/i }));

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Не удалось отправить/i)).toBeInTheDocument();
    });
  });

  it('allows user to modify channel selection before submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'queued', id: 'test-id' }),
    });

    const user = userEvent.setup();
    render(<Contact />);

    // Initially telegram is selected
    expect(screen.getByPlaceholderText('@username')).toBeInTheDocument();

    // Add phone channel
    const phoneButton = screen.getByRole('button', { name: /Телефон/i });
    await user.click(phoneButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/\+7 999 123-45-67/i)).toBeInTheDocument();
    });

    // Remove telegram (should work since we have phone now)
    const telegramButton = screen.getByRole('button', { name: /Telegram/i });
    await user.click(telegramButton);

    // Telegram input should be gone
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('@username')).not.toBeInTheDocument();
    });

    // Phone input should remain
    expect(screen.getByPlaceholderText(/\+7 999 123-45-67/i)).toBeInTheDocument();
  });
});
