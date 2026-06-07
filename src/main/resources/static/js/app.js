// Constants
const API_BASE = '/api';
let currentRole = 'admin';
let activeView = 'admin-dashboard';
let userLoggedInId = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Set Current Date in Header
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDateStr').innerText = new Date().toLocaleDateString('en-US', options);

    // Initial load
    switchRole('admin');
});

// Role Routing
const menus = {
    admin: [
        { id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-pie', title: 'Library Dashboard', subtitle: 'Global status overview and key metrics.' },
        { id: 'admin-books', label: 'Manage Books', icon: 'fa-book', title: 'Book Inventory', subtitle: 'Manage library catalog, update records and stock.' },
        { id: 'admin-members', label: 'Manage Members', icon: 'fa-users', title: 'Library Members', subtitle: 'Add, edit, or delete registered members.' },
        { id: 'admin-transactions', label: 'Borrow & Reservations', icon: 'fa-arrow-right-arrow-left', title: 'Circulation & Bookings', subtitle: 'Process issues, returns, and track active bookings.' },
        { id: 'admin-queries', label: 'Queries Inbox', icon: 'fa-inbox', title: 'Support Mailbox', subtitle: 'View and manage queries submitted by library members.' }
    ],
    user: [
        { id: 'user-explore', label: 'Explore Catalog', icon: 'fa-compass', title: 'Browse Library', subtitle: 'Search books by genre, title, author or ISBN.' },
        { id: 'user-account', label: 'My Account', icon: 'fa-circle-user', title: 'Member Portal', subtitle: 'Check your active issues, reservation queues, and due fines.' },
        { id: 'user-contact', label: 'Contact Library', icon: 'fa-envelope', title: 'Support & Queries', subtitle: 'Submit a query to the library administrator.' }
    ]
};

function switchRole(role) {
    currentRole = role;
    
    // Update active role switcher button
    const indicator = document.getElementById('roleIndicator');
    const buttons = document.querySelectorAll('.role-btn');
    
    if (role === 'admin') {
        indicator.style.transform = 'translateX(0)';
        buttons[0].classList.add('active');
        buttons[1].classList.remove('active');
        activeView = 'admin-dashboard';
    } else {
        indicator.style.transform = 'translateX(100%)';
        buttons[0].classList.remove('active');
        buttons[1].classList.add('active');
        activeView = 'user-explore';
    }

    // Load Sidebar Menu
    renderSidebarMenu();
    navigateTo(activeView);
}

function renderSidebarMenu() {
    const menuContainer = document.getElementById('sidebarMenu');
    menuContainer.innerHTML = '';

    menus[currentRole].forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="nav-link ${activeView === item.id ? 'active' : ''}" onclick="navigateTo('${item.id}')">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `;
        menuContainer.appendChild(li);
    });
}

function navigateTo(viewId) {
    activeView = viewId;

    // Toggle nav active classes
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => link.classList.remove('active'));
    
    // Update matching sidebar element
    const menuList = menus[currentRole];
    const viewMeta = menuList.find(item => item.id === viewId);
    
    if (viewMeta) {
        // Find link elements by traversing and finding matching label text
        links.forEach(link => {
            if (link.querySelector('span').innerText === viewMeta.label) {
                link.classList.add('active');
            }
        });
        
        // Update header titles
        document.getElementById('viewTitle').innerText = viewMeta.title;
        document.getElementById('viewSubtitle').innerText = viewMeta.subtitle;
    }

    // Toggle pages
    const pages = document.querySelectorAll('.view-page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(viewId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Fetch view specific data
    loadViewData(viewId);
}

function loadViewData(viewId) {
    switch (viewId) {
        case 'admin-dashboard':
            loadDashboardData();
            break;
        case 'admin-books':
            loadAdminBooks();
            break;
        case 'admin-members':
            loadAdminMembers();
            break;
        case 'admin-transactions':
            loadAdminTransactions();
            break;
        case 'admin-queries':
            loadAdminQueries();
            break;
        case 'user-explore':
            loadUserBooks();
            break;
        case 'user-account':
            if (userLoggedInId) {
                loadUserAccountDetails(userLoggedInId);
            } else {
                document.getElementById('accountLoginCard').style.display = 'block';
                document.getElementById('accountDashboard').style.display = 'none';
            }
            break;
    }
}

// Global Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMsg = document.getElementById('toastMsg');

    toastMsg.innerText = message;
    
    toast.className = 'toast-notification active';
    if (type === 'success') {
        toast.classList.add('toast-success');
        toastIcon.className = 'fa-solid fa-circle-check';
    } else {
        toast.classList.add('toast-error');
        toastIcon.className = 'fa-solid fa-triangle-exclamation';
    }

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
}

// Modal Handlers
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Helper: Format Date
function formatDate(dateArr) {
    if (!dateArr) return 'N/A';
    // Spring Boot can return date as array or ISO string
    if (Array.isArray(dateArr)) {
        const [year, month, day] = dateArr;
        return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(dateArr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Helper: Make API calls with clean error catching
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
        }
        // Handle empty success responses
        if (response.status === 204 || response.status === 200 && response.headers.get('content-length') === '0') {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("API Call error: ", error);
        throw error;
    }
}


// ==========================================
// VIEW-SPECIFIC DATA LOADERS & INTERACTIVITY
// ==========================================

// --- ADMIN: Dashboard ---
async function loadDashboardData() {
    try {
        const data = await apiCall(`${API_BASE}/reports/summary`);
        
        // Render Summary Stats
        const statsHtml = `
            <div class="glass-card stat-card stat-primary">
                <div class="stat-icon"><i class="fa-solid fa-book"></i></div>
                <div class="stat-info">
                    <div class="stat-label">Total Books</div>
                    <div class="stat-value">${data.totalBooks}</div>
                </div>
            </div>
            <div class="glass-card stat-card stat-secondary">
                <div class="stat-icon"><i class="fa-solid fa-book-open-reader"></i></div>
                <div class="stat-info">
                    <div class="stat-label">Active Issues</div>
                    <div class="stat-value">${data.issuedBooks}</div>
                </div>
            </div>
            <div class="glass-card stat-card stat-warning">
                <div class="stat-icon"><i class="fa-solid fa-hourglass-half"></i></div>
                <div class="stat-info">
                    <div class="stat-label">Overdue Books</div>
                    <div class="stat-value">${data.overdueBooksCount}</div>
                </div>
            </div>
            <div class="glass-card stat-card stat-success">
                <div class="stat-icon"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                <div class="stat-info">
                    <div class="stat-label">Fines Received</div>
                    <div class="stat-value">$${data.totalFinesCollected.toFixed(2)}</div>
                </div>
            </div>
        `;
        document.getElementById('dashboardStats').innerHTML = statsHtml;

        // Render Category Bar Chart
        const chartContainer = document.getElementById('categoryChartContainer');
        chartContainer.innerHTML = '';

        const categories = Object.keys(data.categoryDistribution || {});
        if (categories.length === 0) {
            chartContainer.innerHTML = '<div class="empty-state">No categories available</div>';
        } else {
            const maxVal = Math.max(...Object.values(data.categoryDistribution));
            categories.forEach(cat => {
                const count = data.categoryDistribution[cat];
                const pct = maxVal > 0 ? (count / maxVal) * 80 : 0; // scale to max 80% height

                const barWrapper = document.createElement('div');
                barWrapper.className = 'chart-bar-wrapper';
                barWrapper.innerHTML = `
                    <div class="chart-bar" style="height: ${Math.max(10, pct)}%">
                        <span class="chart-bar-value">${count}</span>
                    </div>
                    <span class="chart-bar-label" title="${cat}">${cat}</span>
                `;
                chartContainer.appendChild(barWrapper);
            });
        }

        // Render Recent Activity (Transaction History)
        const history = await apiCall(`${API_BASE}/transactions/history`);
        const recentList = document.getElementById('recentActivityList');
        recentList.innerHTML = '';

        if (history.length === 0) {
            recentList.innerHTML = '<div class="empty-state">No recent activity</div>';
        } else {
            history.slice(0, 5).forEach(txn => {
                const item = document.createElement('li');
                item.className = `activity-item ${txn.returnDate ? 'return' : 'issue'}`;
                
                let text = '';
                let iconClass = '';
                if (txn.returnDate) {
                    text = `Returned <strong>${txn.book.title}</strong> (Member ID: ${txn.member.id})`;
                    iconClass = 'fa-arrow-down-to-bracket';
                } else {
                    text = `Issued <strong>${txn.book.title}</strong> to <strong>${txn.member.name}</strong>`;
                    iconClass = 'fa-arrow-up-from-bracket';
                }

                item.innerHTML = `
                    <div class="activity-icon"><i class="fa-solid ${iconClass}"></i></div>
                    <div class="activity-details">
                        <div class="activity-text">${text}</div>
                        <div class="activity-time">${formatDate(txn.issueDate)}</div>
                    </div>
                `;
                recentList.appendChild(item);
            });
        }

    } catch (e) {
        showToast("Error loading dashboard statistics: " + e.message, "error");
    }
}

// --- ADMIN: Manage Books ---
async function loadAdminBooks() {
    try {
        const query = document.getElementById('adminBookSearch').value;
        const books = await apiCall(`${API_BASE}/books?search=${encodeURIComponent(query)}`);
        
        const tbody = document.getElementById('adminBooksTableBody');
        tbody.innerHTML = '';

        if (books.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-box-open"></i><br>No books found matching criteria.</td></tr>';
            return;
        }

        books.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${book.title}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary)">By ${book.author} | ID: ${book.id}</div>
                </td>
                <td><code style="font-size: 0.85rem;">${book.isbn}</code></td>
                <td><span class="badge badge-regular">${book.category}</span></td>
                <td>
                    <strong style="color: ${book.availableCopies > 0 ? 'var(--success)' : 'var(--danger)'}">
                        ${book.availableCopies}
                    </strong>
                </td>
                <td>${book.totalCopies}</td>
                <td style="text-align: right;">
                    <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; margin-right: 0.25rem;" onclick="editBook(${book.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; color: var(--danger);" onclick="deleteBook(${book.id})"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        showToast("Error loading books: " + e.message, "error");
    }
}

function openBookModal(bookData = null) {
    document.getElementById('bookForm').reset();
    
    if (bookData) {
        document.getElementById('bookModalTitle').innerText = 'Edit Book Details';
        document.getElementById('bookId').value = bookData.id;
        document.getElementById('bookTitleInput').value = bookData.title;
        document.getElementById('bookAuthorInput').value = bookData.author;
        document.getElementById('bookIsbnInput').value = bookData.isbn;
        document.getElementById('bookCategoryInput').value = bookData.category;
        document.getElementById('bookCopiesInput').value = bookData.totalCopies;
    } else {
        document.getElementById('bookModalTitle').innerText = 'Add New Book';
        document.getElementById('bookId').value = '';
    }
    
    openModal('bookModal');
}

async function editBook(bookId) {
    try {
        const book = await apiCall(`${API_BASE}/books/${bookId}`);
        openBookModal(book);
    } catch (e) {
        showToast("Error loading book detail: " + e.message, "error");
    }
}

async function saveBookData(event) {
    event.preventDefault();
    const id = document.getElementById('bookId').value;
    const bookData = {
        title: document.getElementById('bookTitleInput').value,
        author: document.getElementById('bookAuthorInput').value,
        isbn: document.getElementById('bookIsbnInput').value,
        category: document.getElementById('bookCategoryInput').value,
        totalCopies: parseInt(document.getElementById('bookCopiesInput').value)
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/books/${id}` : `${API_BASE}/books`;

    try {
        await apiCall(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        
        closeModal('bookModal');
        showToast(id ? "Book updated successfully." : "Book added to catalogue.");
        loadAdminBooks();
    } catch (e) {
        showToast("Error saving book: " + e.message, "error");
    }
}

async function deleteBook(id) {
    if (!confirm("Are you sure you want to permanently remove this book?")) return;

    try {
        await apiCall(`${API_BASE}/books/${id}`, { method: 'DELETE' });
        showToast("Book deleted from catalogue.");
        loadAdminBooks();
    } catch (e) {
        showToast("Error deleting book: " + e.message, "error");
    }
}

// --- ADMIN: Manage Members ---
async function loadAdminMembers() {
    try {
        const query = document.getElementById('adminMemberSearch').value.toLowerCase();
        const members = await apiCall(`${API_BASE}/members`);
        
        const tbody = document.getElementById('adminMembersTableBody');
        tbody.innerHTML = '';

        // Filter locally for clean fast experience
        const filtered = members.filter(m => 
            m.name.toLowerCase().includes(query) || 
            m.email.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-users-slash"></i><br>No members found matching criteria.</td></tr>';
            return;
        }

        filtered.forEach(member => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${member.id}</strong></td>
                <td><div style="font-weight: 600;">${member.name}</div></td>
                <td><code>${member.email}</code></td>
                <td>${member.phone}</td>
                <td><span class="badge badge-${member.membershipType.toLowerCase()}">${member.membershipType}</span></td>
                <td style="text-align: right;">
                    <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; margin-right: 0.25rem;" onclick="editMember(${member.id})"><i class="fa-solid fa-user-pen"></i></button>
                    <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; color: var(--danger);" onclick="deleteMember(${member.id})"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        showToast("Error loading members: " + e.message, "error");
    }
}

function openMemberModal(memberData = null) {
    document.getElementById('memberForm').reset();
    
    if (memberData) {
        document.getElementById('memberModalTitle').innerText = 'Edit Member Details';
        document.getElementById('memberIdInput').value = memberData.id;
        document.getElementById('memberNameInput').value = memberData.name;
        document.getElementById('memberEmailInput').value = memberData.email;
        document.getElementById('memberPhoneInput').value = memberData.phone;
        document.getElementById('memberTypeInput').value = memberData.membershipType;
    } else {
        document.getElementById('memberModalTitle').innerText = 'Add New Member';
        document.getElementById('memberIdInput').value = '';
    }
    
    openModal('memberModal');
}

async function editMember(id) {
    try {
        const member = await apiCall(`${API_BASE}/members/${id}`);
        openMemberModal(member);
    } catch (e) {
        showToast("Error loading member: " + e.message, "error");
    }
}

async function saveMemberData(event) {
    event.preventDefault();
    const id = document.getElementById('memberIdInput').value;
    const memberData = {
        name: document.getElementById('memberNameInput').value,
        email: document.getElementById('memberEmailInput').value,
        phone: document.getElementById('memberPhoneInput').value,
        membershipType: document.getElementById('memberTypeInput').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/members/${id}` : `${API_BASE}/members`;

    try {
        await apiCall(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData)
        });
        
        closeModal('memberModal');
        showToast(id ? "Member profile updated." : "New member registered successfully.");
        loadAdminMembers();
    } catch (e) {
        showToast("Error saving member: " + e.message, "error");
    }
}

async function deleteMember(id) {
    if (!confirm("Are you sure you want to delete this library member?")) return;

    try {
        await apiCall(`${API_BASE}/members/${id}`, { method: 'DELETE' });
        showToast("Member unregistered.");
        loadAdminMembers();
    } catch (e) {
        showToast("Error deleting member: " + e.message, "error");
    }
}

// --- ADMIN: Borrow & Reservations ---
async function loadAdminTransactions() {
    try {
        // Load Active Checkouts
        const txns = await apiCall(`${API_BASE}/transactions/active`);
        const checkoutsBody = document.getElementById('activeCheckoutsTableBody');
        checkoutsBody.innerHTML = '';

        if (txns.length === 0) {
            checkoutsBody.innerHTML = '<tr><td colspan="6" class="empty-state">No books are currently issued.</td></tr>';
        } else {
            const today = new Date();
            txns.forEach(t => {
                const tr = document.createElement('tr');
                const dueDate = new Date(t.dueDate);
                const isOverdue = dueDate < today;
                
                // Calculate dynamic fine
                let fineDisplay = '$0.00';
                let fineBadge = '<span class="badge badge-paid">Good Standing</span>';
                if (isOverdue) {
                    const days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                    if (days > 0) {
                        fineDisplay = `$${(days * 1.0).toFixed(2)}`;
                        fineBadge = `<span class="badge badge-unpaid">Overdue (${days}d)</span>`;
                    }
                }

                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 600;">${t.book.title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary)">Book ID: ${t.book.id}</div>
                    </td>
                    <td>
                        <div>${t.member.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary)">Member ID: ${t.member.id}</div>
                    </td>
                    <td>${formatDate(t.issueDate)}</td>
                    <td style="color: ${isOverdue ? 'var(--danger)' : 'inherit'}; font-weight: ${isOverdue ? '600' : 'normal'};">
                        ${formatDate(t.dueDate)}
                    </td>
                    <td>
                        <div>${fineBadge}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">Est. Fine: ${fineDisplay}</div>
                    </td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" onclick="quickReturnBook(${t.member.id}, ${t.book.id})">
                            <i class="fa-solid fa-arrow-down-to-bracket"></i> Return
                        </button>
                    </td>
                `;
                checkoutsBody.appendChild(tr);
            });
        }

        // Load Reservations
        const reserves = await apiCall(`${API_BASE}/reservations`);
        const reservesBody = document.getElementById('allReservationsTableBody');
        reservesBody.innerHTML = '';

        if (reserves.length === 0) {
            reservesBody.innerHTML = '<tr><td colspan="6" class="empty-state">No active reservations in the queue.</td></tr>';
        } else {
            reserves.forEach(r => {
                const tr = document.createElement('tr');
                let statusBadge = '';
                let actionBtn = '';

                if (r.status === 'PENDING') {
                    statusBadge = '<span class="badge badge-regular" style="background: var(--warning-glow); color: var(--warning); border-color: var(--warning)">Queue</span>';
                    actionBtn = `
                        <button class="btn btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; margin-right: 0.25rem; color: var(--success);" onclick="updateReservation(${r.id}, 'FULFILLED')">Fulfill</button>
                        <button class="btn btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; color: var(--danger);" onclick="updateReservation(${r.id}, 'CANCELLED')">Cancel</button>
                    `;
                } else if (r.status === 'FULFILLED') {
                    statusBadge = '<span class="badge badge-paid">Fulfilled</span>';
                } else {
                    statusBadge = '<span class="badge badge-unpaid">Cancelled</span>';
                }

                tr.innerHTML = `
                    <td><strong>#${r.id}</strong></td>
                    <td><strong>${r.book.title}</strong> (ID: ${r.book.id})</td>
                    <td>${r.member.name} (ID: ${r.member.id})</td>
                    <td>${formatDate(r.reservationDate)}</td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">${actionBtn}</td>
                `;
                reservesBody.appendChild(tr);
            });
        }

    } catch (e) {
        showToast("Error loading transaction listings: " + e.message, "error");
    }
}

