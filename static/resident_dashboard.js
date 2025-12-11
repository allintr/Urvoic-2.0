// Paste your Resident Dashboard JavaScript here
let navigationHistory = ['resident-dashboard-view'];
let currentView = 'resident-dashboard-view';

function initHomeLinkNav() {
    const brandLink = document.querySelector('.brand');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDashboardPage();
        });
    }
}

function initBackButtonHandling() {
    window.history.pushState({ view: 'resident-dashboard-view' }, '', window.location.pathname);
    
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view) {
            if (event.state.view === 'resident-dashboard-view' && currentView === 'resident-dashboard-view') {
                showLogoutConfirmation();
                window.history.pushState({ view: 'resident-dashboard-view' }, '', window.location.pathname);
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

function loadActivityLogs() {
    fetch('/api/activity-logs')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.activities) {
                const list = document.querySelector('.activity-list');
                if (list && data.activities.length > 0) {
                    list.innerHTML = data.activities.slice(0, 5).map(act => {
                        const timeAgo = getTimeAgo(new Date(act.created_at));
                        const statusClass = getStatusClass(act.action);
                        return `<li><span class="activity-item-status ${statusClass}">${act.action}</span> ${act.description} <span class="activity-timestamp">${timeAgo}</span></li>`;
                    }).join('');
                } else if (list) {
                    list.innerHTML = '<li style="text-align:center;color:#999;padding:20px;">No recent activity</li>';
                }
            }
        })
        .catch(err => console.log('Activity loaded with defaults'));
}

function getStatusClass(action) {
    if (action.includes('Completed') || action.includes('Approved')) return 'status-blue';
    if (action.includes('Confirmed') || action.includes('Paid')) return 'status-green';
    if (action.includes('Overdue') || action.includes('Pending')) return 'status-red';
    return 'status-blue';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

let dueSamounts = [];

function handlePayment() {
    showToast('Payment processed successfully!', 'success');
}

function addServiceProviderReminder(providerName, amount) {
    dueSamounts.push({ provider: providerName, amount: amount, date: 'Just now' });
    updateDuesList();
}

function updateDuesList() {
    const list = document.getElementById('pending-dues-list');
    if (dueSamounts.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px;">No pending dues at this time.</p>';
        return;
    }
    list.innerHTML = dueSamounts.map((due, idx) => `
        <div class="history-item" style="margin-bottom:12px;">
            <div class="history-icon service"><i data-lucide="alert-circle"></i></div>
            <div class="history-info">
                <div class="history-title">Service from ${due.provider}</div>
                <div class="history-date">${due.date}</div>
            </div>
            <div class="history-details">
                <div class="history-amount">₹${due.amount}</div>
                <button class="btn-download" onclick="handlePaymentForDue(${idx})"><i data-lucide="check"></i> Pay</button>
            </div>
        </div>
    `).join('');
}

function handlePaymentForDue(idx) {
    showToast('Payment for ' + dueSamounts[idx].provider + ' processed!', 'success');
    dueSamounts.splice(idx, 1);
    updateDuesList();
}

function initRatingStars() {
    const ratingContainer = document.getElementById('urvoic-rating');
    if (!ratingContainer) return;
    const stars = ratingContainer.querySelectorAll('i');
    const ratingMsg = document.getElementById('rating-message');
    
    const messages = {
        1: "We'll work hard to improve.",
        2: "Thank you for your feedback.",
        3: "Thank you! We aim for better.",
        4: "Great! We are close to perfect.",
        5: "Fantastic! Your 5-star rating makes our day!"
    };
    
    stars.forEach((star, idx) => {
        star.addEventListener('click', () => {
            const clickedRating = idx + 1;
            stars.forEach(s => s.style.fill = 'none');
            for (let i = 0; i <= idx; i++) {
                stars[i].style.fill = '#ff8c00';
            }
            ratingMsg.textContent = messages[clickedRating];
            
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
    });
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
                if (roleEl) roleEl.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Resident';
                
                const flatEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Flat Number"] .profile-detail-value');
                if (flatEl) flatEl.textContent = user.flat_number || 'N/A';
                
                const societyEl = document.querySelector('#my-profile-view .profile-detail-item[data-field-name="Society"] .profile-detail-value');
                if (societyEl) societyEl.textContent = user.society_name || 'N/A';
                
                const sidebarName = document.querySelector('.sidebar-profile .profile-name');
                if (sidebarName) sidebarName.textContent = user.full_name || 'Resident';
                
                const sidebarFlat = document.querySelector('.sidebar-profile .profile-flat');
                if (sidebarFlat) sidebarFlat.textContent = user.flat_number ? 'Flat ' + user.flat_number : 'Resident';
                
                const sidebarInitial = document.querySelector('.sidebar-profile .profile-pic-placeholder');
                if (sidebarInitial && user.full_name) {
                    sidebarInitial.textContent = user.full_name.charAt(0).toUpperCase();
                }
                
                const placeholder = document.getElementById('resident-pic-placeholder');
                const profilePic = document.getElementById('resident-profile-pic');
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

// --- Global Data State for Assignments ---
let maintenanceRequests = [];
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


    initHomeLinkNav();
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
    navigateToView('resident-dashboard-view');
    loadActivityLogs();
}

function showMaintenancePage() {
    navigateToView('maintenance-view');
    loadResidentMaintenanceRequests();
    renderPublicRequests();
}

function showReviewPage() {
    navigateToView('review-view');
    loadBusinessesForReview();
    loadPublicReviews();
}

function showVisitorLogPage() { 
    navigateToView('visitor-log-view');
    loadResidentVisitors();
}

function showPaymentsPage() { 
    navigateToView('payments-view');
    loadResidentPayments();
}

function showAnnouncementPage() { 
    navigateToView('announcement-view');
    loadResidentAnnouncements();
}

function showResidentsChatPage() {
    navigateToView('residents-chat-view');
    loadResidentChatGroups();
}

function showServiceProvidersPage() {
    navigateToView('service-providers-view');
    loadServiceProviders();
}

function loadResidentMaintenanceRequests() {
    fetch('/api/maintenance-requests')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayResidentRequests(data.requests || []);
            }
        })
        .catch(err => console.log('Error loading requests'));
}

