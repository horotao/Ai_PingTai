'use client';

import { usePathname } from 'next/navigation';
import { I } from './Icons';

const crumbs: Record<string, string> = {
  '/': '未命名对话',
  '/history': '历史记录',
  '/settings': 'API 配置',
};

export function Topbar() {
  const pathname = usePathname() || '/';
  const matchKey = Object.keys(crumbs).find(k => k === '/' ? pathname === '/' : pathname.startsWith(k)) || '/';
  const isHome = matchKey === '/';
  return (
    <header className="topbar">
      <div className="tb-title">
        <span>atelier</span>
        <span className="sep">/</span>
        <span className="cur">{crumbs[matchKey]}</span>
      </div>
      <div className="tb-spacer" />
      {isHome && (
        <>
          <span className="pill live"><span className="dot" />会话已就绪</span>
          <div className="tb-search">
            <I.Search style={{ width: 12, height: 12 }} />
            <input placeholder="搜索当前会话..." />
            <kbd>⌘K</kbd>
          </div>
          <button className="tb-action" title="筛选"><I.Filter style={{ width: 15, height: 15 }} /></button>
        </>
      )}
    </header>
  );
}
