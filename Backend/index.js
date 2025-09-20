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
      simpleTest: 'GET /test',
      simple: 'GET/POST /simple',
      generate: 'POST /api/generate-questions'
    }
  });
});

// Simple test endpoint - just to verify Railway works
app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({
    message: 'Test endpoint works!',
    timestamp: new Date().toISOString(),
    platform: 'railway',
    status: 'success'
  });
});

// Another test endpoint that accepts both GET and POST
app.all('/simple', (req, res) => {
  console.log('Simple endpoint called with method:', req.method);
  res.json({
    message: 'Simple endpoint responding',
    method: req.method,
    working: true,
    timestamp: new Date().toISOString()
  });
});

// Generate questions endpoint - THE MAIN FUNCTION
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
    console.log('- Text preview:', text.substring(0, 200) + '...');

    // Call Groq API to generate real questions
    const response = await generateQuestionsWithGroq(text, questionType, numQuestions, difficulty);

    // Log the generated questions to console
    console.log('=== GROQ GENERATED QUESTIONS ===');
    if (response.questions && response.questions.length > 0) {
      response.questions.forEach((q, index) => {
        console.log(`\n--- QUESTION ${index + 1} ---`);
        console.log(`Question: ${q.question}`);
        if (q.options) {
          q.options.forEach((option, i) => {
            console.log(`${String.fromCharCode(65 + i)}) ${option}`);
          });
          console.log(`Correct Answer: ${q.correctLetter || String.fromCharCode(65 + q.correctAnswer)}`);
        } else if (q.correctAnswer) {
          console.log(`Answer: ${q.correctAnswer}`);
        }
        if (q.explanation) {
          console.log(`Explanation: ${q.explanation}`);
        }
      });
    } else {
      console.log('❌ No questions were generated');
      console.log('Raw Groq response:', response.groqRawResponse);
    }
    console.log('=== END OF GROQ QUESTIONS ===');

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
        platform: 'railway',
        aiProvider: 'groq'
      }
    });

  } catch (error) {
    console.error('❌ Error generating questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate questions',
      details: error.message
    });
  }
});

// MAIN QUESTION GENERATION FUNCTION
async function generateQuestionsWithGroq(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ GROQ_API_KEY is not configured');
    throw new Error('GROQ_API_KEY is not configured');
  }

  console.log('🤖 Starting Groq question generation...');
  console.log('📊 API Key exists:', !!API_KEY);
  console.log('📝 Processing text length:', text.length, 'characters');

  try {
    // Groq API endpoint
    const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Create the question generation prompt
    const prompt = createQuestionGenerationPrompt(text, questionType, numQuestions, difficulty);
    
    console.log('📋 Sending question generation prompt to Groq...');
    console.log('🎯 Requesting:', numQuestions, questionType, 'questions at', difficulty, 'level');
    
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
            content: "You are an expert educator who creates high-quality educational questions. Always follow the exact format requested and generate questions that test comprehension of the provided text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    console.log('📡 Groq API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', response.status, response.statusText);
      console.error('❌ Error details:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Raw Groq API response received');

    const groqGeneratedText = result.choices[0]?.message?.content || 'No response from Groq';
    
    console.log('📝 Groq Generated Content:');
    console.log('='.repeat(80));
    console.log(groqGeneratedText);
    console.log('='.repeat(80));

    // Parse the questions from Groq's response
    const parsedQuestions = parseGroqQuestionsResponse(groqGeneratedText, questionType, numQuestions);

    console.log(`✅ Successfully parsed ${parsedQuestions.length} questions from Groq response`);

    return {
      message: `Successfully generated ${parsedQuestions.length} questions using Groq AI`,
      groqRawResponse: groqGeneratedText,
      questions: parsedQuestions,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      textLength: text.length,
      requestParams: {
        questionType,
        numQuestions,
        difficulty
      }
    };

  } catch (error) {
    console.error('💥 Groq API call failed:', error.message);
    throw error;
  }
}

