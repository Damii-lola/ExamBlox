// auth.js - Simplified Global Authentication System for ExamBlox

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.checkAuthState();
        this.setupEventListeners();
        this.updateNavigation();
        
        // Listen for storage changes across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'examblox_user') {
                this.checkAuthState();
                this.updateNavigation();
            }
        });
    }

    checkAuthState() {
        const userData = localStorage.getItem('examblox_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
                console.log('User logged in:', this.currentUser.email);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('examblox_user');
                this.currentUser = null;
                this.isLoggedIn = false;
            }
        } else {
            this.currentUser = null;
            this.isLoggedIn = false;
        }
    }

    setupEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindButtons());
        } else {
            this.bindButtons();
        }
    }

    bindButtons() {
        const loginBtn = document.querySelector('.btn-login');
        const signupBtn = document.querySelector('.btn-signup');

        if (loginBtn) {
            // Remove any existing listeners
            loginBtn.replaceWith(loginBtn.cloneNode(true));
            const newLoginBtn = document.querySelector('.btn-login');
            
            newLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isLoggedIn) {
                    window.location.href = 'dashboard.html';
                } else {
                    this.showAuthModal('login');
                }
            });
        }

        if (signupBtn) {
            // Remove any existing listeners
            signupBtn.replaceWith(signupBtn.cloneNode(true));
            const newSignupBtn = document.querySelector('.btn-signup');
            
            newSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isLoggedIn) {
                    window.location.href = 'dashboard.html';
                } else {
                    this.showAuthModal('signup');
                }
            });
        }

        // Bind other buttons
        this.bindOtherButtons();
    }

    bindOtherButtons() {
        const ctaBtn = document.querySelector('.btn-cta');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.isLoggedIn) {
                    this.showAuthModal('signup');
                } else {
                    const uploadArea = document.querySelector('.upload-area');
                    if (uploadArea) {
                        uploadArea.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        }

        const pricingBtns = document.querySelectorAll('.btn-pricing');
        pricingBtns.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (index === 0) {
                    if (!this.isLoggedIn) {
                        this.showAuthModal('signup');
                    } else {
                        this.showNotification('You are already on the Free plan!', 'info');
                    }
                } else if (index === 1) {
                    this.showNotification('Premium plan upgrade coming soon!', 'info');
                } else {
                    this.showNotification('Contact sales feature coming soon!', 'info');
                }
            });
        });
    }

    updateNavigation() {
        const loginBtn = document.querySelector('.btn-login');
        const signupBtn = document.querySelector('.btn-signup');
        const navLinks = document.querySelector('.nav-links');

        if (this.isLoggedIn && this.currentUser && navLinks) {
            // Hide login/signup buttons
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
        // Remove existing avatar
        const existingAvatar = document.querySelector('.user-avatar');
        if (existingAvatar) {
            existingAvatar.remove();
        }

        if (!this.currentUser || !this.currentUser.name) return;

        // Get first letter of name
        const avatarLetter = this.currentUser.name.charAt(0).toUpperCase();
        
        // Truncate long names for display
        const displayName = this.currentUser.name.length > 10 
            ? this.currentUser.name.substring(0, 10) + '...'
            : this.currentUser.name;

        // Create avatar element
        const avatarElement = document.createElement('li');
        avatarElement.className = 'user-avatar';
        avatarElement.innerHTML = `
            <div class="avatar-container">
                <div class="avatar-circle">${avatarLetter}</div>
                <span class="avatar-label">${displayName}</span>
                <div class="avatar-dropdown">
                    <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a href="#" onclick="authManager.logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;

        container.appendChild(avatarElement);

        // Add click handler for dropdown
        const avatarContainer = avatarElement.querySelector('.avatar-container');
        avatarContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarContainer.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            avatarContainer.classList.remove('active');
        });
    }

    login(userData) {
        this.currentUser = {
            name: userData.name,
            email: userData.email,
            plan: userData.plan || 'free',
            loginTime: new Date().toISOString()
        };
        
        this.isLoggedIn = true;
        localStorage.setItem('examblox_user', JSON.stringify(this.currentUser));
        
        this.updateNavigation();
        this.showNotification('Welcome back!', 'success');
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('examblox_user');
        
        this.updateNavigation();
        this.showNotification('Logged out successfully', 'success');
        
        // Redirect to home if on dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    showAuthModal(type) {
        const isLogin = type === 'login';
        
        // Remove existing modal
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'auth-modal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="close-modal">&times;</div>
                <h2>${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p class="modal-subtitle">${isLogin ? 'Sign in to your ExamBlox account' : 'Join thousands of students using ExamBlox'}</p>
                
                <form id="auth-form">
                    ${!isLogin ? '<input type="text" id="auth-name" placeholder="Full Name" required>' : ''}
                    <input type="email" id="auth-email" placeholder="Email Address" required>
                    <input type="password" id="auth-password" placeholder="Password" required>
                    ${!isLogin ? '<input type="password" id="auth-confirm-password" placeholder="Confirm Password" required>' : ''}
                    <button type="submit">${isLogin ? 'Sign In' : 'Create Account'}</button>
                </form>
                
                <div class="auth-switch-container">
                    ${isLogin ? "Don't have an account?" : "Already have an account?"}
                    <a href="#" id="auth-switch">${isLogin ? 'Sign up' : 'Sign in'}</a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => this.closeAuthModal());

        const authForm = document.getElementById('auth-form');
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth(isLogin);
        });

        const switchBtn = document.getElementById('auth-switch');
        switchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeAuthModal();
            this.showAuthModal(isLogin ? 'signup' : 'login');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeAuthModal();
            }
        });
    }

    handleAuth(isLogin) {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const name = isLogin ? null : document.getElementById('auth-name').value.trim();
        const confirmPassword = isLogin ? null : document.getElementById('auth-confirm-password').value;

        if (!email || !password || (!isLogin && !name)) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        if (isLogin) {
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
            }
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.remove();
        }
    }

    showNotification(message, type) {
        const existing = document.querySelectorAll('.notification');
        existing.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `<span>${message}</span><button>&times;</button>`;

        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);

        const closeBtn = notification.querySelector('button');
        closeBtn.addEventListener('click', () => notification.remove());
    }
}

// Initialize auth manager when script loads
const authManager = new AuthManager();
window.authManager = authManager;
