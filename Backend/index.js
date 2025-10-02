// index.js - COMPLETE RAILWAY BACKEND with Supabase
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// SendGrid Configuration
let emailConfigured = false;
let verifiedSender = null;

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_VERIFIED_SENDER) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
  emailConfigured = true;
  console.log('✅ SendGrid configured');
  console.log(`📧 Verified Sender: ${verifiedSender}`);
} else {
  console.error('❌ SendGrid not configured');
}

const otpStorage = new Map();

app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API - Supabase Integrated',
    status: 'active',
    platform: 'railway',
    database: 'supabase',
    emailService: 'SendGrid',
    emailEnabled: emailConfigured,
    endpoints: {
      test: 'GET /',
      generate: 'POST /api/generate-questions',
      sendOtp: 'POST /api/send-otp',
      verifyOtp: 'POST /api/verify-otp',
      users: {
        getAll: 'GET /api/users',
        create: 'POST /api/users',
        login: 'POST /api/login',
        update: 'PATCH /api/users/:email',
        delete: 'DELETE /api/users/:email'
      }
    }
  });
});

// ===== USER MANAGEMENT ENDPOINTS =====

// GET ALL USERS (for admin panel)
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, users: data || [] });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE USER (signup)
app.post('/api/users', async (req, res) => {
  try {
    const { username, name, email, password, plan, role } = req.body;
    
    if (!username || !name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('email, username')
      .or(`email.ilike.${email},username.ilike.${username}`)
      .limit(1);
    
    if (existing && existing.length > 0) {
      const existingUser = existing[0];
      return res.status(400).json({ 
        success: false, 
        error: existingUser.email.toLowerCase() === email.toLowerCase() 
          ? 'Email already exists' 
          : 'Username already exists' 
      });
    }
    
    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        username, 
        name, 
        email, 
        password, 
        plan: plan || 'free', 
        role: role || 'user',
        is_permanent: false
      }])
      .select();
    
    if (error) throw error;
    
    console.log(`✅ User created: ${email}`);
    res.json({ success: true, user: data[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGIN USER
app.post('/api/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, error: 'Email/username and password required' });
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
    
    console.log(`✅ User logged in: ${data[0].email}`);
    res.json({ success: true, user: data[0] });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE USER (promote/demote)
app.patch('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('email', email)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ User updated: ${email}`);
    res.json({ success: true, user: data[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE USER
app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', email);
    
    if (error) throw error;
    
    console.log(`✅ User deleted: ${email}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== OTP ENDPOINT (NO WELCOME EMAIL) =====
app.post('/api/send-otp', async (req, res) => {
  try {
    if (!emailConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Email service not configured'
      });
    }

    const { email, name, type = 'signup' } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
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
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }
    
    const normalizedEmail = email.toLowerCase();
    const otpData = otpStorage.get(normalizedEmail);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found or expired'
      });
    }
    
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired'
      });
    }
    
    if (otpData.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }
    
    otpStorage.delete(normalizedEmail);
    console.log(`✅ OTP verified for ${email}`);
    
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
    
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

// ===== QUESTION GENERATION =====
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty, userPlan = 'free' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const difficultyMapping = {
      'Easy': 'Medium',
      'Medium': 'Hard',
      'Hard': 'Exam Level',
      'Exam Level': 'Expert'
    };

    const actualDifficulty = difficultyMapping[difficulty] || 'Hard';

    console.log('=== QUESTION GENERATION ===');
    console.log('User selected:', difficulty);
    console.log('AI generating at:', actualDifficulty);
    console.log('Question type:', questionType);
    console.log('Num questions:', numQuestions);

    const cleanedText = filterRelevantContent(text);
    const response = await generateQuestionsWithLlama(cleanedText, questionType, numQuestions, actualDifficulty);

    res.json({
      success: true,
      message: response.message,
      data: response,
      metadata: {
        textLength: text.length,
        questionType,
        numQuestions,
        userSelectedDifficulty: difficulty,
        actualDifficulty: actualDifficulty,
        timestamp: new Date().toISOString(),
        aiModel: 'deepseek-r1-distill-llama-70b'
      }
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      error: 'Failed to generate questions',
      message: error.message
    });
  }
});

function filterRelevantContent(text) {
  let cleaned = text;
  cleaned = cleaned.replace(/about\s+the\s+author[^]*?(?=\n\n|\n[A-Z]|$)/gi, '');
  const sectionsToRemove = [
    /acknowledgments?[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /bibliography[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /references[^]*?(?=\n\n|\n[A-Z]|$)/gi
  ];
  sectionsToRemove.forEach(pattern => cleaned = cleaned.replace(pattern, ''));
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

async function generateQuestionsWithLlama(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const batchSize = 10;
  const numberOfBatches = Math.ceil(numQuestions / batchSize);
  const batches = [];

  for (let i = 0; i < numberOfBatches; i++) {
    batches.push({
      batchId: i + 1,
      questionsNeeded: Math.min(batchSize, numQuestions - (i * batchSize))
    });
  }

  let attempt = 1;
  const maxAttempts = 5;
  let allQuestions = [];

  while (allQuestions.length < numQuestions && attempt <= maxAttempts) {
    try {
      const batchPromises = batches.map(batch => 
        generateSingleBatchLlama(text, questionType, batch.questionsNeeded * 2, difficulty, batch.batchId, API_KEY)
      );

      const batchResults = await Promise.all(batchPromises);
      let rawQuestions = batchResults.flat();

      const uniqueQuestions = deduplicateQuestions(rawQuestions);
      const newQuestions = uniqueQuestions.filter(q => 
        !allQuestions.some(existing => 
          calculateSimilarity(q.question, existing.question) > 0.7
        )
      );

      allQuestions = [...allQuestions, ...newQuestions].slice(0, numQuestions);

      if (allQuestions.length >= numQuestions) break;

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
    }

    attempt++;
    if (attempt <= maxAttempts && allQuestions.length < numQuestions) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const finalQuestions = allQuestions.slice(0, numQuestions);

  return {
    message: `Generated ${finalQuestions.length} questions`,
    questions: finalQuestions,
    provider: 'groq',
    model: 'deepseek-r1-distill-llama-70b',
    actualDifficulty: difficulty
  };
}

async function generateSingleBatchLlama(text, questionType, numQuestions, difficulty, batchId, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const maxTextLength = 18000;
  const textSection = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;
  
  const prompt = createEnhancedPrompt(textSection, questionType, numQuestions, difficulty);
  
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          {
            role: "system",
            content: `You are an expert exam creator specializing in ${difficulty} difficulty questions.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2800
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.choices[0]?.message?.content || '';
    
    const parsed = parseQuestionsResponse(generatedText, questionType);
    return parsed;

  } catch (error) {
    console.error(`Batch ${batchId} failed:`, error.message);
    return [];
  }
}

function createEnhancedPrompt(text, questionType, numQuestions, difficulty) {
  const baseInstructions = `You are an expert exam creator. Generate ${numQuestions} ${questionType} questions from the text below. Make them challenging and test deep understanding.`;

  let specificPrompt = '';

  if (questionType === 'Multiple Choice') {
    specificPrompt = `${baseInstructions}

TEXT:
"""
${text}
"""

FORMAT:
Q1: [Question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
ANSWER: B
EXPLANATION: [Brief explanation]`;

  } else if (questionType === 'True/False') {
    specificPrompt = `${baseInstructions}

TEXT:
"""
${text}
"""

FORMAT:
Q1: [Statement]
ANSWER: True
EXPLANATION: [Why]`;

  } else if (questionType === 'Flashcards') {
    specificPrompt = `${baseInstructions}

TEXT:
"""
${text}
"""

FORMAT:
Q1: [Term/Concept]
ANSWER: [Detailed explanation]`;
  }

  return specificPrompt;
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
          const correctLetter = answerLine.toUpperCase().match(/[A-D]/)?.[0] || 'A';
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            options: options.slice(0, 4),
            correctAnswer: correctLetter.charCodeAt(0) - 65,
            correctLetter: correctLetter,
            explanation: explanation || 'Correct answer based on text'
          });
        }
      } else if (questionType === 'True/False') {
        const answerLine = lines.find(l => l.toUpperCase().includes('ANSWER:'));
        if (answerLine) {
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            correctAnswer: answerLine.toUpperCase().includes('TRUE') ? 'True' : 'False',
            explanation: 'Based on text content'
          });
        }
      } else if (questionType === 'Flashcards') {
        const answerLine = lines.find(l => l.toUpperCase().includes('ANSWER:'));
        if (answerLine) {
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            answer: answerLine.substring(answerLine.toUpperCase().indexOf('ANSWER:') + 7).trim(),
            explanation: 'Key concept from text'
          });
        }
      }
    } catch (e) {
      console.log(`Parse error question ${index + 1}:`, e.message);
    }
  });

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

// Clean up expired OTPs
setInterval(() => {
  const now = new Date();
  let cleanedCount = 0;
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(email);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired OTP(s)`);
  }
}, 5 * 60 * 1000);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({error: 'Internal server error', message: err.message});
});

app.use('*', (req, res) => {
  res.status(404).json({error: 'Not found'});
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('🗄️ Database: Supabase Connected');
  console.log('🤖 AI Model: Deepseek-r1-distill-llama-70b');
  console.log('📧 Email Service: SendGrid');
  console.log('📧 Email Status:', emailConfigured ? 'Enabled & Ready' : 'Check environment variables');
});
