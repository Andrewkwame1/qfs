import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import AuthLayout, { AuthField as Field, AuthLink } from "@/components/AuthLayout";
import { Globe, Lock, Mail, Phone, User } from "@/components/icons";
import PasswordField from "@/components/PasswordField";
import EmailField from "@/components/EmailField";

export const dynamic = "force-dynamic";

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Ghana",
  "Nigeria",
  "South Africa",
  "Kenya",
  "Egypt",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Switzerland",
  "India",
  "Pakistan",
  "Bangladesh",
  "United Arab Emirates",
  "Saudi Arabia",
  "Brazil",
  "Mexico",
  "China",
  "Japan",
  "Singapore",
  "Philippines",
  "Indonesia",
  "Other",
];

export default async function RegisterPage() {
  // Already signed in? Verified here, not in middleware — see login/page.tsx.
  const user = await getSessionUser();
  if (user) redirect(user.role === "ADMIN" ? "/user/admin" : "/user/user/dashboard");

  return (
    <AuthLayout
      eyebrow="Create Account"
      title="Register for QFS"
      subtitle="Set up your QFS account to access wallets, trading and payments."
      submitLabel="Create Account"
      to="/user/user/dashboard"
      endpoint="/api/auth/register"
      footer={
        <p>
          Already have an account?{" "}
          <AuthLink href="/user/user/login">Log in</AuthLink>
        </p>
      }
    >
      <div className="auth-row">
        <Field
          label="First Name"
          type="text"
          id="register-first"
          name="firstName"
          placeholder="Your first name"
          autoComplete="given-name"
          icon={<User />}
        />
        <Field
          label="Last Name"
          type="text"
          id="register-last"
          name="lastName"
          placeholder="Your last name"
          autoComplete="family-name"
          icon={<User />}
        />
      </div>
      <EmailField
        label="Email Address"
        id="register-email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail />}
      />
      <Field
        label="Country"
        id="register-country"
        name="country"
        placeholder="Select your country"
        icon={<Globe />}
        select
        options={COUNTRIES}
      />
      <Field
        label="Phone Number"
        type="tel"
        id="register-phone"
        name="phone"
        placeholder="+1 (555) 000-0000"
        autoComplete="tel"
        icon={<Phone />}
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
        placeholder="Re-type your password"
        autoComplete="new-password"
        icon={<Lock />}
      />
    </AuthLayout>
  );
}