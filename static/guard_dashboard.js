// Paste your Guard Dashboard JavaScript here
let navigationHistory = ['guard-dashboard-view'];
let currentView = 'guard-dashboard-view';

function initHomeLinkNav() {
    const brandLink = document.querySelector('.brand');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showGuardDashboardPage();
        });
    }
}

function initBackButtonHandling() {
    window.history.pushState({ view: 'guard-dashboard-view' }, '', window.location.pathname);
    
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view) {
            if (event.state.view === 'guard-dashboard-view' && currentView === 'guard-dashboard-view') {
                showLogoutConfirmation();
                window.history.pushState({ view: 'guard-dashboard-view' }, '', window.location.pathname);
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

function showGuardDashboardPage() {
    navigateToView('guard-dashboard-view');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

// --- MASTER "ON" SWITCH ---
// This runs all the setup functions after the page loads.
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    initRating();
    initSidebar();
    initProfileEdit();
    initVisitorLogPage();
    initQrModal();
    initMaintVisitorsPage();
    initShiftReportPage();
    initResidentsPage();
    initLogout();
    initGuardPhotoUpload();
    initBackButtonHandling();
    initHomeLinkNav();
    loadGuardDashboard();
    loadMyProfileData();
});

function initGuardPhotoUpload() {
    const photoInput = document.getElementById('guard-photo-input');
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
                    document.getElementById('guard-pic-placeholder').style.display = 'none';
                    const img = document.getElementById('guard-profile-pic');
                    img.src = photoData;
                    img.style.display = 'block';
                    showToast('Profile photo updated!', 'success');
                    addGuardActivity('Profile photo updated');
                } else {
                    showToast('Failed to update photo', 'error');
                }
            })
            .catch(err => showToast('Failed to upload photo', 'error'));
        };
        reader.readAsDataURL(file);
    });
}

function addGuardActivity(text) {
    const list = document.querySelector('.activity-list');
    if (!list) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const li = document.createElement('li');
    li.innerHTML = `<i data-lucide="check-circle" class="activity-icon-sm" style="color: var(--brand);"></i><span class="activity-text">${text}</span><span class="activity-timestamp">${time}</span>`;
    list.insertBefore(li, list.firstChild);
    lucide.createIcons({nodes: [li.querySelector('i')]});
}

function loadGuardDashboard() {
    fetch('/api/visitors/inside')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const countEl = document.getElementById('visitors-inside-count');
                if (countEl) countEl.textContent = data.visitors_inside ? data.visitors_inside.length : 0;
            }
        })
        .catch(err => console.log('Visitors loaded with defaults'));

    fetch('/api/activity-logs')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.activities) {
                const list = document.querySelector('.activity-list');
                if (list && data.activities.length > 0) {
                    list.innerHTML = data.activities.slice(0, 5).map(act => `
                        <li>
                            <i data-lucide="activity" class="activity-icon-sm" style="color: var(--brand);"></i>
                            <span class="activity-text">${act.description}</span>
                            <span class="activity-timestamp">${new Date(act.timestamp).toLocaleTimeString()}</span>
                        </li>
                    `).join('');
                    lucide.createIcons();
                }
            }
        })
        .catch(err => console.log('Activity loaded with defaults'));
}

window.addEventListener('load', loadGuardDashboard);

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

