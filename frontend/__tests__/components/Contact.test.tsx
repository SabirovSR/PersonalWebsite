import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Contact } from '@/components/Contact';

// Mock fetch
global.fetch = jest.fn();

describe('Contact Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'queued', id: 'test-id' }),
    });
  });

  it('renders contact form', () => {
    render(<Contact />);
    
    expect(screen.getByText(/Давайте общаться!/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Как вас зовут/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Расскажите о вашем проекте/i)).toBeInTheDocument();
  });

  it('renders contact links', () => {
    render(<Contact />);
    
    expect(screen.getByText('contact@sabirov.tech')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders channel selection buttons', () => {
    render(<Contact />);
    
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Телефон')).toBeInTheDocument();
  });

  it('allows selecting multiple channels', async () => {
    const user = userEvent.setup();
    render(<Contact />);
    
    const emailButton = screen.getByRole('button', { name: /Email/i });
    await user.click(emailButton);
    
    expect(emailButton).toHaveClass('selected');
  });

  it('prevents deselecting the last channel', async () => {
    const user = userEvent.setup();
    render(<Contact />);
    
    // Telegram is selected by default
    const telegramButton = screen.getByRole('button', { name: /Telegram/i });
    await user.click(telegramButton);
    
    // Should still be selected (can't remove last channel)
    expect(telegramButton).toHaveClass('selected');
  });

  it('shows contact input fields for selected channels', async () => {
    const user = userEvent.setup();
    render(<Contact />);
    
    // Telegram input should be visible by default
    expect(screen.getByPlaceholderText('@username')).toBeInTheDocument();
    
    // Add email channel
    const emailButton = screen.getByRole('button', { name: /Email/i });
    await user.click(emailButton);
    
    // Email input should now be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<Contact />);
    
    const submitButton = screen.getByRole('button', { name: /Отправить сообщение/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/заполните все обязательные поля/i)).toBeInTheDocument();
    });
  });

  it('validates that selected channels have contact info', async () => {
    const user = userEvent.setup();
    render(<Contact />);
    
    const nameInput = screen.getByPlaceholderText(/Как вас зовут/i);
    const messageInput = screen.getByPlaceholderText(/Расскажите о вашем проекте/i);
    
    await user.type(nameInput, 'John Doe');
    await user.type(messageInput, 'Test message');
    
    // Don't fill telegram contact
    
    const submitButton = screen.getByRole('button', { name: /Отправить сообщение/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/укажите контакт для канала/i)).toBeInTheDocument();
    });
  });

  it('successfully submits form', async () => {
    const user = userEvent.setup();
    render(<Contact />);
    
    const nameInput = screen.getByPlaceholderText(/Как вас зовут/i);
    const messageInput = screen.getByPlaceholderText(/Расскажите о вашем проекте/i);
    const telegramInput = screen.getByPlaceholderText('@username');
    
    await user.type(nameInput, 'John Doe');
    await user.type(messageInput, 'Test message');
    await user.type(telegramInput, '@johndoe');
    
    const submitButton = screen.getByRole('button', { name: /Отправить сообщение/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/public/contact',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Сообщение отправлено/i)).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Error' }),
    });
    
    const user = userEvent.setup();
    render(<Contact />);
    
    const nameInput = screen.getByPlaceholderText(/Как вас зовут/i);
    const messageInput = screen.getByPlaceholderText(/Расскажите о вашем проекте/i);
    const telegramInput = screen.getByPlaceholderText('@username');
    
    await user.type(nameInput, 'John Doe');
    await user.type(messageInput, 'Test message');
    await user.type(telegramInput, '@johndoe');
    
    const submitButton = screen.getByRole('button', { name: /Отправить сообщение/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Не удалось отправить/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ status: 'queued', id: 'test-id' }),
      }), 100))
    );
    
    const user = userEvent.setup();
    render(<Contact />);
    
    const nameInput = screen.getByPlaceholderText(/Как вас зовут/i);
    const messageInput = screen.getByPlaceholderText(/Расскажите о вашем проекте/i);
    const telegramInput = screen.getByPlaceholderText('@username');
    
    await user.type(nameInput, 'John Doe');
    await user.type(messageInput, 'Test message');
    await user.type(telegramInput, '@johndoe');
    
    const submitButton = screen.getByRole('button', { name: /Отправить сообщение/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/Отправка.../i)).toBeInTheDocument();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    render(<Contact />);
    
    const nameInput = screen.getByPlaceholderText(/Как вас зовут/i) as HTMLInputElement;
    const messageInput = screen.getByPlaceholderText(/Расскажите о вашем проекте/i) as HTMLTextAreaElement;
    const telegramInput = screen.getByPlaceholderText('@username') as HTMLInputElement;
    
    await user.type(nameInput, 'John Doe');
    await user.type(messageInput, 'Test message');
    await user.type(telegramInput, '@johndoe');
    
    const submitButton = screen.getByRole('button', { name: /Отправить сообщение/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(messageInput.value).toBe('');
      expect(telegramInput.value).toBe('');
    });
  });
});
