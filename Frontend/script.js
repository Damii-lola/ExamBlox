// script.js - FIXED with Forgot Password & File Processing
let isUserLoggedIn = false;
let currentUser = null;

const BACKEND_URL = 'https://examblox-production.up.railway.app';

const PROTECTED_ADMIN = {
  username: 'damii-lola',
  name: 'Damilola',
  email: 'examblox.team@gmail.com',
  password: 'God_G1ve_M3_P0wer',
  plan: 'premium',
  role: 'admin',
  isPermanent: true
};

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
  return response.json();
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
  console.log('ExamBlox initialized - File Processing Fixed');
  checkAuthState();
  initializeAuth();
  initializeEnhancedFileUpload();
  initializeStarsBackground();
  initializeMobileNav();
  initializeFAQ();
  initializeFooterLinks();
});

function checkAuthState() {
  const userData = localStorage.getItem('examblox_user');
  if (userData) {
    try {
      currentUser = JSON.parse(userData);
      isUserLoggedIn = true;
      updateAuthUI();
      
      if (currentUser.username === PROTECTED_ADMIN.username) {
        currentUser = {...PROTECTED_ADMIN};
        localStorage.setItem('examblox_user', JSON.stringify(currentUser));
      }
    } catch (error) {
      localStorage.removeItem('examblox_user');
      isUserLoggedIn = false;
      currentUser = null;
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
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) existingDropdown.remove();
    
    const userDropdown = document.createElement('li');
    userDropdown.className = 'user-dropdown';
    
    const displayName = currentUser.username || currentUser.name || currentUser.email;
    const firstLetter = displayName.charAt(0).toUpperCase();
    
    userDropdown.innerHTML = `
      <div class="user-avatar" id="user-avatar-btn">
        <span>${firstLetter}</span>
      </div>
      <div class="user-dropdown-content hidden" id="user-dropdown-menu">
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
    
    if (navLinks) navLinks.appendChild(userDropdown);
    setTimeout(() => bindDropdownEvents(), 100);
    
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signupBtn) signupBtn.style.display = 'inline-block';
    
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown) userDropdown.remove();
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
  if (dropdown) dropdown.classList.toggle('hidden');
}

function closeDropdown() {
  const dropdown = document.getElementById('user-dropdown-menu');
  if (dropdown) dropdown.classList.add('hidden');
}

document.addEventListener('click', function(event) {
  const dropdown = document.querySelector('.user-dropdown');
  const dropdownMenu = document.getElementById('user-dropdown-menu');
  if (dropdown && dropdownMenu && !dropdown.contains(event.target)) {
    dropdownMenu.classList.add('hidden');
  }
});

function confirmLogout() {
  if (currentUser && currentUser.username === PROTECTED_ADMIN.username) {
    const confirmLogout = confirm('You are logging out of the PROTECTED ADMIN account.\n\nYour admin account and all data will remain permanently saved.\n\nProceed with logout?');
    if (confirmLogout) logout();
  } else {
    logout();
  }
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
  if (currentUser.username === PROTECTED_ADMIN.username) {
    currentUser = {...PROTECTED_ADMIN};
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

// ===== AUTH MODALS WITH FORGOT PASSWORD =====
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
          <input type="password" id="auth-password" placeholder="Password" required style="padding: 15px; padding-right: 50px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%;">
          <button type="button" id="toggle-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary-light); cursor: pointer; font-size: 16px;">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        
        ${!isLogin ? `
        <div style="position: relative;">
          <input type="password" id="auth-confirm-password" placeholder="Confirm Password" required style="padding: 15px; padding-right: 50px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%;">
          <button type="button" id="toggle-confirm-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary-light); cursor: pointer; font-size: 16px;">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        ` : ''}
        
        ${isLogin ? '<div style="text-align: right;"><a href="#" id="forgot-password" style="color: var(--primary-light); text-decoration: none; font-size: 0.9rem;">Forgot Password?</a></div>' : ''}
        
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

  setupPasswordToggle('auth-password', 'toggle-password');
  if (!isLogin) {
    setupPasswordToggle('auth-confirm-password', 'toggle-confirm-password');
  }

  // ✅ FORGOT PASSWORD LINK
  if (isLogin) {
    document.getElementById('forgot-password').addEventListener('click', function(e) {
      e.preventDefault();
      closeAuthModal();
      showForgotPasswordModal();
    });
  }

  document.getElementById('auth-form').addEventListener('submit', function(e) {
    e.preventDefault();
    handleAuth(isLogin);
  });

  document.getElementById('auth-switch').addEventListener('click', function(e) {
    e.preventDefault();
    closeAuthModal();
    showAuthModal(isLogin ? 'signup' : 'login');
  });
}

// ===== FORGOT PASSWORD MODAL =====
function showForgotPasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'forgot-password-modal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="close-modal" onclick="closeForgotPasswordModal()">&times;</div>
      <h2>Reset Password</h2>
      <p class="modal-subtitle">Enter your email to receive a verification code</p>
      
      <form id="forgot-password-form" style="display: flex; flex-direction: column; gap: 20px;">
        <input type="email" id="forgot-email" placeholder="Email Address" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text);">
        
        <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Send Reset Code
        </button>
      </form>
      
      <div style="text-align: center; margin-top: 20px; color: var(--text-secondary);">
        <a href="#" id="back-to-login" style="color: var(--primary-light); text-decoration: none;">
          Back to Login
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('forgot-password-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    
    if (!email) {
      showNotification('Please enter your email', 'error');
      return;
    }
    
    // Check if user exists
    try {
      const result = await apiCall('/api/users');
      const userExists = result.users && result.users.some(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!userExists) {
        showNotification('No account found with this email', 'error');
        return;
      }
      
      const user = result.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      closeForgotPasswordModal();
      showPasswordResetOTPModal(email, user.name || 'User');
      
    } catch (error) {
      showNotification('Error checking email. Please try again.', 'error');
    }
  });

  document.getElementById('back-to-login').addEventListener('click', function(e) {
    e.preventDefault();
    closeForgotPasswordModal();
    showAuthModal('login');
  });
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) document.body.removeChild(modal);
}

// ===== PASSWORD RESET OTP MODAL =====
function showPasswordResetOTPModal(email, name) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'password-reset-otp-modal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="close-modal" onclick="closePasswordResetOTPModal()">&times;</div>
      <h2>Enter Reset Code</h2>
      <p class="modal-subtitle">We've sent a 6-digit code to ${email}</p>
      
      <form id="password-reset-otp-form" style="display: flex; flex-direction: column; gap: 20px;">
        <input type="text" id="reset-otp" placeholder="Enter 6-digit code" maxlength="6" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); text-align: center; font-size: 18px; letter-spacing: 2px;">
        
        <div style="position: relative;">
          <input type="password" id="new-password" placeholder="New Password" required style="padding: 15px; padding-right: 50px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%;">
          <button type="button" id="toggle-new-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary-light); cursor: pointer; font-size: 16px;">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        
        <div style="position: relative;">
          <input type="password" id="confirm-new-password" placeholder="Confirm New Password" required style="padding: 15px; padding-right: 50px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); width: 100%;">
          <button type="button" id="toggle-confirm-new-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary-light); cursor: pointer; font-size: 16px;">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        
        <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Reset Password
        </button>
      </form>
      
      <div style="text-align: center; margin-top: 20px; color: var(--text-secondary);">
        <a href="#" id="resend-reset-code" style="color: var(--primary-light); text-decoration: none;">
          Resend Code
        </a>
      </div>
      
      <div style="background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 8px; padding: 10px; margin-top: 15px; text-align: center;">
        <small style="color: var(--warning);">Code expires in 10 minutes</small>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  setupPasswordToggle('new-password', 'toggle-new-password');
  setupPasswordToggle('confirm-new-password', 'toggle-confirm-new-password');
  
  sendPasswordResetOTP(email, name);

  document.getElementById('password-reset-otp-form').addEventListener('submit', function(e) {
    e.preventDefault();
    verifyPasswordResetOTP(email);
  });

  document.getElementById('resend-reset-code').addEventListener('click', function(e) {
    e.preventDefault();
    sendPasswordResetOTP(email, name);
  });
}

async function sendPasswordResetOTP(email, name) {
  try {
    showNotification('Sending reset code...', 'info');

    const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
        name: name,
        type: 'forgot_password'
      })
    });

    const result = await response.json();

    if (result.success) {
      showNotification('Reset code sent to your email!', 'success');
    } else {
      showNotification(result.message || 'Failed to send reset code', 'error');
    }
  } catch (error) {
    console.error('Error sending reset code:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

async function verifyPasswordResetOTP(email) {
  const otp = document.getElementById('reset-otp').value.trim();
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-new-password').value;

  if (!otp || otp.length !== 6) {
    showNotification('Please enter a valid 6-digit code', 'error');
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  try {
    showNotification('Verifying code...', 'info');

    const verifyResponse = await fetch(`${BACKEND_URL}/api/verify-otp`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: email, otp: otp})
    });

    const verifyResult = await verifyResponse.json();

    if (verifyResult.success) {
      const resetResponse = await fetch(`${BACKEND_URL}/api/reset-password`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email, newPassword: newPassword})
      });

      const resetResult = await resetResponse.json();

      if (resetResult.success) {
        closePasswordResetOTPModal();
        showNotification('Password reset successfully! You can now log in.', 'success');
        setTimeout(() => showAuthModal('login'), 1500);
      } else {
        showNotification(resetResult.error || 'Failed to reset password', 'error');
      }
    } else {
      showNotification(verifyResult.error || 'Invalid or expired code', 'error');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

function closePasswordResetOTPModal() {
  const modal = document.getElementById('password-reset-otp-modal');
  if (modal) document.body.removeChild(modal);
}

function setupPasswordToggle(inputId, buttonId) {
  const passwordInput = document.getElementById(inputId);
  const toggleButton = document.getElementById(buttonId);
  
  if (passwordInput && toggleButton) {
    toggleButton.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      const icon = toggleButton.querySelector('i');
      icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
  }
}

async function handleAuth(isLogin) {
  const emailUsername = document.getElementById('auth-email-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = isLogin ? null : document.getElementById('auth-name').value.trim();
  const username = isLogin ? null : document.getElementById('auth-username').value.trim();
  const confirmPassword = isLogin ? null : document.getElementById('auth-confirm-password').value;

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
    
    try {
      const result = await apiCall('/api/users');
      const usernameExists = result.users && result.users.some(u => u.username.toLowerCase() === username.toLowerCase());
      const emailExists = result.users && result.users.some(u => u.email.toLowerCase() === emailUsername.toLowerCase());
      
      if (usernameExists) {
        showNotification('Username already exists', 'error');
        return;
      }
      
      if (emailExists) {
        showNotification('Email already exists', 'error');
        return;
      }
    } catch (error) {
      console.error('Error checking existing users:', error);
    }
    
    closeAuthModal();
    showSignupOTPModal(username, name, emailUsername, password);
  } else {
    try {
      const result = await apiCall('/api/login', 'POST', { 
        emailOrUsername: emailUsername, 
        password: password 
      });
      
      if (result.success && result.user) {
        loginUser(result.user);
        closeAuthModal();
        showNotification('Welcome back!', 'success');
      } else {
        showNotification(result.error || 'Invalid credentials', 'error');
      }
    } catch (error) {
      showNotification('Login failed. Please try again.', 'error');
    }
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) document.body.removeChild(modal);
}

// ===== SIGNUP OTP MODAL =====
function showSignupOTPModal(username, name, email, password) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'signup-otp-modal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="close-modal" onclick="closeSignupOTPModal()">&times;</div>
      <h2>Verify Your Email</h2>
      <p class="modal-subtitle">We've sent a 6-digit code to ${email}</p>
      
      <form id="signup-otp-form" style="display: flex; flex-direction: column; gap: 20px;">
        <input type="text" id="signup-otp" placeholder="Enter 6-digit code" maxlength="6" required style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(21,19,32,0.8); color: var(--text); text-align: center; font-size: 18px; letter-spacing: 2px;">
        
        <button type="submit" style="background: linear-gradient(90deg, var(--primary-light), var(--primary)); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Verify & Create Account
        </button>
      </form>
      
      <div style="text-align: center; margin-top: 20px; color: var(--text-secondary);">
        <a href="#" id="resend-signup-code" style="color: var(--primary-light); text-decoration: none; margin-right: 15px;">
          Resend Code
        </a>
        <a href="#" id="back-to-signup" style="color: var(--primary-light); text-decoration: none;">
          Back to Sign Up
        </a>
      </div>
      
      <div style="background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 8px; padding: 10px; margin-top: 15px; text-align: center;">
        <small style="color: var(--warning);">Code expires in 10 minutes</small>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  sendSignupOTP(email, name);

  document.getElementById('signup-otp-form').addEventListener('submit', function(e) {
    e.preventDefault();
    verifySignupOTP(username, name, email, password);
  });

  document.getElementById('resend-signup-code').addEventListener('click', function(e) {
    e.preventDefault();
    sendSignupOTP(email, name);
  });

  document.getElementById('back-to-signup').addEventListener('click', function(e) {
    e.preventDefault();
    closeSignupOTPModal();
    showAuthModal('signup');
  });
}

async function sendSignupOTP(email, name) {
  try {
    showNotification('Sending verification code...', 'info');

    const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
        name: name,
        type: 'signup'
      })
    });

    const result = await response.json();

    if (result.success) {
      showNotification('Verification code sent to your email!', 'success');
    } else {
      showNotification(result.message || 'Failed to send verification code', 'error');
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    showNotification('Network error. Please check your connection.', 'error');
  }
}

async function verifySignupOTP(username, name, email, password) {
  const otp = document.getElementById('signup-otp').value.trim();

  if (!otp || otp.length !== 6) {
    showNotification('Please enter a valid 6-digit code', 'error');
    return;
  }

  try {
    showNotification('Verifying code...', 'info');

    const verifyResponse = await fetch(`${BACKEND_URL}/api/verify-otp`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: email, otp: otp})
    });

    const verifyResult = await verifyResponse.json();

    if (verifyResult.success) {
      const createResult = await apiCall('/api/users', 'POST', {
        username, name, email, password, plan: 'free', role: 'user'
      });
      
      if (createResult.success) {
        closeSignupOTPModal();
        loginUser(createResult.user);
        showNotification('Account created successfully! Welcome to ExamBlox!', 'success');
      } else {
        showNotification(createResult.error || 'Failed to create account', 'error');
      }
    } else {
      showNotification(verifyResult.message || 'Invalid or expired code', 'error');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

function closeSignupOTPModal() {
  const modal = document.getElementById('signup-otp-modal');
  if (modal) document.body.removeChild(modal);
}

// ===== FILE UPLOAD - ✅ FIXED =====
let selectedFiles = [];
let extractedTexts = [];
let totalExtractedText = '';

function initializeEnhancedFileUpload() {
  const uploadArea = document.querySelector('.upload-area');
  const browseBtn = document.querySelector('.btn-browse');
  const generateBtn = document.querySelector('.btn-generate');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  if (browseBtn) {
    browseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      fileInput.click();
    });
  }
  
  if (uploadArea) {
    uploadArea.addEventListener('click', function(e) {
      e.preventDefault();
      fileInput.click();
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
      if (files.length > 0) handleMultipleFileSelection(files);
    });
  }
  
  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) handleMultipleFileSelection(Array.from(e.target.files));
  });
  
  if (generateBtn) {
    generateBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleGenerateQuestions();
    });
  }
}

function handleMultipleFileSelection(files) {
  const validFiles = [];
  const validExts = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
  
  const maxFileSize = (currentUser && currentUser.plan === 'premium') ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
  const maxFileSizeText = (currentUser && currentUser.plan === 'premium') ? '25MB' : '5MB';
  
  for (const file of files) {
    const fileName = file.name.toLowerCase();
    if (!validExts.some(ext => fileName.endsWith(ext))) {
      showNotification(`Invalid file: ${file.name}`, 'error');
      continue;
    }
    if (file.size > maxFileSize) {
      showNotification(`File too large: ${file.name}. Max size is ${maxFileSizeText}`, 'error');
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
  
  if (uploadIcon) uploadIcon.innerHTML = '<i class="fas fa-files"></i>';
  
  const fileCount = files.length;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  
  if (uploadTitle) {
    uploadTitle.textContent = fileCount === 1 ? `Selected: ${files[0].name}` : `Selected ${fileCount} files`;
  }
  if (uploadSubtitle) uploadSubtitle.textContent = `Total size: ${formatFileSize(totalSize)}`;
  if (browseBtn) browseBtn.textContent = 'Change Files';
  if (uploadArea) uploadArea.style.borderColor = '#4dfff3';
  
  enableControls();
  showNotification(`${fileCount} file(s) selected!`, 'success');
}

// ✅ FIXED FILE EXTRACTION
function extractTextFromMultipleFiles(files) {
  showNotification(`Processing ${files.length} files...`, 'info');
  let processedCount = 0;
  extractedTexts = [];
  
  files.forEach(file => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        let extractedText = '';
        
        // For text files - direct read
        if (file.name.toLowerCase().endsWith('.txt')) {
          extractedText = e.target.result;
          console.log(`✅ Extracted ${extractedText.length} chars from ${file.name}`);
        } 
        // For other files - send to backend
        else {
          const fileData = e.target.result.split(',')[1]; // Get base64 data
          const response = await fetch(`${BACKEND_URL}/api/extract-text`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              fileData: fileData,
              fileName: file.name,
              mimeType: file.type
            })
          });
          
          const result = await response.json();
          if (result.success) {
            extractedText = result.text;
            console.log(`✅ Backend extracted ${extractedText.length} chars from ${file.name}`);
          } else {
            extractedText = `[Error processing ${file.name}]`;
            console.error(`❌ Backend error for ${file.name}`);
          }
        }
        
        extractedTexts.push({
          fileName: file.name,
          text: extractedText,
          label: file.name
        });
        
        processedCount++;
        if (processedCount >= files.length) {
          combineAllExtractedTexts();
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error);
        extractedTexts.push({
          fileName: file.name,
          text: `[Error reading ${file.name}]`,
          label: file.name
        });
        processedCount++;
        if (processedCount >= files.length) {
          combineAllExtractedTexts();
        }
      }
    };
    
    reader.onerror = () => {
      console.error(`❌ FileReader error for ${file.name}`);
      extractedTexts.push({
        fileName: file.name,
        text: `[Error reading ${file.name}]`,
        label: file.name
      });
      processedCount++;
      if (processedCount >= files.length) {
        combineAllExtractedTexts();
      }
    };
    
    // Read as text for .txt, as data URL for others
    if (file.name.toLowerCase().endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

function combineAllExtractedTexts() {
  totalExtractedText = '';
  extractedTexts.forEach(item => {
    totalExtractedText += `\n\n=== ${item.label} ===\n${item.text}\n=== End of ${item.label} ===\n`;
  });
  console.log(`✅ Combined text length: ${totalExtractedText.length} characters`);
  showNotification(`All ${selectedFiles.length} files processed!`, 'success');
}

function handleGenerateQuestions() {
  if (!isUserLoggedIn) {
    showNotification('Please sign in first', 'error');
    showAuthModal('login');
    return;
  }
  
  if (!selectedFiles || selectedFiles.length === 0 || !totalExtractedText || totalExtractedText.trim().length < 50) {
    showNotification('Please select valid files with text content', 'error');
    return;
  }
  
  const questionTypeSelect = document.querySelector('.upload-options select');
  const numQuestionsRange = document.querySelector('.upload-options input[type="range"]');
  const difficultySelects = document.querySelectorAll('.upload-options select');
  const questionType = questionTypeSelect ? questionTypeSelect.value : 'Multiple Choice';
  const numQuestions = numQuestionsRange ? numQuestionsRange.value : '10';
  const difficulty = difficultySelects.length > 1 ? difficultySelects[1].value : 'Medium';
  
  showNotification('Connecting to backend...', 'info');
  showProcessingProgress();
  callBackendAPI(totalExtractedText, questionType, numQuestions, difficulty);
}

async function callBackendAPI(text, questionType, numQuestions, difficulty) {
  try {
    const userPlan = (currentUser && currentUser.plan) || 'free';
    
    const response = await fetch(`${BACKEND_URL}/api/generate-questions`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify({
        text: text, 
        questionType: questionType, 
        numQuestions: parseInt(numQuestions), 
        difficulty: difficulty,
        userPlan: userPlan
      })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const result = await response.json();
    
    const progressModal = document.getElementById('progress-modal');
    if (progressModal) document.body.removeChild(progressModal);
    
    if (result.data && result.data.questions && result.data.questions.length > 0) {
      const questionData = {
        questions: result.data.questions,
        metadata: {
          fileName: selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files`,
          fileCount: selectedFiles.length,
          questionType: questionType,
          difficulty: difficulty,
          totalQuestions: result.data.questions.length,
          generatedAt: new Date().toISOString()
        }
      };
      
      localStorage.setItem('examblox_questions', JSON.stringify(questionData));
      saveActivityToDashboard(questionData, selectedFiles, questionType, numQuestions, difficulty);
      showNotification('Questions generated! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'questions.html', 1500);
    } else {
      showNotification('No questions generated. Try again.', 'error');
    }
  } catch (error) {
    console.error('API error:', error);
    showNotification('Error: ' + error.message, 'error');
    const progressModal = document.getElementById('progress-modal');
    if (progressModal) document.body.removeChild(progressModal);
  }
}