function loadMyProfileData() {
    fetch('/api/current-user')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user) {
                const user = data.user;
                
                const nameEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Name"] .profile-detail-value');
                if (nameEl) {
                    nameEl.textContent = user.full_name || 'N/A';
                    const input = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Name"] .profile-edit-input');
                    if (input) input.value = user.full_name || '';
                }
                
                const emailEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Email"] .profile-detail-value');
                if (emailEl) emailEl.textContent = user.email || 'N/A';
                
                const phoneEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Phone"] .profile-detail-value');
                if (phoneEl) {
                    phoneEl.textContent = user.phone || 'N/A';
                    const input = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Phone"] .profile-edit-input');
                    if (input) input.value = user.phone || '';
                }
                
                const roleEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Role"] .profile-detail-value');
                if (roleEl) roleEl.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Guard';
                
                const societyEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Society"] .profile-detail-value');
                if (societyEl) societyEl.textContent = user.society_name || 'N/A';
                
                const sidebarName = document.querySelector('.sidebar-profile .profile-name');
                if (sidebarName) sidebarName.textContent = user.full_name || 'Guard';
                
                const sidebarFlat = document.querySelector('.sidebar-profile .profile-flat');
                if (sidebarFlat) sidebarFlat.textContent = 'Guard';
                
                const sidebarInitial = document.querySelector('.sidebar-profile .profile-pic-placeholder');
                if (sidebarInitial && user.full_name) {
                    sidebarInitial.textContent = user.full_name.charAt(0).toUpperCase();
                }
                
                const placeholder = document.getElementById('guard-pic-placeholder');
                const profilePic = document.getElementById('guard-profile-pic');
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

let activityLog = [];

// --- Visitor Log Page Logic (UPDATED) ---
function initVisitorLogPage() {
    loadPendingPermissions();
    loadVisitorHistory();
    
    const form = document.getElementById('check-in-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const visitorName = document.getElementById('visitor-name').value;
            const visitorMobile = document.getElementById('visitor-mobile').value;
            const flatNo = document.getElementById('visitor-flat').value;
            const purpose = document.getElementById('visitor-purpose').value;
            const vehicle = document.getElementById('visitor-vehicle')?.value || '';

            fetch('/api/visitor-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitor_name: visitorName,
                    visitor_phone: visitorMobile,
                    flat_number: flatNo,
                    purpose: purpose,
                    vehicle_number: vehicle
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('Visitor entry logged!', 'success');
                    form.reset();
                    loadPendingPermissions();
                    addActivity(`New visitor: ${visitorName} to Flat ${flatNo}`);
                } else {
                    showToast(data.message || 'Failed to log visitor', 'error');
                }
            })
            .catch(err => showToast('Failed to log visitor', 'error'));
        });
    }
}

function loadPendingPermissions() {
    fetch('/api/visitors/pending')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('pending-permissions-list');
            if (!list) return;
            
            if (data.success && data.visitors && data.visitors.length > 0) {
                list.innerHTML = data.visitors.map(v => {
                    let icon = 'user';
                    if (v.purpose === 'Delivery') icon = 'truck';
                    if (v.purpose === 'Service') icon = 'hard-hat';
                    const statusClass = v.permission_status === 'approved' ? 'status-allowed' : 
                                        v.permission_status === 'denied' ? 'status-denied' : 'status-waiting';
                    const statusText = v.permission_status === 'approved' ? 'Allowed' : 
                                       v.permission_status === 'denied' ? 'Denied' : 'Waiting...';
                    return `
                        <div class="member-list-item" data-id="${v.id}">
                            <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;"><i data-lucide="${icon}"></i></div>
                            <div class="member-info" style="flex-grow: 2;">
                                <div class="member-name">${v.visitor_name} (${v.purpose || 'Guest'})</div>
                                <div class="member-detail">To: ${v.flat_number} • ${v.entry_time ? new Date(v.entry_time).toLocaleTimeString() : 'Pending'}</div>
                            </div>
                            <span class="permission-status ${statusClass}">${statusText}</span>
                        </div>
                    `;
                }).join('');
                lucide.createIcons();
            } else {
                list.innerHTML = '<p style="padding:16px;color:#666;text-align:center;">No pending permissions</p>';
            }
        })
        .catch(err => console.log('Loading pending permissions failed'));
}

function loadVisitorHistory() {
    fetch('/api/visitors')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('admin-visitor-log-list');
            if (!list) return;
            
            if (data.success && data.visitors && data.visitors.length > 0) {
                list.innerHTML = data.visitors.slice(0, 10).map(v => {
                    const statusClass = v.exit_time ? 'status-exited' : 'status-entered';
                    const statusText = v.exit_time ? 'Exited' : 'Inside';
                    return `
                        <div class="member-list-item">
                            <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;"><i data-lucide="user"></i></div>
                            <div class="member-info" style="flex-grow: 2;">
                                <div class="member-name">${v.visitor_name} (${v.purpose || 'Guest'})</div>
                                <div class="member-detail">To: ${v.flat_number} • ${v.entry_time ? new Date(v.entry_time).toLocaleString() : ''}</div>
                            </div>
                            <span class="visitor-status ${statusClass}">${statusText}</span>
                        </div>
                    `;
                }).join('');
                lucide.createIcons();
            } else {
                list.innerHTML = '<p style="padding:16px;color:#666;text-align:center;">No visitor history yet</p>';
            }
        })
        .catch(err => console.log('Loading visitor history failed'));
}

