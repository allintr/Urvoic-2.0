// Paste your Admin Dashboard JavaScript here
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initRating();
    initSidebar();
    initAnnouncementPage();
    initMemberTabs();
    initMaintenancePage();
    initPaymentsPage();
    initProfileEdit();
    initVisitorLogPage();
    initVisitorPageTabs(); // NEW: Specific tab logic for visitor page
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
            closeAllPanels();
            if (!isOpen) {
                sidebar.classList.add('is-open');
                sidebarOverlay.classList.add('active');
                hamburgerBtn.classList.add('is-active');
            }
        });
    }
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeAllPanels); 
    if (notificationOverlay) notificationOverlay.addEventListener('click', closeAllPanels);
    if (sidebar) {
        sidebar.querySelectorAll('.btn-sidebar').forEach(btn => {
            btn.addEventListener('click', closeAllPanels);
        });
    }
}

function toggleNotifications() {
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationOverlay = document.getElementById('notificationOverlay');
    if (!notificationPanel || !notificationOverlay) return;
    const isOpen = notificationPanel.classList.contains('active');
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

function initAnnouncementPage() {
    const showFormBtn = document.getElementById('show-form-btn');
    const cancelBtn = document.getElementById('cancel-announcement-btn');
    const form = document.getElementById('create-announcement-form');
    const pastSection = document.getElementById('past-announcements-section');
    if (!showFormBtn || !cancelBtn || !form || !pastSection) return;
    const createBtnRow = document.getElementById('create-announcement-row-id');

    showFormBtn.addEventListener('click', () => {
        form.style.display = 'block';
        showFormBtn.style.display = 'none'; 
        form.after(pastSection);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    cancelBtn.addEventListener('click', () => {
        form.style.display = 'none';
        showFormBtn.style.display = 'inline-flex'; 
        createBtnRow.before(pastSection);
    });
}

function initMemberTabs() {
    const toggle = document.getElementById('member-toggle');
    if (!toggle) return;
    const buttons = toggle.querySelectorAll('.toggle-btn');
    const contents = document.querySelectorAll('#manage-members-view .tab-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.dataset.target;
            contents.forEach(content => {
                content.classList.toggle('active', content.id === targetId);
            });
        });
    });
}

// --- NEW: Visitor Page Tabs Logic ---
function initVisitorPageTabs() {
    const toggle = document.getElementById('visitorToggle');
    if (!toggle) return;
    const buttons = toggle.querySelectorAll('.toggle-btn');
    const contents = document.querySelectorAll('#visitor-log-view .visitor-form-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.dataset.target;
            contents.forEach(content => {
                content.classList.toggle('active', content.id === targetId);
            });
        });
    });
}

function initMaintenancePage() {
    const filterToggle = document.getElementById('maintenance-filter-toggle');
    const table = document.getElementById('maintenance-table');
    if (!filterToggle || !table) return;
    
    const filterBtns = filterToggle.querySelectorAll('.filter-btn');
    const tableRows = table.querySelectorAll('tbody tr');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            tableRows.forEach(row => {
                row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
            });
        });
    });

    table.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const newStatus = e.target.value;
            e.target.className = 'status-select';
            e.target.classList.add(`status-${newStatus}`);
            e.target.closest('tr').dataset.status = newStatus;
            showToast('Status updated!', 'success');
        });
    });
}

