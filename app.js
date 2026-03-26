/* ============================================================
   ClassLink – Smart Timetable Agent | app.js
   ============================================================ */

// ── Hardcoded Gemini API Key ──
const API_KEY = 'AIzaSyDy-O8nhBn1R89YFuza8xusg3_UyjMBAJ8';

// ── Room → Google Meet link mapping (provided by university) ──
const ROOM_LINKS = {
  // Lecture Halls
  "lh-01": "http://meet.google.com/oek-nnwn-hja",
  "lh-02": "http://meet.google.com/bhy-tngo-gkn",
  "lh-03": "http://meet.google.com/umq-pagc-cou",
  "lh-04": "http://meet.google.com/vfg-tyxa-wgz",
  "lh-05": "http://meet.google.com/uts-dric-kxw",
  "lh-06": "http://meet.google.com/yvb-gtaz-mvd",
  "lh-08": "http://meet.google.com/nkx-qpsh-ntc",
  "lh-09": "http://meet.google.com/omw-viii-jyh",
  "lh-10": "http://meet.google.com/zzv-gxgh-seu",
  "lh-11": "http://meet.google.com/mhv-phxh-dqz",
  "lh-12": "http://meet.google.com/pkf-hwac-kvi",
  // Alternative aliases (Room 1, Room 2 …)
  "room 1":  "http://meet.google.com/oek-nnwn-hja",
  "room 2":  "http://meet.google.com/bhy-tngo-gkn",
  "room 3":  "http://meet.google.com/umq-pagc-cou",
  "room 4":  "http://meet.google.com/vfg-tyxa-wgz",
  "room 5":  "http://meet.google.com/uts-dric-kxw",
  "room 6":  "http://meet.google.com/yvb-gtaz-mvd",
  "room 8":  "http://meet.google.com/nkx-qpsh-ntc",
  "room 9":  "http://meet.google.com/omw-viii-jyh",
  "room 10": "http://meet.google.com/zzv-gxgh-seu",
  "room 11": "http://meet.google.com/mhv-phxh-dqz",
  "room 12": "http://meet.google.com/pkf-hwac-kvi",
  // Labs
  "call lab":                     "https://meet.google.com/oqc-mngs-ysk",
  "mehboob-ul haq":               "https://meet.google.com/mka-ujsu-tpm",
  "mehboob ul haq":               "https://meet.google.com/mka-ujsu-tpm",
  "pc lab":                       "https://meet.google.com/mka-ujsu-tpm",
  "mehboob":                      "https://meet.google.com/mka-ujsu-tpm",
  "agha hassan abedi":            "https://meet.google.com/fia-bmnv-owi",
  "agha hassan":                  "https://meet.google.com/fia-bmnv-owi",
  "khyber lab":                   "https://meet.google.com/zyi-ewji-imz",
  "khyber":                       "https://meet.google.com/zyi-ewji-imz",
  "syed rafaqat hussain":         "https://meet.google.com/kcm-iayn-byp",
  "rafaqat":                      "https://meet.google.com/kcm-iayn-byp",
  "digital logic design lab":     "https://meet.google.com/bcj-fojp-guh",
  "digital logic":                "https://meet.google.com/bcj-fojp-guh",
  "control systems lab":          "https://meet.google.com/ium-peqj-yjy",
  "control systems":              "https://meet.google.com/ium-peqj-yjy",
  "embedded systems lab":         "https://meet.google.com/xtr-btoc-toa",
  "embedded systems":             "https://meet.google.com/xtr-btoc-toa",
  "microwave & antenna lab":      "https://meet.google.com/ypd-brpt-jgg",
  "microwave and antenna lab":    "https://meet.google.com/ypd-brpt-jgg",
  "microwave":                    "https://meet.google.com/ypd-brpt-jgg",
  "hall a":                       "https://meet.google.com/ffq-hued-hes",
  "hal":                          "https://meet.google.com/ffq-hued-hes",
};