function openIssueModal() {
    document.getElementById('issueForm').reset();
    openModal('issueModal');
}

async function submitIssueBook(event) {
    event.preventDefault();
    const payload = {
        memberId: parseInt(document.getElementById('issueMemberId').value),
        bookId: parseInt(document.getElementById('issueBookId').value)
    };

    try {
        await apiCall(`${API_BASE}/transactions/issue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        closeModal('issueModal');
        showToast("Book issued successfully!");
        loadAdminTransactions();
    } catch (e) {
        showToast("Issue failed: " + e.message, "error");
    }
}

function openReturnModal() {
    document.getElementById('returnForm').reset();
    openModal('returnModal');
}

async function submitReturnBook(event) {
    event.preventDefault();
    const payload = {
        memberId: parseInt(document.getElementById('returnMemberId').value),
        bookId: parseInt(document.getElementById('returnBookId').value)
    };

    try {
        const txn = await apiCall(`${API_BASE}/transactions/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        closeModal('returnModal');
        
        if (txn.fineAmount > 0) {
            showToast(`Returned! Outstanding Overdue Fine: $${txn.fineAmount.toFixed(2)}`, "error");
        } else {
            showToast("Book returned in good standing.");
        }
        
        loadAdminTransactions();
    } catch (e) {
        showToast("Return failed: " + e.message, "error");
    }
}

async function quickReturnBook(memberId, bookId) {
    try {
        const txn = await apiCall(`${API_BASE}/transactions/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, bookId })
        });
        
        if (txn.fineAmount > 0) {
            showToast(`Book Returned. Due Fine: $${txn.fineAmount.toFixed(2)}`, "error");
        } else {
            showToast("Book returned.");
        }
        
        loadAdminTransactions();
    } catch (e) {
        showToast("Return failed: " + e.message, "error");
    }
}

async function updateReservation(resId, status) {
    try {
        await apiCall(`${API_BASE}/reservations/${resId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        showToast(`Reservation status updated to: ${status}`);
        loadAdminTransactions();
    } catch (e) {
        showToast("Failed to update reservation: " + e.message, "error");
    }
}


// --- ADMIN: Support Mailbox ---
async function loadAdminQueries() {
    try {
        const queries = await apiCall(`${API_BASE}/queries`);
        const tbody = document.getElementById('adminQueriesTableBody');
        tbody.innerHTML = '';

        if (queries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No queries in inbox.</td></tr>';
            return;
        }

        queries.forEach(q => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${q.senderName}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-secondary)"><a href="mailto:${q.senderEmail}" style="color: inherit;">${q.senderEmail}</a></div>
                </td>
                <td><strong>${q.subject}</strong></td>
                <td><p style="font-size: 0.85rem; max-width: 320px; word-break: break-word;">${q.message}</p></td>
                <td>${formatDate(q.dateSent)}</td>
                <td style="text-align: right;">
                    <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; color: var(--success);" onclick="resolveQuery(${q.id})">
                        <i class="fa-solid fa-check"></i> Resolve
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        showToast("Error loading mailbox: " + e.message, "error");
    }
}

async function resolveQuery(id) {
    try {
        await apiCall(`${API_BASE}/queries/${id}`, { method: 'DELETE' });
        showToast("Message marked as resolved.");
        loadAdminQueries();
    } catch (e) {
        showToast("Action failed: " + e.message, "error");
    }
}


// --- USER: Explore Catalog ---
let activeCategory = 'all';

async function loadUserBooks() {
    try {
        const searchInput = document.getElementById('userBookSearch').value;
        const books = await apiCall(`${API_BASE}/books?search=${encodeURIComponent(searchInput)}`);
        
        // Render Categories dynamically in Tabs
        const categories = await apiCall(`${API_BASE}/books/categories`);
        const tabsContainer = document.getElementById('categoryTabs');
        
        tabsContainer.innerHTML = `<button class="category-tab ${activeCategory === 'all' ? 'active' : ''}" onclick="filterCategory('all')">All</button>`;
        categories.forEach(cat => {
            tabsContainer.innerHTML += `
                <button class="category-tab ${activeCategory === cat ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>
            `;
        });

        // Render Books Grid
        const grid = document.getElementById('userBooksGrid');
        grid.innerHTML = '';

        // Filter locally by category
        const filtered = activeCategory === 'all' 
            ? books 
            : books.filter(b => b.category.toLowerCase() === activeCategory.toLowerCase());

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><i class="fa-solid fa-box-open"></i><br>No books available.</div>';
            return;
        }

        filtered.forEach(book => {
            const card = document.createElement('div');
            card.className = 'glass-card book-card';
            
            const isAvail = book.availableCopies > 0;
            const badgeClass = isAvail ? 'badge-available' : 'badge-unavailable';
            const badgeText = isAvail ? 'Available' : 'Out of Stock';

            card.innerHTML = `
                <div class="book-cover-mock">
                    <span class="book-cover-badge ${badgeClass}">${badgeText}</span>
                    <i class="fa-solid fa-book"></i>
                </div>
                <div class="book-title" title="${book.title}">${book.title}</div>
                <div class="book-author">By ${book.author}</div>
                <div class="book-meta">
                    <span>Category: <strong>${book.category}</strong></span>
                    <span>Stock: <strong>${book.availableCopies}/${book.totalCopies}</strong></span>
                </div>
                <div class="book-card-actions">
                    <button class="btn btn-primary" ${!isAvail ? 'disabled' : ''} onclick="promptIssue(${book.id})">
                        <i class="fa-solid fa-arrow-up-from-bracket"></i> Issue
                    </button>
                    <button class="btn btn-secondary" onclick="promptReserve(${book.id})">
                        <i class="fa-solid fa-calendar-check"></i> Reserve
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (e) {
        showToast("Error loading catalog: " + e.message, "error");
    }
}

function filterCategory(cat) {
    activeCategory = cat;
    loadUserBooks();
}

function promptIssue(bookId) {
    const memberId = prompt("Please enter your Member ID to complete the checkout:");
    if (!memberId) return;

    apiCall(`${API_BASE}/transactions/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: parseInt(memberId), bookId: bookId })
    })
    .then(() => {
        showToast("Book issued successfully!");
        loadUserBooks();
    })
    .catch(e => {
        showToast(e.message, "error");
    });
}

function promptReserve(bookId) {
    const memberId = prompt("Enter your Member ID to place an advance booking reservation:");
    if (!memberId) return;

    apiCall(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: parseInt(memberId), bookId: bookId })
    })
    .then(() => {
        showToast("Advance booking reservation confirmed!");
    })
    .catch(e => {
        showToast(e.message, "error");
    });
}


