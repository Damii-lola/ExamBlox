// index.js - SENDGRID VERSION (Much More Reliable!)
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
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

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// SendGrid Email Configuration
let emailConfigured = false;
let verifiedSender = null;

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_VERIFIED_SENDER) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
  emailConfigured = true;
  console.log('✅ SendGrid configured successfully');
  console.log(`📧 Verified Sender: ${verifiedSender}`);
} else {
  console.error('❌ SendGrid not configured');
  console.log('Set these environment variables in Railway:');
  console.log('- SENDGRID_API_KEY: Your SendGrid API key');
  console.log('- SENDGRID_VERIFIED_SENDER: Your verified sender email');
}

// Store OTPs temporarily
const otpStorage = new Map();

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API with SendGrid',
    status: 'active',
    platform: 'railway',
    aiModel: 'llama-3.3-70b-versatile',
    emailService: 'SendGrid',
    emailEnabled: emailConfigured,
    verifiedSender: emailConfigured ? verifiedSender : 'Not configured',
    endpoints: {
      test: 'GET /',
      generate: 'POST /api/generate-questions',
      sendOtp: 'POST /api/send-otp',
      verifyOtp: 'POST /api/verify-otp',
      welcomeEmail: 'POST /api/send-welcome-email'
    }
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Backend working!',
    timestamp: new Date().toISOString(),
    aiModel: 'llama-3.3-70b-versatile',
    emailStatus: emailConfigured ? 'SendGrid Ready' : 'Not configured'
  });
});

// SEND OTP EMAIL - SENDGRID VERSION
app.post('/api/send-otp', async (req, res) => {
  try {
    if (!emailConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Email service not configured',
        message: 'Please set SENDGRID_API_KEY and SENDGRID_VERIFIED_SENDER in Railway environment variables'
      });
    }

    const { email, name, type = 'signup' } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = {
      otp: otp,
      email: email,
      name: name,
      type: type,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    
    // Store OTP
    otpStorage.set(email.toLowerCase(), otpData);
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    // Email templates
    const emailTemplates = {
      signup: {
        subject: '🔐 Your ExamBlox Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #6a4bff, #4dfff3); padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 10px; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h1 style="color: #6a4bff; text-align: center; margin: 0 0 20px 0;">🔐 ExamBlox</h1>
                        <p style="font-size: 16px; color: #333; margin: 0 0 10px 0;">Hello <strong>${name}</strong>,</p>
                        <p style="color: #666; margin: 0 0 30px 0;">Your verification code is:</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <div style="background: linear-gradient(135deg, #6a4bff, #4dfff3); color: white; padding: 20px 40px; border-radius: 10px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                                ${otp}
                              </div>
                            </td>
                          </tr>
                        </table>
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 30px 0;">
                          <p style="margin: 0; color: #856404; text-align: center;">⏰ <strong>Expires in 10 minutes</strong></p>
                        </div>
                        <p style="color: #666; margin: 20px 0 0 0;">If you didn't request this code, please ignore this email.</p>
                        <p style="text-align: center; color: #999; margin-top: 30px; font-size: 14px;">
                          Best regards,<br><strong style="color: #6a4bff;">The ExamBlox Team</strong>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      },
      forgot_password: {
        subject: '🔐 ExamBlox Password Reset Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 10px; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h1 style="color: #ff6b35; text-align: center; margin: 0 0 20px 0;">🔐 Password Reset</h1>
                        <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
                        <p style="color: #666; margin: 0 0 30px 0;">Your password reset code is:</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px 40px; border-radius: 10px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                                ${otp}
                              </div>
                            </td>
                          </tr>
                        </table>
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 30px 0;">
                          <p style="margin: 0; color: #856404; text-align: center;">⏰ <strong>Expires in 10 minutes</strong></p>
                        </div>
                        <p style="color: #666;">If you didn't request this reset, please ignore this email.</p>
                        <p style="text-align: center; color: #999; margin-top: 30px; font-size: 14px;">
                          Best regards,<br><strong style="color: #ff6b35;">The ExamBlox Team</strong>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      }
    };
    
    const template = emailTemplates[type] || emailTemplates.signup;
    
    // SendGrid message
    const msg = {
      to: email,
      from: verifiedSender,
      subject: template.subject,
      html: template.html
    };
    
    try {
      await sgMail.send(msg);
      console.log(`✅ OTP email sent to ${email} via SendGrid`);
      
      res.json({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: '10 minutes',
        email: email
      });
      
    } catch (emailError) {
      console.error('❌ SendGrid error:', emailError);
      
      // Clean up stored OTP since email failed
      otpStorage.delete(email.toLowerCase());
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email',
        message: 'There was a problem sending the email. Please try again.',
        details: emailError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Error in send-otp endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// VERIFY OTP
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
        error: 'OTP not found',
        message: 'OTP has expired or was never generated. Please request a new one.'
      });
    }
    
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired',
        message: 'This code has expired. Please request a new one.'
      });
    }
    
    if (otpData.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        message: 'The code you entered is incorrect. Please try again.'
      });
    }
    
    otpStorage.delete(normalizedEmail);
    console.log(`✅ OTP verified successfully for ${email}`);
    
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
    
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
      message: error.message
    });
  }
});

