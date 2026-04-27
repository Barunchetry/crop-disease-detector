// ============================================
// CROP DISEASE DETECTOR — MAIN JS
// ============================================

const API = 'php/';

// ---- STATE ----
let currentUser = null;
let selectedFile = null;
let currentDetectionId = null;
let activeTab = 'symptoms';

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadCrops();
  loadDiseaseLibrary();
  loadTips();
  loadStats();
  initUploadZone();
  initScrollAnimations();
  initNavHighlight();
});

// ============================================
// SESSION CHECK
// ============================================
async function checkSession() {
  try {
    const res = await post('auth.php', { action: 'check' });
    if (res.success) {
      setLoggedIn(res.name);
    }
  } catch(e) {}
}

function setLoggedIn(name) {
  currentUser = name;
  document.getElementById('navAuth').innerHTML = `
    <span style="color:rgba(245,240,232,0.6);font-size:0.85rem;padding:7px 12px;">👤 ${name}</span>
    <button class="btn-nav outline" onclick="logout()">Logout</button>
  `;
}

async function logout() {
  await post('auth.php', { action: 'logout' });
  currentUser = null;
  document.getElementById('navAuth').innerHTML = `
    <button class="btn-nav outline" onclick="openModal('login')">Login</button>
    <button class="btn-nav solid" onclick="openModal('register')">Register</button>
  `;
  showToast('Logged out successfully');
}

// ============================================
// UPLOAD ZONE
// ============================================
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) handleFile(input.files[0]);
  });
}

function handleFile(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showToast('Please upload a JPG, PNG, or WebP image', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be under 5MB', 'error');
    return;
  }
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('previewImg');
    img.src = e.target.result;
    img.style.display = 'block';
    document.getElementById('uploadPlaceholder').style.display = 'none';
  };
  reader.readAsDataURL(file);

  document.getElementById('analyzeBtn').disabled = false;
  showToast('Image loaded — select crop and click Analyze!');
}

