// Paste your Admin Dashboard JavaScript here
let navigationHistory = ['admin-dashboard-view'];
let currentView = 'admin-dashboard-view';

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
    initVisitorPageTabs();
    initLogout();
    initHomeLinkNav();
    initAdminPhotoUpload();
    initAdminNotifications();
    initBackButtonHandling();
    initPaymentDetailButtons();
    initChatInput();
    loadAdminDashboardData();
    loadActivityLogs();
    loadMyProfileData();
});

function initChatInput() {
    const input = document.getElementById('chatInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
}

function initBackButtonHandling() {
    window.history.pushState({ view: 'admin-dashboard-view' }, '', window.location.pathname);
    
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view) {
            if (event.state.view === 'admin-dashboard-view' && currentView === 'admin-dashboard-view') {
                showLogoutConfirmation();
                window.history.pushState({ view: 'admin-dashboard-view' }, '', window.location.pathname);
            } else {
                navigateToView(event.state.view, false);
            }
        } else {
            showLogoutConfirmation();
            window.history.pushState({ view: currentView }, '', window.location.pathname);
        }
    });
}

function showLogoutConfirmation() {
    if (confirm('Do you want to logout or exit?')) {
        fetch('/api/logout', {method: 'POST'})
            .then(() => { window.location.href = '/'; })
            .catch(err => showToast('Logout failed', 'error'));
    }
}

function navigateToView(viewId, addToHistory = true) {
    const allViews = document.querySelectorAll('.view-section');
    allViews.forEach(view => view.classList.remove('active-view'));
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active-view');
        currentView = viewId;
        
        if (addToHistory && viewId !== navigationHistory[navigationHistory.length - 1]) {
            navigationHistory.push(viewId);
            window.history.pushState({ view: viewId }, '', window.location.pathname);
        }
        
        window.scrollTo(0, 0);
        lucide.createIcons();
    }
}

function loadAdminDashboardData() {
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const residentCount = document.getElementById('resident-count');
                const pendingRequests = document.getElementById('pending-requests');
                const visitorsCount = document.getElementById('visitors-count');
                const duesCollected = document.getElementById('dues-collected');
                
                if (residentCount) residentCount.textContent = data.residents || 0;
                if (pendingRequests) pendingRequests.textContent = data.pending_requests || 0;
                if (visitorsCount) visitorsCount.textContent = data.visitors_today || 0;
                if (duesCollected) duesCollected.textContent = '₹' + (data.dues_collected || 0);
            }
        })
        .catch(err => console.log('Stats loaded with defaults'));
}

function loadActivityLogs() {
    fetch('/api/activity-logs')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.activities) {
                const list = document.querySelector('.activity-list');
                if (list && data.activities.length > 0) {
                    list.innerHTML = data.activities.slice(0, 5).map(act => {
                        const icon = getActivityIcon(act.action);
                        const timeAgo = getTimeAgo(new Date(act.created_at));
                        return `<li><i data-lucide="${icon}" class="activity-icon-sm" style="color: var(--brand);"></i><span class="activity-text">${act.description}</span><span class="activity-timestamp">${timeAgo}</span></li>`;
                    }).join('');
                    lucide.createIcons();
                } else if (list) {
                    list.innerHTML = '<li style="text-align:center;color:#999;">No recent activity</li>';
                }
            }
        })
        .catch(err => console.log('Activity loaded with defaults'));
}

function getActivityIcon(action) {
    const icons = {
        'User Approved': 'user-check',
        'User Denied': 'user-x',
        'Announcement Created': 'megaphone',
        'Maintenance Assigned': 'wrench',
        'Visitor Approved': 'door-open',
        'Payment Received': 'wallet',
        'Login': 'log-in',
        'Signup': 'user-plus'
    };
    return icons[action] || 'activity';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

function loadMyProfileData() {
    fetch('/api/current-user')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user) {
                const user = data.user;
                
                const nameEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Name"] .profile-detail-value');
                if (nameEl) nameEl.textContent = user.full_name || 'N/A';
                
                const emailEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Email"] .profile-detail-value');
                if (emailEl) emailEl.textContent = user.email || 'N/A';
                
                const phoneEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Phone"] .profile-detail-value');
                if (phoneEl) phoneEl.textContent = user.phone || 'N/A';
                
                const roleEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Role"] .profile-detail-value');
                if (roleEl) roleEl.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Admin';
                
                const flatEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Flat Number"] .profile-detail-value');
                if (flatEl) flatEl.textContent = user.flat_number || 'N/A';
                
                const societyEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Society"] .profile-detail-value');
                if (societyEl) societyEl.textContent = user.society_name || 'N/A';
                
                const sidebarName = document.querySelector('.sidebar-profile .profile-name');
                if (sidebarName) sidebarName.textContent = user.full_name || 'Admin';
                
                const sidebarFlat = document.querySelector('.sidebar-profile .profile-flat');
                if (sidebarFlat) sidebarFlat.textContent = user.society_name || 'Society';
                
                const sidebarInitial = document.querySelector('.sidebar-profile .profile-pic-placeholder');
                if (sidebarInitial && user.full_name) {
                    sidebarInitial.textContent = user.full_name.charAt(0).toUpperCase();
                }
                
                const placeholder = document.getElementById('admin-pic-placeholder');
                const profilePic = document.getElementById('admin-profile-pic');
                if (user.profile_photo && profilePic && placeholder) {
                    profilePic.src = user.profile_photo;
                    profilePic.style.display = 'block';
                    placeholder.style.display = 'none';
                } else if (placeholder && user.full_name) {
                    placeholder.textContent = user.full_name.charAt(0).toUpperCase();
                }
            }
        })
        .catch(err => console.log('Error loading profile data'));
}

