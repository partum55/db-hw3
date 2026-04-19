'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/patients/new', label: 'Reg. Patient' },
  { href: '/orders/new', label: 'New Order' },
  { href: '/orders/cancel', label: 'Cancel Order' },
  { href: '/specimens/status', label: 'Specimen Status' },
  { href: '/patients/delete', label: 'Delete Patient' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-0 h-12">
        <Link href="/" className="flex items-center gap-2 mr-6 shrink-0">
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-geist-mono)' }}
          >
            MedLab
          </span>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            DBS
          </span>
          <span
            className="text-xs px-1 ml-1"
            style={{
              background: 'rgba(0,200,224,0.1)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(0,200,224,0.25)',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.6rem',
            }}
          >
            v07
          </span>
        </Link>

        <nav className="flex items-center gap-0 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-3 h-12 flex items-center text-xs tracking-wider uppercase transition-colors shrink-0"
                style={{
                  color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  borderBottom: active ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span
            className="text-xs px-2 py-0.5"
            style={{
              color: 'var(--accent-green)',
              background: 'rgba(0,230,118,0.08)',
              border: '1px solid rgba(0,230,118,0.2)',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.6rem',
            }}
          >
            ● LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
