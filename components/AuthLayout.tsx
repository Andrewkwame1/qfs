"use client";

import Reveal from "./Reveal";
import { ArrowRight } from "./icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

/* ---------- Shared auth page shell (login + register) ----------
   Immersive dark split layout: brand panel + form card. */

const AUTH_AVATARS = [
  "/avatars/avatar4.jpg",
  "/avatars/avatar1.jpg",
  "/avatars/avatar2.jpg",
  "/avatars/avatar3.jpg",
];

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  submitLabel: string;
  footer: ReactNode;
  /** Fallback redirect target when no API endpoint is provided. */
  to?: string;
  /** Real auth API endpoint (e.g. /api/auth/login). Submits the form to it. */
  endpoint?: string;
};

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  submitLabel,
  footer,
  to,
  endpoint,
}: AuthLayoutProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!endpoint) {
      if (to) router.push(to);
      return;
    }

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Client-side password match check for register.
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setError(json?.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      const role = json.data?.user?.role;
      router.push(role === "ADMIN" ? "/user/admin" : (to ?? "/user/user/dashboard"));
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />
      <div className="auth-pattern" aria-hidden="true" />
      <div className="auth-shell">
        <Reveal animation="fadeInUp" duration={900}>
          <div className="auth-frame">
            {/* Left: brand panel (desktop) */}
            <aside className="auth-panel">
              <img
                src="/logo/logo_Asset-5-1024x318-1.png"
                alt="QFS"
                className="auth-logo"
                width={172}
                height={54}
              />

              <div className="auth-panel-body">
                <span className="label label-accent">Quantum Financial System</span>
                <h2>Your Financial Freedom Begins Here</h2>
                <p>
                  Unlock your financial freedom with QFS. Discover innovative
                  solutions for secure and efficient financial management.
                </p>
              </div>

              <div className="auth-panel-proof">
                <div className="auth-proof-users">
                  <div className="auth-avatars">
                    {AUTH_AVATARS.map((src) => (
                      <img
                        key={src}
                        className="avatar"
                        src={src}
                        alt=""
                        width={40}
                        height={40}
                      />
                    ))}
                  </div>
                  <div className="auth-proof-text">
                    <strong>12.5M+</strong>
                    <span>World Enrolled Users</span>
                  </div>
                </div>
                <div className="auth-proof-award">
                  <img src="/award/award_Asset-6-2.png" alt="" width={40} height={36} />
                  <p>2025&apos;s Best QFS Platform</p>
                </div>
              </div>

              <img
                src="/cards/cc1-1-1024x869-1.png"
                alt=""
                className="auth-panel-card"
                width={420}
                height={356}
              />
            </aside>

            {/* Right: form card */}
            <section className="auth-card">
              <div className="auth-mobile-brand">
                <img
                  src="/logo/logo_Asset-5-1024x318-1.png"
                  alt="QFS"
                  className="auth-logo"
                  width={150}
                  height={47}
                />
              </div>

              <Reveal delay={120} animation="fadeInUp" duration={900}>
                <div className="auth-head">
                  <span className="label label-accent">{eyebrow}</span>
                  <h1>{title}</h1>
                  <p>{subtitle}</p>
                </div>
              </Reveal>

              <Reveal delay={240} animation="fadeInUp" duration={900}>
                <form className="auth-form" noValidate onSubmit={handleSubmit}>
                  {children}

                  {error && (
                    <p className="auth-form-error" role="alert">
                      {error}
                    </p>
                  )}

                  <button type="submit" className="auth-submit" disabled={busy}>
                    {busy ? "Please wait…" : submitLabel}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </Reveal>

              <div className="auth-footer">{footer}</div>
            </section>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

/* ---------- Reusable form field ---------- */

type FieldProps = {
  label: string;
  type?: string;
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: ReactNode;
  right?: ReactNode;
  error?: string;
  /** Render a <select> (country picker) instead of a text input. */
  select?: boolean;
  options?: string[];
};

export function AuthField({
  label,
  type = "text",
  id,
  name,
  placeholder,
  autoComplete,
  icon,
  right,
  error,
  select,
  options,
}: FieldProps) {
  return (
    <Reveal delay={400} animation="fadeInUp" duration={900}>
      <div className={`auth-field${error ? " has-error" : ""}`}>
        <label htmlFor={id}>{label}</label>
        <div className="auth-input">
          {icon && <span className="auth-input-icon">{icon}</span>}
          {select ? (
            <select
              id={id}
              name={name}
              required
              defaultValue=""
              className="auth-select"
            >
              <option value="" disabled>
                {placeholder ?? "Select…"}
              </option>
              {options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={id}
              name={name}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              required
            />
          )}
          {right && <span className="auth-input-right">{right}</span>}
        </div>
        {error && <p className="auth-msg">{error}</p>}
      </div>
    </Reveal>
  );
}

/* ---------- Inline auth footer link ---------- */

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="auth-link">
      {children}
    </Link>
  );
}

/* ---------- Named alias the login/register pages rely on ---------- */

/** Alias so pages can write <Field … /> (matches the original Elementor markup). */
export { AuthField as Field };