function initAdminPhotoUpload() {
    const photoInput = document.getElementById('admin-photo-input');
    if (!photoInput) return;
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const photoData = event.target.result;
            fetch('/api/profile/photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo: photoData })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('admin-pic-placeholder').style.display = 'none';
                    const img = document.getElementById('admin-profile-pic');
                    img.src = photoData;
                    img.style.display = 'block';
                    showToast('Profile photo updated!', 'success');
                    addAdminActivity('Profile photo updated');
                } else {
                    showToast('Failed to update photo', 'error');
                }
            })
            .catch(err => showToast('Failed to upload photo', 'error'));
        };
        reader.readAsDataURL(file);
    });
}

function initAdminNotifications() {
    const notifyBtn = document.getElementById('header-notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', () => {
            const panel = document.getElementById('notificationPanel');
            const overlay = document.getElementById('notificationOverlay');
            if (panel) panel.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
        });
    }
}

function addAdminActivity(text) {
    const list = document.querySelector('.activity-list');
    if (!list) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const li = document.createElement('li');
    li.innerHTML = `<i data-lucide="check-circle" class="activity-icon-sm" style="color: var(--brand);"></i><span class="activity-text">${text}</span><span class="activity-timestamp">${time}</span>`;
    list.insertBefore(li, list.firstChild);
    lucide.createIcons({nodes: [li.querySelector('i')]});
}

function addAdminNotification(title, message) {
    const list = document.getElementById('admin-notification-list');
    if (!list) return;
    const li = document.createElement('li');
    li.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--glass); cursor: pointer;';
    li.innerHTML = `<strong>${title}</strong><br><small style="color: var(--muted);">${message}</small>`;
    list.insertBefore(li, list.firstChild);
}

function initHomeLinkNav() {
    const brandLink = document.querySelector('.brand');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showAdminDashboardPage();
        });
    }
}

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
            
            fetch('/api/rating', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: clickedRating })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('Thank you for your rating!', 'success');
                } else {
                    showToast('Failed to submit rating', 'error');
                }
            })
            .catch(err => showToast('Error submitting rating', 'error'));
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

let currentAdminQRData = null;

function preApproveVisitorAdmin() {
    const name = document.getElementById('visitor-name').value.trim();
    const flat = document.getElementById('visitor-flat-admin').value.trim();
    const type = document.getElementById('visitor-type')?.value || 'Guest';
    const date = document.getElementById('visitor-date')?.value || '';
    const time = document.getElementById('visitor-time')?.value || '';
    
    if (!name || !flat) {
        showToast('Visitor Name and Flat No. are required', 'error');
        return;
    }

    fetch('/api/visitors/pre-approve-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            visitor_name: name,
            flat_number: flat,
            purpose: type,
            expected_date: date || null,
            expected_time: time || null
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentAdminQRData = { name, flat, type, date, time }; 
            const form = document.getElementById('admin-visitor-form');
            if (form) form.reset();
            const qrContainer = document.getElementById('admin-qr-container');
            if (qrContainer) qrContainer.style.display = 'none'; 
            showToast(`Visitor ${name} pre-approved!`, 'success');
            loadVisitorLog();
        } else {
             showToast(data.message || 'Failed to pre-approve visitor', 'error');
        }
    })
    .catch(err => showToast('Error connecting to server for pre-approval', 'error'));
}

