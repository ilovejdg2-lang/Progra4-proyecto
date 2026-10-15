export function FacebookIcon({ className, size }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94z" />
    </svg>
  );
}

export function InstagramIcon({ className, size }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ className, size = 16 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.5-4.2A8 8 0 1 1 20 11.5z" />
      <path d="M9.2 9.4c.2-.4.4-.4.7-.4h.6c.2 0 .4 0 .5.4.2.5.6 1.6.6 1.7.1.2 0 .4-.1.5l-.3.4c-.1.1-.2.3-.1.5.2.4.7 1.1 1.4 1.5.6.3 1 .4 1.2.2l.5-.5c.2-.2.3-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.4.1.3 0 1.5-.7 1.8-.6.3-1.4.2-2.3-.1-1.3-.5-2.6-1.5-3.6-2.8-.8-1.1-1.5-2.4-1.6-2.8-.2-.5 0-1.1.2-1.5z" />
    </svg>
  );
}
