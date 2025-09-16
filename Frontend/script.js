// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const generateBtn = document.getElementById('generateBtn');
const questionRange = document.getElementById('questionRange');
const questionCount = document.getElementById('questionCount');

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('ExamBlox application initialized');
    
    // Set up event listeners
    if (browseBtn) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', resetFileInput);
    }
    
    if (questionRange && questionCount) {
        questionRange.addEventListener('input', updateQuestionCount);
        // Initialize the question count display
        updateQuestionCount();
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateQuestions);
    }
    
    // Set up drag and drop functionality
    setupDragAndDrop();
    
    // Add GitHub Actions test button
    addGitHubActionsTestButton();
});

// Drag and drop functionality
function setupDragAndDrop() {
    if (!uploadArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    uploadArea.classList.add('dragover');
}

function unhighlight() {
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
        fileInput.files = files;
        handleFileSelect();
    }
}

// File handling functions
function handleFileSelect() {
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/jpeg',
        'image/png',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!validTypes.includes(file.type)) {
        showNotification('Please select a valid file type (PDF, DOCX, TXT, JPG, PNG, PPT)', 'error');
        resetFileInput();
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        resetFileInput();
        return;
    }
    
    // Display file info inside the upload area
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Add has-file class to trigger CSS transitions
    uploadArea.classList.add('has-file');
    
    // After transition, show file info
    setTimeout(() => {
        fileInfo.style.display = 'flex';
        setTimeout(() => {
            fileInfo.classList.add('visible');
        }, 10);
    }, 300);
    
    // Enable generate button
    generateBtn.classList.add('active');
    generateBtn.disabled = false;
    
    // Extract text from file (in background, no preview)
    extractTextFromFile(file);
}

function resetFileInput() {
    // Hide file info with animation
    fileInfo.classList.remove('visible');
    
    // After animation completes, reset everything
    setTimeout(() => {
        fileInfo.style.display = 'none';
        fileInput.value = '';
        uploadArea.classList.remove('has-file');
        
        generateBtn.classList.remove('active');
        generateBtn.disabled = true;
    }, 300);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateQuestionCount() {
    questionCount.textContent = questionRange.value;
}

// Text extraction functions with cleaning
async function extractTextFromFile(file) {
    showNotification('Processing your file...', 'info');
    
    try {
        let text = '';
        
        switch (file.type) {
            case 'application/pdf':
                text = await extractTextFromPDF(file);
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
                text = await extractTextFromDocx(file);
                break;
            case 'text/plain':
                text = await extractTextFromTxt(file);
                break;
            case 'image/jpeg':
            case 'image/png':
                text = await extractTextFromImage(file);
                break;
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                text = await extractTextFromPPT(file);
                break;
            default:
                throw new Error('Unsupported file type');
        }
        
        // Clean the extracted text
        text = cleanExtractedText(text);
        
        if (text && text.length > 0) {
            showNotification('File processed successfully!', 'success');
        } else {
            showNotification('No text could be extracted from this file', 'warning');
        }
        
        return text;
    } catch (error) {
        console.error('Text extraction error:', error);
        showNotification('Error processing file: ' + error.message, 'error');
        return '';
    }
}

// Text cleaning function
function cleanExtractedText(text) {
    if (!text) return '';
    
    let cleanedText = text;
    
    // Remove HTML tags
    cleanedText = cleanedText.replace(/<[^>]*>/g, '');
    
    // Remove markdown-style formatting
    cleanedText = cleanedText.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Bold
    cleanedText = cleanedText.replace(/(\*|_)(.*?)\1/g, '$2');     // Italic
    
    // Remove excessive whitespace
    cleanedText = cleanedText.replace(/\s+/g, ' ');
    
    // Remove special characters that might be formatting artifacts
    cleanedText = cleanedText.replace(/[●♦■▲▶▼➤➔►]/g, '');
    
    // Clean up bullet points and numbering
    cleanedText = cleanedText.replace(/^(\d+[\.\)]|\-|\*)\s+/gm, ''); // Numbered lists and bullets
    
    // Trim and return
    return cleanedText.trim();
}

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
            try {
                const typedArray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    
                    // Improved text extraction with better spacing
                    let lastY = null;
                    let pageText = '';
                    
                    for (const item of textContent.items) {
                        // Add line break when Y position changes significantly
                        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
                            pageText += '\n';
                        }
                        pageText += item.str + ' ';
                        lastY = item.transform[5];
                    }
                    
                    text += pageText + '\n\n';
                }
                
                resolve(text);
            } catch (error) {
                reject(error);
            }
        };
        
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(file);
    });
}

