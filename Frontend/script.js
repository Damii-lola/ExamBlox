// script.js - Simple File Upload Implementation

let currentFile = null;
let extractedText = '';

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeFileUpload();
    initializeStarsBackground();
    initializeMobileNav();
    initializeFAQ();
});

function initializeFileUpload() {
    console.log('Initializing file upload...');
    
    const uploadArea = document.querySelector('.upload-area');
    const browseBtn = document.querySelector('.btn-browse');
    const generateBtn = document.querySelector('.btn-generate');

    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Browse button click
    if (browseBtn) {
        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Browse button clicked');
            fileInput.click();
        });
    }

    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            console.log('Upload area clicked');
            fileInput.click();
        });
    }

    // File selection
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            console.log('File selected:', e.target.files[0].name);
            handleFileSelection(e.target.files[0]);
        }
    });

    // Generate button
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            console.log('Generate button clicked');
            handleGenerateQuestions();
        });
    }

    console.log('File upload initialized');
}

function handleFileSelection(file) {
    console.log('Processing file:', file.name);
    
    // Validate file
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.ppt', '.pptx'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
        showNotification('Please select a valid file format', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }

    currentFile = file;
    updateUploadUI(file);
    extractTextFromFile(file);
}

function updateUploadUI(file) {
    const uploadIcon = document.querySelector('.upload-icon');
    const uploadTitle = document.querySelector('.upload-title');
    const uploadSubtitle = document.querySelector('.upload-subtitle');
    const browseBtn = document.querySelector('.btn-browse');
    const uploadArea = document.querySelector('.upload-area');

    if (uploadIcon) uploadIcon.innerHTML = '<i class="fas fa-file-check"></i>';
    if (uploadTitle) uploadTitle.textContent = 'File selected: ' + file.name;
    if (uploadSubtitle) uploadSubtitle.textContent = 'Size: ' + formatFileSize(file.size);
    if (browseBtn) browseBtn.textContent = 'Change File';
    if (uploadArea) uploadArea.style.borderColor = '#4dfff3';

    enableControls();
    showNotification('File selected successfully!', 'success');
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

function extractTextFromFile(file) {
    showNotification('Processing file...', 'info');
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    // Demo text extraction
    setTimeout(function() {
        extractedText = 'Demo text extracted from ' + file.name + '. This is sample content that would normally be extracted from your ' + fileExtension + ' file. In a real implementation, this would contain the actual text content from your uploaded file.';
        
        showNotification('File processed successfully!', 'success');
        console.log('Text extracted, length:', extractedText.length);
    }, 1000);
}

function handleGenerateQuestions() {
    if (!currentFile || !extractedText) {
        showNotification('Please select a file first', 'error');
        return;
    }

    const questionType = document.querySelector('.upload-options select').value || 'Multiple Choice';
    const numQuestions = document.querySelector('.upload-options input[type="range"]').value || '10';
    const difficultySelects = document.querySelectorAll('.upload-options select');
    const difficulty = difficultySelects.length > 1 ? difficultySelects[1].value : 'Medium';

    showNotification('Generating questions...', 'info');

    setTimeout(function() {
        showQuestionModal(questionType, numQuestions, difficulty);
    }, 2000);
}

function showQuestionModal(questionType, numQuestions, difficulty) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content">' +
        '<span class="close-modal">&times;</span>' +
        '<h2>Generated Questions</h2>' +
        '<div class="modal-subtitle">' + questionType + ' • ' + numQuestions + ' Questions • ' + difficulty + ' Difficulty</div>' +
        '<div class="question-preview">' +
        '<p><strong>Sample Question:</strong></p>' +
        '<p>Based on your uploaded file "' + currentFile.name + '", here are the generated questions.</p>' +
        '<br>' +
        '<p><strong>Demo Question 1:</strong> What is the main topic discussed in the uploaded document?</p>' +
        '<p>A) Technology<br>B) Science<br>C) Education<br>D) Business</p>' +
        '<br>' +
        '<p><em>This is a demo. Real implementation would generate actual questions from your text.</em></p>' +
        '</div>' +
        '<button class="modal-btn">Download Questions</button>' +
        '<button class="modal-btn" style="background: #4dfff3; color: #0d0c1d; margin-top: 10px;">Start Practice Test</button>' +
        '</div>';

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    showNotification('Questions generated successfully!', 'success');
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

console.log('ExamBlox script loaded successfully!');
