"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Menu, Sun, Moon, X } from "lucide-react";
import { type Locale, locales, t } from "@/lib/i18n";
export function Shell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const d = t(locale);
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mode = localStorage.getItem("aura-theme");
    const isDark =
      mode === "dark" ||
      (!mode && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, []);
  function theme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("aura-theme", next ? "dark" : "light");
  }
  function language(value: string) {
    localStorage.setItem("aura-language", value);
    document.cookie = `aura-language=${value};path=/;max-age=31536000;SameSite=Lax`;
    router.push(path.replace(/^\/(en|ka|ru|he)(?=\/|$)/, `/${value}`));
  }
  return (
    <>
      <a className="skip-link" href="#main">
        {d.skipContent}
      </a>
      <header className="site-header">
        <Link
          href={`/${locale}`}
          className="wordmark"
          aria-label="Aura Property home"
        >
          aura<span>PROPERTY</span>
        </Link>
        <nav
          className={menu ? "navigation open" : "navigation"}
          aria-label="Main navigation"
        >
          {[
            ["projects", d.projects],
            ["about", d.about],
            ["blog", d.journal],
          ].map(([route, label]) => (
            <Link
              key={route}
              href={`/${locale}/${route}`}
              onClick={() => setMenu(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <select
            aria-label={d.language}
            value={locale}
            onChange={(e) => language(e.target.value)}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
          <button className="icon-button" aria-label={d.theme} onClick={theme}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link className="header-contact" href={`/${locale}/contact`}>
            {d.contact}
            <ArrowUpRight size={15} />
          </Link>
          <button
            className="menu-button icon-button"
            aria-label={d.toggleMenu}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="footer">
        <div>
          <Link href={`/${locale}`} className="wordmark">
            aura<span>PROPERTY</span>
          </Link>
          <p>{d.footer}</p>
        </div>
        <div className="footer-links">
          <Link href={`/${locale}/projects`}>{d.projects}</Link>
          <Link href={`/${locale}/about`}>{d.about}</Link>
          <Link href={`/${locale}/contact`}>{d.contact}</Link>
          <Link href={`/${locale}/privacy`}>{d.privacy}</Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Aura Property</span>
          <span>Georgia · Tbilisi / Batumi</span>
        </div>
      </footer>
    </>
  );
}
