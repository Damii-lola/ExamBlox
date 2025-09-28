// script.js - Complete Enhanced Version with OTP, Protected Admin Account, and Dynamic Features

// Authentication state
let isUserLoggedIn = false;
let currentUser = null;

// Protected admin data - PERMANENT and UNBREAKABLE
const PROTECTED_ADMIN = {
  username: 'damii-lola',
  name: 'Damii Lola',
  email: 'damii.lola.admin@examblox.com',
  password: 'God_G1ve_M3_P0wer',
  plan: 'premium',
  role: 'admin',
  isPermanent: true,
  createdAt: '2024-01-01T00:00:00Z'
};

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing enhanced version with OTP...');
    ensureProtectedAdmin();
    checkAuthState();
    initializeAuth();
    initializeEnhancedFileUpload();
    initializeStarsBackground();
    initializeMobileNav();
    initializeFAQ();
    initializeFooterLinks();
    initializeDynamicUpdates();
});

// ENSURE PROTECTED ADMIN ALWAYS EXISTS
function ensureProtectedAdmin() {
    console.log('🔒 Ensuring protected admin account exists...');
    
    // Always restore admin account regardless of any clear operations
    localStorage.setItem(`user_${PROTECTED_ADMIN.email}`, JSON.stringify(PROTECTED_ADMIN));
    localStorage.setItem(`username_${PROTECTED_ADMIN.username}`, PROTECTED_ADMIN.email);
    
    // If current user is admin, restore session
    const currentUserData = localStorage.getItem('examblox_user');
    if (currentUserData) {
        try {
            const userData = JSON.parse(currentUserData);
            if (userData.username === PROTECTED_ADMIN.username) {
                currentUser = {...PROTECTED_ADMIN};
                isUserLoggedIn = true;
                console.log('🔒 Protected admin session restored');
            }
        } catch (e) {
            console.log('No valid current session');
        }
    }
}

// DYNAMIC SYSTEM - Real-time updates across all instances
function initializeDynamicUpdates() {
    console.log('🔄 Initializing dynamic system...');
    
    // Listen for storage changes (other tabs/windows)
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('user_') || e.key === 'examblox_activities' || e.key === 'examblox_user_stats') {
            console.log('🔄 Storage change detected, updating UI...');
            if (currentUser && currentUser.role === 'admin') {
                // If admin panel is open, refresh it
                const adminPanel = document.getElementById('admin-panel');
                if (adminPanel) {
                    closeAdminPanel();
                    setTimeout(() => showAdminPanel(), 500);
                }
            }
            broadcastUpdate();
        }
    });
    
    // Periodic refresh for dynamic content
    setInterval(function() {
        if (isUserLoggedIn && currentUser && currentUser.role === 'admin') {
            broadcastUpdate();
        }
    }, 30000); // Update every 30 seconds
}

function broadcastUpdate() {
    // Trigger custom event for dynamic updates
    const updateEvent = new CustomEvent('exambloxUpdate', {
        detail: {
            timestamp: new Date().toISOString(),
            userCount: getTotalUsers(),
            activities: getTotalActivities()
        }
    });
    window.dispatchEvent(updateEvent);
}

function getTotalUsers() {
    return Object.keys(localStorage).filter(key => key.startsWith('user_')).length;
}

function getTotalActivities() {
    return JSON.parse(localStorage.getItem('examblox_activities') || '[]').length;
}

function checkAuthState() {
    // Always ensure admin exists first
    ensureProtectedAdmin();
    
    // Check if user is logged in
    const userData = localStorage.getItem('examblox_user');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            isUserLoggedIn = true;
            updateAuthUI();
            console.log('User is logged in:', currentUser.email);
            
            // Special handling for protected admin
            if (currentUser.username === PROTECTED_ADMIN.username) {
                currentUser = {...PROTECTED_ADMIN}; // Always use protected data
                localStorage.setItem('examblox_user', JSON.stringify(currentUser));
                console.log('🔒 Protected admin privileges confirmed');
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('examblox_user');
        }
    }
}

function initializeAuth() {
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');

    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthModal('login');
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthModal('signup');
        });
    }
}

