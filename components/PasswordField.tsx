"use client";

import { useState, type ReactNode } from "react";
import Reveal from "./Reveal";
import { Eye, EyeOff } from "./icons";

type PasswordFieldProps = {
  label: string;
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: ReactNode;
  error?: string;
};

/** Password input with a show/hide visibility toggle. */
export default function PasswordField({
  label,
  id,
  name,
  placeholder,
  autoComplete,
  icon,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Reveal delay={400} animation="fadeInUp" duration={900}>
      <div className={`auth-field${error ? " has-error" : ""}`}>
        <label htmlFor={id}>{label}</label>
        <div className="auth-input">
          {icon && <span className="auth-input-icon">{icon}</span>}
          <input
            id={id}
            name={name}
            type={visible ? "text" : "password"}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required
          />
          <button
            type="button"
            className="auth-input-right"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="auth-msg">{error}</p>}
      </div>
    </Reveal>
  );
}