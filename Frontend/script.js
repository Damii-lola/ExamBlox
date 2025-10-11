// script.js - COMPLETE FRONTEND WITH YOUR WORKING TEXT EXTRACTION
let isUserLoggedIn = false;
let currentUser = null;
let currentFile = null;
let extractedText = '';

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

// Helper function to call backend
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
  console.log('ExamBlox initialized - Text Extraction Active');
  checkAuthState();
  initializeAuth();
  initializeFileUpload(); // YOUR WORKING CODE
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

// ========== YOUR WORKING FILE UPLOAD CODE ==========
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
    showNotification('Extracting text from PDF... Please wait.', 'info');
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const typedarray = new Uint8Array(e.target.result);
        
        pdfjsLib.getDocument({
            data: typedarray,
            stopAtErrors: false,
            disableFontFace: true,
            isEvalSupported: false,
            maxImageSize: -1
        }).promise.then(function(pdf) {
            console.log('📖 PDF loaded, pages:', pdf.numPages);
            extractedText = '';
            let processedPages = 0;
            let failedPages = 0;
            const totalPages = pdf.numPages;
            
            const processPage = function(pageNum) {
                return pdf.getPage(pageNum).then(function(page) {
                    console.log('📑 Processing page', pageNum);
                    return page.getTextContent();
                }).then(function(textContent) {
                    const pageText = textContent.items.map(function(item) {
                        return item.str;
                    }).join(' ');
                    
                    if (pageText.trim().length > 0) {
                        extractedText += 'PAGE ' + pageNum + ':\n' + pageText + '\n\n';
                        console.log('✅ Page', pageNum, 'extracted:', pageText.length, 'chars');
                    } else {
                        console.log('⚠️ Page', pageNum, 'is empty or unreadable');
                        failedPages++;
                    }
                    
                    processedPages++;
                    
                    const progress = Math.round((processedPages / totalPages) * 100);
                    showNotification(`Processing PDF: ${progress}% (${processedPages}/${totalPages} pages)`, 'info');
                    
                }).catch(function(pageError) {
                    console.error('❌ Error on page', pageNum, ':', pageError.message);
                    failedPages++;
                    processedPages++;
                    extractedText += 'PAGE ' + pageNum + ': [Could not extract - corrupted or image-based]\n\n';
                });
            };
            
            let pagePromises = [];
            for (let i = 1; i <= totalPages; i++) {
                pagePromises.push(processPage(i));
            }
            
            Promise.all(pagePromises).then(function() {
                console.log('✅ PDF extraction completed!');
                console.log('📊 Total pages:', totalPages);
                console.log('📊 Processed:', processedPages);
                console.log('📊 Failed/Empty:', failedPages);
                console.log('📝 FULL EXTRACTED TEXT:');
                console.log('---START OF PDF TEXT---');
                console.log(extractedText);
                console.log('---END OF PDF TEXT---');
                console.log('📊 Total text length:', extractedText.length, 'characters');
                
                // CHECK IF SCANNED PDF (image-based)
                if (extractedText.trim().length < 100 || failedPages > totalPages / 2) {
                    console.warn('⚠️ SCANNED/IMAGE-BASED PDF DETECTED!');
                    console.warn('📸 Attempting OCR extraction as fallback...');
                    
                    showNotification('This appears to be a scanned PDF. Attempting OCR extraction...', 'warning');
                    
                    // Use OCR as fallback for scanned PDFs
                    extractTextFromScannedPdf(file, pdf, totalPages);
                } else {
                    showNotification(`PDF processed successfully! Extracted from ${processedPages - failedPages}/${totalPages} pages.`, 'success');
                }
            });
            
        }).catch(function(error) {
            console.error('❌ Error loading PDF:', error);
            console.error('Error details:', error.message);
            
            if (error.message.includes('Invalid PDF')) {
                showNotification('This PDF file is corrupted or invalid. Try re-saving it.', 'error');
                extractedText = 'ERROR: Invalid or corrupted PDF file.\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\n\nSuggestions:\n- Re-save the PDF from its source\n- Try converting to a different format\n- Use a PDF repair tool\n- The file may be password protected';
            } else if (error.message.includes('password')) {
                showNotification('This PDF is password protected.', 'error');
                extractedText = 'ERROR: Password protected PDF.\n\nFile: ' + file.name + '\n\nPlease remove password protection and try again.';
            } else {
                showNotification('Failed to process PDF. File may be corrupted.', 'error');
                extractedText = 'ERROR: Could not process PDF.\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\nError: ' + error.message + '\n\nThis file may be:\n- Corrupted\n- Image-based (needs OCR)\n- In an unsupported PDF version';
            }
            
            console.log('📝 ERROR TEXT SET:');
            console.log('---START OF ERROR TEXT---');
            console.log(extractedText);
            console.log('---END OF ERROR TEXT---');
        });
    };
    
    reader.onerror = function(error) {
        console.error('❌ FileReader error:', error);
        showNotification('Error reading PDF file', 'error');
        extractedText = 'ERROR: Could not read PDF file.\n\nFile: ' + file.name + '\n\nThe file may be corrupted or access was denied.';
    };
    
    reader.readAsArrayBuffer(file);
}

