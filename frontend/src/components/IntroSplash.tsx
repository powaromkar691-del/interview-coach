import { useEffect } from "react";
import "./intro-splash.css";

type IntroSplashProps = { onComplete: () => void };

function IntelliHireMark() {
  return (
    <svg className="ih-intro-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ih-intro-shell" x1="8" y1="6" x2="55" y2="59" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7B267" /><stop offset=".48" stopColor="#A78BFA" /><stop offset="1" stopColor="#63D9D1" />
        </linearGradient>
        <linearGradient id="ih-intro-core" x1="18" y1="16" x2="47" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4DF" /><stop offset="1" stopColor="#8DEBE0" />
        </linearGradient>
      </defs>
      <path d="M32 4.5 53.7 17v25L32 54.5 10.3 42V17L32 4.5Z" stroke="url(#ih-intro-shell)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M22 23.5 32 17l10 6.5v13L32 43l-10-6.5v-13Z" stroke="url(#ih-intro-core)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 32h7l4-7 6 14 4-7h9" stroke="url(#ih-intro-core)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="32" r="2.5" fill="#F7B267" /><circle cx="47" cy="32" r="2.5" fill="#63D9D1" />
      <circle cx="32" cy="17" r="2.5" fill="#F7B267" /><circle cx="32" cy="43" r="2.5" fill="#A78BFA" />
    </svg>
  );
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onComplete, 6500);
    return () => window.clearTimeout(timeout);
  }, [onComplete]);

  return (
    <section className="ih-intro" aria-label="Interview Coach is starting" aria-live="polite">
      <video className="ih-intro-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src="/intro-background.mp4" type="video/mp4" />
      </video>
      <div className="ih-intro-haze ih-intro-haze-one" />
      <div className="ih-intro-haze ih-intro-haze-two" />
      <div className="ih-intro-ribbon ih-intro-ribbon-one" />
      <div className="ih-intro-ribbon ih-intro-ribbon-two" />
      <div className="ih-intro-orbit ih-intro-orbit-one" />
      <div className="ih-intro-orbit ih-intro-orbit-two" />
      <div className="ih-intro-grid" />
      <div className="ih-intro-system ih-intro-system-left"><i /> CAMERA SIGNAL <b>01</b></div>
      <div className="ih-intro-system ih-intro-system-right"><i /> RESPONSE MODEL <b>02</b></div>
      <div className="ih-intro-logo"><IntelliHireMark /><span /></div>
      <div className="ih-intro-wordmark">intelli<span>hire</span></div>
      <div className="ih-intro-tag"><i /> ADAPTIVE INTERVIEW INTELLIGENCE</div>
      <p>Human communication. Measurable signals. Smarter practice.</p>
      <div className="ih-intro-progress"><span /></div>
      <div className="ih-intro-loader" aria-hidden="true"><i /><i /><i /></div>
      <div className="ih-intro-meta"><span>VOICE + VISION</span><span>REAL-TIME PRACTICE SYSTEM</span><span>INTERVIEW COACH / INITIALIZING</span></div>
      <button className="ih-intro-skip" type="button" onClick={onComplete}>Skip intro <span aria-hidden="true">→</span></button>
    </section>
  );
}