// SEND WELCOME EMAIL
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    if (!emailConfigured) {
      return res.json({
        success: true, 
        message: 'Email service not available'
      });
    }

    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name required'
      });
    }
    
    const msg = {
      to: email,
      from: verifiedSender,
      subject: '🎉 Welcome to ExamBlox!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #6a4bff, #4dfff3); padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 10px; overflow: hidden;">
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #6a4bff; text-align: center; margin: 0 0 20px 0;">🎉 Welcome to ExamBlox!</h1>
                      <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
                      <p style="color: #666;">Thank you for joining ExamBlox! We're excited to help you ace your exams.</p>
                      <div style="background: linear-gradient(135deg, #6a4bff, #4dfff3); border-radius: 10px; padding: 20px; margin: 30px 0; text-align: center;">
                        <h3 style="color: white; margin: 0 0 10px 0;">🚀 Ready to get started?</h3>
                        <p style="color: white; margin: 0;">Upload your study materials and let AI create practice questions!</p>
                      </div>
                      <p style="color: #333; margin: 20px 0 10px 0;"><strong>Your free plan includes:</strong></p>
                      <ul style="color: #666; padding-left: 20px;">
                        <li>5 file uploads per month</li>
                        <li>Up to 10 questions per upload</li>
                        <li>Multiple choice questions</li>
                      </ul>
                      <p style="color: #666; margin-top: 20px;">Wishing you success in your studies! ✨</p>
                      <p style="text-align: center; color: #999; margin-top: 30px; font-size: 14px;">
                        Best regards,<br><strong style="color: #6a4bff;">The ExamBlox Team</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };
    
    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${email}`);
    res.json({success: true});
    
  } catch (error) {
    console.error('❌ Welcome email failed:', error);
    res.json({success: true, note: 'Welcome email failed but signup succeeded'});
  }
});

// QUESTION GENERATION (unchanged)
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required'
      });
    }

    console.log('=== QUESTION GENERATION ===');
    console.log('AI Model: Llama 3.3 70B Versatile');
    console.log('Text length:', text.length);
    console.log('Question type:', questionType);
    console.log('Num questions:', numQuestions);
    console.log('Difficulty:', difficulty);

    const cleanedText = filterRelevantContent(text);
    const response = await generateQuestionsWithLlama(cleanedText, questionType, numQuestions, difficulty);

    res.json({
      success: true,
      message: response.message,
      data: response,
      metadata: {
        textLength: text.length,
        questionType,
        numQuestions,
        difficulty,
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

  console.log('Starting question generation with Llama 3.3 70B...');
  
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
    console.log(`Attempt ${attempt}/${maxAttempts} - Need ${numQuestions - allQuestions.length} more questions`);

    try {
      const batchPromises = batches.map(batch => 
        generateSingleBatchLlama(text, questionType, batch.questionsNeeded * 2, difficulty, batch.batchId, API_KEY)
      );

      const batchResults = await Promise.all(batchPromises);
      let rawQuestions = batchResults.flat();
      
      console.log(`Got ${rawQuestions.length} raw questions`);

      const uniqueQuestions = deduplicateQuestions(rawQuestions);
      const newQuestions = uniqueQuestions.filter(q => 
        !allQuestions.some(existing => 
          calculateSimilarity(q.question, existing.question) > 0.7
        )
      );

      allQuestions = [...allQuestions, ...newQuestions].slice(0, numQuestions);
      console.log(`Progress: ${allQuestions.length}/${numQuestions}`);

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
  console.log(`Final: Generated ${finalQuestions.length}/${numQuestions} questions`);

  return {
    message: `Generated ${finalQuestions.length} questions`,
    questions: finalQuestions,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    successRate: `${finalQuestions.length}/${numQuestions}`
  };
}

async function generateSingleBatchLlama(text, questionType, numQuestions, difficulty, batchId, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const maxTextLength = 12000;
  const textSection = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;
  
  const prompt = createPrompt(textSection, questionType, numQuestions, difficulty);
  
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
            content: `You are an expert exam question creator. Create high-quality ${questionType} questions.`
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
    console.log(`Batch ${batchId}: Generated ${parsed.length} questions`);
    return parsed;

  } catch (error) {
    console.error(`Batch ${batchId} failed:`, error.message);
    return [];
  }
}

function createPrompt(text, questionType, numQuestions, difficulty) {
  let prompt = '';

  if (questionType === 'Multiple Choice') {
    prompt = `You are a professional exam creator. Create ${numQuestions} challenging ${difficulty} multiple choice questions from this text.