// NEW FUNCTION: Extract text from scanned PDFs using OCR
function extractTextFromScannedPdf(file, pdf, totalPages) {
    console.log('🖼️ Starting OCR extraction for scanned PDF...');
    
    // Check if Tesseract is loaded
    if (typeof Tesseract === 'undefined') {
        console.log('📦 Loading Tesseract.js for OCR...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
        script.onload = function() {
            console.log('✅ Tesseract.js loaded successfully');
            performPdfOcr(pdf, totalPages);
        };
        script.onerror = function() {
            console.error('❌ Failed to load Tesseract.js');
            showNotification('Cannot perform OCR on scanned PDF. Please convert to images first.', 'error');
            extractedText = 'SCANNED PDF DETECTED\n\nThis is an image-based/scanned PDF.\n\nTo extract text:\n1. Convert PDF to images (PNG/JPG)\n2. Upload images individually for OCR\n3. Or use a PDF OCR tool first\n\nFile: ' + file.name;
        };
        document.head.appendChild(script);
    } else {
        performPdfOcr(pdf, totalPages);
    }
}

function performPdfOcr(pdf, totalPages) {
    console.log('🔄 Performing OCR on', totalPages, 'pages...');
    showNotification(`Starting OCR on ${totalPages} pages. This will take several minutes...`, 'info');
    
    extractedText = '';
    let completedPages = 0;
    
    const processPageOcr = function(pageNum) {
        return pdf.getPage(pageNum).then(function(page) {
            const scale = 2.0;
            const viewport = page.getViewport({ scale: scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            return page.render({
                canvasContext: context,
                viewport: viewport
            }).promise.then(function() {
                // Convert canvas to blob for Tesseract
                return new Promise(function(resolve) {
                    canvas.toBlob(function(blob) {
                        console.log('📸 Rendered page', pageNum, 'to image');
                        
                        Tesseract.recognize(blob, 'eng', {
                            logger: function(m) {
                                if (m.status === 'recognizing text') {
                                    const progress = Math.round(m.progress * 100);
                                    if (progress % 20 === 0) {
                                        console.log(`🔄 Page ${pageNum} OCR: ${progress}%`);
                                    }
                                }
                            }
                        }).then(function(result) {
                            const pageText = result.data.text;
                            extractedText += `PAGE ${pageNum} (OCR - Confidence: ${Math.round(result.data.confidence)}%):\n${pageText}\n\n`;
                            
                            completedPages++;
                            const totalProgress = Math.round((completedPages / totalPages) * 100);
                            showNotification(`OCR Progress: ${totalProgress}% (${completedPages}/${totalPages} pages)`, 'info');
                            
                            console.log(`✅ Page ${pageNum} OCR complete:`, pageText.length, 'chars');
                            
                            resolve();
                        }).catch(function(error) {
                            console.error(`❌ OCR failed on page ${pageNum}:`, error);
                            extractedText += `PAGE ${pageNum}: [OCR extraction failed]\n\n`;
                            completedPages++;
                            resolve();
                        });
                    });
                });
            });
        });
    };
    
    // Process pages sequentially (to avoid overwhelming system)
    let ocrPromise = Promise.resolve();
    for (let i = 1; i <= Math.min(totalPages, 50); i++) { // Limit to 50 pages
        ocrPromise = ocrPromise.then(() => processPageOcr(i));
    }
    
    ocrPromise.then(function() {
        console.log('✅ OCR extraction completed!');
        console.log('📝 FINAL OCR TEXT:');
        console.log('---START OF OCR TEXT---');
        console.log(extractedText);
        console.log('---END OF OCR TEXT---');
        console.log('📊 Total text length:', extractedText.length, 'characters');
        
        if (extractedText.trim().length > 100) {
            showNotification(`OCR completed! Extracted text from ${completedPages} pages.`, 'success');
        } else {
            showNotification('OCR completed but extracted very little text. Image quality may be too low.', 'warning');
        }
    });
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
    showNotification('Extracting text from Word document...', 'info');
    
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
            
            // Check if extraction was successful
            if (extractedText.trim().length < 50) {
                console.warn('⚠️ Very little text extracted from Word document');
                showNotification('Word document processed but extracted very little text. File may be corrupted.', 'warning');
                extractedText += '\n\n[Warning: Very little text was extracted. The document may be:\n- Corrupted\n- Mostly images/graphics\n- In an unsupported format\n- Empty]';
            } else {
                showNotification('Word document processed successfully!', 'success');
            }
        }).catch(function(error) {
            console.error('❌ Error extracting from Word document:', error);
            console.error('Error details:', error.message);
            
            showNotification('Failed to process Word document. File may be corrupted.', 'error');
            
            extractedText = 'ERROR: Could not process Word document.\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\nError: ' + error.message + '\n\nThis file may be:\n- Corrupted\n- In an old format (.doc instead of .docx)\n- Password protected\n- Not a valid Word document\n\nTry:\n- Re-saving as .docx format\n- Converting to PDF first\n- Copying text to a new document';
            
            console.log('📝 ERROR TEXT SET:');
            console.log('---START OF ERROR TEXT---');
            console.log(extractedText);
            console.log('---END OF ERROR TEXT---');
        });
    };
    
    reader.onerror = function(error) {
        console.error('❌ FileReader error:', error);
        showNotification('Error reading Word document', 'error');
        extractedText = 'ERROR: Could not read Word document.\n\nFile: ' + file.name + '\n\nThe file may be corrupted or access was denied.';
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
    showNotification('Extracting text from image... This may take 1-2 minutes.', 'info');
    
    Tesseract.recognize(file, 'eng', {
        logger: function(m) {
            if (m.status === 'recognizing text') {
                const progress = Math.round(m.progress * 100);
                console.log('🔄 OCR Progress:', progress + '%');
                
                // Update notification every 10%
                if (progress % 10 === 0 || progress === 100) {
                    showNotification(`OCR Progress: ${progress}% - Please wait...`, 'info');
                }
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
        console.log('📊 Confidence:', Math.round(result.data.confidence) + '%');
        
        if (extractedText.trim().length < 20) {
            console.warn('⚠️ Very little text detected in image');
            showNotification(`OCR complete but detected very little text. Confidence: ${Math.round(result.data.confidence)}%`, 'warning');
            extractedText += '\n\n[Warning: Very little text detected. The image may be:\n- Low quality/blurry\n- Handwritten (not supported)\n- Not contain much text\n- Too small/large]';
        } else if (result.data.confidence < 60) {
            showNotification(`OCR complete but confidence is low (${Math.round(result.data.confidence)}%). Text may be inaccurate.`, 'warning');
        } else {
            showNotification(`OCR completed successfully! Confidence: ${Math.round(result.data.confidence)}%`, 'success');
        }
    }).catch(function(error) {
        console.error('❌ OCR extraction failed:', error);
        console.error('Error details:', error.message);
        
        showNotification('Failed to extract text from image.', 'error');
        
        extractedText = 'ERROR: Could not extract text from image.\n\nFile: ' + file.name + '\nSize: ' + formatFileSize(file.size) + '\nError: ' + error.message + '\n\nPossible reasons:\n- Image quality too low\n- Handwritten text (not supported)\n- No text in image\n- File corrupted\n\nTry:\n- Using a higher quality image\n- Converting to PDF first\n- Ensuring text is clear and typed';
        
        console.log('📝 ERROR TEXT SET:');
        console.log('---START OF ERROR TEXT---');
        console.log(extractedText);
        console.log('---END OF ERROR TEXT---');
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
    if (!isUserLoggedIn) {
        showNotification('Please sign in first', 'error');
        showAuthModal('login');
        return;
    }

    if (!currentFile) {
        showNotification('Please select a file first', 'error');
        return;
    }
    
    if (!extractedText || extractedText.trim().length < 50) {
        showNotification('Not enough text extracted from file. Please try a different file or format.', 'error');
        console.error('❌ Insufficient text for question generation');
        console.error('Extracted text length:', extractedText ? extractedText.length : 0);
        
        // Show helpful message
        const helpModal = document.createElement('div');
        helpModal.className = 'modal';
        helpModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2 style="color: var(--error);">⚠️ Insufficient Text</h2>
                <p>We couldn't extract enough text from your file to generate questions.</p>
                <h3 style="margin-top: 20px;">Possible reasons:</h3>
                <ul style="text-align: left; line-height: 1.8;">
                    <li>📄 PDF is image-based (scanned) - needs OCR</li>
                    <li>🔒 File is corrupted or password protected</li>
                    <li>🖼️ Document contains mostly images</li>
                    <li>❌ File format not fully supported</li>
                </ul>
                <h3 style="margin-top: 20px;">Try this:</h3>
                <ul style="text-align: left; line-height: 1.8;">
                    <li>✅ Use a text-based PDF (not scanned)</li>
                    <li>✅ Convert to .txt or .docx format</li>
                    <li>✅ Re-save the file from its original source</li>
                    <li>✅ Check console logs for more details</li>
                </ul>
                <button onclick="this.parentElement.parentElement.remove()" style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 20px;">
                    Got it
                </button>
            </div>
        `;
        document.body.appendChild(helpModal);
        return;
    }

    const questionType = document.querySelector('.upload-options select').value || 'Multiple Choice';
    const numQuestions = document.querySelector('.upload-options input[type="range"]').value || '10';
    const difficultySelects = document.querySelectorAll('.upload-options select');
    const difficulty = difficultySelects.length > 1 ? difficultySelects[1].value : 'Medium';

    console.log('✅ Starting question generation...');
    console.log('📊 Text length:', extractedText.length, 'characters');
    console.log('📊 Settings:', questionType, numQuestions, difficulty);
    
    showNotification('Generating questions...', 'info');
    showProcessingProgress();
    
    // Call backend with extracted text
    callBackendAPI(extractedText, questionType, numQuestions, difficulty);
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
          fileName: currentFile.name,
          questionType: questionType,
          difficulty: difficulty,
          totalQuestions: result.data.questions.length,
          generatedAt: new Date().toISOString()
        }
      };
      
      localStorage.setItem('examblox_questions', JSON.stringify(questionData));
      saveActivityToDashboard(questionData, [currentFile], questionType, numQuestions, difficulty);
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
  
  if (activities.length > 50) {
    activities.splice(50);
  }
  
  localStorage.setItem('examblox_activities', JSON.stringify(activities));
  
  const userStats = JSON.parse(localStorage.getItem('examblox_user_stats') || '{}');
  userStats.totalQuestions = (userStats.totalQuestions || 0) + questionData.questions.length;
  userStats.filesProcessed = (userStats.filesProcessed || 0) + selectedFiles.length;
  userStats.studySessions = (userStats.studySessions || 0) + 1;
  userStats.monthlyQuestions = (userStats.monthlyQuestions || 0) + questionData.questions.length;
  userStats.monthlyFiles = (userStats.monthlyFiles || 0) + selectedFiles.length;
  
  localStorage.setItem('examblox_user_stats', JSON.stringify(userStats));
  
  console.log('Activity saved to dashboard');
}

function showProcessingProgress() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'progress-modal';
  modal.innerHTML = `<div class="modal-content" style="max-width: 500px;">
    <h2>Generating Questions</h2>
    <p style="text-align: center; color: var(--primary-light); margin-bottom: 20px;">Using Groq AI</p>
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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========== AUTH MODALS (Keep from previous version) ==========
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
        
        ${isLogin ? `
        <div style="text-align: right; margin-top: -10px;">
          <a href="#" id="forgot-password-link" style="color: var(--primary-light); text-decoration: none; font-size: 0.9rem;">
            Forgot Password?
          </a>
        </div>
        ` : ''}
        
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

  // Forgot Password Link
  if (isLogin) {
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        closeAuthModal();
        showForgotPasswordModal();
      });
    }
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

// ===== FORGOT PASSWORD =====
function showForgotPasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'forgot-password-modal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="close-modal" onclick="closeForgotPasswordModal()">&times;</div>
      <h2>Reset Your Password</h2>
      <p class="modal-subtitle">Enter your email to receive a reset code</p>
      
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

  document.getElementById('forgot-password-form').addEventListener('submit', function(e) {
    e.preventDefault();
    sendPasswordResetCode();
  });

  document.getElementById('back-to-login').addEventListener('click', function(e) {
    e.preventDefault();
    closeForgotPasswordModal();
    showAuthModal('login');
  });
}

async function sendPasswordResetCode() {
  const email = document.getElementById('forgot-email').value.trim();
  
  if (!email) {
    showNotification('Please enter your email', 'error');
    return;
  }

  try {
    showNotification('Sending reset code...', 'info');

    const response = await fetch(`${BACKEND_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: email })
    });

    const result = await response.json();

    if (result.success) {
      closeForgotPasswordModal();
      showResetPasswordOTPModal(email);
      showNotification('Reset code sent to your email!', 'success');
    } else {
      showNotification(result.error || 'User not found', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) document.body.removeChild(modal);
}

function showResetPasswordOTPModal(email) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'reset-otp-modal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="close-modal" onclick="closeResetOTPModal()">&times;</div>
      <h2>Enter Reset Code</h2>
      <p class="modal-subtitle">We've sent a 6-digit code to ${email}</p>
      
      <form id="reset-otp-form" style="display: flex; flex-direction: column; gap: 20px;">
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
        <a href="#" id="resend-reset-code" style="color: var(--primary-light); text-decoration: none; margin-right: 15px;">
          Resend Code
        </a>
        <a href="#" id="back-to-login-reset" style="color: var(--primary-light); text-decoration: none;">
          Back to Login
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  setupPasswordToggle('new-password', 'toggle-new-password');
  setupPasswordToggle('confirm-new-password', 'toggle-confirm-new-password');

  document.getElementById('reset-otp-form').addEventListener('submit', function(e) {
    e.preventDefault();
    resetPassword(email);
  });

  document.getElementById('resend-reset-code').addEventListener('click', function(e) {
    e.preventDefault();
    closeResetOTPModal();
    showForgotPasswordModal();
  });

  document.getElementById('back-to-login-reset').addEventListener('click', function(e) {
    e.preventDefault();
    closeResetOTPModal();
    showAuthModal('login');
  });
}

async function resetPassword(email) {
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
    showNotification('Resetting password...', 'info');

    const response = await fetch(`${BACKEND_URL}/api/reset-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
        otp: otp,
        newPassword: newPassword
      })
    });

    const result = await response.json();

    if (result.success) {
      closeResetOTPModal();
      showNotification('Password reset successful! Please log in.', 'success');
      setTimeout(() => showAuthModal('login'), 1500);
    } else {
      showNotification(result.error || 'Invalid or expired code', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

function closeResetOTPModal() {
  const modal = document.getElementById('reset-otp-modal');
  if (modal) document.body.removeChild(modal);
}

// ===== SIGNUP OTP =====
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

// ===== USER DROPDOWN =====
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
      window.location.href = 'dashboard.html';
    });
  }
  
  const settingsBtn = document.getElementById('dropdown-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'settings.html';
    });
  }
  
  const adminBtn = document.getElementById('dropdown-admin-panel');
  if (adminBtn) {
    adminBtn.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Admin Panel - Coming Soon!');
    });
  }
  
  const logoutBtn = document.getElementById('dropdown-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById('user-dropdown-menu');
  if (dropdown) dropdown.classList.toggle('hidden');
}