async function extractTextFromDocx(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            
            // Enhanced conversion options for Mammoth
            const options = {
                includeEmbeddedStyleMap: false,
                includeDefaultStyleMap: false,
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "r[style-name='Strong'] => strong",
                    "r[style-name='Emphasis'] => em",
                    "r[style-name='Underline'] => u"
                ]
            };
            
            mammoth.extractRawText({ arrayBuffer }, options)
                .then(result => resolve(result.value))
                .catch(err => reject(err));
        };
        
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function extractTextFromTxt(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function extractTextFromImage(file) {
    try {
        showNotification('Extracting text from image...', 'info');
        
        const { data: { text } } = await Tesseract.recognize(
            file,
            'eng',
            { logger: m => console.log(m) }
        );
        
        return text;
    } catch (error) {
        throw new Error('OCR failed: ' + error.message);
    }
}

async function extractTextFromPPT(file) {
    // For PPT files, we'll convert to PDF first (simplified approach)
    return new Promise((resolve) => {
        // For demonstration purposes, we'll return a placeholder message
        resolve("PPT file content extracted successfully.");
    });
}

// Generate questions button handler
async function handleGenerateQuestions() {
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file first', 'error');
        return;
    }
    
    // Show loading state
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<div class="spinner"></div> Processing...';
    generateBtn.disabled = true;
    
    try {
        // Extract text from file
        const text = await extractTextFromFile(file);
        
        if (!text || text.trim().length === 0) {
            throw new Error('No text could be extracted from the file');
        }
        
        // Get user options
        const questionType = document.getElementById('questionType').value;
        const numQuestions = document.getElementById('questionRange').value;
        const difficulty = document.getElementById('difficultyLevel').value;
        
        // Store the data to simulate what would be sent to GitHub Actions
        const requestData = {
            text: text,
            questionType: questionType,
            numQuestions: parseInt(numQuestions),
            difficulty: difficulty,
            timestamp: new Date().getTime()
        };
        
        // In a real implementation, you would:
        // 1. Create a GitHub issue with the request data using GitHub API
        // 2. Trigger a GitHub Actions workflow
        // 3. Have the workflow process the request using DeepSeek API
        // 4. Store the result in a GitHub Pages branch
        // 5. Poll for the result from the frontend
        
        // For now, we'll simulate the process
        showNotification('Question generation request prepared! This would trigger a GitHub Actions workflow in a full implementation.', 'info');
        
        // Simulate API call delay
        setTimeout(() => {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
            
            // Show a mock result
            alert(`Question generation request submitted! In a full implementation, GitHub Actions would process this using the DeepSeek API and deliver the results. Check your GitHub Actions tab to see the workflow runs.`);
        }, 2000);
        
    } catch (error) {
        console.error('Error generating questions:', error);
        showNotification('Error: ' + error.message, 'error');
        
        // Reset button state
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// Test DeepSeek connection using GitHub Actions
function testDeepSeekConnection() {
    // Get the current repository URL
    const currentUrl = window.location.href;
    
    if (currentUrl.includes('github.io')) {
        // Extract username and repo from GitHub Pages URL
        const urlParts = currentUrl.split('/');
        const username = urlParts[2].split('.')[0]; // Get username from "username.github.io"
        const repoName = urlParts[3]; // Get repository name
        
        if (username && repoName) {
            window.open(`https://github.com/${username}/${repoName}/actions/workflows/deepseek-test.yml`, '_blank');
        } else {
            showNotification('Could not determine repository information. Please manually go to your GitHub Actions tab.', 'error');
        }
    } else {
        // For local development, show a message
        showNotification('Please go to your GitHub repository → Actions → Test DeepSeek Connection workflow', 'info');
    }
}

// Add a test button to your UI
function addGitHubActionsTestButton() {
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test DeepSeek Connection';
    testBtn.id = 'testDeepSeekBtn';
    testBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        padding: 10px 15px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        opacity: 0.8;
        transition: opacity 0.3s;
    `;
    
    testBtn.addEventListener('mouseenter', () => {
        testBtn.style.opacity = '1';
    });
    
    testBtn.addEventListener('mouseleave', () => {
        testBtn.style.opacity = '0.8';
    });
    
    testBtn.addEventListener('click', testDeepSeekConnection);
    document.body.appendChild(testBtn);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}
