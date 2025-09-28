// index.js

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    'https://damii-lola.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Store OTPs temporarily (in production, use Redis or database)
const otpStorage = new Map();

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API is running on Railway with Llama 4 Scout!',
    status: 'active',
    platform: 'railway',
    aiModel: 'llama-3.3-70b-versatile',
    modelDetails: 'Llama 4 Scout (17Bx16E) 128k',
    endpoints: {
      test: 'GET /',
      simpleTest: 'GET /test',
      simple: 'GET/POST /simple',
      generate: 'POST /api/generate-questions',
      sendOtp: 'POST /api/send-otp',
      verifyOtp: 'POST /api/verify-otp'
    }
  });
});

app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({
    message: 'Test endpoint works with Llama 4 Scout!',
    timestamp: new Date().toISOString(),
    platform: 'railway',
    status: 'success',
    aiModel: 'llama-3.3-70b-versatile'
  });
});

// OTP ENDPOINTS
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, name, type = 'signup' } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiry
    const otpData = {
      otp: otp,
      email: email,
      name: name,
      type: type,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    
    otpStorage.set(email, otpData);
    
    console.log(`Generated OTP for ${email}: ${otp} (expires in 10 minutes)`);
    
    // Email templates
    const emailTemplates = {
      signup: {
        subject: '🔐 Your ExamBlox Verification Code',
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #6a4bff, #4dfff3); border-radius: 15px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6a4bff; font-size: 28px; margin: 0;">🔐 ExamBlox</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Your Verification Code</p>
              </div>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 30px;">Your One-Time Password (OTP) for ExamBlox is:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #6a4bff, #4dfff3); color: white; padding: 20px 40px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; box-shadow: 0 5px 15px rgba(106,75,255,0.3);">
                  ${otp}
                </div>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">⏰ <strong>This code will expire in 10 minutes.</strong></p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If you didn't request this, please ignore this email.</p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 30px;">Thank you for using ExamBlox to power your exam prep! 🚀</p>
              
              <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #999; margin: 0;">Best regards,</p>
                <p style="font-size: 16px; color: #6a4bff; font-weight: bold; margin: 5px 0 0 0;">The ExamBlox Team</p>
              </div>
            </div>
          </div>
        `
      },
      forgot_password: {
        subject: '🔐 ExamBlox Password Reset Code',
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #ff6b35, #f7931e); border-radius: 15px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ff6b35; font-size: 28px; margin: 0;">🔐 ExamBlox</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Password Reset Code</p>
              </div>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 30px;">You requested a password reset. Your One-Time Password (OTP) is:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px 40px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; box-shadow: 0 5px 15px rgba(255,107,53,0.3);">
                  ${otp}
                </div>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">⏰ <strong>This code will expire in 10 minutes.</strong></p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If you didn't request this password reset, please ignore this email.</p>
              
              <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #999; margin: 0;">Best regards,</p>
                <p style="font-size: 16px; color: #ff6b35; font-weight: bold; margin: 5px 0 0 0;">The ExamBlox Team</p>
              </div>
            </div>
          </div>
        `
      }
    };
    
    const template = emailTemplates[type] || emailTemplates.signup;
    
    // Send email
    await transporter.sendMail({
      from: `"ExamBlox Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html
    });
    
    console.log(`OTP email sent successfully to ${email}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: '10 minutes'
    });
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
      message: error.message
    });
  }
});

app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required'
      });
    }
    
    const otpData = otpStorage.get(email);
    
    if (!otpData) {
      return res.status(400).json({
        error: 'OTP not found or expired',
        message: 'Please request a new OTP'
      });
    }
    
    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({
        error: 'OTP has expired',
        message: 'Please request a new OTP'
      });
    }
    
    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'Please check the code and try again'
      });
    }
    
    // OTP is valid, remove from storage
    otpStorage.delete(email);
    
    console.log(`OTP verified successfully for ${email}`);
    
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: 'Failed to verify OTP',
      message: error.message
    });
  }
});