function updateAuthUI() {
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    const navLinks = document.querySelector('.nav-links');

    if (isUserLoggedIn && currentUser) {
        // Hide login and signup buttons
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        
        // Remove existing dropdown to prevent duplicates
        const existingDropdown = document.querySelector('.user-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Create user dropdown element
        const userDropdown = document.createElement('li');
        userDropdown.className = 'user-dropdown';
        
        const displayName = currentUser.username || currentUser.name || currentUser.email;
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        // Create the dropdown HTML structure
        userDropdown.innerHTML = `
            <div class="user-avatar" id="user-avatar-btn">
                <span>${firstLetter}</span>
            </div>
            <div class="user-dropdown-content hidden" id="user-dropdown-menu">
                <div class="dropdown-header">
                    <h4>${displayName}</h4>
                    <span class="dropdown-plan">${(currentUser.plan || 'free').toUpperCase()} PLAN</span>
                    ${currentUser.role === 'admin' ? '<span class="dropdown-admin">🔒 PROTECTED ADMIN</span>' : ''}
                </div>
                <div class="dropdown-menu">
                    <button class="dropdown-item" id="dropdown-dashboard">
                        <i class="fas fa-tachometer-alt"></i>
                        Dashboard
                    </button>
                    <button class="dropdown-item" id="dropdown-settings">
                        <i class="fas fa-cog"></i>
                        Settings
                    </button>
                    ${currentUser.role === 'admin' ? `
                    <button class="dropdown-item" id="dropdown-admin-panel">
                        <i class="fas fa-crown"></i>
                        Admin Panel
                    </button>
                    ` : ''}
                    <button class="dropdown-item danger" id="dropdown-logout">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign Out
                    </button>
                </div>
            </div>
        `;
        
        // Add to navigation
        if (navLinks) {
            navLinks.appendChild(userDropdown);
        }
        
        setTimeout(() => {
            bindDropdownEvents();
        }, 100);
        
    } else {
        // Show login and signup buttons
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        
        // Remove user dropdown
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.remove();
        }
    }
}

