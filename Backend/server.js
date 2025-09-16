const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Test endpoint to check DeepSeek connection
app.get('/api/test', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'Hello, are you working? Respond with "Yes, I am working!" if you receive this message.' }
        ],
        temperature: 0.7,
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    res.json({ 
      success: true, 
      message: 'DeepSeek API connection successful!',
      response: response.data 
    });
  } catch (error) {
    console.error('DeepSeek API error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'DeepSeek API connection failed',
      error: error.response?.data || error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ExamBlox backend is running',
    timestamp: new Date().toISOString()
  });
});

// Generate questions endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty } = req.body;
    
    if (!text || !questionType || !numQuestions || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: text, questionType, numQuestions, difficulty'
      });
    }

    // Create prompt for DeepSeek
    const prompt = `
    Based on the following text, generate ${numQuestions} ${questionType} questions with 4 options each and indicate the correct answer.
    Difficulty level: ${difficulty}
    
    Text: ${text}
    
    Format the response as JSON with the following structure:
    {
      "questions": [
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correct_answer": "option1",
          "explanation": "brief explanation of why this is correct"
        }
      ]
    }
    `;

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that generates educational questions based on provided text. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Extract and parse the response
    const generatedContent = response.data.choices[0].message.content;
    
    // Try to extract JSON from the response
    let questionsData;
    try {
      // Remove code block markers if present
      const cleanContent = generatedContent.replace(/```json|```/g, '').trim();
      questionsData = JSON.parse(cleanContent);
    } catch (parseError) {
      // If JSON parsing fails, return the raw content
      questionsData = {
        raw_response: generatedContent,
        note: "Could not parse JSON response from AI"
      };
    }

    res.json({
      success: true,
      questions: questionsData,
      metadata: {
        questionType,
        numQuestions,
        difficulty,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating questions:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error.response?.data || error.message
    });
  }
});

// File upload endpoint (if needed in the future)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  
  // Here you would process the file
  res.json({
    success: true,
    message: 'File uploaded successfully',
    filename: req.file.originalname,
    size: req.file.size
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`ExamBlox backend server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`DeepSeek test available at: http://localhost:${PORT}/api/test`);
});
