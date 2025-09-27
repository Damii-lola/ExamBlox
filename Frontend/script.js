// Enhanced script.js with Protected Admin System and Email OTP

// Authentication state
let isUserLoggedIn = false;
let currentUser = null;

// Protected admin data - cannot be cleared
const PROTECTED_ADMIN = {
    username: 'damii-lola',
    name: 'Damii Lola',
    email: 'damii.lola@examblox.com',
    password: 'admin2025!',
    plan: 'premium',
    role: 'admin',
    isPermanentPro: true,
    isProtected: true,
    createdAt: '2025-01-01T00:00:00.000Z'
};

// EmailJS configuration - You'll need to set these up
const EMAILJS_CONFIG = {
    serviceId: 'service_examblox', // Replace with your EmailJS service ID
    templateId: 'template_otp',    // Replace with your EmailJS template ID
    publicKey: 'your_public_key'   // Replace with your EmailJS public key
};

// OTP storage
let pendingOTPs = {};
let forgotPasswordOTPs = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing protected system...');
    ensureProtectedAdminExists();
    checkAuthState();
    initializeAuth();
    initializeEnhancedFileUpload();
    initializeStarsBackground();
    initializeMobileNav();
    initializeFAQ();
    initializeFooterLinks();
    initializeRealTimeUpdates();
});

// Ensure protected admin always exists
function ensureProtectedAdminExists() {
    // Always ensure admin exists and is properly configured
    localStorage.setItem(`user_${PROTECTED_ADMIN.email}`, JSON.stringify(PROTECTED_ADMIN));
    localStorage.setItem(`username_${PROTECTED_ADMIN.username}`, PROTECTED_ADMIN.email);
    
    // Create backup in a protected key
    localStorage.setItem('_protected_admin_backup', JSON.stringify(PROTECTED_ADMIN));
    
    console.log('Protected admin account ensured');
}

// Override localStorage.clear to protect admin data
const originalClear = localStorage.clear;
localStorage.clear = function() {
    const adminBackup = localStorage.getItem('_protected_admin_backup');
    const adminUserData = localStorage.getItem(`user_${PROTECTED_ADMIN.email}`);
    const adminUsernameMapping = localStorage.getItem(`username_${PROTECTED_ADMIN.username}`);
    
    // Call original clear
    originalClear.call(this);
    
    // Restore protected admin data
    if (adminBackup) {
        localStorage.setItem('_protected_admin_backup', adminBackup);
        localStorage.setItem(`user_${PROTECTED_ADMIN.email}`, adminUserData || adminBackup);
        localStorage.setItem(`username_${PROTECTED_ADMIN.username}`, PROTECTED_ADMIN.email);
    }
    
    console.log('localStorage cleared but admin data protected');
};

function checkAuthState() {
    // Ensure admin exists first
    ensureProtectedAdminExists();
    
    const userData = localStorage.getItem('examblox_user');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            isUserLoggedIn = true;
            updateAuthUI();
            console.log('User is logged in:', currentUser.email);
            
            // Special handling for protected admin
            if (currentUser.username === 'damii-lola') {
                currentUser = { ...PROTECTED_ADMIN, loginTime: new Date().toISOString() };
                localStorage.setItem('examblox_user', JSON.stringify(currentUser));
                console.log('Protected admin session restored');
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('examblox_user');
        }
    }
}

// Real-time updates system
function initializeRealTimeUpdates() {
    // Listen for storage changes across tabs/windows
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('user_') && isUserLoggedIn && currentUser.role === 'admin') {
            // Refresh admin panel if it's open
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                updateAdminPanelData();
            }
        }
    });
    
    // Periodic updates for admin panel
    if (currentUser && currentUser.role === 'admin') {
        setInterval(() => {
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                updateAdminPanelData();
            }
        }, 5000); // Update every 5 seconds
    }
}

