// ===== SAP Business One Dashboard - Main Application =====

// Configuration object for SAP B1 connection
const config = {
    server: '',
    database: '',
    username: '',
    password: '',
    port: '30015',
    refreshInterval: 300000, // 5 minutes
    currency: 'USD'
};

// State management
const state = {
    isConnected: false,
    currentSection: 'dashboard',
    isLoading: false,
    lastUpdate: null,
    initializedSections: {} // Track which sections have been initialized
};

// DOM Elements
const elements = {
    sidebar: document.getElementById('sidebar'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.content-section'),
    connectionStatus: document.getElementById('connectionStatus'),
    refreshBtn: document.getElementById('refreshData'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    lastUpdate: document.getElementById('lastUpdate'),
    periodFilter: document.getElementById('periodFilter'),
    themeSelect: document.getElementById('themeSelect'),
    dbConnectionForm: document.getElementById('dbConnectionForm'),
    testConnectionBtn: document.getElementById('testConnection')
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Setup event listeners
    setupSidebarToggle();
    setupNavigation();
    setupRefresh();
    setupSettingsForm();
    setupPeriodFilter();
    setupTheme();

    // Load initial data (simulated)
    loadDashboardData();

    // Update timestamp
    updateLastUpdated();

    // Check for saved configuration
    loadSavedConfig();
}

// ===== Sidebar Toggle =====
function setupSidebarToggle() {
    elements.toggleSidebar.addEventListener('click', () => {
        elements.sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', elements.sidebar.classList.contains('collapsed'));
    });

    // Restore sidebar state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        elements.sidebar.classList.add('collapsed');
    }
}

// ===== Navigation =====
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Show corresponding section
    elements.sections.forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionId}`);
    });

    state.currentSection = sectionId;

    // Initialize section-specific charts if needed
    initializeSectionCharts(sectionId);
}

function initializeSectionCharts(sectionId) {
    // Only initialize charts once per section
    if (state.initializedSections[sectionId]) {
        return;
    }

    switch(sectionId) {
        case 'sales':
            initializeSalesCharts();
            break;
        case 'inventory':
            initializeInventoryCharts();
            break;
        case 'finance':
            initializeFinanceCharts();
            break;
        case 'purchasing':
            initializePurchasingCharts();
            break;
        case 'customers':
            initializeCustomerCharts();
            break;
    }

    state.initializedSections[sectionId] = true;
}

// ===== Refresh Functionality =====
function setupRefresh() {
    elements.refreshBtn.addEventListener('click', () => {
        refreshData();
    });
}

async function refreshData() {
    if (state.isLoading) return;

    state.isLoading = true;
    elements.refreshBtn.classList.add('loading');
    showLoading();

    try {
        // Simulate API call delay
        await delay(1500);

        // Reload data
        loadDashboardData();

        showToast('Data refreshed successfully', 'success');
        updateLastUpdated();
    } catch (error) {
        showToast('Failed to refresh data', 'error');
    } finally {
        state.isLoading = false;
        elements.refreshBtn.classList.remove('loading');
        hideLoading();
    }
}

// ===== Settings Form =====
function setupSettingsForm() {
    elements.dbConnectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveConfiguration();
    });

    elements.testConnectionBtn.addEventListener('click', () => {
        testConnection();
    });
}

function saveConfiguration() {
    config.server = document.getElementById('serverIP').value;
    config.database = document.getElementById('dbName').value;
    config.username = document.getElementById('dbUser').value;
    config.password = document.getElementById('dbPassword').value;
    config.port = document.getElementById('dbPort').value;

    // Save to localStorage (in production, use secure storage)
    localStorage.setItem('sapConfig', JSON.stringify({
        server: config.server,
        database: config.database,
        username: config.username,
        port: config.port
    }));

    showToast('Configuration saved successfully', 'success');
}

function loadSavedConfig() {
    const saved = localStorage.getItem('sapConfig');
    if (saved) {
        const parsed = JSON.parse(saved);
        document.getElementById('serverIP').value = parsed.server || '';
        document.getElementById('dbName').value = parsed.database || '';
        document.getElementById('dbUser').value = parsed.username || '';
        document.getElementById('dbPort').value = parsed.port || '30015';
    }
}

async function testConnection() {
    showLoading();

    // Simulate connection test
    await delay(2000);

    // In production, this would actually test the connection
    const success = Math.random() > 0.3; // Simulate 70% success rate for demo

    hideLoading();

    if (success) {
        setConnectionStatus(true);
        showToast('Connection successful!', 'success');
    } else {
        setConnectionStatus(false);
        showToast('Connection failed. Please check your credentials.', 'error');
    }
}

function setConnectionStatus(connected) {
    state.isConnected = connected;
    elements.connectionStatus.innerHTML = connected
        ? '<i class="fas fa-circle"></i><span>Connected</span>'
        : '<i class="fas fa-circle"></i><span>Disconnected</span>';
    elements.connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
}

// ===== Period Filter =====
function setupPeriodFilter() {
    elements.periodFilter.addEventListener('change', () => {
        refreshData();
    });
}

// ===== Theme Management =====
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (elements.themeSelect) {
        elements.themeSelect.value = savedTheme;
        elements.themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }
}

// ===== Loading Overlay =====
function showLoading() {
    elements.loadingOverlay.classList.add('show');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('show');
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Update Timestamp =====
function updateLastUpdated() {
    const now = new Date();
    state.lastUpdate = now;
    elements.lastUpdate.textContent = now.toLocaleString();
}

// ===== Data Loading Functions =====
function loadDashboardData() {
    // Update KPIs
    updateKPIs();

    // Update tables
    updateRecentOrders();
    updateLowStockTable();

    // Update alerts and activities
    updateAlerts();
    updateActivities();

    // Initialize main charts only once
    if (!state.initializedSections['dashboard']) {
        initializeDashboardCharts();
        state.initializedSections['dashboard'] = true;
    }
}

function updateKPIs() {
    // Simulated data - In production, this would come from SAP B1
    animateValue('totalRevenue', 0, 1284500, 1000, '$');
    animateValue('totalOrders', 0, 842, 1000);
    animateValue('newCustomers', 0, 156, 1000);
    animateValue('grossProfit', 0, 385200, 1000, '$');
    animateValue('inventoryValue', 0, 2456800, 1000, '$');
    animateValue('pendingOrders', 0, 47, 1000);
}

function animateValue(elementId, start, end, duration, prefix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = Math.floor(progress * (end - start) + start);
        element.textContent = prefix + current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateRecentOrders() {
    const tableBody = document.getElementById('recentOrdersTable');
    if (!tableBody) return;

    const orders = simulatedData.recentOrders;

    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.orderNum}</strong></td>
            <td>${order.customer}</td>
            <td>${order.date}</td>
            <td>$${order.amount.toLocaleString()}</td>
            <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
        </tr>
    `).join('');
}