function displayResidentRequests(requests) {
    const container = document.getElementById('resident-requests-list');
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No maintenance requests yet. Create one using the form above!</p>';
        return;
    }
    
    container.innerHTML = requests.map(r => {
        const statusClass = {
            'pending': 'status-pending',
            'assigned': 'status-assigned',
            'in_progress': 'status-progress',
            'resolved': 'status-resolved'
        }[r.status] || 'status-pending';
        
        const date = new Date(r.created_at);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        
        return `
            <div class="request-card" data-id="${r.id}">
                <div class="request-header">
                    <h4>${r.title}</h4>
                    <span class="status-badge ${statusClass}">${r.status.replace('_', ' ')}</span>
                </div>
                <p class="request-desc">${r.description}</p>
                <div class="request-footer">
                    <span class="request-date">${dateStr}</span>
                    ${r.assigned_business_name ? `<span class="assigned-to">Assigned: ${r.assigned_business_name}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadResidentVisitors() {
    fetch('/api/visitor-log')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayResidentVisitors(data.visitors || []);
            }
        })
        .catch(err => console.log('Error loading visitors'));
}

function displayResidentVisitors(visitors) {
    const container = document.getElementById('resident-visitors-list');
    if (!container) return;
    
    if (visitors.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No visitors recorded yet</p>';
        return;
    }
    
    container.innerHTML = visitors.map(v => {
        const date = new Date(v.entry_time);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        const statusClass = v.permission_status === 'approved' ? 'status-approved' : (v.permission_status === 'pending' ? 'status-pending' : 'status-denied');
        
        return `
            <div class="visitor-card">
                <div class="visitor-info">
                    <div class="visitor-avatar">${v.visitor_name.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="visitor-name">${v.visitor_name}</div>
                        <div class="visitor-detail">${v.purpose} | ${dateStr}</div>
                    </div>
                </div>
                <span class="visitor-status ${statusClass}">${v.permission_status}</span>
            </div>
        `;
    }).join('');
}