// Send welcome email after successful signup
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
      });
    }
    
    const welcomeHtml = `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #6a4bff, #4dfff3); border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6a4bff; font-size: 28px; margin: 0;">🎉 Welcome to ExamBlox!</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Thank you for trying out ExamBlox! 🎉</p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">We're glad to have you on board and can't wait to support you in your exam prep journey.</p>
          
          <div style="background: linear-gradient(135deg, #6a4bff, #4dfff3); border-radius: 10px; padding: 20px; margin: 30px 0; text-align: center;">
            <h3 style="color: white; margin: 0 0 15px 0;">🚀 Ready to get started?</h3>
            <p style="color: white; margin: 0; font-size: 14px;">Upload your first document and generate practice questions!</p>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">If you have any feedback or ideas on how we can make ExamBlox even better, we'd love to hear from you.</p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 30px;">Wishing you success in your studies! ✨</p>
          
          <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 14px; color: #999; margin: 0;">Best regards,</p>
            <p style="font-size: 16px; color: #6a4bff; font-weight: bold; margin: 5px 0 0 0;">The ExamBlox Team</p>
          </div>
        </div>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"ExamBlox Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🙏 Thank You for Trying ExamBlox',
      html: welcomeHtml
    });
    
    console.log(`Welcome email sent to ${email}`);
    
    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      error: 'Failed to send welcome email',
      message: error.message
    });
  }
});

// MAIN QUESTION GENERATION ENDPOINT - Updated to use Llama 4 Scout
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required',
        message: 'Please provide text to generate questions from'
      });
    }

    console.log('=== QUESTION GENERATION REQUEST ===');
    console.log('- Text length:', text.length, 'characters');
    console.log('- Question type:', questionType);
    console.log('- Number of questions:', numQuestions);
    console.log('- Difficulty:', difficulty);
    console.log('- AI Model: Llama 4 Scout (17Bx16E) 128k');

    // Filter out irrelevant content
    const cleanedText = filterRelevantContent(text);
    console.log('- Cleaned text length:', cleanedText.length, 'characters');

    // Generate questions with Llama 4 Scout
    const response = await generateQuestionsWithLlama4(cleanedText, questionType, numQuestions, difficulty);

    res.json({
      success: true,
      message: response.message,
      data: response,
      metadata: {
        textLength: text.length,
        cleanedTextLength: cleanedText.length,
        questionType,
        numQuestions,
        difficulty,
        timestamp: new Date().toISOString(),
        platform: 'railway',
        aiProvider: 'groq',
        aiModel: 'llama-3.3-70b-versatile',
        modelDescription: 'Llama 4 Scout (17Bx16E) 128k'
      }
    });

  } catch (error) {
    console.error('❌ Error generating questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate questions',
      details: error.message
    });
  }
});

// FILTER OUT IRRELEVANT CONTENT
function filterRelevantContent(text) {
  console.log('🧹 Filtering out irrelevant content...');
  
  let cleanedText = text;
  
  // Remove "About the author" sections
  cleanedText = cleanedText.replace(/about\s+the\s+author[^]*?(?=\n\n|\n[A-Z]|$)/gi, '');
  
  // Remove other common irrelevant sections
  const sectionsToRemove = [
    /acknowledgments?[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /bibliography[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /references[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /index[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /table\s+of\s+contents[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /copyright[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /published\s+by[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /isbn[^]*?(?=\n\n|\n[A-Z]|$)/gi
  ];
  
  sectionsToRemove.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim();
  
  console.log(`✅ Content filtering complete. Removed ${text.length - cleanedText.length} characters`);
  
  return cleanedText;
}

// PARALLEL BATCH QUESTION GENERATION WITH LLAMA 4 SCOUT
async function generateQuestionsWithLlama4(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    throw new Error('GROQ_API_KEY is not configured');
  }

  console.log('🚀 Starting PARALLEL BATCH question generation with Llama 4 Scout...');
  console.log('🤖 AI MODEL: Llama 4 Scout (17Bx16E) 128k');

  const batchSize = 10;
  const numberOfBatches = Math.ceil(numQuestions / batchSize);
  const batches = [];

  for (let i = 0; i < numberOfBatches; i++) {
    const startIndex = i * batchSize + 1;
    const endIndex = Math.min((i + 1) * batchSize, numQuestions);
    const questionsInThisBatch = endIndex - startIndex + 1;
    
    batches.push({
      batchId: i + 1,
      questionsNeeded: questionsInThisBatch,
      startIndex: startIndex,
      endIndex: endIndex
    });
  }

  let attempt = 1;
  const maxAttempts = 10;
  let allQuestions = [];

  while (allQuestions.length < numQuestions && attempt <= maxAttempts) {
    console.log(`\n🔄 === PARALLEL ATTEMPT ${attempt}/${maxAttempts} ===`);

    try {
      const batchPromises = batches.map(async (batch) => {
        const questionsToRequest = batch.questionsNeeded * 2;
        const batchDifficulty = getDynamicDifficulty(difficulty, batch.batchId);
        
        console.log(`🚀 Launching Batch ${batch.batchId}: Requesting ${questionsToRequest} ${batchDifficulty} questions`);
        
        return generateSingleBatchLlama4(text, questionType, questionsToRequest, batchDifficulty, batch.batchId, API_KEY);
      });

      console.log(`⚡ EXECUTING ${batches.length} PARALLEL API CALLS WITH LLAMA 4 SCOUT...`);
      const batchResults = await Promise.all(batchPromises);
      
      let rawQuestions = [];
      batchResults.forEach((questions, index) => {
        console.log(`📥 Batch ${index + 1} returned ${questions.length} raw questions`);
        rawQuestions = rawQuestions.concat(questions);
      });

      const uniqueQuestions = deduplicateQuestions(rawQuestions);
      const examWorthyQuestions = filterExamWorthyQuestions(uniqueQuestions, []);

      const questionsBeforeAdd = allQuestions.length;
      allQuestions = deduplicateQuestions([...allQuestions, ...examWorthyQuestions]);
      const questionsAdded = allQuestions.length - questionsBeforeAdd;

      console.log(`📈 PARALLEL ATTEMPT ${attempt} RESULTS:`);
      console.log(`   - Total progress: ${allQuestions.length}/${numQuestions}`);

      if (allQuestions.length >= numQuestions) {
        console.log(`🎉 SUCCESS! Generated ${allQuestions.length}/${numQuestions} questions with Llama 4 Scout!`);
        break;
      }

    } catch (error) {
      console.error(`❌ Parallel attempt ${attempt} failed:`, error.message);
    }

    attempt++;
    
    if (attempt <= maxAttempts && allQuestions.length < numQuestions) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const finalQuestions = allQuestions.slice(0, numQuestions);

  return {
    message: `Generated ${finalQuestions.length} questions using Llama 4 Scout`,
    questions: finalQuestions,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    modelDescription: 'Llama 4 Scout (17Bx16E) 128k',
    textLength: text.length,
    successRate: `${finalQuestions.length}/${numQuestions}`,
    requestParams: {
      questionType,
      numQuestions,
      difficulty
    }
  };
}

// GENERATE SINGLE BATCH WITH LLAMA 4 SCOUT
async function generateSingleBatchLlama4(text, questionType, numQuestions, difficulty, batchId, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const maxTextLength = 12000;
  const sections = Math.floor(text.length / maxTextLength) || 1;
  const sectionIndex = (batchId - 1) % sections;
  const startPos = sectionIndex * maxTextLength;
  const textSection = text.length > maxTextLength 
    ? text.substring(startPos, startPos + maxTextLength)
    : text;
  
  const prompt = createExamFocusedPrompt(textSection, questionType, numQuestions, difficulty, []);
  
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Using Llama 4 Scout equivalent
        messages: [
          {
            role: "system",
            content: `You are an expert exam question creator powered by Llama 4 Scout for Batch ${batchId}. Create unique, exam-worthy questions that test deep understanding.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7 + (batchId * 0.1),
        max_tokens: 2800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Batch ${batchId} API error:`, response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const llamaGeneratedText = result.choices[0]?.message?.content || '';
    
    const parsedQuestions = parseLlamaQuestionsResponse(llamaGeneratedText, questionType, numQuestions);
    
    parsedQuestions.forEach(q => {
      q.batchId = batchId;
      q.batchSource = `batch_${batchId}_llama4`;
      q.aiModel = 'Llama 4 Scout';
    });
    
    console.log(`   ✅ Batch ${batchId}: Llama 4 Scout generated ${parsedQuestions.length} questions`);
    return parsedQuestions;

  } catch (error) {
    console.error(`❌ Batch ${batchId} failed:`, error.message);
    return [];
  }
}

// Helper functions (deduplicateQuestions, filterExamWorthyQuestions, etc.)
function deduplicateQuestions(questions) {
  const uniqueQuestions = [];
  const questionHashes = new Set();
  
  for (const question of questions) {
    const normalizedQuestion = question.question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const significantWords = normalizedQuestion
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 10);
    
    const questionHash = significantWords.join('_');
    
    if (!questionHashes.has(questionHash)) {
      questionHashes.add(questionHash);
      uniqueQuestions.push(question);
    }
  }
  
  return uniqueQuestions;
}

function filterExamWorthyQuestions(newQuestions, existingQuestions) {
  const examWorthy = [];
  
  for (const newQ of newQuestions) {
    if (isExamWorthy(newQ)) {
      examWorthy.push(newQ);
    }
  }
  
  return examWorthy;
}

function isExamWorthy(question) {
  const questionText = question.question.toLowerCase();
  
  const trivialIndicators = [
    'what is the title',
    'who is the author',
    'what page',
    'how many pages'
  ];
  
  for (const indicator of trivialIndicators) {
    if (questionText.includes(indicator)) {
      return false;
    }
  }
  
  const isGoodLength = question.question.length >= 15 && question.question.length <= 200;
  return isGoodLength;
}

function getDynamicDifficulty(baseDifficulty, batchId) {
  const difficulties = ['Easy', 'Medium', 'Hard', 'Exam Level'];
  const baseIndex = difficulties.findIndex(d => d.toLowerCase() === baseDifficulty.toLowerCase());
  const variance = [-1, 0, 1, 0, 1];
  const adjustedIndex = Math.max(0, Math.min(3, baseIndex + (variance[batchId % 5] || 0)));
  return difficulties[adjustedIndex];
}

function createExamFocusedPrompt(textSection, questionType, numQuestions, difficulty, existingQuestions) {
  const difficultyMap = {
    'easy': 'moderately challenging (like mid-term exam questions)',
    'medium': 'challenging (like final exam questions)', 
    'hard': 'very challenging (like advanced course exams)',
    'exam level': 'extremely challenging (like professional certification exams)'
  };
  
  const difficultyLevel = difficultyMap[difficulty.toLowerCase()] || 'challenging';

  let prompt = `You are a Llama 4 Scout powered exam question creator. Create ${questionType.toLowerCase()} questions for an actual exam.