function saveActivityToDashboard(questionData, selectedFiles, questionType, numQuestions, difficulty) {
  if (!isUserLoggedIn) return;
  
  const activities = JSON.parse(localStorage.getItem('examblox_activities') || '[]');
  
  const activity = {
    id: Date.now(),
    title: `Generated ${numQuestions} ${questionType} Questions`,
    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    icon: 'fas fa-file-alt',
    questions: questionData.questions,
    details: {
      files: selectedFiles.map(f => f.name),
      questionType: questionType,
      difficulty: difficulty,
      totalQuestions: questionData.questions.length
    }
  };
  
  activities.unshift(activity);
  if (activities.length > 50) activities.splice(50);
  
  localStorage.setItem('examblox_activities', JSON.stringify(activities));
  
  const userStats = JSON.parse(localStorage.getItem('examblox_user_stats') || '{}');
  userStats.totalQuestions = (userStats.totalQuestions || 0) + questionData.questions.length;
  userStats.filesProcessed = (userStats.filesProcessed || 0) + selectedFiles.length;
  userStats.studySessions = (userStats.studySessions || 0) + 1;
  userStats.monthlyQuestions = (userStats.monthlyQuestions || 0) + questionData.questions.length;
  userStats.monthlyFiles = (userStats.monthlyFiles || 0) + selectedFiles.length;
  
  localStorage.setItem('examblox_user_stats', JSON.stringify(userStats));
}

