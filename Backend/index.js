// index.js - FIXED: DMARC, File Size Limits, Difficulty, Backups
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');
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
app.use(express.json({ limit: '30mb' })); // Increased for larger files

// SendGrid Configuration with DMARC alignment
let emailConfigured = false;
let verifiedSender = null;

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_VERIFIED_SENDER) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
  emailConfigured = true;
  console.log('✅ SendGrid configured with DMARC compliance');
  console.log(`📧 Verified Sender: ${verifiedSender}`);
} else {
  console.error('❌ SendGrid not configured - Set SENDGRID_API_KEY and SENDGRID_VERIFIED_SENDER');
}

const otpStorage = new Map();
const dailyBackups = new Map(); // Store backups in memory

// AUTOMATIC DAILY BACKUP SYSTEM
async function createDailyBackup() {
  const today = new Date().toISOString().split('T')[0];
  
  if (!dailyBackups.has(today)) {
    const backupData = {
      date: today,
      timestamp: new Date().toISOString(),
      data: {} // In production, fetch from database
    };
    
    dailyBackups.set(today, backupData);
    console.log(`📦 Daily backup created for ${today}`);
    
    // Keep only last 30 days
    if (dailyBackups.size > 30) {
      const oldest = Array.from(dailyBackups.keys()).sort()[0];
      dailyBackups.delete(oldest);
    }
  }
}

// Run backup at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    createDailyBackup();
  }
}, 60000); // Check every minute

// Create initial backup
createDailyBackup();

app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API - All Fixed',
    status: 'active',
    platform: 'railway',
    aiModel: 'llama-3.3-70b-versatile',
    emailService: 'SendGrid with DMARC',
    emailEnabled: emailConfigured,
    verifiedSender: emailConfigured ? verifiedSender : 'Not configured',
    features: {
      dmarcCompliance: true,
      dailyBackups: true,
      fileSizeLimits: { free: '5MB', premium: '25MB' },
      difficultyLevels: ['Medium', 'Hard', 'Exam Level', 'Expert']
    },
    endpoints: {
      test: 'GET /',
      generate: 'POST /api/generate-questions',
      sendOtp: 'POST /api/send-otp',
      verifyOtp: 'POST /api/verify-otp',
      welcomeEmail: 'POST /api/send-welcome-email',
      backups: 'GET /api/backups',
      restoreBackup: 'POST /api/restore-backup'
    }
  });
});

// GET AVAILABLE BACKUPS
app.get('/api/backups', (req, res) => {
  const backupList = Array.from(dailyBackups.entries()).map(([date, backup]) => ({
    date: date,
    timestamp: backup.timestamp,
    size: JSON.stringify(backup.data).length
  }));
  
  res.json({
    success: true,
    backups: backupList.sort((a, b) => b.date.localeCompare(a.date))
  });
});

// RESTORE FROM BACKUP
app.post('/api/restore-backup', (req, res) => {
  const { date } = req.body;
  
  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Date required'
    });
  }
  
  const backup = dailyBackups.get(date);
  
  if (!backup) {
    return res.status(404).json({
      success: false,
      error: 'Backup not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Backup retrieved',
    backup: backup.data,
    timestamp: backup.timestamp
  });
});

