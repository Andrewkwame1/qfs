"use client";

import { useState } from "react";
import { ArrowRight } from "./icons";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Contact", href: "/#contact" },
  { label: "Connect Wallet", href: "/user/user/connect" },
  { label: "Login", href: "/user/user/login" },
  { label: "Register", href: "/user/user/register" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="container-lg">
        <div className="header-inner">
          <a href="/" className="header-logo">
            <img
              src="/logo/logo_Asset-5-1024x318-1.png"
              alt="QFS"
              width={160}
              height={50}
            />
          </a>

          <div className="header-main">
            <nav className="header-nav">
              {LINKS.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={i === 0 ? "active" : ""}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="header-cta">
              <button
                className="header-login"
                onClick={() => {
                  window.location.href = "/user/user/login";
                }}
              >
                Log In
                <ArrowRight className="ico-arrow" size={14} />
              </button>
            </div>

            <button
              className="header-hamburger"
              aria-label="hamburger-icon"
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {open && (
          <div className="mobile-panel">
            <img src="/logo/logo_Asset-7-1.png" alt="QFS" width={180} height={56} />
            <nav>
              {LINKS.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={i === 0 ? "active" : ""}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}