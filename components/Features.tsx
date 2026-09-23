import Reveal from "./Reveal";
import { ArrowRight } from "./icons";

export default function Features() {
  return (
    <section className="section features">
      <div className="container">
        <div className="features-grid">
          <div className="feature-boxes">
            <Reveal className="feature-box feature-box-dark" duration={1500}>
              <img
                className="icon"
                src="/icons/icon2_3-2.png"
                alt=""
                width={60}
                height={60}
              />
              <h3>Asset Protection</h3>
              <p>
                Get Onboard today on QFS and get liberated from all financial
                limitations.
              </p>
            </Reveal>

            <Reveal delay={100} className="feature-box" duration={1500}>
              <img
                className="icon"
                src="/icons/icon2_4-humanitarian.svg"
                alt=""
                width={60}
                height={60}
              />
              <h3>Humanitarian Project</h3>
              <p>Get access to funds once your Humanitarian Project is Approved</p>
            </Reveal>

            <Reveal delay={200} className="feature-box" duration={1500}>
              <img
                className="icon"
                src="/icons/icon2_2-2.png"
                alt=""
                width={60}
                height={60}
              />
              <h3>Wallet Sync</h3>
              <p>Sync Your Asset to Qfs Ledger 3 System</p>
            </Reveal>

            <Reveal delay={300} className="feature-box" duration={1500}>
              <img
                className="icon"
                src="/icons/icon2_1-recovery.svg"
                alt=""
                width={60}
                height={60}
              />
              <h3>Asset Recovery</h3>
              <p>
                Intercept and recover stolen digital assets with help with
                International Police.
              </p>
            </Reveal>
          </div>

          <div className="features-right">
            <Reveal className="label label-muted">QFS is Coming!</Reveal>

            <Reveal delay={200}>
              <h2>
                Get Ready for revolutionary Financial System QFS Nesara Official
              </h2>
            </Reveal>

            <Reveal delay={400}>
              <div>
                <div className="bordered">
                  <p>
                    QFS literal meaning is Quantum Financial System, which is an
                    advanced financial system launched to eradicate monopoly on
                    monetary system and for that purpose, a system that comprises
                    of Artificial Intelligence and complex computer programs fully
                    backed by banks is needed.
                  </p>
                </div>
                <div className="hero-buttons">
                  <a className="btn" href="/user/user/register">
                    Get Started
                  </a>
                  <a className="btn-arrow btn-arrow-dark" href="/user/user/login">
                    Login
                    <ArrowRight className="ico-arrow" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}