// ============================================
// ANALYZE
// ============================================
async function analyze() {
  if (!selectedFile) { showToast('Please upload an image first', 'error'); return; }

  const crop = document.getElementById('cropSelect').value;
  if (!crop) { showToast('Please select a crop type', 'error'); return; }

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="loader" style="width:20px;height:20px;border-width:2px"></span> Analyzing...`;

  showResultLoading();

  const formData = new FormData();
  formData.append('action', 'analyze');
  formData.append('image', selectedFile);
  formData.append('crop', crop);
  formData.append('location', 'Assam, India');

  try {
    const res = await fetch(API + 'detect.php', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      currentDetectionId = data.detection_id;
      renderResult(data);
      showToast('Analysis complete! Scroll down to see results.');
    } else {
      showResultError(data.message);
      showToast(data.message, 'error');
    }
  } catch(e) {
    showResultError('Server error. Make sure XAMPP is running.');
    showToast('Connection error', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = `🔬 Analyze Crop`;
}

function showResultLoading() {
  document.getElementById('resultPanel').innerHTML = `
    <div style="text-align:center;padding:3rem;color:#9ca3af">
      <div class="spinner" style="margin:0 auto 1.25rem"></div>
      <p style="font-weight:600;color:#374151">Scanning image...</p>
      <p style="font-size:.82rem;margin-top:.35rem">This may take a few seconds</p>
    </div>
  `;
}

function showResultError(msg) {
  document.getElementById('resultPanel').innerHTML = `
    <div style="text-align:center;padding:3rem;color:#9ca3af">
      <div style="font-size:2.5rem;margin-bottom:1rem">⚠️</div>
      <p style="color:#dc2626;font-weight:600;font-size:.9rem">${msg}</p>
    </div>
  `;
}

function renderResult(data) {
  const d = data.disease;
  const conf = data.confidence;
  const sevMap = { Low:'sev-low', Medium:'sev-medium', High:'sev-high', Critical:'sev-critical' };
  const sevClass = sevMap[d.severity] || 'sev-medium';

  document.getElementById('resultPanel').innerHTML = `
    <div class="result-content">
      <div class="result-header">
        <div class="dis-icon">🦠</div>
        <div style="flex:1">
          <h3>${d.disease_name}</h3>
          <p style="font-size:.78rem;color:#9ca3af;margin-top:3px">
            ${d.crop_name || data.crop} &nbsp;·&nbsp;
            <span class="badge-sev ${sevClass}">${d.severity} Severity</span>
          </p>
        </div>
      </div>

      <div class="confidence-bar">
        <div class="cb-labels">
          <span>AI Confidence</span>
          <span class="cb-val">${conf}%</span>
        </div>
        <div class="cb-track">
          <div class="cb-fill" id="confBar" style="width:0%"></div>
        </div>
      </div>

      <div class="result-tabs">
        <button class="result-tab active" onclick="switchTab('symptoms')">Symptoms</button>
        <button class="result-tab" onclick="switchTab('treatment')">Treatment</button>
        <button class="result-tab" onclick="switchTab('remedy')">Remedies</button>
        <button class="result-tab" onclick="switchTab('prevent')">Prevention</button>
      </div>

      <div id="tab-symptoms" class="tab-content active">
        <h4>Observed Symptoms</h4>
        <p>${d.symptoms}</p>
        ${d.cause ? `<h4>Cause</h4><p>${d.cause}</p>` : ''}
      </div>

      <div id="tab-treatment" class="tab-content">
        <h4>Recommended Treatment</h4>
        <p>${d.treatment}</p>
      </div>

      <div id="tab-remedy" class="tab-content">
        <div class="remedy-box organic">
          <h5>🌿 Organic Remedy</h5>
          <p>${d.organic_remedy || 'Neem oil spray (2%) every 7 days as a preventive measure.'}</p>
        </div>
        <div class="remedy-box chemical">
          <h5>⚗️ Chemical Treatment</h5>
          <p>${d.chemical_remedy || 'Consult a licensed agrochemical dealer for appropriate treatment.'}</p>
        </div>
      </div>

      <div id="tab-prevent" class="tab-content">
        <h4>Prevention Measures</h4>
        <p>${d.prevention || 'Practice crop rotation. Use certified disease-free seeds. Maintain field hygiene.'}</p>
      </div>

      <div class="result-feedback">
        <button class="fb-acc" onclick="submitFeedback(1)">✅ Accurate</button>
        <button class="fb-rej" onclick="submitFeedback(0)">❌ Not Accurate</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const bar = document.getElementById('confBar');
    if (bar) bar.style.width = conf + '%';
  }, 100);
}

function switchTab(tab) {
  document.querySelectorAll('.result-tab').forEach((t, i) => {
    const tabs = ['symptoms','treatment','remedy','prevent'];
    t.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === 'tab-' + tab);
  });
}

async function submitFeedback(accurate) {
  if (!currentDetectionId) return;
  await post('detect.php', {
    action: 'feedback',
    detection_id: currentDetectionId,
    accurate: accurate,
    rating: accurate ? 5 : 2
  });
  showToast(accurate ? 'Thanks for confirming! 🌱' : 'Thanks for the feedback — it helps us improve!');
}

// ============================================
// LOAD CROPS
// ============================================
async function loadCrops() {
  try {
    const res = await get('detect.php?action=crops');
    const sel = document.getElementById('cropSelect');
    sel.innerHTML = '<option value="">-- Select Crop Type --</option>';
    res.crops.forEach(c => {
      sel.innerHTML += `<option value="${c.name}">${c.icon} ${c.name} (${c.local_name})</option>`;
    });
  } catch(e) {}
}

// ============================================
// DISEASE LIBRARY
// ============================================
async function loadDiseaseLibrary() {
  try {
    const db_url = 'detect.php?action=diseases&crop_id=0'; 
    // Load all diseases by fetching per crop
    const cropsRes = await get('detect.php?action=crops');
    const grid = document.getElementById('diseaseGrid');
    grid.innerHTML = '';

    for (const crop of cropsRes.crops.slice(0, 4)) {
      const res = await get(`detect.php?action=diseases&crop_id=${crop.id}`);
      res.diseases.forEach(d => {
        const sevMap = { Low:'sev-low', Medium:'sev-medium', High:'sev-high', Critical:'sev-critical' };
        grid.innerHTML += `
          <div class="disease-card fade-up">
            <div class="dc-top">
              <div class="dc-icon">${crop.icon}</div>
              <div>
                <h3>${d.disease_name}</h3>
                <div class="dc-meta">
                  ${crop.name} &nbsp;·&nbsp;
                  <span class="badge-sev ${sevMap[d.severity] || 'sev-medium'}">${d.severity}</span>
                </div>
              </div>
            </div>
            <div class="dc-body">
              <p>${d.symptoms.substring(0, 110)}...</p>
            </div>
          </div>
        `;
      });
    }

    // Re-trigger animations
    setTimeout(initScrollAnimations, 100);
  } catch(e) {
    document.getElementById('diseaseGrid').innerHTML = '<p style="color:var(--muted);text-align:center">Connect to XAMPP to load disease library.</p>';
  }
}

