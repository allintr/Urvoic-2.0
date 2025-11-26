// Paste your Guard Dashboard JavaScript here
// --- MASTER "ON" SWITCH ---
// This runs all the setup functions after the page loads.
document.addEventListener('DOMContentLoaded', () => {
    // This is the most important fix: It renders all icons.
    lucide.createIcons();
    
    // Initialize all our features
    initRating();
    initSidebar();
    initProfileEdit();
    initVisitorLogPage();
    initQrModal();
    initMaintVisitorsPage(); // This is the updated function
    initShiftReportPage();
    initResidentsPage();
    initLogout();
});

function initLogout() {
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fetch('/api/logout', {method: 'POST'})
            .then(() => { window.location.href = '/'; })
            .catch(err => showToast('Logout failed', 'error'));
        });
    }
}


// --- Toast Notification Function ---
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

// --- Rating Logic ---
function initRating() {
    const ratingContainer = document.getElementById('urvoic-rating');
    if (!ratingContainer) return; 
    const ratingMessage = document.getElementById('rating-message');
    const stars = ratingContainer.querySelectorAll('i');

    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const clickedRating = parseInt(e.currentTarget.dataset.rating);
            stars.forEach(s => {
                s.classList.remove('star-filled');
                s.style.pointerEvents = 'none';
                s.style.stroke = '#ccc';
                s.style.fill = 'none';
            });
            for (let i = 0; i < clickedRating; i++) {
                stars[i].classList.add('star-filled');
            }
            const messages = {
                1: "Oh no! We'll work hard to improve.",
                2: "We appreciate your honest feedback.",
                3: "Thank you! We aim for better.",
                4: "Great to hear! We are close to perfect.",
                5: "Fantastic! Your 5-star rating makes our day!",
            };
            ratingMessage.textContent = messages[clickedRating];
        });
        star.addEventListener('mouseover', (e) => {
            const hoverRating = parseInt(e.currentTarget.dataset.rating);
            stars.forEach((s, index) => {
                if (index < hoverRating) {
                    s.style.stroke = '#00b67a'; 
                } else {
                    s.style.stroke = '#ccc';
                }
            });
        });
        star.addEventListener('mouseout', () => {
            stars.forEach(s => s.style.stroke = '#ccc');
        });
    });
}

// --- Sidebar & Notification Toggle ---
function initSidebar() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar-nav');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationOverlay = document.getElementById('notificationOverlay');

    function closeAllPanels() {
        if (sidebar) sidebar.classList.remove('is-open');
        if (hamburgerBtn) hamburgerBtn.classList.remove('is-active'); 
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        if (notificationPanel) notificationPanel.classList.remove('active');
        if (notificationOverlay) notificationOverlay.classList.remove('active');
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = sidebar.classList.contains('is-open');
            closeAllPanels(); // Close all panels first
            if (!isOpen) {
                sidebar.classList.add('is-open');
                sidebarOverlay.classList.add('active');
                hamburgerBtn.classList.add('is-active');
            }
        });
    }
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeAllPanels); 
    if (notificationOverlay) notificationOverlay.addEventListener('click', closeAllPanels);
    
    // Close sidebar when a link is clicked
    if (sidebar) {
        sidebar.querySelectorAll('.btn-sidebar').forEach(btn => {
            btn.addEventListener('click', closeAllPanels);
        });
    }
}

// Global function to toggle notifications
function toggleNotifications() {
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationOverlay = document.getElementById('notificationOverlay');
    if (!notificationPanel || !notificationOverlay) return;
    const isOpen = notificationPanel.classList.contains('active');
    
    // Close sidebar if open
    document.getElementById('sidebar-nav')?.classList.remove('is-open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
    document.getElementById('hamburger-btn')?.classList.remove('is-active');
    
    if (isOpen) {
        notificationPanel.classList.remove('active');
        notificationOverlay.classList.remove('active');
    } else {
        notificationPanel.classList.add('active');
        notificationOverlay.classList.add('active');
    }
}

// --- Visitor Log Page Logic (UPDATED) ---
function initVisitorLogPage() {
    const form = document.getElementById('check-in-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const visitorName = document.getElementById('visitor-name').value;
            const flatNo = document.getElementById('visitor-flat').value;
            const purpose = document.getElementById('visitor-purpose').value;
            const entryTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // ADD to new "Pending Permissions" list
            const list = document.getElementById('pending-permissions-list');
            const newItem = document.createElement('div');
            newItem.className = 'member-list-item';
            
            let icon = 'user';
            if (purpose === 'Delivery') icon = 'truck';
            if (purpose === 'Service') icon = 'hard-hat';

            newItem.innerHTML = `
                <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;"><i data-lucide="${icon}"></i></div>
                <div class="member-info" style="flex-grow: 2;">
                    <div class="member-name">${visitorName} (${purpose})</div>
                    <div class="member-detail">To: ${flatNo} • Requested: ${entryTime}</div>
                </div>
                <span class="permission-status status-waiting">Waiting...</span>
            `;
            
            list.prepend(newItem);
            lucide.createIcons({
                nodes: [newItem.querySelector('i')]
            });
            form.reset();
            showToast('Permission Request Sent!', 'success');
        });
    }
}

