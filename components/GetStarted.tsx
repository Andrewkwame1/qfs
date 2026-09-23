import Reveal from "./Reveal";
import { ArrowRight } from "./icons";

export default function GetStarted() {
  return (
    <section className="getstarted" id="contact">
      <div className="container">
        <div className="getstarted-grid">
          <div className="getstarted-left">
            <Reveal className="label label-accent">Get Started</Reveal>
            <Reveal delay={200}>
              <h2>Your Financial Freedom begins Here</h2>
            </Reveal>
            <Reveal delay={400}>
              <div>
                <p>
                  The History of money is entering a new era, You might just wake
                  up with no money. We might just wake up one day with no money.
                  Convert all paper money into a digitally gold backed currency.
                </p>
                <div className="hero-buttons">
                  <a className="btn btn-light" href="/user/user/register">
                    Get Started
                  </a>
                  <a className="btn-arrow" href="mailto:support@Qledgerpro.live">
                    Contact Us
                    <ArrowRight className="ico-arrow" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <div>
            <Reveal animation="fadeIn" duration={2000} className="getstarted-card">
              <img src="/cards/cc1-1-1024x869-1.png" alt="" />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}