function showProcessingProgress() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'progress-modal';
  modal.innerHTML = `<div class="modal-content" style="max-width: 500px;">
    <h2>Generating Questions</h2>
    <p style="text-align: center; color: var(--primary-light); margin-bottom: 20px;">Using AI Model</p>
    <div class="progress-container">
      <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
      <div class="progress-text" id="progress-text">Processing... 0%</div>
    </div>
    <div class="progress-steps">
      <div class="step-item active" id="step-1">Analyzing</div>
      <div class="step-item" id="step-2">Generating</div>
      <div class="step-item" id="step-3">Finalizing</div>
    </div>
  </div>`;
  document.body.appendChild(modal);
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    if (fill) fill.style.width = progress + '%';
    if (text) {
      if (progress < 30) {
        text.textContent = 'Analyzing... ' + Math.round(progress) + '%';
      } else if (progress < 80) {
        text.textContent = 'Generating questions... ' + Math.round(progress) + '%';
        document.getElementById('step-1').classList.remove('active');
        document.getElementById('step-2').classList.add('active');
      } else {
        text.textContent = 'Finalizing... ' + Math.round(progress) + '%';
        document.getElementById('step-2').classList.remove('active');
        document.getElementById('step-3').classList.add('active');
      }
    }
    if (progress >= 100) clearInterval(interval);
  }, 200);
}

