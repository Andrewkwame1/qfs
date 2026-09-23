"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { ArrowRight } from "./icons";

const AVATARS = [
  "/avatars/avatar4.jpg",
  "/avatars/avatar1.jpg",
  "/avatars/avatar2.jpg",
  "/avatars/avatar3.jpg",
];

function Counter() {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVal(12.5);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const duration = 2000;
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              setVal(12.5 * p);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span className="hero-counter" ref={ref}>
      {val.toFixed(1)}M+
    </span>
  );
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-pattern" aria-hidden="true" />
      <div className="container">
        <div className="hero-grid">
          <div className="hero-left">
            <Reveal className="hero-label label label-accent">
              Quantum Financial System
            </Reveal>

            <Reveal delay={200}>
              <h1>Empower Your Financial Future With Quantum Financial System</h1>
            </Reveal>

            <Reveal delay={400}>
              <div>
                <div className="hero-bordered">
                  <p>
                    Decentralized financial system designed to democratize money
                    and eliminate the control of central bank.
                  </p>
                </div>
                <div className="hero-buttons">
                  <a className="btn btn-light" href="/user/user/connect">
                    Connect Wallet
                  </a>
                  <a className="btn-arrow" href="/user/user/register">
                    Join Us
                    <ArrowRight className="ico-arrow" />
                  </a>
                </div>
              </div>
            </Reveal>

            <div className="hero-users-row">
              <Reveal delay={600} className="hero-users">
                <div className="hero-avatars">
                  {AVATARS.map((src) => (
                    <img key={src} className="avatar" src={src} alt="" width={45} height={45} />
                  ))}
                </div>
                <Counter />
                <span className="hero-users-label">
                  <span className="dot" />
                  World Enrolled Users
                </span>
              </Reveal>

              <Reveal delay={800} className="hero-award">
                <img src="/award/award_Asset-6-2.png" alt="" width={48} height={44} />
                <p>2025 The ’ Best QFS Platform</p>
              </Reveal>
            </div>
          </div>

          <div className="hero-cards">
            <Reveal className="hero-card-1">
              <img src="/cards/cc1-1-1024x869-1.png" alt="" />
            </Reveal>
            <Reveal delay={200} className="hero-card-2">
              <img src="/cards/cc3-1-1024x780-1.png" alt="" />
            </Reveal>
            <Reveal delay={400} className="hero-card-3">
              <img src="/cards/cc2-1-1024x800-1.png" alt="" />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}