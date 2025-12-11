// JavaScript file for Urvoic platform

// --- Data for Info Pages ---
const pageData = {
  about: {
    title: "About Us",
    subtitle: "Building better communities together",
    content: `<p>Urvoic is dedicated to connecting neighbors, simplifying society management, and empowering local businesses. We believe that a strong community is built on communication and trust.</p><p>Founded in 2025, our mission is to provide a unified platform where residents can solve problems, admins can manage efficiently, and businesses can thrive.</p>
        
        <div class="founder-section">
            <img src="https://i.ibb.co/WJbPLz9/IMG-20251008-WA0001.jpg" alt="Prashant Mishra" class="founder-img">
            <h4 class="founder-name">Prashant Mishra</h4>
            <p class="founder-role">Founder & CEO</p>
        </div>`
  },
  contact: {
    title: "Contact Us",
    subtitle: "We'd love to hear from you",
    content: `<p>Have questions or need support? Reach out to us!</p>
                  <form onsubmit="handleContactFormSubmit(event, 'Message Sent!')" style="display:flex; flex-direction:column; gap:15px; max-width:400px;">
                    <input type="text" class="form-input" placeholder="Your Name" required>
                    <input type="email" class="form-input" placeholder="Your Email" required>
                    <textarea class="form-input" rows="4" placeholder="How can we help?" required></textarea>
                    <button type="submit" class="form-submit-btn">Send Message</button>
                  </form>
                  <p style="margin-top:15px;"><a onclick="navigateToInfo('contact')" style="color:var(--brand);cursor:pointer;font-weight:600;">Or email us directly at urvoiccontact@gmail.com or call +91 8750416383</a></p>
                  <div style="margin-top:20px;">
                    <strong>Email:</strong> urvoiccontact@gmail.com<br>
                    <strong>Phone:</strong> +91 8750416383
                  </div>`
  },
  help: {
    title: "Help Center",
    subtitle: "Frequently Asked Questions",
    content: `<div class="faq-list">
                    <div class="faq-item" onclick="this.classList.toggle('active')">
                        <div class="faq-question">How do I join my society? <span class="faq-icon">▼</span></div>
                        <div class="faq-answer">Simply click "Sign Up," select "Resident," and search for your society name. You'll need approval from your admin.</div>
                    </div>
                    <div class="faq-item" onclick="this.classList.toggle('active')">
                        <div class="faq-question">Is it free for residents? <span class="faq-icon">▼</span></div>
                        <div class="faq-answer">Yes! The core features for residents are completely free to use.</div>
                    </div>
                    <div class="faq-item" onclick="this.classList.toggle('active')">
                        <div class="faq-question">How can I register my business? <span class="faq-icon">▼</span></div>
                        <div class="faq-answer">Click on "For Businesses" in the menu, sign up, and fill in your business details to get listed.</div>
                    </div>
                  </div>`
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Last updated: Nov 2025",
    content: `<p>Your privacy is important to us. This policy explains how we handle your data.</p><h3>1. Data Collection</h3><p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p><h3>2. Use of Information</h3><p>We use your information to provide, maintain, and improve our services, and to communicate with you.</p>`
  },
  terms: {
    title: "Terms & Conditions",
    subtitle: "Rules for using Urvoic",
    content: `<p>By accessing Urvoic, you agree to be bound by these terms.</p><h3>1. User Conduct</h3><p>You agree to use the platform responsibly and respect other community members.</p><h3>2. Account Security</h3><p>You are responsible for safeguarding your account password and for any activities or actions under your account.</p>`
  },
  guidelines: {
    title: "Community Guidelines",
    subtitle: "Keeping our community safe",
    content: `<p>To ensure a positive experience for everyone, please follow these guidelines:</p><ul><li>Be respectful to your neighbors.</li><li>Do not spam or post irrelevant content.</li><li>Report any suspicious activity to your admin.</li></ul>`
  }
};