// This function is called by the "Mark Exit" button
function markVisitorExit(button) {
    const item = button.closest('.member-list-item');
    if (!item) return;
    const visitorNameEl = item.querySelector('.member-name');
    const visitorName = visitorNameEl ? visitorNameEl.innerText : 'Visitor';
    
    item.remove();
    showToast(`${visitorName} marked as Exited.`, 'success');
}


// --- Maintenance Visitors Page Logic (REPLACED) ---
// This is the new function that handles all your requests
function initMaintVisitorsPage() {
    
    // Listener 1: For the "Scheduled Services" list (Resident-booked)
    const scheduledList = document.getElementById('scheduled-services-list');
    if (scheduledList) {
        scheduledList.addEventListener('click', function(e) {
            const button = e.target.closest('.btn-approve.btn-check-in');
            if (button) {
                const item = button.closest('.member-list-item');
                const name = item.dataset.name || 'Service Staff';
                const detail = item.dataset.detail || 'N/A';
                const icon = item.dataset.icon || 'hard-hat';
                
                // Call the check-in function
                markServiceCheckIn(item, name, detail, icon);
            }
        });
    }

    // Listener 2: For the "Expected Businesses" list (1-Day Pass)
    const businessesList = document.getElementById('expected-businesses-list');
    if (businessesList) {
        businessesList.addEventListener('click', function(e) {
            const button = e.target.closest('.btn-approve.btn-check-in');
            if (button) {
                const item = button.closest('.member-list-item');
                const name = item.dataset.name || 'Business Vendor';
                const detail = item.dataset.detail || 'N/A';
                const icon = item.dataset.icon || 'briefcase';
                
                // This calls the SAME check-in function
                markServiceCheckIn(item, name, detail, icon);
            }
        });
    }
    
    // Listener 3: For the "Staff Currently Inside" list
    const insideList = document.getElementById('maint-inside-list');
    if(insideList) {
        insideList.addEventListener('click', function(e) {
            // Check for the "Mark Exit" button
            const exitButton = e.target.closest('.btn-exit');
            if (exitButton) {
                markVisitorExit(exitButton); // Uses the existing function
            }
        });
    }
}

// This is the new helper function for checking-in staff
function markServiceCheckIn(item, name, detail, icon) {
    const entryTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const list = document.getElementById('maint-inside-list');
    if (!list) return; // Safety check
    
    const newItem = document.createElement('div');
    newItem.className = 'member-list-item';
    
    let iconName = icon || 'hard-hat';

    newItem.innerHTML = `
        <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;"><i data-lucide="${iconName}"></i></div>
        <div class="member-info" style="flex-grow: 2;">
            <div class="member-name">${name}</div>
            <div class="member-detail">${detail} • Entered: ${entryTime}</div>
        </div>
        <span class="visitor-status status-entered">Inside</span>
        <div class="member-actions">
            <button class="btn-exit">
                Mark Exit
            </button>
        </div>
    `;
    
    list.prepend(newItem);
    lucide.createIcons({ nodes: [newItem.querySelector('i')] });
    
    item.remove();
    showToast(`${name} marked as Checked-In!`, 'success');
}
// --- (End of Replaced Section) ---


// --- Shift Report Page Logic ---
function initShiftReportPage() {
    const form = document.getElementById('shift-report-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Shift Report Submitted!', 'success');
            // In a real app, you'd send this data to a server
            form.reset();
            showGuardDashboardPage();
        });
    }
}

