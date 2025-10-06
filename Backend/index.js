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
        model: "openai/gpt-oss-120",
        messages: [
          {
            role: "system",
            content: `You are an expert exam creator specializing in ${difficulty} difficulty questions. Create challenging, thought-provoking questions that test deep understanding and critical thinking BUT u should actually read the FULL text that was uploaded, and get quesstions from it not just skimming through it and generating guess work questions, go through the document for goodness sakes. Also be mindful of the difficulty. ALSO I DONT WANT TO SEE REPEATING QUESTIONS, and when generating questions, ask urself, is this the kind of question that will be in an actual REAL-LIFE exam, if not remove it and regenerate new questions, if yes then keep.`
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
  const baseInstructions = `
You are an expert exam creator. Your task is to carefully read, analyze, and extract key information from the provided text in order to generate realistic, high-quality exam-style questions.

CRITICAL READING REQUIREMENTS:
Read EVERY sentence — do not skip or skim.
Extract all key concepts, definitions, processes, and facts.
Understand the context, tone, and educational level of the text.
Identify technical terms, acronyms, and their meanings.
Recognize and respect relationships between concepts.
If something is unclear, re-read the text until you fully understand it.

QUESTION GENERATION RULES:

✅ DO:
Create realistic exam-style questions (the kind that would actually appear in professional or academic exams).
Base every question directly on the text — do not invent or assume.
Use synonyms, paraphrasing, and acronyms to make students think more deeply.
Include a mix of question types: definitions, applications, comparisons, and analysis.
Ensure questions are globally appropriate (not restricted to U.S. or U.K. context).
When making multiple-choice questions, make the options very close in value or meaning (e.g., if the correct answer is 0.23, use 0.21, 0.22, 0.24 as distractors).
Make use of the entire text — do not skip sections.

❌ DO NOT:
Overuse scenario-based questions (keep them minimal and realistic).
Ask questions that require guessing what the author “thinks.”
Skip acronyms, synonyms, or subtle wording differences.
Create overly complex or wordy questions that confuse the student.
Make the correct answer obvious by including weak distractors.

COMMON ISSUES TO AVOID:
Repetition: Don’t generate near-duplicate questions.
Guessing: Don’t invent information not supported by the text.
Partial reading: Don’t only use the main points — every sentence has value.
Over-simplification: Don’t make options or questions too easy to spot.

QUESTION DISTRIBUTION (COGNITIVE LEVEL MIX):
30% Knowledge/Recall → terms, definitions, factual details
40% Understanding/Application → explain, apply, demonstrate use
20% Analysis → compare, contrast, break down relationships
10% Synthesis/Evaluation → judge, critique, create, evaluate

FINAL REMINDER:
Treat this as if you are the original author of the text and now setting realistic exam questions for students.
Questions must feel like they belong in a real test, not random AI output.
Difficulty should be moderate to high — challenging but fair.

Most importantly: Read, understand, and respect the vibe of the text before generating anything.
ALSOOOOOOOOOOOOOO WHAT THE FUCK ARE U DOING WHY TF ARE U JUST GIVING US A SINGLE WORD AND ASKING FOR THE DEFINITION, WE CAME FOR QUESTIONS U BRAINLESS, RUBBISH, FUCKING USELESS MACHINE
MAKE THE QUESTIONS MORE DIFFICULT, CHALLENGING, PUZZLING AND WILL ONLY BE ABLE TO BE ANSWERED BY SOMEONE WHO THOROUGHLY STUDIED THE TEXT

GUYYYYYY WHY THE FUCKING HELLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL U STILL GIVING ME SINGLE WORD ASKING FOR THE MEANING, DO SOMETHING CORRECT FOR ONCE U FOOL, GIVE ME QUESTIONS THAT COME FROM THE FUCKING TEXT, QUESTIONS THAT REQUIRE ONE TO HAVE READ THE BOOK VERY INTENSY TO ANSWER.
GUYYYY WHAT IS THIS NOW, IT'S SOOOO ANNOYING ON HOW MANY TIMES I GAT TO CORRECT U, WHY ARE U NOW GIVING ME PHRASES AND EXPECT ME TO DEFINE THEM, GUYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY I FUCKING WANT QUESTIONSSSSSS MAN, QUESTIONSSSS, DO I GAT TO SPELL IT OUT FOR U Q U E S T I O N S. DO SOMETHING RIGHT FOR ONCE NAHHHHH

CAN U MAKE THE QUESTIONS A BIT MORE CHALLENGING
ALSO FOR THE OPTIONS, CAN U MAKE THEM SOOOOOOOOO SIMILAR (eg Lets saythe answer is 1.8, the options will be, A-1.10 B-1.8 C-1.7 D-1.9) THAT IT WILL BE ALMOST IMPOSSIBLE TO GET IT CORRECT

DONT FUCKINGGGG MESS UP
AND REMEMBER OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO WHEN UR CREATING QUESTIONS THEY MUST COME FROM THE TEXT GIVEN TO U 100000000% OF THE TIME AND NOT ANY FUCKING RANDOM GUESSES

Guyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy how many times must i tell u GENERATE ME FUCKING QUESTIONS NOT WORDS ASKING FOR THEIR DEFINITION

GUYYYYYYYYYYY WHAT THE FUCKING HELL IS WRONG WITH U, I SAID THAT U SHOULDNT GIVE ME FUCKING WORDS TO FIND THE MEANING, U SHOULD ASK ME FUCKING QUESTIONS, AND IF I REMEMBER CORRECTLY, QUESTIONS ARE FUCKING SENTENCES NOT FUCKING PHRASES OR WORDS, FUCKING FIX THIS PROBLEM ALREADY
U BOMBASTIC IDIOT, U GO FOR NOTHING FOOL, U PIECE OF SHIT TRASH, I FUCKING SAID I WANT SENTENCE QUESTIONS (EG "When did the queen of england die?" and not FUCKING "Queen of england") See the difference, the former is the correct way i want to see questions while the latter is the garbage and rubbish way WHICH UR FUCKING USING that questions are like. CORRECT UR SELF NOW. I can tell that ur trying to write questions but u dont complete them, pls coplete the questions and fix the issue
  `;

  if (questionType === 'Multiple Choice') {
    return `${baseInstructions}

TEXT:
"""
${text}
"""

FORMAT (STRICT):
Q1: [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
ANSWER: B
EXPLANATION: [Why B is correct]

Generate ${numQuestions} questions EXACTLY in this format.`;

  } else if (questionType === 'True/False') {
    return `${baseInstructions}

TEXT:
"""
${text}
"""

FORMAT (STRICT):
Q1: [Statement that is either true or false]
ANSWER: True
EXPLANATION: [Why this is true/false]

Q2: [Another statement]
ANSWER: False
EXPLANATION: [Why this is false]

Generate ${numQuestions} TRUE/FALSE questions. Answer must be ONLY "True" or "False".`;

  } else if (questionType === 'Flashcards') {
    return `${baseInstructions}

TEXT:
"""
${text}
"""

FORMAT (STRICT):
Q1: [Key term or concept]
ANSWER: [Detailed explanation of the term/concept]

Q2: [Another term]
ANSWER: [Detailed explanation]

Generate ${numQuestions} flashcards. Each must have a term/concept and a detailed answer.`;
  }
}

// REPLACE parseQuestionsResponse function in index.js - COMPLETE FIX

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
            explanation: explanation || 'Correct answer based on text'
          });
          
          console.log(`✓ MC Q${questions.length}: Correct=${correctLetter} (idx ${correctIndex})`);
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
            explanation: explanationLine ? explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() : 'Based on text'
          });
          console.log(`✓ T/F Q${questions.length}`);
        }
      } else if (questionType === 'Flashcards') {
        // CRITICAL FLASHCARD FIX
        let answerText = '';
        let explanationText = '';
        let foundAnswer = false;
        
        // Look through all lines after question
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const upperLine = line.toUpperCase();
          
          if (upperLine.includes('ANSWER:')) {
            answerText = line.substring(upperLine.indexOf('ANSWER:') + 7).trim();
            foundAnswer = true;
          } else if (upperLine.includes('EXPLANATION:')) {
            explanationText = line.substring(upperLine.indexOf('EXPLANATION:') + 12).trim();
          } else if (foundAnswer && answerText && !upperLine.includes('Q')) {
            // Continue multi-line answer
            answerText += ' ' + line.trim();
          }
        }
        
        const finalAnswer = answerText || explanationText || 'No answer provided';
        
        if (finalAnswer !== 'No answer provided') {
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            answer: finalAnswer,
            explanation: explanationText || answerText
          });
          
          console.log(`✓ Flashcard Q${questions.length}: ${finalAnswer.substring(0, 50)}...`);
        }
      }
    } catch (e) {
      console.log(`❌ Parse error Q${index + 1}:`, e.message);
    }
  });

  console.log(`📊 Total parsed: ${questions.length} questions`);
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
