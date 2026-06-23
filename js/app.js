// ═══════════════════════════════════════
// FATIMA NURSING COLLEGE — MAIN APP
// ═══════════════════════════════════════

// ── STATE ──────────────────────────────
let currentPage = 'dashboard';
let currentStudentId = null;
let currentFeeId = null;
let allStudents = [];
let allFees = [];
let allAttendance = [];

// ── INIT ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  loadAllData();
  showPage('dashboard');
});

function initDate() {
  const now = new Date();
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('topbar-date').textContent = now.toLocaleDateString('en-PK', opts);
  // Set today in attendance date picker
  const attDate = document.getElementById('att-date');
  if (attDate) attDate.value = getToday();
}

function getToday() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function fdate(d) {
  if (!d) return '—';
  const [y,m,day] = d.split('-').map(Number);
  return `${String(day).padStart(2,'0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${y}`;
}

function ordinal(n) {
  return n==1?'1st':n==2?'2nd':'3rd';
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

function genReceiptNo() {
  return 'FNC-' + Math.floor(10000 + Math.random()*90000);
}

// ── TOAST ──────────────────────────────
function toast(msg, type='success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', warning:'⚠️' };
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── NAVIGATION ─────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));
  document.getElementById('topbar-title').textContent = {
    dashboard:  'Dashboard',
    students:   'Students',
    fees:       'Fee Management',
    attendance: 'Attendance',
  }[page] || page;
  currentPage = page;
  if (page === 'dashboard')  renderDashboard();
  if (page === 'students')   renderStudents();
  if (page === 'fees')       renderFees();
  if (page === 'attendance') renderAttMark();
}

// ── MODAL ──────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); }

// ── FIREBASE DATA LOAD ─────────────────
function loadAllData() {
  showLoading(true);
  // Load students
  STUDENTS.orderBy('createdAt', 'desc').onSnapshot(snap => {
    allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (currentPage === 'dashboard') renderDashboard();
    if (currentPage === 'students')  renderStudents();
    populateFeeStudentSelect();
    populateBatchFilters();
    showLoading(false);
  }, err => {
    console.error('Students error:', err);
    showLoading(false);
    toast('Firebase not configured. Please setup Firebase first.', 'error');
  });

  // Load fees
  FEES.orderBy('createdAt', 'desc').onSnapshot(snap => {
    allFees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (currentPage === 'dashboard') renderDashboard();
    if (currentPage === 'fees')      renderFees();
  });

  // Load attendance
  ATTENDANCE.onSnapshot(snap => {
    allAttendance = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (currentPage === 'dashboard')  renderDashboard();
    if (currentPage === 'attendance') renderAttMark();
  });
}

