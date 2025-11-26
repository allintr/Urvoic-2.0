// Paste your Business Dashboard JavaScript here
// --- Master "On Load" ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initViewSwitcher();
    initSidebar(); // NEW: Added from Guard
    
    // Init functions for all pages
    initRating('urvoic-rating'); // Dashboard rating
    initProfileEdit();       // Profile page
    initBookingTabs();       // Bookings page
    initBookingActions();    // Bookings page
    initBookingModal();      // For booking scheduling
    initRatingFilters();     // Reviews page
    initReviewActions();     // Reviews page
    initCalendarToggles();   // Schedule page
    initEventClick();        // Schedule page
    initEarningsPage();      // UPDATED: For pending earnings
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

// --- Toast Notification (Global) ---
function showToast(msg, type) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content"><div class="toast-title">${type === 'success' ? 'Success' : (type === 'error' ? 'Error' : 'Info')}</div><div class="toast-msg">${msg}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// --- View-Switching Logic ---
const allViews = document.querySelectorAll('.view-section');
function hideAllViews() {
    allViews.forEach(view => view.classList.remove('active-view'));
}

// UPDATED: showPage function now accepts an optional tabId
function showPage(pageId, infoKey = null, tabId = null) {
    hideAllViews();
    const view = document.getElementById(pageId + '-view');
    if (view) {
        view.classList.add('active-view');
        window.scrollTo(0,0);
        
        // Handle info page content (for footer links)
        if (pageId === 'info' && infoKey) {
            const data = pageData[infoKey];
            if (data) {
                document.getElementById('info-page-title').innerText = data.title;
                document.getElementById('info-page-subtitle').innerText = data.subtitle;
                document.getElementById('info-page-content').innerHTML = data.content;
            }
        }
        
        // NEW: Handle auto-switching to a specific tab
        if (tabId) {
            const tabButton = view.querySelector(`.toggle-btn[data-tab="${tabId}"]`);
            const tabContent = document.getElementById(tabId);
            
            if (tabButton && tabContent) {
                // Deactivate all tabs in that group
                const tabGroup = tabButton.closest('.form-toggle');
                tabGroup.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                
                // Deactivate all tab content
                const contentGroup = tabContent.parentElement;
                contentGroup.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Activate the target tab and content
                tabButton.classList.add('active');
                tabContent.classList.add('active');
            }
        }
        
    } else {
        console.error('View not found: ' + pageId + '-view');
        document.getElementById('dashboard-view').classList.add('active-view');
    }
}

// UPDATED: initViewSwitcher now checks for data-tab
function initViewSwitcher() {
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('[data-page]');
        if (button) {
            e.preventDefault();
            const pageId = button.dataset.page;
            const infoKey = button.dataset.info || null;
            const tabId = button.dataset.tab || null; // NEW: Check for tab
            
            showPage(pageId, infoKey, tabId); // NEW: Pass tabId to showPage
        }
    });
    
    const headerSearch = document.getElementById('header-search-btn');
    if(headerSearch) {
        headerSearch.addEventListener('click', () => {
            showPage('dashboard');
            setTimeout(() => {
                document.getElementById('heroSearchInput').focus();
            }, 100);
        });
    }
}

// --- NEW: Sidebar & Notification Logic (from Guard) ---
function initSidebar() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar-nav');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const notificationBtn = document.getElementById('header-notify-btn');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationOverlay = document.getElementById('notificationOverlay');
    const closeNotifyBtn = document.getElementById('close-notifications-btn');

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
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notificationPanel.classList.contains('active');
            closeAllPanels();
            if (!isOpen) {
                notificationPanel.classList.add('active');
                notificationOverlay.classList.add('active');
            }
        });
    }

    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeAllPanels); 
    if (notificationOverlay) notificationOverlay.addEventListener('click', closeAllPanels);
    if (closeNotifyBtn) closeNotifyBtn.addEventListener('click', closeAllPanels);
    
    if (sidebar) {
        sidebar.querySelectorAll('.btn-sidebar').forEach(btn => {
            btn.addEventListener('click', closeAllPanels);
        });
    }
    if (notificationPanel) {
        notificationPanel.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', closeAllPanels);
        });
    }
}

// --- Rating Logic (for Dashboard) ---
function initRating(containerId) {
    const ratingContainer = document.getElementById(containerId);
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
            if (ratingMessage) ratingMessage.textContent = messages[clickedRating];
        });
        star.addEventListener('mouseover', (e) => {
            const hoverRating = parseInt(e.currentTarget.dataset.rating);
            stars.forEach((s, index) => {
                s.style.stroke = (index < hoverRating) ? '#00b67a' : '#ccc';
            });
        });
        star.addEventListener('mouseout', () => {
            stars.forEach(s => s.style.stroke = '#ccc');
        });
    });
}