let currentPayingResident = null;
function initPaymentsPage() {
    const detailView = document.getElementById('payment-detail-view');
    const summaryListContainer = document.getElementById('payment-summary-list-container');
    if (!detailView || !summaryListContainer) return;
    
    summaryListContainer.querySelectorAll('.payment-summary-item').forEach(item => {
        item.addEventListener('click', () => {
            const flat = item.dataset.flat;
            const resident = item.dataset.resident;
            const amount = item.dataset.amount;
            const month = item.dataset.month;
            const status = item.dataset.status;
            const date = item.dataset.date;
            currentPayingResident = item;
            
            document.getElementById('detail-flat').innerText = flat;
            document.getElementById('detail-resident').innerText = resident;
            document.getElementById('detail-amount').innerText = amount;
            document.getElementById('detail-month').innerText = month;
            document.getElementById('detail-status').innerText = status;
            document.getElementById('detail-date').innerText = date;
            
            const reminderBtn = document.getElementById('btn-send-reminder');
            const paidBtn = document.getElementById('btn-mark-paid');
            
            if (status === 'Pending') {
                reminderBtn.style.display = 'flex';
                paidBtn.style.display = 'flex';
                document.getElementById('payment-detail-view').style.borderColor = 'var(--pending-red)';
            } else {
                reminderBtn.style.display = 'none';
                paidBtn.style.display = 'none';
                document.getElementById('payment-detail-view').style.borderColor = 'var(--brand)';
            }

            detailView.style.display = 'block';
            summaryListContainer.before(detailView);
            detailView.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    document.getElementById('cancel-payment-detail-btn').addEventListener('click', () => {
        detailView.style.display = 'none';
        currentPayingResident = null;
    });

    document.getElementById('btn-send-reminder').addEventListener('click', () => {
        const residentName = document.getElementById('detail-resident').innerText;
        showToast(`Reminder sent to ${residentName}!`, 'success');
    });
    
    document.getElementById('btn-mark-paid').addEventListener('click', () => {
        const residentName = document.getElementById('detail-resident').innerText;
        openMarkPaidModal(residentName);
    });
}

function initVisitorLogPage() {
    const form = document.querySelector('#visitor-log-view form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Visitor Pre-Approved!', 'success');
            form.reset();
        });
    }
}

// --- UPDATED: Profile Edit Logic to handle Dropdowns/Multiple Inputs ---
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
        const fieldName = item.dataset.fieldName;
        
        // Find inputs - might be one or multiple (like in Vehicle)
        const editContainer = item.querySelector('.profile-detail-edit');
        const inputs = editContainer.querySelectorAll('.profile-edit-input');

        if (!editButton) return; 

        editButton.addEventListener('click', () => {
            editItems.forEach(i => i.classList.remove('is-editing'));
            
            // Special handling if there are multiple inputs (like Vehicle)
            if(inputs.length > 1) {
                // Don't auto-fill for now, just show the edit view
            } else if (inputs.length === 1) {
                inputs[0].value = valueSpan.dataset.originalValue;
            }
            item.classList.add('is-editing');
        });

        cancelButton.addEventListener('click', () => {
            item.classList.remove('is-editing');
        });

        saveButton.addEventListener('click', () => {
            let newValue = "";
            
            if (inputs.length > 1) {
                // Combine values (e.g. Car - DL 1234)
                let parts = [];
                inputs.forEach(input => parts.push(input.value));
                newValue = parts.join(" - "); 
            } else {
                newValue = inputs[0].value;
            }
            
            showToast(`${fieldName} updated successfully!`, 'success');
            valueSpan.textContent = newValue;
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

const assignModal = document.getElementById('assign-modal');
const markPaidModal = document.getElementById('mark-paid-modal');
const assignWorkModal = document.getElementById('assign-work-modal');

function openAssignModal(complaintId, currentAssignee) {
    if (!assignModal) return;
    assignModal.classList.add('active');
}
if (assignModal) {
    document.getElementById('save-assign-btn').addEventListener('click', () => {
        assignModal.classList.remove('active');
        showToast('Technician Assigned!', 'success');
    });
    document.getElementById('cancel-assign-btn').addEventListener('click', () => {
        assignModal.classList.remove('active');
    });
}

function openMarkPaidModal(residentName) {
    if (!markPaidModal) return;
    markPaidModal.classList.add('active');
}
if (markPaidModal) {
    document.getElementById('save-paid-btn').addEventListener('click', () => {
        markPaidModal.classList.remove('active');
        showToast('Payment marked as PAID!', 'success');
        if (currentPayingResident) {
            currentPayingResident.querySelector('.payment-status-badge').className = 'payment-status-badge paid';
            currentPayingResident.querySelector('.payment-status-badge').innerText = 'Paid';
        }
        document.getElementById('cancel-payment-detail-btn').click();
    });
    document.getElementById('cancel-paid-btn').addEventListener('click', () => {
        markPaidModal.classList.remove('active');
    });
}

function openAssignWorkModal(serviceName) {
    if (!assignWorkModal) return;
    document.getElementById('assign-work-service-name').innerText = serviceName;
    assignWorkModal.classList.add('active');
}
if (assignWorkModal) {
    document.getElementById('save-assign-work-btn').addEventListener('click', () => {
        assignWorkModal.classList.remove('active');
        showToast('Work Assigned!', 'success');
    });
    document.getElementById('cancel-assign-work-btn').addEventListener('click', () => {
        assignWorkModal.classList.remove('active');
    });
}

const pageData = {
    about: { title: "About Us", subtitle: "Building better communities together", content: `<p>Urvoic is dedicated to connecting neighbors.</p>` },
    contact: { title: "Contact Us", subtitle: "We'd love to hear from you", content: `<p>Email us at support@urvoic.com</p>` },
    help: { title: "Help Center", subtitle: "Frequently Asked Questions", content: `<p>Visit our support portal.</p>` },
    privacy: { title: "Privacy Policy", subtitle: "Last updated: Nov 2025", content: `<p>Your privacy is important to us.</p>` }
};

function focusSearch() {
    showAdminDashboardPage();
    const searchInput = document.getElementById('heroSearchInput');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { searchInput.focus(); }, 300);
}

function handleSearch() {
    const searchInput = document.getElementById('heroSearchInput');
    const query = searchInput.value.toLowerCase().trim();
    
    if (query.includes('maintenance')) { showMaintenancePage(); } 
    else if (query.includes('member') || query.includes('resident')) { showManageMembersPage(); } 
    else if (query.includes('visitor')) { showVisitorLogPage(); } 
    else if (query.includes('payment')) { showPaymentsPage(); } 
    else if (query.includes('announcement')) { showAnnouncementPage(); } 
    else if (query.includes('chat')) { showResidentsChatPage(); } 
    else { showToast('No page found for "' + query + '"', 'success'); }
}

const allViews = document.querySelectorAll('.view-section');
const adminDashboardView = document.getElementById('admin-dashboard-view');
const announcementView = document.getElementById('announcement-view');
const manageMembersView = document.getElementById('manage-members-view');
const maintenanceView = document.getElementById('maintenance-view');
const visitorLogView = document.getElementById('visitor-log-view');
const paymentsView = document.getElementById('payments-view');
const residentsChatView = document.getElementById('residents-chat-view');
const individualChatView = document.getElementById('individual-chat-view'); 
const myProfileView = document.getElementById('my-profile-view');
const infoView = document.getElementById('info-view');

function hideAllViews() {
    allViews.forEach(view => view.classList.remove('active-view'));
}

function showAdminDashboardPage() { hideAllViews(); adminDashboardView.classList.add('active-view'); window.scrollTo(0, 0); }
function showAnnouncementPage() { hideAllViews(); announcementView.classList.add('active-view'); window.scrollTo(0, 0); }
function showManageMembersPage(tabName = 'residents') { 
    hideAllViews(); 
    manageMembersView.classList.add('active-view');
    const toggle = document.getElementById('member-toggle');
    const targetBtn = toggle.querySelector(`.toggle-btn[data-target="${tabName}-content"]`);
    if (targetBtn) targetBtn.click();
    window.scrollTo(0, 0); 
}
function showMaintenancePage(filterName = 'pending') { 
    hideAllViews(); 
    maintenanceView.classList.add('active-view');
    const filterToggle = document.getElementById('maintenance-filter-toggle');
    const targetBtn = filterToggle.querySelector(`.filter-btn[data-filter="${filterName}"]`);
    if(targetBtn) targetBtn.click();
    window.scrollTo(0, 0); 
}
function showVisitorLogPage() { hideAllViews(); visitorLogView.classList.add('active-view'); window.scrollTo(0, 0); }
function showPaymentsPage() { hideAllViews(); paymentsView.classList.add('active-view'); window.scrollTo(0, 0); }
function showResidentsChatPage() { hideAllViews(); residentsChatView.classList.add('active-view'); window.scrollTo(0, 0); }
function openChat(groupName) { hideAllViews(); individualChatView.classList.add('active-view'); document.getElementById('chatGroupName').innerText = groupName; window.scrollTo(0, 0); }
function sendChatMessage() { const input = document.getElementById('chatInput'); if (input.value.trim() === "") return; showToast('Message Sent!', 'success'); input.value = ""; }
function showMyProfilePage() { hideAllViews(); myProfileView.classList.add('active-view'); window.scrollTo(0, 0); }
function navigateToInfo(pageKey) {
    hideAllViews();
    const data = pageData[pageKey];
    if (data) {
        document.getElementById('pageTitle').innerText = data.title;
        document.getElementById('pageSubtitle').innerText = data.subtitle;
        document.getElementById('pageContent').innerHTML = data.content;
        infoView.classList.add('active-view');
        lucide.createIcons();
        window.scrollTo(0, 0);
    }
}
// Load real dashboard stats from database
function loadDashboardStats() {
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('resident-count').textContent = data.residents;
                document.getElementById('pending-requests').textContent = data.pending_requests;
                document.getElementById('visitors-count').textContent = data.visitors_today;
                document.getElementById('dues-collected').textContent = '₹' + data.dues_collected.toLocaleString('en-IN');
            }
        })
        .catch(err => console.log('Stats loaded with defaults'));
}

// Load stats on page load
window.addEventListener('load', loadDashboardStats);
