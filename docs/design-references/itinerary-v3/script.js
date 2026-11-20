/**
 * Visual / interaction prototype only. This is sample data for a presentation,
 * NOT verified businesses, live opening times, real transport estimates or prices.
 * Production: replace `demoTrip` with the app's validated itinerary model.
 */
const demoTrip = {
  destination: 'Quezon City', days: 1, currency: 'PHP', budget: 1500,
  stops: [
    { id: 'coffee', time: '09:00', name: 'Barako Corner Tomas Morato', category: 'Kapehan', description: 'Specialty coffee and local brews', cost: 350, icon: 'coffee', photo: 'assets/coffee.webp', travelAfter: 5 },
    { id: 'ramen', time: '12:00', name: 'Katipunan Ramen House', category: 'Kainan', description: 'Hearty ramen and Japanese favorites', cost: 350, icon: 'food', photo: 'assets/ramen.webp', travelAfter: 9 },
    { id: 'park', time: '15:00', name: 'Quezon Memorial Circle Trails', category: 'Pasyalan', description: 'An afternoon walk and city greenery', cost: 350, icon: 'leaf', photo: 'assets/park.webp', travelAfter: 13 },
    { id: 'night', time: '18:00', name: 'Cubao Expo Night Bites', category: 'Nightlife', description: 'Street food, art, and an evening out', cost: 150, icon: 'moon', photo: 'assets/night.webp', travelAfter: 8 },
    { id: 'brew', time: '20:00', name: 'Sikatuna Slow Brew', category: 'Kapehan', description: 'A cozy last coffee before heading home', cost: 150, icon: 'coffee', photo: 'assets/brew.webp', travelAfter: null },
  ],
};
const fmtMoney = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);
const escapeHTML = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const icon = (id, className = 'icon') => `<svg class="${className}" aria-hidden="true"><use href="#${escapeHTML(id)}"></use></svg>`;
const total = demoTrip.stops.reduce((sum, s) => sum + (typeof s.cost === 'number' ? s.cost : 0), 0);
const remaining = demoTrip.budget - total;
let previouslyFocused = null;

const routeItems = document.getElementById('route-items');
routeItems.innerHTML = demoTrip.stops.map((s, i) => `
  <button class="route-stop" type="button" data-stop="${escapeHTML(s.id)}" aria-label="Open stop ${i + 1}: ${escapeHTML(s.name)}">
    <span class="route-icon">${icon(s.icon)}</span><span class="route-stop-name">${escapeHTML(s.name)}</span>
  </button>
`).join('');

const list = document.getElementById('stop-list');
list.innerHTML = demoTrip.stops.map((s, i) => `
  <li class="stop">
    <div class="stop-side"><span class="time-pill">${escapeHTML(s.time)}</span></div>
    <div class="stop-content">
      <div class="stop-main">
        <img class="stop-thumb" src="${escapeHTML(s.photo)}" alt="" width="76" height="64" loading="lazy">
        <div class="stop-text"><p class="stop-title">${escapeHTML(s.name)}</p><p class="stop-subtitle">${escapeHTML(s.category)} · ${escapeHTML(s.description)}</p></div>
        <div class="stop-controls">
          <span class="stop-price">${s.cost == null ? 'Estimate pending' : fmtMoney(s.cost)}</span>
          <button class="stop-view" type="button" data-stop="${escapeHTML(s.id)}" aria-label="View details for ${escapeHTML(s.name)}">View</button>
          ${icon('chevron', 'icon stop-chevron')}
        </div>
        <button class="mobile-open" type="button" data-stop="${escapeHTML(s.id)}" aria-label="View details for ${escapeHTML(s.name)}"></button>
      </div>
      ${s.travelAfter != null ? `<div class="transfer">${icon('car')} ~${s.travelAfter} min transfer* · estimate only</div>` : ''}
    </div>
  </li>
`).join('');

const meter = document.getElementById('budget-meter');
meter.setAttribute('aria-valuenow', String(Math.min(demoTrip.budget, total)));
meter.setAttribute('aria-valuemax', String(demoTrip.budget));
document.getElementById('meter-fill').style.width = `${Math.min(100, total / demoTrip.budget * 100)}%`;
document.getElementById('budget-total').textContent = fmtMoney(total);
document.getElementById('budget-remain').textContent = remaining >= 0 ? `${fmtMoney(remaining)} remaining before transport` : `${fmtMoney(Math.abs(remaining))} above budget`;
document.getElementById('overview-metrics').innerHTML = [
  ['Stops', String(demoTrip.stops.length)],
  ['Estimated stops', fmtMoney(total)],
  ['Not yet allocated', fmtMoney(Math.max(0,remaining))]
].map(([label,value]) => `<div class="metric"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong></div>`).join('');
document.getElementById('schematic-route').innerHTML = demoTrip.stops.map((s, i) => `<span class="map-step">${i+1}. ${escapeHTML(s.name)}</span>`).join('');

