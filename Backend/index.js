// index.js - FIXED VERSION with Rate Limiting
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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

let emailConfigured = false;
let verifiedSender = null;

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_VERIFIED_SENDER) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
  emailConfigured = true;
  console.log('✅ SendGrid configured');
}

const otpStorage = new Map();

app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API',
    status: 'active',
    model: 'llama-3.3-70b-versatile'
  });
});

// ===== USER ENDPOINTS (Keep existing) =====
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

// ===== OTP ENDPOINTS (Keep existing) =====
app.post('/api/send-otp', async (req, res) => {
  try {
    if (!emailConfigured) {
      return res.status(503).json({ success: false, error: 'Email service not configured' });
    }
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email and name required' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(email.toLowerCase(), {
      otp, email, name,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    const msg = {
      to: email,
      from: { email: verifiedSender, name: 'ExamBlox' },
      subject: 'Your ExamBlox Verification Code',
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello ${name}!</h2>
        <p>Your verification code is:</p>
        <h1 style="background: #6a4bff; color: white; padding: 20px; text-align: center; font-size: 36px; letter-spacing: 10px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>`
    };
    
    await sgMail.send(msg);
    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

// ===== FIXED QUESTION GENERATION =====
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
        model: 'llama-3.3-70b-versatile'
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate questions', message: error.message });
  }
});

// ===== CORE GENERATION FUNCTION (FIXED) =====
async function generateQuestionsWithGroq(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  let allQuestions = [];
  const maxAttempts = 3;
  let attempt = 1;

  // Generate in smaller batches with delays
  const batchSize = 5;
  const batches = Math.ceil(numQuestions / batchSize);

  while (allQuestions.length < numQuestions && attempt <= maxAttempts) {
    try {
      console.log(`📝 Attempt ${attempt}: Generating ${numQuestions - allQuestions.length} questions...`);

      for (let i = 0; i < batches; i++) {
        const needed = Math.min(batchSize, numQuestions - allQuestions.length);
        if (needed <= 0) break;

        const newQuestions = await generateBatchWithDelay(text, questionType, needed * 2, difficulty, API_KEY);
        
        // Deduplicate and add
        const unique = newQuestions.filter(q => 
          !allQuestions.some(existing => 
            calculateSimilarity(q.question, existing.question) > 0.7
          )
        );

        allQuestions = [...allQuestions, ...unique].slice(0, numQuestions);
        
        console.log(`✓ Batch ${i + 1}: ${unique.length} new questions (Total: ${allQuestions.length}/${numQuestions})`);

        // Delay between batches to avoid rate limit
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

// ===== BATCH GENERATOR WITH RETRY =====
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
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert exam creator. Generate ${difficulty} difficulty ${questionType} questions. CRITICAL: Read the ENTIRE text carefully before generating questions. Questions must come directly from the text content.`
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

// ===== PROMPT CREATOR =====
function createPrompt(text, questionType, numQuestions, difficulty) {
  const base = `Read this text COMPLETELY and generate ${numQuestions} ${difficulty} difficulty ${questionType} questions.

TEXT:
"""
${text}
"""

RULES:
- Questions MUST come from the text above
- Make questions challenging but fair
- Avoid single-word definitions
- Use full sentences for questions`;

  if (questionType === 'Multiple Choice') {
    return `${base}

FORMAT (EXACT):
Q1: [Full question sentence]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
ANSWER: B
EXPLANATION: [Why B is correct]

Generate ${numQuestions} questions in this exact format.`;
  } else if (questionType === 'True/False') {
    return `${base}

FORMAT (EXACT):
Q1: [Statement]
ANSWER: True
EXPLANATION: [Why true/false]

Generate ${numQuestions} questions.`;
  } else {
    return `${base}

FORMAT (EXACT):
Q1: [Concept/term]
ANSWER: [Detailed explanation]

Generate ${numQuestions} flashcards.`;
  }
}

// ===== PARSER (FIXED TYPO) =====
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
            type: questionType, // ✅ FIXED: was questionTyp
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
            type: questionType, // ✅ FIXED
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
            type: questionType, // ✅ FIXED
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

// ===== HELPER FUNCTIONS =====
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
  console.log('🤖 Model: llama-3.3-70b-versatile');
  console.log('📧 Email:', emailConfigured ? 'Ready' : 'Check .env');
});