document.addEventListener('click', function(event) {
  const dropdown = document.querySelector('.user-dropdown');
  const dropdownMenu = document.getElementById('user-dropdown-menu');
  if (dropdown && dropdownMenu && !dropdown.contains(event.target)) {
    dropdownMenu.classList.add('hidden');
  }
});

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

// ===== SUPER FIXED NOTIFICATION SYSTEM - NO MORE TRIPPING =====
let currentNotification = null;

function showNotification(message, type) {
    // Remove any existing notification immediately
    if (currentNotification && currentNotification.parentElement) {
        currentNotification.parentElement.removeChild(currentNotification);
        currentNotification = null;
    }

    const notification = document.createElement('div');
    
    // Set styling directly
    let bgColor = '';
    if (type === 'success') {
        bgColor = '#4CAF50';
    } else if (type === 'error') {
        bgColor = '#f44336';
    } else if (type === 'info') {
        bgColor = '#2196F3';
    } else {
        bgColor = '#ff9800';
    }
    
    notification.innerHTML = `
        <div style="
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
            z-index: 99999;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            font-family: 'Poppins', sans-serif;
        ">
            <span style="flex: 1; line-height: 1.4;">${message}</span>
            <button onclick="this.parentElement.parentElement.removeChild(this.parentElement)" style="
                background: none;
                border: none;
                color: white;
                font-size: 22px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                opacity: 0.8;
            ">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);
    currentNotification = notification.firstElementChild;

    // Auto remove after 5 seconds
    setTimeout(function() {
        try {
            if (notification && notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        } catch(e) {
            // Silently ignore if already removed
        }
        currentNotification = null;
    }, 5000);
}

// ===== UTILITY FUNCTIONS =====
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
    
    // Add notification animations to page
    addNotificationAnimations();
}

function addNotificationAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(400px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(400px);
            }
        }
        
        .notification {
            animation: slideInRight 0.3s ease-out;
        }
        
        @media (max-width: 768px) {
            .notification {
                right: 10px !important;
                left: 10px !important;
                max-width: calc(100% - 20px) !important;
                min-width: auto !important;
            }
        }
    `;
    document.head.appendChild(style);
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
  document.querySelectorAll('a[href="#features"], a[href="#pricing"], a[href="#testimonials"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.getAttribute('href').substring(1));
      if (target) {
        target.scrollIntoView({behavior: 'smooth'});
      }
    });
  });
}

console.log('✅ ExamBlox v2.0 FULLY LOADED!');
console.log('📄 Text Extraction: PDF, DOCX, TXT, Images (OCR)');
console.log('🖼️ Scanned PDF Support: OCR Fallback Enabled');
console.log('🔔 Notifications: Fixed & Stable');
console.log('🔐 Auth: Login, Signup, Forgot Password');
console.log('🚀 Ready to use!');
