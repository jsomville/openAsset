// API Configuration
const API_BASE_URL = '/api';
const DEVICES_ENDPOINT = `${API_BASE_URL}/device`;

// DOM Elements
const devicesContainer = document.getElementById('devicesContainer');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');

// Modal Elements
const detailsModal = document.getElementById('detailsModal');
const deleteModal = document.getElementById('deleteModal');
const closeModal = document.getElementById('closeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteMessage = document.getElementById('deleteMessage');

// State
let allDevices = [];
let deviceToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadDevices();
    attachEventListeners();
});

// Theme Management
function initializeTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        updateThemeToggle();
    }
}

function attachEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    refreshBtn.addEventListener('click', () => loadDevices());
    searchInput.addEventListener('input', filterDevices);
    
    // Modal close events
    closeModal.addEventListener('click', () => detailsModal.style.display = 'none');
    closeModalBtn.addEventListener('click', () => detailsModal.style.display = 'none');
    closeDeleteModal.addEventListener('click', () => deleteModal.style.display = 'none');
    cancelDeleteBtn.addEventListener('click', () => deleteModal.style.display = 'none');
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Close modals when clicking outside
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) detailsModal.style.display = 'none';
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) deleteModal.style.display = 'none';
    });
}

function toggleTheme() {
    const darkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkMode);
    updateThemeToggle();
}

function updateThemeToggle() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkMode ? '☀️' : '🌙';
}

// Load Devices
async function loadDevices() {
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(DEVICES_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`Failed to load devices: ${response.statusText}`);
        }
        
        const devices = await response.json();
        allDevices = Array.isArray(devices) ? devices : [];
        
        renderDevices(allDevices);
    } catch (error) {
        console.error('Error loading devices:', error);
        showError(error.message || 'Failed to load devices');
        devicesContainer.innerHTML = '';
    } finally {
        showLoading(false);
    }
}

// Filter Devices
function filterDevices() {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allDevices.filter(device =>
        device.hostname.toLowerCase().includes(searchTerm) ||
        device.host.toLowerCase().includes(searchTerm) ||
        device.os.toLowerCase().includes(searchTerm)
    );
    
    renderDevices(filtered);
}

// Render Devices
function renderDevices(devices) {
    if (devices.length === 0) {
        emptyState.style.display = allDevices.length === 0 ? 'block' : 'none';
        devicesContainer.innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    devicesContainer.innerHTML = devices.map(device => createDeviceRow(device)).join('');
    
    // Attach event listeners to buttons
    document.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', () => showDeviceDetails(btn.dataset.hostname));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => showDeleteConfirmation(btn.dataset.hostname));
    });
}

// Create Device Row
function createDeviceRow(device) {
    const statusClass = device.status === 'online' ? 'online' : 'offline';
    const statusText = device.status || 'unknown';
    const updatedDate = new Date(device.updatedAt).toLocaleString();
    
    return `
        <tr>
            <td class="hostname-cell">${escapeHtml(device.hostname)}</td>
            <td>${escapeHtml(device.host)}</td>
            <td>${escapeHtml(device.os)}</td>
            <td>${escapeHtml(device.cpu)}</td>
            <td>${escapeHtml(device.ram)}</td>
            <td>${escapeHtml(device.type)}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span></td>
            <td class="timestamp">${updatedDate}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-small btn-details" data-hostname="${escapeHtml(device.hostname)}" title="View Details">
                        📋
                    </button>
                    <button class="btn btn-danger btn-small btn-delete" data-hostname="${escapeHtml(device.hostname)}" title="Delete Device">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Show Device Details
async function showDeviceDetails(hostname) {
    try {
        const response = await fetch(`${DEVICES_ENDPOINT}/${encodeURIComponent(hostname)}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch device details');
        }
        
        const device = await response.json();
        const detailsTitle = document.getElementById('detailsTitle');
        const detailsBody = document.getElementById('detailsBody');
        
        detailsTitle.textContent = `${escapeHtml(device.hostname)} - Details`;
        
        const createdDate = new Date(device.createdAt).toLocaleString();
        const updatedDate = new Date(device.updatedAt).toLocaleString();
        
        detailsBody.innerHTML = `
            <div class="device-info">
                <div class="device-info-row">
                    <span class="device-label">Hostname:</span>
                    <span class="device-value">${escapeHtml(device.hostname)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Host:</span>
                    <span class="device-value">${escapeHtml(device.host)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">OS:</span>
                    <span class="device-value">${escapeHtml(device.os)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Kernel:</span>
                    <span class="device-value">${escapeHtml(device.kernel)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">CPU:</span>
                    <span class="device-value">${escapeHtml(device.cpu)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">RAM:</span>
                    <span class="device-value">${escapeHtml(device.ram)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Type:</span>
                    <span class="device-value">${escapeHtml(device.type)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Status:</span>
                    <span class="device-value">${escapeHtml(device.status)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Uptime:</span>
                    <span class="device-value">${escapeHtml(device.uptime)}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Packages Count:</span>
                    <span class="device-value">${device.packagesCount}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Created:</span>
                    <span class="device-value">${createdDate}</span>
                </div>
                <div class="device-info-row">
                    <span class="device-label">Updated:</span>
                    <span class="device-value">${updatedDate}</span>
                </div>
            </div>
        `;
        
        detailsModal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading device details:', error);
        showError('Failed to load device details');
    }
}

// Show Delete Confirmation
function showDeleteConfirmation(hostname) {
    deviceToDelete = hostname;
    deleteMessage.textContent = `Are you sure you want to delete device "${escapeHtml(hostname)}"? This action cannot be undone.`;
    deleteModal.style.display = 'flex';
}

// Confirm Delete
async function confirmDelete() {
    if (!deviceToDelete) return;
    
    try {
        const response = await fetch(`${DEVICES_ENDPOINT}/${encodeURIComponent(deviceToDelete)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete device');
        }
        
        deleteModal.style.display = 'none';
        deviceToDelete = null;
        
        // Reload devices
        await loadDevices();
    } catch (error) {
        console.error('Error deleting device:', error);
        showError('Failed to delete device: ' + error.message);
        deleteModal.style.display = 'none';
    }
}

// Helper Functions
function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorState.style.display = 'block';
}

function hideError() {
    errorState.style.display = 'none';
    errorMessage.textContent = '';
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Set app version from package.json
fetch('/api/version')
    .then(res => res.json())
    .then(data => {
        const versionElement = document.getElementById('version');
        if (versionElement) {
            versionElement.textContent = `v${data.version}`;
        }
    })
    .catch(err => console.warn('Could not fetch version:', err));