// CREATE QUESTION GENERATION PROMPT
function createQuestionGenerationPrompt(text, questionType, numQuestions, difficulty) {
  // Use more text to get better context - increase to 5000 characters
  const truncatedText = text.length > 5000 ? text.substring(0, 5000) + '...' : text;
  
  // Analyze text type and vibe
  const textAnalysis = analyzeTextType(truncatedText);
  
  let prompt = `Analyze this ${textAnalysis.type} text and create exactly ${numQuestions} high-quality ${questionType.toLowerCase()} questions at ${difficulty.toLowerCase()} difficulty.

TEXT TO ANALYZE:
"""
${truncatedText}
"""

TEXT ANALYSIS:
- Content Type: ${textAnalysis.type}
- Subject Focus: ${textAnalysis.subject}
- Question Style: ${textAnalysis.style}

CRITICAL INSTRUCTIONS:
- IGNORE table of contents, page numbers, headers, footers, and navigation elements
- Focus ONLY on substantial content that teaches or explains concepts
- Create exactly ${numQuestions} questions - no more, no less
- Match the content's vibe: ${textAnalysis.style}
- Test understanding of CONCEPTS, not author's personal opinions (unless it's literature/story)
- Use varied question structures and vocabulary
- Each question must test different aspects and use different wording patterns`;

  if (questionType === 'Multiple Choice') {
    prompt += `

For multiple choice questions:
- Create sophisticated questions that test conceptual understanding
- Options should be substantive and require real knowledge to distinguish
- Avoid repetitive phrasing across questions
- Test practical application of concepts, not memorization
- Make distractors plausible but clearly wrong to someone who understands the material

FORMAT EXACTLY:

Q1: [Sophisticated question testing core concept]
A) [Substantial option requiring understanding]
B) [Complex alternative that tests different aspect]
C) [Detailed option that could be plausible but wrong]
D) [Nuanced option requiring analysis]
ANSWER: A

Q2: [Different style question testing another concept]
A) [Different structure from previous options]
B) [Varied vocabulary and approach]
C) [Alternative perspective or application]
D) [Different type of distractor]
ANSWER: C

Continue for ALL ${numQuestions} questions with varied question styles and sophisticated content.`;

  } else if (questionType === 'True/False') {
    prompt += `

For True/False questions:
- Create nuanced statements that require deep understanding
- Test relationships between concepts, not simple facts
- Include statements about implications, applications, and connections
- Vary the complexity and focus of each statement
- Balance True and False answers

FORMAT EXACTLY:

Q1: [Complex statement requiring analysis of concept relationships]
ANSWER: True

Q2: [Nuanced statement about practical application or implication]
ANSWER: False

Continue for ALL ${numQuestions} questions with sophisticated content.`;

  } else if (questionType === 'Short Answer') {
    prompt += `

For Short Answer questions:
- Create questions requiring 2-3 sentence explanations
- Test ability to explain processes, relationships, or applications
- Focus on HOW and WHY, not just WHAT
- Require synthesis and analysis skills
- Vary question types: explanatory, comparative, analytical, applied

FORMAT EXACTLY:

Q1: [Question requiring explanation of concept or process]

Q2: [Question requiring analysis or comparison]

Continue for ALL ${numQuestions} questions with varied analytical focuses.`;

  } else if (questionType === 'Flashcards') {
    prompt += `

For Flashcard questions:
- Create concept-definition pairs that test key understanding
- Include both terms and their applications
- Test processes, principles, and relationships
- Make definitions substantial and complete
- Focus on concepts that require understanding, not memorization

FORMAT EXACTLY:

Q1: [Key concept, principle, or process]
ANSWER: [Comprehensive explanation with context and significance]

Q2: [Different type of concept or application]
ANSWER: [Detailed explanation with practical relevance]

Continue for ALL ${numQuestions} flashcards with varied concept types.`;
  }
  
  prompt += `\n\nRemember: Create EXACTLY ${numQuestions} questions. Test conceptual understanding appropriate for ${textAnalysis.subject} content. Use varied vocabulary and question structures.`;
  
  return prompt;
}

// ANALYZE TEXT TYPE AND CONTENT
function analyzeTextType(text) {
  const lowerText = text.toLowerCase();
  
  // Detect subject area
  let subject = 'general knowledge';
  let type = 'educational text';
  let style = 'Focus on conceptual understanding and practical application';
  
  // Science and Technical
  if (lowerText.includes('equation') || lowerText.includes('formula') || lowerText.includes('theorem') || lowerText.includes('hypothesis')) {
    subject = 'scientific/technical';
    style = 'Test principles, processes, and problem-solving ability';
  }
  
  // Business
  if (lowerText.includes('business') || lowerText.includes('management') || lowerText.includes('strategy') || lowerText.includes('market')) {
    subject = 'business';
    style = 'Test strategic thinking, case analysis, and practical application';
  }
  
  // History
  if (lowerText.includes('century') || lowerText.includes('historical') || lowerText.includes('period') || lowerText.includes('era')) {
    subject = 'history';
    style = 'Test understanding of causes, effects, and historical significance';
  }
  
  // Literature/Story
  if (lowerText.includes('character') || lowerText.includes('plot') || lowerText.includes('narrative') || lowerText.includes('story')) {
    subject = 'literature';
    type = 'literary text';
    style = 'Test literary analysis, themes, and author\'s techniques';
  }
  
  // Philosophy
  if (lowerText.includes('philosophy') || lowerText.includes('ethical') || lowerText.includes('moral') || lowerText.includes('argument')) {
    subject = 'philosophy';
    style = 'Test logical reasoning, argument analysis, and ethical implications';
  }
  
  // Medical/Health
  if (lowerText.includes('medical') || lowerText.includes('health') || lowerText.includes('disease') || lowerText.includes('treatment')) {
    subject = 'medical/health';
    style = 'Test diagnostic thinking, treatment principles, and clinical application';
  }
  
  return { type, subject, style };
}

