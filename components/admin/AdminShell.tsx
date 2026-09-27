"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LiveBadge } from "@/lib/use-live";
import {
  ArrowDown,
  Card,
  ChevronDown,
  Close,
  DashboardIcon,
  FilePdf,
  ListIcon,
  LogOut,
  Menu,
  Moon,
  Search,
  Star,
  Sun,
  SwapVert,
  Timer,
  TrendingUp,
  Wallet,
} from "./../dashboard/icons";

const NAV: Array<{ href: string; label: string; short?: string; icon: ReactNode }> = [
  { href: "/user/admin", label: "Overview", icon: <DashboardIcon size={16} /> },
  { href: "/user/admin/users", label: "Users", icon: <Wallet size={16} /> },
  { href: "/user/admin/requests", label: "Deposit / Withdrawal Requests", short: "Requests", icon: <ArrowDown size={16} /> },
  { href: "/user/admin/transactions", label: "Transactions", icon: <SwapVert size={16} /> },
  { href: "/user/admin/plans", label: "Investment Plans", short: "Plans", icon: <TrendingUp size={16} /> },
  { href: "/user/admin/loans", label: "Loans", icon: <Wallet size={16} /> },
  { href: "/user/admin/documents", label: "Documents", icon: <FilePdf size={16} /> },
  { href: "/user/admin/reviews", label: "Reviews", icon: <Star size={16} /> },
  { href: "/user/admin/markets", label: "Markets", icon: <Search size={16} /> },
  { href: "/user/admin/settings", label: "Settings", icon: <Timer size={16} /> },
  { href: "/user/admin/audit", label: "Audit Log", icon: <ListIcon size={16} /> },
];

/** Route-derived trail: Admin / Users. Horizontally scrollable, so long labels
 *  stay readable on a phone instead of wrapping or being clipped. */
function Breadcrumbs({ pathname }: { pathname: string }) {
  const current =
    NAV.find((n) => (n.href === "/user/admin" ? pathname === n.href : pathname.startsWith(n.href))) ?? NAV[0];

  return (
    <nav className="adm-crumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <a href="/user/admin">Admin</a>
        </li>
        <li className="adm-crumbs-sep" aria-hidden="true">
          /
        </li>
        <li>
          <span aria-current="page">{current.short ?? current.label}</span>
        </li>
      </ol>
    </nav>
  );
}

export default function AdminShell({ user, children }: { user: { name: string; email: string; avatarUrl: string }; children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("qfs-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("qfs-theme", theme);
  }, [theme]);

  const isActive = (href: string) =>
    href === "/user/admin" ? pathname === "/user/admin" : pathname.startsWith(href);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/user/user/login";
  };

  return (
    <div className={`qfs-dash qfs-admin${sidebarOpen ? " sidebar-open" : ""}`} data-theme={theme}>
      <aside className="adm-sidebar">
        <div className="adm-sb-head">
          <img src="/logo/logo_Asset-5-1024x318-1.png" alt="QFS" />
          <span className="adm-sb-role">Admin</span>
          <button className="adm-sb-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <Close />
          </button>
        </div>

        <div className="adm-sb-profile">
          <img src={user.avatarUrl || "/avatars/avatar1.jpg"} alt={user.name} />
          <div className="adm-sb-profile-in">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <nav className="adm-sb-nav">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`adm-sb-link${isActive(item.href) ? " active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="adm-sb-link-ico">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="adm-sb-foot">
          <a className="adm-sb-link" href="/">
            <span className="adm-sb-link-ico">
              <Card size={16} />
            </span>
            <span>View Public Site</span>
          </a>
          <a className="adm-sb-link" href="/user/user/dashboard">
            <span className="adm-sb-link-ico">
              <DashboardIcon size={16} />
            </span>
            <span>User Dashboard</span>
          </a>
          <button className="adm-sb-link adm-sb-link-danger" onClick={logout}>
            <span className="adm-sb-link-ico">
              <LogOut size={16} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />

      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-hamburger" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <div className="adm-topbar-title">
            <span className="adm-topbar-kicker">QFS Control Center</span>
            <b>Admin Dashboard</b>
          </div>

          <div className="adm-topbar-spacer" />

          <div className="adm-topbar-actions">
            <LiveBadge />

            <button
              className="adm-icon-btn"
              aria-label="Toggle theme"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <div className="adm-chip-wrap">
              <button className="adm-user-chip" onClick={() => setMenuOpen((v) => !v)}>
                <img src={user.avatarUrl || "/avatars/avatar1.jpg"} alt={user.name} />
                <span>{user.name.split(" ")[0]}</span>
                <ChevronDown size={13} />
              </button>
              {menuOpen && (
                <div className="adm-user-menu">
                  <button onClick={logout}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="adm-body">
          <Breadcrumbs pathname={pathname} />
          {children}
        </main>

        <p className="adm-footer">© 2025 Qledgerpro.live — QFS Admin Console</p>
      </div>
    </div>
  );
}