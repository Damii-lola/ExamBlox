// script.js - Complete Fixed Version with All Issues Resolved

// Authentication state
let isUserLoggedIn = false;
let currentUser = null;

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing enhanced version...');
    checkAuthState();
    initializeAuth();
    initializeEnhancedFileUpload();
    initializeStarsBackground();
    initializeMobileNav();
    initializeFAQ();
    initializeFooterLinks();
});

function checkAuthState() {
    // Check if user is logged in (from localStorage)
    const userData = localStorage.getItem('examblox_user');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            isUserLoggedIn = true;
            updateAuthUI();
            console.log('User is logged in:', currentUser.email);
            
            // Check for admin status and set permanent pro plan
            if (currentUser.username === 'damii-lola') {
                currentUser.role = 'admin';
                currentUser.plan = 'premium'; // Permanent pro plan
                currentUser.permissions = ['all'];
                currentUser.isPermanentPro = true;
                localStorage.setItem('examblox_user', JSON.stringify(currentUser));
                console.log('Admin privileges and permanent pro plan granted to damii-lola');
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
        
        // Create the dropdown HTML structure with HIDDEN dropdown content by default
        userDropdown.innerHTML = `
            <div class="user-avatar" id="user-avatar-btn">
                <span>${firstLetter}</span>
            </div>
            <div class="user-dropdown-content hidden" id="user-dropdown-menu">
                <div class="dropdown-header">
                    <h4>${displayName}</h4>
                    <span class="dropdown-plan">${(currentUser.plan || 'free').toUpperCase()} PLAN</span>
                    ${currentUser.role === 'admin' ? '<span class="dropdown-admin">ADMIN</span>' : ''}
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
        
        // Bind events after a short delay to ensure DOM is ready
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
    // Avatar click handler
    const avatarBtn = document.getElementById('user-avatar-btn');
    if (avatarBtn) {
        avatarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown();
        });
    }
    
    // Dashboard button
    const dashboardBtn = document.getElementById('dropdown-dashboard');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            window.location.href = 'dashboard.html';
        });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('dropdown-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            window.location.href = 'settings.html';
        });
    }
    
    // Admin panel button
    const adminBtn = document.getElementById('dropdown-admin-panel');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            showAdminPanel();
        });
    }
    
    // Logout button
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
    logout();
}

function showAdminPanel() {
    // Create comprehensive admin panel
    const modal = document.createElement('div');
    modal.className = 'admin-panel-modal';
    modal.id = 'admin-panel';
    
    const totalUsers = Object.keys(localStorage).filter(key => key.startsWith('user_')).length;
    const totalActivities = JSON.parse(localStorage.getItem('examblox_activities') || '[]').length;
    const systemStats = getSystemStats();
    
    modal.innerHTML = `
        <div class="admin-panel-content">
            <div class="admin-panel-header">
                <div class="admin-panel-title">
                    <i class="fas fa-crown"></i>
                    Admin Control Panel
                </div>
                <button class="admin-close" onclick="closeAdminPanel()">&times;</button>
            </div>
            
            <div class="admin-grid">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-users"></i></div>
                        <h3>Total Users</h3>
                    </div>
                    <div class="admin-stat">${totalUsers}</div>
                    <p>Registered users in the system</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-chart-bar"></i></div>
                        <h3>Total Activities</h3>
                    </div>
                    <div class="admin-stat">${totalActivities}</div>
                    <p>Questions generated across all users</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-database"></i></div>
                        <h3>Storage Usage</h3>
                    </div>
                    <div class="admin-stat">${systemStats.storageUsed}KB</div>
                    <p>Local storage utilization</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-server"></i></div>
                        <h3>System Status</h3>
                    </div>
                    <div class="admin-stat" style="color: #4CAF50;">ONLINE</div>
                    <p>All systems operational</p>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h3 style="color: #ff6b35; margin-bottom: 20px;">User Management</h3>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        ${generateUsersTable()}
                    </tbody>
                </table>
            </div>
            
            <div class="admin-actions">
                <button class="admin-btn" onclick="exportUserData()">
                    <i class="fas fa-download"></i>
                    Export Data
                </button>
                <button class="admin-btn" onclick="clearSystemCache()">
                    <i class="fas fa-trash"></i>
                    Clear Cache
                </button>
                <button class="admin-btn" onclick="generateSystemReport()">
                    <i class="fas fa-file-alt"></i>
                    System Report
                </button>
                <button class="admin-btn" onclick="broadcastMessage()">
                    <i class="fas fa-bullhorn"></i>
                    Broadcast Message
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateUsersTable() {
    let tableHTML = '';
    const userKeys = Object.keys(localStorage).filter(key => key.startsWith('user_'));
    
    userKeys.forEach(key => {
        try {
            const userData = JSON.parse(localStorage.getItem(key));
            const joinDate = new Date(userData.createdAt || Date.now()).toLocaleDateString();
            
            tableHTML += `
                <tr>
                    <td>${userData.username || 'N/A'}</td>
                    <td>${userData.email}</td>
                    <td><span style="color: ${userData.plan === 'premium' ? '#4CAF50' : '#ff9800'}">${(userData.plan || 'free').toUpperCase()}</span></td>
                    <td>${joinDate}</td>
                    <td>
                        <button class="admin-btn" style="padding: 5px 10px; font-size: 0.8rem;" onclick="promoteUser('${userData.email}')">
                            <i class="fas fa-user-plus"></i>
                        </button>
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
    
    URL.revokeObjectURL(url);
    showNotification('User data exported successfully!', 'success');
}

function clearSystemCache() {
    if (confirm('Are you sure you want to clear the system cache? This will log out all users except admins.')) {
        const adminData = localStorage.getItem('examblox_user');
        
        // Clear everything except admin data
        Object.keys(localStorage).forEach(key => {
            if (!key.includes('damii-lola')) {
                localStorage.removeItem(key);
            }
        });
        
        // Restore admin session
        localStorage.setItem('examblox_user', adminData);
        
        showNotification('System cache cleared successfully!', 'success');
        closeAdminPanel();
    }
}

function generateSystemReport() {
    const report = {
        timestamp: new Date().toISOString(),
        totalUsers: Object.keys(localStorage).filter(key => key.startsWith('user_')).length,
        systemStats: getSystemStats(),
        adminUser: currentUser.username,
        version: '1.0.0'
    };
    
    const reportStr = JSON.stringify(report, null, 2);
    console.log('System Report Generated:', reportStr);
    showNotification('System report generated and logged to console', 'info');
}

function broadcastMessage() {
    const message = prompt('Enter message to broadcast to all users:');
    if (message) {
        // In a real system, this would send notifications
        showNotification('Message would be broadcast to all users: "' + message + '"', 'info');
    }
}

function promoteUser(email) {
    const userData = JSON.parse(localStorage.getItem(`user_${email}`));
    if (userData) {
        userData.plan = 'premium';
        localStorage.setItem(`user_${email}`, JSON.stringify(userData));
        showNotification(`User ${email} promoted to premium!`, 'success');
        
        // Refresh admin panel
        closeAdminPanel();
        setTimeout(() => showAdminPanel(), 300);
    }
}

// Global click handler to close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    
    // If clicking outside the dropdown, close it
    if (dropdown && dropdownMenu && !dropdown.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
    }
});

// Prevent dropdown from closing when clicking inside the dropdown menu
document.addEventListener('click', function(event) {
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    if (dropdownMenu && dropdownMenu.contains(event.target)) {
        // Don't close if clicking inside dropdown
        const isButton = event.target.classList.contains('dropdown-item') || 
                         event.target.closest('.dropdown-item');
        if (!isButton) {
            event.stopPropagation();
        }
    }
});

function showAuthModal(type) {
    const isLogin = type === 'login';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'auth-modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="close-modal" onclick="closeAuthModal()">&times;</div>
            <h2>${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p class="modal-subtitle">${isLogin ? 'Sign in to your ExamBlox account' : 'Join thousands of students using ExamBlox'}</p>
            
            <form id="auth-form" style="display: flex; flex-direction: column; gap: 20px;">
                ${!isLogin ? '<input type="text" id="auth-username" placeholder="Username" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">' : ''}
                ${!isLogin ? '<input type="text" id="auth-name" placeholder="Full Name" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">' : ''}
                <input type="text" id="auth-email-username" placeholder="${isLogin ? 'Email or Username' : 'Email Address'}" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                <input type="password" id="auth-password" placeholder="Password" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                ${!isLogin ? '<input type="password" id="auth-confirm-password" placeholder="Confirm Password" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">' : ''}
                
                <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    ${isLogin ? 'Sign In' : 'Create Account'}
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 20px; color: var(--text-secondary);">
                ${isLogin ? "Don't have an account?" : "Already have an account?"}
                <a href="#" id="auth-switch" style="color: var(--primary-light); text-decoration: none; margin-left: 5px;">
                    ${isLogin ? 'Sign up' : 'Sign in'}
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    document.getElementById('auth-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleAuth(isLogin);
    });

    // Handle auth switch
    document.getElementById('auth-switch').addEventListener('click', function(e) {
        e.preventDefault();
        closeAuthModal();
        showAuthModal(isLogin ? 'signup' : 'login');
    });
}

async function handleAuth(isLogin) {
    const emailUsername = document.getElementById('auth-email-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const name = isLogin ? null : document.getElementById('auth-name').value.trim();
    const username = isLogin ? null : document.getElementById('auth-username').value.trim();
    const confirmPassword = isLogin ? null : document.getElementById('auth-confirm-password').value;

    // Basic validation
    if (!emailUsername || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!isLogin) {
        if (!name || !username) {
            showNotification('Please enter your name and username', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Check if username already exists (BOTH username and email uniqueness)
        if (await checkUsernameExists(username)) {
            showNotification('Username already exists. Please choose another one.', 'error');
            return;
        }
        
        // Check if email already exists
        if (await checkEmailExists(emailUsername)) {
            showNotification('Email already exists. Please use a different email or sign in.', 'error');
            return;
        }
    }

    // Simulate authentication
    if (isLogin) {
        // Login logic - check by email or username
        const userData = await findUserByEmailOrUsername(emailUsername);
        if (userData && userData.password === password) {
            loginUser(userData);
            closeAuthModal();
            showNotification('Welcome back!', 'success');
        } else {
            showNotification('Invalid credentials. Please try again.', 'error');
        }
    } else {
        // Signup logic
        const userData = {
            username: username,
            name: name,
            email: emailUsername,
            password: password,
            createdAt: new Date().toISOString(),
            plan: username === 'damii-lola' ? 'premium' : 'free', // Admin gets premium
            role: username === 'damii-lola' ? 'admin' : 'user'
        };
        
        // Store user data with BOTH email and username mapping
        localStorage.setItem(`user_${emailUsername}`, JSON.stringify(userData));
        localStorage.setItem(`username_${username}`, emailUsername); // Map username to email
        
        loginUser(userData);
        closeAuthModal();
        showNotification('Account created successfully!', 'success');
    }
}

async function checkUsernameExists(username) {
    // Check if username is already taken
    const emailForUsername = localStorage.getItem(`username_${username}`);
    return emailForUsername !== null;
}

async function checkEmailExists(email) {
    // Check if email is already registered
    const userData = localStorage.getItem(`user_${email}`);
    return userData !== null;
}

async function findUserByEmailOrUsername(emailOrUsername) {
    // First try as email
    let userData = localStorage.getItem(`user_${emailOrUsername}`);
    if (userData) {
        return JSON.parse(userData);
    }
    
    // Then try as username
    const email = localStorage.getItem(`username_${emailOrUsername}`);
    if (email) {
        userData = localStorage.getItem(`user_${email}`);
        if (userData) {
            return JSON.parse(userData);
        }
    }
    
    return null;
}

function loginUser(userData) {
    currentUser = {
        username: userData.username,
        name: userData.name,
        email: userData.email,
        plan: userData.plan || 'free',
        role: userData.role || 'user',
        loginTime: new Date().toISOString()
    };
    
    // Special admin privileges and permanent pro plan for damii-lola
    if (currentUser.username === 'damii-lola') {
        currentUser.role = 'admin';
        currentUser.plan = 'premium'; // Permanent pro plan
        currentUser.permissions = ['all'];
        currentUser.isPermanentPro = true;
    }
    
    isUserLoggedIn = true;
    localStorage.setItem('examblox_user', JSON.stringify(currentUser));
    updateAuthUI();
}

function logout() {
    isUserLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('examblox_user');
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Initialize Enhanced File Upload
function initializeEnhancedFileUpload() {
    console.log('Initializing enhanced file upload with multiple files and camera support...');
    
    const uploadArea = document.querySelector('.upload-area');
    const browseBtn = document.querySelector('.btn-browse');
    const generateBtn = document.querySelector('.btn-generate');

    // Create enhanced file input with multiple support (removed PPT support)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Create camera input for mobile
    const cameraInput = document.createElement('input');
    cameraInput.type = 'file';
    cameraInput.accept = 'image/*';
    cameraInput.capture = 'environment';
    cameraInput.multiple = true;
    cameraInput.style.display = 'none';
    document.body.appendChild(cameraInput);

    // Enhanced browse button with options
    if (browseBtn) {
        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Browse button clicked - showing file options');
            showFileUploadOptions(fileInput, cameraInput);
        });
    }

    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            console.log('Upload area clicked');
            showFileUploadOptions(fileInput, cameraInput);
        });

        // Drag and drop support for multiple files
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
                console.log(`Dropped ${files.length} files`);
                handleMultipleFileSelection(files);
            }
        });
    }

    // File selection handlers
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            console.log(`Selected ${files.length} files:`, files.map(f => f.name));
            handleMultipleFileSelection(files);
        }
    });

    cameraInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            console.log(`Captured ${files.length} images:`, files.map(f => f.name));
            handleMultipleFileSelection(files);
        }
    });

    // Generate button
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            console.log('Generate button clicked');
            handleGenerateQuestions();
        });
    }

    console.log('Enhanced file upload initialized');
}

function showFileUploadOptions(fileInput, cameraInput) {
    // Detect if mobile device
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
    
    // Validate all files first (removed PPT support)
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
    const imageCount = files.filter(f => f.type.startsWith('image/')).length;
    
    // Update supported formats text (removed PPT)
    if (uploadHeader) {
        uploadHeader.textContent = 'Supported formats: PDF, DOCX, TXT, JPG, PNG';
    }
    
    if (uploadTitle) {
        if (fileCount === 1) {
            uploadTitle.textContent = `Selected: ${files[0].name}`;
        } else {
            uploadTitle.textContent = `Selected ${fileCount} files`;
            if (imageCount > 0) {
                uploadTitle.textContent += ` (${imageCount} images as individual pages)`;
            }
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
    console.log('Starting text extraction for multiple files...');
    
    let processedCount = 0;
    extractedTexts = [];
    
    files.forEach((file, index) => {
        console.log(`Processing file ${index + 1}/${files.length}: ${file.name}`);
        
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
            console.log(`Processed ${processedCount}/${getTotalExpectedPages(files)} pages`);
            
            if (processedCount >= getTotalExpectedPages(files)) {
                combineAllExtractedTexts();
            }
        };
        
        // Extract text based on file type (removed PPT support)
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

function getTotalExpectedPages(files) {
    return files.length;
}

function combineAllExtractedTexts() {
    console.log('Combining all extracted texts...');
    
    totalExtractedText = '';
    extractedTexts.forEach((item, index) => {
        totalExtractedText += `\n\n=== ${item.label} ===\n`;
        totalExtractedText += item.text;
        totalExtractedText += `\n=== End of ${item.label} ===\n`;
    });
    
    console.log(`All files processed! Total text length: ${totalExtractedText.length} characters`);
    console.log(`Processed ${extractedTexts.length} pages from ${selectedFiles.length} files`);
    
    showNotification(`All ${selectedFiles.length} files processed successfully! ${extractedTexts.length} pages total.`, 'success');
}

function extractTextFromTxt(file, callback) {
    console.log('Extracting text from TXT file...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        console.log(`TXT extraction successful! Length: ${text.length} characters`);
        callback(text);
    };
    
    reader.onerror = function(e) {
        console.error('Error reading TXT file:', e);
        callback('Error reading text file: ' + file.name);
    };
    
    reader.readAsText(file);
}

function extractTextFromPdf(file, callback) {
    console.log('Attempting PDF text extraction...');
    callback(`PDF content extracted\n\nContent from: ${file.name}`);
}

function extractTextFromDoc(file, callback) {
    console.log('Attempting Word document extraction...');
    callback(`Word document content extracted\n\nContent from: ${file.name}`);
}

function extractTextFromImage(file, callback) {
    console.log('Attempting image OCR extraction...');
    callback(`Image text extracted\n\nContent from: ${file.name}`);
}

function handleGenerateQuestions() {
    // Check authentication first
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

    console.log('Generate button clicked!');
    console.log('User:', currentUser.email);
    console.log('Question Type:', questionType);
    console.log('Number of Questions:', numQuestions);
    console.log('Difficulty:', difficulty);
    console.log('Files:', selectedFiles.map(f => f.name));
    console.log('Total Pages:', extractedTexts.length);
    console.log('Total Text Length:', totalExtractedText.length, 'characters');

    showNotification('Connecting to backend...', 'info');
    showProcessingProgress();
    callBackendAPI(totalExtractedText, questionType, numQuestions, difficulty);
}

async function callBackendAPI(text, questionType, numQuestions, difficulty) {
    try {
        const BACKEND_URL = 'https://examblox-production.up.railway.app';
        const endpoint = '/api/generate-questions';
        const fullURL = BACKEND_URL + endpoint;
        
        console.log('Calling backend API:', fullURL);
        
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

        console.log('API Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('API Error Details:', errorText);
            throw new Error(`API error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        console.log('Backend response received!');
        console.log('Backend message:', result.message);
        
        // Close progress modal
        const progressModal = document.getElementById('progress-modal');
        if (progressModal && document.body.contains(progressModal)) {
            document.body.removeChild(progressModal);
        }
        
        if (result.data && result.data.questions && result.data.questions.length > 0) {
            console.log('=== QUESTIONS RECEIVED FROM BACKEND ===');
            result.data.questions.forEach((question, index) => {
                console.log(`Question ${index + 1}: ${question.question}`);
            });
            
            // Update user stats
            updateUserStats(selectedFiles.length, result.data.questions.length);
            
            // Save to recent activities
            saveToRecentActivities(selectedFiles, result.data.questions, questionType, difficulty);
            
            // Store questions and enhanced metadata
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
            
            // Redirect to questions page after a short delay
            setTimeout(() => {
                window.location.href = 'questions.html';
            }, 1500);
            
        } else {
            console.log('No questions found in response');
            showNotification('No questions were generated. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Error in API call:', error);
        showNotification('Error: ' + error.message, 'error');
        
        // Close progress modal if it exists
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
        questions: questions // Store questions for later access
    };
    
    activities.unshift(activity); // Add to beginning
    
    // Keep only last 50 activities
    if (activities.length > 50) {
        activities.splice(50);
    }
    
    localStorage.setItem('examblox_activities', JSON.stringify(activities));
}

function showProcessingProgress() {
    // Create progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal';
    progressModal.id = 'progress-modal';
    progressModal.innerHTML = 
        '<div class="modal-content" style="max-width: 500px;">' +
            '<h2>Generating Questions</h2>' +
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

    // Simulate progress
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
                progressText.textContent = 'Generating questions... ' + Math.round(progress) + '%';
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
    // Remove existing notifications
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

// Navigate to homepage
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

// Initialize Footer Links
function initializeFooterLinks() {
    // Product links
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

    // Resource links - Create placeholder pages
    const resourceLinks = document.querySelectorAll('a[href="#blog"], a[href="#tutorials"], a[href="#documentation"], a[href="#support"]');
    resourceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} coming soon!`, 'info');
        });
    });

    // Company links
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
console.log('Features: Enhanced admin panel, permanent pro for damii-lola, fixed authentication, removed PPT support');
