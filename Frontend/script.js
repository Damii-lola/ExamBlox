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
        console.log('📝 EXTRACTED TEXT:');
        console.log('---START OF TEXT---');
        console.log(extractedText);
        console.log('---END OF TEXT---');
        console.log('📊 Text length:', extractedText.length, 'characters');
        console.log('📊 Word count (approx):', extractedText.split(/\s+/).length);
        
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
    
    // Try to load PDF.js dynamically
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
                    
                    extractedText += 'PAGE ' + (processedPages + 1) + ':\n' + pageText + '\n\n';
                    processedPages++;
                    
                    console.log('📝 Page', processedPages, 'text length:', pageText.length);
                    
                    if (processedPages === pdf.numPages) {
                        console.log('✅ PDF extraction completed!');
                        console.log('📝 FULL EXTRACTED TEXT:');
                        console.log('---START OF PDF TEXT---');
                        console.log(extractedText);
                        console.log('---END OF PDF TEXT---');
                        console.log('📊 Total text length:', extractedText.length, 'characters');
                        console.log('📊 Total pages processed:', processedPages);
                        
                        showNotification('PDF processed successfully! Check console for extracted text.', 'success');
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
    extractedText = 'PDF TEXT EXTRACTION (Fallback Method)\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\n\nNote: This is a fallback method. For full PDF text extraction, PDF.js library is required.\n\nIn a production environment, this would contain the actual extracted text from your PDF file.';
    
    console.log('📝 FALLBACK PDF TEXT:');
    console.log('---START OF FALLBACK TEXT---');
    console.log(extractedText);
    console.log('---END OF FALLBACK TEXT---');
    
    showNotification('PDF processed with fallback method. Check console.', 'info');
}

function extractTextFromDoc(file) {
    console.log('📄 Attempting Word document extraction...');
    
    // Try to load mammoth.js for proper DOC/DOCX extraction
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
            console.log('📝 EXTRACTED WORD TEXT:');
            console.log('---START OF WORD TEXT---');
            console.log(extractedText);
            console.log('---END OF WORD TEXT---');
            console.log('📊 Text length:', extractedText.length, 'characters');
            console.log('📊 Word count (approx):', extractedText.split(/\s+/).length);
            
            if (result.messages.length > 0) {
                console.log('⚠️ Extraction messages:', result.messages);
            }
            
            showNotification('Word document processed successfully! Check console.', 'success');
        }).catch(function(error) {
            console.error('❌ Error extracting from Word document:', error);
            extractTextFromDocFallback(file);
        });
    };
    
    reader.readAsArrayBuffer(file);
}

function extractTextFromDocFallback(file) {
    console.log('⚠️ Using Word document fallback method...');
    extractedText = 'WORD DOCUMENT TEXT EXTRACTION (Fallback Method)\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\n\nNote: This is a fallback method. For full Word document text extraction, mammoth.js library is required.\n\nIn a production environment, this would contain the actual extracted text from your Word document.';
    
    console.log('📝 FALLBACK WORD TEXT:');
    console.log('---START OF FALLBACK TEXT---');
    console.log(extractedText);
    console.log('---END OF FALLBACK TEXT---');
    
    showNotification('Word document processed with fallback method. Check console.', 'info');
}

function extractTextFromImage(file) {
    console.log('🖼️ Attempting image OCR extraction...');
    
    // Try to load Tesseract.js for OCR
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
        console.log('📝 EXTRACTED IMAGE TEXT:');
        console.log('---START OF OCR TEXT---');
        console.log(extractedText);
        console.log('---END OF OCR TEXT---');
        console.log('📊 Text length:', extractedText.length, 'characters');
        console.log('📊 Confidence:', result.data.confidence + '%');
        
        showNotification('Image OCR completed! Check console for extracted text.', 'success');
    }).catch(function(error) {
        console.error('❌ OCR extraction failed:', error);
        extractTextFromImageFallback(file);
    });
}

function extractTextFromImageFallback(file) {
    console.log('⚠️ Using image fallback method...');
    extractedText = 'IMAGE TEXT EXTRACTION (Fallback Method)\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\n\nNote: This is a fallback method. For actual OCR text extraction from images, Tesseract.js library is required.\n\nIn a production environment, this would contain the actual text extracted from your image using OCR technology.';
    
    console.log('📝 FALLBACK IMAGE TEXT:');
    console.log('---START OF FALLBACK TEXT---');
    console.log(extractedText);
    console.log('---END OF FALLBACK TEXT---');
    
    showNotification('Image processed with fallback method. Check console.', 'info');
}

function extractTextFromPpt(file) {
    console.log('📊 PowerPoint text extraction...');
    console.log('⚠️ PowerPoint extraction has limited support');
    
    extractedText = 'POWERPOINT TEXT EXTRACTION\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\n\nNote: PowerPoint files require specialized libraries for full text extraction.\nFor better results, consider converting your PowerPoint to PDF format.\n\nThis is a placeholder for PowerPoint text extraction functionality.';
    
    console.log('📝 POWERPOINT TEXT:');
    console.log('---START OF PPT TEXT---');
    console.log(extractedText);
    console.log('---END OF PPT TEXT---');
    
    showNotification('PowerPoint processed. For better extraction, convert to PDF.', 'info');
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

    console.log('🤖 Generate button clicked!');
    console.log('👋 Hi there! Hugging Face integration coming soon...');
    console.log('📋 Question Generation Parameters:');
    console.log('   • Question Type:', questionType);
    console.log('   • Number of Questions:', numQuestions);
    console.log('   • Difficulty:', difficulty);
    console.log('   • File:', currentFile.name);
    console.log('   • Text Length:', extractedText.length, 'characters');
    console.log('🚀 Ready for Hugging Face API integration!');

    showNotification('Hi! Check console - Hugging Face integration ready!', 'info');

    // Call Hugging Face API function (placeholder for now)
    generateQuestionsWithHuggingFace(extractedText, questionType, numQuestions, difficulty);
}

// Hugging Face Integration Function (placeholder)
function generateQuestionsWithHuggingFace(text, questionType, numQuestions, difficulty) {
    console.log('🤗 Hugging Face API call would happen here...');
    console.log('📝 Text to process:', text.substring(0, 200) + '...');
    console.log('⚙️ Processing with Hugging Face models...');
    
    // Simulate API delay
    setTimeout(function() {
        console.log('✅ Hugging Face API response received!');
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