function loadResidentPayments() {
    fetch('/api/payments')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayResidentPayments(data.payments || []);
            }
        })
        .catch(err => console.log('Error loading payments'));
}

function displayResidentPayments(payments) {
    const container = document.getElementById('resident-payments-list');
    if (!container) return;
    
    if (payments.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No payment records</p>';
        return;
    }
    
    container.innerHTML = payments.map(p => {
        const statusClass = p.status === 'paid' ? 'status-paid' : 'status-pending';
        const dueDate = p.due_date ? new Date(p.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
        
        return `
            <div class="payment-card ${p.status === 'pending' ? 'payment-pending' : ''}">
                <div class="payment-info">
                    <h4>${p.description || 'Society Maintenance'}</h4>
                    <p>Due: ${dueDate}</p>
                </div>
                <div class="payment-amount">
                    <span class="amount">₹${p.amount}</span>
                    <span class="status-badge ${statusClass}">${p.status === 'paid' ? 'Paid' : 'Pending'}</span>
                </div>
                ${p.status === 'pending' ? `
                    <button class="btn-pay" onclick="payNow(${p.id})">Pay Now</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function payNow(paymentId) {
    showToast('Redirecting to payment gateway...', 'success');
}

function loadResidentAnnouncements() {
    fetch('/api/announcements')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayResidentAnnouncements(data.announcements || []);
            }
        })
        .catch(err => console.log('Error loading announcements'));
}

function displayResidentAnnouncements(announcements) {
    const container = document.querySelector('.announcement-feed');
    if (!container) return;
    
    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No announcements yet</p>';
        return;
    }
    
    container.innerHTML = announcements.map(a => {
        const date = new Date(a.created_at);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
            <div class="announcement-card">
                <div class="history-icon icon-info" style="background-color: var(--green-bg); color: var(--brand);">
                    <i data-lucide="megaphone"></i>
                </div>
                <div class="announcement-content">
                    <div class="announcement-title">${a.title}</div>
                    <div class="announcement-date">${dateStr}</div>
                    <div class="announcement-body">
                        <p>${a.content}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function loadBusinessesForReview() {
    fetch('/api/businesses')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayBusinessesForReview(data.businesses || []);
            }
        })
        .catch(err => console.log('Error loading businesses'));
}

