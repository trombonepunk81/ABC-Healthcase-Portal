/**
 * QR Admin Module – QR Code Generator
 *
 * Embeds the standalone qr-generator.html in an iframe.
 * This preserves the fully-tested 1200+ line generator
 * (with all CDN libraries, filter UI, PDF export, etc.)
 * without the risk of breaking it during modularization.
 *
 * The standalone file continues to work on its own too,
 * so maintenance staff who bookmarked it aren't affected.
 */

export async function render(root, cfg) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 3rem)">
      <div style="padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:0.75rem">
        <span style="font-weight:600;font-size:0.95rem;color:#1e293b">🔧 QR Code Generator</span>
        <a href="../qr-generator.html" target="_blank" rel="noopener"
           style="margin-left:auto;font-size:0.8rem;color:#64748b;text-decoration:none;
                  padding:0.35rem 0.75rem;border:1px solid #e2e8f0;border-radius:6px;
                  transition:all 0.2s">
          Open in New Tab ↗
        </a>
      </div>
      <iframe
        src="../qr-generator.html"
        style="flex:1;border:none;border-radius:0 0 16px 16px;min-height:400px"
        title="QR Code Generator"
      ></iframe>
    </div>`;
}
