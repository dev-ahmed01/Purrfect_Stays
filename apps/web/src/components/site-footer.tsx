import { BrandLogo } from './brand-logo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-brand-block">
          <BrandLogo />
          <p>Pet-friendly travel, designed around the pet travelling with you.</p>
        </div>
        <div className="footer-note">
          <span>Clear policies.</span>
          <span>Verified facilities.</span>
          <span>Less guesswork.</span>
        </div>
      </div>
    </footer>
  );
}
