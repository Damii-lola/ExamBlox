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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ExamBlox backend is running',
    timestamp: new Date().toISOString(),
    ai_provider: 'Hugging Face (Free)'
  });
});

// Generate questions endpoint - MOCK version for GitHub Pages
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: text'
      });
    }

    // Create mock questions based on the input text
    const mockQuestions = {
      questions: [
        {
          question: "What is the main process described in the text?",
          options: ["Photosynthesis", "Respiration", "Digestion", "Circulation"],
          correct_answer: "Photosynthesis",
          explanation: "The text primarily discusses photosynthesis as the process plants use to convert sunlight into energy."
        },
        {
          question: "Which organisms perform the process mentioned?",
          options: [
            "Plants only",
            "Plants and animals",
            "Plants, algae and some bacteria",
            "All living organisms"
          ],
          correct_answer: "Plants, algae and some bacteria",
          explanation: "The text specifies that plants, algae, and certain bacteria perform photosynthesis."
        },
        {
          question: "What are the inputs required for this process?",
          options: [
            "Sunlight, carbon dioxide, and water",
            "Oxygen and glucose",
            "Nitrogen and minerals",
            "Heat and pressure"
          ],
          correct_answer: "Sunlight, carbon dioxide, and water",
          explanation: "Photosynthesis requires sunlight energy, carbon dioxide, and water to produce glucose and oxygen."
        }
      ],
      metadata: {
        generated_at: new Date().toISOString(),
        question_type: questionType || "multiple choice",
        difficulty: difficulty || "medium",
        num_questions: numQuestions || 3,
        note: "Mock questions for development. Add HUGGINGFACE_API_KEY to GitHub Secrets for real AI questions."
      }
    };

    // Limit questions based on requested amount
    if (numQuestions && numQuestions < mockQuestions.questions.length) {
      mockQuestions.questions = mockQuestions.questions.slice(0, numQuestions);
    }

    res.json({
      success: true,
      questions: mockQuestions,
      message: "Questions generated successfully (mock data for development)"
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error.message
    });
  }
});

// File upload endpoint (optional)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  
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
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`AI Provider: Hugging Face (Free tier)`);
});
