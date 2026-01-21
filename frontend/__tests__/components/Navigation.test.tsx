import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '@/components/Navigation';

// Mock ThemeProvider
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: jest.fn(),
  }),
}));

describe('Navigation Component', () => {
  beforeEach(() => {
    window.scrollY = 0;
  });

  it('renders logo', () => {
    render(<Navigation />);
    
    expect(screen.getByText('sabirov.tech')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Navigation />);
    
    expect(screen.getByText('обо мне')).toBeInTheDocument();
    expect(screen.getByText('навыки')).toBeInTheDocument();
    expect(screen.getByText('опыт')).toBeInTheDocument();
    expect(screen.getByText('проекты')).toBeInTheDocument();
    expect(screen.getByText('контакты')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(<Navigation />);
    
    const themeButton = screen.getByRole('button', { name: /Переключить тему/i });
    expect(themeButton).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /Меню/i });
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('adds background when scrolled', async () => {
    const { container } = render(<Navigation />);
    
    const nav = container.querySelector('nav');
    expect(nav).not.toHaveClass('bg-[var(--bg-primary)]/90');
    
    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    fireEvent.scroll(window);
    
    await waitFor(() => {
      expect(nav).toHaveClass('bg-[var(--bg-primary)]/90');
    });
  });

  it('toggles mobile menu on button click', async () => {
    const user = userEvent.setup();
    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /Меню/i });
    const mobileMenu = screen.getAllByRole('list')[1]; // Second list is mobile menu
    
    // Initially closed
    expect(mobileMenu).toHaveClass('-right-full');
    
    // Click to open
    await user.click(mobileMenuButton);
    
    await waitFor(() => {
      expect(mobileMenu).toHaveClass('right-0');
    });
    
    // Click to close
    await user.click(mobileMenuButton);
    
    await waitFor(() => {
      expect(mobileMenu).toHaveClass('-right-full');
    });
  });

  it('closes mobile menu when link is clicked', async () => {
    const user = userEvent.setup();
    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /Меню/i });
    
    // Open menu
    await user.click(mobileMenuButton);
    
    const mobileMenu = screen.getAllByRole('list')[1];
    await waitFor(() => {
      expect(mobileMenu).toHaveClass('right-0');
    });
    
    // Click a link in mobile menu
    const mobileLinks = mobileMenu.querySelectorAll('a');
    await user.click(mobileLinks[0]);
    
    await waitFor(() => {
      expect(mobileMenu).toHaveClass('-right-full');
    });
  });

  it('navigation links have correct hrefs', () => {
    render(<Navigation />);
    
    const links = [
      { text: 'обо мне', href: '#about' },
      { text: 'навыки', href: '#skills' },
      { text: 'опыт', href: '#experience' },
      { text: 'проекты', href: '#projects' },
      { text: 'контакты', href: '#contact' },
    ];
    
    links.forEach(({ text, href }) => {
      const link = screen.getAllByRole('link', { name: new RegExp(text, 'i') })[0];
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('logo links to top of page', () => {
    render(<Navigation />);
    
    const logo = screen.getByText('sabirov.tech').closest('a');
    expect(logo).toHaveAttribute('href', '#');
  });
});