function displayBusinessesForReview(businesses) {
    const container = document.getElementById('businesses-review-list');
    if (!container) return;
    
    if (businesses.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No businesses available for review</p>';
        return;
    }
    
    container.innerHTML = businesses.map(b => `
        <div class="business-card" onclick="openReviewModal(${b.id}, '${b.business_name}')">
            <div class="business-avatar">${b.business_name.charAt(0).toUpperCase()}</div>
            <div class="business-info">
                <div class="business-name">${b.business_name}</div>
                <div class="business-category">${b.business_category}</div>
            </div>
            <div class="business-rating">
                <i data-lucide="star" class="star-filled"></i>
                <span>${b.avg_rating ? b.avg_rating.toFixed(1) : 'N/A'}</span>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function loadServiceProviders() {
    fetch('/api/businesses')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayServiceProviders(data.businesses || []);
            }
        })
        .catch(err => console.log('Error loading service providers'));
}

function displayServiceProviders(providers) {
    const container = document.getElementById('service-providers-list');
    if (!container) return;
    
    if (providers.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No service providers available</p>';
        return;
    }
    
    container.innerHTML = providers.map(p => `
        <div class="provider-card category-${(p.business_category || 'other').toLowerCase().replace(/\s+/g, '-')}">
            <div class="provider-avatar">${p.business_name.charAt(0).toUpperCase()}</div>
            <div class="provider-info">
                <div class="provider-name">${p.business_name}</div>
                <div class="provider-category">${p.business_category}</div>
            </div>
            <div class="provider-rating">
                <i data-lucide="star" class="star-filled"></i>
                <span>${p.avg_rating ? p.avg_rating.toFixed(1) : 'N/A'}</span>
            </div>
            <button class="btn-book" onclick="requestService(${p.id}, '${p.business_name}')">Book</button>
        </div>
    `).join('');
    lucide.createIcons();
}

function requestService(businessId, businessName) {
    showToast(`Requesting service from ${businessName}...`, 'success');
}

function loadResidentChatGroups() {
    fetch('/api/chat-groups/society')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayResidentChatGroups(data.groups || []);
            }
        })
        .catch(err => console.log('Error loading chat groups'));
}

function displayResidentChatGroups(groups) {
    const container = document.getElementById('chat-groups-list');
    if (!container) return;
    
    if (groups.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No chat groups yet</p>';
        return;
    }
    
    container.innerHTML = groups.map(g => `
        <div class="chat-list-item" onclick="openChat('${g.name}', ${g.id})">
            <div class="chat-icon" style="background-color: ${g.group_type === 'society' ? 'var(--green-bg)' : 'var(--blue-bg)'}; color: ${g.group_type === 'society' ? 'var(--brand)' : 'var(--blue)'};">
                <i data-lucide="${g.group_type === 'society' ? 'users' : 'message-circle'}"></i>
            </div>
            <div class="chat-info">
                <div class="chat-group-name">${g.name}</div>
                <div class="chat-last-message">${g.last_message || 'Start the conversation!'}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">${g.last_time ? getTimeAgo(new Date(g.last_time)) : ''}</div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

let currentChatGroupId = null;
let chatRefreshInterval = null;

function openChat(groupName, groupId) {
    currentChatGroupId = groupId;
    navigateToView('individual-chat-view');
    document.getElementById('chatGroupName').innerText = groupName;
    loadChatMessages(groupId);
    
    if (chatRefreshInterval) clearInterval(chatRefreshInterval);
    chatRefreshInterval = setInterval(() => loadChatMessages(groupId), 5000);
}

function loadChatMessages(groupId) {
    fetch(`/api/chat-groups/${groupId}/messages`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                displayChatMessages(data.messages || []);
            }
        })
        .catch(err => console.log('Error loading messages'));
}