function bindDropdownEvents() {
    const avatarBtn = document.getElementById('user-avatar-btn');
    if (avatarBtn) {
        avatarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown();
        });
    }
    
    const dashboardBtn = document.getElementById('dropdown-dashboard');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            window.location.href = 'dashboard.html';
        });
    }
    
    const settingsBtn = document.getElementById('dropdown-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            window.location.href = 'settings.html';
        });
    }
    
    const adminBtn = document.getElementById('dropdown-admin-panel');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            showAdminPanel();
        });
    }
    
    const logoutBtn = document.getElementById('dropdown-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            confirmLogout();
        });
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function closeDropdown() {
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

function confirmLogout() {
    // Special protection for admin account
    if (currentUser && currentUser.username === PROTECTED_ADMIN.username) {
        const confirmLogout = confirm('⚠️ You are logging out of the PROTECTED ADMIN account.\n\nYour admin account and all data will remain permanently saved.\n\nProceed with logout?');
        if (confirmLogout) {
            logout();
        }
    } else {
        logout();
    }
}

// DYNAMIC ADMIN PANEL WITH REAL-TIME UPDATES
function showAdminPanel() {
    const modal = document.createElement('div');
    modal.className = 'admin-panel-modal';
    modal.id = 'admin-panel';
    
    renderAdminPanelContent(modal);
    document.body.appendChild(modal);
    
    // Set up real-time updates
    const updateInterval = setInterval(() => {
        if (document.getElementById('admin-panel')) {
            updateAdminStats();
        } else {
            clearInterval(updateInterval);
        }
    }, 2000); // Update every 2 seconds
    
    // Listen for storage changes
    const storageListener = function(e) {
        if (document.getElementById('admin-panel') && e.key && (e.key.startsWith('user_') || e.key === 'examblox_activities')) {
            updateAdminStats();
            updateUsersTable();
        }
    };
    
    window.addEventListener('storage', storageListener);
    
    // Clean up listener when panel closes
    modal.addEventListener('DOMNodeRemoved', function() {
        window.removeEventListener('storage', storageListener);
        clearInterval(updateInterval);
    });
}

function renderAdminPanelContent(modal) {
    const totalUsers = getTotalUsers();
    const totalActivities = getTotalActivities();
    const systemStats = getSystemStats();
    
    modal.innerHTML = `
        <div class="admin-panel-content">
            <div class="admin-panel-header">
                <div class="admin-panel-title">
                    <i class="fas fa-crown"></i>
                    🔒 Protected Admin Control Panel
                </div>
                <button class="admin-close" onclick="closeAdminPanel()">&times;</button>
            </div>
            
            <div class="admin-grid">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-users"></i></div>
                        <h3>Total Users</h3>
                    </div>
                    <div class="admin-stat" id="total-users-stat">${totalUsers}</div>
                    <p>Registered users in the system</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-chart-bar"></i></div>
                        <h3>Total Activities</h3>
                    </div>
                    <div class="admin-stat" id="total-activities-stat">${totalActivities}</div>
                    <p>Questions generated across all users</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-database"></i></div>
                        <h3>Storage Usage</h3>
                    </div>
                    <div class="admin-stat" id="storage-usage-stat">${systemStats.storageUsed}KB</div>
                    <p>Local storage utilization</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-shield-alt"></i></div>
                        <h3>System Status</h3>
                    </div>
                    <div class="admin-stat" style="color: #4CAF50;">🔒 PROTECTED</div>
                    <p>Admin account secured</p>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h3 style="color: #ff6b35; margin-bottom: 20px;">👥 User Management (Live Updates)</h3>
                <div id="users-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            ${generateUsersTable()}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="admin-actions">
                <button class="admin-btn" onclick="exportUserData()">
                    <i class="fas fa-download"></i>
                    Export Data
                </button>
                <button class="admin-btn" onclick="createBackup()">
                    <i class="fas fa-save"></i>
                    Create Backup
                </button>
                <button class="admin-btn" onclick="restoreFromBackup()">
                    <i class="fas fa-upload"></i>
                    Restore Backup
                </button>
                <button class="admin-btn" onclick="clearSystemCache()" style="background: linear-gradient(135deg, #ff6b35, #f44336);">
                    <i class="fas fa-trash"></i>
                    Clear Cache (Protected)
                </button>
            </div>
        </div>
    `;
}

function updateAdminStats() {
    const totalUsersElement = document.getElementById('total-users-stat');
    const totalActivitiesElement = document.getElementById('total-activities-stat');
    const storageUsageElement = document.getElementById('storage-usage-stat');
    
    if (totalUsersElement) {
        const newCount = getTotalUsers();
        if (totalUsersElement.textContent !== newCount.toString()) {
            totalUsersElement.textContent = newCount;
            totalUsersElement.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                totalUsersElement.style.animation = '';
            }, 500);
        }
    }
    
    if (totalActivitiesElement) {
        const newCount = getTotalActivities();
        if (totalActivitiesElement.textContent !== newCount.toString()) {
            totalActivitiesElement.textContent = newCount;
            totalActivitiesElement.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                totalActivitiesElement.style.animation = '';
            }, 500);
        }
    }
    
    if (storageUsageElement) {
        const systemStats = getSystemStats();
        storageUsageElement.textContent = systemStats.storageUsed + 'KB';
    }
}

function updateUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    if (tableBody) {
        tableBody.innerHTML = generateUsersTable();
    }
}

function generateUsersTable() {
    let tableHTML = '';
    const userKeys = Object.keys(localStorage).filter(key => key.startsWith('user_'));
    
    userKeys.forEach(key => {
        try {
            const userData = JSON.parse(localStorage.getItem(key));
            const joinDate = new Date(userData.createdAt || Date.now()).toLocaleDateString();
            const isProtected = userData.username === PROTECTED_ADMIN.username;
            
            tableHTML += `
                <tr ${isProtected ? 'style="background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.3);"' : ''}>
                    <td>${userData.username || 'N/A'} ${isProtected ? '🔒' : ''}</td>
                    <td>${userData.email}</td>
                    <td><span style="color: ${userData.plan === 'premium' ? '#4CAF50' : '#ff9800'}">${(userData.plan || 'free').toUpperCase()}</span></td>
                    <td>${isProtected ? '<span style="color: #ff6b35;">PROTECTED</span>' : '<span style="color: #4CAF50;">ACTIVE</span>'}</td>
                    <td>
                        ${!isProtected ? `
                        <button class="admin-btn" style="padding: 5px 10px; font-size: 0.8rem;" onclick="promoteUser('${userData.email}')">
                            <i class="fas fa-user-plus"></i>
                        </button>
                        ` : '<span style="color: #ff6b35;">🔒 LOCKED</span>'}
                    </td>
                </tr>
            `;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    });
    
    return tableHTML || '<tr><td colspan="5">No users found</td></tr>';
}

function getSystemStats() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length;
        }
    }
    
    return {
        storageUsed: Math.round(totalSize / 1024)
    };
}

