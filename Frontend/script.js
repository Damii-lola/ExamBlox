// script.js - File Upload and Text Reading Implementation

// Global variables
let currentFile = null;
let extractedText = '';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    initializeStarsBackground();
    initializeMobileNavigation();
    initializeFAQ();
});

// Initialize file upload functionality
function initializeFileUpload() {
    const uploadArea = document.querySelector('.upload-area');
    const browseBtn = document.querySelector('.btn-browse');
    const generateBtn = document.querySelector('.btn-generate');

    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx';
    fileInput.style.display = 'none';
    fileInput.id = 'fileInput';
    document.body.appendChild(fileInput);

    // Browse button click event
    if (browseBtn) {
        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Browse button clicked');
            fileInput.click();
        });
    }

    // Upload area click event
    if (uploadArea) {
        uploadArea.addEventListener('click', function(e) {
            // Don't trigger if clicking the browse button
            if (e.target.classList.contains('btn-browse')) {
                return;
            }
            console.log('Upload area clicked');
            fileInput.click();
        });

        // Drag and drop events
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }

    // File input change event
    fileInput.addEventListener('change', function(e) {
        console.log('File input changed', e.target.files);
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Generate button click event
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateQuestions);
    }

    console.log('File upload initialized');
}

// Handle drag over event
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag over');
    e.currentTarget.classList.add('dragover');
}

// Handle drag leave event
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

// Handle drop event
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    console.log('File dropped', e.dataTransfer.files);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelection(files[0]);
    }
}

// Main file selection handler
function handleFileSelection(file) {
    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.ppt', '.pptx'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
        showNotification('Please select a valid file format (PDF, DOC, DOCX, TXT, JPG, PNG, PPT)', 'error');
        return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }

    currentFile = file;
    updateUploadUI(file);
    extractTextFromFile(file);
}

// Update upload UI after file selection
function updateUploadUI(file) {
    const uploadArea = document.querySelector('.upload-area');
    const uploadIcon = document.querySelector('.upload-icon');
    const uploadTitle = document.querySelector('.upload-title');
    const uploadSubtitle = document.querySelector('.upload-subtitle');
    const browseBtn = document.querySelector('.btn-browse');

    if (uploadArea && uploadIcon && uploadTitle && uploadSubtitle && browseBtn) {
        // Update upload area appearance
        uploadArea.style.background = 'rgba(106, 75, 255, 0.1)';
        uploadArea.style.borderColor = '#4dfff3';
        
        // Update content
        uploadIcon.innerHTML = '<i class="fas fa-file-check"></i>';
        uploadTitle.textContent = `File selected: ${file.name}`;
        uploadSubtitle.textContent = `Size: ${formatFileSize(file.size)}`;
        browseBtn.textContent = 'Change File';
        browseBtn.style.background = 'linear-gradient(90deg, #4dfff3, #9b6aff)';

        // Enable form controls
        enableUploadControls();
        
        showNotification(`File "${file.name}" selected successfully!`, 'success');
    }
}

// Enable upload form controls
function enableUploadControls() {
    const selects = document.querySelectorAll('.upload-options select');
    const rangeInput = document.querySelector('.upload-options input[type="range"]');
    const generateBtn = document.querySelector('.btn-generate');

    selects.forEach(select => {
        select.disabled = false;
        select.style.opacity = '1';
    });

    if (rangeInput) {
        rangeInput.disabled = false;
        rangeInput.style.opacity = '1';
        
        // Update range display
        updateRangeDisplay();
        rangeInput.addEventListener('input', updateRangeDisplay);
    }

    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.classList.add('active');
        generateBtn.style.opacity = '1';
    }
}

// Update range display
function updateRangeDisplay() {
    const rangeInput = document.querySelector('.upload-options input[type="range"]');
    if (rangeInput) {
        const label = rangeInput.parentElement.querySelector('label');
        if (label) {
            label.textContent = `Number of Questions: ${rangeInput.value}`;
        }
    }
}

// Extract text from different file types
async function extractTextFromFile(file) {
    try {
        showNotification('Processing file...', 'info');
        
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        switch (fileExtension) {
            case '.txt':
                extractedText = await extractTextFromTxt(file);
                break;
            case '.pdf':
                extractedText = await extractTextFromPdf(file);
                break;
            case '.doc':
            case '.docx':
                extractedText = await extractTextFromDoc(file);
                break;
            case '.jpg':
            case '.jpeg':
            case '.png':
                extractedText = await extractTextFromImage(file);
                break;
            case '.ppt':
            case '.pptx':
                extractedText = await extractTextFromPpt(file);
                break;
            default:
                throw new Error('Unsupported file type');
        }

        if (extractedText && extractedText.trim().length > 0) {
            showNotification('File processed successfully!', 'success');
            console.log('Extracted text preview:', extractedText.substring(0, 500) + '...');
        } else {
            showNotification('No readable text found in the file', 'error');
        }

    } catch (error) {
        console.error('Error extracting text:', error);
        showNotification('Error processing file. Please try again.', 'error');
    }
}