function showLoading(show) {
  const el = document.getElementById('fb-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
function renderDashboard() {
  const active    = allStudents.filter(s => s.status === 'Active').length;
  const graduated = allStudents.filter(s => s.status === 'Graduated').length;
  const today     = getToday();
  const todayAtt  = allAttendance.filter(a => a.date === today && a.status === 'Present').length;
  const todayFees = allFees.filter(f => f.date === today);
  const todayFee  = todayFees.reduce((s,f) => s + (Number(f.amount)||0), 0);

  document.getElementById('d-active').textContent    = active;
  document.getElementById('d-grad').textContent      = graduated;
  document.getElementById('d-att').textContent       = todayAtt;
  document.getElementById('d-fee').textContent       = 'Rs. ' + todayFee.toLocaleString();

  // Recent students
  const recent = [...allStudents].slice(0,5);
  const rEl = document.getElementById('d-recent');
  rEl.innerHTML = recent.length
    ? recent.map(s => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-l);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:var(--primary)">${s.name?.charAt(0)||'?'}</div>
          <div>
            <div style="font-weight:600;font-size:13.5px">${s.name}</div>
            <div style="font-size:11px;color:var(--gray-400)">${s.roll} · Batch ${s.batch}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="openStudentDetail('${s.id}')">View</button>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">👩‍🎓</div><p>No students yet</p></div>';

  // Batch breakdown
  const batches = {};
  allStudents.forEach(s => { batches[s.batch] = (batches[s.batch]||0) + 1; });
  const bEl = document.getElementById('d-batches');
  bEl.innerHTML = Object.entries(batches).sort().length
    ? Object.entries(batches).sort().map(([b,c]) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100)">
        <span style="font-weight:600;font-size:13.5px">Batch ${b}</span>
        <span class="badge badge-green">${c} students</span>
      </div>`).join('')
    : '<div class="empty-state"><p>No data</p></div>';
}

// ═══════════════════════════════════════
// STUDENTS
// ═══════════════════════════════════════
function renderStudents() {
  populateBatchFilters();
  const q      = (document.getElementById('st-search')?.value||'').toLowerCase();
  const batch  = document.getElementById('st-batch-filter')?.value||'';
  const status = document.getElementById('st-status-filter')?.value||'Active';

  let list = allStudents.filter(s => {
    const mq = !q || s.name?.toLowerCase().includes(q) || s.roll?.toLowerCase().includes(q) || s.father?.toLowerCase().includes(q);
    const mb = !batch  || s.batch === batch;
    const ms = !status || s.status === status;
    return mq && mb && ms;
  });

  document.getElementById('st-count').textContent = `${list.length} student${list.length!==1?'s':''}`;

  const statusColors = { Active:'badge-green', Graduated:'badge-blue', Dropped:'badge-red', Suspended:'badge-yellow' };
  const tbody = document.getElementById('st-tbody');
  tbody.innerHTML = list.length
    ? list.map(s => `
      <tr>
        <td><strong>${s.roll||'—'}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--primary-l);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:var(--primary);flex-shrink:0">${s.name?.charAt(0)||'?'}</div>
            <div>
              <div style="font-weight:600">${s.name}</div>
              <div style="font-size:11px;color:var(--gray-400)">${s.father||'—'}</div>
            </div>
          </div>
        </td>
        <td>${s.batch||'—'}</td>
        <td>${ordinal(s.year||1)} Year</td>
        <td>${s.phone||'—'}</td>
        <td><span class="badge ${statusColors[s.status]||'badge-gray'}">${s.status}</span></td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-outline btn-sm" onclick="openStudentDetail('${s.id}')">View</button>
            <button class="btn btn-outline btn-sm" onclick="openEditStudent('${s.id}')">Edit</button>
            <button class="btn btn-sm" style="background:var(--accent);color:var(--gray-900)" onclick="showIDCard('${s.id}')">🪪</button>
            <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}','${s.name}')">Del</button>
          </div>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="7" class="table-empty">
        <div class="empty-state">
          <div class="empty-icon">👩‍🎓</div>
          <h3>No students found</h3>
          <p>Add your first student to get started</p>
        </div>
      </td></tr>`;
}

function populateBatchFilters() {
  const batches = [...new Set(allStudents.map(s=>s.batch))].sort();
  ['st-batch-filter','att-batch-filter','rpt-batch'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">All Batches</option>' + batches.map(b => `<option ${b===cur?'selected':''}>${b}</option>`).join('');
  });
}

// Add/Edit Student Modal
function openAddStudent() {
  currentStudentId = null;
  document.getElementById('student-modal-title').textContent = 'Add New Student';
  document.getElementById('student-form').reset();
  openModal('modal-student');
}

function openEditStudent(id) {
  const s = allStudents.find(x => x.id === id);
  if (!s) return;
  currentStudentId = id;
  document.getElementById('student-modal-title').textContent = 'Edit Student';
  const f = document.getElementById('student-form');
  f['s-roll'].value    = s.roll||'';
  f['s-name'].value    = s.name||'';
  f['s-father'].value  = s.father||'';
  f['s-cnic'].value    = s.cnic||'';
  f['s-gender'].value  = s.gender||'Female';
  f['s-dob'].value     = s.dob||'';
  f['s-blood'].value   = s.blood||'';
  f['s-phone'].value   = s.phone||'';
  f['s-batch'].value   = s.batch||'2024';
  f['s-year'].value    = s.year||1;
  f['s-status'].value  = s.status||'Active';
  f['s-address'].value = s.address||'';
  f['s-guardian'].value= s.guardian||'';
  f['s-gphone'].value  = s.gphone||'';
  closeModal('modal-detail');
  openModal('modal-student');
}

async function saveStudent() {
  const f = document.getElementById('student-form');
  const roll   = f['s-roll'].value.trim();
  const name   = f['s-name'].value.trim();
  const father = f['s-father'].value.trim();
  if (!roll||!name||!father) { toast('Roll No, Name & Father required!','error'); return; }
  // Check duplicate roll
  const dup = allStudents.find(s => s.roll===roll && s.id!==currentStudentId);
  if (dup) { toast('Roll number already exists!','error'); return; }

  const data = {
    roll, name, father,
    cnic:     f['s-cnic'].value.trim(),
    gender:   f['s-gender'].value,
    dob:      f['s-dob'].value,
    blood:    f['s-blood'].value,
    phone:    f['s-phone'].value.trim(),
    batch:    f['s-batch'].value,
    year:     parseInt(f['s-year'].value),
    status:   f['s-status'].value,
    address:  f['s-address'].value.trim(),
    guardian: f['s-guardian'].value.trim(),
    gphone:   f['s-gphone'].value.trim(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (currentStudentId) {
      await STUDENTS.doc(currentStudentId).update(data);
      toast('Student updated!');
    } else {
      data.createdAt = new Date().toISOString();
      data.addedOn   = getToday();
      await STUDENTS.add(data);
      toast('Student added successfully!');
    }
    closeModal('modal-student');
  } catch(e) {
    console.error(e);
    toast('Error saving: ' + e.message, 'error');
  }
}

async function deleteStudent(id, name) {
  if (!confirm(`Delete "${name}"? All their fee and attendance records will also be deleted.`)) return;
  try {
    await STUDENTS.doc(id).delete();
    // Delete related fees
    const feeDocs = await FEES.where('studentId','==',id).get();
    feeDocs.forEach(d => d.ref.delete());
    // Delete related attendance
    const attDocs = await ATTENDANCE.where('studentId','==',id).get();
    attDocs.forEach(d => d.ref.delete());
    toast('Student deleted.');
    closeModal('modal-detail');
  } catch(e) {
    toast('Error: ' + e.message,'error');
  }
}

// Student Detail Modal
function openStudentDetail(id) {
  const s = allStudents.find(x => x.id===id);
  if (!s) return;
  currentStudentId = id;

  // Fees
  const sf = allFees.filter(f => f.studentId===id);
  const feeTotal = sf.reduce((t,f) => t+Number(f.amount||0), 0);

  // Attendance this year
  const yr = new Date().getFullYear().toString();
  const sa = allAttendance.filter(a => a.studentId===id && a.date?.startsWith(yr));
  const present = sa.filter(a=>a.status==='Present').length;
  const absent  = sa.filter(a=>a.status==='Absent').length;
  const pct = sa.length ? Math.round(present/sa.length*100) : 0;

  document.getElementById('detail-modal-title').textContent = s.name;

  document.getElementById('detail-body').innerHTML = `
    <div class="grid-2" style="margin-bottom:20px">
      <div>
        <div class="section-title">Personal Details</div>
        <table style="width:100%;border-collapse:collapse;font-size:13.5px">
          ${[['Roll No',s.roll],['Father',s.father],['CNIC',s.cnic||'—'],['Gender',s.gender],['DOB',fdate(s.dob)],['Blood Group',s.blood||'—'],['Phone',s.phone||'—'],['Batch',s.batch],['Year',ordinal(s.year)+' Year'],['Status',s.status],['Guardian',s.guardian||'—'],['G.Phone',s.gphone||'—']]
            .map(([l,v])=>`<tr><td style="color:var(--gray-400);padding:7px 0;width:38%">${l}</td><td style="font-weight:500;color:var(--gray-800)">${v}</td></tr>`).join('')}
          ${s.address?`<tr><td style="color:var(--gray-400);padding:7px 0">Address</td><td style="color:var(--gray-700)">${s.address}</td></tr>`:''}
        </table>
      </div>
      <div>
        <div class="section-title">Attendance (This Year)</div>
        <div style="background:var(--gray-50);border-radius:var(--r);border:1px solid var(--gray-200);padding:16px;margin-bottom:16px">
          <div style="display:flex;gap:20px;margin-bottom:12px">
            <div><div style="font-size:26px;font-weight:800;color:var(--success)">${present}</div><div style="font-size:11px;color:var(--gray-400)">Present</div></div>
            <div><div style="font-size:26px;font-weight:800;color:var(--danger)">${absent}</div><div style="font-size:11px;color:var(--gray-400)">Absent</div></div>
            <div><div style="font-size:26px;font-weight:800;color:var(--info)">${pct}%</div><div style="font-size:11px;color:var(--gray-400)">Rate</div></div>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${pct>=75?'var(--success)':pct>=60?'var(--warning)':'var(--danger)'}"></div></div>
        </div>
        <div class="section-title">Total Fee Paid</div>
        <div style="background:var(--success-l);border-radius:var(--r);border:1px solid var(--primary-m);padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:var(--success)">Rs. ${feeTotal.toLocaleString()}</div>
        </div>
        <button class="btn btn-accent" style="width:100%;justify-content:center;margin-top:12px" onclick="closeModal('modal-detail');openAddFeeFor('${id}')">+ Record Fee Payment</button>
      </div>
    </div>
    <div class="section-title">Fee History</div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Receipt</th><th>Type</th><th>Month/Year</th><th>Amount</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>${sf.length
          ? sf.map(f=>`<tr>
              <td><strong>${f.receipt}</strong></td>
              <td><span class="badge badge-blue">${f.type}</span></td>
              <td>${f.month?['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][f.month]:'—'} ${f.year}</td>
              <td style="font-weight:700;color:var(--success)">Rs.${Number(f.amount).toLocaleString()}</td>
              <td>${fdate(f.date)}</td>
              <td><button class="btn btn-outline btn-sm" onclick="showReceiptById('${f.id}')">Receipt</button></td>
            </tr>`).join('')
          : '<tr><td colspan="6" class="table-empty">No fee records yet</td></tr>'}</tbody>
      </table>
    </div>`;

  // Button handlers
  document.getElementById('detail-edit-btn').onclick = () => openEditStudent(id);
  document.getElementById('detail-del-btn').onclick  = () => deleteStudent(id, s.name);
  document.getElementById('detail-id-btn').onclick   = () => showIDCard(id);

  openModal('modal-detail');
}

// ═══════════════════════════════════════
// FEES
// ═══════════════════════════════════════
function populateFeeStudentSelect(selectedId='') {
  const el = document.getElementById('f-student');
  if (!el) return;
  const active = allStudents.filter(s => s.status==='Active');
  el.innerHTML = '<option value="">— Select Student —</option>' +
    active.map(s => `<option value="${s.id}" ${s.id===selectedId?'selected':''}>${s.roll} — ${s.name}</option>`).join('');
}

function renderFees() {
  const q = (document.getElementById('fee-search')?.value||'').toLowerCase();
  let list = allFees.filter(f => !q || f.studentName?.toLowerCase().includes(q) || f.receipt?.toLowerCase().includes(q));
  const total = list.reduce((s,f) => s+Number(f.amount||0), 0);
  document.getElementById('fee-total-lbl').textContent = `Total: Rs. ${total.toLocaleString()}`;

  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('fee-tbody').innerHTML = list.length
    ? list.map(f => `
      <tr>
        <td><strong>${f.receipt}</strong></td>
        <td>
          <div style="font-weight:600">${f.studentName}</div>
          <div style="font-size:11px;color:var(--gray-400)">${f.studentRoll}</div>
        </td>
        <td><span class="badge badge-blue">${f.type}</span></td>
        <td>${f.month?months[f.month]:'—'} ${f.year}</td>
        <td style="font-weight:700;color:var(--success)">Rs.${Number(f.amount).toLocaleString()}</td>
        <td>${fdate(f.date)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-outline btn-sm" onclick="showReceiptById('${f.id}')">Receipt</button>
            <button class="btn btn-danger btn-sm" onclick="deleteFee('${f.id}')">Del</button>
          </div>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="7" class="table-empty">
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <h3>No fee records</h3>
          <p>Record your first fee payment</p>
        </div>
      </td></tr>`;
}

function openAddFee() {
  populateFeeStudentSelect();
  document.getElementById('fee-form').reset();
  // Set current year
  document.getElementById('f-year').value = new Date().getFullYear();
  openModal('modal-fee');
}

function openAddFeeFor(studentId) {
  populateFeeStudentSelect(studentId);
  document.getElementById('fee-form').reset();
  document.getElementById('f-student').value = studentId;
  document.getElementById('f-year').value = new Date().getFullYear();
  openModal('modal-fee');
}

async function saveFee() {
  const f = document.getElementById('fee-form');
  const sid = f['f-student'].value;
  const amt = f['f-amount'].value;
  if (!sid||!amt) { toast('Student and Amount required!','error'); return; }
  const s = allStudents.find(x => x.id===sid);
  const fee = {
    studentId:   sid,
    studentName: s?.name||'',
    studentRoll: s?.roll||'',
    receipt:     genReceiptNo(),
    type:        f['f-type'].value,
    month:       f['f-month'].value ? parseInt(f['f-month'].value) : '',
    year:        f['f-year'].value,
    amount:      Number(amt),
    remarks:     f['f-remarks'].value.trim(),
    date:        getToday(),
    createdAt:   new Date().toISOString()
  };
  try {
    const ref = await FEES.add(fee);
    closeModal('modal-fee');
    toast('Fee recorded! Receipt: ' + fee.receipt);
    showReceiptData({ id: ref.id, ...fee });
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
}

function showReceiptById(id) {
  const f = allFees.find(x => x.id===id);
  if (f) showReceiptData(f);
}

function showReceiptData(f) {
  const s = allStudents.find(x => x.id===f.studentId);
  const months=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('receipt-body').innerHTML = `
    <div class="receipt-card">
      <div class="receipt-header">
        <h2>Fatima Nursing College</h2>
        <p>Matta, Swat, KPK — Fee Receipt</p>
        <div class="receipt-no">Receipt No: ${f.receipt}</div>
      </div>
      <div class="receipt-body">
        <div class="receipt-row"><span class="receipt-lbl">Student Name</span><span class="receipt-val">${f.studentName}</span></div>
        <div class="receipt-row"><span class="receipt-lbl">Roll Number</span><span class="receipt-val">${f.studentRoll}</span></div>
        <div class="receipt-row"><span class="receipt-lbl">Father's Name</span><span class="receipt-val">${s?.father||'—'}</span></div>
        <div class="receipt-row"><span class="receipt-lbl">Batch</span><span class="receipt-val">${s?.batch||'—'}</span></div>
        <div class="receipt-row"><span class="receipt-lbl">Fee Type</span><span class="receipt-val">${f.type} Fee</span></div>
        <div class="receipt-row"><span class="receipt-lbl">Month / Year</span><span class="receipt-val">${f.month?months[f.month]:'—'} / ${f.year}</span></div>
        <div class="receipt-row"><span class="receipt-lbl">Date Paid</span><span class="receipt-val">${fdate(f.date)}</span></div>
        ${f.remarks?`<div class="receipt-row"><span class="receipt-lbl">Remarks</span><span class="receipt-val">${f.remarks}</span></div>`:''}
      </div>
      <div class="receipt-amount">
        <div class="lbl">Amount Paid</div>
        <div class="amt">Rs. ${Number(f.amount).toLocaleString()}</div>
      </div>
      <div class="receipt-footer">
        <div><div style="width:80px;height:1px;background:var(--gray-300);margin-bottom:4px"></div><span>Principal Signature</span></div>
        <span>Official Receipt</span>
      </div>
    </div>`;
  openModal('modal-receipt');
}

async function deleteFee(id) {
  if (!confirm('Delete this fee record?')) return;
  try {
    await FEES.doc(id).delete();
    toast('Fee record deleted.');
  } catch(e) { toast('Error: '+e.message,'error'); }
}

// ═══════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════
function renderAttMark() {
  populateBatchFilters();
  const date  = document.getElementById('att-date')?.value || getToday();
  const batch = document.getElementById('att-batch-filter')?.value || '';
  let students = allStudents.filter(s => s.status==='Active');
  if (batch) students = students.filter(s => s.batch===batch);
  students.sort((a,b) => (a.roll||'').localeCompare(b.roll||''));

  // Existing attendance for this date
  const existing = {};
  allAttendance.filter(a => a.date===date).forEach(a => existing[a.studentId] = a.status);

  document.getElementById('att-date-label').textContent = fdate(date);
  document.getElementById('att-tbody').innerHTML = students.length
    ? students.map((s,i) => {
        const st = existing[s.id]||'Present';
        return `<tr>
          <td style="color:var(--gray-400)">${i+1}</td>
          <td><strong>${s.roll}</strong></td>
          <td>
            <div style="font-weight:600">${s.name}</div>
            <div style="font-size:11px;color:var(--gray-400)">${s.father}</div>
          </td>
          <td>
            <select id="att-${s.id}" onchange="styleAttSelect(this)" style="width:120px;padding:6px 8px;border:1.5px solid var(--gray-300);border-radius:6px;font-size:13px;font-family:inherit">
              <option ${st==='Present'?'selected':''}>Present</option>
              <option ${st==='Absent'?'selected':''}>Absent</option>
              <option ${st==='Leave'?'selected':''}>Leave</option>
              <option ${st==='Late'?'selected':''}>Late</option>
            </select>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="4" class="table-empty"><div class="empty-state"><div class="empty-icon">📅</div><h3>No active students</h3><p>Add students first</p></div></td></tr>';

  // Style all selects
  document.querySelectorAll('[id^="att-"]').forEach(styleAttSelect);
}

function styleAttSelect(el) {
  const colors = {
    Present: { border:'#6ee7b7', bg:'#f0fdf4' },
    Absent:  { border:'#fca5a5', bg:'#fef2f2' },
    Leave:   { border:'#fcd34d', bg:'#fffbeb' },
    Late:    { border:'#a5b4fc', bg:'#eef2ff' },
  };
  const c = colors[el.value] || colors.Present;
  el.style.borderColor = c.border;
  el.style.background  = c.bg;
}

function markAllAtt(status) {
  const batch = document.getElementById('att-batch-filter')?.value||'';
  let students = allStudents.filter(s => s.status==='Active');
  if (batch) students = students.filter(s => s.batch===batch);
  students.forEach(s => {
    const el = document.getElementById('att-'+s.id);
    if (el) { el.value = status; styleAttSelect(el); }
  });
}

async function saveAttendance() {
  const date  = document.getElementById('att-date').value || getToday();
  const batch = document.getElementById('att-batch-filter')?.value||'';
  let students = allStudents.filter(s => s.status==='Active');
  if (batch) students = students.filter(s => s.batch===batch);

  try {
    // Delete existing for this date+students
    const existing = await ATTENDANCE.where('date','==',date).get();
    const toDelete = existing.docs.filter(d => students.find(s => s.id===d.data().studentId));
    await Promise.all(toDelete.map(d => d.ref.delete()));

    // Save new
    await Promise.all(students.map(s => {
      const el = document.getElementById('att-'+s.id);
      if (!el) return;
      return ATTENDANCE.add({
        studentId: s.id,
        studentName: s.name,
        date,
        status: el.value,
        createdAt: new Date().toISOString()
      });
    }));
    toast(`Attendance saved for ${fdate(date)}!`);
    renderDashboard();
  } catch(e) {
    toast('Error: '+e.message,'error');
  }
}

// Attendance Report
function showAttReport()  { document.getElementById('att-section').style.display='none'; document.getElementById('rpt-section').style.display='block'; renderReport(); }
function hideAttReport()  { document.getElementById('att-section').style.display='block'; document.getElementById('rpt-section').style.display='none'; }

function renderReport() {
  const month = parseInt(document.getElementById('rpt-month').value);
  const year  = document.getElementById('rpt-year').value;
  const batch = document.getElementById('rpt-batch')?.value||'';
  let students = allStudents.filter(s => s.status==='Active');
  if (batch) students = students.filter(s => s.batch===batch);

  const rows = students.map(s => {
    const sa = allAttendance.filter(a => a.studentId===s.id && new Date(a.date).getMonth()+1===month && new Date(a.date).getFullYear()===parseInt(year));
    const p  = sa.filter(a=>a.status==='Present').length;
    const ab = sa.filter(a=>a.status==='Absent').length;
    const lv = sa.filter(a=>a.status==='Leave').length;
    const t  = sa.length;
    const pct= t ? Math.round(p/t*100) : 0;
    return { s, p, ab, lv, t, pct };
  });

  document.getElementById('rpt-tbody').innerHTML = rows.length
    ? rows.map(r => `
      <tr>
        <td>${r.s.roll}</td>
        <td><strong>${r.s.name}</strong></td>
        <td>${r.s.batch}</td>
        <td style="font-weight:700;color:var(--success)">${r.p}</td>
        <td style="font-weight:700;color:var(--danger)">${r.ab}</td>
        <td style="font-weight:700;color:var(--warning)">${r.lv}</td>
        <td>${r.t}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress" style="flex:1;min-width:60px"><div class="progress-bar" style="width:${r.pct}%;background:${r.pct>=75?'var(--success)':r.pct>=60?'var(--warning)':'var(--danger)'}"></div></div>
            <span style="font-weight:700;min-width:34px;font-size:13px;${r.pct<75?'color:var(--danger)':''}">${r.pct}%</span>
          </div>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="8" class="table-empty"><div class="empty-state"><div class="empty-icon">📊</div><h3>No data for this month</h3></div></td></tr>';
}

// ═══════════════════════════════════════
// ID CARD
// ═══════════════════════════════════════
function showIDCard(id) {
  const s = allStudents.find(x => x.id===id);
  if (!s) return;
  document.getElementById('idcard-body').innerHTML = `
    <div class="id-card-wrap">
      <div class="id-card">
        <div class="id-card-top">
          <h3>Fatima Nursing College</h3>
          <p>Matta, Swat, KPK · Pakistan</p>
          <div class="id-avatar-circle">${s.name?.charAt(0)||'?'}</div>
          <div class="id-card-name">${s.name}</div>
          <div class="id-card-roll">${s.roll}</div>
        </div>
        <div class="id-card-body">
          <div class="id-card-row"><span class="lbl">Father's Name</span><span class="val">${s.father}</span></div>
          <div class="id-card-row"><span class="lbl">CNIC</span><span class="val">${s.cnic||'—'}</span></div>
          <div class="id-card-row"><span class="lbl">Batch</span><span class="val">${s.batch}</span></div>
          <div class="id-card-row"><span class="lbl">Year</span><span class="val">${ordinal(s.year)} Year</span></div>
          <div class="id-card-row"><span class="lbl">Blood Group</span><span class="val">${s.blood||'—'}</span></div>
          <div class="id-card-row"><span class="lbl">Phone</span><span class="val">${s.phone||'—'}</span></div>
        </div>
        <div class="id-card-footer">
          <div><div style="width:70px;height:1px;background:rgba(255,255,255,.25);margin-bottom:3px"></div><span class="sig">Principal</span></div>
          <span class="valid">Valid: ${s.batch}–${parseInt(s.batch)+3}</span>
        </div>
      </div>
    </div>`;
  openModal('modal-idcard');
}
