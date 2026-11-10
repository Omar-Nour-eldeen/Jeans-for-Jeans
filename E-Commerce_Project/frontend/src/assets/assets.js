// SVG Data URIs for all asset illustrations and icons

const svgToDataUrl = (svgString) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

const presentSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1e24;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2b303a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0c0f12;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f3e5ab;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#grad1)" />
  <circle cx="400" cy="350" r="220" fill="none" stroke="url(#gold)" stroke-width="3" opacity="0.4" />
  <circle cx="400" cy="350" r="180" fill="none" stroke="url(#gold)" stroke-width="1" stroke-dasharray="8 8" opacity="0.6" />
  <path d="M 330 250 L 470 250 L 450 480 L 400 480 L 380 340 L 360 340 L 340 480 L 290 480 Z" fill="#3b5998" stroke="url(#gold)" stroke-width="2" opacity="0.8" />
  <text x="400" y="650" font-family="'Helvetica Neue', sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="4">JEANS FOR JEANS</text>
  <text x="400" y="700" font-family="'Helvetica Neue', sans-serif" font-size="18" fill="#d4af37" text-anchor="middle" letter-spacing="6">PREMIUM DENIM COLLECTION</text>
  <line x1="300" y1="730" x2="500" y2="730" stroke="url(#gold)" stroke-width="2" opacity="0.6" />
</svg>`;

const jeansLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <text x="10" y="52" font-family="'Montserrat', sans-serif" font-size="32" font-weight="900" fill="#111827" letter-spacing="-1">
    Jeans<tspan fill="#2563eb">For</tspan>Jeans
  </text>
  <circle cx="270" cy="42" r="6" fill="#2563eb" />
</svg>`;

const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="24" height="24">
  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
</svg>`;

const starDullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d1d5db" width="24" height="24">
  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
</svg>`;

const stripeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40">
  <rect width="120" height="40" rx="6" fill="#635bff" />
  <text x="60" y="26" font-family="'Helvetica Neue', sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">Stripe</text>
</svg>`;

const razorpaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40">
  <rect width="120" height="40" rx="6" fill="#0c2340" />
  <text x="60" y="25" font-family="'Helvetica Neue', sans-serif" font-size="16" font-weight="bold" fill="#0284c7" text-anchor="middle">Razorpay</text>
</svg>`;

const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1600" height="600" fill="url(#bgGrad)" />
  <circle cx="1200" cy="300" r="350" fill="#3b82f6" opacity="0.1" />
  <text x="200" y="280" font-family="'Helvetica Neue', sans-serif" font-size="56" font-weight="bold" fill="#ffffff">Elevate Your Denim Style</text>
  <text x="200" y="340" font-family="'Helvetica Neue', sans-serif" font-size="24" fill="#94a3b8">Discover the latest premium jeans collection tailored for comfort and elegance.</text>
</svg>`;

const contactSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="100%">
  <rect width="600" height="500" rx="12" fill="#f3f4f6" />
  <circle cx="300" cy="200" r="80" fill="#e5e7eb" />
  <path d="M 260 190 Q 300 150 340 190" fill="none" stroke="#4b5563" stroke-width="4" stroke-linecap="round" />
  <circle cx="280" cy="180" r="8" fill="#1f2937" />
  <circle cx="320" cy="180" r="8" fill="#1f2937" />
  <text x="300" y="340" font-family="sans-serif" font-size="28" font-weight="bold" fill="#1f2937" text-anchor="middle">Get In Touch</text>
  <text x="300" y="380" font-family="sans-serif" font-size="18" fill="#6b7280" text-anchor="middle">We would love to hear from you!</text>
</svg>`;

const dropdownSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
  <polyline points="6 9 12 15 18 9"></polyline>
</svg>`;

const binSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
  <polyline points="3 6 5 6 21 6"></polyline>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
</svg>`;

const aboutSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="100%">
  <rect width="600" height="500" rx="12" fill="#eff6ff" />
  <text x="300" y="230" font-family="sans-serif" font-size="36" font-weight="bold" fill="#1d4ed8" text-anchor="middle">About JeansForJeans</text>
  <text x="300" y="280" font-family="sans-serif" font-size="18" fill="#3b82f6" text-anchor="middle">Crafting authentic denim since 2024</text>
</svg>`;

const searchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
  <circle cx="11" cy="11" r="8"></circle>
  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
</svg>`;

const crossSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`;

const exchangeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48">
  <polyline points="17 1 21 5 17 9"></polyline>
  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
  <polyline points="7 23 3 19 7 15"></polyline>
  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
</svg>`;

const qualitySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48">
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
  <polyline points="22 4 12 14.01 9 11.01"></polyline>
</svg>`;

const supportSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48">
  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
</svg>`;

const profileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
  <circle cx="12" cy="7" r="4"></circle>
</svg>`;

const cartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
  <line x1="3" y1="6" x2="21" y2="6"></line>
  <path d="M16 10a4 4 0 0 1-8 0"></path>
</svg>`;

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="100%" height="100%">
  <rect width="800" height="400" fill="#1f2937" rx="8" />
  <text x="400" y="190" font-family="sans-serif" font-size="42" font-weight="bold" fill="#ffffff" text-anchor="middle">NEW ARRIVALS</text>
  <text x="400" y="240" font-family="sans-serif" font-size="20" fill="#3b82f6" text-anchor="middle">Explore the Latest Fits &amp; Finishes</text>
</svg>`;

export const assets = {
  present: svgToDataUrl(presentSvg),
  Jeans: svgToDataUrl(jeansLogoSvg),
  star_icon: svgToDataUrl(starSvg),
  star_dull_icon: svgToDataUrl(starDullSvg),
  stripe_logo: svgToDataUrl(stripeSvg),
  razorpay_logo: svgToDataUrl(razorpaySvg),
  bg: svgToDataUrl(bgSvg),
  contact_img: svgToDataUrl(contactSvg),
  dropdown_icon: svgToDataUrl(dropdownSvg),
  bin_icon: svgToDataUrl(binSvg),
  about_img: svgToDataUrl(aboutSvg),
  search: svgToDataUrl(searchSvg),
  cross_icon: svgToDataUrl(crossSvg),
  exchange_icon: svgToDataUrl(exchangeSvg),
  quality_icon: svgToDataUrl(qualitySvg),
  support_img: svgToDataUrl(supportSvg),
  profile: svgToDataUrl(profileSvg),
  Cart: svgToDataUrl(cartSvg),
  banner: svgToDataUrl(bannerSvg),
};

export default assets;