// PARSE GROQ RESPONSE INTO STRUCTURED QUESTIONS
function parseGroqQuestionsResponse(groqResponse, questionType, numQuestions) {
  console.log('🔄 Parsing Groq response into structured questions...');
  console.log(`🎯 Target: ${numQuestions} ${questionType} questions`);
  
  const questions = [];
  
  if (questionType === 'Multiple Choice') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift(); // Remove empty first element
    
    console.log(`📊 Found ${questionBlocks.length} question blocks to parse`);
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return; // Stop when we have enough
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        
        const questionText = lines[0]?.trim();
        const options = [];
        let answerLine = '';
        
        for (let line of lines.slice(1)) {
          line = line.trim();
          if (/^[A-D]\)/.test(line)) {
            options.push(line.substring(2).trim());
          } else if (line.toUpperCase().includes('ANSWER:')) {
            answerLine = line;
          }
        }
        
        if (questionText && options.length >= 4 && answerLine) {
          const correctLetter = answerLine.toUpperCase().split('ANSWER:')[1].trim().charAt(0);
          const correctIndex = Math.max(0, Math.min(3, correctLetter.charCodeAt(0) - 65));
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            options: options.slice(0, 4),
            correctAnswer: correctIndex,
            correctLetter: correctLetter,
            explanation: `Tests conceptual understanding of the material.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Parsed MC question ${questions.length}: ${questionText.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`❌ Error parsing MC question ${index + 1}:`, error.message);
      }
    });
    
  } else if (questionType === 'True/False') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    console.log(`📊 Found ${questionBlocks.length} T/F question blocks to parse`);
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const answerLine = lines.find(line => line.toUpperCase().includes('ANSWER:'));
        
        if (questionText && answerLine) {
          const answer = answerLine.toUpperCase().includes('TRUE') ? 'True' : 'False';
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            correctAnswer: answer,
            explanation: `Tests understanding of key concepts and relationships.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Parsed T/F question ${questions.length}: ${questionText.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`❌ Error parsing T/F question ${index + 1}:`, error.message);
      }
    });
    
  } else if (questionType === 'Short Answer') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    console.log(`📊 Found ${questionBlocks.length} Short Answer question blocks to parse`);
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const questionText = block.trim();
        
        if (questionText && questionText.length > 10) {
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            explanation: `Requires comprehensive explanation demonstrating understanding.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Parsed SA question ${questions.length}: ${questionText.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`❌ Error parsing SA question ${index + 1}:`, error.message);
      }
    });
    
  } else if (questionType === 'Flashcards') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    console.log(`📊 Found ${questionBlocks.length} Flashcard blocks to parse`);
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const answerLine = lines.find(line => line.toUpperCase().includes('ANSWER:'));
        
        if (questionText && answerLine) {
          const answer = answerLine.substring(answerLine.toUpperCase().indexOf('ANSWER:') + 7).trim();
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            answer: answer,
            explanation: `Key concept requiring thorough understanding.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Parsed Flashcard ${questions.length}: ${questionText.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`❌ Error parsing Flashcard ${index + 1}:`, error.message);
      }
    });
  }
  
  // If we didn't get enough questions, log the issue
  if (questions.length < numQuestions) {
    console.log(`⚠️ Only parsed ${questions.length} out of ${numQuestions} requested questions`);
    console.log('Raw Groq response for debugging:');
    console.log('='.repeat(50));
    console.log(groqResponse);
    console.log('='.repeat(50));
  }
  
  console.log(`📊 Final result: Successfully parsed ${questions.length} questions`);
  return questions;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
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
  console.log(`✅ Server is running on port ${PORT}`);
  console.log('🚀 ExamBlox Backend is ready on Railway with Groq AI!');
});
