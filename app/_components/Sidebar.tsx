'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '../_lib/data';
import { I } from './Icons';

const items = [
  { href: '/',         key: 'home',     icon: <I.Home />,     label: '创作工作台', tip: '工作台' },
  { href: '/history',  key: 'history',  icon: <I.Clock />,    label: '历史记录',   tip: '历史记录' },
  { href: '/settings', key: 'settings', icon: <I.Settings />, label: '设置',       tip: '设置' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo" />
        <div className="sb-wordmark">atelier<em>.</em></div>
      </div>
      <div className="sb-section-label">NAVIGATE</div>
      {items.map(it => {
        const active = it.href === '/' ? pathname === '/' : pathname?.startsWith(it.href);
        return (
          <Link key={it.key} href={it.href} className={clsx('sb-item', active && 'active')} data-tip={it.tip}>
            {it.icon}
            <span className="label">{it.label}</span>
          </Link>
        );
      })}
      <div className="sb-footer">
        <div className="sb-hint">本地优先 · 数据不离开此浏览器</div>
      </div>
    </aside>
  );
}