TEXT:
${text}

REQUIREMENTS:
- Questions must test deep understanding, NOT just memorization
- Each question should be exam-worthy and realistic
- Options should be plausible but clearly distinct
- Include detailed explanations referencing the text

FORMAT (STRICT):
Q1: [Thought-provoking question that requires understanding]
A) [Plausible option]
B) [Correct answer - detailed and complete]
C) [Plausible distractor]
D) [Plausible distractor]
ANSWER: B
EXPLANATION: [Why B is correct and why others are wrong, referencing specific text content]

Create exactly ${numQuestions} questions now.`;

  } else if (questionType === 'True/False') {
    prompt = `Create ${numQuestions} challenging True/False statements from this text:

${text}

Each statement should:
- Test understanding of key concepts
- Be clear and unambiguous
- Include explanation with text reference

FORMAT:
Q1: [Statement that requires careful thought]
ANSWER: True
EXPLANATION: [Why this is true/false based on the text]`;

  } else if (questionType === 'Flashcards') {
    prompt = `You are creating PREMIUM STUDY FLASHCARDS for serious students. Create ${numQuestions} comprehensive flashcards from this text.

TEXT:
${text}

CRITICAL REQUIREMENTS FOR FLASHCARDS:
- Front: A KEY CONCEPT, TERM, or IMPORTANT QUESTION from the text
- Back: A DETAILED, COMPREHENSIVE explanation (3-5 sentences minimum)
- Include context, examples, and why it matters
- Make explanations memorable and exam-ready
- NO single-word answers - provide FULL explanations

FORMAT (STRICT):
Q1: [Important concept/term/question - make it specific and exam-relevant]
ANSWER: [Comprehensive 3-5 sentence explanation with context, examples, and significance. Include HOW, WHY, and WHEN relevant. Make it exam-ready and memorable.]

Create exactly ${numQuestions} HIGH-QUALITY flashcards now.`;

  } else {
    prompt = `Create ${numQuestions} ${difficulty} ${questionType} questions from:\n\n${text}`;
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

// Clean up expired OTPs every 5 minutes
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
  console.log('📧 Email Service: SendGrid');
  console.log('📧 Email Status:', emailConfigured ? 'Enabled & Ready' : 'Disabled - Check environment variables');
  if (!emailConfigured) {
    console.log('⚠️ To enable email:');
    console.log('   1. Set SENDGRID_API_KEY in Railway');
    console.log('   2. Set SENDGRID_VERIFIED_SENDER in Railway');
  }
});
