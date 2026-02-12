/**
 * QR Portal Module – Asset Browser & QR Link Tester
 *
 * Loads assets from the Tandem Connect pipeline (assets.json)
 * and displays them in a searchable, filterable table.
 * Admins can test QR scan links and jump to Tandem directly.
 */

const categoryNames = {
  'Q.SD': 'Security Device',
  'M.Eq': 'Mechanical Equipment',
  'E.Eq': 'Electrical Equipment',
  'B.Do': 'Door',
  'P.Eq': 'Plumbing Equipment',
  'F.Eq': 'Fire Protection'
};

function getCategoryName(code) {
  return categoryNames[code] || code || '(No Category)';
}

export async function render(root, cfg) {
  // Load the HTML template
  root.innerHTML = await (await fetch('./modules/qr/portal.html', { cache: 'no-store' })).text();

  const portalUrl  = cfg.portalUrl  || '../index.html';
  const assetsUrl  = cfg.assetsJson || '../data/assets.json';

  let allAssets = [];
  let activeCategory = null; // null = all

  try {
    const res  = await fetch(assetsUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    allAssets  = data.assets || [];

    // Hide loading, show content
    root.querySelector('#qr-loading').style.display = 'none';
    root.querySelector('#qr-loaded').style.display  = 'block';

    // Stats
    root.querySelector('#qr-total-count').textContent = allAssets.length + ' assets';

    // Build category chips
    buildCategoryChips();

    // Wire search
    const searchInput = root.querySelector('#qr-search');
    searchInput.addEventListener('input', () => renderTable());

    // Initial render
    renderTable();

  } catch (err) {
    root.querySelector('#qr-loading').style.display = 'none';
    root.querySelector('#qr-error').style.display   = 'block';
    root.querySelector('#qr-error-msg').textContent  = err.message;
  }

  // ── Build category filter chips ──
  function buildCategoryChips() {
    const cats = new Map();
    allAssets.forEach(a => {
      const c = a.category || '';
      cats.set(c, (cats.get(c) || 0) + 1);
    });

    const container = root.querySelector('#qr-category-chips');
    container.innerHTML = '';

    // "All" chip
    const allChip = document.createElement('button');
    allChip.className = 'qr-chip active';
    allChip.textContent = 'All (' + allAssets.length + ')';
    allChip.onclick = () => {
      activeCategory = null;
      updateChipStates();
      renderTable();
    };
    container.appendChild(allChip);

    // Per-category chips
    Array.from(cats.entries())
      .sort((a, b) => getCategoryName(a[0]).localeCompare(getCategoryName(b[0])))
      .forEach(([code, count]) => {
        const chip = document.createElement('button');
        chip.className = 'qr-chip';
        chip.setAttribute('data-cat', code);
        chip.textContent = getCategoryName(code) + ' (' + count + ')';
        chip.onclick = () => {
          activeCategory = code;
          updateChipStates();
          renderTable();
        };
        container.appendChild(chip);
      });
  }

  function updateChipStates() {
    root.querySelectorAll('.qr-chip').forEach(c => {
      const cat = c.getAttribute('data-cat');
      if (activeCategory === null) {
        c.classList.toggle('active', cat === null);
      } else {
        c.classList.toggle('active', cat === activeCategory);
      }
    });
  }

  // ── Render the asset table ──
  function renderTable() {
    const query = (root.querySelector('#qr-search').value || '').toLowerCase().trim();
    const tbody = root.querySelector('#qr-asset-tbody');
    const noResults = root.querySelector('#qr-no-results');
    const tableWrap = root.querySelector('.qr-table-wrap');
    tbody.innerHTML = '';

    const filtered = allAssets.filter(a => {
      // Category filter
      if (activeCategory !== null && (a.category || '') !== activeCategory) return false;
      // Search filter
      if (query) {
        const haystack = [a.assetId, a.category, getCategoryName(a.category), a.level, a.room]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    root.querySelector('#qr-showing-count').textContent = 'Showing ' + filtered.length;

    if (filtered.length === 0) {
      tableWrap.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }
    tableWrap.style.display = 'block';
    noResults.style.display = 'none';

    filtered.forEach(asset => {
      const tr = document.createElement('tr');

      // Asset ID
      const tdId = document.createElement('td');
      tdId.innerHTML = '<strong style="color:#0f172a">' + escHtml(asset.assetId) + '</strong>';
      tr.appendChild(tdId);

      // Category
      const tdCat = document.createElement('td');
      if (asset.category) {
        tdCat.innerHTML = '<span class="qr-asset-meta cat">' + escHtml(getCategoryName(asset.category)) + '</span>';
      } else {
        tdCat.textContent = '—';
      }
      tr.appendChild(tdCat);

      // Level
      const tdLev = document.createElement('td');
      tdLev.textContent = asset.level || '—';
      tr.appendChild(tdLev);

      // Room
      const tdRoom = document.createElement('td');
      tdRoom.textContent = asset.room || '—';
      tr.appendChild(tdRoom);

      // Actions
      const tdAct = document.createElement('td');
      tdAct.style.textAlign = 'right';
      tdAct.style.whiteSpace = 'nowrap';

      if (asset.assetUrl) {
        // Test QR link (opens Help Center with params)
        const testBtn = document.createElement('a');
        testBtn.className = 'qr-link-btn test';
        testBtn.href = portalUrl + '?asset=' + encodeURIComponent(asset.assetId) +
                        '&tandem=' + encodeURIComponent(asset.assetUrl);
        testBtn.target = '_blank';
        testBtn.innerHTML = '&#x1f50d; Test QR';
        tdAct.appendChild(testBtn);

        tdAct.appendChild(document.createTextNode(' '));

        // Direct Tandem link
        const tanBtn = document.createElement('a');
        tanBtn.className = 'qr-link-btn tandem';
        tanBtn.href = asset.assetUrl;
        tanBtn.target = '_blank';
        tanBtn.innerHTML = '&#x1f517; Tandem';
        tdAct.appendChild(tanBtn);
      } else {
        tdAct.innerHTML = '<span style="font-size:0.75rem;color:#94a3b8">No URL</span>';
      }

      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
  }

  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
}
