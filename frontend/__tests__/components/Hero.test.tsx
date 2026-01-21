import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/Hero';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
}));

describe('Hero Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders hero section', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Привет, я/i)).toBeInTheDocument();
    expect(screen.getByText(/Савелий Сабиров/i)).toBeInTheDocument();
  });

  it('renders online status badge', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Онлайн/i)).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Разработчик в ГНИВЦ/i)).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Hero />);
    
    const contactButton = screen.getByRole('link', { name: /Связаться/i });
    const projectsButton = screen.getByRole('link', { name: /Смотреть проекты/i });
    
    expect(contactButton).toBeInTheDocument();
    expect(contactButton).toHaveAttribute('href', '#contact');
    
    expect(projectsButton).toBeInTheDocument();
    expect(projectsButton).toHaveAttribute('href', '#projects');
  });

  it('renders avatar image', () => {
    render(<Hero />);
    
    const avatar = screen.getByAltText('Сабиров Савелий');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', '/avatar.jpg');
  });

  it('animates subtitle text with typing effect', () => {
    render(<Hero />);
    
    // Initially should be empty or partial
    const subtitle = screen.getByText((content, element) => {
      return element?.className?.includes('font-mono') || false;
    });
    
    // Fast-forward all timers
    jest.advanceTimersByTime(2000);
    
    // After animation, should contain full text
    expect(subtitle.textContent).toContain('Software Developer');
  });

  it('renders technology badges', () => {
    render(<Hero />);
    
    // These are visible on desktop
    expect(screen.getByText(/C# \/ \.NET/i)).toBeInTheDocument();
    expect(screen.getByText(/Python \/ FastAPI/i)).toBeInTheDocument();
    expect(screen.getByText(/Docker \/ DevOps/i)).toBeInTheDocument();
  });

  it('has proper section structure', () => {
    const { container } = render(<Hero />);
    
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('id', 'hero');
    expect(section).toHaveClass('min-h-screen');
  });
});
