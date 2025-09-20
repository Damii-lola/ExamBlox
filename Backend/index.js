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
  // Use much more text for deeper analysis - 20000 characters
  const truncatedText = text.length > 20000 ? text.substring(0, 20000) + '...' : text;
  
  // Analyze text type and vibe
  const textAnalysis = analyzeTextType(truncatedText);
  
  // Map difficulty levels to be more challenging
  let difficultyLevel = '';
  switch(difficulty.toLowerCase()) {
    case 'easy':
      difficultyLevel = 'medium-challenging';
      break;
    case 'medium':
      difficultyLevel = 'hard-analytical';
      break;
    case 'hard':
      difficultyLevel = 'expert-level';
      break;
    case 'exam level':
      difficultyLevel = 'nearly impossible - requiring masterful understanding';
      break;
  }
  
  let prompt = `You are the AUTHOR/CREATOR of this ${textAnalysis.type} content. As the person who wrote this material, you want to create exactly ${numQuestions} extremely challenging ${questionType.toLowerCase()} questions at ${difficultyLevel} difficulty to test if readers TRULY understand what you created.

EXTENSIVE TEXT TO ANALYZE (STUDY THIS DEEPLY):
"""
${truncatedText}
"""

AUTHOR'S PERSPECTIVE INSTRUCTIONS:
- You wrote this content - you know every nuance, connection, and subtle implication
- IGNORE any table of contents, page numbers, headers, footers, or navigational elements
- Focus ONLY on the substantial content that teaches core concepts
- Create questions that test whether someone truly absorbed and understood YOUR work
- Test synthesis of concepts, not surface-level recall
- Each question should require deep comprehension of multiple interconnected ideas
- Make questions that would challenge even advanced students who studied this material extensively

DIFFICULTY REQUIREMENTS FOR ${difficultyLevel.toUpperCase()}:
- Questions must require understanding of complex relationships between concepts
- Test ability to apply knowledge to novel scenarios you didn't explicitly cover
- Require synthesis of information from different parts of the text
- Challenge assumptions and test deeper implications
- Include questions that require multi-step reasoning
- Test understanding of WHY things work, not just WHAT they are

CRITICAL: Generate EXACTLY ${numQuestions} questions - count carefully and ensure you create the full amount requested.`;

  if (questionType === 'Multiple Choice') {
    prompt += `

For multiple choice questions - create intellectually demanding questions with sophisticated options:
- Each question should test complex understanding, not recognition
- Options must be substantive (not just single words or phrases)
- Include options that would fool someone who only partially understands
- Test connections between concepts, applications, and implications
- Vary question structures completely - avoid repetitive patterns
- Make questions that require multi-step reasoning to solve

FORMAT EXACTLY (ensure you create ALL ${numQuestions} questions):

Q1: [Complex analytical question testing deep conceptual understanding and relationships]
A) [Sophisticated option requiring comprehensive knowledge]
B) [Detailed alternative testing different aspect of understanding]
C) [Nuanced option that seems plausible but requires careful analysis to reject]
D) [Complex option testing related but distinct concept]
ANSWER: A

Q2: [Completely different style question testing synthesis and application]
A) [Multi-faceted option requiring deep comprehension]
B) [Comprehensive alternative with detailed reasoning requirements]
C) [Sophisticated distractor testing common misconceptions]
D) [Advanced option requiring expert-level understanding]
ANSWER: C

[Continue this pattern for ALL ${numQuestions} questions - count carefully to ensure you generate the exact number requested]`;

  } else if (questionType === 'True/False') {
    prompt += `

For True/False questions - create nuanced statements requiring expert-level analysis:
- Test complex relationships and subtle distinctions
- Include statements about implications and applications
- Test understanding of exceptions and edge cases
- Require deep comprehension of interconnected concepts

FORMAT EXACTLY (create ALL ${numQuestions} questions):

Q1: [Complex statement requiring sophisticated analysis of concept relationships and implications]
ANSWER: True

Q2: [Nuanced statement testing deep understanding of processes, applications, or subtle distinctions]
ANSWER: False

[Continue for ALL ${numQuestions} questions]`;

  } else if (questionType === 'Short Answer') {
    prompt += `

For Short Answer questions - require comprehensive explanations demonstrating mastery:
- Test ability to explain complex processes and relationships
- Require synthesis of multiple concepts
- Ask for analysis of WHY and HOW, not just WHAT
- Test application to new scenarios

FORMAT EXACTLY (create ALL ${numQuestions} questions):

Q1: [Complex question requiring detailed explanation of processes, relationships, or applications]

Q2: [Analytical question testing synthesis and deep understanding]

[Continue for ALL ${numQuestions} questions]`;

  } else if (questionType === 'Flashcards') {
    prompt += `

For Flashcard questions - create concept pairs requiring comprehensive understanding:
- Focus on complex concepts, processes, and relationships
- Include context and significance in answers
- Test understanding of applications and implications
- Cover key principles that require deep comprehension

FORMAT EXACTLY (create ALL ${numQuestions} flashcards):

Q1: [Complex concept, principle, or process requiring deep understanding]
ANSWER: [Comprehensive explanation with context, significance, and applications]

Q2: [Advanced concept or relationship testing expert knowledge]
ANSWER: [Detailed explanation demonstrating thorough comprehension]

[Continue for ALL ${numQuestions} flashcards]`;
  }
  
  prompt += `\n\nREMEMBER: You are the AUTHOR of this content. Create EXACTLY ${numQuestions} questions that test true mastery of YOUR work. Count your questions carefully - the reader specifically requested ${numQuestions} questions and expects exactly that number.`;
  
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
    // More aggressive parsing for multiple choice to get all questions
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift(); // Remove empty first element
    
    console.log(`📊 Found ${questionBlocks.length} question blocks to parse`);
    
    for (let i = 0; i < questionBlocks.length && questions.length < numQuestions; i++) {
      try {
        const block = questionBlocks[i];
        const lines = block.trim().split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          console.log(`⚠️ Question ${i + 1} block too short, skipping`);
          continue;
        }
        
        const questionText = lines[0]?.trim();
        if (!questionText || questionText.length < 10) {
          console.log(`⚠️ Question ${i + 1} text invalid, skipping`);
          continue;
        }
        
        const options = [];
        let answerLine = '';
        
        // More flexible option parsing
        for (let line of lines.slice(1)) {
          line = line.trim();
          if (/^[A-D]\)/.test(line)) {
            options.push(line.substring(2).trim());
          } else if (line.toUpperCase().includes('ANSWER:')) {
            answerLine = line;
          }
        }
        
        // If we don't have 4 options, try to extract from the rest of the text
        if (options.length < 4) {
          const allText = block.trim();
          const optionMatches = allText.match(/[A-D]\)\s*[^A-D\n]+/g);
          if (optionMatches && optionMatches.length >= 4) {
            options.length = 0; // Clear existing
            optionMatches.slice(0, 4).forEach(match => {
              options.push(match.substring(2).trim());
            });
          }
        }
        
        // Extract answer more flexibly
        if (!answerLine && block.includes('ANSWER')) {
          const answerMatch = block.match(/ANSWER:\s*([A-D])/i);
          if (answerMatch) {
            answerLine = `ANSWER: ${answerMatch[1]}`;
          }
        }
        
        if (questionText && options.length >= 4 && answerLine) {
          const correctLetter = answerLine.toUpperCase().split('ANSWER:')[1]?.trim().charAt(0) || 'A';
          const correctIndex = Math.max(0, Math.min(3, correctLetter.charCodeAt(0) - 65));
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            options: options.slice(0, 4),
            correctAnswer: correctIndex,
            correctLetter: correctLetter,
            explanation: `Tests masterful understanding of the material.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Parsed MC question ${questions.length}: ${questionText.substring(0, 50)}...`);
        } else {
          console.log(`❌ Failed to parse question ${i + 1}:`);
          console.log(`  - Question: ${questionText ? 'OK' : 'MISSING'}`);
          console.log(`  - Options: ${options.length}/4`);
          console.log(`  - Answer: ${answerLine ? 'OK' : 'MISSING'}`);
          
          // If we still don't have enough, try to create a basic structure
          if (questionText && questions.length < numQuestions) {
            console.log(`🔧 Attempting to salvage question ${i + 1}`);
            
            // Create basic options if missing
            const fallbackOptions = options.length > 0 ? options : [
              'Based on the text analysis',
              'According to the content provided',
              'As explained in the material',
              'From the information given'
            ];
            
            questions.push({
              id: questions.length + 1,
              type: questionType,
              question: questionText,
              options: fallbackOptions.slice(0, 4),
              correctAnswer: 0,
              correctLetter: 'A',
              explanation: `Advanced question requiring deep comprehension.`,
              source: 'groq_ai'
            });
            
            console.log(`🔧 Salvaged question ${questions.length} with fallback options`);
          }
        }
      } catch (error) {
        console.log(`❌ Error parsing MC question ${i + 1}:`, error.message);
      }
    }
    
    // If we still don't have enough questions, log the raw response for debugging
    if (questions.length < numQuestions) {
      console.log(`⚠️ Only got ${questions.length}/${numQuestions} questions`);
      console.log('📋 Raw Groq response for debugging:');
      console.log('='.repeat(100));
      console.log(groqResponse);
      console.log('='.repeat(100));
    }
    
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
            explanation: `Requires expert-level analysis and understanding.`,
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
            explanation: `Requires comprehensive explanation demonstrating mastery.`,
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
            explanation: `Complex concept requiring thorough mastery.`,
            source: 'groq_ai'
          });
          
          console.log(`✅ Parsed Flashcard ${questions.length}: ${questionText.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`❌ Error parsing Flashcard ${index + 1}:`, error.message);
      }
    });
  }
  
  console.log(`📊 Final result: Successfully parsed ${questions.length} out of ${numQuestions} requested questions`);
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