function approveVisitor(btn, name, flat) {
    const item = btn.closest('.member-list-item');
    item.innerHTML = `
        <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;"><i data-lucide="user"></i></div>
        <div class="member-info" style="flex-grow: 2;">
            <div class="member-name">${name}</div>
            <div class="member-detail">To: Flat ${flat}</div>
        </div>
        <span class="permission-status status-allowed">Allowed</span>
    `;
    lucide.createIcons({nodes: [item.querySelector('i')]});
    addActivity(`✓ Visitor ${name} ALLOWED to Flat ${flat}`);
    showToast(`${name} approved!`, 'success');
}

function denyVisitor(btn, name, flat) {
    btn.closest('.member-list-item').remove();
    addActivity(`✗ Visitor ${name} DENIED entry to Flat ${flat}`);
    showToast(`${name} denied!`, 'success');
}

function addActivity(text) {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    activityLog.unshift({ text, time: now });
    if (activityLog.length > 10) activityLog.pop();
    updateActivityDisplay();
}

function updateActivityDisplay() {
    const list = document.querySelector('.activity-list');
    if (!list) return;
    list.innerHTML = activityLog.map(a => `
        <li>
            <i data-lucide="check-circle" class="activity-icon-sm" style="color: var(--brand);"></i>
            <span class="activity-text">${a.text}</span>
            <span class="activity-timestamp">${a.time}</span>
        </li>
    `).join('');
    lucide.createIcons({nodes: list.querySelectorAll('i')});
}

function markMaintVisitorExit(button) {
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
                markMaintVisitorExit(exitButton);
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
            
            const shiftStart = document.getElementById('shift-start')?.value || '';
            const shiftEnd = document.getElementById('shift-end')?.value || '';
            const shiftType = document.getElementById('shift-type')?.value || '';
            const incidents = document.getElementById('shift-incidents')?.value || '';
            const notes = document.getElementById('shift-notes')?.value || '';
            const serviceProviders = document.getElementById('service-providers-count')?.value || 0;
            
            const today = new Date().toISOString().split('T')[0];
            
            fetch('/api/shift-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shift_date: today,
                    shift_start_time: shiftStart,
                    shift_end_time: shiftEnd,
                    shift_type: shiftType,
                    incidents: incidents,
                    notes: notes,
                    total_service_providers: parseInt(serviceProviders) || 0
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('Shift Report Submitted! Admins have been notified.', 'success');
                    form.reset();
                    showGuardDashboardPage();
                    addGuardActivity('Shift report submitted');
                } else {
                    showToast(data.message || 'Failed to submit shift report', 'error');
                }
            })
            .catch(err => {
                console.error('Error submitting shift report:', err);
                showToast('Failed to submit shift report', 'error');
            });
        });
    }
}

// --- NEW: Residents Page Logic ---
function initResidentsPage() {
    loadResidentsForGuard();
    
    const searchInput = document.getElementById('resident-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const residentCards = document.querySelectorAll('.resident-card');
            const noResultsEl = document.getElementById('no-resident-found');
            let foundOne = false;
            
            residentCards.forEach(card => {
                const searchTerm = (card.dataset.searchTerm || '').toLowerCase();
                if (searchTerm.includes(query)) {
                    card.style.display = 'block';
                    foundOne = true;
                } else {
                    card.style.display = 'none';
                }
            });
            
            if (noResultsEl) {
                noResultsEl.style.display = foundOne ? 'none' : 'block';
            }
        });
    }
    
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

function scanQRCode() {
    if (!qrModal) return;
    qrModal.classList.add('active');
    setTimeout(() => {
        qrModal.classList.remove('active');
        showToast('QR Scanned: Pre-Approved Visitor Found!', 'success');
        showVisitorLogPage();
        // Auto-fill visitor data from QR scan
        document.getElementById('visitor-name').value = "Pre-Approved Visitor";
        document.getElementById('visitor-flat').value = "Flat Number";
        document.getElementById('visitor-purpose').value = "Guest";
        // Move to currently inside section
        const historySection = document.querySelector('#visitor-log-view .visitor-history-section');
        if (historySection) historySection.scrollIntoView({ behavior: 'smooth' });
    }, 2500);
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
    navigateToView('guard-dashboard-view');
    loadGuardActivityLogs();
}

function showVisitorLogPage() { 
    navigateToView('visitor-log-view');
    loadGuardVisitorLog();
}

function showGateStatusPage() { 
    navigateToView('gate-status-view');
    loadVisitorsInside();
}