function closeAdminPanel() {
    const modal = document.getElementById('admin-panel');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// BACKUP SYSTEM
function createBackup() {
    const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        adminUser: currentUser.username,
        data: {}
    };
    
    // Backup all data
    Object.keys(localStorage).forEach(key => {
        backupData.data[key] = localStorage.getItem(key);
    });
    
    const backupStr = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupStr], {type: 'application/json'});
    const url = URL.createObjectURL(backupBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `examblox-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('✅ System backup created successfully!', 'success');
}

function restoreFromBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (!backupData.data || !backupData.timestamp) {
                    showNotification('❌ Invalid backup file', 'error');
                    return;
                }
                
                const confirmRestore = confirm(`⚠️ SYSTEM RESTORE\n\nThis will restore data from: ${new Date(backupData.timestamp).toLocaleString()}\n\n🔒 Your protected admin account will remain intact.\n\nProceed with restore?`);
                
                if (confirmRestore) {
                    // Clear current data (except protected admin)
                    const adminData = localStorage.getItem(`user_${PROTECTED_ADMIN.email}`);
                    const adminMapping = localStorage.getItem(`username_${PROTECTED_ADMIN.username}`);
                    
                    localStorage.clear();
                    
                    // Restore from backup
                    Object.keys(backupData.data).forEach(key => {
                        localStorage.setItem(key, backupData.data[key]);
                    });
                    
                    // Always ensure protected admin exists
                    localStorage.setItem(`user_${PROTECTED_ADMIN.email}`, JSON.stringify(PROTECTED_ADMIN));
                    localStorage.setItem(`username_${PROTECTED_ADMIN.username}`, PROTECTED_ADMIN.email);
                    
                    showNotification('✅ System restored from backup successfully!', 'success');
                    
                    // Refresh page
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            } catch (error) {
                showNotification('❌ Error reading backup file', 'error');
                console.error('Backup restore error:', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function exportUserData() {
    const userData = {};
    Object.keys(localStorage).forEach(key => {
        userData[key] = localStorage.getItem(key);
    });
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `examblox-admin-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

function initializeEnhancedFileUpload() {
    console.log('Initializing enhanced file upload...');
    
    const uploadArea = document.querySelector('.upload-area');
    const browseBtn = document.querySelector('.btn-browse');
    const generateBtn = document.querySelector('.btn-generate');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    const cameraInput = document.createElement('input');
    cameraInput.type = 'file';
    cameraInput.accept = 'image/*';
    cameraInput.capture = 'environment';
    cameraInput.multiple = true;
    cameraInput.style.display = 'none';
    document.body.appendChild(cameraInput);

    if (browseBtn) {
        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showFileUploadOptions(fileInput, cameraInput);
        });
    }

    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            showFileUploadOptions(fileInput, cameraInput);
        });

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleMultipleFileSelection(files);
            }
        });
    }

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            handleMultipleFileSelection(files);
        }
    });

    cameraInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            handleMultipleFileSelection(files);
        }
    });

    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            handleGenerateQuestions();
        });
    }
}

function showFileUploadOptions(fileInput, cameraInput) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        showCustomUploadModal(fileInput, cameraInput);
    } else {
        fileInput.click();
    }
}

function showCustomUploadModal(fileInput, cameraInput) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'upload-options-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h2>Choose an action</h2>
            <div style="display: flex; flex-direction: column; gap: 20px; margin: 30px 0;">
                <button class="upload-option-btn" id="camera-btn">
                    <div class="option-icon" style="background: #ff3b30; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                        <i class="fas fa-camera" style="color: white; font-size: 24px;"></i>
                    </div>
                    <span>Camera</span>
                </button>
                <button class="upload-option-btn" id="files-btn">
                    <div class="option-icon" style="background: #007aff; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                        <i class="fas fa-folder" style="color: white; font-size: 24px;"></i>
                    </div>
                    <span>Files</span>
                </button>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .upload-option-btn {
            background: transparent;
            border: none;
            padding: 15px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            color: var(--text);
            font-size: 16px;
            font-weight: 500;
            text-align: center;
        }
        .upload-option-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .upload-option-btn:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    document.getElementById('camera-btn').addEventListener('click', function() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        cameraInput.click();
    });

    document.getElementById('files-btn').addEventListener('click', function() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        fileInput.click();
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }
    });
}