// Three-position layout is preserved from the approved concept. In a real
// multi-day itinerary, Day 1 is a distinct day-selector and map/overview are views.
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(key) {
  for (const tab of tabs) {
    const selected = tab.dataset.view === key;
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    tab.tabIndex = selected ? 0 : -1;
    const pane = document.getElementById('view-' + tab.dataset.view);
    pane.hidden = !selected;
    pane.classList.toggle('active', selected);
  }
  // The schedule is common trip content. It stays visible for Overview and Day.
  // Map hides it to avoid duplicated active views.
  document.querySelector('.schedule').hidden = key === 'map';
}
tabs.forEach((tab,i) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.view));
  tab.addEventListener('keydown', (e) => {
    let next = null;
    if(e.key === 'ArrowRight') next = (i+1) % tabs.length;
    if(e.key === 'ArrowLeft') next = (i+tabs.length-1) % tabs.length;
    if(e.key === 'Home') next = 0;
    if(e.key === 'End') next = tabs.length-1;
    if (next === null) return;
    e.preventDefault(); tabs[next].focus(); selectTab(tabs[next].dataset.view);
  });
});
selectTab('day');

const overlay = document.getElementById('overlay');
const sheet = overlay.querySelector('.sheet');
const sheetTitle = document.getElementById('sheet-title');
const sheetBody = document.getElementById('sheet-body');
const shell = document.querySelector('.shell');
const closeBtn = document.getElementById('close-sheet');
const live = document.getElementById('live-feedback');
function showSheet(title, content) {
  previouslyFocused = document.activeElement;
  sheetTitle.textContent = title;
  sheetBody.innerHTML = content;
  overlay.hidden = false;
  shell.inert = true;
  document.body.style.overflow = 'hidden';
  sheet.focus();
}
function closeSheet() {
  overlay.hidden = true;
  shell.inert = false;
  document.body.style.overflow = '';
  if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
}
closeBtn.addEventListener('click', closeSheet);
overlay.addEventListener('click', e => { if (e.target === overlay) closeSheet(); });
document.addEventListener('keydown', e => {
  if (overlay.hidden) return;
  if (e.key === 'Escape') { closeSheet(); return; }
  if (e.key !== 'Tab') return;
  const focusables = [...sheet.querySelectorAll('button:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')];
  if (!focusables.length) return;
  const first=focusables[0], last=focusables[focusables.length-1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

function openStop(stopId) {
  const s = demoTrip.stops.find(s => s.id === stopId);
  if (!s) return;
  showSheet(s.name, `<img src="${escapeHTML(s.photo)}" alt="Illustration for ${escapeHTML(s.name)}"><p><strong>${escapeHTML(s.time)} · ${escapeHTML(s.category)}</strong></p><p>${escapeHTML(s.description)}</p><p><strong>Illustrative stop budget:</strong> ${s.cost == null ? 'Not available' : fmtMoney(s.cost)}. Confirm actual operating hours, address, pricing and transport before using this itinerary.</p><button type="button" class="sheet-primary" data-demo="swap">Ask AI for an alternative</button><button type="button" class="sheet-secondary" data-demo="directions">Connect directions</button>`);
}
document.addEventListener('click', e => {
  const stopButton = e.target.closest('[data-stop]');
  if (stopButton) { openStop(stopButton.dataset.stop); return; }
  const action = e.target.closest('[data-action]');
  if (action) {
    if (action.dataset.action === 'budget') showSheet('Budget details', `<p>Five example stop estimates total <strong>${fmtMoney(total)}</strong>.</p><p>The <strong>${fmtMoney(remaining)}</strong> difference is unallocated, <em>not</em> guaranteed spending money. Transport, admission changes, additional food and unexpected costs are excluded.</p><p>This is demonstration data; connect your actual price-estimation service and transparent budget model in production.</p>`);
    if (action.dataset.action === 'save') showSheet('Save this itinerary', '<p>Prototype only: connect this button to your app’s authenticated save/persistence flow. Do not claim the itinerary was saved until the backend confirms success.</p>');
    if (action.dataset.action === 'refine') showSheet('What would you change?', `<p>Choose a direction. In production, pass it with the original stay location, budget, days and preferences to your existing AI refinement flow.</p><div class="sheet-choices"><button data-demo="cheaper">Lower the cost</button><button data-demo="local">More local food</button><button data-demo="travel">Less travel</button><button data-demo="later">Start later</button></div>`);
    if (action.dataset.action === 'share') showSheet('Share itinerary', '<p>Prototype only: connect to the application’s Web Share API or copy-link workflow with a real shareable itinerary ID. Do not produce fake URLs.</p>');
    return;
  }
  const demo = e.target.closest('[data-demo]');
  if (demo) {
    const text = demo.dataset.demo === 'directions' ? 'A map provider and verified coordinates are required.' : 'Connect this request to your existing AI refinement workflow; no itinerary data was changed.';
    live.textContent = text;
    showSheet('Integration required', `<p>${escapeHTML(text)}</p>`);
  }
});
