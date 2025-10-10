// index.js - COMPLETE BACKEND with Forgot Password + File Processing
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS CONFIGURATION =====
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

app.use(cors(corsOptions));
app.use(express.json({ limit: '30mb' }));

// ===== MULTER CONFIGURATION (File Upload) =====
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// ===== DATABASE CONNECTION =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ===== EMAIL CONFIGURATION =====
let emailConfigured = false;
let verifiedSender = null;

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_VERIFIED_SENDER) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
  emailConfigured = true;
  console.log('✅ SendGrid configured');
}

// ===== OTP STORAGE =====
const otpStorage = new Map();

// ===== ROOT ENDPOINT =====
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API',
    status: 'active',
    features: ['User Auth', 'OTP', 'File Upload', 'Question Generation'],
    model: 'llama-3.1-8b-instant'
  });
});

// ===== USER ENDPOINTS =====
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, users: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, name, email, password, plan, role } = req.body;
    if (!username || !name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const { data: existing } = await supabase
      .from('users')
      .select('email, username')
      .or(`email.ilike.${email},username.ilike.${username}`)
      .limit(1);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, name, email, password, plan: plan || 'free', role: role || 'user' }])
      .select();
    if (error) throw error;
    res.json({ success: true, user: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, error: 'Credentials required' });
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${emailOrUsername},username.ilike.${emailOrUsername}`)
      .eq('password', password)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    res.json({ success: true, user: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { data, error } = await supabase
      .from('users')
      .update(req.body)
      .eq('email', email)
      .select();
    if (error) throw error;
    res.json({ success: true, user: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { error } = await supabase.from('users').delete().eq('email', email);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== OTP ENDPOINTS =====
app.post('/api/send-otp', async (req, res) => {
  try {
    if (!emailConfigured) {
      return res.status(503).json({ success: false, error: 'Email service not configured' });
    }

    const { email, name, type = 'signup' } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email and name required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = {
      otp: otp,
      email: email,
      name: name,
      type: type,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    
    otpStorage.set(email.toLowerCase(), otpData);
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    const emailTemplates = {
      signup: {
        subject: 'Your ExamBlox Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h1 style="color: #6a4bff; margin: 0 0 20px 0; font-size: 28px;">ExamBlox</h1>
                        <p style="font-size: 16px; color: #333; margin: 0 0 10px 0;">Hello <strong>${name}</strong>,</p>
                        <p style="color: #666; margin: 0 0 30px 0; font-size: 14px;">Your verification code is:</p>
                        <div style="background: #6a4bff; color: white; padding: 20px 40px; border-radius: 8px; display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
                          ${otp}
                        </div>
                        <p style="margin: 30px 0 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404; font-size: 14px;">
                          ⏰ This code expires in 10 minutes
                        </p>
                        <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">If you didn't request this code, please ignore this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0; color: #999; font-size: 12px;">
                          © 2025 ExamBlox. All rights reserved.<br>
                          This is an automated message, please do not reply.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `Hello ${name},\n\nYour ExamBlox verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nThe ExamBlox Team`
      },
      forgot_password: {
        subject: 'ExamBlox Password Reset Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ff6b35; margin: 0 0 20px 0; font-size: 28px;">Password Reset</h1>
                        <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
                        <p style="color: #666; margin: 0 0 30px 0; font-size: 14px;">Your password reset code is:</p>
                        <div style="background: #ff6b35; color: white; padding: 20px 40px; border-radius: 8px; display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
                          ${otp}
                        </div>
                        <p style="margin: 30px 0 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404; font-size: 14px;">
                          ⏰ This code expires in 10 minutes
                        </p>
                        <p style="color: #666; font-size: 14px;">If you didn't request this reset, please ignore this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0; color: #999; font-size: 12px;">
                          © 2025 ExamBlox. All rights reserved.<br>
                          This is an automated message, please do not reply.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `Hello ${name},\n\nYour ExamBlox password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this reset, please ignore this email.\n\nBest regards,\nThe ExamBlox Team`
      }
    };
    
    const template = emailTemplates[type] || emailTemplates.signup;
    
    const msg = {
      to: email,
      from: {
        email: verifiedSender,
        name: 'ExamBlox'
      },
      replyTo: verifiedSender,
      subject: template.subject,
      html: template.html,
      text: template.text,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false }
      }
    };
    
    try {
      await sgMail.send(msg);
      console.log(`✅ OTP email sent to ${email}`);
      
      res.json({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: '10 minutes',
        email: email
      });
      
    } catch (emailError) {
      console.error('❌ SendGrid error:', emailError.response?.body || emailError);
      otpStorage.delete(email.toLowerCase());
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email',
        message: 'Please try again or contact support.',
        details: emailError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Error in send-otp:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP required' });
    }
    const otpData = otpStorage.get(email.toLowerCase());
    if (!otpData) {
      return res.status(400).json({ success: false, error: 'OTP not found' });
    }
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email.toLowerCase());
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }
    if (otpData.otp !== otp.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }
    otpStorage.delete(email.toLowerCase());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== FORGOT PASSWORD ENDPOINTS =====
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    
    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('name, email')
      .eq('email', email)
      .single();
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Send OTP for password reset
    const name = user.name || 'User';
    
    if (!emailConfigured) {
      return res.status(503).json({ success: false, error: 'Email service not configured' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = {
      otp: otp,
      email: email,
      name: name,
      type: 'forgot_password',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    
    otpStorage.set(email.toLowerCase(), otpData);
    
    const msg = {
      to: email,
      from: {
        email: verifiedSender,
        name: 'ExamBlox'
      },
      subject: 'ExamBlox Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; text-align: center;">
            <h1 style="color: #ff6b35;">Password Reset</h1>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your password reset code is:</p>
            <div style="background: #ff6b35; color: white; padding: 20px; border-radius: 8px; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="background: #fff3cd; padding: 15px; border-radius: 8px; color: #856404;">
              ⏰ This code expires in 10 minutes
            </p>
          </div>
        </body>
        </html>
      `
    };
    
    await sgMail.send(msg);
    
    res.json({
      success: true,
      message: 'Password reset code sent to your email',
      email: email
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }
    
    // Verify OTP
    const otpData = otpStorage.get(email.toLowerCase());
    if (!otpData) {
      return res.status(400).json({ success: false, error: 'OTP not found' });
    }
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email.toLowerCase());
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }
    if (otpData.otp !== otp.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }
    
    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('email', email);
    
    if (error) throw error;
    
    otpStorage.delete(email.toLowerCase());
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== FILE UPLOAD & TEXT EXTRACTION =====
app.post('/api/extract-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const file = req.file;
    const fileName = file.originalname.toLowerCase();
    let extractedText = '';
    
    console.log(`📄 Processing file: ${fileName} (${file.size} bytes)`);
    
    // TXT Files
    if (fileName.endsWith('.txt')) {
      extractedText = file.buffer.toString('utf-8');
      console.log(`✅ Extracted ${extractedText.length} chars from TXT`);
    }
    
    // PDF Files
    else if (fileName.endsWith('.pdf')) {
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
      console.log(`✅ Extracted ${extractedText.length} chars from PDF`);
    }
    
    // DOCX Files
    else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
      console.log(`✅ Extracted ${extractedText.length} chars from DOCX`);
    }
    
    // Image Files (OCR)
    else if (fileName.match(/\.(jpg|jpeg|png)$/)) {
      const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng');
      extractedText = text;
      console.log(`✅ Extracted ${extractedText.length} chars from IMAGE (OCR)`);
    }
    
    else {
      return res.status(400).json({ success: false, error: 'Unsupported file type' });
    }
    
    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Could not extract text from file' });
    }
    
    res.json({
      success: true,
      text: extractedText,
      fileName: file.originalname,
      fileSize: file.size,
      extractedLength: extractedText.length
    });
    
  } catch (error) {
    console.error('❌ File extraction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== QUESTION GENERATION =====
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text required' });
    }

    const difficultyMapping = {
      'Easy': 'Medium',
      'Medium': 'Hard',
      'Hard': 'Exam Level',
      'Exam Level': 'Expert'
    };

    const actualDifficulty = difficultyMapping[difficulty] || 'Hard';

    console.log('=== QUESTION GENERATION ===');
    console.log('Type:', questionType, '| Qty:', numQuestions, '| Difficulty:', actualDifficulty);

    const cleanedText = text.substring(0, 18000);
    const response = await generateQuestionsWithGroq(cleanedText, questionType, numQuestions, actualDifficulty);

    res.json({
      success: true,
      data: response,
      metadata: {
        questionType,
        numQuestions,
        actualDifficulty,
        model: 'llama-3.1-8b-instant'
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate questions', message: error.message });
  }
});

// ===== CORE GENERATION FUNCTION =====
async function generateQuestionsWithGroq(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  let allQuestions = [];
  const maxAttempts = 3;
  let attempt = 1;

  const batchSize = 5;
  const batches = Math.ceil(numQuestions / batchSize);

  while (allQuestions.length < numQuestions && attempt <= maxAttempts) {
    try {
      console.log(`📝 Attempt ${attempt}: Generating ${numQuestions - allQuestions.length} questions...`);

      for (let i = 0; i < batches; i++) {
        const needed = Math.min(batchSize, numQuestions - allQuestions.length);
        if (needed <= 0) break;

        const newQuestions = await generateBatchWithDelay(text, questionType, needed * 2, difficulty, API_KEY);
        
        const unique = newQuestions.filter(q => 
          !allQuestions.some(existing => 
            calculateSimilarity(q.question, existing.question) > 0.7
          )
        );

        allQuestions = [...allQuestions, ...unique].slice(0, numQuestions);
        
        console.log(`✓ Batch ${i + 1}: ${unique.length} new questions (Total: ${allQuestions.length}/${numQuestions})`);

        if (i < batches - 1 && allQuestions.length < numQuestions) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (allQuestions.length >= numQuestions) break;

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
    }

    attempt++;
    if (attempt <= maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  const finalQuestions = deduplicateQuestions(allQuestions).slice(0, numQuestions);

  console.log(`✅ Final: ${finalQuestions.length} questions generated`);

  return {
    message: `Generated ${finalQuestions.length} questions`,
    questions: finalQuestions
  };
}

async function generateBatchWithDelay(text, questionType, numQuestions, difficulty, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const prompt = createPrompt(text, questionType, numQuestions, difficulty);
  
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are an expert exam creator. Generate realistic, high-quality exam questions based ONLY on the provided text.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('⏳ Rate limited, waiting 5s...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        throw new Error('Rate limit - retry');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.choices[0]?.message?.content || '';
    
    return parseQuestionsResponse(generatedText, questionType);

  } catch (error) {
    console.error('Batch error:', error.message);
    return [];
  }
}

function createPrompt(text, questionType, numQuestions, difficulty) {
  const cleanText = text.trim().substring(0, 18000);
  
  if (cleanText.length < 50) {
    throw new Error('Insufficient text provided for question generation');
  }

  const base = `You MUST read this ENTIRE text carefully and generate ${numQuestions} ${difficulty} difficulty ${questionType} questions STRICTLY BASED ON THE TEXT BELOW.

DO NOT use sample data. DO NOT invent information. ONLY use the text provided.

TEXT TO ANALYZE:
"""
${cleanText}
"""

CRITICAL RULES:
- Every question MUST come from the text above
- Read EVERY sentence before generating questions
- Make questions challenging but based on actual content
- Use full sentences for questions (not single words)
- Questions must require reading the text to answer`;

  if (questionType === 'Multiple Choice') {
    return `${base}

FORMAT (EXACT):
Q1: [Full question sentence from the text]
A) [Option based on text]
B) [Option based on text]
C) [Option based on text]
D) [Option based on text]
ANSWER: B
EXPLANATION: [Why B is correct, referencing the text]

Generate ${numQuestions} questions in this exact format.`;

  } else if (questionType === 'True/False') {
    return `${base}

FORMAT (EXACT):
Q1: [Statement based on information from the text]
ANSWER: True
EXPLANATION: [Why this is true/false, referencing the text]

Generate ${numQuestions} True/False questions.`;

  } else if (questionType === 'Flashcards') {
    return `${base}

FORMAT (EXACT):
Q1: [Important concept, term, or question from the text]
ANSWER: [Detailed explanation or answer based on the text]

Generate ${numQuestions} flashcard-style questions.`;
  }
  
  return base;
}

function parseQuestionsResponse(response, questionType) {
  const questions = [];
  const blocks = response.split(/Q\d+:/);
  blocks.shift();

  blocks.forEach((block, index) => {
    try {
      const lines = block.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) return;

      const questionText = lines[0].trim();
      if (!questionText || questionText.length < 10) return;

      if (questionType === 'Multiple Choice') {
        const options = [];
        let answerLine = '';
        let explanation = '';

        lines.slice(1).forEach(line => {
          if (/^[A-D]\)/.test(line)) {
            options.push(line.substring(2).trim());
          } else if (line.toUpperCase().includes('ANSWER:')) {
            answerLine = line;
          } else if (line.toUpperCase().includes('EXPLANATION:')) {
            explanation = line.substring(line.toUpperCase().indexOf('EXPLANATION:') + 12).trim();
          }
        });

        if (options.length >= 4 && answerLine) {
          const correctLetter = answerLine.toUpperCase().match(/ANSWER:\s*([A-D])/)?.[1] || 'A';
          const correctIndex = correctLetter.charCodeAt(0) - 65;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            options: options.slice(0, 4),
            correctAnswer: correctIndex,
            correctLetter: correctLetter,
            explanation: explanation || 'Based on text'
          });
        }
      } else if (questionType === 'True/False') {
        const answerLine = lines.find(l => l.toUpperCase().includes('ANSWER:'));
        const explanationLine = lines.find(l => l.toUpperCase().includes('EXPLANATION:'));
        
        if (answerLine) {
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            correctAnswer: answerLine.toUpperCase().includes('TRUE') ? 'True' : 'False',
            explanation: explanationLine?.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() || 'Based on text'
          });
        }
      } else if (questionType === 'Flashcards') {
        let answerText = '';
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.toUpperCase().includes('ANSWER:')) {
            answerText = line.substring(line.toUpperCase().indexOf('ANSWER:') + 7).trim();
          } else if (answerText && !line.toUpperCase().includes('Q')) {
            answerText += ' ' + line.trim();
          }
        }
        
        if (answerText) {
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            answer: answerText,
            explanation: answerText
          });
        }
      }
    } catch (e) {
      console.log(`❌ Parse error Q${index + 1}:`, e.message);
    }
  });

  console.log(`📊 Parsed: ${questions.length} questions`);
  return questions;
}

function deduplicateQuestions(questions) {
  const unique = [];
  const seen = new Set();
  for (const q of questions) {
    const normalized = q.question.toLowerCase().replace(/[^\w\s]/g, '').slice(0, 50);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(q);
    }
  }
  return unique;
}

function calculateSimilarity(q1, q2) {
  const words1 = q1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = q2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const common = words1.filter(w => words2.includes(w));
  const total = new Set([...words1, ...words2]).size;
  return total > 0 ? common.length / total : 0;
}

// Clean expired OTPs
setInterval(() => {
  const now = new Date();
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiresAt) otpStorage.delete(email);
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('🤖 Model: llama-3.1-8b-instant');
  console.log('📧 Email:', emailConfigured ? 'Ready' : 'Check .env');
  console.log('📄 File Upload: Ready (PDF, DOCX, TXT, Images)');
});
