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
  // Limit text to prevent token overflow - use first 3000 characters
  const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text;
  
  let difficultyInstructions = '';
  let questionTypes = '';
  
  // Enhanced difficulty instructions
  switch(difficulty.toLowerCase()) {
    case 'easy':
      difficultyInstructions = 'Focus on basic recall and recognition of key facts and concepts directly stated in the text.';
      break;
    case 'medium':
      difficultyInstructions = 'Focus on comprehension and application - require understanding of relationships between concepts, cause-and-effect, and drawing reasonable conclusions from the text.';
      break;
    case 'hard':
      difficultyInstructions = 'Focus on analysis and synthesis - require critical thinking, evaluation of arguments, comparison of ideas, identification of assumptions, and deeper implications of the content.';
      break;
    case 'exam level':
      difficultyInstructions = 'Create challenging questions that test advanced understanding, critical analysis, synthesis of multiple concepts, evaluation of evidence, and application to new scenarios.';
      break;
  }

  // Enhanced question type instructions
  if (questionType === 'Multiple Choice') {
    questionTypes = `Create sophisticated multiple choice questions where:
- The correct answer requires genuine understanding, not just keyword matching
- Distractors are plausible and test common misconceptions
- Questions test WHY, HOW, and implications, not just WHAT
- Include questions about author's intent, underlying assumptions, and broader significance`;
  }

  let prompt = `You are creating ${difficulty.toLowerCase()} level ${questionType.toLowerCase()} questions for advanced learners. ${difficultyInstructions}

TEXT TO ANALYZE:
"""
${truncatedText}
"""

ADVANCED QUESTION CREATION INSTRUCTIONS:
${questionTypes}

Create questions that test:
1. Conceptual understanding and relationships between ideas
2. Critical analysis of arguments and evidence presented
3. Ability to synthesize information and draw conclusions
4. Understanding of context, implications, and broader significance
5. Application of concepts to new situations or scenarios

Avoid basic recall questions. Focus on higher-order thinking skills.

REQUIRED FORMAT:`;

  if (questionType === 'Multiple Choice') {
    prompt += `

You MUST format your response EXACTLY like this:

Q1: [Sophisticated analytical question that tests deep understanding of concepts, relationships, or implications from the text]
A) [Plausible option that tests understanding]
B) [Another sophisticated option]
C) [Complex option that requires analysis]
D) [Nuanced option that could be tempting but wrong]
ANSWER: A

Q2: [Advanced question about author's argument, methodology, assumptions, or broader implications]
A) [Option requiring critical thinking]
B) [Option testing synthesis of ideas]
C) [Option about underlying concepts]
D) [Option testing evaluation skills]
ANSWER: C

Continue this EXACT format for all ${numQuestions} questions. Make each question progressively more challenging and test different analytical skills.`;

  } else if (questionType === 'True/False') {
    prompt += `

You MUST format your response EXACTLY like this:

Q1: [Complex statement that requires analysis of relationships, implications, or deeper meaning from the text - not simple facts]
ANSWER: True

Q2: [Nuanced statement about author's argument, methodology, or conclusions that requires critical evaluation]
ANSWER: False

Continue this EXACT format for all ${numQuestions} questions. Focus on statements that test analytical thinking, not memorization.`;
  }
  
  return prompt;
}

// PARSE GROQ RESPONSE INTO STRUCTURED QUESTIONS
function parseGroqQuestionsResponse(groqResponse, questionType, numQuestions) {
  console.log('🔄 Parsing Groq response into structured questions...');
  
  const questions = [];
  
  if (questionType === 'Multiple Choice') {
    // Split by Q1:, Q2:, Q3:, etc.
    const questionBlocks = groqResponse.split(/Q\d+:/);
    
    // Remove empty first element
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        
        if (lines.length < 5) {
          console.log(`⚠️ Question ${index + 1} has insufficient lines:`, lines.length);
          return;
        }
        
        const questionText = lines[0].trim();
        const options = [];
        let answerLine = '';
        
        // Extract options and answer
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
            id: index + 1,
            type: questionType,
            question: questionText,
            options: options.slice(0, 4), // Ensure exactly 4 options
            correctAnswer: correctIndex,
            correctLetter: correctLetter,
            explanation: `Generated by Groq AI from your document content.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Successfully parsed question ${index + 1}: ${questionText.substring(0, 50)}...`);
        } else {
          console.log(`❌ Failed to parse question ${index + 1} - missing components`);
          console.log(`Question: "${questionText}", Options: ${options.length}, Answer: "${answerLine}"`);
        }
      } catch (error) {
        console.log(`❌ Error parsing question ${index + 1}:`, error.message);
      }
    });
    
  } else if (questionType === 'True/False') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const answerLine = lines.find(line => line.toUpperCase().includes('ANSWER:'));
        
        if (questionText && answerLine) {
          const answer = answerLine.toUpperCase().includes('TRUE') ? 'True' : 'False';
          
          questions.push({
            id: index + 1,
            type: questionType,
            question: questionText,
            correctAnswer: answer,
            explanation: `Generated by Groq AI from your document content.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Successfully parsed T/F question ${index + 1}: ${questionText.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`❌ Error parsing T/F question ${index + 1}:`, error.message);
      }
    });
  }
  
  console.log(`📊 Final result: Successfully parsed ${questions.length} out of ${numQuestions} requested questions`);
  return questions.slice(0, numQuestions);
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