function displayChatMessages(messages) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">No messages yet. Start the conversation!</p>';
        return;
    }
    
    container.innerHTML = messages.map(m => {
        const isOwn = m.sender_id === window.currentUserId;
        const time = new Date(m.created_at);
        const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="chat-message ${isOwn ? 'sent' : 'received'}">
                ${!isOwn ? `<div class="message-sender">${m.sender_name}</div>` : ''}
                <div class="message-bubble">
                    <div class="message-text">${m.message}</div>
                    <span class="message-time">${timeStr}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !currentChatGroupId) return;
    
    const content = input.value.trim();
    if (!content) return;
    
    fetch(`/api/chat-groups/${currentChatGroupId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            input.value = '';
            loadChatMessages(currentChatGroupId);
        } else {
            showToast(data.message || 'Failed to send message', 'error');
        }
    })
    .catch(err => showToast('Error sending message', 'error'));
}

function initChatInput() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }
}

function closeChatView() {
    if (chatRefreshInterval) {
        clearInterval(chatRefreshInterval);
        chatRefreshInterval = null;
    }
    currentChatGroupId = null;
    showChatPage();
}

function showMyProfilePage() {
    navigateToView('my-profile-view');
    loadMyProfileData();
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

// --- Public/Private Request Toggle ---
function initRequestTypeToggle() {
    const toggle = document.getElementById('requestTypeToggle');
    if (!toggle) return;
    const buttons = toggle.querySelectorAll('.toggle-btn');
    const publicSection = document.getElementById('public-requests-section');
    const privateSection = document.getElementById('private-requests-section');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.value === 'public') {
                publicSection.style.display = 'block';
                privateSection.style.display = 'none';
            } else {
                publicSection.style.display = 'none';
                privateSection.style.display = 'block';
                renderPrivateRequests();
            }
        });
    });
}

function renderPrivateRequests() {
    const grid = document.getElementById('private-requests-grid');
    
    fetch('/api/maintenance-requests?type=private')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const myReqs = data.requests || [];
                
                if (myReqs.length === 0) {
                    grid.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px;">No private requests yet.</p>';
                    return;
                }
                
                grid.innerHTML = myReqs.map(req => `
                    <div class="request-card">
                        <div class="request-header">
                            <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;">P</div>
                            <div>
                                <span class="request-user">Your Request</span>
                                <span class="request-flat">${req.title}</span>
                            </div>
                            <span class="request-status status-${req.status || 'pending'}">${req.status || 'Pending'}</span>
                        </div>
                        <div class="request-body">
                            <p>${req.description}</p>
                        </div>
                        <div class="request-actions">
                            ${req.assigned_business_name ? `<span style="font-size:12px; color:var(--brand);">Assigned to: ${req.assigned_business_name}</span>` : '<span style="font-size:12px; color:var(--muted);">Not assigned</span>'}
                        </div>
                    </div>
                `).join('');
            }
        })
        .catch(err => console.log('Error loading private requests'));
}

function renderPublicRequests() {
    const grid = document.getElementById('public-requests-grid');
    
    fetch('/api/maintenance-requests?type=public')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const publicReqs = data.requests || [];
                
                if (publicReqs.length === 0) {
                    grid.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px;">No public requests yet.</p>';
                    return;
                }
                
                grid.innerHTML = publicReqs.map(req => {
                    const date = new Date(req.created_at);
                    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    return `
                        <div class="request-card">
                            <div class="request-header">
                                <div class="profile-pic-placeholder-sm" style="background-color: #eaf2ff;">R</div>
                                <div>
                                    <span class="request-user">Flat ${req.flat_number || 'N/A'}</span>
                                    <span class="request-flat">${dateStr}</span>
                                </div>
                                <span class="request-status status-${req.status || 'pending'}">${(req.status || 'Open').replace('_', ' ')}</span>
                            </div>
                            <div class="request-body">
                                <h4>${req.title}</h4>
                                <p>${req.description}</p>
                            </div>
                            <div class="request-actions">
                                ${req.engaged ? '<span style="font-size:12px; color:var(--brand);">Engaged</span>' : ''}
                            </div>
                        </div>
                    `;
                }).join('');
                lucide.createIcons();
            }
        })
        .catch(err => console.log('Error loading public requests'));
}

function loadPublicReviews() {
    const grid = document.getElementById('public-reviews-grid');
    if (!grid) return;
    
    fetch('/api/reviews')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const reviews = data.reviews || [];
                
                if (reviews.length === 0) {
                    grid.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px;">No reviews yet. Be the first to share your feedback!</p>';
                    return;
                }
                
                grid.innerHTML = reviews.map(r => {
                    const date = new Date(r.created_at);
                    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                    return `
                        <div class="review-card">
                            <div class="review-header">
                                <div class="profile-pic-placeholder-sm">R</div>
                                <div>
                                    <span class="review-user">Resident</span>
                                    <span class="review-date">${dateStr}</span>
                                </div>
                            </div>
                            <div class="review-rating" style="color: var(--orange); font-size: 16px;">${stars}</div>
                            <div class="review-body">
                                <p>${r.review_text}</p>
                            </div>
                            ${r.business_comment ? `<div class="review-reply"><strong>Business Reply:</strong> ${r.business_comment}</div>` : ''}
                        </div>
                    `;
                }).join('');
            }
        })
        .catch(err => console.log('Error loading reviews'));
}

// --- QR Code Generation ---
function initQRGenerator() {
    const btn = document.getElementById('generate-qr-btn');
    if (!btn) return;
    
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.getElementById('visitor-name').value;
        const type = document.getElementById('visitor-type').value;
        const date = document.getElementById('visitor-date').value;
        const time = document.getElementById('visitor-time').value;
        
        if (!name || !type || !date || !time) {
            showToast('Fill all fields first', 'error');
            return;
        }
        
        const qrData = JSON.stringify({ name, type, date, time, flat: 'Your Flat', createdAt: new Date().toISOString() });
        const container = document.getElementById('qr-code-container');
        container.innerHTML = '';
        
        const qr = new QRCode(container, { text: qrData, width: 200, height: 200 });
        document.getElementById('qr-code-display').style.display = 'block';
        showToast('QR Code generated! Share with your visitor', 'success');
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


// --- Form Submission Logic ---
function handleFormSubmit(event, successMsg) {
    event.preventDefault(); 
    const form = event.target;
    const btn = form.querySelector('.form-submit-btn');
    
    if (!btn) return;
    const originalText = btn.innerText;
    btn.classList.add('loading');
    btn.innerText = 'Loading...';
    
    // -- SPECIAL LOGIC: Save Maintenance Request --
    const catInput = form.querySelector('#category'); 
    if (catInput && document.getElementById('maintenanceScopeToggle')) {
        const scopeBtn = document.querySelector('#maintenanceScopeToggle .toggle-btn.active');
        const descInput = form.querySelector('#description');
        const isPublic = scopeBtn.dataset.value === 'society';
        
        fetch('/api/maintenance-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: catInput.options[catInput.selectedIndex].text,
                description: descInput.value,
                request_type: isPublic ? 'public' : 'private',
                is_public: isPublic
            })
        })
        .then(res => res.json())
        .then(data => {
            btn.classList.remove('loading');
            btn.innerText = originalText;
            if (data.success) {
                showToast('Request Submitted!', 'success');
                form.reset();
                loadResidentMaintenanceRequests();
                renderPublicRequests();
                if (!isPublic) {
                    renderPrivateRequests();
                }
            } else {
                showToast(data.message || 'Failed to submit request', 'error');
            }
        })
        .catch(err => {
            btn.classList.remove('loading');
            btn.innerText = originalText;
            showToast('Error submitting request', 'error');
        });
        return;
    }
    
    // -- SPECIAL LOGIC: Save Review --
    const reviewCat = form.querySelector('#review-category');
    if (reviewCat) {
        const rating = parseInt(document.getElementById('starRatingInput')?.value) || 0;
        const desc = form.querySelector('#review-description')?.value;
        const category = reviewCat.value;
        
        if (rating < 1) {
            btn.classList.remove('loading');
            btn.innerText = originalText;
            showToast('Please select a star rating', 'error');
            return;
        }
        
        fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rating: rating,
                review_text: desc,
                category: category,
                business_id: 1
            })
        })
        .then(res => res.json())
        .then(data => {
            btn.classList.remove('loading');
            btn.innerText = originalText;
            if (data.success) {
                showToast('Your review has been published!', 'success');
                form.reset();
                const starContainer = document.getElementById('reviewStarRating');
                if (starContainer) {
                    starContainer.querySelectorAll('i').forEach(s => {
                        s.classList.remove('selected');
                        s.style.fill = 'none';
                        s.style.stroke = 'var(--muted)';
                    });
                    document.getElementById('starRatingInput').value = '0';
                }
                loadPublicReviews();
            } else {
                showToast(data.message || 'Failed to submit review', 'error');
            }
        })
        .catch(err => {
            btn.classList.remove('loading');
            btn.innerText = originalText;
            showToast('Error submitting review', 'error');
        });
        return;
    }

    // Default form behavior for other forms
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.innerText = originalText;
        showToast(successMsg, 'success');
        event.target.reset();
        
        // --- Reset privacy toggle ---
        const privacyToggle = document.getElementById('privacyToggle');
        if (privacyToggle) {
            privacyToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            privacyToggle.querySelector('[data-value="private"]').classList.add('active');
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
            const rating = parseInt(star.dataset.value);
            ratingInput.value = rating;
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('selected');
                    s.style.fill = '#ff8c00';
                    s.style.stroke = '#ff8c00';
                } else {
                    s.classList.remove('selected');
                    s.style.fill = 'none';
                    s.style.stroke = 'var(--muted)';
                }
            });
        });
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.dataset.value);
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.style.stroke = '#ff8c00';
                    s.style.fill = '#ff8c00';
                } else {
                    s.style.stroke = 'var(--muted)';
                    s.style.fill = 'none';
                }
            });
        });
        star.addEventListener('mouseout', () => {
            const currentRating = parseInt(ratingInput.value) || 0;
            stars.forEach((s, i) => {
                if (i < currentRating) {
                    s.style.fill = '#ff8c00';
                    s.style.stroke = '#ff8c00';
                } else {
                    s.style.fill = 'none';
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


// --- LOGOUT ---
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

// --- Socket.IO for Real-Time Updates ---
function initSocketIO() {
    if (typeof io !== 'undefined') {
        const socket = io();
        
        socket.on('connect', function() {
            console.log('Socket.IO connected');
        });
        
        socket.on('request_status_update', function(data) {
            console.log('Received status update:', data);
            if (currentView === 'maintenance-view') {
                loadResidentMaintenanceRequests();
            }
            addResidentNotification('Maintenance Update', `Request "${data.title}" status changed to ${data.status.replace('_', ' ')}`);
        });
    }
}

// --- SIDEBAR & NOTIFICATION SCRIPT ---
document.addEventListener('DOMContentLoaded', function() {
    initLogout();
    initResidentPhotoUpload();
    initResidentNotifications();
    initChatInput();
    initRatingStars();
    loadMyProfileData();
    initBackButtonHandling();
    initHomeLinkNav();
    initSocketIO();
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
    initProfileEdit();
    initRequestTypeToggle();
    initQRGenerator();
    initRatingStars();
    updateDuesList();
    initBackButtonHandling();
    initHomeLinkNav();
    initResidentPhotoUpload();
    initResidentNotifications();
    loadActivityLogs();
    lucide.createIcons();
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

function initResidentPhotoUpload() {
    const photoInput = document.getElementById('resident-photo-input');
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
                    document.getElementById('resident-pic-placeholder').style.display = 'none';
                    const img = document.getElementById('resident-profile-pic');
                    img.src = photoData;
                    img.style.display = 'block';
                    showToast('Profile photo updated!', 'success');
                    addResidentActivity('Profile photo updated');
                } else {
                    showToast('Failed to update photo', 'error');
                }
            })
            .catch(err => showToast('Failed to upload photo', 'error'));
        };
        reader.readAsDataURL(file);
    });
}

function initResidentNotifications() {
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

function addResidentActivity(text) {
    const list = document.querySelector('.activity-list');
    if (!list) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const li = document.createElement('li');
    li.innerHTML = `<i data-lucide="check-circle" class="activity-icon-sm" style="color: var(--brand);"></i><span class="activity-text">${text}</span><span class="activity-timestamp">${time}</span>`;
    list.insertBefore(li, list.firstChild);
    lucide.createIcons({nodes: [li.querySelector('i')]});
}

function addResidentNotification(title, message) {
    const list = document.getElementById('resident-notification-list');
    if (!list) return;
    const li = document.createElement('li');
    li.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--glass); cursor: pointer;';
    li.innerHTML = `<strong>${title}</strong><br><small style="color: var(--muted);">${message}</small>`;
    list.insertBefore(li, list.firstChild);
}

function loadResidentDashboard() {
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

    fetch('/api/maintenance-requests')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const countEl = document.getElementById('maintenance-count');
                if (countEl) countEl.textContent = data.requests ? data.requests.length : 0;
            }
        })
        .catch(err => console.log('Maintenance loaded with defaults'));
}

window.addEventListener('load', loadResidentDashboard);