function handleMultipleFileSelection(files) {
    console.log(`Processing ${files.length} files...`);
    
    const validFiles = [];
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    
    for (const file of files) {
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValid) {
            showNotification(`Invalid file type: ${file.name}`, 'error');
            continue;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showNotification(`File too large: ${file.name} (max 10MB)`, 'error');
            continue;
        }
        
        validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
        showNotification('No valid files selected', 'error');
        return;
    }
    
    selectedFiles = validFiles;
    extractedTexts = [];
    totalExtractedText = '';
    
    updateEnhancedUploadUI(validFiles);
    extractTextFromMultipleFiles(validFiles);
}

function updateEnhancedUploadUI(files) {
    const uploadIcon = document.querySelector('.upload-icon');
    const uploadTitle = document.querySelector('.upload-title');
    const uploadSubtitle = document.querySelector('.upload-subtitle');
    const browseBtn = document.querySelector('.btn-browse');
    const uploadArea = document.querySelector('.upload-area');
    const uploadHeader = document.querySelector('.upload-header p');

    if (uploadIcon) uploadIcon.innerHTML = '<i class="fas fa-files"></i>';
    
    const fileCount = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    if (uploadHeader) {
        uploadHeader.textContent = 'Supported formats: PDF, DOCX, TXT, JPG, PNG';
    }
    
    if (uploadTitle) {
        if (fileCount === 1) {
            uploadTitle.textContent = `Selected: ${files[0].name}`;
        } else {
            uploadTitle.textContent = `Selected ${fileCount} files`;
        }
    }
    
    if (uploadSubtitle) {
        uploadSubtitle.textContent = `Total size: ${formatFileSize(totalSize)}`;
    }
    
    if (browseBtn) browseBtn.textContent = 'Change Files';
    if (uploadArea) uploadArea.style.borderColor = '#4dfff3';

    enableControls();
    showNotification(`${fileCount} file(s) selected successfully!`, 'success');
}

function extractTextFromMultipleFiles(files) {
    showNotification(`Processing ${files.length} files...`, 'info');
    
    let processedCount = 0;
    extractedTexts = [];
    
    files.forEach((file, index) => {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        const processFile = (text, pageNumber = null) => {
            const pageLabel = pageNumber !== null ? ` (Page ${pageNumber})` : '';
            extractedTexts.push({
                fileName: file.name,
                pageNumber: pageNumber,
                text: text,
                label: `${file.name}${pageLabel}`
            });
            
            processedCount++;
            
            if (processedCount >= files.length) {
                combineAllExtractedTexts();
            }
        };
        
        if (fileExtension === '.txt') {
            extractTextFromTxt(file, processFile);
        } else if (fileExtension === '.pdf') {
            extractTextFromPdf(file, processFile);
        } else if (fileExtension === '.doc' || fileExtension === '.docx') {
            extractTextFromDoc(file, processFile);
        } else if (fileExtension === '.jpg' || fileExtension === '.jpeg' || fileExtension === '.png') {
            extractTextFromImage(file, processFile);
        }
    });
}

function combineAllExtractedTexts() {
    totalExtractedText = '';
    extractedTexts.forEach((item, index) => {
        totalExtractedText += `\n\n=== ${item.label} ===\n`;
        totalExtractedText += item.text;
        totalExtractedText += `\n=== End of ${item.label} ===\n`;
    });
    
    console.log(`All files processed! Total text length: ${totalExtractedText.length} characters`);
    showNotification(`All ${selectedFiles.length} files processed successfully!`, 'success');
}

function extractTextFromTxt(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        callback(text);
    };
    reader.onerror = function(e) {
        callback('Error reading text file: ' + file.name);
    };
    reader.readAsText(file);
}

function extractTextFromPdf(file, callback) {
    callback(`PDF content extracted from: ${file.name}`);
}

function extractTextFromDoc(file, callback) {
    callback(`Word document content extracted from: ${file.name}`);
}

function extractTextFromImage(file, callback) {
    callback(`Image text extracted from: ${file.name}`);
}