function showMaintVisitorsPage() { 
    navigateToView('maint-visitors-view');
    loadExpectedVisitors();
}

function showShiftReportPage() { 
    navigateToView('shift-report-view');
    loadShiftHistory();
}

function showResidentsPage() { 
    navigateToView('residents-view');
    loadResidentsForGuard();
}

function showMyProfilePage() { 
    navigateToView('my-profile-view');
    loadMyProfileData();
}

function loadGuardActivityLogs() {
    fetch('/api/activity-logs?limit=10')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.activities) {
                const container = document.querySelector('.activity-list');
                if (container && data.activities.length > 0) {
                    container.innerHTML = data.activities.map(act => {
                        const timeAgo = getTimeAgo(new Date(act.created_at));
                        return `<li class="activity-item"><span class="activity-action">${act.action}</span> ${act.description} <span class="activity-time">${timeAgo}</span></li>`;
                    }).join('');
                } else if (container) {
                    container.innerHTML = '<li style="text-align:center;color:#999;padding:20px;">No recent activity</li>';
                }
            }
        })
        .catch(err => console.log('Error loading activity logs'));
}

function loadGuardVisitorLog() {
    fetch('/api/visitor-log')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayGuardVisitorLog(data.visitors || []);
            }
        })
        .catch(err => console.log('Error loading visitor log'));
}

function displayGuardVisitorLog(visitors) {
    const container = document.getElementById('guard-visitor-list');
    if (!container) return;
    
    if (visitors.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No visitors recorded today</p>';
        return;
    }
    
    container.innerHTML = visitors.map(v => {
        const date = new Date(v.entry_time);
        const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const statusClass = v.entry_time && !v.exit_time ? 'status-inside' : 'status-exited';
        
        return `
            <div class="visitor-card" data-id="${v.id}">
                <div class="visitor-info">
                    <div class="visitor-avatar">${v.visitor_name.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="visitor-name">${v.visitor_name}</div>
                        <div class="visitor-detail">Flat ${v.flat_number} | ${v.purpose}</div>
                    </div>
                </div>
                <div class="visitor-time">
                    <span class="entry-time">${timeStr}</span>
                    <span class="visitor-status ${statusClass}">${v.exit_time ? 'Exited' : 'Inside'}</span>
                </div>
                ${!v.exit_time ? `<button class="btn-exit" onclick="markVisitorExit(${v.id})">Mark Exit</button>` : ''}
            </div>
        `;
    }).join('');
}

function markVisitorExit(visitorId) {
    fetch('/api/visitors/mark-exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Exit recorded successfully', 'success');
            loadGuardVisitorLog();
            loadVisitorsInside();
        } else {
            showToast(data.message || 'Failed to record exit', 'error');
        }
    })
    .catch(err => showToast('Error recording exit', 'error'));
}

function loadVisitorsInside() {
    fetch('/api/visitors/inside')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayVisitorsInside(data.visitors || []);
            }
        })
        .catch(err => console.log('Error loading visitors inside'));
}