function updateLowStockTable() {
    const tableBody = document.getElementById('lowStockTable');
    if (!tableBody) return;

    const items = simulatedData.lowStockItems;

    tableBody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.itemCode}</strong></td>
            <td>${item.description}</td>
            <td class="${item.inStock < 10 ? 'danger-text' : 'warning-text'}">${item.inStock}</td>
            <td>${item.reorderLevel}</td>
            <td><button class="action-btn reorder" onclick="createPurchaseOrder('${item.itemCode}')">Reorder</button></td>
        </tr>
    `).join('');
}

function updateAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    const alerts = simulatedData.alerts;

    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item">
            <div class="alert-icon ${alert.type}">
                <i class="fas ${alert.icon}"></i>
            </div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
            </div>
        </div>
    `).join('');
}

function updateActivities() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    const activities = simulatedData.activities;

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-dot ${activity.type}"></div>
            <div class="activity-content">
                <h4>${activity.action}</h4>
                <p>${activity.details} • ${activity.time}</p>
            </div>
        </div>
    `).join('');
}

// ===== Action Functions =====
function createPurchaseOrder(itemCode) {
    showToast(`Creating purchase order for ${itemCode}...`, 'info');
    // In production, this would open a PO creation dialog or navigate to PO module
}

// ===== Utility Functions =====
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

// ===== Search Functionality =====
document.querySelector('.search-bar input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    // In production, this would search through SAP B1 data
    console.log('Searching for:', query);
});

// ===== Export Functions =====
function exportToCSV(data, filename) {
    const csv = convertToCSV(data);
    downloadFile(csv, filename, 'text/csv');
}

function convertToCSV(data) {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]).join(','));

    return [headers.join(','), ...rows].join('\n');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// ===== Auto Refresh =====
let autoRefreshInterval;

function setupAutoRefresh() {
    const intervalSelect = document.getElementById('refreshInterval');
    if (!intervalSelect) return;

    intervalSelect.addEventListener('change', (e) => {
        const interval = parseInt(e.target.value) * 1000;

        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }

        if (interval > 0) {
            autoRefreshInterval = setInterval(refreshData, interval);
            showToast(`Auto-refresh set to ${e.target.value} seconds`, 'info');
        } else {
            showToast('Auto-refresh disabled', 'info');
        }
    });
}

// Initialize auto-refresh after DOM is ready
document.addEventListener('DOMContentLoaded', setupAutoRefresh);