// --- View and Panel Elements ---
const landingView = document.getElementById('landing-view');
const loginView = document.getElementById('login-view');
const infoView = document.getElementById('info-view');
const appSidebar = document.getElementById('appSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const notificationPanel = document.getElementById('notificationPanel');
const notificationOverlay = document.getElementById('notificationOverlay');

// --- Helper Functions ---
function showToast(msg, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-content"><div class="toast-title">${type === 'success' ? 'Success' : 'Error'}</div><div class="toast-msg">${msg}</div></div>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function closeAllPanels() {
  appSidebar?.classList.remove('active');
  sidebarOverlay?.classList.remove('active');
  notificationPanel?.classList.remove('active');
  notificationOverlay?.classList.remove('active');
}

// --- Navigation Logic ---
function hideAllViews() {
  landingView.classList.remove('active-view');
  loginView.classList.remove('active-view');
  infoView.classList.remove('active-view');
}

function navigateToLogin(mode, type) {
  closeAllPanels();
  hideAllViews();
  loginView.classList.add('active-view');
  setAuthMode(mode);
  if (type && mode !== 'register') { setUserType(type); }
  window.scrollTo(0, 0);
}

function navigateToHome() {
  closeAllPanels();
  hideAllViews();
  landingView.classList.add('active-view');
  window.scrollTo(0, 0);
}

window.addEventListener('beforeunload', (e) => {
  const currentPath = window.location.pathname;
  if (currentPath === '/' || currentPath.includes('login') || currentPath.includes('signup')) {
    e.preventDefault();
    e.returnValue = 'Want to leave this page?';
  }
});

function navigateToInfo(pageKey) {
  closeAllPanels();
  hideAllViews();
  const data = pageData[pageKey];
  if (data) {
    document.getElementById('pageTitle').innerText = data.title;
    document.getElementById('pageSubtitle').innerText = data.subtitle;
    document.getElementById('pageContent').innerHTML = data.content;
    infoView.classList.add('active-view');
    window.scrollTo(0, 0);
  }
}

function focusSearch() {
  if (!landingView.classList.contains('active-view')) { navigateToHome(); }
  const searchInput = document.getElementById('mainSearchInput');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { searchInput.focus(); }, 500);
}

// --- Dashboard Redirection ---
function redirectToDashboard(user) {
  if (user.user_type === 'business') {
    window.location.href = '/dashboard/business';
  } else if (user.role === 'admin') {
    window.location.href = '/dashboard/admin';
  } else if (user.role === 'guard') {
    window.location.href = '/dashboard/guard';
  } else {
    window.location.href = '/dashboard/resident';
  }
}

// --- Services Animation Logic ---
function showResidentsDetails() { animateServiceExpand('residentsDetails'); }
function hideResidentsDetails() { animateServiceCollapse('residentsDetails'); }
function showSocietyAdminDetails() { animateServiceExpand('societyAdminDetails'); }
function hideSocietyAdminDetails() { animateServiceCollapse('societyAdminDetails'); }
function showBusinessDetails() { animateServiceExpand('businessDetails'); }
function hideBusinessDetails() { animateServiceCollapse('businessDetails'); }

function animateServiceExpand(detailId) {
  const mainView = document.getElementById('servicesMain');
  const detailView = document.getElementById(detailId);
  const wrapper = document.getElementById('servicesWrapper');
  if (!mainView || !detailView || !wrapper) return; 

  wrapper.classList.add('expanded');
  mainView.style.opacity = '0';
  mainView.style.transform = 'translateX(-20px)';
  setTimeout(() => {
    mainView.style.display = 'none';
    detailView.style.display = 'flex';
    setTimeout(() => { detailView.classList.add('active'); }, 10);
  }, 300);
}
function animateServiceCollapse(detailId) {
  const mainView = document.getElementById('servicesMain');
  const detailView = document.getElementById(detailId);
  const wrapper = document.getElementById('servicesWrapper');
  if (!mainView || !detailView || !wrapper) return; 

  wrapper.classList.remove('expanded');
  detailView.classList.remove('active');
  setTimeout(() => {
    detailView.style.display = 'none';
    mainView.style.display = 'block';
    setTimeout(() => { mainView.style.opacity = '1'; mainView.style.transform = 'translateX(0)'; }, 10);
  }, 400);
}

// --- FINALIZED FORM HANDLERS (Direct API Calls) ---