// ============================================
// TIPS
// ============================================
async function loadTips() {
  try {
    // Hardcoded for performance — would come from DB in production
    const tips = [
      { season: 'All Season', title: 'Early Morning Inspection', content: 'Walk your fields every morning. Diseases spread fastest at night. Early detection can save 80% of your crop.' },
      { season: 'All Season', title: 'The 5-Plant Rule', content: 'Check at least 5 random plants across your field. One sick plant in a corner means many more are affected nearby.' },
      { season: 'Kharif / Monsoon', title: 'Spray Schedule', content: 'Preventive fungicide spray every 10–12 days during monsoon is crucial. Do not skip even if plants look healthy.' },
      { season: 'Organic', title: 'Neem Oil Mix', content: 'Mix 5ml neem oil + 2ml soap + 1L water. Spray in evenings. Works against 200+ pests and fungal diseases.' }
    ];
    const grid = document.getElementById('tipsGrid');
    grid.innerHTML = tips.map(t => `
      <div class="tip-card fade-up">
        <div class="tip-season">${t.season}</div>
        <h3>${t.title}</h3>
        <p>${t.content}</p>
      </div>
    `).join('');
    setTimeout(initScrollAnimations, 100);
  } catch(e) {}
}

// ============================================
// STATS
// ============================================
async function loadStats() {
  try {
    const res = await get('detect.php?action=stats');
    if (res.success) {
      document.getElementById('statScans').textContent = res.total_scans + '+';
      document.getElementById('statUsers').textContent = res.total_users + '+';
      document.getElementById('statDiseases').textContent = res.diseases_in_db + '+';
    }
  } catch(e) {
    // Defaults already in HTML
  }
}

// ============================================
// AUTH MODAL
// ============================================
function openModal(tab) {
  document.getElementById('authModal').classList.add('open');
  switchModalTab(tab);
}
function closeModal() {
  document.getElementById('authModal').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function switchModalTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('loginForm').style.display   = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function submitLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;
  const msg      = document.getElementById('loginMsg');

  msg.textContent = 'Signing in...'; msg.className = 'form-msg';
  const res = await post('auth.php', { action: 'login', email, password });

  if (res.success) {
    msg.textContent = res.message; msg.className = 'form-msg success';
    setLoggedIn(res.name);
    setTimeout(closeModal, 800);
  } else {
    msg.textContent = res.message; msg.className = 'form-msg error';
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('regName').value;
  const email    = document.getElementById('regEmail').value;
  const phone    = document.getElementById('regPhone').value;
  const location = document.getElementById('regLocation').value;
  const password = document.getElementById('regPass').value;
  const msg      = document.getElementById('registerMsg');

  msg.textContent = 'Creating account...'; msg.className = 'form-msg';
  const res = await post('auth.php', { action: 'register', name, email, phone, location, password });

  if (res.success) {
    msg.textContent = res.message; msg.className = 'form-msg success';
    setLoggedIn(res.name);
    setTimeout(closeModal, 800);
  } else {
    msg.textContent = res.message; msg.className = 'form-msg error';
  }
}

// ============================================
// UTILITIES
// ============================================
async function post(endpoint, data) {
  const body = new URLSearchParams(data);
  const res  = await fetch(API + endpoint, { method: 'POST', body });
  return res.json();
}

async function get(path) {
  const res = await fetch(API + path);
  return res.json();
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type === 'error' ? 'error show' : 'show';
  setTimeout(() => t.classList.remove('show'), 3500);
}function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  });
}

function scrollToScanner() {
  document.getElementById('scanner').scrollIntoView({ behavior: 'smooth' });
}