// --- Profile Page Logic ---
function initProfileEdit() {
    const profileView = document.getElementById('profile-view');
    if (!profileView) return;
    profileView.addEventListener('click', (e) => {
        const item = e.target.closest('.profile-detail-item');
        if (e.target.closest('.btn-edit-toggle')) {
            if(item) {
                profileView.querySelectorAll('.profile-detail-item.is-editing').forEach(i => i.classList.remove('is-editing'));
                item.classList.add('is-editing');
                const valueSpan = item.querySelector('.profile-detail-value');
                const editInput = item.querySelector('.profile-edit-input');
                editInput.value = valueSpan.dataset.originalValue;
            }
        }
        if (e.target.closest('.btn-cancel')) {
            if(item) item.classList.remove('is-editing');
        }
        if (e.target.closest('.btn-save')) {
            if(item) {
                const valueSpan = item.querySelector('.profile-detail-value');
                const editInput = item.querySelector('.profile-edit-input');
                const fieldName = item.dataset.fieldName;
                const newValue = editInput.value;
                
                if (editInput.tagName === 'SELECT') {
                     valueSpan.textContent = editInput.options[editInput.selectedIndex].text;
                } else {
                    valueSpan.textContent = newValue;
                }
                valueSpan.dataset.originalValue = newValue;
                item.classList.remove('is-editing');
                showToast(`${fieldName} updated!`, 'success');
            }
        }
    });
}

// --- Bookings Page Logic ---
let itemToSchedule = null; // Store the item being approved
const scheduleModal = document.getElementById('schedule-modal');

function initBookingTabs() {
    const tabContainer = document.querySelector('#bookings-view .form-toggle');
    if (!tabContainer) return;
    
    const tabButtons = tabContainer.querySelectorAll('.toggle-btn');
    const tabContents = document.querySelectorAll('#bookings-view .tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.tab;
            const targetContent = document.getElementById(targetId);
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            if (targetContent) targetContent.classList.add('active');
        });
    });
}
function initBookingActions() {
    const lists = document.querySelectorAll('#bookings-view .member-list');
    if (lists.length === 0) return;
    lists.forEach(list => {
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.member-list-item');
            if (!item) return;
            const residentName = item.querySelector('.member-name').innerText;
            
            if (e.target.closest('.btn-approve')) {
                itemToSchedule = item; 
                scheduleModal.classList.add('active');
            }
            if (e.target.closest('.btn-deny')) {
                showToast(`Request from ${residentName} Denied.`, 'error');
                item.remove();
            }
            if (e.target.closest('.btn-complete')) {
                showToast(`Job for ${residentName} marked Complete!`, 'success');
                item.remove();
            }
            if (e.target.closest('.btn-cancel-sm')) {
                showToast(`Job for ${residentName} Cancelled.`, 'error');
                item.remove();
            }
        });
    });
}

// NEW: Booking Schedule Modal Logic
function initBookingModal() {
    if (!scheduleModal) return;
    
    const closeButtons = scheduleModal.querySelectorAll('.modal-close-btn');
    const confirmButton = document.getElementById('confirm-schedule-btn');
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');

    closeButtons.forEach(btn => btn.addEventListener('click', () => {
        scheduleModal.classList.remove('active');
        itemToSchedule = null;
    }));
    
    confirmButton.addEventListener('click', () => {
        if (!dateInput.value || !timeInput.value) {
            showToast('Please select both a date and time.', 'error');
            return;
        }
        
        if (itemToSchedule) {
            const residentName = itemToSchedule.querySelector('.member-name').innerText;
            showToast(`Request from ${residentName} Approved & Scheduled!`, 'success');
            itemToSchedule.remove(); // Remove item from "New Requests"
            itemToSchedule = null;
        }
        
        scheduleModal.classList.remove('active');
        dateInput.value = '';
        timeInput.value = '';
    });
}