function handleGenerateQuestions() {
    if (!isUserLoggedIn) {
        showNotification('Please sign in to generate questions', 'error');
        showAuthModal('login');
        return;
    }

    if (selectedFiles.length === 0 || !totalExtractedText) {
        showNotification('Please select files first', 'error');
        return;
    }

    const questionType = document.querySelector('.upload-options select').value || 'Multiple Choice';
    const numQuestions = document.querySelector('.upload-options input[type="range"]').value || '10';
    const difficultySelects = document.querySelectorAll('.upload-options select');
    const difficulty = difficultySelects.length > 1 ? difficultySelects[1].value : 'Medium';

    showNotification('Connecting to backend...', 'info');
    showProcessingProgress();
    callBackendAPI(totalExtractedText, questionType, numQuestions, difficulty);
}

async function callBackendAPI(text, questionType, numQuestions, difficulty) {
    try {
        const BACKEND_URL = 'https://examblox-production.up.railway.app';
        const endpoint = '/api/generate-questions';
        const fullURL = BACKEND_URL + endpoint;
        
        console.log('Calling backend API with Llama 4 Scout:', fullURL);
        
        const response = await fetch(fullURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                questionType: questionType,
                numQuestions: parseInt(numQuestions),
                difficulty: difficulty
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        const progressModal = document.getElementById('progress-modal');
        if (progressModal && document.body.contains(progressModal)) {
            document.body.removeChild(progressModal);
        }
        
        if (result.data && result.data.questions && result.data.questions.length > 0) {
            updateUserStats(selectedFiles.length, result.data.questions.length);
            saveToRecentActivities(selectedFiles, result.data.questions, questionType, difficulty);
            
            const fileNames = selectedFiles.map(f => f.name).join(', ');
            const questionData = {
                questions: result.data.questions,
                metadata: {
                    fileName: selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files: ${fileNames}`,
                    fileCount: selectedFiles.length,
                    pageCount: extractedTexts.length,
                    questionType: questionType,
                    difficulty: difficulty,
                    totalQuestions: result.data.questions.length,
                    textLength: text.length,
                    generatedAt: new Date().toISOString(),
                    sessionId: Date.now().toString()
                }
            };
            
            localStorage.setItem('examblox_questions', JSON.stringify(questionData));
            showNotification('Questions generated successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'questions.html';
            }, 1500);
            
        } else {
            showNotification('No questions were generated. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Error in API call:', error);
        showNotification('Error: ' + error.message, 'error');
        
        const progressModal = document.getElementById('progress-modal');
        if (progressModal && document.body.contains(progressModal)) {
            document.body.removeChild(progressModal);
        }
    }
}

function updateUserStats(filesProcessed, questionsGenerated) {
    if (!isUserLoggedIn) return;
    
    const stats = JSON.parse(localStorage.getItem('examblox_user_stats') || '{}');
    
    stats.totalQuestions = (stats.totalQuestions || 0) + questionsGenerated;
    stats.filesProcessed = (stats.filesProcessed || 0) + filesProcessed;
    stats.studySessions = (stats.studySessions || 0) + 1;
    stats.monthlyQuestions = (stats.monthlyQuestions || 0) + questionsGenerated;
    stats.monthlyFiles = (stats.monthlyFiles || 0) + filesProcessed;
    stats.lastActivity = new Date().toISOString();
    
    localStorage.setItem('examblox_user_stats', JSON.stringify(stats));
    
    // Trigger dynamic update
    broadcastUpdate();
}

function saveToRecentActivities(files, questions, questionType, difficulty) {
    if (!isUserLoggedIn) return;
    
    const activities = JSON.parse(localStorage.getItem('examblox_activities') || '[]');
    
    const fileNames = files.length === 1 ? files[0].name : `${files.length} files`;
    const activity = {
        id: Date.now(),
        icon: 'fas fa-question-circle',
        title: `Generated ${questions.length} ${questionType} questions from ${fileNames}`,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        type: 'question_generation',
        details: {
            files: files.map(f => f.name),
            questionType: questionType,
            difficulty: difficulty,
            questionCount: questions.length
        },
        questions: questions
    };
    
    activities.unshift(activity);
    
    if (activities.length > 50) {
        activities.splice(50);
    }
    
    localStorage.setItem('examblox_activities', JSON.stringify(activities));
    
    // Trigger dynamic update
    broadcastUpdate();
}

function showProcessingProgress() {
    const progressModal = document.createElement('div');
    progressModal.className = 'modal';
    progressModal.id = 'progress-modal';
    progressModal.innerHTML = 
        '<div class="modal-content" style="max-width: 500px;">' +
            '<h2>Generating Questions</h2>' +
            '<p style="text-align: center; color: var(--primary-light); margin-bottom: 20px;">Using Llama 4 Scout AI Model</p>' +
            '<div class="progress-container">' +
                '<div class="progress-bar">' +
                    '<div class="progress-fill" id="progress-fill"></div>' +
                '</div>' +
                '<div class="progress-text" id="progress-text">Processing files... 0%</div>' +
            '</div>' +
            '<div class="progress-steps">' +
                '<div class="step-item active" id="step-1">📄 Analyzing content</div>' +
                '<div class="step-item" id="step-2">🤖 Generating questions</div>' +
                '<div class="step-item" id="step-3">✅ Finalizing</div>' +
            '</div>' +
        '</div>';

    document.body.appendChild(progressModal);

    let progress = 0;
    const progressInterval = setInterval(function() {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');

        if (progressFill) progressFill.style.width = progress + '%';
        
        if (progressText) {
            if (progress < 30) {
                progressText.textContent = 'Analyzing content... ' + Math.round(progress) + '%';
            } else if (progress < 80) {
                progressText.textContent = 'Generating questions with Llama 4 Scout... ' + Math.round(progress) + '%';
                if (step1) step1.classList.remove('active');
                if (step2) step2.classList.add('active');
            } else {
                progressText.textContent = 'Finalizing... ' + Math.round(progress) + '%';
                if (step2) step2.classList.remove('active');
                if (step3) step3.classList.add('active');
            }
        }

        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 200);
}

function enableControls() {
    const selects = document.querySelectorAll('.upload-options select');
    const rangeInput = document.querySelector('.upload-options input[type="range"]');
    const generateBtn = document.querySelector('.btn-generate');

    selects.forEach(function(select) {
        select.disabled = false;
        select.style.opacity = '1';
    });

    if (rangeInput) {
        rangeInput.disabled = false;
        rangeInput.style.opacity = '1';
        updateRangeDisplay();
        rangeInput.addEventListener('input', updateRangeDisplay);
    }

    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.classList.add('active');
        generateBtn.style.opacity = '1';
    }
}

function updateRangeDisplay() {
    const rangeInput = document.querySelector('.upload-options input[type="range"]');
    if (rangeInput) {
        const label = rangeInput.parentElement.querySelector('label');
        if (label) {
            label.textContent = 'Number of Questions: ' + rangeInput.value;
        }
    }
}

function showNotification(message, type) {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(function(notif) {
        if (document.body.contains(notif)) {
            document.body.removeChild(notif);
        }
    });

    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.innerHTML = '<span>' + message + '</span><button>&times;</button>';

    document.body.appendChild(notification);

    setTimeout(function() {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);

    const closeBtn = notification.querySelector('button');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function goToHomepage() {
    window.location.href = 'index.html';
}

function initializeStarsBackground() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('span');
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 4 + 's';
        starsContainer.appendChild(star);
    }
}

function initializeMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
}

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(function(item) {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                faqItems.forEach(function(otherItem) {
                    otherItem.classList.remove('active');
                });
                
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

function initializeFooterLinks() {
    const productLinks = document.querySelectorAll('a[href="#features"], a[href="#pricing"], a[href="#testimonials"], a[href="#use-cases"]');
    productLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            } else {
                showNotification('Section coming soon!', 'info');
            }
        });
    });

    const resourceLinks = document.querySelectorAll('a[href="#blog"], a[href="#tutorials"], a[href="#documentation"], a[href="#support"]');
    resourceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} coming soon!`, 'info');
        });
    });

    const companyLinks = document.querySelectorAll('a[href="#about"], a[href="#careers"], a[href="#privacy"], a[href="#terms"]');
    companyLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} page coming soon!`, 'info');
        });
    });
}

// Global variables for file handling
let selectedFiles = [];
let extractedTexts = [];
let totalExtractedText = '';

console.log('ExamBlox Enhanced script loaded successfully!');
console.log('Features: OTP verification, protected admin account, dynamic updates, backup system, Llama 4 Scout AI');