function generateAdminVisitorQR() {
    const name = document.getElementById('visitor-name').value;
    const flat = document.getElementById('visitor-flat-admin').value;
    const type = document.getElementById('visitor-type').value;
    const date = document.getElementById('visitor-date').value;
    const time = document.getElementById('visitor-time').value;
    
    if (!name || !flat || !type || !date || !time) {
        showToast('Please fill all fields before generating QR', 'error');
        return;
    }
    
    currentAdminQRData = { name, flat, type, date, time };
    
    const qrData = JSON.stringify(currentAdminQRData);
    const container = document.getElementById('admin-qr-code');
    container.innerHTML = '';
    
    try {
        new QRCode(container, {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        document.getElementById('admin-qr-container').style.display = 'block';
        showToast('QR Code generated successfully!', 'success');
    } catch (err) {
        showToast('Failed to generate QR code', 'error');
        console.error(err);
    }
}

function downloadAdminQRCode() {
    if (!currentAdminQRData) {
        showToast('Generate QR code first', 'error');
        return;
    }
    
    const canvas = document.querySelector('#admin-qr-code canvas');
    if (!canvas) {
        showToast('QR code not found', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `visitor-qr-${currentAdminQRData.name}-${Date.now()}.png`;
    link.click();
    
    showToast('QR Code downloaded!', 'success');
}

function initVisitorLogPage() {
    const form = document.getElementById('admin-visitor-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            preApproveVisitorAdmin();
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
let currentAssignRequestId = null;

function openAssignModal(requestId, currentAssignee) {
    if (!assignModal) return;
    currentAssignRequestId = requestId;
    
    fetch('/api/businesses')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('assign-staff');
            if (select && data.success) {
                select.innerHTML = '<option value="">Unassigned</option>';
                (data.businesses || []).forEach(b => {
                    const selected = (currentAssignee && currentAssignee == b.id) ? 'selected' : '';
                    select.innerHTML += `<option value="${b.id}" ${selected}>${b.business_name} (${b.business_category || 'Service'})</option>`;
                });
            }
            assignModal.classList.add('active');
        })
        .catch(err => {
            console.log('Error loading businesses');
            assignModal.classList.add('active');
        });
}
if (assignModal) {
    document.getElementById('save-assign-btn').addEventListener('click', () => {
        const selectedBusinessId = document.getElementById('assign-staff').value;
        if (!currentAssignRequestId) {
            assignModal.classList.remove('active');
            return;
        }
        
        fetch(`/api/maintenance-requests/${currentAssignRequestId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: selectedBusinessId || null })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Business Assigned!', 'success');
                loadMaintenanceRequests();
            } else {
                showToast(data.message || 'Failed to assign business', 'error');
            }
            assignModal.classList.remove('active');
            currentAssignRequestId = null;
        })
        .catch(err => {
            showToast('Error assigning business', 'error');
            assignModal.classList.remove('active');
            currentAssignRequestId = null;
        });
    });
    document.getElementById('cancel-assign-btn').addEventListener('click', () => {
        assignModal.classList.remove('active');
        currentAssignRequestId = null;
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

function openAssignWorkModal(serviceName, businessId) {
    if (!assignWorkModal) return;
    document.getElementById('assign-work-service-name').innerText = serviceName;
    assignWorkModal.dataset.businessId = businessId || '';
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

function showAdminDashboardPage() { 
    navigateToView('admin-dashboard-view');
    loadAdminDashboardData();
    loadActivityLogs();
}

function showAnnouncementPage() { 
    navigateToView('announcement-view');
    loadAnnouncements();
}

function showManageMembersPage(tabName = 'residents') { 
    navigateToView('manage-members-view');
    const toggle = document.getElementById('member-toggle');
    const targetBtn = toggle.querySelector(`.toggle-btn[data-target="${tabName}-content"]`);
    if (targetBtn) targetBtn.click();
    loadPendingMembers();
    loadApprovedMembers();
}

function loadPendingMembers() {
    loadApprovalRequests();
    
    fetch('/api/admin/residents/pending')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayPendingResidents(data.pending_residents || []);
            }
        })
        .catch(err => console.log('Error loading pending residents'));
    
    fetch('/api/admin/guards/pending')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayPendingGuards(data.pending_guards || []);
            }
        })
        .catch(err => console.log('Error loading pending guards'));
}

function loadApprovalRequests() {
    fetch('/api/admin/approval-requests')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayApprovalRequests(data.requests || []);
            }
        })
        .catch(err => console.log('Error loading approval requests'));
}

function loadApprovedMembers() {
    fetch('/api/admin/residents/all')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayApprovedResidents(data.residents || []);
            }
        })
        .catch(err => console.log('Error loading residents'));
    
    fetch('/api/admin/guards/all')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayApprovedGuards(data.guards || []);
            }
        })
        .catch(err => console.log('Error loading guards'));
    
    fetch('/api/businesses')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayApprovedBusinesses(data.businesses || []);
            }
        })
        .catch(err => console.log('Error loading approved businesses'));
}

function displayPendingResidents(residents) {
    const container = document.getElementById('pending-residents-list');
    if (!container) return;
    
    if (residents.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No pending resident requests</p>';
        return;
    }
    
    container.innerHTML = residents.map(r => `
        <div class="member-card" data-user-id="${r.id}">
            <div class="member-info">
                <div class="member-avatar">${r.full_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="member-name">${r.full_name}</div>
                    <div class="member-flat">Flat ${r.flat_number || 'N/A'} | ${r.phone}</div>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn-approve" onclick="approveResident(${r.id})"><i data-lucide="check"></i> Accept</button>
                <button class="btn-reject" onclick="rejectResident(${r.id})"><i data-lucide="x"></i> Reject</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function displayPendingGuards(guards) {
    const container = document.getElementById('pending-guards-list');
    if (!container) return;
    
    if (guards.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No pending guard requests</p>';
        return;
    }
    
    container.innerHTML = guards.map(g => `
        <div class="member-card" data-user-id="${g.id}">
            <div class="member-info">
                <div class="member-avatar">${g.full_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="member-name">${g.full_name}</div>
                    <div class="member-phone">${g.phone}</div>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn-approve" onclick="approveGuard(${g.id})"><i data-lucide="check"></i> Accept</button>
                <button class="btn-reject" onclick="rejectGuard(${g.id})"><i data-lucide="x"></i> Reject</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function displayApprovalRequests(requests) {
    const container = document.getElementById('approval-requests-list');
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No pending join requests</p>';
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="member-card" data-request-id="${req.id}">
            <div class="member-info">
                <div class="member-avatar">${req.requester_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="member-name">${req.requester_name}</div>
                    <div class="member-detail">${req.requester_email} | ${req.user_type}</div>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn-approve" onclick="approveJoinRequest(${req.id})"><i data-lucide="check"></i> Accept</button>
                <button class="btn-reject" onclick="rejectJoinRequest(${req.id})"><i data-lucide="x"></i> Reject</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function displayApprovedResidents(residents) {
    const container = document.getElementById('approved-residents-list');
    if (!container) return;
    
    const filteredResidents = residents.filter(r => r.user_type === 'resident');
    
    if (filteredResidents.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No residents yet</p>';
        return;
    }
    
    container.innerHTML = filteredResidents.map(r => `
        <div class="member-card">
            <div class="member-info">
                <div class="member-avatar">${r.full_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="member-name">${r.full_name}${r.role === 'admin' ? ' <span class="badge-admin">Admin</span>' : ''}</div>
                    <div class="member-flat">Flat ${r.flat_number || 'N/A'} | ${r.phone}</div>
                </div>
            </div>
            <div class="member-actions">
                ${r.role !== 'admin' ? `<button class="btn-primary" onclick="promoteResident(${r.id})" style="font-size:12px;padding:6px 12px;">Promote to Admin</button>` : `<button class="btn-secondary" onclick="demoteAdmin(${r.id})" style="font-size:12px;padding:6px 12px;">Demote to Resident</button>`}
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function displayApprovedGuards(guards) {
    const container = document.getElementById('approved-guards-list');
    if (!container) return;
    
    if (guards.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No guards yet</p>';
        return;
    }
    
    container.innerHTML = guards.map(g => `
        <div class="member-card">
            <div class="member-info">
                <div class="member-avatar">${g.full_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="member-name">${g.full_name}</div>
                    <div class="member-phone">${g.phone}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function approveResident(userId) {
    fetch('/api/admin/residents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Resident approved!', 'success');
            loadPendingMembers();
            loadApprovedMembers();
        } else {
            showToast(data.message || 'Failed to approve resident', 'error');
        }
    })
    .catch(err => showToast('Error approving resident', 'error'));
}

function rejectResident(userId) {
    if (!confirm('Are you sure you want to reject this resident?')) return;
    
    fetch('/api/admin/residents/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Resident request rejected', 'success');
            loadPendingMembers();
        } else {
            showToast(data.message || 'Failed to reject resident', 'error');
        }
    })
    .catch(err => showToast('Error rejecting resident', 'error'));
}

function approveGuard(userId) {
    fetch('/api/admin/guards/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Guard approved!', 'success');
            loadPendingMembers();
            loadApprovedMembers();
        } else {
            showToast(data.message || 'Failed to approve guard', 'error');
        }
    })
    .catch(err => showToast('Error approving guard', 'error'));
}

function rejectGuard(userId) {
    if (!confirm('Are you sure you want to reject this guard?')) return;
    
    fetch('/api/admin/guards/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Guard request rejected', 'success');
            loadPendingMembers();
        } else {
            showToast(data.message || 'Failed to reject guard', 'error');
        }
    })
    .catch(err => showToast('Error rejecting guard', 'error'));
}

function approveJoinRequest(requestId) {
    fetch('/api/admin/approve-join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Join request approved!', 'success');
            loadPendingMembers();
            loadApprovedMembers();
        } else {
            showToast(data.message || 'Failed to approve request', 'error');
        }
    })
    .catch(err => showToast('Error approving request', 'error'));
}

function rejectJoinRequest(requestId) {
    if (!confirm('Are you sure you want to reject this request?')) return;
    
    fetch('/api/admin/reject-join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Join request rejected!', 'success');
            loadPendingMembers();
        } else {
            showToast(data.message || 'Failed to reject request', 'error');
        }
    })
    .catch(err => showToast('Error rejecting request', 'error'));
}

function promoteResident(userId) {
    if (!confirm('Promote this resident to Admin?')) return;
    
    fetch('/api/admin/promote-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Resident promoted to Admin!', 'success');
            loadApprovedMembers();
        } else {
            showToast(data.message || 'Failed to promote resident', 'error');
        }
    })
    .catch(err => showToast('Error promoting resident', 'error'));
}

function demoteAdmin(userId) {
    if (!confirm('Demote this Admin back to Resident?')) return;
    
    fetch('/api/admin/demote-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Admin demoted to Resident!', 'success');
            loadApprovedMembers();
        } else {
            showToast(data.message || 'Failed to demote admin', 'error');
        }
    })
    .catch(err => showToast('Error demoting admin', 'error'));
}

function loadAnnouncements() {
    fetch('/api/announcements')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayAnnouncements(data.announcements || []);
            }
        })
        .catch(err => console.log('Error loading announcements'));
}

function displayAnnouncements(announcements) {
    const container = document.getElementById('past-announcements-list');
    if (!container) return;
    
    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No announcements yet</p>';
        return;
    }
    
    container.innerHTML = announcements.map(a => {
        const date = new Date(a.created_at);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `
            <div class="announcement-card" data-id="${a.id}">
                <div class="announcement-header">
                    <h4>${a.title}</h4>
                    <div class="announcement-actions">
                        <button class="icon-btn-sm" onclick="editAnnouncement(${a.id})"><i data-lucide="pencil"></i></button>
                        <button class="icon-btn-sm" onclick="deleteAnnouncement(${a.id})"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
                <p class="announcement-content">${a.content}</p>
                <span class="announcement-date">${dateStr}</span>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function editAnnouncement(id) {
    const card = document.querySelector(`.announcement-card[data-id="${id}"]`);
    if (!card) return;
    
    const title = card.querySelector('h4').textContent;
    const content = card.querySelector('.announcement-content').textContent;
    
    document.getElementById('ann-title').value = title;
    document.getElementById('ann-desc').value = content;
    document.getElementById('create-announcement-form').style.display = 'block';
    document.getElementById('create-announcement-form').dataset.editId = id;
}

function deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    fetch(`/api/announcements/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Announcement deleted', 'success');
                loadAnnouncements();
            } else {
                showToast(data.message || 'Failed to delete', 'error');
            }
        })
        .catch(err => showToast('Error deleting announcement', 'error'));
}
function showMaintenancePage(filterName = 'pending') { 
    navigateToView('maintenance-view');
    const filterToggle = document.getElementById('maintenance-filter-toggle');
    const targetBtn = filterToggle.querySelector(`.filter-btn[data-filter="${filterName}"]`);
    if(targetBtn) targetBtn.click();
    loadMaintenanceRequests();
}

function showVisitorLogPage() { 
    navigateToView('visitor-log-view');
    loadVisitorLog();
}

function showPaymentsPage() { 
    navigateToView('payments-view');
    loadPayments();
}

function showResidentsChatPage() { 
    navigateToView('residents-chat-view');
    loadChatGroups();
}

function openChat(groupName, groupId) { 
    navigateToView('individual-chat-view');
    document.getElementById('chatGroupName').innerText = groupName;
    document.getElementById('individual-chat-view').dataset.groupId = groupId;
    if (groupId) loadChatMessages(groupId);
}

function sendChatMessage() { 
    const input = document.getElementById('chatInput'); 
    const messageText = input.value.trim();
    const groupId = document.getElementById('individual-chat-view').dataset.groupId;
    
    if (messageText === "" || !groupId) return; 

    fetch(`/api/chat-groups/${groupId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, group_id: groupId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            input.value = "";
            loadChatMessages(groupId); 
        } else {
            showToast(data.message || 'Failed to send message', 'error');
        }
    })
    .catch(err => showToast('Error sending message', 'error'));
}

function showMyProfilePage() { 
    navigateToView('my-profile-view');
    loadMyProfileData();
}

function loadMaintenanceRequests() {
    fetch('/api/maintenance-requests')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayMaintenanceRequests(data.requests || []);
            }
        })
        .catch(err => console.log('Error loading maintenance requests'));
}

function displayMaintenanceRequests(requests) {
    const table = document.getElementById('maintenance-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    let pendingCount = 0;
    let progressCount = 0;
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999;">No maintenance requests</td></tr>';
    } else {
        tbody.innerHTML = requests.map(r => {
            if (r.status === 'pending') pendingCount++;
            if (r.status === 'in_progress') progressCount++;
            
            const date = new Date(r.created_at);
            const timeAgo = getTimeAgo(date);
            const assignedName = r.assigned_business_name ? r.assigned_business_name : '<span class="unassigned">Unassigned</span>';
            
            return `
                <tr data-status="${r.status}" data-id="${r.id}">
                    <td>
                        <div class="complaint-info">
                            <div class="complaint-text">${r.title}</div>
                            <div class="complaint-flat">Flat ${r.flat_number}</div>
                        </div>
                    </td>
                    <td>${r.request_type}</td>
                    <td>${timeAgo}</td>
                    <td><button class="assign-btn" onclick="openAssignModal(${r.id}, '${r.assigned_business_id || 'unassigned'}')">${assignedName}</button></td>
                    <td>
                        <select class="status-select status-${r.status}" onchange="updateRequestStatus(${r.id}, this.value)">
                            <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in_progress" ${r.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="closed" ${r.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </td>
                    <td>
                        <div class="actions-menu">
                            <button class="icon-btn-delete" onclick="deleteRequest(${r.id})"><i data-lucide="trash-2"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    document.getElementById('maint-pending-count').textContent = pendingCount > 0 ? pendingCount : '';
    document.getElementById('maint-progress-count').textContent = progressCount > 0 ? progressCount : '';
    
    lucide.createIcons();
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

function updateRequestStatus(requestId, status) {
    fetch(`/api/maintenance-requests/${requestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Status updated!', 'success');
            loadMaintenanceRequests();
        } else {
            showToast(data.message || 'Failed to update status', 'error');
        }
    })
    .catch(err => showToast('Error updating status', 'error'));
}

function deleteRequest(requestId) {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    fetch(`/api/maintenance-requests/${requestId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Request deleted!', 'success');
            loadMaintenanceRequests();
        } else {
            showToast(data.message || 'Failed to delete', 'error');
        }
    })
    .catch(err => showToast('Error deleting request', 'error'));
}

function loadVisitorLog() {
    fetch('/api/visitor-logs/history')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayVisitorLog(data.visitors || []);
            }
        })
        .catch(err => console.log('Error loading visitor log'));
    
    fetch('/api/visitors/pending')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayPendingVisitors(data.pending_visitors || []);
                const pendingCount = (data.pending_visitors || []).length;
                const pendingTab = document.querySelector('#visitorToggle .toggle-btn[data-target="pending-requests-list"]');
                if (pendingTab) {
                    pendingTab.textContent = `Pending Requests (${pendingCount})`;
                }
            }
        })
        .catch(err => console.log('Error loading pending visitors'));
}

function displayVisitorLog(visitors) {
    const historyContainer = document.querySelector('#visitor-log-view .item-grid'); 
    if (!historyContainer) return;
    
    if (visitors.length === 0) {
        historyContainer.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No visitors recorded yet</p>';
        return;
    }
    
    historyContainer.innerHTML = visitors.map(v => {
        let timeInfo = '';
        let statusClass = 'status-pending';
        let statusText = 'Pending';
        let iconType = 'user';
        
        if (v.status === 'exited') {
            statusClass = 'status-exited';
            statusText = 'Exited';
            iconType = 'log-out';
            if (v.entry_time) {
                const entryDate = new Date(v.entry_time);
                const entryTimeStr = entryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + entryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const exitTimeStr = v.exit_time ? new Date(v.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                timeInfo = `Entered: ${entryTimeStr}<br>Exited: ${exitTimeStr}`;
            } else {
                timeInfo = 'Visit completed';
            }
        } else if (v.status === 'inside') {
            statusClass = 'status-entered';
            statusText = 'Inside';
            iconType = 'door-open';
            if (v.entry_time) {
                const entryDate = new Date(v.entry_time);
                const entryTimeStr = entryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + entryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                timeInfo = `Entered: ${entryTimeStr}`;
            } else {
                timeInfo = 'Currently inside';
            }
        } else if (v.status === 'denied' || v.permission_status === 'rejected' || v.permission_status === 'denied') {
            statusClass = 'status-denied';
            statusText = 'Denied';
            iconType = 'x-circle';
            const attemptDate = v.entry_time ? new Date(v.entry_time) : (v.created_at ? new Date(v.created_at) : new Date());
            const attemptTimeStr = attemptDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + attemptDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            timeInfo = `Attempted: ${attemptTimeStr}`;
        } else if (v.is_pre_approved || v.permission_status === 'pre-approved' || v.permission_status === 'pre_approved') {
            statusClass = 'status-preapproved';
            statusText = 'Pre-Approved';
            iconType = 'calendar-check';
            if (v.expected_date) {
                timeInfo = `Expected: ${v.expected_date} at ${v.expected_time || 'Any time'}`;
            } else {
                timeInfo = 'Awaiting arrival';
            }
        } else if (v.permission_status === 'approved') {
            statusClass = 'status-approved';
            statusText = 'Approved';
            iconType = 'check-circle';
            timeInfo = 'Awaiting entry';
        } else {
            statusClass = 'status-pending';
            statusText = 'Pending';
            iconType = 'clock';
            timeInfo = 'Awaiting approval';
        }
        
        const purposeIcon = (v.purpose || '').toLowerCase().includes('delivery') ? 'truck' : ((v.purpose || '').toLowerCase().includes('service') ? 'briefcase' : 'user');
        
        return `
            <div class="request-card">
                <div class="request-header">
                    <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;"><i data-lucide="${iconType}" style="width:18px; height:18px;"></i></div>
                    <div> 
                        <span class="request-user" style="display:block; font-weight:600;">${v.visitor_name}</span> 
                        <span class="request-flat" style="font-size:12px; color:var(--muted);">Flat No ${v.flat_number}</span> 
                    </div>
                    <span class="request-status ${statusClass}">${statusText}</span>
                </div>
                <div class="request-body">
                    <p class="visitor-history-icon"><i data-lucide="${purposeIcon}"></i> ${v.purpose || 'Guest'}</p>
                    <p style="font-size: 14px; color: var(--muted); margin-top: 4px;">${timeInfo}</p>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function displayPendingVisitors(visitors) {
    const container = document.getElementById('pending-visitor-entries');
    if (!container) return;
    
    if (visitors.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No pending visitor requests</p>';
        return;
    }
    
    container.innerHTML = visitors.map(v => `
        <div class="visitor-card" data-id="${v.id}" style="display:flex; align-items:center; justify-content:space-between; padding:12px; border:1px solid var(--glass); border-radius:8px; margin-bottom:12px;">
            <div class="visitor-info" style="display:flex; align-items:center; gap:12px;">
                <div class="visitor-avatar" style="width:40px; height:40px; border-radius:50%; background:var(--blue-bg); display:flex; align-items:center; justify-content:center; font-weight:600; color:var(--blue);">${v.visitor_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="visitor-name" style="font-weight:600;">${v.visitor_name}</div>
                    <div class="visitor-detail" style="font-size:13px; color:var(--muted);">Flat ${v.flat_number} | ${v.purpose || 'Guest'}</div>
                </div>
            </div>
            <div class="visitor-actions" style="display:flex; gap:8px;">
                <button class="btn-approve" onclick="approveVisitor(${v.id})" style="padding:8px 12px; background:var(--brand); color:white; border:none; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:4px;"><i data-lucide="check" style="width:16px; height:16px;"></i> Approve</button>
                <button class="btn-reject" onclick="denyVisitor(${v.id})" style="padding:8px 12px; background:#dc3545; color:white; border:none; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:4px;"><i data-lucide="x" style="width:16px; height:16px;"></i> Deny</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function approveVisitor(id) {
    fetch('/api/visitors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Visitor approved!', 'success');
            loadVisitorLog();
        } else {
            showToast(data.message || 'Failed to approve', 'error');
        }
    })
    .catch(err => showToast('Error approving visitor', 'error'));
}

function denyVisitor(id) {
    fetch('/api/visitors/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Visitor denied', 'success');
            loadVisitorLog();
        } else {
            showToast(data.message || 'Failed to deny', 'error');
        }
    })
    .catch(err => showToast('Error denying visitor', 'error'));
}

function loadPayments() {
    fetch('/api/payments')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayPayments(data.payments || []);
            }
        })
        .catch(err => console.log('Error loading payments'));
}

function displayPayments(payments) {
    const container = document.getElementById('payment-summary-list-container');
    if (!container) return;
    
    const memberList = container.querySelector('.member-list');
    if (!memberList) return;
    
    if (payments.length === 0) {
        memberList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No payment records</p>';
        return;
    }
    
    let collectedTotal = 0;
    let pendingTotal = 0;
    
    payments.forEach(p => {
        if (p.status === 'paid') {
            collectedTotal += parseFloat(p.amount);
        } else {
            pendingTotal += parseFloat(p.amount);
        }
    });
    
    const collectedEl = document.getElementById('payments-collected-total');
    const pendingEl = document.getElementById('payments-pending-total');
    if (collectedEl) collectedEl.textContent = `₹${collectedTotal.toLocaleString('en-IN')}`;
    if (pendingEl) pendingEl.textContent = `₹${pendingTotal.toLocaleString('en-IN')}`;
    
    memberList.innerHTML = payments.map(p => {
        const statusClass = p.status === 'paid' ? 'paid' : 'pending';
        const bgColor = p.status === 'paid' ? '#e5f6e8' : '#fdecec';
        const initial = (p.payer_name || 'U').charAt(0).toUpperCase();
        const dateStr = p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
        
        return `
            <div class="member-list-item payment-summary-item" 
                 data-id="${p.id}" 
                 data-flat="${p.flat_number}" 
                 data-resident="${p.payer_name}" 
                 data-amount="₹${p.amount}" 
                 data-status="${p.status}" 
                 data-date="${dateStr}"
                 onclick="showPaymentDetail(this)">
                <div class="profile-pic-placeholder-sm" style="background-color: ${bgColor};">${initial}</div>
                <div class="member-info">
                    <div class="member-name">${p.payer_name || 'Unknown'}</div>
                    <div class="member-detail">Flat ${p.flat_number}</div>
                </div>
                <div class="member-actions">
                    <span class="payment-status-badge ${statusClass}">${p.status === 'paid' ? 'Paid' : 'Pending'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function showPaymentDetail(element) {
    const id = element.dataset.id;
    const flat = element.dataset.flat;
    const resident = element.dataset.resident;
    const amount = element.dataset.amount;
    const status = element.dataset.status;
    const date = element.dataset.date;
    
    document.getElementById('detail-flat').textContent = flat;
    document.getElementById('detail-resident').textContent = resident;
    document.getElementById('detail-amount').textContent = amount;
    document.getElementById('detail-status').textContent = status === 'paid' ? 'Paid' : 'Pending';
    document.getElementById('detail-date').textContent = date;
    
    const detailView = document.getElementById('payment-detail-view');
    detailView.style.display = 'block';
    detailView.dataset.paymentId = id;
    
    const markPaidBtn = document.getElementById('btn-mark-paid');
    const reminderBtn = document.getElementById('btn-send-reminder');
    
    if (status === 'paid') {
        markPaidBtn.style.display = 'none';
        reminderBtn.style.display = 'none';
    } else {
        markPaidBtn.style.display = 'inline-flex';
        reminderBtn.style.display = 'inline-flex';
    }
}

function markAsPaid(paymentId) {
    fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Payment marked as paid!', 'success');
            document.getElementById('payment-detail-view').style.display = 'none';
            loadPayments();
        } else {
            showToast(data.message || 'Failed to update payment', 'error');
        }
    })
    .catch(err => showToast('Error updating payment', 'error'));
}

function sendReminder(paymentId) {
    showToast('Reminder sent successfully!', 'success');
}

function initPaymentDetailButtons() {
    const markPaidBtn = document.getElementById('btn-mark-paid');
    const reminderBtn = document.getElementById('btn-send-reminder');
    const cancelBtn = document.getElementById('cancel-payment-detail-btn');
    
    if (markPaidBtn) {
        markPaidBtn.addEventListener('click', function() {
            const paymentId = document.getElementById('payment-detail-view').dataset.paymentId;
            if (paymentId) markAsPaid(paymentId);
        });
    }
    
    if (reminderBtn) {
        reminderBtn.addEventListener('click', function() {
            const paymentId = document.getElementById('payment-detail-view').dataset.paymentId;
            if (paymentId) sendReminder(paymentId);
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('payment-detail-view').style.display = 'none';
        });
    }
}

function loadChatGroups() {
    fetch('/api/chat-groups/society')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayChatGroups(data.groups || []);
            }
        })
        .catch(err => console.log('Error loading chat groups'));
}

function displayChatGroups(groups) {
    const container = document.querySelector('#residents-chat-view .chat-list-container');
    if (!container) return;
    
    const societyGroup = groups.find(g => g.group_type === 'society');
    
    let html = '';
    
    if (societyGroup) {
        html += `
            <div class="chat-list-item" onclick="openChat('${societyGroup.name}', ${societyGroup.id})">
                <div class="chat-icon" style="background-color: var(--green-bg); color: var(--brand);">
                    <i data-lucide="users"></i>
                </div>
                <div class="chat-info">
                    <div class="chat-group-name">${societyGroup.name}</div>
                    <div class="chat-last-message">${societyGroup.last_message || 'Start the conversation!'}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${societyGroup.last_time ? getTimeAgo(new Date(societyGroup.last_time)) : ''}</div>
                </div>
            </div>
        `;
    } else {
        html = '<p style="text-align:center;color:#999;padding:20px;">No chat groups found.</p>';
    }
    
    container.innerHTML = html;
    
    if (!document.getElementById('create-group-btn-container')) {
        container.insertAdjacentHTML('afterend', `
            <div id="create-group-btn-container" style="text-align: center; margin-top: 20px;">
                <button class="btn-primary" onclick="promptCreateChatGroup()" style="max-width: 200px;">
                    <i data-lucide="plus" style="width: 16px; height: 16px; margin-right: 8px;"></i>Make a Group
                </button>
            </div>
        `);
    }
    
    lucide.createIcons();
}

function loadChatMessages(groupId) {
    fetch(`/api/chat-groups/${groupId}/messages`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayChatMessages(data.messages || []);
            }
        })
        .catch(err => console.log('Error loading chat messages'));
}

function displayChatMessages(messages) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No messages yet. Start the conversation!</p>';
        return;
    }
    
    container.innerHTML = messages.map(m => `
        <div class="chat-message ${m.sender_id === window.currentUserId ? 'sent' : 'received'}">
            <div class="message-sender">${m.sender_name}</div>
            <div class="message-text">${m.message}</div>
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}
function publishAnnouncement() {
    const title = document.getElementById('ann-title').value;
    const content = document.getElementById('ann-desc').value;
    
    if (!title || !content) {
        showToast('Title and content are required', 'error');
        return;
    }
    
    const editId = document.getElementById('create-announcement-form').dataset.editId;
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/announcements/${editId}` : '/api/announcements';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: content })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`Announcement ${editId ? 'updated' : 'published'}!`, 'success');
            
            document.getElementById('ann-title').value = '';
            document.getElementById('ann-desc').value = '';
            document.getElementById('create-announcement-form').dataset.editId = '';
            document.getElementById('cancel-announcement-btn').click(); 
            
            loadAnnouncements();
        } else {
            showToast(data.message || 'Failed to publish', 'error');
        }
    })
    .catch(err => showToast('Error publishing announcement', 'error'));
}