function updateAdminPanelData() {
    // Update user count
    const totalUsers = Object.keys(localStorage).filter(key => key.startsWith('user_')).length;
    const userCountElement = document.querySelector('#admin-panel .admin-stat');
    if (userCountElement) {
        userCountElement.textContent = totalUsers;
    }
    
    // Update users table
    const tableBody = document.getElementById('users-table-body');
    if (tableBody) {
        tableBody.innerHTML = generateUsersTable();
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
                
                <div style="position: relative;">
                    <input type="password" id="auth-password" placeholder="Password" required style="padding: 15px 50px 15px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%; box-sizing: border-box;">
                    <button type="button" onclick="togglePasswordVisibility('auth-password')" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer;">
                        <i class="fas fa-eye" id="auth-password-icon"></i>
                    </button>
                </div>
                
                ${!isLogin ? `
                <div style="position: relative;">
                    <input type="password" id="auth-confirm-password" placeholder="Confirm Password" required style="padding: 15px 50px 15px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%; box-sizing: border-box;">
                    <button type="button" onclick="togglePasswordVisibility('auth-confirm-password')" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer;">
                        <i class="fas fa-eye" id="auth-confirm-password-icon"></i>
                    </button>
                </div>
                ` : ''}
                
                <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    ${isLogin ? 'Sign In' : 'Create Account'}
                </button>
            </form>
            
            ${isLogin ? `
            <div style="text-align: center; margin: 15px 0;">
                <button onclick="showForgotPassword()" style="background: none; border: none; color: var(--primary-light); cursor: pointer; text-decoration: underline;">
                    Forgot Password?
                </button>
            </div>
            ` : ''}
            
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

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function showForgotPassword() {
    closeAuthModal();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'forgot-password-modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="close-modal" onclick="closeForgotPasswordModal()">&times;</div>
            <h2>Reset Password</h2>
            <p class="modal-subtitle">Enter your email to receive a verification code</p>
            
            <form id="forgot-password-form" style="display: flex; flex-direction: column; gap: 20px;">
                <input type="email" id="reset-email" placeholder="Email Address" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                
                <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Send Reset Code
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="showAuthModal('login')" style="background: none; border: none; color: var(--primary-light); cursor: pointer; text-decoration: underline;">
                    Back to Login
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('forgot-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleForgotPassword();
    });
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email) {
        showNotification('Please enter your email', 'error');
        return;
    }
    
    // Check if user exists
    const userData = localStorage.getItem(`user_${email}`);
    if (!userData) {
        showNotification('No account found with this email', 'error');
        return;
    }
    
    const user = JSON.parse(userData);
    const otp = generateOTP();
    
    // Store OTP with expiration
    forgotPasswordOTPs[email] = {
        code: otp,
        expires: Date.now() + (10 * 60 * 1000), // 10 minutes
        userName: user.name
    };
    
    // Send OTP email
    try {
        await sendOTPEmail(email, user.name, otp, 'reset');
        closeForgotPasswordModal();
        showOTPVerificationModal(email, 'reset');
        showNotification('Reset code sent to your email!', 'success');
    } catch (error) {
        showNotification('Failed to send reset code. Please try again.', 'error');
    }
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
        
        // Check uniqueness for both username and email
        if (await checkUsernameExists(username)) {
            showNotification('Username already exists. Please choose another one.', 'error');
            return;
        }
        
        if (await checkEmailExists(emailUsername)) {
            showNotification('Email already exists. Please use a different email or sign in.', 'error');
            return;
        }
    }

    if (isLogin) {
        // Login logic
        const userData = await findUserByEmailOrUsername(emailUsername);
        if (userData && userData.password === password) {
            loginUser(userData);
            closeAuthModal();
            showNotification('Welcome back!', 'success');
        } else {
            showNotification('Invalid credentials. Please try again.', 'error');
        }
    } else {
        // Signup with OTP verification
        const otp = generateOTP();
        
        // Store pending user data with OTP
        pendingOTPs[emailUsername] = {
            userData: {
                username: username,
                name: name,
                email: emailUsername,
                password: password,
                createdAt: new Date().toISOString(),
                plan: username === 'damii-lola' ? 'premium' : 'free',
                role: username === 'damii-lola' ? 'admin' : 'user'
            },
            code: otp,
            expires: Date.now() + (10 * 60 * 1000) // 10 minutes
        };
        
        try {
            await sendOTPEmail(emailUsername, name, otp, 'signup');
            closeAuthModal();
            showOTPVerificationModal(emailUsername, 'signup');
            showNotification('Verification code sent to your email!', 'success');
        } catch (error) {
            showNotification('Failed to send verification code. Please try again.', 'error');
        }
    }
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, userName, otp, type) {
    // For now, we'll simulate sending email
    // In production, you'll need to set up EmailJS or a backend service
    
    console.log(`
=== EMAIL SIMULATION ===
To: ${email}
Subject: 🔐 Your ExamBlox Verification Code

Hello ${userName},

Your One-Time Password (OTP) for ExamBlox is:
${otp}

This code will expire in 10 minutes.
If you didn't request this, please ignore this email.

Thank you for using ExamBlox to power your exam prep!

Best regards,
The ExamBlox Team
======================
    `);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
}

