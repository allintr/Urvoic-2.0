// Paste your Resident Dashboard JavaScript here
// --- Global Data State for Assignments ---
let maintenanceRequests = [
    // Dummy data so the list isn't empty initially
    { id: 101, category: 'Electrical', title: 'Switchboard sparking', date: 'Today', scope: 'private' },
    { id: 102, category: 'Plumbing', title: 'Tap leaking', date: 'Yesterday', scope: 'society' }
];
let selectedProviderName = "";

// --- Data for Info Pages (Footer Links) ---
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
                  <form onsubmit="handleFormSubmit(event, 'Message Sent!')" style="display:flex; flex-direction:column; gap:15px; max-width:400px;">
                    <input type="text" class="form-input" placeholder="Your Name" required>
                    <input type="email" class="form-input" placeholder="Your Email" required>
                    <textarea class="form-input" rows="4" placeholder="How can we help?" required></textarea>
                    <button type="submit" class="form-submit-btn">Send Message</button>
                  </form>
                  <div style="margin-top:20px;">
                    <strong>Email:</strong> support@urvoic.com<br>
                    <strong>Phone:</strong> +91 123 456 7890
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

// --- View-Switching Logic ---
const residentDashboardView = document.getElementById('resident-dashboard-view');
const maintenanceView = document.getElementById('maintenance-view');
const reviewView = document.getElementById('review-view');
const visitorLogView = document.getElementById('visitor-log-view'); 
const paymentsView = document.getElementById('payments-view');
const announcementView = document.getElementById('announcement-view'); 
const residentsChatView = document.getElementById('residents-chat-view'); 
const individualChatView = document.getElementById('individual-chat-view'); 
const myProfileView = document.getElementById('my-profile-view'); // New
const pastActivitiesView = document.getElementById('past-activities-view'); // New
const infoView = document.getElementById('info-view');
const serviceProvidersView = document.getElementById('service-providers-view'); // NEW

function hideAllViews() {
    if(residentDashboardView) residentDashboardView.classList.remove('active-view');
    if(maintenanceView) maintenanceView.classList.remove('active-view');
    if(reviewView) reviewView.classList.remove('active-view');
    if(visitorLogView) visitorLogView.classList.remove('active-view'); 
    if(paymentsView) paymentsView.classList.remove('active-view');
    if(announcementView) announcementView.classList.remove('active-view');
    if(residentsChatView) residentsChatView.classList.remove('active-view'); 
    if(individualChatView) individualChatView.classList.remove('active-view'); 
    if(myProfileView) myProfileView.classList.remove('active-view'); // New
    if(pastActivitiesView) pastActivitiesView.classList.remove('active-view'); // New
    if(infoView) infoView.classList.remove('active-view');
    if(serviceProvidersView) serviceProvidersView.classList.remove('active-view'); // NEW
}