// --- NEW: Residents Page Logic ---
function initResidentsPage() {
    const searchInput = document.getElementById('resident-search-input');
    if (!searchInput) return;
    
    const residentCards = document.querySelectorAll('.resident-card');
    const noResultsEl = document.getElementById('no-resident-found');

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        let foundOne = false;
        
        residentCards.forEach(card => {
            const searchTerm = card.dataset.searchTerm.toLowerCase();
            if (searchTerm.includes(query)) {
                card.style.display = 'block';
                foundOne = true;
            } else {
                card.style.display = 'none';
            }
        });
        
        noResultsEl.style.display = foundOne ? 'none' : 'block';
    });
    
    // Event delegation for status toggles
    const list = document.getElementById('resident-directory-list');
    if(list) {
        list.addEventListener('click', function(e) {
            const toggle = e.target.closest('.status-toggle');
            if (toggle) {
                toggleStatus(toggle);
            }
        });
    }
}

function toggleStatus(button) {
    // Find the name of the member/vehicle
    const memberNameEl = button.previousElementSibling;
    if (!memberNameEl) return;
    const memberName = memberNameEl.innerText;
    
    let newStatus, newIcon;

    if (button.classList.contains('status-in')) {
        // Mark as OUT
        button.classList.remove('status-in');
        button.classList.add('status-out');
        newStatus = "OUT";
        newIcon = 'arrow-right';
    } else {
        // Mark as IN
        button.classList.remove('status-out');
        button.classList.add('status-in');
        newStatus = "IN";
        newIcon = 'check';
    }
    
    // Update button text/icon
    button.innerHTML = `<i data-lucide="${newIcon}"></i> ${newStatus}`;
    lucide.createIcons({ nodes: [button.querySelector('i')] });
    
    showToast(`${memberName} marked as ${newStatus}`, 'success');
}


// --- Profile Edit Logic ---
function initProfileEdit() {
    const profileView = document.getElementById('my-profile-view');
    if (!profileView) return;

    // Handle list items
    const editItems = profileView.querySelectorAll('.profile-detail-item[data-field-name]');
    editItems.forEach(item => {
        const editButton = item.querySelector('.btn-edit-toggle');
        const saveButton = item.querySelector('.btn-save');
        const cancelButton = item.querySelector('.btn-cancel');
        const valueSpan = item.querySelector('.profile-detail-value');
        const editInput = item.querySelector('.profile-edit-input');
        const fieldName = item.dataset.fieldName;

        if (!editButton) return; // Skip non-editable items

        editButton.addEventListener('click', () => {
            editItems.forEach(i => i.classList.remove('is-editing'));
            editInput.value = valueSpan.dataset.originalValue;
            
            // Handle select elements
            if (editInput.tagName === 'SELECT') {
                editInput.value = valueSpan.dataset.originalValue;
            }

            item.classList.add('is-editing');
        });

        cancelButton.addEventListener('click', () => {
            item.classList.remove('is-editing');
        });

        saveButton.addEventListener('click', () => {
            const newValue = editInput.value;
            console.log(`Saving ${fieldName}: ${newValue}`);
            showToast(`${fieldName} updated successfully!`, 'success');
            
            // For <select>, update text to match new value
            if (editInput.tagName === 'SELECT') {
                 valueSpan.textContent = editInput.options[editInput.selectedIndex].text;
            } else {
                valueSpan.textContent = newValue;
            }
            valueSpan.dataset.originalValue = newValue;
            item.classList.remove('is-editing');
        });
    });
    
    // Handle BIO Section
    const bioContainer = profileView.querySelector('.profile-bio-container');
    if (bioContainer) {
        const editButton = bioContainer.querySelector('.btn-edit-toggle');
        const saveButton = bioContainer.querySelector('.btn-save');
        const cancelButton = bioContainer.querySelector('.btn-cancel');
        const valuePara = bioContainer.querySelector('.profile-detail-value');
        const editInput = bioContainer.querySelector('.profile-edit-input');

        editButton.addEventListener('click', () => {
            editInput.value = valuePara.dataset.originalValue;
            bioContainer.classList.add('is-editing');
        });
        cancelButton.addEventListener('click', () => {
            bioContainer.classList.remove('is-editing');
        });
        saveButton.addEventListener('click', () => {
            const newValue = editInput.value;
            showToast('Bio updated successfully!', 'success');
            valuePara.textContent = newValue;
            valuePara.dataset.originalValue = newValue;
            bioContainer.classList.remove('is-editing');
        });
    }
}


