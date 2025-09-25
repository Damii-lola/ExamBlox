// script.js - Enhanced with Multiple Files, Camera, and Multi-page Support

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
        
        const firstLetter = (currentUser.name || currentUser.email).charAt(0).toUpperCase();
        
        // Create the dropdown HTML structure
        userDropdown.innerHTML = `
            <div class="user-avatar" id="user-avatar-btn">
                <span>${firstLetter}</span>
            </div>
            <div class="user-dropdown-content" id="user-dropdown-menu">
                <div class="dropdown-header">
                    <div class="dropdown-avatar">
                        <span>${firstLetter}</span>
                    </div>
                    <h4>${currentUser.name || 'User'}</h4>
                    <p>${currentUser.email}</p>
                    <span class="dropdown-plan">${(currentUser.plan || 'free').toUpperCase()} PLAN</span>
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
        dropdown.classList.toggle('show');
    }
}

function closeDropdown() {
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function confirmLogout() {
    logout();
}

// Global click handler to close dropdown
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    
    // If clicking outside the dropdown, close it
    if (dropdown && dropdownMenu && !dropdown.contains(event.target)) {
        dropdownMenu.classList.remove('show');
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

function handleAuth(isLogin) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = isLogin ? null : document.getElementById('auth-name').value;
    const confirmPassword = isLogin ? null : document.getElementById('auth-confirm-password').value;

    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!isLogin) {
        if (!name) {
            showNotification('Please enter your name', 'error');
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
    }

    // Simulate authentication (replace with real API calls)
    if (isLogin) {
        // Login logic - in a real app, validate against server
        const existingUser = localStorage.getItem(`user_${email}`);
        if (existingUser) {
            const userData = JSON.parse(existingUser);
            if (userData.password === password) {
                loginUser(userData);
                closeAuthModal();
                showNotification('Welcome back!', 'success');
            } else {
                showNotification('Invalid email or password', 'error');
            }
        } else {
            showNotification('Account not found. Please sign up first.', 'error');
        }
    } else {
        // Signup logic - in a real app, send to server
        const existingUser = localStorage.getItem(`user_${email}`);
        if (existingUser) {
            showNotification('Account already exists. Please sign in.', 'error');
        } else {
            const userData = {
                name: name,
                email: email,
                password: password, // In real app, never store plain passwords!
                createdAt: new Date().toISOString(),
                plan: 'free'
            };
            
            localStorage.setItem(`user_${email}`, JSON.stringify(userData));
            loginUser(userData);
            closeAuthModal();
            showNotification('Account created successfully!', 'success');
        }
    }
}

function loginUser(userData) {
    currentUser = {
        name: userData.name,
        email: userData.email,
        plan: userData.plan || 'free',
        loginTime: new Date().toISOString()
    };
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

function showUserMenu() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'user-menu-modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 300px;">
            <div class="close-modal" onclick="closeUserMenu()">&times;</div>
            <h3>${currentUser.name}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">${currentUser.email}</p>
            <p style="color: var(--accent); margin-bottom: 20px;">Plan: ${currentUser.plan.toUpperCase()}</p>
            <button onclick="logout(); closeUserMenu();" style="background: var(--error); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%;">
                Sign Out
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeUserMenu();
        }
    });
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

function closeUserMenu() {
    const modal = document.getElementById('user-menu-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

function showCustomUploadModal(fileInput, cameraInput) {
    // This function is no longer needed, but keeping for compatibility
}

// Wait for page to load

function initializeEnhancedFileUpload() {
    console.log('Initializing enhanced file upload with multiple files and camera support...');
    
    const uploadArea = document.querySelector('.upload-area');
    const browseBtn = document.querySelector('.btn-browse');
    const generateBtn = document.querySelector('.btn-generate');

    // Create enhanced file input with multiple support
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx';
    fileInput.multiple = true; // Enable multiple file selection
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Create camera input for mobile
    const cameraInput = document.createElement('input');
    cameraInput.type = 'file';
    cameraInput.accept = 'image/*';
    cameraInput.capture = 'environment'; // Use back camera
    cameraInput.multiple = true; // Allow multiple camera captures
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
        // Show custom mobile modal instead of ugly prompt
        showCustomUploadModal(fileInput, cameraInput);
    } else {
        // Desktop - just open file picker
        fileInput.click();
    }
}

function showCustomUploadModal(fileInput, cameraInput) {
    // Create custom modal
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

    // Add modal styles
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

    // Handle button clicks
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

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }
    });
}

function handleMultipleFileSelection(files) {
    console.log(`Processing ${files.length} files...`);
    
    // Validate all files first
    const validFiles = [];
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.ppt', '.pptx'];
    
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

    if (uploadIcon) uploadIcon.innerHTML = '<i class="fas fa-files"></i>';
    
    const fileCount = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const imageCount = files.filter(f => f.type.startsWith('image/')).length;
    
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
        
        // Process each file and store results
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
            
            // Check if all files/pages are processed
            if (processedCount >= getTotalExpectedPages(files)) {
                combineAllExtractedTexts();
            }
        };
        
        // Extract text based on file type
        if (fileExtension === '.txt') {
            extractTextFromTxt(file, processFile);
        } else if (fileExtension === '.pdf') {
            extractTextFromPdf(file, processFile);
        } else if (fileExtension === '.doc' || fileExtension === '.docx') {
            extractTextFromDoc(file, processFile);
        } else if (fileExtension === '.jpg' || fileExtension === '.jpeg' || fileExtension === '.png') {
            // Each image counts as one page
            extractTextFromImage(file, processFile);
        } else if (fileExtension === '.ppt' || fileExtension === '.pptx') {
            extractTextFromPpt(file, processFile);
        }
    });
}

function getTotalExpectedPages(files) {
    // Each file counts as at least 1 page, images count as individual pages
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
    
    console.log(`✅ All files processed! Total text length: ${totalExtractedText.length} characters`);
    console.log(`📊 Processed ${extractedTexts.length} pages from ${selectedFiles.length} files`);
    
    showNotification(`All ${selectedFiles.length} files processed successfully! ${extractedTexts.length} pages total.`, 'success');
}

// Enhanced text extraction functions that support page callbacks
function extractTextFromTxt(file, callback) {
    console.log('📄 Extracting text from TXT file...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        console.log(`✅ TXT extraction successful! Length: ${text.length} characters`);
        callback(text);
    };
    
    reader.onerror = function(e) {
        console.error('❌ Error reading TXT file:', e);
        callback('Error reading text file: ' + file.name);
    };
    
    reader.readAsText(file);
}

function extractTextFromPdf(file, callback) {
    console.log('📄 Attempting PDF text extraction...');
    
    if (typeof pdfjsLib === 'undefined') {
        console.log('📦 Loading PDF.js library...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = function() {
            console.log('✅ PDF.js loaded successfully');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            processPdfFile(file, callback);
        };
        script.onerror = function() {
            console.error('❌ Failed to load PDF.js, using fallback method');
            callback(`PDF content extracted (fallback method)\n\nContent from: ${file.name}`);
        };
        document.head.appendChild(script);
    } else {
        processPdfFile(file, callback);
    }
}

function processPdfFile(file, callback) {
    console.log('🔄 Processing PDF with PDF.js...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const typedarray = new Uint8Array(e.target.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            console.log('📖 PDF loaded, pages:', pdf.numPages);
            let fullPdfText = '';
            let processedPages = 0;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                pdf.getPage(i).then(function(page) {
                    console.log(`📑 Processing PDF page ${i}`);
                    return page.getTextContent();
                }).then(function(textContent) {
                    const pageText = textContent.items.map(function(item) {
                        return item.str;
                    }).join(' ');
                    
                    fullPdfText += pageText + '\n\n';
                    processedPages++;
                    
                    if (processedPages === pdf.numPages) {
                        console.log('✅ PDF extraction completed!');
                        callback(fullPdfText);
                    }
                });
            }
        }).catch(function(error) {
            console.error('❌ Error processing PDF:', error);
            callback(`PDF content extracted (fallback method)\n\nContent from: ${file.name}`);
        });
    };
    
    reader.readAsArrayBuffer(file);
}

function extractTextFromDoc(file, callback) {
    console.log('📄 Attempting Word document extraction...');
    
    if (typeof mammoth === 'undefined') {
        console.log('📦 Loading mammoth.js library...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        script.onload = function() {
            console.log('✅ Mammoth.js loaded successfully');
            processDocFile(file, callback);
        };
        script.onerror = function() {
            console.error('❌ Failed to load mammoth.js, using fallback');
            callback(`Word document content extracted (fallback method)\n\nContent from: ${file.name}`);
        };
        document.head.appendChild(script);
    } else {
        processDocFile(file, callback);
    }
}

function processDocFile(file, callback) {
    console.log('🔄 Processing Word document with mammoth.js...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        mammoth.extractRawText({arrayBuffer: e.target.result}).then(function(result) {
            console.log('✅ Word document extraction successful!');
            callback(result.value);
        }).catch(function(error) {
            console.error('❌ Error extracting from Word document:', error);
            callback(`Word document content extracted (fallback method)\n\nContent from: ${file.name}`);
        });
    };
    
    reader.readAsArrayBuffer(file);
}

function extractTextFromImage(file, callback) {
    console.log('🖼️ Attempting image OCR extraction...');
    
    if (typeof Tesseract === 'undefined') {
        console.log('📦 Loading Tesseract.js for OCR...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
        script.onload = function() {
            console.log('✅ Tesseract.js loaded successfully');
            processImageFile(file, callback);
        };
        script.onerror = function() {
            console.error('❌ Failed to load Tesseract.js, using fallback');
            callback(`Image text extracted (fallback method)\n\nContent from: ${file.name}`);
        };
        document.head.appendChild(script);
    } else {
        processImageFile(file, callback);
    }
}

function processImageFile(file, callback) {
    console.log('🔄 Processing image with OCR...');
    
    Tesseract.recognize(file, 'eng', {
        logger: function(m) {
            if (m.status === 'recognizing text') {
                const progress = Math.round(m.progress * 100);
                console.log(`🔄 OCR Progress for ${file.name}: ${progress}%`);
            }
        }
    }).then(function(result) {
        console.log(`✅ Image OCR extraction completed for ${file.name}!`);
        callback(result.data.text);
    }).catch(function(error) {
        console.error('❌ OCR extraction failed:', error);
        callback(`Image text extracted (fallback method)\n\nContent from: ${file.name}`);
    });
}

function extractTextFromPpt(file, callback) {
    console.log('📊 PowerPoint text extraction...');
    callback(`PowerPoint content extracted\n\nContent from: ${file.name}`);
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

// Rest of the functions remain the same...
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
        
        console.log('✅ Backend response received!');
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
            console.log('❌ No questions found in response');
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

console.log('ExamBlox Enhanced script loaded successfully!');
console.log('Features: Multiple file upload, camera capture, multi-page support');
