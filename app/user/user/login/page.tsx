import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import AuthLayout, { AuthField as Field, AuthLink } from "@/components/AuthLayout";
import { Lock, Mail } from "@/components/icons";
import PasswordField from "@/components/PasswordField";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // A verified session skips the form. This lives here rather than in
  // middleware because middleware can only see that a cookie exists — bouncing
  // on presence turned stale/expired cookies into a redirect loop.
  const user = await getSessionUser();
  if (user) redirect(user.role === "ADMIN" ? "/user/admin" : "/user/user/dashboard");

  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Log In to Your Account"
      subtitle="Access your QFS dashboard, wallets and trading history."
      submitLabel="Log In"
      to="/user/user/dashboard"
      endpoint="/api/auth/login"
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
      <div className="auth-form-row">
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
