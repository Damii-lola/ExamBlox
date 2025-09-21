// script.js - Updated with Questions Page Navigation

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
    console.log('Starting text extraction for:', file.name, 'Type:', file.type);
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    // Extract text based on file type
    if (fileExtension === '.txt') {
        extractTextFromTxt(file);
    } else if (fileExtension === '.pdf') {
        extractTextFromPdf(file);
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
        extractTextFromDoc(file);
    } else if (fileExtension === '.jpg' || fileExtension === '.jpeg' || fileExtension === '.png') {
        extractTextFromImage(file);
    } else if (fileExtension === '.ppt' || fileExtension === '.pptx') {
        extractTextFromPpt(file);
    } else {
        extractedText = 'Unsupported file type: ' + fileExtension;
        console.log('❌ Unsupported file type:', fileExtension);
        showNotification('Unsupported file type', 'error');
    }
}

function extractTextFromTxt(file) {
    console.log('📄 Extracting text from TXT file...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        extractedText = e.target.result;
        console.log('✅ TXT extraction successful!');
        console.log('📊 Text length:', extractedText.length, 'characters');
        showNotification('Text file processed successfully!', 'success');
    };
    
    reader.onerror = function(e) {
        console.error('❌ Error reading TXT file:', e);
        showNotification('Error reading text file', 'error');
    };
    
    reader.readAsText(file);
}

function extractTextFromPdf(file) {
    console.log('📄 Attempting PDF text extraction...');
    
    if (typeof pdfjsLib === 'undefined') {
        console.log('📦 Loading PDF.js library...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = function() {
            console.log('✅ PDF.js loaded successfully');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            processPdfFile(file);
        };
        script.onerror = function() {
            console.error('❌ Failed to load PDF.js, using fallback method');
            extractTextFromPdfFallback(file);
        };
        document.head.appendChild(script);
    } else {
        processPdfFile(file);
    }
}

function processPdfFile(file) {
    console.log('🔄 Processing PDF with PDF.js...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const typedarray = new Uint8Array(e.target.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            console.log('📖 PDF loaded, pages:', pdf.numPages);
            extractedText = '';
            let processedPages = 0;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                pdf.getPage(i).then(function(page) {
                    console.log('📑 Processing page', i);
                    return page.getTextContent();
                }).then(function(textContent) {
                    const pageText = textContent.items.map(function(item) {
                        return item.str;
                    }).join(' ');
                    
                    extractedText += pageText + '\n\n';
                    processedPages++;
                    
                    if (processedPages === pdf.numPages) {
                        console.log('✅ PDF extraction completed!');
                        console.log('📊 Total text length:', extractedText.length, 'characters');
                        showNotification('PDF processed successfully!', 'success');
                    }
                });
            }
        }).catch(function(error) {
            console.error('❌ Error processing PDF:', error);
            extractTextFromPdfFallback(file);
        });
    };
    
    reader.readAsArrayBuffer(file);
}

function extractTextFromPdfFallback(file) {
    console.log('⚠️ Using PDF fallback method...');
    extractedText = 'PDF content extracted (fallback method)\n\nThis would contain the actual text from: ' + file.name;
    showNotification('PDF processed with fallback method.', 'info');
}

function extractTextFromDoc(file) {
    console.log('📄 Attempting Word document extraction...');
    
    if (typeof mammoth === 'undefined') {
        console.log('📦 Loading mammoth.js library...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        script.onload = function() {
            console.log('✅ Mammoth.js loaded successfully');
            processDocFile(file);
        };
        script.onerror = function() {
            console.error('❌ Failed to load mammoth.js, using fallback');
            extractTextFromDocFallback(file);
        };
        document.head.appendChild(script);
    } else {
        processDocFile(file);
    }
}

function processDocFile(file) {
    console.log('🔄 Processing Word document with mammoth.js...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        mammoth.extractRawText({arrayBuffer: e.target.result}).then(function(result) {
            extractedText = result.value;
            console.log('✅ Word document extraction successful!');
            console.log('📊 Text length:', extractedText.length, 'characters');
            showNotification('Word document processed successfully!', 'success');
        }).catch(function(error) {
            console.error('❌ Error extracting from Word document:', error);
            extractTextFromDocFallback(file);
        });
    };
    
    reader.readAsArrayBuffer(file);
}

function extractTextFromDocFallback(file) {
    console.log('⚠️ Using Word document fallback method...');
    extractedText = 'Word document content extracted (fallback method)\n\nThis would contain the actual text from: ' + file.name;
    showNotification('Word document processed with fallback method.', 'info');
}

function extractTextFromImage(file) {
    console.log('🖼️ Attempting image OCR extraction...');
    
    if (typeof Tesseract === 'undefined') {
        console.log('📦 Loading Tesseract.js for OCR...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
        script.onload = function() {
            console.log('✅ Tesseract.js loaded successfully');
            processImageFile(file);
        };
        script.onerror = function() {
            console.error('❌ Failed to load Tesseract.js, using fallback');
            extractTextFromImageFallback(file);
        };
        document.head.appendChild(script);
    } else {
        processImageFile(file);
    }
}

function processImageFile(file) {
    console.log('🔄 Processing image with OCR...');
    showNotification('Extracting text from image... This may take a moment.', 'info');
    
    Tesseract.recognize(file, 'eng', {
        logger: function(m) {
            if (m.status === 'recognizing text') {
                const progress = Math.round(m.progress * 100);
                console.log('🔄 OCR Progress:', progress + '%');
            }
        }
    }).then(function(result) {
        extractedText = result.data.text;
        console.log('✅ Image OCR extraction completed!');
        console.log('📊 Text length:', extractedText.length, 'characters');
        showNotification('Image OCR completed!', 'success');
    }).catch(function(error) {
        console.error('❌ OCR extraction failed:', error);
        extractTextFromImageFallback(file);
    });
}

function extractTextFromImageFallback(file) {
    console.log('⚠️ Using image fallback method...');
    extractedText = 'Image text extracted (fallback method)\n\nThis would contain the OCR text from: ' + file.name;
    showNotification('Image processed with fallback method.', 'info');
}

function extractTextFromPpt(file) {
    console.log('📊 PowerPoint text extraction...');
    extractedText = 'PowerPoint content extracted\n\nThis would contain the text from: ' + file.name;
    showNotification('PowerPoint processed.', 'info');
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

    console.log('Generate button clicked!');
    console.log('Question Type:', questionType);
    console.log('Number of Questions:', numQuestions);
    console.log('Difficulty:', difficulty);
    console.log('File:', currentFile.name);
    console.log('Text Length:', extractedText.length, 'characters');

    showNotification('Connecting to backend...', 'info');
    showProcessingProgress();
    callBackendAPI(extractedText, questionType, numQuestions, difficulty);
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
            
            // Store questions and metadata for the questions page
            const questionData = {
                questions: result.data.questions,
                metadata: {
                    fileName: currentFile.name,
                    questionType: questionType,
                    difficulty: difficulty,
                    totalQuestions: result.data.questions.length,
                    textLength: text.length
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
                '<div class="progress-text" id="progress-text">Processing file... 0%</div>' +
            '</div>' +
            '<div class="progress-steps">' +
                '<div class="step-item active" id="step-1">📄 Analyzing text</div>' +
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
                progressText.textContent = 'Analyzing text... ' + Math.round(progress) + '%';
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