// --- Reviews Page Logic ---
function initRatingFilters() {
    const reviewView = document.getElementById('reviews-view');
    if (!reviewView) return;
    const filterRows = reviewView.querySelectorAll('.filter-row');
    const allReviewsButton = reviewView.querySelector('.btn-filter-all');
    const reviewCards = reviewView.querySelectorAll('.review-card[data-rating]');
    const reviewListTitle = reviewView.querySelector('#review-list-title');
    const noReviewsMsg = reviewView.querySelector('#no-reviews-found');

    function filterReviews(rating) {
        let count = 0;
        reviewCards.forEach(card => {
            if (card.dataset.rating === rating) {
                card.style.display = 'block';
                count++;
            } else {
                card.style.display = 'none';
            }
        });
        noReviewsMsg.style.display = (count === 0) ? 'block' : 'none';
    }
    function showAllReviews() {
        reviewCards.forEach(card => { card.style.display = 'block'; });
        noReviewsMsg.style.display = 'none';
    }

    filterRows.forEach(row => {
        row.addEventListener('click', () => {
            const rating = row.dataset.ratingFilter;
            filterRows.forEach(r => r.classList.remove('active'));
            row.classList.add('active');
            allReviewsButton.classList.remove('active');
            const plural = (rating === '1') ? 'Star' : 'Stars';
            reviewListTitle.innerText = `${rating} ${plural} Reviews`;
            filterReviews(rating);
        });
    });

    allReviewsButton.addEventListener('click', () => {
        filterRows.forEach(r => r.classList.remove('active'));
        allReviewsButton.classList.add('active');
        reviewListTitle.innerText = `All Reviews (${reviewCards.length})`;
        showAllReviews();
    });
}
function initReviewActions() {
    const reviewList = document.getElementById('review-list-container');
    if (!reviewList) return;
    reviewList.addEventListener('click', (e) => {
        const replyButton = e.target.closest('.btn-reply');
        const cancelButton = e.target.closest('.btn-comment-cancel');
        const postButton = e.target.closest('.btn-comment-post');

        if (replyButton) {
            const reviewCard = replyButton.closest('.review-card');
            const commentBox = reviewCard.querySelector('.review-comment-box');
            if (commentBox) {
                commentBox.style.display = 'block';
                replyButton.style.display = 'none';
            }
        }
        if (cancelButton) {
            const reviewCard = cancelButton.closest('.review-card');
            const commentBox = reviewCard.querySelector('.review-comment-box');
            const originalReplyButton = reviewCard.querySelector('.btn-reply');
            if (commentBox) {
                commentBox.style.display = 'none';
                commentBox.querySelector('textarea').value = ''; 
            }
            if (originalReplyButton) originalReplyButton.style.display = 'inline-flex';
        }
        if (postButton) {
            const reviewCard = postButton.closest('.review-card');
            const commentBox = reviewCard.querySelector('.review-comment-box');
            const textarea = commentBox.querySelector('textarea');
            if (textarea.value.trim() === '') {
                showToast('Reply cannot be empty.', 'error'); return;
            }
            const replyBox = document.createElement('div');
            replyBox.className = 'review-reply-box';
            replyBox.innerHTML = `<span class="review-reply-header">Your Reply:</span><p class="review-reply-body">${textarea.value}</p>`;
            reviewCard.appendChild(replyBox);
            commentBox.style.display = 'none';
            textarea.value = '';
            showToast('Reply posted successfully!', 'success');
        }
    });
}

// --- Schedule Page Logic ---
function initCalendarToggles() {
    const toggleContainer = document.querySelector('#schedule-view .view-toggle');
    if (!toggleContainer) return;
    const toggleButtons = toggleContainer.querySelectorAll('.toggle-btn');
    const weekView = document.getElementById('calendar-week-view');
    const monthView = document.getElementById('calendar-month-view');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.dataset.view;
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (view === 'month') {
                weekView.style.display = 'none';
                monthView.style.display = 'block';
            } else {
                weekView.style.display = 'flex';
                monthView.style.display = 'none';
            }
        });
    });
}
function initEventClick() {
    const eventList = document.querySelector('#schedule-view .calendar-week-view');
    if (!eventList) return;
    eventList.addEventListener('click', (e) => {
        const eventItem = e.target.closest('.calendar-event-item');
        if (!eventItem) return;
        const bookingId = eventItem.dataset.bookingId;
        const eventTime = eventItem.querySelector('.event-time').innerText;
        showToast(`Clicked event ${bookingId} at ${eventTime}.`, 'success');
    });
}

// --- UPDATED: Earnings Page Logic ---
let currentTotalEarnings = 10000;
let currentTotalJobs = 15;
let currentGoalMax = 25000;