function displayApprovedBusinesses(businesses) {
    const container = document.getElementById('approved-businesses-list');
    if (!container) return;
    
    if (!businesses || businesses.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No registered businesses</p>';
        return;
    }
    
    container.innerHTML = businesses.map(b => `
        <div class="service-card-admin" data-business-id="${b.id}">
            <div class="service-card-header">
                <div class="service-card-info">
                    <h3 class="service-card-title">${b.business_name}</h3>
                    <p class="service-card-owner">Owner: ${b.full_name}</p>
                </div>
                <div class="service-card-rating"><i data-lucide="star"></i><span>${b.average_rating || '0.0'}</span></div>
            </div>
            <div class="service-card-footer">
                <span class="service-card-category">${b.business_category || 'Service'}</span>
                <div class="member-actions" style="flex-direction: column; align-items: flex-end; gap: 8px;">
                    <div class="member-detail" style="font-weight: 600;">${b.phone}</div>
                    <button class="btn-primary" onclick="openAssignWorkModal('${b.business_name}', ${b.id})" style="max-width: 150px; margin: 0; padding: 8px 12px; font-size: 13px;">Assign Work</button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function promptCreateChatGroup() {
    const groupName = prompt('Enter chat group name:');
    if (!groupName || !groupName.trim()) return;
    
    fetch('/api/chat-groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim() })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Chat group created!', 'success');
            loadChatGroups();
        } else {
            showToast(data.message || 'Failed to create group', 'error');
        }
    })
    .catch(err => showToast('Error creating group', 'error'));
}

function loadMyProfileData() {
    fetch('/api/current-user')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user) {
                const user = data.user;
                
                const sidebarName = document.querySelector('.sidebar-profile .profile-name');
                if (sidebarName) sidebarName.textContent = user.full_name || 'N/A';
                
                const sidebarFlat = document.querySelector('.sidebar-profile .profile-flat');
                if (sidebarFlat) sidebarFlat.textContent = user.society_name || 'N/A';
                
                const sidebarPlaceholder = document.querySelector('.sidebar-profile .profile-pic-placeholder');
                if (sidebarPlaceholder && user.full_name) sidebarPlaceholder.textContent = user.full_name.charAt(0).toUpperCase();

                const updateProfileField = (fieldName, newValue) => {
                    const item = document.querySelector(`#my-profile-view .profile-detail-item[data-field-name="${fieldName}"]`);
                    if (item) {
                        const valueSpan = item.querySelector('.profile-detail-value');
                        if (valueSpan) {
                            valueSpan.textContent = newValue;
                            valueSpan.dataset.originalValue = newValue;
                        }
                    }
                };

                updateProfileField("Name", user.full_name || 'N/A');
                updateProfileField("Email", user.email || 'N/A');
                updateProfileField("Phone No.", user.phone || 'N/A');
                updateProfileField("Phone", user.phone || 'N/A');
                updateProfileField("Role", user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Resident');
                updateProfileField("Flat Number", user.flat_number || 'N/A');
                updateProfileField("Society", user.society_name || 'N/A');
                
                const placeholder = document.getElementById('admin-pic-placeholder');
                const profilePic = document.getElementById('admin-profile-pic');
                if (user.profile_photo && profilePic && placeholder) {
                    profilePic.src = user.profile_photo;
                    profilePic.style.display = 'block';
                    placeholder.style.display = 'none';
                } else if (placeholder && user.full_name) {
                    placeholder.textContent = user.full_name.charAt(0).toUpperCase();
                }
            }
        })
        .catch(err => console.error('Error loading current user data:', err));
}

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