async function handleLogin(event) {
  event.preventDefault(); // Prevents default form submission/page reload
  const form = event.target;
  const btn = form.querySelector('.form-submit-btn');
  const originalText = btn.innerText;
  
  btn.classList.add('loading');
  btn.innerText = 'Logging in...';
  btn.disabled = true;
  
  const passwordInput = form.querySelector('input[type="password"]');
  // Handle both text and email inputs for the identifier field
  const emailInput = form.querySelector('input[placeholder*="email"], input[placeholder*="phone"]'); 
  const email = emailInput ? emailInput.value : '';
  const password = passwordInput ? passwordInput.value : '';
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        redirectToDashboard(data.user);
      }, 1000);
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

async function handleResidentSignup(event) {
  event.preventDefault(); 
  const form = event.target;
  const btn = form.querySelector('.form-submit-btn');
  const originalText = btn.innerText;
  
  btn.classList.add('loading');
  btn.innerText = 'Creating account...';
  btn.disabled = true;
  
  const inputs = form.querySelectorAll('input');
  const fullName = inputs[0].value;
  const email = inputs[1].value;
  const phone = inputs[2].value;
  const password = inputs[3].value;
  const societyName = inputs[4].value;
  const flatNumber = inputs[5]?.value || '';
  
  const roleBtn = form.querySelector('.role-toggle .role-btn.active');
  const role = roleBtn ? roleBtn.textContent.toLowerCase() : 'resident';
  
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName, email, phone, password,
        user_type: 'resident', role, society_name: societyName, flat_number: flatNumber
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.user && data.user.is_approved === false) {
        showToast('Account created! Waiting for admin approval.', 'success');
        form.reset();
        closeAllModals();
      } else {
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => { redirectToDashboard(data.user); }, 1000);
      }
    } else {
      showToast(data.message || 'Signup failed', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

async function handleBusinessSignup(event) {
  event.preventDefault(); 
  const form = event.target;
  const btn = form.querySelector('.form-submit-btn');
  const originalText = btn.innerText;
  
  btn.classList.add('loading');
  btn.innerText = 'Registering...';
  btn.disabled = true;
  
  const inputs = form.querySelectorAll('input');
  
  const businessName = inputs[0].value;
  const fullName = inputs[1].value;
  const email = inputs[2].value;
  const phone = inputs[3].value;
  const password = inputs[4].value;
  const societyName = inputs[5].value;
  const businessCategory = inputs[6].value;
  
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName, email, phone, password,
        user_type: 'business', role: 'business', society_name: societyName, flat_number: '',
        business_name: businessName, business_category: businessCategory, business_description: ''
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Business registered successfully! Redirecting...', 'success');
      setTimeout(() => { redirectToDashboard(data.user); }, 1000);
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

async function handleSocietyRegister(event) {
  event.preventDefault(); 
  const form = event.target;
  const btn = form.querySelector('.form-submit-btn');
  const originalText = btn.innerText;
  
  btn.classList.add('loading');
  btn.innerText = 'Registering society...';
  btn.disabled = true;
  
  const inputs = form.querySelectorAll('input');
  
  const societyName = inputs[0].value;
  const address = inputs[1].value;
  const adminFlatNumber = inputs[2].value;
  const adminName = inputs[3].value;
  const adminEmail = inputs[4].value;
  const adminPhone = inputs[5].value;
  const password = inputs[6].value;
  
  try {
    const response = await fetch('/api/register-society', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        society_name: societyName, address, city_state_pincode: '',
        total_blocks: 0, total_flats: 0, admin_flat_number: adminFlatNumber,
        admin_name: adminName, admin_email: adminEmail, admin_phone: adminPhone, password
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Society registered successfully! Redirecting...', 'success');
      setTimeout(() => { redirectToDashboard(data.user); }, 1000);
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

function handleContactFormSubmit(event, successMsg) {
    event.preventDefault(); 
    const form = event.target;
    const btn = form.querySelector('.form-submit-btn');
    const originalText = btn.innerText;
    
    btn.classList.add('loading');
    btn.innerText = 'Sending...';
    
    // Simulate API call for the contact form
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.innerText = originalText;
        showToast(successMsg, 'success');
        form.reset();
    }, 1500);
}


// --- Panel Logic ---
function toggleSidebar() {
  const isOpen = appSidebar.classList.contains('active');
  closeAllPanels();
  if (!isOpen) { appSidebar.classList.add('active'); sidebarOverlay.classList.add('active'); }
}
function toggleNotifications() {
  const isOpen = notificationPanel.classList.contains('active');
  closeAllPanels();
  if (!isOpen) { notificationPanel.classList.add('active'); notificationOverlay.classList.add('active'); }
}

// --- Layout Fix ---
function setSidebarPosition() {
  const header = document.querySelector('.site-header');
  if (header && appSidebar && sidebarOverlay) {
    const h = header.offsetHeight;
    appSidebar.style.top = sidebarOverlay.style.top = notificationPanel.style.top = notificationOverlay.style.top = `${h}px`;
    appSidebar.style.height = sidebarOverlay.style.height = notificationPanel.style.height = notificationOverlay.style.height = `calc(100vh - ${h}px)`;
  }
}
window.addEventListener('load', setSidebarPosition);
window.addEventListener('resize', setSidebarPosition);

// --- LOGIN FORM STATE LOGIC ---
let currentAuthMode = 'signin';
let currentUserType = 'resident';

function updateActiveForm() {
  const forms = {
    residentSignIn: document.getElementById('residentSignInForm'),
    residentSignUp: document.getElementById('residentSignUpForm'),
    businessSignIn: document.getElementById('businessSignInForm'),
    businessSignUp: document.getElementById('businessSignUpForm'),
    societyRegister: document.getElementById('societyRegisterForm')
  };
  const cardTitle = document.getElementById('cardTitle');
  const userTypeToggle = document.getElementById('userTypeToggle');

  Object.values(forms).forEach(f => f?.classList.remove('active'));

  if (currentAuthMode === 'register') {
    userTypeToggle.style.display = 'none';
    forms.societyRegister?.classList.add('active');
    cardTitle.textContent = 'Register Your Society';
  } else {
    userTypeToggle.style.display = 'flex';
    if (currentAuthMode === 'signin') {
      if (currentUserType === 'resident') {
        forms.residentSignIn?.classList.add('active');
        cardTitle.textContent = 'Resident/Admin Sign In';
      } else {
        forms.businessSignIn?.classList.add('active');
        cardTitle.textContent = 'Business Sign In';
      }
    } else {
      if (currentUserType === 'resident') {
        forms.residentSignUp?.classList.add('active');
        cardTitle.textContent = 'Join Your Society';
      } else {
        forms.businessSignUp?.classList.add('active');
        cardTitle.textContent = 'Register Your Business';
      }
    }
  }

  const authBtns = document.querySelectorAll('#authModeToggle .toggle-btn');
  authBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${currentAuthMode}'`));
  });
  const typeBtns = document.querySelectorAll('#userTypeToggle .toggle-btn');
  typeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${currentUserType}'`));
  });
}