// --- Modal Logic ---
const qrModal = document.getElementById('qr-scan-modal'); // New

function openQrModal() {
    if (!qrModal) return;
    qrModal.classList.add('active');
    // In a real app, you would initialize the camera here
    // For now, we simulate a scan
    setTimeout(() => {
        qrModal.classList.remove('active');
        showToast('QR Scanned: Pre-Approved Visitor Found!', 'success');
        
        showVisitorLogPage(); // Go to visitor log page
        // Auto-fill the check-in form
        document.getElementById('visitor-name').value = "Pranav";
        document.getElementById('visitor-flat').value = "A-201";
        document.getElementById('visitor-purpose').value = "Guest";
    }, 2500);
}

function initQrModal() {
    if (qrModal) {
        document.getElementById('cancel-qr-btn').addEventListener('click', () => {
            qrModal.classList.remove('active');
        });
    }
}


// --- Data for Info Pages (Footer Links) ---
const pageData = {
    about: { title: "About Us", subtitle: "Building better communities together", content: `<p>Urvoic is dedicated to connecting neighbors...</p><div class...</div>` },
    contact: { title: "Contact Us", subtitle: "We'd love to hear from you", content: `<p>Have questions or need support? Reach out to us!</p><strong>Email:</strong> support@urvoic.com<br><strong>Phone:</strong> +91 123 456 7890` },
    help: { title: "Help Center", subtitle: "Frequently Asked Questions", content: `<p>How do I manage visitors? ...</p>` },
    privacy: { title: "Privacy Policy", subtitle: "Last updated: Nov 2025", content: `<p>Your privacy is important to us...</p>` },
    terms: { title: "Terms & Conditions", subtitle: "Rules for using Urvoic", content: `<p>By accessing Urvoic, you agree...</p>` },
    guidelines: { title: "Community Guidelines", subtitle: "Keeping our community safe", content: `<p>To ensure a positive experience...</p>` }
};

// --- Search Functions ---
function focusSearch() {
    showGuardDashboardPage();
    const searchInput = document.getElementById('heroSearchInput');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { searchInput.focus(); }, 300);
}

function handleSearch() {
    const searchInput = document.getElementById('heroSearchInput');
    const query = searchInput.value.toLowerCase().trim();
    
    if (query.includes('visitor')) {
        showVisitorLogPage();
    } else if (query.includes('gate')) {
        showGateStatusPage();
    } else if (query.includes('maintenance') || query.includes('maint')) {
        showMaintVisitorsPage();
    } else if (query.includes('shift') || query.includes('report')) {
        showShiftReportPage();
    } else if (query.includes('resident')) {
        showResidentsPage();
    } else {
        showToast('No page found for "' + query + '"', 'success');
    }
}


// --- View-Switching Logic ---
const allViews = document.querySelectorAll('.view-section');
const guardDashboardView = document.getElementById('guard-dashboard-view');
const visitorLogView = document.getElementById('visitor-log-view');
const gateStatusView = document.getElementById('gate-status-view');
const maintVisitorsView = document.getElementById('maint-visitors-view');
const shiftReportView = document.getElementById('shift-report-view');
const residentsView = document.getElementById('residents-view');
const myProfileView = document.getElementById('my-profile-view');
const infoView = document.getElementById('info-view');

function hideAllViews() {
    allViews.forEach(view => view.classList.remove('active-view'));
}

function showGuardDashboardPage() {
    hideAllViews();
    guardDashboardView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showVisitorLogPage() { 
    hideAllViews();
    visitorLogView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showGateStatusPage() { 
    hideAllViews();
    gateStatusView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showMaintVisitorsPage() { 
    hideAllViews();
    maintVisitorsView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showShiftReportPage() { 
    hideAllViews();
    shiftReportView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showResidentsPage() { 
    hideAllViews();
    residentsView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showMyProfilePage() { 
    hideAllViews();
    myProfileView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function navigateToInfo(pageKey) {
    hideAllViews();
    const data = pageData[pageKey];
    if (data) {
        document.getElementById('pageTitle').innerText = data.title;
        document.getElementById('pageSubtitle').innerText = data.subtitle;
        document.getElementById('pageContent').innerHTML = data.content;
        infoView.classList.add('active-view');
        // This is important for the FAQ icons
        lucide.createIcons();
        window.scrollTo(0, 0);
    }
}