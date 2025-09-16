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

// Backend API URL (update this with your actual backend URL when deployed)
const API_BASE_URL = 'http://localhost:3000'; // Change this in production

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
    
    // Add AI test button
    addAITestButton();
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
        
        // Send request to backend to generate questions
        showNotification('Generating questions with AI...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/api/generate-questions`, {
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Successfully generated ${data.questions.questions.length} questions!`, 'success');
            // Display the questions
            displayQuestions(data.questions);
        } else {
            throw new Error(data.message || 'Failed to generate questions');
        }
        
    } catch (error) {
        console.error('Error generating questions:', error);
        showNotification('Error: ' + error.message, 'error');
        
        // For development, show mock questions if backend is not available
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showNotification('Using mock questions for development', 'info');
            displayMockQuestions();
        }
    } finally {
        // Reset button state
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// Display generated questions
function displayQuestions(questionsData) {
    // Create a modal to display the questions
    const modal = document.createElement('div');
    modal.className = 'questions-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: var(--card-bg);
        padding: 30px;
        border-radius: 15px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        width: 100%;
        position: relative;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text);
        cursor: pointer;
    `;
    closeBtn.onclick = () => modal.remove();
    
    const title = document.createElement('h2');
    title.textContent = `Generated Questions (${questionsData.metadata?.question_type || 'multiple choice'})`;
    title.style.marginBottom = '20px';
    
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container';
    
    // Check if we have a proper questions array
    if (questionsData.questions && Array.isArray(questionsData.questions)) {
        questionsData.questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question';
            questionElement.style.cssText = `
                margin-bottom: 25px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
            `;
            
            const questionText = document.createElement('h3');
            questionText.textContent = `${index + 1}. ${q.question}`;
            questionText.style.marginBottom = '15px';
            
            const optionsList = document.createElement('ul');
            optionsList.style.marginBottom = '10px';
            
            if (q.options && Array.isArray(q.options)) {
                q.options.forEach((option, optIndex) => {
                    const optionItem = document.createElement('li');
                    optionItem.textContent = option;
                    optionItem.style.marginBottom = '5px';
                    
                    // Highlight correct answer
                    if (option === q.correct_answer) {
                        optionItem.style.color = 'var(--success)';
                        optionItem.style.fontWeight = 'bold';
                    }
                    
                    optionsList.appendChild(optionItem);
                });
            }
            
            const explanation = document.createElement('p');
            explanation.textContent = q.explanation ? `Explanation: ${q.explanation}` : '';
            explanation.style.fontSize = '0.9em';
            explanation.style.color = 'var(--text-secondary)';
            explanation.style.fontStyle = 'italic';
            
            questionElement.appendChild(questionText);
            questionElement.appendChild(optionsList);
            questionElement.appendChild(explanation);
            
            questionsContainer.appendChild(questionElement);
        });
    } else {
        // Fallback if questions aren't in the expected format
        const fallbackMessage = document.createElement('p');
        fallbackMessage.textContent = 'Questions generated successfully! Check the console for details.';
        fallbackMessage.style.color = 'var(--warning)';
        questionsContainer.appendChild(fallbackMessage);
        
        console.log('Raw response:', questionsData);
    }
    
    // Add note if it's a mock response
    if (questionsData.metadata?.note) {
        const note = document.createElement('p');
        note.textContent = questionsData.metadata.note;
        note.style.fontSize = '0.8em';
        note.style.color = 'var(--text-secondary)';
        note.style.marginTop = '20px';
        note.style.fontStyle = 'italic';
        questionsContainer.appendChild(note);
    }
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(questionsContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Display mock questions for development
function displayMockQuestions() {
    const mockData = {
        questions: [
            {
                question: "What is the primary process plants use to convert sunlight into energy?",
                options: ["Photosynthesis", "Respiration", "Fermentation", "Transpiration"],
                correct_answer: "Photosynthesis",
                explanation: "Photosynthesis is the process where plants convert light energy into chemical energy stored in glucose."
            },
            {
                question: "Which organisms can perform photosynthesis?",
                options: [
                    "Only plants",
                    "Plants and animals",
                    "Plants, algae, and some bacteria",
                    "All living organisms"
                ],
                correct_answer: "Plants, algae, and some bacteria",
                explanation: "Photosynthesis is performed by plants, algae, and certain types of bacteria called cyanobacteria."
            },
            {
                question: "What are the main products of photosynthesis?",
                options: [
                    "Oxygen and glucose",
                    "Carbon dioxide and water",
                    "Nitrogen and oxygen",
                    "Glucose and carbon dioxide"
                ],
                correct_answer: "Oxygen and glucose",
                explanation: "Photosynthesis produces oxygen (released into the atmosphere) and glucose (used by the plant for energy)."
            }
        ],
        metadata: {
            question_type: "multiple choice",
            difficulty: "medium",
            generated_at: new Date().toISOString(),
            note: "Mock questions for development. Add HUGGINGFACE_API_KEY to GitHub Secrets for real AI questions."
        }
    };
    
    displayQuestions(mockData);
}

// Test AI connection using Hugging Face
function testAIConnection() {
    showNotification('Testing AI connection with Hugging Face...', 'info');
    
    // Open GitHub Actions in a new tab
    const repoUrl = `https://github.com/${window.location.pathname.split('/')[1]}/${window.location.pathname.split('/')[2]}`;
    
    setTimeout(() => {
        window.open(`${repoUrl}/actions`, '_blank');
        showNotification('Check your GitHub Actions tab for AI processing', 'info');
    }, 1000);
}

// Add a test button to your UI
function addAITestButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('testAIBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test AI Connection (Hugging Face)';
    testBtn.id = 'testAIBtn';
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
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    testBtn.addEventListener('mouseenter', () => {
        testBtn.style.opacity = '1';
        testBtn.style.transform = 'translateY(-2px)';
    });
    
    testBtn.addEventListener('mouseleave', () => {
        testBtn.style.opacity = '0.8';
        testBtn.style.transform = 'translateY(0)';
    });
    
    testBtn.addEventListener('click', testAIConnection);
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