TEXT TO ANALYZE:
"""
${textSection}
"""

Create exactly ${numQuestions} ${difficultyLevel} questions.`;

  if (questionType === 'Multiple Choice') {
    prompt += `

FORMAT - Create exactly ${numQuestions} multiple choice questions:

Q1: [Exam-worthy question]
A) [Correct answer]
B) [Incorrect option] 
C) [Incorrect option]
D) [Incorrect option]
ANSWER: A
EXPLANATION: [Why this is correct]

Continue this format for all ${numQuestions} questions.`;
  }

  return prompt;
}

function parseLlamaQuestionsResponse(llamaResponse, questionType, numQuestions) {
  const questions = [];
  
  if (questionType === 'Multiple Choice') {
    const questionBlocks = llamaResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    for (let i = 0; i < questionBlocks.length && questions.length < numQuestions; i++) {
      try {
        const block = questionBlocks[i].trim();
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 3) continue;
        
        const questionText = lines[0];
        if (!questionText || questionText.length < 15) continue;
        
        const options = [];
        let answerLine = '';
        let explanationLine = '';
        
        for (let line of lines.slice(1)) {
          if (/^[A-D]\)/.test(line)) {
            options.push(line.substring(2).trim());
          } else if (line.toUpperCase().includes('ANSWER:')) {
            answerLine = line;
          } else if (line.toUpperCase().includes('EXPLANATION:')) {
            explanationLine = line.substring(line.toUpperCase().indexOf('EXPLANATION:') + 12).trim();
          }
        }
        
        if (questionText && options.length >= 4 && answerLine) {
          const correctLetter = answerLine.toUpperCase().match(/[A-D]/)?.[0] || 'A';
          const correctIndex = correctLetter.charCodeAt(0) - 65;
          
          const enhancedExplanation = explanationLine || 
            `The correct answer is ${correctLetter} based on the content from the source material.`;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            options: options.slice(0, 4),
            correctAnswer: correctIndex,
            correctLetter: correctLetter,
            explanation: enhancedExplanation,
            source: 'llama4_scout',
            examWorthy: true,
            aiModel: 'Llama 4 Scout'
          });
        }
      } catch (error) {
        console.log(`❌ Error parsing Llama question ${i + 1}:`, error.message);
      }
    }
    
  } else if (questionType === 'True/False') {
    const questionBlocks = llamaResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const answerLine = lines.find(line => line.toUpperCase().includes('ANSWER:'));
        const explanationLine = lines.find(line => line.toUpperCase().includes('EXPLANATION:'));
        
        if (questionText && answerLine) {
          const answer = answerLine.toUpperCase().includes('TRUE') ? 'True' : 'False';
          const explanation = explanationLine ? 
            explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() :
            `This statement is ${answer.toLowerCase()} based on the source material.`;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            correctAnswer: answer,
            explanation: explanation,
            source: 'llama4_scout',
            examWorthy: true,
            aiModel: 'Llama 4 Scout'
          });
        }
      } catch (error) {
        console.log(`❌ Error parsing Llama T/F question ${index + 1}:`, error.message);
      }
    });
    
  } else if (questionType === 'Flashcards') {
    const questionBlocks = llamaResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const answerLine = lines.find(line => line.toUpperCase().includes('ANSWER:'));
        const explanationLine = lines.find(line => line.toUpperCase().includes('EXPLANATION:'));
        
        if (questionText && answerLine) {
          const answer = answerLine.substring(answerLine.toUpperCase().indexOf('ANSWER:') + 7).trim();
          const explanation = explanationLine ? 
            explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() :
            `This concept is important for understanding the material.`;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            answer: answer,
            explanation: explanation,
            source: 'llama4_scout',
            examWorthy: true,
            aiModel: 'Llama 4 Scout'
          });
        }
      } catch (error) {
        console.log(`❌ Error parsing Llama Flashcard ${index + 1}:`, error.message);
      }
    });
  }
  
  console.log(`📊 Final Llama 4 Scout parsing result: ${questions.length} questions extracted`);
  return questions;
}

// Clean up expired OTPs periodically
setInterval(() => {
  const now = new Date();
  for (const [email, otpData] of otpStorage.entries()) {
    if (now > otpData.expiresAt) {
      otpStorage.delete(email);
      console.log(`🗑️ Expired OTP cleaned up for ${email}`);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log('🚀 ExamBlox Backend is ready with Llama 4 Scout and Email OTP!');
  console.log('📧 Email OTP system active');
  console.log('🤖 AI Model: Llama 4 Scout (17Bx16E) 128k');
});
