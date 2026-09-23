import AuthLayout, { AuthField as Field, AuthLink } from "@/components/AuthLayout";
import { Lock, Mail } from "@/components/icons";
import PasswordField from "@/components/PasswordField";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Log In to Your Account"
      subtitle="Access your QFS dashboard, wallets and trading history."
      submitLabel="Log In"
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <AuthLink href="/user/user/register">Create one</AuthLink>
        </p>
      }
    >
      <Field
        label="Email Address"
        type="email"
        id="login-email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail />}
      />
      <PasswordField
        label="Password"
        id="login-password"
        name="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        icon={<Lock />}
      />
      <div className="auth-row">
        <label className="auth-check">
          <input type="checkbox" name="remember" />
          <span>Remember me</span>
        </label>
        <a className="auth-link" href="/user/user/lost-password">
          Forgot password?
        </a>
      </div>
    </AuthLayout>
  );
}
