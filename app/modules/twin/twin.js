/**
 * Twin Module – Facility Launch Page
 *
 * Polished landing page for the Digital Twin module.
 * Tandem blocks iframe embedding (X-Frame-Options: DENY),
 * so instead we present a clean facility info card with a
 * prominent launch button that opens Tandem in a new tab.
 *
 * Features:
 * - Facility info card pulled from config
 * - Deep-link support: if arriving from a QR scan with
 *   ?asset=...&tandem=... params, shows asset-specific card
 * - Quick action links to other platform modules
 */

const TANDEM_BASE = 'https://tandem.autodesk.com/pages/facilities';

export async function render(root, cfg) {
  // Load the HTML template
  root.innerHTML = await (await fetch('./modules/twin/twin.html', { cache: 'no-store' })).text();

  const facilityId = parseFacilityId(cfg.defaultFacilityUrn);
  const tandemUrl  = facilityId ? `${TANDEM_BASE}/${facilityId}` : null;

  // ── Populate facility info ──
  const urnDisplay = root.querySelector('#twin-facility-urn');
  if (cfg.defaultFacilityUrn) {
    urnDisplay.textContent = cfg.defaultFacilityUrn;
  }

  // ── Wire launch button ──
  const launchBtn = root.querySelector('#twin-launch-btn');
  if (tandemUrl) {
    launchBtn.href = tandemUrl;
  } else {
    launchBtn.style.opacity = '0.5';
    launchBtn.style.pointerEvents = 'none';
    root.querySelector('#twin-status-text').textContent = 'No Facility Configured';
  }

  // ── Wire Help Center link ──
  const helpLink = root.querySelector('#twin-action-help');
  helpLink.href = cfg.portalUrl || '../index.html';

  // ── Deep-link from QR scan ──
  checkDeepLink();

  function checkDeepLink() {
    const params    = new URLSearchParams(window.location.search);
    const assetId   = params.get('asset');
    const tandemLink = params.get('tandem');

    if (!assetId) return;

    const card = root.querySelector('#twin-deeplink');
    card.classList.add('visible');

    root.querySelector('#twin-dl-asset').textContent = assetId;
    root.querySelector('#twin-dl-url').textContent = tandemLink || 'No direct link available';

    const dlBtn = root.querySelector('#twin-dl-btn');
    if (tandemLink) {
      dlBtn.href = tandemLink;
    } else if (tandemUrl) {
      dlBtn.href = tandemUrl;
      dlBtn.textContent = 'Open Facility in Tandem ↗';
    } else {
      dlBtn.style.display = 'none';
    }
  }

  function parseFacilityId(urn) {
    if (!urn) return null;
    const parts = urn.split(':');
    return parts[parts.length - 1] || null;
  }
}
