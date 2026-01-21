'use client';

import { useState } from 'react';
import { useInView } from '@/hooks/useInView';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';

// Contact channel types
type ContactChannel = 'telegram' | 'vk' | 'max' | 'email' | 'phone' | 'website';

interface ChannelConfig {
  id: ContactChannel;
  icon: string;
  type: string;
  pattern?: string;
}

export function Contact() {
  const { ref, inView } = useInView();
  const t = useTranslations('contact');
  
  const channelsConfig: ChannelConfig[] = [
    { id: 'telegram', icon: '💬', type: 'text' },
    { id: 'vk', icon: '💙', type: 'text' },
    { id: 'max', icon: '💜', type: 'text' },
    { id: 'email', icon: '📧', type: 'email' },
    { id: 'phone', icon: '📱', type: 'tel' },
    { id: 'website', icon: '🌐', type: 'url' },
  ];
  
  const contactLinks = [
    { icon: '📧', text: t('links.email'), href: 'mailto:contact@sabirov.tech' },
    { icon: '💬', text: t('links.telegram'), href: 'https://t.me/savik175', external: true },
    { icon: '🐙', text: t('links.github'), href: 'https://github.com/SabirovSR', external: true },
  ];
  const [selectedChannels, setSelectedChannels] = useState<ContactChannel[]>(['telegram']);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    contacts: {} as Record<ContactChannel, string>,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const toggleChannel = (channel: ContactChannel) => {
    setSelectedChannels(prev => {
      if (prev.includes(channel)) {
        // Don't allow removing the last channel
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== channel);
      }
      return [...prev, channel];
    });
  };

  const handleContactChange = (channel: ContactChannel, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [channel]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Validate
    if (!formData.name.trim() || !formData.message.trim()) {
      setStatus('error');
      setStatusMessage(t('form.validation.fillRequired'));
      return;
    }

    // Check that all selected channels have contact info
    for (const channel of selectedChannels) {
      if (!formData.contacts[channel]?.trim()) {
        setStatus('error');
        setStatusMessage(`${t('form.validation.fillContact')} ${t(`channels.${channel}`)}`);
        return;
      }
    }

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.NEXT_PUBLIC_API_KEY || 'public-key',
        },
        body: JSON.stringify({
          name: formData.name,
          message: formData.message,
          channels: selectedChannels,
          contacts: formData.contacts,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'queued') {
        setStatus('success');
        setStatusMessage(t('form.success'));
        setFormData({ name: '', message: '', contacts: {} as Record<ContactChannel, string> });
        setSelectedChannels(['telegram']);
      } else {
        throw new Error(data.message || 'Ошибка отправки');
      }
    } catch {
      setStatus('error');
      setStatusMessage(t('form.error'));
    }

    // Reset status after 10 seconds
    setTimeout(() => {
      setStatus('idle');
      setStatusMessage('');
    }, 10000);
  };

  return (
    <section className="py-20 md:py-32 relative z-[1]" id="contact">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div
          ref={ref}
          className={clsx(
            'text-center mb-16 transition-all duration-600',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span className="font-mono text-sm text-[var(--accent-primary)] block mb-4">
            {t('section')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contact Info */}
          <div className={clsx(
            'transition-all duration-600 delay-200',
            inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          )}>
            <h3 className="text-2xl font-bold mb-5">{t('subtitle')}</h3>
            <p className="text-[var(--text-secondary)] text-lg mb-8">
              {t('text')}
            </p>

            <div className="space-y-4">
              {contactLinks.map(link => (
                <a
                  key={link.text}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 p-4 card rounded-xl transition-all duration-400 hover:border-[var(--accent-primary)] hover:translate-x-3 hover:shadow-[0_4px_20px_rgba(0,255,136,0.15)] group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 w-[3px] h-full bg-[var(--accent-primary)] scale-y-0 group-hover:scale-y-100 transition-transform duration-400 origin-bottom" />
                  <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center text-xl transition-all duration-400 group-hover:bg-[var(--accent-primary)] group-hover:scale-110 group-hover:rotate-[5deg]">
                    {link.icon}
                  </div>
                  <span className="font-mono text-[var(--text-secondary)]">{link.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <form
            onSubmit={handleSubmit}
            className={clsx(
              'card p-8 transition-all duration-600 delay-300',
              inView ? 'translate-x-0' : 'translate-x-8'
            )}
          >
            {/* Name */}
            <div className="mb-5">
              <label className="block font-mono text-sm text-[var(--text-secondary)] mb-2">
                {t('form.name')}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={t('form.namePlaceholder')}
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Message */}
            <div className="mb-5">
              <label className="block font-mono text-sm text-[var(--text-secondary)] mb-2">
                {t('form.message')}
              </label>
              <textarea
                className="form-input min-h-[120px] resize-y"
                placeholder={t('form.messagePlaceholder')}
                value={formData.message}
                onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </div>

            {/* Channel Selection */}
            <div className="mb-5">
              <label className="block font-mono text-sm text-[var(--text-secondary)] mb-3">
                {t('form.channels')}
              </label>
              <div className="flex flex-wrap gap-2">
                {channelsConfig.map(channel => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={clsx('contact-chip', selectedChannels.includes(channel.id) && 'selected')}
                  >
                    <span>{channel.icon}</span>
                    <span>{t(`channels.${channel.id}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Contact Inputs */}
            <div className="space-y-4 mb-6">
              {selectedChannels.map(channelId => {
                const channel = channelsConfig.find(c => c.id === channelId)!;
                return (
                  <div key={channelId} className="animate-[fadeIn_0.3s_ease-out]">
                    <label className="block font-mono text-sm text-[var(--text-secondary)] mb-2">
                      {channel.icon} {t(`channels.${channelId}`)}
                    </label>
                    <input
                      type={channel.type}
                      className="form-input"
                      placeholder={t(`channels.placeholders.${channelId}`)}
                      value={formData.contacts[channelId] || ''}
                      onChange={e => handleContactChange(channelId, e.target.value)}
                      required
                    />
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? t('form.sending') : t('form.submit')}
            </button>

            {/* Status Message */}
            {status !== 'idle' && status !== 'loading' && (
              <div className={clsx('form-status', status)}>
                {status === 'success' ? '✓' : '✗'} {statusMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
