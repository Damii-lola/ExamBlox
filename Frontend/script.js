// script.js - File Upload and Text Reading Implementation

// Global variables
let currentFile = null;
let extractedText = '';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    initializeStarsBackground();
    initializeMobileNavigation();
});

// Initialize file upload functionality
function initializeFileUpload() {
    const uploadArea = document.querySelector('.upload-area');
    const browseBtn = document.querySelector('.btn-browse');
    const generateBtn = document.querySelector('.btn-generate');
    const questionTypeSelect = document.querySelector('.upload-options select');
    const rangeInput = document.querySelector('.upload-options input[type="range"]');
    const difficultySelect = document.querySelectorAll('.upload-options select')[1];

    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Browse button click event
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change event
    fileInput.addEventListener('change', handleFileSelect);

    // Generate button click event
    generateBtn.addEventListener('click', handleGenerateQuestions);
}

// Handle drag over event
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelection(files[0]);
    }
}

// Handle file select from input
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFileSelection(file);
    }
}

// Main file selection handler
function handleFileSelection(file) {
    // Validate file type
    const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.ppt', '.pptx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
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

    rangeInput.disabled = false;
    rangeInput.style.opacity = '1';

    generateBtn.disabled = false;
    generateBtn.classList.add('active');
    generateBtn.style.opacity = '1';

    // Update range display
    updateRangeDisplay();
    rangeInput.addEventListener('input', updateRangeDisplay);
}

// Update range display
function updateRangeDisplay() {
    const rangeInput = document.querySelector('.upload-options input[type="range"]');
    const label = rangeInput.parentElement.querySelector('label');
    label.textContent = `Number of Questions: ${rangeInput.value}`;
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
        // Load PDF.js library dynamically
        if (!window.pdfjsLib) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                processPdf();
            };
            script.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.head.appendChild(script);
        } else {
            processPdf();
        }

        function processPdf() {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }

                    resolve(fullText);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        }
    });
}

// Extract text from DOC/DOCX files using mammoth.js
function extractTextFromDoc(file) {
    return new Promise((resolve, reject) => {
        if (!window.mammoth) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            script.onload = () => processDoc();
            script.onerror = () => reject(new Error('Failed to load mammoth.js'));
            document.head.appendChild(script);
        } else {
            processDoc();
        }

        function processDoc() {
            const reader = new FileReader();
            reader.onload = function(e) {
                window.mammoth.extractRawText({ arrayBuffer: e.target.result })
                    .then(result => resolve(result.value))
                    .catch(error => reject(error));
            };
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        }
    });
}

// Extract text from images using Tesseract.js OCR
function extractTextFromImage(file) {
    return new Promise((resolve, reject) => {
        if (!window.Tesseract) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
            script.onload = () => processImage();
            script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
            document.head.appendChild(script);
        } else {
            processImage();
        }

        function processImage() {
            showNotification('Extracting text from image... This may take a moment.', 'info');
            
            window.Tesseract.recognize(file, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
                    }
                }
            })
            .then(({ data: { text } }) => resolve(text))
            .catch(error => reject(error));
        }
    });
}

// Extract text from PPT/PPTX files (basic implementation)
function extractTextFromPpt(file) {
    return new Promise((resolve, reject) => {
        // For PPT files, we'll try to extract basic text content
        // This is a simplified implementation
        showNotification('PPT support is limited. Consider converting to PDF for better results.', 'info');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Basic text extraction from PPT files
            // This is a simplified approach and may not work for all PPT files
            try {
                const content = e.target.result;
                const text = extractBasicTextFromBinary(content);
                resolve(text);
            } catch (error) {
                reject(new Error('Unable to extract text from PowerPoint file. Please convert to PDF or another supported format.'));
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Basic text extraction from binary content (fallback method)
function extractBasicTextFromBinary(content) {
    // Remove non-printable characters and extract readable text
    return content.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();
}

// Handle generate questions button click
function handleGenerateQuestions() {
    if (!currentFile || !extractedText) {
        showNotification('Please select a file first', 'error');
        return;
    }

    const questionType = document.querySelector('.upload-options select').value;
    const numQuestions = document.querySelector('.upload-options input[type="range"]').value;
    const difficulty = document.querySelectorAll('.upload-options select')[1].value;

    // Show processing notification
    showNotification('Generating questions... This may take a moment.', 'info');

    // Here you would typically send the extracted text to your backend/AI service
    // For now, we'll simulate the process
    setTimeout(() => {
        showGeneratedQuestions(questionType, numQuestions, difficulty);
    }, 3000);

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
                <p>Based on your uploaded content, here's a preview of the generated questions. In the full version, you would see all ${numQuestions} questions with multiple choice options, explanations, and answer keys.</p>
                <br>
                <p><em>Note: This is a demo. The actual implementation would connect to an AI service to generate real questions from your extracted text.</em></p>
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
    notification.querySelector('button').addEventListener('click', () => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    });
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

// FAQ functionality
document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
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
    });
});
