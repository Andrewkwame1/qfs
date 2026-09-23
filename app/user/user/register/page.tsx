import AuthLayout, { AuthField as Field, AuthLink } from "@/components/AuthLayout";
import { Lock, Mail, User } from "@/components/icons";
import PasswordField from "@/components/PasswordField";

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="Create Account"
      title="Register for QFS"
      subtitle="Set up your QFS account to access wallets, trading and payments."
      submitLabel="Create Account"
      footer={
        <p>
          Already have an account?{" "}
          <AuthLink href="/user/user/login">Log in</AuthLink>
        </p>
      }
    >
      <Field
        label="Full Name"
        type="text"
        id="register-name"
        name="fullName"
        placeholder="Your full name"
        autoComplete="name"
        icon={<User />}
      />
      <Field
        label="Email Address"
        type="email"
        id="register-email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail />}
      />
      <PasswordField
        label="Password"
        id="register-password"
        name="password"
        placeholder="Create a password"
        autoComplete="new-password"
        icon={<Lock />}
      />
      <PasswordField
        label="Confirm Password"
        id="register-confirm"
        name="confirmPassword"
        placeholder="Repeat your password"
        autoComplete="new-password"
        icon={<Lock />}
      />
    </AuthLayout>
  );
}
