const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow your GitHub Pages domain
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

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API is running on Railway!',
    status: 'active',
    platform: 'railway',
    endpoints: {
      test: 'GET /',
      generate: 'POST /api/generate-questions'
    }
  });
});

// Generate questions endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty } = req.body;

    // Validate input
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
    console.log('- Platform: Railway');

    // Call Groq API to say "Hi" for now
    const response = await callGroqAPI(text, questionType, numQuestions, difficulty);

    console.log('=== GROQ RESPONSE ===');
    console.log('Groq says:', response.message);
    console.log('=== END RESPONSE ===');

    res.json({
      success: true,
      message: 'Hi from Groq AI via Railway!',
      data: response,
      metadata: {
        textLength: text.length,
        questionType,
        numQuestions,
        difficulty,
        timestamp: new Date().toISOString(),
        platform: 'railway',
        aiProvider: 'groq'
      }
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate questions',
      details: error.message
    });
  }
});

// Groq API integration - just saying "Hi" for now
async function callGroqAPI(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    throw new Error('GROQ_API_KEY is not configured');
  }

  console.log('Starting Groq API call...');
  console.log('API Key exists:', !!API_KEY);

  try {
    // Groq API endpoint
    const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    console.log('Making request to Groq API...');
    
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant."
          },
          {
            role: "user",
            content: "Just say hi to me and confirm that you can see my text. My text has " + text.length + " characters."
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    console.log('Groq API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Raw Groq API response:', JSON.stringify(result, null, 2));

    const groqMessage = result.choices[0]?.message?.content || 'Hi from Groq API!';
    console.log('Groq AI says:', groqMessage);

    return {
      message: groqMessage,
      provider: 'groq',
      model: 'llama3-8b-8192',
      textLength: text.length,
      requestParams: {
        questionType,
        numQuestions,
        difficulty
      }
    };

  } catch (error) {
    console.error('Groq API call failed:', error.message);
    throw error;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
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
  console.log(`Server is running on port ${PORT}`);
  console.log('ExamBlox Backend is ready on Railway with Groq AI!');
});