function enableControls() {
  document.querySelectorAll('.upload-options select').forEach(s => {
    s.disabled = false;
    s.style.opacity = '1';
  });
  const range = document.querySelector('.upload-options input[type="range"]');
  if (range) {
    range.disabled = false;
    range.style.opacity = '1';
    updateRangeDisplay();
    range.addEventListener('input', updateRangeDisplay);
  }
  const btn = document.querySelector('.btn-generate');
  if (btn) {
    btn.disabled = false;
    btn.classList.add('active');
    btn.style.opacity = '1';
  }
}

function updateRangeDisplay() {
  const range = document.querySelector('.upload-options input[type="range"]');
  if (range) {
    const label = range.parentElement.querySelector('label');
    if (label) label.textContent = 'Number of Questions: ' + range.value;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== ADMIN PANEL =====
async function showAdminPanel() {
  const modal = document.createElement('div');
  modal.className = 'admin-panel-modal';
  modal.id = 'admin-panel';
  await renderAdminPanelContent(modal);
  document.body.appendChild(modal);
}

async function renderAdminPanelContent(modal) {
  const totalUsers = await getTotalUsers();
  const totalActivities = await getTotalActivities();
  const systemStats = getSystemStats();
  
  modal.innerHTML = `
    <div class="admin-panel-content">
      <div class="admin-panel-header">
        <div class="admin-panel-title"><i class="fas fa-crown"></i>Protected Admin Control Panel</div>
        <button class="admin-close" onclick="closeAdminPanel()">&times;</button>
      </div>
      <div class="admin-grid">
        <div class="admin-card">
          <div class="admin-card-header"><div class="admin-card-icon"><i class="fas fa-users"></i></div><h3>Total Users</h3></div>
          <div class="admin-stat" id="total-users-stat">${totalUsers}</div>
          <p>Registered users (Supabase)</p>
        </div>
        <div class="admin-card">
          <div class="admin-card-header"><div class="admin-card-icon"><i class="fas fa-chart-bar"></i></div><h3>Total Activities</h3></div>
          <div class="admin-stat" id="total-activities-stat">${totalActivities}</div>
          <p>Questions generated</p>
        </div>
        <div class="admin-card">
          <div class="admin-card-header"><div class="admin-card-icon"><i class="fas fa-database"></i></div><h3>Storage</h3></div>
          <div class="admin-stat" id="storage-usage-stat">${systemStats.storageUsed}KB</div>
          <p>Local cache usage</p>
        </div>
        <div class="admin-card">
          <div class="admin-card-header"><div class="admin-card-icon"><i class="fas fa-shield-alt"></i></div><h3>System Status</h3></div>
          <div class="admin-stat" style="color: #4CAF50;">SYNCED</div>
          <p>Cloud database active</p>
        </div>
      </div>
      <div style="margin-top: 30px;">
        <h3 style="color: #ff6b35; margin-bottom: 20px;">User Management</h3>
        <table class="admin-table">
          <thead><tr><th>Username</th><th>Email</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="users-table-body">${await generateUsersTable()}</tbody>
        </table>
      </div>
      <div class="admin-actions">
        <button class="admin-btn" onclick="exportUserData()"><i class="fas fa-download"></i>Export Data</button>
        <button class="admin-btn" onclick="createBackup()"><i class="fas fa-save"></i>Create Backup</button>
      </div>
    </div>
  `;
}

async function generateUsersTable() {
  let html = '';
  try {
    const result = await apiCall('/api/users');
    const users = result.users || [];
    
    if (users.length === 0) {
      return '<tr><td colspan="5">No users found</td></tr>';
    }
    
    users.forEach(u => {
      const isProtected = u.username === PROTECTED_ADMIN.username;
      const normalizedEmail = u.email.toLowerCase();
      
      html += `<tr ${isProtected ? 'style="background: rgba(255,107,53,0.1);"' : ''}>
        <td>${u.username || 'N/A'} ${isProtected ? '🔒' : ''}</td>
        <td>${u.email}</td>
        <td><span style="color: ${u.plan === 'premium' ? '#4CAF50' : '#ff9800'}">${(u.plan || 'free').toUpperCase()}</span></td>
        <td>${isProtected ? '<span style="color: #ff6b35;">PROTECTED</span>' : '<span style="color: #4CAF50;">ACTIVE</span>'}</td>
        <td>
          ${!isProtected ? `
            ${u.plan === 'free' ? 
              `<button class="admin-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #4CAF50;" onclick="promoteUser('${normalizedEmail}')"><i class="fas fa-arrow-up"></i> Promote</button>` 
              : 
              `<button class="admin-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #ff9800;" onclick="demoteUser('${normalizedEmail}')"><i class="fas fa-arrow-down"></i> Demote</button>`
            }
            <button class="admin-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #f44336; margin-left: 5px;" onclick="deleteUserFromAdmin('${normalizedEmail}', '${u.username}')"><i class="fas fa-trash"></i></button>
          ` : '🔒'}
        </td>
      </tr>`;
    });
  } catch (error) {
    console.error('Error loading users:', error);
    html = '<tr><td colspan="5">Error loading users from backend</td></tr>';
  }
  
  return html || '<tr><td colspan="5">No users found</td></tr>';
}

async function promoteUser(email) {
  try {
    await apiCall(`/api/users/${email}`, 'PATCH', { plan: 'premium' });
    showNotification('User promoted to premium!', 'success');
    closeAdminPanel();
    setTimeout(() => showAdminPanel(), 500);
  } catch (error) {
    showNotification('Error promoting user', 'error');
  }
}

async function demoteUser(email) {
  try {
    await apiCall(`/api/users/${email}`, 'PATCH', { plan: 'free' });
    showNotification('User demoted to free plan!', 'success');
    closeAdminPanel();
    setTimeout(() => showAdminPanel(), 500);
  } catch (error) {
    showNotification('Error demoting user', 'error');
  }
}

async function deleteUserFromAdmin(email, username) {
  if (confirm(`Are you sure you want to permanently delete user "${username}"?\n\nThis action cannot be undone.`)) {
    try {
      await apiCall(`/api/users/${email}`, 'DELETE');
      showNotification('User deleted successfully', 'success');
      closeAdminPanel();
      setTimeout(() => showAdminPanel(), 500);
    } catch (error) {
      showNotification('Error deleting user', 'error');
    }
  }
}

function closeAdminPanel() {
  const modal = document.getElementById('admin-panel');
  if (modal) document.body.removeChild(modal);
}

function createBackup() {
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    adminUser: currentUser.username,
    data: {}
  };
  
  Object.keys(localStorage).forEach(key => backupData.data[key] = localStorage.getItem(key));
  
  const blob = new Blob([JSON.stringify(backupData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `examblox-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showNotification('Backup created successfully!', 'success');
}

function exportUserData() {
  const userData = {};
  Object.keys(localStorage).forEach(key => userData[key] = localStorage.getItem(key));
  
  const blob = new Blob([JSON.stringify(userData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `examblox-admin-export-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showNotification('User data exported!', 'success');
}

async function getTotalUsers() {
  try {
    const result = await apiCall('/api/users');
    return result.users ? result.users.length : 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalActivities() {
  return JSON.parse(localStorage.getItem('examblox_activities') || '[]').length;
}

function getSystemStats() {
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) totalSize += localStorage[key].length;
  }
  return {storageUsed: Math.round(totalSize / 1024)};
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type) {
  const existingNotifs = document.querySelectorAll('.notification');
  existingNotifs.forEach(n => {
    if (n && n.parentNode) n.parentNode.removeChild(n);
  });
  
  const notif = document.createElement('div');
  notif.className = 'notification notification-' + type;
  
  let bgColor = '';
  if (type === 'success') {
    bgColor = 'linear-gradient(135deg, #4CAF50, #45a049)';
  } else if (type === 'error') {
    bgColor = 'linear-gradient(135deg, #f44336, #d32f2f)';
  } else if (type === 'info') {
    bgColor = 'linear-gradient(135deg, #2196F3, #1976D2)';
  } else {
    bgColor = 'linear-gradient(135deg, #ff9800, #f57c00)';
  }
  
  notif.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    min-width: 300px;
    max-width: 400px;
    padding: 15px 20px;
    border-radius: 10px;
    background: ${bgColor};
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    transform: translateX(500px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  notif.innerHTML = `
    <span style="flex: 1; line-height: 1.4;">${message}</span>
    <button style="background: none; border: none; color: white; font-size: 22px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: opacity 0.2s; flex-shrink: 0;">&times;</button>
  `;
  
  document.body.appendChild(notif);
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      notif.style.transform = 'translateX(0)';
      notif.style.opacity = '1';
    });
  });
  
  const autoRemoveTimer = setTimeout(() => {
    if (notif && notif.parentNode) {
      notif.style.transform = 'translateX(500px)';
      notif.style.opacity = '0';
      setTimeout(() => {
        if (notif && notif.parentNode) {
          notif.parentNode.removeChild(notif);
        }
      }, 300);
    }
  }, 5000);
  
  const closeBtn = notif.querySelector('button');
  if (closeBtn) {
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.8');
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoRemoveTimer);
      if (notif && notif.parentNode) {
        notif.style.transform = 'translateX(500px)';
        notif.style.opacity = '0';
        setTimeout(() => {
          if (notif && notif.parentNode) {
            notif.parentNode.removeChild(notif);
          }
        }, 300);
      }
    });
  }
}

// ===== UTILITY FUNCTIONS =====
function goToHomepage() {
  window.location.href = 'index.html';
}

function initializeStarsBackground() {
  const container = document.querySelector('.stars');
  if (!container) return;
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('span');
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 4 + 's';
    container.appendChild(star);
  }
}

function initializeMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }
}

function initializeFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });
}

function initializeFooterLinks() {
  document.querySelectorAll('a[href="#features"], a[href="#pricing"], a[href="#testimonials"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.getAttribute('href').substring(1));
      if (target) {
        target.scrollIntoView({behavior: 'smooth'});
      } else {
        showNotification('Section coming soon!', 'info');
      }
    });
  });
  
  document.querySelectorAll('a[href="#blog"], a[href="#tutorials"], a[href="#documentation"], a[href="#support"], a[href="#about"], a[href="#careers"], a[href="#privacy"], a[href="#terms"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('href').substring(1);
      showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} coming soon!`, 'info');
    });
  });
}

console.log('ExamBlox Complete - All Issues Fixed ✅');
console.log('✅ Protected Admin Password: Fixed');
console.log('✅ Forgot Password: Restored');
console.log('✅ File Processing: Fixed (PDF/DOCX/TXT/Images)');
console.log('🚀 Ready for PayPal Integration');