// --- USER: My Account Portal ---
async function loginUserAccount() {
    const idInput = document.getElementById('loginMemberId').value;
    if (!idInput) {
        showToast("Please enter a valid Member ID", "error");
        return;
    }

    try {
        // Fetch Member details to verify login
        const member = await apiCall(`${API_BASE}/members/${idInput}`);
        userLoggedInId = member.id;
        
        document.getElementById('accountLoginCard').style.display = 'none';
        document.getElementById('accountDashboard').style.display = 'block';
        
        loadUserAccountDetails(userLoggedInId);
        showToast(`Welcome back, ${member.name}!`);
    } catch (e) {
        showToast("Member ID not found. Verify and try again.", "error");
    }
}

async function loadUserAccountDetails(memberId) {
    try {
        const member = await apiCall(`${API_BASE}/members/${memberId}`);
        const txns = await apiCall(`${API_BASE}/transactions/member/${memberId}`);
        const reserves = await apiCall(`${API_BASE}/reservations/member/${memberId}`);

        // 1. Render Profile Details Card
        const activeIssues = txns.filter(t => !t.returnDate).length;
        const unpaidFineTotal = txns.reduce((sum, t) => sum + (!t.finePaid ? t.fineAmount : 0), 0);

        const profileCard = document.getElementById('memberProfileCard');
        profileCard.innerHTML = `
            <div class="profile-avatar">${member.name.charAt(0)}</div>
            <div class="profile-name">${member.name}</div>
            <div class="profile-role">${member.membershipType} Member</div>
            
            <div class="profile-details">
                <div class="profile-detail-item">
                    <span>Card ID</span>
                    <strong>${member.id}</strong>
                </div>
                <div class="profile-detail-item">
                    <span>Email Address</span>
                    <code>${member.email}</code>
                </div>
                <div class="profile-detail-item">
                    <span>Phone Number</span>
                    <strong>${member.phone}</strong>
                </div>
                <div class="profile-detail-item">
                    <span>Active Loans</span>
                    <strong>${activeIssues} books</strong>
                </div>
                <div class="profile-detail-item">
                    <span>Unpaid Fines</span>
                    <strong style="color: ${unpaidFineTotal > 0 ? 'var(--danger)' : 'var(--success)'}">$${unpaidFineTotal.toFixed(2)}</strong>
                </div>
            </div>
            
            <button class="btn btn-secondary" style="width: 100%; margin-top: 1.5rem; color: var(--danger);" onclick="logoutUserAccount()">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
        `;

        // 2. Render Checkouts Table
        const txnsBody = document.getElementById('userCheckoutsTableBody');
        txnsBody.innerHTML = '';

        if (txns.length === 0) {
            txnsBody.innerHTML = '<tr><td colspan="4" class="empty-state">You have no active checkouts or transaction history.</td></tr>';
        } else {
            txns.forEach(t => {
                const tr = document.createElement('tr');
                const isReturned = t.returnDate !== null;
                
                let statusText = '';
                if (isReturned) {
                    statusText = '<span class="badge badge-paid">Returned</span>';
                } else {
                    const today = new Date();
                    const due = new Date(t.dueDate);
                    if (due < today) {
                        statusText = `<span class="badge badge-unpaid">OVERDUE</span>`;
                    } else {
                        statusText = `<span class="badge badge-regular" style="background: rgba(98, 0, 234, 0.05); border-color: var(--primary); color: var(--primary);">Active</span>`;
                    }
                }

                // Fine display
                let fineDisplay = '$0.00';
                if (t.fineAmount > 0) {
                    const fineStatus = t.finePaid ? 'Paid' : 'UNPAID';
                    fineDisplay = `<strong style="color: ${t.finePaid ? 'var(--success)' : 'var(--danger)'}">$${t.fineAmount.toFixed(2)}</strong> (${fineStatus})`;
                }

                tr.innerHTML = `
                    <td>
                        <div style="font-weight:600;">${t.book.title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary)">By ${t.book.author}</div>
                    </td>
                    <td>${formatDate(t.issueDate)}</td>
                    <td>${formatDate(t.dueDate)}</td>
                    <td>
                        <div>${statusText}</div>
                        <div style="font-size: 0.8rem; margin-top: 0.15rem;">Fine: ${fineDisplay}</div>
                    </td>
                `;
                txnsBody.appendChild(tr);
            });
        }

        // 3. Render Reservations Table
        const reservesBody = document.getElementById('userReservationsTableBody');
        reservesBody.innerHTML = '';

        if (reserves.length === 0) {
            reservesBody.innerHTML = '<tr><td colspan="4" class="empty-state">No advance bookings placed.</td></tr>';
        } else {
            reserves.forEach(r => {
                const tr = document.createElement('tr');
                let badge = '';
                if (r.status === 'PENDING') {
                    badge = '<span class="badge badge-regular" style="background: var(--warning-glow); color: var(--warning); border-color: var(--warning)">Wait-list</span>';
                } else if (r.status === 'FULFILLED') {
                    badge = '<span class="badge badge-paid">Fulfilled</span>';
                } else {
                    badge = '<span class="badge badge-unpaid">Cancelled</span>';
                }

                tr.innerHTML = `
                    <td><strong>${r.book.title}</strong></td>
                    <td>${r.book.author}</td>
                    <td>${formatDate(r.reservationDate)}</td>
                    <td>${badge}</td>
                `;
                reservesBody.appendChild(tr);
            });
        }

    } catch (e) {
        showToast("Error retrieving member profile details: " + e.message, "error");
    }
}

function logoutUserAccount() {
    userLoggedInId = null;
    document.getElementById('accountLoginCard').style.display = 'block';
    document.getElementById('accountDashboard').style.display = 'none';
    showToast("Logged out of member account.");
}


// --- USER: Contact / Query Submission ---
async function submitUserQuery(event) {
    event.preventDefault();
    const queryData = {
        senderName: document.getElementById('queryName').value,
        senderEmail: document.getElementById('queryEmail').value,
        subject: document.getElementById('querySubject').value,
        message: document.getElementById('queryMessage').value
    };

    try {
        await apiCall(`${API_BASE}/queries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryData)
        });

        // Fire flying letter animation
        const formWrapper = document.getElementById('contactFormWrapper');
        const envelopeAnim = document.getElementById('envelopeAnimation');
        
        formWrapper.style.display = 'none';
        envelopeAnim.style.display = 'block';

        setTimeout(() => {
            // Restore form layout after animation
            envelopeAnim.style.display = 'none';
            formWrapper.style.display = 'block';
            document.getElementById('contactForm').reset();
            showToast("Your support message has been sent!");
        }, 3000);

    } catch (e) {
        showToast("Failed to send query: " + e.message, "error");
    }
}
