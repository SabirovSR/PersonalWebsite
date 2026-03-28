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
      business: 'Для бизнеса',
      contact: 'Контакты'
    },
    'business.contactSection': {
      section: '// Заявка',
      title: 'Обсудим задачу',
      description: 'Описание заявки для бизнеса',
      busyTitle: 'Сейчас занят',
      busyDescription: 'Сейчас не обсуживаю заявки',
      busyText: 'Занят по коммерческим запросам',
    },
    contact: {
      section: '// 06. Контакты',
      sectionAlt: '// 05. Контакты',
      title: 'Напишите мне',
      description: 'Есть вопрос, идея или просто хочется пообщаться — пиши',
      busyTitle: 'Сейчас занят',
      busyDescription: 'Сейчас недоступен',
      subtitle: 'Контакты',
      text: 'Отвечаю на сообщения',
      busyText: 'Сейчас я занят',
      form: {
        name: '// Ваше имя *',
        namePlaceholder: 'Как вас зовут?',
        message: '// Сообщение *',
        messagePlaceholder: 'Расскажите о вашем проекте или идее...',
        channels: '// Как с вами связаться? *',
        tariff: '// Тариф',
        tariffPlaceholder: 'Выберите',
        tariffs: {
          basic: 'Базовый',
          advanced: 'Продвинутый',
          infra: 'Инфра',
          custom: 'Кастом',
          unsure: 'Не знаю',
        },
        submit: 'Отправить сообщение →',
        sending: 'Отправка...',
        success: 'Сообщение отправлено! Я свяжусь с вами в ближайшее время.',
        error: 'Не удалось отправить. Попробуйте позже или напишите на contact@sabirov.tech',
        rateLimited: 'Слишком частые отправки. Подождите немного.',
        rateLimitedMinutes: 'Слишком частые отправки. Повторить отправку можно примерно через {minutes} мин.',
        rateLimitedSeconds: 'Слишком частые отправки. Повторить отправку можно примерно через {seconds} сек.',
        validation: {
          fillRequired: 'Заполните поля',
          fillContact: 'Укажите контакт',
          selectTariff: 'Выберите тариф',
        },
      },
      channels: {
        email: 'Email',
        telegram: 'Telegram',
        vk: 'VK',
        phone: 'Телефон',
        website: 'Сайт',
        max: 'MAX',
        placeholders: {
          telegram: 'username',
          vk: 'VK ID или ссылка на профиль',
          max: 'MAX ID или ссылка',
          email: 'your@email.com',
          phone: '+7 999 123-45-67',
          website: 'https://example.com'
        }
      },
      links: {
        email: 'contact@sabirov.tech',
        telegram: 'Telegram',
        github: 'GitHub'
      }
    }
  };
  
  return {
    useLocale: () => 'ru',
    useTranslations: (namespace) => (key, values) => {
      const keys = key.split('.');
      let value = messages[namespace];
      for (const k of keys) {
        value = value?.[k];
      }
      let str = value ?? key;
      if (values && typeof str === 'string') {
        for (const [k, v] of Object.entries(values)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
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