function setAuthMode(mode) { currentAuthMode = mode; updateActiveForm(); }
function setUserType(type) { currentUserType = type; updateActiveForm(); }

function setRole(btn, role) {
  // 1. Handle button styling
  const parent = btn.parentElement;
  parent.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // 2. Handle Guard Logic (Hide Flat Number)
  const form = btn.closest('form');
  const flatGroup = form.querySelector('#residentFlatGroup');
  const flatInput = flatGroup.querySelector('input');

  if (role === 'guard') {
    flatGroup.style.display = 'none';
    flatInput.removeAttribute('required');
  } else {
    flatGroup.style.display = 'flex';
    flatInput.setAttribute('required', 'true');
  }
}

// --- Demo Popup Logic ---
function showDemoPopup() {
  const modal = document.createElement('div');
  modal.className = 'demo-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:30px;max-width:400px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
      <h2 style="margin:0 0 20px 0;color:var(--dark);">Choose a Demo</h2>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="visitDemo('resident')" style="padding:12px;background:var(--brand);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Resident Demo</button>
        <button onclick="visitDemo('admin')" style="padding:12px;background:var(--brand);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Admin Demo</button>
        <button onclick="visitDemo('guard')" style="padding:12px;background:var(--brand);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Guard Demo</button>
        <button onclick="visitDemo('business')" style="padding:12px;background:var(--brand);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Business Demo</button>
        <button onclick="document.querySelector('.demo-modal').remove()" style="padding:12px;background:#ccc;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Back</button>
      </div>
    </div>
  `;
  modal.classList.add('demo-modal');
  document.body.appendChild(modal);
}

function visitDemo(type) {
  window.location.href = `/demo/${type}`;
}

// --- Forgot Password ---
function showForgotPasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'forgot-password-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:30px;max-width:400px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
      <h2 style="margin:0 0 10px 0;color:var(--dark);">Reset Password</h2>
      <p style="margin:0 0 20px 0;color:var(--muted);font-size:14px;">Enter your email address and we'll send you instructions to reset your password.</p>
      <div id="forgotStep1">
        <input type="email" id="forgotEmail" class="form-input" placeholder="Enter your email" style="width:100%;margin-bottom:15px;">
        <button onclick="requestPasswordReset()" style="width:100%;padding:12px;background:var(--brand);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Send Reset Link</button>
      </div>
      <div id="forgotStep2" style="display:none;">
        <input type="text" id="resetToken" class="form-input" placeholder="Enter reset token" style="width:100%;margin-bottom:10px;">
        <input type="password" id="newPassword" class="form-input" placeholder="New password" style="width:100%;margin-bottom:10px;">
        <input type="password" id="confirmNewPassword" class="form-input" placeholder="Confirm new password" style="width:100%;margin-bottom:15px;">
        <button onclick="resetPassword()" style="width:100%;padding:12px;background:var(--brand);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Reset Password</button>
      </div>
      <button onclick="closeForgotPasswordModal()" style="width:100%;padding:12px;background:#eee;color:#333;border:none;border-radius:8px;cursor:pointer;font-weight:600;margin-top:10px;">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeForgotPasswordModal() {
  const modal = document.querySelector('.forgot-password-modal');
  if (modal) modal.remove();
}

async function requestPasswordReset() {
  const email = document.getElementById('forgotEmail').value;
  if (!email) {
    showToast('Please enter your email address', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    
    if (data.success) {
      showToast(data.message, 'success');
      document.getElementById('forgotStep1').style.display = 'none';
      document.getElementById('forgotStep2').style.display = 'block';
      if (data.debug_token) {
        document.getElementById('resetToken').value = data.debug_token;
      }
    } else {
      showToast(data.message || 'Failed to send reset email', 'error');
    }
  } catch (error) {
    showToast('An error occurred. Please try again.', 'error');
  }
}

async function resetPassword() {
  const token = document.getElementById('resetToken').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  
  if (!token || !newPassword || !confirmPassword) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });
    const data = await response.json();
    
    if (data.success) {
      showToast(data.message, 'success');
      closeForgotPasswordModal();
    } else {
      showToast(data.message || 'Failed to reset password', 'error');
    }
  } catch (error) {
    showToast('An error occurred. Please try again.', 'error');
  }
}

// --- Back Button Handling with History API ---
let navigationStack = ['landing'];
let currentViewState = 'landing';
let backPressCount = 0;
let lastBackPressTime = 0;

function initHistoryNavigation() {
    window.history.replaceState({ view: 'landing' }, '', window.location.pathname);
    
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view) {
            handleHistoryNavigation(event.state.view);
        } else {
            handleExitConfirmation();
        }
    });
}

function handleHistoryNavigation(viewState) {
    if (viewState === 'landing') {
        if (currentViewState === 'landing') {
            handleExitConfirmation();
        } else {
            navigateToHomeInternal();
        }
    } else if (viewState === 'login') {
        if (currentViewState === 'login') {
            navigateToHomeInternal();
            pushHistoryState('landing');
        } else {
            showLoginViewInternal();
        }
    } else if (viewState === 'info') {
        showInfoViewInternal();
    }
}

function handleExitConfirmation() {
    const now = Date.now();
    if (now - lastBackPressTime < 2000) {
        backPressCount++;
    } else {
        backPressCount = 1;
    }
    lastBackPressTime = now;
    
    if (backPressCount >= 2) {
        window.history.back();
    } else {
        showToast('Press back again to exit', 'info');
        pushHistoryState('landing');
    }
}

function pushHistoryState(viewState) {
    if (currentViewState !== viewState) {
        navigationStack.push(viewState);
        currentViewState = viewState;
        window.history.pushState({ view: viewState }, '', window.location.pathname);
    }
}

function navigateToHomeInternal() {
    closeAllPanels();
    hideAllViews();
    landingView.classList.add('active-view');
    currentViewState = 'landing';
    window.scrollTo(0, 0);
}

function showLoginViewInternal() {
    closeAllPanels();
    hideAllViews();
    loginView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showInfoViewInternal() {
    closeAllPanels();
    hideAllViews();
    infoView.classList.add('active-view');
    window.scrollTo(0, 0);
}

const originalNavigateToLogin = navigateToLogin;
navigateToLogin = function(mode, type) {
    closeAllPanels();
    hideAllViews();
    loginView.classList.add('active-view');
    setAuthMode(mode);
    if (type && mode !== 'register') { setUserType(type); }
    pushHistoryState('login');
    window.scrollTo(0, 0);
};

const originalNavigateToHome = navigateToHome;
navigateToHome = function() {
    navigateToHomeInternal();
    pushHistoryState('landing');
};

const originalNavigateToInfo = navigateToInfo;
navigateToInfo = function(pageKey) {
    closeAllPanels();
    hideAllViews();
    const data = pageData[pageKey];
    if (data) {
        document.getElementById('pageTitle').innerText = data.title;
        document.getElementById('pageSubtitle').innerText = data.subtitle;
        document.getElementById('pageContent').innerHTML = data.content;
        infoView.classList.add('active-view');
        pushHistoryState('info');
        window.scrollTo(0, 0);
    }
};

// --- Society Search ---
function setupSocietySearch() {
  const societyInputs = document.querySelectorAll('input[placeholder*="Search for"][placeholder*="society"], input[placeholder*="society"]');
  societyInputs.forEach(input => {
    input.addEventListener('input', async (e) => {
      const searchTerm = e.target.value.toLowerCase();
      if (searchTerm.length < 2) return;
      try {
        const response = await fetch(`/api/societies?search=${searchTerm}`);
        const data = await response.json();
        if (data.success) {
          showSocietyDropdown(input, data.societies);
        }
      } catch (error) {
        console.log('Error fetching societies:', error);
      }
    });
  });
}

function showSocietyDropdown(input, societies) {
  let dropdown = input.nextElementSibling;
  if (!dropdown || !dropdown.classList.contains('society-dropdown')) {
    dropdown = document.createElement('div');
    dropdown.className = 'society-dropdown';
    dropdown.style.cssText = 'position:absolute;background:white;border:1px solid #ddd;border-radius:8px;max-height:200px;overflow-y:auto;z-index:1000;width:' + input.offsetWidth + 'px;';
    input.parentElement.style.position = 'relative';
    input.parentElement.insertBefore(dropdown, input.nextElementSibling);
  }
  
  dropdown.innerHTML = '';
  if (societies.length === 0) {
    dropdown.innerHTML = `<div style="padding:10px;color:#999;text-align:center;">Can't find your society? <a onclick="navigateToLogin('register', 'resident')" style="color:var(--brand);cursor:pointer;font-weight:600;">Register it now!</a></div>`;
  } else {
    societies.forEach(society => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:10px;border-bottom:1px solid #eee;cursor:pointer;';
      item.innerHTML = `<div style="font-weight:600;">${society.name}</div><div style="font-size:12px;color:#888;">${society.address || 'Address not available'}</div>`;
      item.onclick = () => {
        input.value = society.name;
        dropdown.style.display = 'none';
      };
      dropdown.appendChild(item);
    });
  }
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    sidebarOverlay.addEventListener('click', toggleSidebar);
    notificationOverlay.addEventListener('click', toggleNotifications);
    updateActiveForm();
    setupSocietySearch();
    initHistoryNavigation();
});
