// routes/api.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DocumentProcessor = require('../services/documentProcessor');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 25MB.' });
    }
  }
  res.status(400).json({ error: error.message });
};

// File upload endpoint
router.post('/upload', upload.single('file'), handleUploadError, async (req, res) => {
  let filePath;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;

    // Get options from request
    const { questionType, questionCount, difficulty } = req.body;
    
    // Validate inputs
    const validatedQuestionCount = Math.min(Math.max(parseInt(questionCount) || 10, 5), 50);
    const validatedDifficulty = ['easy', 'medium', 'hard', 'exam'].includes(difficulty) 
      ? difficulty 
      : 'medium';

    // Extract text from the uploaded file
    let textContent;
    try {
      textContent = await DocumentProcessor.extractTextFromFile(filePath, req.file.mimetype);
      
      if (!textContent || textContent.trim().length < 20) {
        throw new Error('Document appears to be empty or contains too little text');
      }
    } catch (extractionError) {
      return res.status(400).json({ error: `Failed to process document: ${extractionError.message}` });
    }

    // Analyze document complexity
    const analysis = DocumentProcessor.analyzeDocumentComplexity(textContent);
    
    // Generate questions based on the actual document content
    const questions = DocumentProcessor.generateQuestions(textContent, {
      questionType,
      questionCount: validatedQuestionCount,
      difficulty: validatedDifficulty
    });

    // Clean up the uploaded file after processing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Document processed successfully',
      fileInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      contentAnalysis: analysis,
      options: {
        questionType,
        questionCount: validatedQuestionCount,
        difficulty: validatedDifficulty
      },
      questions: questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        contentLength: textContent.length,
        actualQuestionCount: questions.length,
        processingTime: 'Document processed successfully'
      }
    });

  } catch (error) {
    // Clean up file if it exists
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Additional API endpoints
router.get('/questions/sample', (req, res) => {
  const { type, difficulty, count } = req.query;
  const questionCount = Math.min(Math.max(parseInt(count) || 5, 1), 20);
  const questionDifficulty = ['easy', 'medium', 'hard', 'exam'].includes(difficulty) 
    ? difficulty 
    : 'medium';
  
  const questions = DocumentProcessor.generateSampleQuestions(type || 'multiple', questionCount, questionDifficulty);
  
  res.json({
    success: true,
    questions: questions,
    metadata: {
      count: questionCount,
      type: type || 'multiple',
      difficulty: questionDifficulty,
      generatedAt: new Date().toISOString()
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    message: 'StudyStretch API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  };
  
  res.json(health);
});

// Get server statistics
router.get('/stats', (req, res) => {
  // Count files in uploads directory
  let fileCount = 0;
  try {
    const files = fs.readdirSync('uploads/');
    fileCount = files.length;
  } catch (error) {
    fileCount = 0;
  }
  
  res.json({
    uploads: fileCount,
    serverTime: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  });
});

// Export the router with a method to apply routes to Express app
module.exports = {
  applyRoutes: function(app) {
    app.use('/api', router);
  }
};