// ── App State ──
let timetableData = [];   // array of { day, startTime, endTime, courseName, courseCode, teacher, room, meetLink }
let imageBase64 = null;
let currentFilter = 'all';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// ── On load ──
window.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadSavedKey();
  loadSavedTimetable();
  setupDragDrop();
});

// ── Clock ──
function startClock() {
  function tick() {
    const now = new Date();
    document.getElementById('live-clock').textContent =
      now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    document.getElementById('live-date').textContent =
      now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    highlightActiveClass();
  }
  tick();
  setInterval(tick, 1000);
}

// ── Tab navigation ──
function showTab(tab) {
  document.getElementById('page-setup').classList.toggle('active', tab === 'setup');
  document.getElementById('page-dashboard').classList.toggle('active', tab === 'dashboard');
  document.getElementById('tab-setup').classList.toggle('active', tab === 'setup');
  document.getElementById('tab-dashboard').classList.toggle('active', tab === 'dashboard');
  if (tab === 'dashboard') renderDashboard();
}

// ── API Key ──
function loadSavedKey() { /* key is hardcoded */ }
function toggleKeyVisibility() {}
function getApiKey() { return API_KEY; }

// ── Image upload / drag-drop ──
function setupDragDrop() {
  const zone = document.getElementById('upload-zone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  });
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    // Show preview
    const preview = document.getElementById('preview-img');
    preview.src = dataUrl;
    preview.style.display = 'block';
    document.getElementById('upload-placeholder').style.display = 'none';
    // Store base64 (strip prefix)
    imageBase64 = dataUrl.split(',')[1];
    document.getElementById('parse-btn').disabled = false;
  };
  reader.readAsDataURL(file);
}

