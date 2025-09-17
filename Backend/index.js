const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExamBlox Backend API is running!',
    status: 'active',
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

    console.log('Received request:');
    console.log('- Text length:', text.length, 'characters');
    console.log('- Question type:', questionType);
    console.log('- Number of questions:', numQuestions);
    console.log('- Difficulty:', difficulty);

    // Test response - saying "hi" as requested
    console.log('Hi from the backend! API is working!');

    // Call Hugging Face API
    const response = await callHuggingFaceAPI(text, questionType, numQuestions, difficulty);

    res.json({
      success: true,
      message: 'Hi! Questions generated successfully',
      data: response,
      metadata: {
        textLength: text.length,
        questionType,
        numQuestions,
        difficulty,
        timestamp: new Date().toISOString()
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

// Hugging Face API integration
async function callHuggingFaceAPI(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  if (!API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is not configured');
  }

  console.log('Calling Hugging Face API...');
  console.log('API Key exists:', !!API_KEY);

  // For now, let's just return a test response with "Hi"
  // Later we'll implement actual Hugging Face API calls
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Hi from Hugging Face API simulation!');
      
      resolve({
        message: 'Hi there! This is from the Hugging Face API integration',
        questions: [
          {
            id: 1,
            type: questionType,
            question: `Hi! Based on your ${difficulty.toLowerCase()} level content, what is the main topic discussed?`,
            options: [
              'Technology and Innovation',
              'Educational Methods', 
              'Business Strategy',
              'Research and Development'
            ],
            correctAnswer: 0,
            explanation: 'Hi! This is a sample explanation for the generated question.'
          }
        ],
        summary: {
          totalQuestions: parseInt(numQuestions),
          difficulty: difficulty,
          type: questionType,
          sourceTextLength: text.length
        }
      });
    }, 2000); // Simulate API delay
  });
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
  console.log('Hi! ExamBlox Backend is ready to generate questions!');
});
