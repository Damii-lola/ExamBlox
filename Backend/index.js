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

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Email configuration - OPTIONAL (won't crash if missing)
let transporter = null;
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email service configured');
  } else {
    console.log('⚠️ Email credentials not found - email features disabled');
  }
} catch (error) {
  console.log('⚠️ Email setup failed - continuing without email:', error.message);
}

// Store OTPs temporarily
const otpStorage = new Map();

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API with Llama 3.3 70B',
    status: 'active',
    platform: 'railway',
    aiModel: 'llama-3.3-70b-versatile',
    emailEnabled: transporter !== null,
    endpoints: {
      test: 'GET /',
      generate: 'POST /api/generate-questions',
      sendOtp: 'POST /api/send-otp',
      verifyOtp: 'POST /api/verify-otp'
    }
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Backend working!',
    timestamp: new Date().toISOString(),
    aiModel: 'llama-3.3-70b-versatile'
  });
});

// OTP ENDPOINTS (optional - won't crash main functionality)
app.post('/api/send-otp', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'Administrator needs to set up email credentials'
      });
    }

    const { email, name, type = 'signup' } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
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
    
    otpStorage.set(email, otpData);
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    const emailTemplates = {
      signup: {
        subject: '🔐 Your ExamBlox Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #6a4bff, #4dfff3); border-radius: 15px;">
            <div style="background: white; padding: 30px; border-radius: 10px;">
              <h1 style="color: #6a4bff; text-align: center;">🔐 ExamBlox</h1>
              <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
              <p>Your verification code is:</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #6a4bff, #4dfff3); color: white; padding: 20px 40px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                  ${otp}
                </div>
              </div>
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">⏰ <strong>Expires in 10 minutes</strong></p>
              </div>
              <p>If you didn't request this, ignore this email.</p>
              <p style="text-align: center; color: #999; margin-top: 30px;">Best regards,<br><strong style="color: #6a4bff;">The ExamBlox Team</strong></p>
            </div>
          </div>
        `
      },
      forgot_password: {
        subject: '🔐 ExamBlox Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #ff6b35, #f7931e); border-radius: 15px;">
            <div style="background: white; padding: 30px; border-radius: 10px;">
              <h1 style="color: #ff6b35; text-align: center;">🔐 Password Reset</h1>
              <p>Hello <strong>${name}</strong>,</p>
              <p>Your password reset code is:</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px 40px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                  ${otp}
                </div>
              </div>
              <p style="text-align: center; color: #999; margin-top: 30px;">Best regards,<br><strong style="color: #ff6b35;">The ExamBlox Team</strong></p>
            </div>
          </div>
        `
      }
    };
    
    const template = emailTemplates[type] || emailTemplates.signup;
    
    await transporter.sendMail({
      from: `"ExamBlox Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html
    });
    
    console.log(`OTP email sent to ${email}`);
    
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
        error: 'OTP not found or expired'
      });
    }
    
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({
        error: 'OTP has expired'
      });
    }
    
    if (otpData.otp !== otp) {
      return res.status(400).json({
        error: 'Invalid OTP'
      });
    }
    
    otpStorage.delete(email);
    console.log(`OTP verified for ${email}`);
    
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

app.post('/api/send-welcome-email', async (req, res) => {
  try {
    if (!transporter) {
      return res.json({success: true, message: 'Email service not available'});
    }

    const { email, name } = req.body;
    
    await transporter.sendMail({
      from: `"ExamBlox Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🙏 Thank You for Trying ExamBlox',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #6a4bff, #4dfff3); border-radius: 15px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #6a4bff; text-align: center;">🎉 Welcome to ExamBlox!</h1>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for trying out ExamBlox! 🎉</p>
            <p>We're glad to have you on board and can't wait to support you in your exam prep journey.</p>
            <div style="background: linear-gradient(135deg, #6a4bff, #4dfff3); border-radius: 10px; padding: 20px; margin: 30px 0; text-align: center;">
              <h3 style="color: white; margin: 0;">🚀 Ready to get started?</h3>
            </div>
            <p>Wishing you success in your studies! ✨</p>
            <p style="text-align: center; color: #999; margin-top: 30px;">Best regards,<br><strong style="color: #6a4bff;">The ExamBlox Team</strong></p>
          </div>
        </div>
      `
    });
    
    res.json({success: true});
  } catch (error) {
    console.log('Welcome email failed:', error);
    res.json({success: true});
  }
});

// MAIN QUESTION GENERATION - LLAMA 3.3 70B VERSATILE
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

BAD EXAMPLE:
Q: Photosynthesis
A: Process plants use to make food

GOOD EXAMPLE:
Q: What is photosynthesis and why is it critical for life on Earth?
A: Photosynthesis is the biochemical process by which plants, algae, and some bacteria convert light energy (usually from the sun) into chemical energy stored in glucose molecules. This process occurs primarily in chloroplasts and uses carbon dioxide and water as raw materials, releasing oxygen as a byproduct. It's critical because it forms the foundation of most food chains on Earth and produces the oxygen that most organisms need to survive. The general equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.

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

// Clean up expired OTPs
setInterval(() => {
  const now = new Date();
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(email);
    }
  }
}, 5 * 60 * 1000);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({error: 'Internal server error'});
});

app.use('*', (req, res) => {
  res.status(404).json({error: 'Not found'});
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('🤖 AI Model: Llama 3.3 70B Versatile');
  console.log('📧 Email:', transporter ? 'Enabled' : 'Disabled (optional)');
});