// ── Parse timetable with Gemini ──
async function parseTimetable() {
  const apiKey = getApiKey();
  if (!imageBase64) {
    showStatus('Please upload a timetable image first.', 'error');
    return;
  }

  setBtnLoading(true);
  showStatus('🤖 Sending image to Gemini AI — this may take 10–20 seconds…', 'info');

  const prompt = `You are an OCR and data extraction assistant.
Analyze this university timetable image and extract ALL class entries.
For each class slot, return a JSON array where each object has these exact fields:
{
  "day": "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat",
  "startTime": "HH:MM" (24-hour),
  "endTime": "HH:MM" (24-hour),
  "courseName": "Full course name",
  "courseCode": "Course code like CS101 or empty string",
  "teacher": "Teacher/instructor name or empty string",
  "room": "Room or lab name exactly as written in the timetable"
}

Rules:
- Use 24-hour time format (e.g., 08:00, 13:30).
- Extract the room/venue name exactly as it appears (e.g., "Room 4", "Khyber Lab", "LH-01", "HAL").
- If a cell spans multiple rows/columns, repeat the entry for each time slot.
- Return ONLY a valid JSON array, no markdown fences, no extra text.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON — strip any accidental markdown fences
    let jsonStr = rawText.trim();
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('No class entries found in the image.');

    // Match rooms → Meet links
    timetableData = parsed.map(entry => ({
      ...entry,
      meetLink: resolveMeetLink(entry.room)
    }));

    // Persist
    localStorage.setItem('classlink_timetable', JSON.stringify(timetableData));

    const matched = timetableData.filter(e => e.meetLink).length;
    showStatus(
      `✅ Successfully extracted <strong>${timetableData.length}</strong> class slots — <strong>${matched}</strong> matched with Meet links.`,
      'success'
    );
    setBtnLoading(false);

    // Switch to dashboard after short delay
    setTimeout(() => showTab('dashboard'), 1200);

  } catch (err) {
    showStatus(`❌ Error: ${err.message}`, 'error');
    setBtnLoading(false);
  }
}

// ── Room → Meet Link resolver ──
function resolveMeetLink(room) {
  if (!room) return null;
  const normalized = room.toLowerCase().trim();

  // Direct match
  if (ROOM_LINKS[normalized]) return ROOM_LINKS[normalized];

  // Fuzzy: check if any key is contained in normalized or vice versa
  for (const [key, link] of Object.entries(ROOM_LINKS)) {
    if (normalized.includes(key) || key.includes(normalized)) return link;
  }

  // Pattern: "Room N" → LH-0N
  const roomNumMatch = normalized.match(/room\s*(\d+)/);
  if (roomNumMatch) {
    const num = roomNumMatch[1].padStart(2, '0');
    const lhKey = `lh-${num}`;
    if (ROOM_LINKS[lhKey]) return ROOM_LINKS[lhKey];
  }

  return null;
}

// ── Load saved timetable ──
function loadSavedTimetable() {
  const saved = localStorage.getItem('classlink_timetable');
  if (saved) {
    try { timetableData = JSON.parse(saved); } catch { timetableData = []; }
  }
}

// ── Dashboard rendering ──
function renderDashboard() {
  const grid = document.getElementById('schedule-grid');
  const empty = document.getElementById('empty-state');

  if (!timetableData || timetableData.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // 'Mon', 'Tue' …

  // Filter by selected day
  const daysToShow = currentFilter === 'all' ? DAYS : [currentFilter];

  grid.innerHTML = '';
  for (const day of daysToShow) {
    const slots = timetableData
      .filter(e => e.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (slots.length === 0) continue;

    const col = document.createElement('div');
    col.className = 'day-column';
    col.dataset.day = day;

    const isToday = day === today;
    col.innerHTML = `
      <div class="day-header">
        ${day}${isToday ? '<span class="today-badge">TODAY</span>' : ''}
      </div>
    `;

    for (const slot of slots) {
      const active = isToday && isSlotActive(slot.startTime, slot.endTime);
      const linkHtml = slot.meetLink
        ? `<a class="join-btn" href="${slot.meetLink}" target="_blank" rel="noopener">
             📹 Join
           </a>`
        : `<span class="no-link-btn" title="No room link found">🔗 No link</span>`;

      const card = document.createElement('div');
      card.className = `class-card${active ? ' active-now' : ''}`;
      card.dataset.start = slot.startTime;
      card.dataset.end = slot.endTime;
      card.dataset.day = day;

      card.innerHTML = `
        <div class="class-info">
          <div class="class-time">
            🕐 ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}
            ${active ? '<span class="active-badge">LIVE</span>' : ''}
          </div>
          <div class="class-name" title="${slot.courseName}">
            ${slot.courseCode ? `<span style="color:var(--accent);margin-right:6px">${slot.courseCode}</span>` : ''}${slot.courseName}
          </div>
          <div class="class-room">📍 ${slot.room}${slot.teacher ? ` &nbsp;·&nbsp; 👤 ${slot.teacher}` : ''}</div>
        </div>
        ${linkHtml}
      `;
      col.appendChild(card);
    }
    grid.appendChild(col);
  }
}

// ── Highlight active class (called every second) ──
function highlightActiveClass() {
  if (!timetableData.length) return;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  document.querySelectorAll('.class-card').forEach(card => {
    const day = card.dataset.day;
    const active = day === today && isSlotActive(card.dataset.start, card.dataset.end);
    card.classList.toggle('active-now', active);
    const badge = card.querySelector('.active-badge');
    if (active && !badge) {
      const timeDiv = card.querySelector('.class-time');
      timeDiv.insertAdjacentHTML('beforeend', '<span class="active-badge">LIVE</span>');
    } else if (!active && badge) {
      badge.remove();
    }
  });
}

// ── Day filter ──
function filterDay(day) {
  currentFilter = day;
  document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
  document.getElementById(day === 'all' ? 'pill-all' : `pill-${day}`).classList.add('active');
  renderDashboard();
}

// ── Helpers ──
function isSlotActive(startTime, endTime) {
  const now = new Date();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= sh * 60 + sm && nowMins < eh * 60 + em;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function showStatus(msg, type) {
  const box = document.getElementById('status-box');
  box.innerHTML = msg;
  box.className = `status-box ${type}`;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setBtnLoading(loading) {
  document.getElementById('parse-btn').disabled = loading;
  document.getElementById('parse-btn-text').style.display = loading ? 'none' : 'inline';
  document.getElementById('parse-spinner').style.display = loading ? 'inline-block' : 'none';
}
