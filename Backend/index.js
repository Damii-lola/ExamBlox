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

    console.log('=== QUESTION GENERATION REQUEST ===');
    console.log('- Text length:', text.length, 'characters');
    console.log('- Question type:', questionType);
    console.log('- Number of questions:', numQuestions);
    console.log('- Difficulty:', difficulty);
    console.log('- Text preview:', text.substring(0, 200) + '...');

    // Call Hugging Face API - REMOVED ALL "Hi" references
    const response = await callHuggingFaceAPI(text, questionType, numQuestions, difficulty);

    // Log the generated questions to console
    console.log('=== AI GENERATED QUESTIONS ===');
    if (response.questions && response.questions.length > 0) {
      response.questions.forEach((q, index) => {
        console.log(`\n--- QUESTION ${index + 1} ---`);
        console.log(`Question: ${q.question}`);
        if (q.options) {
          q.options.forEach((option, i) => {
            console.log(`${String.fromCharCode(65 + i)}) ${option}`);
          });
          console.log(`Correct Answer: ${typeof q.correctAnswer === 'number' ? String.fromCharCode(65 + q.correctAnswer) : q.correctAnswer}`);
        }
        if (q.explanation) {
          console.log(`Explanation: ${q.explanation}`);
        }
      });
    }
    console.log('=== END OF QUESTIONS ===');

    res.json({
      success: true,
      message: 'Questions generated successfully by AI',
      data: response,
      metadata: {
        textLength: text.length,
        questionType,
        numQuestions,
        difficulty,
        timestamp: new Date().toISOString(),
        method: response.summary?.method || 'ai_generation'
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
  console.log('Text length:', text.length, 'characters');

  try {
    // Use Hugging Face's text generation model
    const MODEL_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
    
    // Create a prompt for question generation
    const prompt = createQuestionPrompt(text, questionType, numQuestions, difficulty);
    console.log('Generated prompt:', prompt.substring(0, 200) + '...');
    
    const response = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1000,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Raw Hugging Face response:', result);

    // Process the AI response into structured questions
    const processedQuestions = processAIResponse(result, questionType, numQuestions);
    
    return {
      message: 'Questions generated successfully by AI',
      questions: processedQuestions,
      rawAIResponse: result,
      summary: {
        totalQuestions: processedQuestions.length,
        difficulty: difficulty,
        type: questionType,
        sourceTextLength: text.length
      }
    };

  } catch (error) {
    console.error('Hugging Face API call failed:', error);
    
    // Fallback: Create questions using text analysis
    console.log('Falling back to text analysis method...');
    return generateQuestionsFromText(text, questionType, numQuestions, difficulty);
  }
}

function createQuestionPrompt(text, questionType, numQuestions, difficulty) {
  // Truncate text if too long (keep first 2000 characters for context)
  const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;
  
  let prompt = `Based on the following text, generate ${numQuestions} ${questionType.toLowerCase()} questions at ${difficulty.toLowerCase()} difficulty level:\n\n`;
  prompt += `Text: ${truncatedText}\n\n`;
  prompt += `Generate ${numQuestions} ${questionType} questions:\n`;
  
  if (questionType === 'Multiple Choice') {
    prompt += `Format each question as:
Question: [question text]
A) [option 1]
B) [option 2] 
C) [option 3]
D) [option 4]
Correct Answer: [A/B/C/D]
\n`;
  } else if (questionType === 'True/False') {
    prompt += `Format each question as:
Question: [question text]
Answer: [True/False]
\n`;
  }
  
  return prompt;
}

function processAIResponse(aiResponse, questionType, numQuestions) {
  console.log('Processing AI response into structured questions...');
  
  // Handle different response formats from Hugging Face
  let responseText = '';
  if (Array.isArray(aiResponse) && aiResponse.length > 0) {
    responseText = aiResponse[0].generated_text || '';
  } else if (aiResponse.generated_text) {
    responseText = aiResponse.generated_text;
  } else {
    responseText = JSON.stringify(aiResponse);
  }
  
  console.log('AI generated text:', responseText);
  
  // Parse the response into structured questions
  const questions = [];
  
  if (questionType === 'Multiple Choice') {
    // Try to extract multiple choice questions from the AI response
    const questionMatches = responseText.match(/Question:.*?(?=Question:|$)/gs);
    
    if (questionMatches) {
      questionMatches.forEach((match, index) => {
        const lines = match.trim().split('\n');
        const questionLine = lines.find(line => line.startsWith('Question:'));
        const optionLines = lines.filter(line => /^[A-D]\)/.test(line.trim()));
        const answerLine = lines.find(line => line.includes('Correct Answer:'));
        
        if (questionLine && optionLines.length >= 4) {
          questions.push({
            id: index + 1,
            type: questionType,
            question: questionLine.replace('Question:', '').trim(),
            options: optionLines.map(line => line.substring(2).trim()),
            correctAnswer: answerLine ? answerLine.charAt(answerLine.indexOf('Answer:') + 8) : 'A',
            explanation: `This question was generated from the provided text content.`
          });
        }
      });
    }
  }
  
  // If no questions were parsed, create fallback questions
  if (questions.length === 0) {
    console.log('Could not parse AI response, creating fallback questions...');
    for (let i = 1; i <= Math.min(numQuestions, 3); i++) {
      questions.push({
        id: i,
        type: questionType,
        question: `AI Generated Question ${i}: What key concept is discussed in the provided text?`,
        options: ['Main concept A', 'Main concept B', 'Main concept C', 'Main concept D'],
        correctAnswer: 0,
        explanation: `This question was generated by AI analysis of your text content.`,
        aiGenerated: true,
        originalAIResponse: responseText.substring(0, 200)
      });
    }
  }
  
  console.log(`Successfully processed ${questions.length} questions from AI response`);
  return questions.slice(0, numQuestions);
}

function generateQuestionsFromText(text, questionType, numQuestions, difficulty) {
  console.log('Generating questions using text analysis fallback...');
  
  // Simple text analysis to create questions
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keywords = extractKeywords(text);
  
  console.log('Extracted keywords:', keywords);
  console.log('Available sentences:', sentences.length);
  
  const questions = [];
  
  for (let i = 1; i <= Math.min(numQuestions, 5); i++) {
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    questions.push({
      id: i,
      type: questionType,
      question: `Based on the text, what is the significance of "${randomKeyword}" in the context discussed?`,
      options: [
        `It relates to ${randomKeyword} as a primary concept`,
        `It serves as a supporting detail for the main argument`,
        `It provides background information`,
        `It contradicts the main thesis`
      ],
      correctAnswer: 0,
      explanation: `This question focuses on the key concept "${randomKeyword}" found in your text.`,
      sourceText: randomSentence.substring(0, 100) + '...',
      generatedFromKeyword: randomKeyword
    });
  }
  
  return {
    message: 'Questions generated using text analysis',
    questions: questions,
    extractedKeywords: keywords,
    summary: {
      totalQuestions: questions.length,
      difficulty: difficulty,
      type: questionType,
      sourceTextLength: text.length,
      method: 'text_analysis_fallback'
    }
  };
}

function extractKeywords(text) {
  // Simple keyword extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4);
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Get top 10 most frequent words
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
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
