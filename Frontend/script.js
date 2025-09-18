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

    console.log('Generate button clicked!');
    console.log('Hi there! Generate button is working!');
    console.log('Question Type:', questionType);
    console.log('Number of Questions:', numQuestions);
    console.log('Difficulty:', difficulty);
    console.log('File:', currentFile.name);
    console.log('Text Length:', extractedText.length, 'characters');

    showNotification('Connecting to backend...', 'info');

    // Show progress and call backend
    showProcessingProgress();
    callBackendAPI(extractedText, questionType, numQuestions, difficulty);
}

async function callBackendAPI(text, questionType, numQuestions, difficulty) {
    try {
        // Fixed URL - removed double slash
        const BACKEND_URL = 'https://exam-blox.vercel.app';
        
        console.log('Calling backend API...');
        console.log('URL:', `${BACKEND_URL}/api/generate-questions`);
        
        const response = await fetch(`${BACKEND_URL}/api/generate-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                questionType: questionType,
                numQuestions: parseInt(numQuestions),
                difficulty: difficulty
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        console.log('Backend response received!');
        console.log('Backend says:', result.message);
        console.log('Full response:', result);

        // Continue with existing progress simulation while API processes
        // The enhanced modal will show after progress completes
        
    } catch (error) {
        console.error('Error calling backend:', error);
        showNotification('Error connecting to backend: ' + error.message, 'error');
        
        // Close progress modal if it exists
        const progressModal = document.getElementById('progress-modal');
        if (progressModal) {
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

        // Only update if elements exist
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
            setTimeout(function() {
                const modal = document.getElementById('progress-modal');
                if (modal && document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                showEnhancedQuestionModal();
            }, 1000);
        }
    }, 200);
}

function showEnhancedQuestionModal() {
    const questionType = document.querySelector('.upload-options select').value || 'Multiple Choice';
    const numQuestions = document.querySelector('.upload-options input[type="range"]').value || '10';
    const difficultySelects = document.querySelectorAll('.upload-options select');
    const difficulty = difficultySelects.length > 1 ? difficultySelects[1].value : 'Medium';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = 
        '<div class="modal-content enhanced-modal">' +
            '<span class="close-modal">&times;</span>' +
            '<div class="modal-header">' +
                '<h2>🎯 Questions Generated Successfully!</h2>' +
                '<div class="modal-subtitle">' + questionType + ' • ' + numQuestions + ' Questions • ' + difficulty + ' Difficulty</div>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="file-info">' +
                    '<div class="info-item">' +
                        '<i class="fas fa-file"></i>' +
                        '<span><strong>Source:</strong> ' + currentFile.name + '</span>' +
                    '</div>' +
                    '<div class="info-item">' +
                        '<i class="fas fa-text-width"></i>' +
                        '<span><strong>Text Length:</strong> ' + extractedText.length + ' characters</span>' +
                    '</div>' +
                    '<div class="info-item">' +
                        '<i class="fas fa-clock"></i>' +
                        '<span><strong>Generated:</strong> ' + new Date().toLocaleTimeString() + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="question-preview">' +
                    '<h3>📝 Sample Question Preview:</h3>' +
                    '<div class="sample-question">' +
                        '<p><strong>Question 1:</strong> Based on the content from "' + currentFile.name + '", what is the main topic discussed?</p>' +
                        '<div class="options">' +
                            '<label><input type="radio" name="sample" disabled> A) Technology and Innovation</label>' +
                            '<label><input type="radio" name="sample" disabled> B) Business Strategy</label>' +
                            '<label><input type="radio" name="sample" disabled> C) Educational Methods</label>' +
                            '<label><input type="radio" name="sample" disabled> D) Research Methodology</label>' +
                        '</div>' +
                        '<div class="correct-answer">✅ <strong>Correct Answer:</strong> Based on your document content</div>' +
                    '</div>' +
                    '<div class="demo-note">' +
                        '<p><em>📋 This is a demo preview. In the full version, you would see all ' + numQuestions + ' questions with detailed explanations, answer keys, and references to your source material.</em></p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-actions">' +
                '<button class="action-btn primary-btn">📊 Start Practice Test</button>' +
                '<button class="action-btn secondary-btn">📥 Download PDF</button>' +
                '<button class="action-btn secondary-btn">📧 Email Questions</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(modal);

    // Add enhanced modal styles
    addEnhancedModalStyles();

    // Close functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Button functionality
    const buttons = modal.querySelectorAll('.action-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const text = btn.textContent;
            if (text.includes('Practice Test')) {
                showNotification('Practice test feature coming soon!', 'info');
                console.log('Practice test clicked - feature coming soon');
            } else if (text.includes('Download')) {
                showNotification('Download feature coming soon!', 'info');
                console.log('Download clicked - feature coming soon');
            } else if (text.includes('Email')) {
                showNotification('Email feature coming soon!', 'info');
                console.log('Email clicked - feature coming soon');
            }
        });
    });

    showNotification('Questions generated successfully!', 'success');
    console.log('Enhanced modal displayed with sample questions');
}

function addEnhancedModalStyles() {
    // Check if styles already added
    if (document.getElementById('enhanced-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'enhanced-modal-styles';
    style.textContent = `
        .enhanced-modal {
            max-width: 600px !important;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-body {
            margin-bottom: 25px;
        }

        .file-info {
            background: rgba(106, 75, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }

        .info-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            color: #eee;
        }

        .info-item i {
            margin-right: 10px;
            color: #9b6aff;
            width: 16px;
        }

        .question-preview {
            background: rgba(77, 255, 243, 0.05);
            border-radius: 8px;
            padding: 20px;
            border: 1px solid rgba(77, 255, 243, 0.2);
        }

        .question-preview h3 {
            margin-bottom: 15px;
            color: #4dfff3;
        }

        .sample-question {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .options {
            margin: 10px 0;
        }

        .options label {
            display: block;
            margin-bottom: 8px;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .options label:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .correct-answer {
            margin-top: 10px;
            padding: 8px;
            background: rgba(76, 175, 80, 0.2);
            border-radius: 4px;
            color: #4CAF50;
            font-size: 0.9rem;
        }

        .demo-note {
            background: rgba(255, 152, 0, 0.1);
            border-radius: 6px;
            padding: 12px;
            border-left: 3px solid #ff9800;
        }

        .modal-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .action-btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            min-width: 140px;
        }

        .primary-btn {
            background: linear-gradient(90deg, #6a4bff, #9b6aff);
            color: white;
        }

        .primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(106, 75, 255, 0.4);
        }

        .secondary-btn {
            background: rgba(77, 255, 243, 0.1);
            color: #4dfff3;
            border: 1px solid rgba(77, 255, 243, 0.3);
        }

        .secondary-btn:hover {
            background: rgba(77, 255, 243, 0.2);
            transform: translateY(-1px);
        }

        .progress-container {
            margin: 20px 0;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6a4bff, #4dfff3);
            width: 0%;
            transition: width 0.3s ease;
        }

        .progress-text {
            text-align: center;
            color: #eee;
            font-weight: 500;
            margin-bottom: 20px;
        }

        .progress-steps {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }

        .step-item {
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            font-size: 0.85rem;
            opacity: 0.5;
            transition: all 0.3s;
        }

        .step-item.active {
            opacity: 1;
            background: rgba(106, 75, 255, 0.3);
            color: #9b6aff;
        }
    `;
    document.head.appendChild(style);
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
