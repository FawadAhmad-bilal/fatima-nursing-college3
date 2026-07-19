// SIMPLE PASSWORD PROTECTION
// Fatima Nursing College
// ═══════════════════════════════════════

const ADMIN_PASSWORD = "fatima2024"; // ← Yahan apna password change karo

function checkAuth() {
  const loggedIn = sessionStorage.getItem('fnc_auth');
  if (!loggedIn) {
    showLoginScreen();
  } else {
    hideLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function hideLoginScreen() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

function doLogin() {
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-err');
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('fnc_auth', '1');
    hideLoginScreen();
    loadAllData();
  } else {
    err.textContent = 'Incorrect password! Try again.';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
}

function doLogout() {
  sessionStorage.removeItem('fnc_auth');
  showLoginScreen();
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-pass')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') doLogin();
  });
  checkAuth();
});