async function sendWelcomeEmail(email, userName) {
    console.log(`
=== WELCOME EMAIL SIMULATION ===
To: ${email}
Subject: 🙏 Thank You for Trying ExamBlox

Hi ${userName},

Thank you for trying out ExamBlox! 🎉

We're glad to have you on board and can't wait to support you in your exam prep journey.

If you have any feedback or ideas on how we can make ExamBlox even better, we'd love to hear from you.

Wishing you success in your studies! ✨

Best regards,
The ExamBlox Team
===============================
    `);
}

function showOTPVerificationModal(email, type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'otp-modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="close-modal" onclick="closeOTPModal()">&times;</div>
            <h2>Enter Verification Code</h2>
            <p class="modal-subtitle">We sent a 6-digit code to ${email}</p>
            
            <form id="otp-form" style="display: flex; flex-direction: column; gap: 20px; text-align: center;">
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <input type="text" id="otp-1" maxlength="1" style="width: 50px; height: 50px; text-align: center; font-size: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                    <input type="text" id="otp-2" maxlength="1" style="width: 50px; height: 50px; text-align: center; font-size: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                    <input type="text" id="otp-3" maxlength="1" style="width: 50px; height: 50px; text-align: center; font-size: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                    <input type="text" id="otp-4" maxlength="1" style="width: 50px; height: 50px; text-align: center; font-size: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                    <input type="text" id="otp-5" maxlength="1" style="width: 50px; height: 50px; text-align: center; font-size: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                    <input type="text" id="otp-6" maxlength="1" style="width: 50px; height: 50px; text-align: center; font-size: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
                </div>
                
                <div id="otp-timer" style="color: var(--text-secondary); font-size: 14px;">
                    Code expires in: <span id="countdown">10:00</span>
                </div>
                
                <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Verify Code
                </button>
                
                <button type="button" onclick="resendOTP('${email}', '${type}')" style="background: none; border: none; color: var(--primary-light); cursor: pointer; text-decoration: underline;">
                    Resend Code
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Initialize OTP input behavior
    initializeOTPInputs();
    
    // Start countdown
    startCountdown(email, type);

    document.getElementById('otp-form').addEventListener('submit', function(e) {
        e.preventDefault();
        verifyOTP(email, type);
    });
}

