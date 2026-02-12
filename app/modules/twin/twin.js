/**
 * Twin Module – Tandem Facility Viewer (iframe embed)
 *
 * Embeds the Autodesk Tandem web viewer in an iframe.
 * Auth is handled by Tandem's own login flow inside the iframe.
 * Deep-link params from QR scans are supported.
 */

const TANDEM_BASE = 'https://tandem.autodesk.com/pages/facilities';

export async function render(root, cfg) {
  root.innerHTML = await (await fetch('./modules/twin/twin.html', { cache: 'no-store' })).text();

  const status    = root.querySelector('#status');
  const viewerDiv = root.querySelector('#tandem-viewer');
  const loadBtn   = root.querySelector('#load-default');

  loadBtn.style.display = cfg.defaultFacilityUrn ? 'inline-block' : 'none';
  loadBtn.onclick = () => loadFacility(cfg.defaultFacilityUrn);

  // Auto-load if configured
  if (cfg.defaultFacilityUrn) loadBtn.click();

  function parseFacilityId(urn) {
    if (!urn) return null;
    const parts = urn.split(':');
    return parts[parts.length - 1] || null;
  }

  function buildTandemUrl(facilityId) {
    let url = `${TANDEM_BASE}/${facilityId}`;
    const params = new URLSearchParams(window.location.search);
    const tandemLink = params.get('tandem');
    if (tandemLink) return tandemLink;
    return url;
  }

  function loadFacility(urn) {
    const facilityId = parseFacilityId(urn);
    if (!facilityId) {
      status.textContent = '\u26a0 No facility URN configured';
      return;
    }

    status.textContent = 'Loading Tandem viewer\u2026';
    viewerDiv.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src             = buildTandemUrl(facilityId);
    iframe.style.width     = '100%';
    iframe.style.height    = '100%';
    iframe.style.border    = 'none';
    iframe.style.borderRadius = '0 0 16px 16px';
    iframe.allow           = 'fullscreen';
    iframe.title           = 'Autodesk Tandem \u2013 Facility Viewer';

    iframe.onload = () => {
      status.textContent = '';
      loadBtn.textContent = '\u21bb Reload Facility';
    };

    iframe.onerror = () => {
      status.textContent = '\u26a0 Could not load Tandem viewer';
      showFallback(facilityId);
    };

    viewerDiv.appendChild(iframe);

    // Fallback: if Tandem blocks iframe via X-Frame-Options
    setTimeout(() => {
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body && doc.body.innerHTML === '') {
          showFallback(facilityId);
        }
      } catch (e) {
        // Cross-origin block = Tandem loaded successfully
        status.textContent = '';
      }
    }, 5000);
  }

  function showFallback(facilityId) {
    const url = `${TANDEM_BASE}/${facilityId}`;
    viewerDiv.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  height:100%;gap:1rem;color:#64748b;text-align:center;padding:2rem">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#0f172a,#334155);
                    display:flex;align-items:center;justify-content:center;margin-bottom:0.5rem">
          <svg width="36" height="36" fill="none" stroke="#2dd4bf" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
          </svg>
        </div>
        <p style="font-size:1.1rem;font-weight:500;color:#334155">
          Tandem\u2019s viewer couldn\u2019t be embedded directly.
        </p>
        <p style="font-size:0.9rem;max-width:420px;line-height:1.5">
          This can happen due to browser security policies.
          You can open the full 3D viewer in a new tab instead.
        </p>
        <a href="${url}" target="_blank" rel="noopener"
           style="padding:.75rem 1.5rem;background:linear-gradient(135deg,#0f172a,#334155);
                  color:#2dd4bf;border-radius:10px;text-decoration:none;font-weight:600">
          Open Tandem in New Tab \u2197
        </a>
        <p style="font-size:.8rem;color:#94a3b8;max-width:400px">
          Tip: Keep this platform open alongside the Tandem tab for a side-by-side workflow.
        </p>
      </div>`;
    status.textContent = '';
  }
}
