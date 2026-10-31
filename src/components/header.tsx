'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Aperture, ArrowUpRight } from 'lucide-react';
import { useWorkspace } from './workspace';
const links = [['/universities', 'Universities'], ['/programs', 'Programs'], ['/analyze', 'Analyze'], ['/methodology', 'Methodology']];
export function Header() { const path = usePathname(); const { clear } = useWorkspace(); return <header className="site-header"><div className="shell header-inner"><Link className="brand" href="/"><span className="brand-mark"><Aperture size={19}/></span>Degree<span className="brand-blue">Lens</span></Link><nav aria-label="Main navigation" className="nav-links">{links.map(([href,label]) => <Link key={href} className={path === href ? 'active' : ''} href={href}>{label}</Link>)}</nav><div className="header-actions"><button className="quiet-button" onClick={clear}>Clear data</button><Link href="/analyze" className="button button-small">Start analysis <ArrowUpRight size={15}/></Link></div></div></header>; }