function initEarningsPage() {
    const earningsView = document.getElementById('earnings-view');
    if (!earningsView) return;

    // 1. "Edit Goal" button
    const editGoalBtn = earningsView.querySelector('.btn-edit-goal');
    if (editGoalBtn) {
        editGoalBtn.addEventListener('click', () => {
            const newGoal = prompt("Enter your new monthly goal:", currentGoalMax);
            if (newGoal && !isNaN(newGoal)) {
                currentGoalMax = parseInt(newGoal);
                updateGoalUI();
                showToast('Goal updated successfully!', 'success');
            } else if (newGoal) {
                showToast('Please enter a valid number.', 'error');
            }
        });
    }
    
    // 2. Search Logic
    const searchInput = earningsView.querySelector('#transaction-search');
    if (searchInput) {
        const noResultsMsg = earningsView.querySelector('#no-transactions-found');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            let found = false;
            const transactionItems = earningsView.querySelectorAll('#transaction-list .member-list-item');
            
            transactionItems.forEach(item => {
                const searchTerm = item.dataset.searchTerm.toLowerCase();
                if (searchTerm.includes(query)) {
                    item.style.display = 'flex';
                    found = true;
                } else {
                    item.style.display = 'none';
                }
            });
            noResultsMsg.style.display = found ? 'none' : 'block';
        });
    }
    
    // 3. NEW: Pending Earnings Logic
    const pendingList = document.getElementById('pending-earnings-list');
    if (pendingList) {
        pendingList.addEventListener('click', (e) => {
            const confirmButton = e.target.closest('.btn-confirm-payment');
            if (!confirmButton) return;
            
            const item = confirmButton.closest('.pending-earning');
            const amountInput = item.querySelector('.pending-earning-input');
            const amount = parseFloat(amountInput.value);
            const method = confirmButton.dataset.method;
            
            if (!amount || amount <= 0) {
                showToast('Please enter a valid amount.', 'error');
                return;
            }
            
            const residentName = item.querySelector('.member-name').innerText;
            const residentDetail = item.querySelector('.member-detail').innerText.replace('Completed: ', '');
            const searchTerm = item.dataset.searchTerm;
            
            logTransaction(residentName, residentDetail, amount, method, searchTerm);
            
            currentTotalEarnings += amount;
            currentTotalJobs += 1;
            updateEarningsUI();
            
            item.remove();
            showToast(`+ ₹${amount.toLocaleString('en-IN')} logged from ${residentName}!`, 'success');
        });
    }
}

function updateEarningsUI() {
    const totalEarningsEl = document.getElementById('total-earnings-value');
    const totalJobsEl = document.getElementById('total-jobs-value');
    const dashboardEarningsEl = document.getElementById('dashboard-earnings-value');
    
    if(totalEarningsEl) totalEarningsEl.innerText = `₹${currentTotalEarnings.toLocaleString('en-IN')}`;
    if(totalJobsEl) totalJobsEl.innerText = currentTotalJobs;
    if(dashboardEarningsEl) dashboardEarningsEl.innerText = `₹${(currentTotalEarnings/1000).toFixed(0)}k`;
    
    updateGoalUI();
}

function updateGoalUI() {
    const goalBar = document.getElementById('goal-progress-bar');
    const goalText = document.getElementById('goal-progress-text');
    
    if(goalBar) goalBar.value = currentTotalEarnings;
    if(goalBar) goalBar.max = currentGoalMax;
    if(goalText) goalText.innerHTML = `<strong>₹${currentTotalEarnings.toLocaleString('en-IN')}</strong> of ₹${currentGoalMax.toLocaleString('en-IN')} target`;
}

function logTransaction(name, detail, amount, method, searchTerm) {
    const transactionList = document.getElementById('transaction-list');
    if (!transactionList) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'member-list-item';
    newItem.dataset.searchTerm = searchTerm;
    
    const today = new Date();
    const dateString = `${today.getDate()} ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`;
    
    newItem.innerHTML = `
        <div class="profile-pic-placeholder-sm" style="background-color: var(--green-bg);"><i data-lucide="check-check"></i></div>
        <div class="member-info">
            <div class="member-name">${name}</div>
            <div class="member-detail">${detail} • ${dateString}</div>
        </div>
        <div class="transaction-amount">
            <p class="amount-value">+ ₹${amount.toLocaleString('en-IN')}</p>
            <p class="amount-method">(Collected ${method})</p>
        </div>
    `;
    
    transactionList.prepend(newItem); // Add to top of history
    lucide.createIcons({
        nodes: [newItem.querySelector('i')]
    });
}

// --- NEW: Info Page (for footer) ---
const pageData = {
    about: { title: "About Us", subtitle: "Building better communities together", content: `<p>Urvoic is dedicated to connecting neighbors...</p>` },
    contact: { title: "Contact Us", subtitle: "We'd love to hear from you", content: `<p>Have questions or need support? Reach out to us!</p><strong>Email:</strong> support@urvoic.com<br><strong>Phone:</strong> +91 123 456 7890` },
    help: { title: "Help Center", subtitle: "Frequently Asked Questions", content: `<p>How do I manage bookings? ...</p>` },
    privacy: { title: "Privacy Policy", subtitle: "Last updated: Nov 2025", content: `<p>Your privacy is important to us...</p>` },
    terms: { title: "Terms & Conditions", subtitle: "Rules for using Urvoic", content: `<p>By accessing Urvoic, you agree...</p>` },
    guidelines: { title: "Community Guidelines", subtitle: "Keeping our community safe", content: `<p>To ensure a positive experience...</p>` }
};