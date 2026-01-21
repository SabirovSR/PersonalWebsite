import { renderHook, waitFor } from '@testing-library/react';
import { useInView } from '@/hooks/useInView';

describe('useInView Hook', () => {
  let observeMock: jest.Mock;
  let unobserveMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let mockIntersectionObserver: jest.Mock;

  beforeEach(() => {
    observeMock = jest.fn();
    unobserveMock = jest.fn();
    disconnectMock = jest.fn();

    mockIntersectionObserver = jest.fn(function (
      callback: IntersectionObserverCallback
    ) {
      this.observe = observeMock;
      this.unobserve = unobserveMock;
      this.disconnect = disconnectMock;
      this.callback = callback;
    });

    global.IntersectionObserver = mockIntersectionObserver as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with inView as false', () => {
    const { result } = renderHook(() => useInView());
    
    expect(result.current.inView).toBe(false);
  });

  it('returns ref and inView state', () => {
    const { result } = renderHook(() => useInView());
    
    expect(result.current).toHaveProperty('ref');
    expect(result.current).toHaveProperty('inView');
  });

  it('creates IntersectionObserver with correct options', () => {
    renderHook(() =>
      useInView({
        threshold: 0.5,
        rootMargin: '10px',
      })
    );
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.5,
        rootMargin: '10px',
      }
    );
  });

  it('uses default options when none provided', () => {
    renderHook(() => useInView());
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );
  });

  it('sets inView to true when element intersects', async () => {
    const { result } = renderHook(() => useInView());
    
    // Simulate ref being set
    const mockElement = document.createElement('div');
    (result.current.ref as any).current = mockElement;
    
    // Trigger intersection
    const [callback] = mockIntersectionObserver.mock.calls[0];
    callback(
      [{ isIntersecting: true, target: mockElement } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    
    await waitFor(() => {
      expect(result.current.inView).toBe(true);
    });
  });

  it('unobserves element after first intersection when triggerOnce is true', async () => {
    const { result } = renderHook(() => useInView({ triggerOnce: true }));
    
    const mockElement = document.createElement('div');
    (result.current.ref as any).current = mockElement;
    
    const [callback] = mockIntersectionObserver.mock.calls[0];
    callback(
      [{ isIntersecting: true, target: mockElement } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    
    await waitFor(() => {
      expect(unobserveMock).toHaveBeenCalledWith(mockElement);
    });
  });

  it('continues observing when triggerOnce is false', async () => {
    const { result } = renderHook(() => useInView({ triggerOnce: false }));
    
    const mockElement = document.createElement('div');
    (result.current.ref as any).current = mockElement;
    
    const [callback] = mockIntersectionObserver.mock.calls[0];
    callback(
      [{ isIntersecting: true, target: mockElement } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    
    await waitFor(() => {
      expect(result.current.inView).toBe(true);
    });
    
    expect(unobserveMock).not.toHaveBeenCalled();
  });

  it('sets inView to false when element leaves viewport and triggerOnce is false', async () => {
    const { result } = renderHook(() => useInView({ triggerOnce: false }));
    
    const mockElement = document.createElement('div');
    (result.current.ref as any).current = mockElement;
    
    const [callback] = mockIntersectionObserver.mock.calls[0];
    
    // Enter viewport
    callback(
      [{ isIntersecting: true, target: mockElement } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    
    await waitFor(() => {
      expect(result.current.inView).toBe(true);
    });
    
    // Leave viewport
    callback(
      [{ isIntersecting: false, target: mockElement } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    
    await waitFor(() => {
      expect(result.current.inView).toBe(false);
    });
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = renderHook(() => useInView());
    
    unmount();
    
    expect(disconnectMock).toHaveBeenCalled();
  });
});
