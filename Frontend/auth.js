// auth.js - Global Authentication System for ExamBlox

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.rememberUser = true; // Always remember user
        this.init();
    }

    init() {
        this.checkAuthState();
        this.setupGlobalAuth();
        this.updateAllPages();
    }

    checkAuthState() {
        // Check for persisted user session
        const userData = localStorage.getItem('examblox_user');
        const sessionData = sessionStorage.getItem('examblox_session');
        
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
                this.refreshSession();
                console.log('User automatically logged in:', this.currentUser.email);
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.clearAuthData();
            }
        }
    }

    refreshSession() {
        // Update session timestamp
        const sessionData = {
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        sessionStorage.setItem('examblox_session', JSON.stringify(sessionData));
    }

    login(userData) {
        this.currentUser = {
            name: userData.name,
            email: userData.email,
            plan: userData.plan || 'free',
            loginTime: new Date().toISOString(),
            avatar: this.generateAvatar(userData.name)
        };
        
        this.isLoggedIn = true;
        
        // Persist user data
        localStorage.setItem('examblox_user', JSON.stringify(this.currentUser));
        this.refreshSession();
        
        // Update all pages
        this.updateAllPages();
        this.showNotification('Welcome back!', 'success');
        
        // Dispatch global auth event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isLoggedIn: true, user: this.currentUser }
        }));
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        
        // Clear all auth data
        this.clearAuthData();
        
        // Update all pages
        this.updateAllPages();
        this.showNotification('Logged out successfully', 'success');
        
        // Dispatch global auth event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isLoggedIn: false, user: null }
        }));
    }

    clearAuthData() {
        localStorage.removeItem('examblox_user');
        sessionStorage.removeItem('examblox_session');
        
        // Clear user-specific data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('stats_') || key.startsWith('activities_') || key.startsWith('user_')) {
                // Keep user data but clear session
            }
        });
    }

    generateAvatar(name) {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    }

    setupGlobalAuth() {
        // Listen for auth state changes across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'examblox_user') {
                if (e.newValue) {
                    // User logged in from another tab
                    this.currentUser = JSON.parse(e.newValue);
                    this.isLoggedIn = true;
                } else {
                    // User logged out from another tab
                    this.currentUser = null;
                    this.isLoggedIn = false;
                }
                this.updateAllPages();
            }
        });

        // Update activity timestamp on page interaction
        ['click', 'keypress', 'scroll'].forEach(event => {
            document.addEventListener(event, () => {
                if (this.isLoggedIn) {
                    this.updateLastActivity();
                }
            });
        });
    }

    updateLastActivity() {
        const sessionData = JSON.parse(sessionStorage.getItem('examblox_session') || '{}');
        sessionData.lastActivity = new Date().toISOString();
        sessionStorage.setItem('examblox_session', JSON.stringify(sessionData));
    }

    updateAllPages() {
        this.updateNavigation();
        this.updateUserElements();
    }

    updateNavigation() {
        const loginBtn = document.querySelector('.btn-login');
        const signupBtn = document.querySelector('.btn-signup');
        const navLinks = document.querySelector('.nav-links');

        if (this.isLoggedIn && this.currentUser) {
            // Remove login/signup buttons and add avatar
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            
            // Add or update user avatar
            this.addUserAvatar(navLinks);
        } else {
            // Show login/signup buttons
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
                loginBtn.textContent = 'Login';
            }
            if (signupBtn) {
                signupBtn.style.display = 'inline-block';
                signupBtn.textContent = 'Sign Up';
            }
            
            // Remove user avatar
            const existingAvatar = document.querySelector('.user-avatar');
            if (existingAvatar) {
                existingAvatar.remove();
            }
        }
    }

    addUserAvatar(container) {
        if (!container || !this.currentUser) return;

        // Remove existing avatar
        const existingAvatar = document.querySelector('.user-avatar');
        if (existingAvatar) {
            existingAvatar.remove();
        }

        // Create new avatar
        const avatarElement = document.createElement('li');
        avatarElement.className = 'user-avatar';
        avatarElement.innerHTML = `
            <div class="avatar-container" title="${this.currentUser.name}">
                <div class="avatar-circle">${this.currentUser.avatar}</div>
                <span class="avatar-label">${this.currentUser.name}</span>
                <div class="avatar-dropdown">
                    <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a href="#" onclick="authManager.showProfile()"><i class="fas fa-user"></i> Profile</a>
                    <a href="#" onclick="authManager.logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;

        container.appendChild(avatarElement);

        // Add click event for dropdown
        const avatarContainer = avatarElement.querySelector('.avatar-container');
        avatarContainer.addEventListener('click', function(e) {
            e.stopPropagation();
            avatarContainer.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            avatarContainer.classList.remove('active');
        });
    }

    updateUserElements() {
        // Update any user-specific elements on the page
        const userNameElements = document.querySelectorAll('[data-user-name]');
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        const userPlanElements = document.querySelectorAll('[data-user-plan]');

        if (this.isLoggedIn && this.currentUser) {
            userNameElements.forEach(el => el.textContent = this.currentUser.name);
            userEmailElements.forEach(el => el.textContent = this.currentUser.email);
            userPlanElements.forEach(el => el.textContent = this.currentUser.plan.toUpperCase());
        }
    }

    showAuthModal(type) {
        const isLogin = type === 'login';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'auth-modal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="close-modal" onclick="authManager.closeAuthModal()">&times;</div>
                <h2>${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p class="modal-subtitle">${isLogin ? 'Sign in to your ExamBlox account' : 'Join thousands of students using ExamBlox'}</p>
                
                <form id="auth-form" style="display: flex; flex-direction: column; gap: 20px;">
                    ${!isLogin ? '<input type="text" id="auth-name" placeholder="Full Name" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">' : ''}
                    <input type="email" id="auth-email" placeholder="Email Address" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
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
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth(isLogin);
        });

        // Handle auth switch
        document.getElementById('auth-switch').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeAuthModal();
            this.showAuthModal(isLogin ? 'signup' : 'login');
        });
    }

    handleAuth(isLogin) {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = isLogin ? null : document.getElementById('auth-name').value;
        const confirmPassword = isLogin ? null : document.getElementById('auth-confirm-password').value;

        // Basic validation
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!isLogin) {
            if (!name) {
                this.showNotification('Please enter your name', 'error');
                return;
            }
            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
            if (password.length < 6) {
                this.showNotification('Password must be at least 6 characters', 'error');
                return;
            }
        }

        if (isLogin) {
            // Login logic
            const existingUser = localStorage.getItem(`user_${email}`);
            if (existingUser) {
                const userData = JSON.parse(existingUser);
                if (userData.password === password) {
                    this.login(userData);
                    this.closeAuthModal();
                } else {
                    this.showNotification('Invalid email or password', 'error');
                }
            } else {
                this.showNotification('Account not found. Please sign up first.', 'error');
            }
        } else {
            // Signup logic
            const existingUser = localStorage.getItem(`user_${email}`);
            if (existingUser) {
                this.showNotification('Account already exists. Please sign in.', 'error');
            } else {
                const userData = {
                    name: name,
                    email: email,
                    password: password,
                    createdAt: new Date().toISOString(),
                    plan: 'free'
                };
                
                localStorage.setItem(`user_${email}`, JSON.stringify(userData));
                this.login(userData);
                this.closeAuthModal();
                this.showNotification('Account created successfully!', 'success');
            }
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }

    showProfile() {
        this.showNotification('Profile page coming soon!', 'info');
    }

    showNotification(message, type) {
        const existing = document.querySelectorAll('.notification');
        existing.forEach(notif => {
            if (document.body.contains(notif)) {
                document.body.removeChild(notif);
            }
        });

        const notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.innerHTML = '<span>' + message + '</span><button>&times;</button>';

        document.body.appendChild(notification);

        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);

        const closeBtn = notification.querySelector('button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            });
        }
    }
}

// Initialize global auth manager
const authManager = new AuthManager();

// Make it globally available
window.authManager = authManager;