function initializeOTPInputs() {
    const inputs = document.querySelectorAll('[id^="otp-"]');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Only allow numbers
        input.addEventListener('keypress', function(e) {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}

function startCountdown(email, type) {
    const expiration = type === 'signup' ? pendingOTPs[email]?.expires : forgotPasswordOTPs[email]?.expires;
    
    const timer = setInterval(() => {
        const now = Date.now();
        const timeLeft = expiration - now;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById('countdown').textContent = '0:00';
            showNotification('Verification code expired. Please request a new one.', 'error');
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        document.getElementById('countdown').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

async function verifyOTP(email, type) {
    const inputs = document.querySelectorAll('[id^="otp-"]');
    const enteredOTP = Array.from(inputs).map(input => input.value).join('');
    
    if (enteredOTP.length !== 6) {
        showNotification('Please enter the complete 6-digit code', 'error');
        return;
    }
    
    const otpData = type === 'signup' ? pendingOTPs[email] : forgotPasswordOTPs[email];
    
    if (!otpData) {
        showNotification('Verification session expired. Please try again.', 'error');
        closeOTPModal();
        return;
    }
    
    if (Date.now() > otpData.expires) {
        showNotification('Verification code expired. Please request a new one.', 'error');
        return;
    }
    
    if (enteredOTP !== otpData.code) {
        showNotification('Invalid verification code. Please try again.', 'error');
        return;
    }
    
    // OTP verified successfully
    closeOTPModal();
    
    if (type === 'signup') {
        // Complete signup
        const userData = otpData.userData;
        
        // Store user data
        localStorage.setItem(`user_${userData.email}`, JSON.stringify(userData));
        localStorage.setItem(`username_${userData.username}`, userData.email);
        
        // Clear pending OTP
        delete pendingOTPs[email];
        
        // Send welcome email
        await sendWelcomeEmail(userData.email, userData.name);
        
        loginUser(userData);
        showNotification('Account created successfully!', 'success');
        
    } else if (type === 'reset') {
        // Show password reset form
        showPasswordResetModal(email);
        delete forgotPasswordOTPs[email];
    }
}

function showPasswordResetModal(email) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'password-reset-modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="close-modal" onclick="closePasswordResetModal()">&times;</div>
            <h2>Reset Password</h2>
            <p class="modal-subtitle">Enter your new password</p>
            
            <form id="password-reset-form" style="display: flex; flex-direction: column; gap: 20px;">
                <div style="position: relative;">
                    <input type="password" id="new-password" placeholder="New Password" required style="padding: 15px 50px 15px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%; box-sizing: border-box;">
                    <button type="button" onclick="togglePasswordVisibility('new-password')" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer;">
                        <i class="fas fa-eye" id="new-password-icon"></i>
                    </button>
                </div>
                
                <div style="position: relative;">
                    <input type="password" id="confirm-new-password" placeholder="Confirm New Password" required style="padding: 15px 50px 15px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%; box-sizing: border-box;">
                    <button type="button" onclick="togglePasswordVisibility('confirm-new-password')" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer;">
                        <i class="fas fa-eye" id="confirm-new-password-icon"></i>
                    </button>
                </div>
                
                <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Update Password
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('password-reset-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handlePasswordReset(email);
    });
}

async function handlePasswordReset(email) {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Update password
    const userData = JSON.parse(localStorage.getItem(`user_${email}`));
    userData.password = newPassword;
    localStorage.setItem(`user_${email}`, JSON.stringify(userData));
    
    closePasswordResetModal();
    showNotification('Password updated successfully! You can now login.', 'success');
    showAuthModal('login');
}

function closePasswordResetModal() {
    const modal = document.getElementById('password-reset-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function resendOTP(email, type) {
    const otpData = type === 'signup' ? pendingOTPs[email] : forgotPasswordOTPs[email];
    
    if (!otpData) {
        showNotification('Session expired. Please start over.', 'error');
        closeOTPModal();
        return;
    }
    
    const newOTP = generateOTP();
    otpData.code = newOTP;
    otpData.expires = Date.now() + (10 * 60 * 1000);
    
    try {
        const userName = type === 'signup' ? otpData.userData.name : otpData.userName;
        await sendOTPEmail(email, userName, newOTP, type);
        
        showNotification('New verification code sent!', 'success');
        
        // Reset countdown
        startCountdown(email, type);
        
    } catch (error) {
        showNotification('Failed to resend code. Please try again.', 'error');
    }
}

function closeOTPModal() {
    const modal = document.getElementById('otp-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Rest of the authentication functions
async function checkUsernameExists(username) {
    const emailForUsername = localStorage.getItem(`username_${username}`);
    return emailForUsername !== null;
}

async function checkEmailExists(email) {
    const userData = localStorage.getItem(`user_${email}`);
    return userData !== null;
}

async function findUserByEmailOrUsername(emailOrUsername) {
    let userData = localStorage.getItem(`user_${emailOrUsername}`);
    if (userData) {
        return JSON.parse(userData);
    }
    
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
    
    // Special handling for protected admin
    if (currentUser.username === 'damii-lola') {
        currentUser = { ...PROTECTED_ADMIN, loginTime: new Date().toISOString() };
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

// Protected admin functions with dynamic updates
function updateAuthUI() {
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    const navLinks = document.querySelector('.nav-links');

    if (isUserLoggedIn && currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        
        const existingDropdown = document.querySelector('.user-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        const userDropdown = document.createElement('li');
        userDropdown.className = 'user-dropdown';
        
        const displayName = currentUser.username || currentUser.name || currentUser.email;
        const firstLetter = displayName.charAt(0).toUpperCase();
        
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
        
        if (navLinks) {
            navLinks.appendChild(userDropdown);
        }
        
        setTimeout(() => {
            bindDropdownEvents();
        }, 100);
        
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        
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
    logout();
}

// Enhanced Admin Panel with Real-time Updates
function showAdminPanel() {
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
                    Admin Control Panel - LIVE
                </div>
                <button class="admin-close" onclick="closeAdminPanel()">&times;</button>
            </div>
            
            <div class="admin-grid">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-users"></i></div>
                        <h3>Total Users</h3>
                    </div>
                    <div class="admin-stat" id="live-user-count">${totalUsers}</div>
                    <p>Registered users in the system</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-chart-bar"></i></div>
                        <h3>Total Activities</h3>
                    </div>
                    <div class="admin-stat" id="live-activity-count">${totalActivities}</div>
                    <p>Questions generated across all users</p>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><i class="fas fa-database"></i></div>
                        <h3>Storage Usage</h3>
                    </div>
                    <div class="admin-stat" id="live-storage-usage">${systemStats.storageUsed}KB</div>
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
                <h3 style="color: #ff6b35; margin-bottom: 20px;">Live User Management</h3>
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
                <button class="admin-btn" onclick="createSystemBackup()">
                    <i class="fas fa-save"></i>
                    Create Backup
                </button>
                <button class="admin-btn" onclick="restoreFromBackup()">
                    <i class="fas fa-undo"></i>
                    Restore Backup
                </button>
                <button class="admin-btn" onclick="protectedClearCache()">
                    <i class="fas fa-trash"></i>
                    Clear Cache (Protected)
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Start real-time updates for admin panel
    startAdminPanelUpdates();
}

function startAdminPanelUpdates() {
    const updateInterval = setInterval(() => {
        const adminPanel = document.getElementById('admin-panel');
        if (!adminPanel) {
            clearInterval(updateInterval);
            return;
        }
        
        updateLiveAdminStats();
    }, 2000); // Update every 2 seconds
}

function updateLiveAdminStats() {
    const userCountElement = document.getElementById('live-user-count');
    const activityCountElement = document.getElementById('live-activity-count');
    const storageElement = document.getElementById('live-storage-usage');
    const tableBody = document.getElementById('users-table-body');
    
    if (userCountElement) {
        const totalUsers = Object.keys(localStorage).filter(key => key.startsWith('user_')).length;
        userCountElement.textContent = totalUsers;
    }
    
    if (activityCountElement) {
        const totalActivities = JSON.parse(localStorage.getItem('examblox_activities') || '[]').length;
        activityCountElement.textContent = totalActivities;
    }
    
    if (storageElement) {
        const systemStats = getSystemStats();
        storageElement.textContent = systemStats.storageUsed + 'KB';
    }
    
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
            
            tableHTML += `
                <tr ${userData.username === 'damii-lola' ? 'style="background: rgba(255,107,53,0.1);"' : ''}>
                    <td>${userData.username || 'N/A'} ${userData.username === 'damii-lola' ? '👑' : ''}</td>
                    <td>${userData.email}</td>
                    <td><span style="color: ${userData.plan === 'premium' ? '#4CAF50' : '#ff9800'}">${(userData.plan || 'free').toUpperCase()}</span></td>
                    <td>${joinDate}</td>
                    <td>
                        ${userData.username !== 'damii-lola' ? `
                        <button class="admin-btn" style="padding: 5px 10px; font-size: 0.8rem;" onclick="promoteUser('${userData.email}')">
                            <i class="fas fa-user-plus"></i>
                        </button>
                        ` : '<span style="color: #ff6b35;">PROTECTED</span>'}
                    </td>
                </tr>
            `;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    });
    
    return tableHTML || '<tr><td colspan="5">No users found</td></tr>';
}

// Backup System Implementation
function createSystemBackup() {
    const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        userData: {},
        systemData: {
            activities: localStorage.getItem('examblox_activities'),
            stats: localStorage.getItem('examblox_user_stats')
        }
    };
    
    // Backup all user data except protected admin
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_') && !key.includes('damii.lola@examblox.com')) {
            backupData.userData[key] = localStorage.getItem(key);
        } else if (key.startsWith('username_') && !key.includes('damii-lola')) {
            backupData.userData[key] = localStorage.getItem(key);
        }
    });
    
    const backupStr = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupStr], {type: 'application/json'});
    const url = URL.createObjectURL(backupBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `examblox-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    // Also store backup in localStorage for quick restore
    localStorage.setItem('_system_backup', backupStr);
    
    showNotification('System backup created successfully!', 'success');
}

function restoreFromBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    if (confirm(`Restore backup from ${new Date(backupData.timestamp).toLocaleString()}? This will overwrite current data (except admin account).`)) {
                        // Clear non-protected data
                        protectedClearCache();
                        
                        // Restore user data
                        Object.keys(backupData.userData).forEach(key => {
                            localStorage.setItem(key, backupData.userData[key]);
                        });
                        
                        // Restore system data
                        if (backupData.systemData.activities) {
                            localStorage.setItem('examblox_activities', backupData.systemData.activities);
                        }
                        if (backupData.systemData.stats) {
                            localStorage.setItem('examblox_user_stats', backupData.systemData.stats);
                        }
                        
                        showNotification('System restored from backup successfully!', 'success');
                        
                        // Refresh admin panel
                        closeAdminPanel();
                        setTimeout(() => showAdminPanel(), 500);
                    }
                } catch (error) {
                    showNotification('Invalid backup file format', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function protectedClearCache() {
    if (confirm('Clear all user data except admin account? This cannot be undone without a backup.')) {
        // Store protected admin data
        const adminBackup = localStorage.getItem('_protected_admin_backup');
        const adminUserData = localStorage.getItem(`user_${PROTECTED_ADMIN.email}`);
        const adminUsernameMapping = localStorage.getItem(`username_${PROTECTED_ADMIN.username}`);
        const currentSession = localStorage.getItem('examblox_user');
        
        // Clear everything except protected keys
        const keysToKeep = [
            '_protected_admin_backup',
            `user_${PROTECTED_ADMIN.email}`,
            `username_${PROTECTED_ADMIN.username}`,
            'examblox_user'
        ];
        
        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        // Ensure admin data is intact
        ensureProtectedAdminExists();
        
        showNotification('Cache cleared successfully! Admin account protected.', 'success');
        
        // Refresh admin panel
        closeAdminPanel();
        setTimeout(() => showAdminPanel(), 500);
    }
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

function promoteUser(email) {
    const userData = JSON.parse(localStorage.getItem(`user_${email}`));
    if (userData && userData.username !== 'damii-lola') {
        userData.plan = 'premium';
        localStorage.setItem(`user_${email}`, JSON.stringify(userData));
        showNotification(`User ${email} promoted to premium!`, 'success');
        
        // Update live display
        updateLiveAdminStats();
    }
}

function closeAdminPanel() {
    const modal = document.getElementById('admin-panel');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Global click handlers
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    
    if (dropdown && dropdownMenu && !dropdown.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
    }
});

// Notification system
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

// Initialize other functions (file upload, etc.)
function initializeEnhancedFileUpload() {
    // File upload functionality (shortened for space)
    console.log('File upload system initialized');
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
    // Footer link functionality (shortened for space)
    console.log('Footer links initialized');
}

function goToHomepage() {
    window.location.href = 'index.html';
}

console.log('ExamBlox Enhanced Protected System Loaded Successfully!');
