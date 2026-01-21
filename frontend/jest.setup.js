import '@testing-library/jest-dom'

// Mock next-intl with actual translations
jest.mock('next-intl', () => {
  const messages = {
    hero: {
      cta: 'Связаться',
      viewProjects: 'Смотреть проекты',
      online: 'Онлайн',
      greeting: 'Привет, я',
      name: 'Савелий Сабиров',
      subtitle: '// Software Developer & DevOps Enthusiast',
      description: 'Разработчик в ГНИВЦ — генеральном подрядчике ФНС России. Создаю надежные и масштабируемые решения для государственных информационных систем.',
      skills: {
        csharp: 'C# / .NET',
        python: 'Python / FastAPI',
        docker: 'Docker / DevOps'
      }
    },
    nav: {
      about: 'Обо мне',
      skills: 'Навыки',
      experience: 'Опыт',
      projects: 'Проекты',
      contact: 'Контакты'
    },
    contact: {
      form: {
        name: '// Ваше имя *',
        namePlaceholder: 'Как вас зовут?',
        message: '// Сообщение *',
        messagePlaceholder: 'Расскажите о вашем проекте или идее...',
        channels: '// Как с вами связаться? *',
        submit: 'Отправить сообщение →',
        sending: 'Отправка...',
        success: '✓ Сообщение отправлено! Я свяжусь с вами в ближайшее время.',
        error: '✗ Не удалось отправить. Попробуйте позже или напишите на contact@sabirov.tech',
      }
    }
  };
  
  return {
    useTranslations: (namespace) => (key) => {
      const keys = key.split('.');
      let value = messages[namespace];
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    },
    NextIntlClientProvider: ({ children }) => children,
  };
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock scrollTo
window.scrollTo = jest.fn()