// --- Navigation Functions ---
function showDashboardPage() {
    hideAllViews();
    residentDashboardView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showMaintenancePage() {
    hideAllViews();
    maintenanceView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showReviewPage() {
    hideAllViews();
    reviewView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showVisitorLogPage() { 
    hideAllViews();
    visitorLogView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showPaymentsPage() { 
    hideAllViews();
    paymentsView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showAnnouncementPage() { 
    hideAllViews();
    announcementView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showResidentsChatPage() {
    hideAllViews();
    residentsChatView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showServiceProvidersPage() { // NEW
    hideAllViews();
    serviceProvidersView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function openChat(groupName) {
    hideAllViews();
    individualChatView.classList.add('active-view');
    document.getElementById('chatGroupName').innerText = groupName;
    window.scrollTo(0, 0);
}

function showMyProfilePage() { // New
    hideAllViews();
    myProfileView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function showPastActivitiesPage() { // New
    hideAllViews();
    pastActivitiesView.classList.add('active-view');
    window.scrollTo(0, 0);
}

function navigateToRecentActivities() { // New
    showDashboardPage();
    document.getElementById('community-snapshot-section')?.scrollIntoView({ behavior: 'smooth' });
}

function navigateToInfo(pageKey) {
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

function navigateToHome() { showDashboardPage(); }

// --- Service Provider Filter ---
function filterServices(category) {
    const buttons = document.querySelectorAll('.filter-pill');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const items = document.querySelectorAll('.provider-card');
    items.forEach(item => {
        if (category === 'all') {
            item.style.display = 'flex';
        } else {
            if (item.classList.contains('category-' + category)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        }
    });
}

// --- Assignment Modal Logic ---
function openAssignmentModal(providerName, type) {
    selectedProviderName = providerName;
    document.getElementById('modal-provider-name').innerText = providerName;
    
    const list = document.getElementById('modal-request-list');
    const emptyMsg = document.getElementById('empty-state-msg');
    list.innerHTML = "";
    
    // Filter only PRIVATE requests
    const myReqs = maintenanceRequests.filter(r => r.scope === 'private');
    
    if(myReqs.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        myReqs.forEach(req => {
            const div = document.createElement('label');
            div.className = 'selection-label';
            div.innerHTML = `
                <input type="radio" name="jobId" value="${req.id}" class="selection-radio">
                <div>
                    <div style="font-weight:600; font-size:14px;">${req.title}</div>
                    <div style="font-size:12px; color:#666;">${req.category} • ${req.date}</div>
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    document.getElementById('assignment-modal').classList.add('active');
}

function closeAssignmentModal() {
    document.getElementById('assignment-modal').classList.remove('active');
}

function confirmAssignment() {
    const selected = document.querySelector('input[name="jobId"]:checked');
    if(!selected) {
        showToast("Please select a request first", "error");
        return;
    }
    closeAssignmentModal();
    showToast(`Work assigned to ${selectedProviderName}!`, "success");
}

// --- Search Functions ---
function focusSearch() {
    showDashboardPage();
    const searchInput = document.getElementById('heroSearchInput');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { searchInput.focus(); }, 300);
}

function handleSearch() {
    const searchInput = document.getElementById('heroSearchInput');
    const query = searchInput.value.toLowerCase().trim();
    
    if (query.includes('maintenance') || query.includes('wrench')) {
        showMaintenancePage();
    } else if (query.includes('review') || query.includes('star')) {
        showReviewPage();
    } else if (query.includes('visitor') || query.includes('guest')) {
        showVisitorLogPage();
    } else if (query.includes('payment') || query.includes('bill')) {
        showPaymentsPage();
    } else if (query.includes('announcement') || query.includes('notice')) {
        showAnnouncementPage();
    } else if (query.includes('chat') || query.includes('group')) {
        showResidentsChatPage();
    } else if (query.includes('service') || query.includes('provider')) {
        showServiceProvidersPage();
    } else {
        showToast('No service found for "' + query + '"', 'error');
    }
}


// --- Form Simulation Logic ---
function handleFormSubmit(event, successMsg) {
    event.preventDefault(); 
    const form = event.target;
    const btn = form.querySelector('.form-submit-btn');
    
    // -- SPECIAL LOGIC: Save Maintenance Request --
    const catInput = form.querySelector('#category'); 
    if (catInput && document.getElementById('maintenanceScopeToggle')) {
        const scopeBtn = document.querySelector('#maintenanceScopeToggle .toggle-btn.active');
        const descInput = form.querySelector('#description');
        
        maintenanceRequests.unshift({
            id: Date.now(),
            category: catInput.value,
            title: descInput.value,
            date: 'Just now',
            scope: scopeBtn.dataset.value // 'society' or 'private'
        });
    }

    if (!btn) return;
    const originalText = btn.innerText;
    btn.classList.add('loading');
    btn.innerText = 'Loading...';
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.innerText = originalText;
        showToast(successMsg, 'success');
        event.target.reset(); // Clear the form
        
        // --- Reset privacy toggle ---
        const privacyToggle = document.getElementById('privacyToggle');
        if (privacyToggle) {
            privacyToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            privacyToggle.querySelector('[data-value="private"]').classList.add('active');
        }
        
        // Reset review stars
        const starContainer = document.getElementById('reviewStarRating');
        if (starContainer) {
            starContainer.querySelectorAll('i').forEach(s => s.classList.remove('selected'));
            document.getElementById('starRatingInput').value = '0'; // Reset hidden input
        }
        
        // Reset visitor toggle
        const visitorToggle = document.getElementById('visitorToggle');
        if(visitorToggle && successMsg.includes('Visitor')) {
            visitorToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            visitorToggle.querySelector('[data-target="pre-approve-form"]').classList.add('active');
            document.getElementById('pre-approve-form').classList.add('active');
            document.getElementById('pending-requests-list').classList.remove('active');
        }
    }, 1500);
}

function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content"><div class="toast-title">${type === 'success' ? 'Success' : 'Error'}</div><div class="toast-msg">${msg}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (input.value.trim() === "") return;
    
    // This is where you would add the message to the chat window
    // For this demo, we just clear it and show a toast
    
    showToast('Message Sent!', 'success');
    input.value = ""; // Clear the input
}

// --- RATING SCRIPT (Dashboard) ---
function initRating() {
    const ratingContainer = document.getElementById('urvoic-rating');
    const ratingMessage = document.getElementById('rating-message');
    if (!ratingContainer) return;
    const stars = ratingContainer.querySelectorAll('i');
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const clickedRating = parseInt(e.currentTarget.dataset.rating);
            stars.forEach(s => { s.classList.remove('star-filled'); s.style.pointerEvents = 'none'; s.style.stroke = '#ccc'; s.style.fill = 'none'; });
            for (let i = 0; i < clickedRating; i++) { stars[i].classList.add('star-filled'); }
            const messages = { 1: "Oh no! We'll work hard to improve.", 2: "We appreciate your honest feedback.", 3: "Thank you! We aim for better.", 4: "Great to hear! We are close to perfect.", 5: "Fantastic! Your 5-star rating makes our day!", };
            ratingMessage.textContent = messages[clickedRating];
        });
        star.addEventListener('mouseover', (e) => {
            const hoverRating = parseInt(e.currentTarget.dataset.rating);
            stars.forEach((s, index) => {
                if (index < hoverRating) { s.style.stroke = 'var(--brand)'; } else { s.style.stroke = '#ccc'; }
            });
        });
        star.addEventListener('mouseout', () => { stars.forEach(s => s.style.stroke = '#ccc'); });
    });
}

// --- REVIEW FORM STAR SCRIPT ---
function initReviewStars() {
    const starContainer = document.getElementById('reviewStarRating');
    if (!starContainer) return;
    
    const stars = starContainer.querySelectorAll('i');
    const ratingInput = document.getElementById('starRatingInput');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.dataset.value;
            ratingInput.value = rating;
            stars.forEach((s, i) => {
                s.classList.toggle('selected', i < rating);
            });
        });
        star.addEventListener('mouseover', () => {
            const rating = star.dataset.value;
            stars.forEach((s, i) => {
                s.style.stroke = (i < rating) ? 'var(--star-yellow)' : 'var(--muted)';
            });
        });
        star.addEventListener('mouseout', () => {
            const currentRating = ratingInput.value;
            stars.forEach((s, i) => {
                if (i >= currentRating) {
                    s.style.stroke = 'var(--muted)';
                }
            });
        });
    });
}

// --- Announcement Mark as Read/Unread Script ---
function initAnnouncementButtons() {
    const feed = document.querySelector('.announcement-feed');
    if (!feed) return;
    
    feed.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-mark-read')) {
            const button = e.target;
            const card = button.closest('.announcement-card');
            
            if (card.classList.contains('is-read')) {
                card.classList.remove('is-read');
                button.textContent = 'Mark as Read';
            } else {
                card.classList.add('is-read');
                button.textContent = 'Mark as Unread';
            }
        }
    });
}

// --- NEW: Inline Profile Edit Logic ---
function initProfileEdit() {
    const profileView = document.getElementById('my-profile-view');
    if (!profileView) return;

    // --- Handle list items (Name, Email, Phone, Gender) ---
    const editItems = profileView.querySelectorAll('.profile-detail-item[data-field-name]');
    editItems.forEach(item => {
        const editButton = item.querySelector('.btn-edit-toggle');
        const saveButton = item.querySelector('.btn-save');
        const cancelButton = item.querySelector('.btn-cancel');
        const valueSpan = item.querySelector('.profile-detail-value');
        const editInput = item.querySelector('.profile-edit-input');
        const fieldName = item.dataset.fieldName;

        // Click EDIT icon
        editButton.addEventListener('click', () => {
            // Reset any other open fields first
            editItems.forEach(i => i.classList.remove('is-editing'));
            
            // Set input to current value and show edit UI
            editInput.value = valueSpan.dataset.originalValue;
            // For <select>, explicitly set the selected option
            if (editInput.tagName === 'SELECT') {
                editInput.value = valueSpan.dataset.originalValue || 'Not set';
            }
            item.classList.add('is-editing');
        });

        // Click CANCEL icon
        cancelButton.addEventListener('click', () => {
            item.classList.remove('is-editing');
            // No need to reset input, it'll be set on next edit click
        });

        // Click SAVE icon
        saveButton.addEventListener('click', () => {
            const newValue = editInput.value;
            
            // --- Simulate API Save ---
            // In a real app, you'd send this to a server
            console.log(`Saving ${fieldName}: ${newValue}`);
            showToast(`${fieldName} updated successfully!`, 'success');
            
            // Update the display value
            valueSpan.textContent = newValue;
            valueSpan.dataset.originalValue = newValue; // Store new "original" value
            
            // Reset styles if value was "Not set"
            if (fieldName === 'Gender' && newValue !== 'Not set') {
                valueSpan.style.color = 'var(--dark)';
                valueSpan.style.fontStyle = 'normal';
            } else if (fieldName === 'Gender' && newValue === 'Not set') {
                valueSpan.style.color = 'var(--muted)';
                valueSpan.style.fontStyle = 'italic';
            }
            
            // Hide edit UI
            item.classList.remove('is-editing');
        });
    });

    // --- Handle BIO Section ---
    const bioContainer = profileView.querySelector('.profile-bio-container');
    if (bioContainer) {
        const editButton = bioContainer.querySelector('.btn-edit-toggle');
        const saveButton = bioContainer.querySelector('.btn-save');
        const cancelButton = bioContainer.querySelector('.btn-cancel');
        const valuePara = bioContainer.querySelector('.profile-detail-value');
        const editInput = bioContainer.querySelector('.profile-edit-input');
        const fieldName = bioContainer.dataset.fieldName;

        editButton.addEventListener('click', () => {
            editInput.value = valuePara.dataset.originalValue;
            bioContainer.classList.add('is-editing');
        });

        cancelButton.addEventListener('click', () => {
            bioContainer.classList.remove('is-editing');
        });

        saveButton.addEventListener('click', () => {
            const newValue = editInput.value;
            
            // --- Simulate API Save ---
            console.log(`Saving ${fieldName}: ${newValue}`);
            showToast('Bio updated successfully!', 'success');

            valuePara.textContent = newValue;
            valuePara.dataset.originalValue = newValue;
            
            bioContainer.classList.remove('is-editing');
        });
    }
}


// --- SIDEBAR & NOTIFICATION SCRIPT ---
document.addEventListener('DOMContentLoaded', function() {
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
            const isOpen = sidebar && sidebar.classList.contains('is-open');
            closeAllPanels(); // Close all panels first
            if (!isOpen) {
                sidebar.classList.add('is-open');
                sidebarOverlay.classList.add('active');
                hamburgerBtn.classList.add('is-active');
            }
        });
    }
    if (sidebarOverlay) { 
        sidebarOverlay.addEventListener('click', closeAllPanels); 
    }
    
    // Notification Toggle
    const notifBtn = document.querySelector('[aria-label="Notifications"]');
    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotifications();
        });
    }
    if (notificationOverlay) { 
        notificationOverlay.addEventListener('click', closeAllPanels); 
    }
    
    // --- Privacy Toggle Script ---
    const privacyToggle = document.getElementById('privacyToggle');
    if (privacyToggle) {
        const buttons = privacyToggle.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    // --- Maintenance Scope Toggle Script ---
    const maintenanceScopeToggle = document.getElementById('maintenanceScopeToggle');
    if (maintenanceScopeToggle) {
        const buttons = maintenanceScopeToggle.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    // --- Visitor Page Toggle Script ---
    const visitorToggle = document.getElementById('visitorToggle');
    if (visitorToggle) {
        const buttons = visitorToggle.querySelectorAll('.toggle-btn');
        const contents = document.querySelectorAll('.visitor-form-content');
        
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

    // --- Initialize all functions that were in body.onload ---
    initRating();
    initReviewStars();
    initAnnouncementButtons();
    initProfileEdit(); // <--- ADDED THIS CALL
    lucide.createIcons(); // Run this last after all HTML is on page
});

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