// Extract text from TXT files
function extractTextFromTxt(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Extract text from PDF files using PDF.js
function extractTextFromPdf(file) {
    return new Promise((resolve, reject) => {
        // For now, let's use a simple text extraction
        // In a real implementation, you would load PDF.js library
        showNotification('PDF text extraction requires additional libraries. Using basic extraction.', 'info');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // This is a very basic approach - in production you'd use PDF.js
            const text = "Sample text extracted from PDF: " + file.name + "\n\nThis is a demo implementation. In the real version, PDF.js would extract the actual text content from your PDF file.";
            resolve(text);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

// Extract text from DOC/DOCX files
function extractTextFromDoc(file) {
    return new Promise((resolve, reject) => {
        showNotification('DOC/DOCX text extraction requires additional libraries. Using basic extraction.', 'info');
        
        // This is a demo implementation
        const text = "Sample text extracted from Word document: " + file.name + "\n\nThis is a demo implementation. In the real version, mammoth.js would extract the actual text content from your Word document.";
        resolve(text);
    });
}

// Extract text from images using OCR (demo)
function extractTextFromImage(file) {
    return new Promise((resolve, reject) => {
        showNotification('Image OCR requires additional libraries. Using demo extraction.', 'info');
        
        // This is a demo implementation
        const text = "Sample text extracted from image: " + file.name + "\n\nThis is a demo implementation. In the real version, Tesseract.js would perform OCR to extract text from your image.";
        resolve(text);
    });
}

// Extract text from PPT/PPTX files (demo)
function extractTextFromPpt(file) {
    return new Promise((resolve, reject) => {
        showNotification('PPT support is limited. Consider converting to PDF for better results.', 'info');
        
        const text = "Sample text extracted from PowerPoint: " + file.name + "\n\nThis is a demo implementation. PPT text extraction requires specialized libraries.";
        resolve(text);
    });
}

// Handle generate questions button click
function handleGenerateQuestions() {
    if (!currentFile || !extractedText) {
        showNotification('Please select a file first', 'error');
        return;
    }

    const questionTypeSelect = document.querySelector('.upload-options select');
    const rangeInput = document.querySelector('.upload-options input[type="range"]');
    const difficultySelect = document.querySelectorAll('.upload-options select')[1];

    const questionType = questionTypeSelect ? questionTypeSelect.value : 'Multiple Choice';
    const numQuestions = rangeInput ? rangeInput.value : '10';
    const difficulty = difficultySelect ? difficultySelect.value : 'Medium';

    // Show processing notification
    showNotification('Generating questions... This may take a moment.', 'info');

    // Simulate processing time
    setTimeout(() => {
        showGeneratedQuestions(questionType, numQuestions, difficulty);
    }, 2000);

    console.log('Generating questions with:', {
        questionType,
        numQuestions,
        difficulty,
        textLength: extractedText.length,
        fileName: currentFile.name
    });
}

// Show generated questions (placeholder)
function showGeneratedQuestions(questionType, numQuestions, difficulty) {
    showNotification('Questions generated successfully!', 'success');
    
    // Create and show modal with generated questions
    const modal = createQuestionModal(questionType, numQuestions, difficulty);
    document.body.appendChild(modal);
}

// Create question results modal
function createQuestionModal(questionType, numQuestions, difficulty) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Generated Questions</h2>
            <div class="modal-subtitle">${questionType} • ${numQuestions} Questions • ${difficulty} Difficulty</div>
            <div class="question-preview">
                <p><strong>Sample Question:</strong></p>
                <p>Based on your uploaded content "${currentFile.name}", here's a preview of the generated questions. In the full version, you would see all ${numQuestions} questions with multiple choice options, explanations, and answer keys.</p>
                <br>
                <p><strong>Demo Question 1:</strong> What is the main topic discussed in the uploaded document?</p>
                <p>A) Technology<br>B) Science<br>C) Education<br>D) Business</p>
                <br>
                <p><em>Note: This is a demo. The actual implementation would connect to an AI service to generate real questions from your extracted text.</em></p>
                <br>
                <p><strong>Extracted text length:</strong> ${extractedText.length} characters</p>
            </div>
            <button class="modal-btn">Download Questions</button>
            <button class="modal-btn" style="background: #4dfff3; color: #0d0c1d; margin-top: 10px;">Start Practice Test</button>
        </div>
    `;

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    return modal;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    });

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button>&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);

    // Manual close
    const closeBtn = notification.querySelector('button');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize stars background animation
function initializeStarsBackground() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    
    const numStars = 100;

    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('span');
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 4 + 's';
        star.style.animationDuration = (Math.random() * 3 + 2) + 's';
        starsContainer.appendChild(star);
    }
}

// Initialize mobile navigation
function initializeMobileNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// Initialize FAQ functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

// Test function to verify script is loaded
console.log('ExamBlox script loaded successfully!');
