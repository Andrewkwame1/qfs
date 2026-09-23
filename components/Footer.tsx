import Reveal from "./Reveal";
import { Bubble, Facebook, Linkedin, Twitter, Youtube } from "./icons";

const SOCIALS = [
  { label: "Facebook-f", href: "https://q-ledgerpro.live/#", icon: <Facebook size={14} /> },
  { label: "Twitter", href: "https://q-ledgerpro.live/#", icon: <Twitter size={14} /> },
  { label: "Youtube", href: "https://q-ledgerpro.live/#", icon: <Youtube size={14} /> },
  { label: "Linkedin-in", href: "https://q-ledgerpro.live/#", icon: <Linkedin size={14} /> },
];

const QUICKLINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Contact", href: "/#contact" },
  { label: "Login", href: "/user/user/login" },
];

const SUPPORT = [
  { label: "Help Center", href: "mailto:support@Qledgerpro.live" },
  { label: "Privacy Policy", href: "/user/user/login" },
  { label: "Disclaimer", href: "/user/user/login" },
  { label: "FAQs", href: "https://q-ledgerpro.live/#" },
  { label: "Contact", href: "/user/user/login" },
];

export default function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-pattern" aria-hidden="true" />
        <div className="container-lg">
          <div className="footer-grid">
            <div className="footer-intro">
              <Reveal>
                <img
                  src="/logo/logo_Asset-5-1024x318-1.png"
                  alt="QFS"
                  width={240}
                  height={74}
                />
              </Reveal>
              <Reveal delay={200}>
                <p>
                  JOIN THE BIGGEST FINANCIAL REVOLUTIONARY SYSTEM DESIGNED TO
                  OVERTAKE THE WORLD&apos;S BANKING SYSTEM BY ELIMINATING CONTROL OF
                  MONEY BY CABALS.
                </p>
              </Reveal>
              <Reveal delay={400} className="socials">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </Reveal>
            </div>

            <div className="footer-cols">
              <Reveal delay={250} className="footer-col">
                <h4>Quicklinks</h4>
                <ul>
                  {QUICKLINKS.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={350} className="footer-col">
                <h4>Email</h4>
                <ul className="email-list">
                  <li>
                    <a href="mailto:support@Qledgerpro.live">
                      support@Qledgerpro.live
                    </a>
                  </li>
                </ul>
                <h4 style={{ marginTop: 30 }}>Support</h4>
                <ul>
                  {SUPPORT.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={450} className="footer-col">
                <h4>Let&apos;s Talk!</h4>
                <p>Our Support team are always online to assist you</p>
                <a className="footer-livechat" href="https://q-ledgerpro.live/#">
                  <Bubble size={14} />
                  Live Chat
                </a>
              </Reveal>
            </div>
          </div>
        </div>
      </footer>

      <div className="copyright">
        <div className="container-lg">
          <div className="copyright-inner">
            <p>Copyright © 2025 Qledgerpro.live</p>
            <div className="copyright-actions">
              <a href="/user/user/login">Privacy Policy</a>
              <a href="/user/user/login">Terms &amp; Services</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}