function displayVisitorsInside(visitors) {
    const container = document.getElementById('visitors-inside-list');
    if (!container) return;
    
    if (visitors.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No visitors currently inside</p>';
        return;
    }
    
    container.innerHTML = visitors.map(v => {
        const entryTime = new Date(v.entry_time);
        const timeStr = entryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="visitor-inside-card" data-id="${v.id}">
                <div class="visitor-info">
                    <div class="visitor-avatar">${v.visitor_name.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="visitor-name">${v.visitor_name}</div>
                        <div class="visitor-detail">Flat ${v.flat_number} | Entry: ${timeStr}</div>
                    </div>
                </div>
                <button class="btn-exit" onclick="markVisitorExit(${v.id})">Mark Exit</button>
            </div>
        `;
    }).join('');
}

function loadExpectedVisitors() {
    fetch('/api/visitors/expected')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayExpectedVisitors(data.visitors || []);
            }
        })
        .catch(err => console.log('Error loading expected visitors'));
}

function displayExpectedVisitors(visitors) {
    const container = document.getElementById('expected-visitors-list');
    if (!container) return;
    
    if (visitors.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No expected visitors</p>';
        return;
    }
    
    container.innerHTML = visitors.map(v => `
        <div class="expected-visitor-card" data-id="${v.id}">
            <div class="visitor-info">
                <div class="visitor-avatar">${v.visitor_name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="visitor-name">${v.visitor_name}</div>
                    <div class="visitor-detail">Flat ${v.flat_number} | ${v.purpose}</div>
                </div>
            </div>
            <button class="btn-entry" onclick="markVisitorEntry(${v.id})">Allow Entry</button>
        </div>
    `).join('');
}

function markVisitorEntry(visitorId) {
    fetch('/api/visitors/mark-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Entry recorded successfully', 'success');
            loadExpectedVisitors();
            loadVisitorsInside();
            loadGuardVisitorLog();
        } else {
            showToast(data.message || 'Failed to record entry', 'error');
        }
    })
    .catch(err => showToast('Error recording entry', 'error'));
}

function loadShiftHistory() {
    fetch('/api/guard/shift-history')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayShiftHistory(data.shifts || []);
            }
        })
        .catch(err => console.log('Error loading shift history'));
}

function displayShiftHistory(shifts) {
    const container = document.getElementById('shift-history-list');
    if (!container) return;
    
    if (shifts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No shift records</p>';
        return;
    }
    
    container.innerHTML = shifts.map(s => {
        const date = new Date(s.timestamp);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="shift-card">
                <div class="shift-info">
                    <span class="shift-action ${s.action === 'in' ? 'shift-in' : 'shift-out'}">${s.action === 'in' ? 'Check In' : 'Check Out'}</span>
                    <span class="shift-datetime">${dateStr} at ${timeStr}</span>
                </div>
            </div>
        `;
    }).join('');
}

function loadResidentsForGuard() {
    const container = document.getElementById('resident-directory-list');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Loading residents...</p>';
    
    fetch('/api/guard/residents')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayResidentsForGuard(data.residents || []);
            } else {
                container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Failed to load residents</p>';
            }
        })
        .catch(err => {
            console.log('Error loading residents:', err);
            container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Error loading residents</p>';
        });
}

function displayResidentsForGuard(residents) {
    const container = document.getElementById('resident-directory-list');
    if (!container) return;
    
    if (residents.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No residents found</p>';
        return;
    }
    
    container.innerHTML = residents.map(r => {
        const familyCount = r.family_members ? r.family_members.length : 0;
        const vehicleCount = r.vehicles ? r.vehicles.length : 0;
        const searchTerm = `${r.full_name} ${r.flat_number} ${r.phone} ${r.email}`;
        
        let familyHtml = '';
        if (r.family_members && r.family_members.length > 0) {
            familyHtml = `
                <div class="family-members-section" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    <strong style="font-size: 12px; color: #666;">Family Members:</strong>
                    <ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 12px; color: #555;">
                        ${r.family_members.map(fm => `<li>${fm.name} (${fm.relationship}${fm.phone ? ' - ' + fm.phone : ''})</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        let vehicleHtml = '';
        if (r.vehicles && r.vehicles.length > 0) {
            vehicleHtml = `
                <div class="vehicles-section" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    <strong style="font-size: 12px; color: #666;">Vehicles:</strong>
                    <ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 12px; color: #555;">
                        ${r.vehicles.map(v => `<li>${v.vehicle_type}: ${v.vehicle_number}${v.vehicle_model ? ' (' + v.vehicle_model + ')' : ''}${v.vehicle_color ? ' - ' + v.vehicle_color : ''}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        return `
            <div class="resident-card page-card" data-search-term="${searchTerm}" style="margin-bottom: 16px; padding: 16px;">
                <div class="resident-info" style="display: flex; align-items: flex-start; gap: 12px;">
                    <div class="profile-pic-placeholder-sm" style="background-color: var(--blue-bg); color: var(--blue); flex-shrink: 0;">
                        ${r.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <div class="resident-name" style="font-weight: 600; font-size: 16px;">${r.full_name}</div>
                        <div class="resident-detail" style="color: #666; font-size: 14px; margin-top: 4px;">
                            <strong>Flat:</strong> ${r.flat_number || 'N/A'} | <strong>Phone:</strong> ${r.phone || 'N/A'}
                        </div>
                        <div style="color: #888; font-size: 13px; margin-top: 2px;">
                            <strong>Email:</strong> ${r.email || 'N/A'}
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: #666;">
                            <span style="background: #e8f5e9; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">
                                <i data-lucide="users" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${familyCount} family
                            </span>
                            <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px;">
                                <i data-lucide="car" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${vehicleCount} vehicles
                            </span>
                        </div>
                        ${familyHtml}
                        ${vehicleHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
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