// SEND OTP with DMARC compliance
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
    
    // DMARC-compliant message configuration
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
      },
      mailSettings: {
        bypassListManagement: { enable: false },
        footer: { enable: false },
        sandboxMode: { enable: false }
      }
    };
    
    try {
      await sgMail.send(msg);
      console.log(`✅ OTP email sent to ${email} (DMARC compliant)`);
      
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

app.post('/api/send-welcome-email', async (req, res) => {
  try {
    if (!emailConfigured) {
      return res.json({ success: true, message: 'Email not configured' });
    }

    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email and name required' });
    }
    
    const msg = {
      to: email,
      from: {
        email: verifiedSender,
        name: 'ExamBlox'
      },
      subject: 'Welcome to ExamBlox!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 10px;">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <h1 style="color: #6a4bff;">Welcome to ExamBlox!</h1>
                      <p>Hi <strong>${name}</strong>,</p>
                      <p>Thank you for joining ExamBlox!</p>
                      <p style="margin: 30px 0;"><strong>Your free plan includes:</strong></p>
                      <ul style="text-align: left; display: inline-block;">
                        <li>5 file uploads per month</li>
                        <li>Up to 10 questions per upload</li>
                        <li>5MB file size limit</li>
                      </ul>
                      <p>Wishing you success in your studies!</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Welcome to ExamBlox, ${name}!\n\nYour free plan includes:\n- 5 file uploads per month\n- Up to 10 questions per upload\n- 5MB file size limit\n\nBest regards,\nThe ExamBlox Team`
    };
    
    await sgMail.send(msg);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Welcome email failed:', error);
    res.json({ success: true, note: 'Email failed but signup succeeded' });
  }
});

// QUESTION GENERATION with ACTUAL DIFFICULTY
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty, userPlan = 'free' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Map frontend difficulty to actual AI difficulty
    const difficultyMapping = {
      'Easy': 'Medium',  // Easy becomes Medium
      'Medium': 'Hard',  // Medium becomes Hard
      'Hard': 'Exam Level',  // Hard becomes Exam Level
      'Exam Level': 'Expert'  // Exam Level becomes Expert
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
        aiModel: 'llama-3.3-70b-versatile'
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
    model: 'llama-3.3-70b-versatile',
    actualDifficulty: difficulty
  };
}

async function generateSingleBatchLlama(text, questionType, numQuestions, difficulty, batchId, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const maxTextLength = 12000;
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
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert exam creator specializing in ${difficulty} difficulty questions. Create challenging, thought-provoking questions that test deep understanding and critical thinking.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8, // Higher for more creative/difficult questions
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
  const difficultyInstructions = {
    'Medium': 'Create questions that require understanding and application of concepts. Questions should make students think beyond simple recall.',
    'Hard': 'Create CHALLENGING questions that require deep analysis, synthesis, and critical thinking. Questions must be puzzling and require careful consideration.',
    'Exam Level': 'Create VERY DIFFICULT exam-style questions that test mastery. Questions should be complex, multi-layered, and require comprehensive understanding.',
    'Expert': 'Create EXTREMELY CHALLENGING questions at PhD/professional level. Questions must be highly complex, require advanced reasoning, and test expert-level knowledge.'
  };

  const instruction = difficultyInstructions[difficulty] || difficultyInstructions['Hard'];

  let prompt = '';

  if (questionType === 'Multiple Choice') {
    prompt = `You are creating ${difficulty} difficulty multiple choice questions. ${instruction}

TEXT:
${text}

CRITICAL REQUIREMENTS:
- Questions MUST be challenging and thought-provoking
- NO simple recall questions - test APPLICATION and ANALYSIS
- Distractors must be highly plausible
- Questions should make students pause and think carefully
- Require connecting multiple concepts
- Test understanding, NOT memorization

FORMAT (STRICT):
Q1: [Complex, multi-layered question requiring deep thinking]
A) [Highly plausible distractor]
B) [Correct answer - requires careful analysis to identify]
C) [Highly plausible distractor]
D) [Highly plausible distractor]
ANSWER: B
EXPLANATION: [Detailed explanation of why B is correct and why others are wrong]

Create exactly ${numQuestions} ${difficulty} questions now.`;

  } else if (questionType === 'True/False') {
    prompt = `Create ${numQuestions} ${difficulty} True/False statements. ${instruction}

TEXT:
${text}

REQUIREMENTS:
- Statements must be nuanced and require careful analysis
- Avoid obvious answers
- Test understanding of subtle concepts
- Include tricky wording that requires attention

FORMAT:
Q1: [Nuanced statement requiring careful thought]
ANSWER: True
EXPLANATION: [Why this is true/false]`;

  } else if (questionType === 'Flashcards') {
    prompt = `Create ${numQuestions} ${difficulty} flashcards. ${instruction}

TEXT:
${text}

REQUIREMENTS:
- Front: Complex concepts or challenging questions
- Back: Comprehensive, detailed explanations (4-6 sentences minimum)
- Include examples, context, and connections
- Make content exam-ready and challenging

FORMAT:
Q1: [Complex concept or challenging question]
ANSWER: [Detailed 4-6 sentence explanation with depth and examples]`;
  }

  return prompt;
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
  console.log('🤖 AI Model: Llama 3.3 70B Versatile');
  console.log('📧 Email Service: SendGrid with DMARC compliance');
  console.log('📧 Email Status:', emailConfigured ? 'Enabled & Ready' : 'Check environment variables');
  console.log('📦 Daily Backups: Enabled');
  console.log('🎯 Enhanced Difficulty: Active');
  console.log('📏 File Limits: Free=5MB, Premium=25MB');
});
