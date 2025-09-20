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

// MAIN QUESTION GENERATION FUNCTION WITH MULTI-BATCH SUPPORT
async function generateQuestionsWithGroq(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    throw new Error('GROQ_API_KEY is not configured');
  }

  console.log('Starting multi-batch Groq question generation...');
  console.log('Processing text length:', text.length, 'characters');
  console.log('Target questions:', numQuestions);

  let allQuestions = [];
  let attempt = 1;
  const maxAttempts = 5;

  while (allQuestions.length < numQuestions && attempt <= maxAttempts) {
    const remaining = numQuestions - allQuestions.length;
    console.log(`\n=== BATCH ${attempt} ===`);
    console.log(`Need ${remaining} more questions (have ${allQuestions.length}/${numQuestions})`);

    try {
      // Generate questions for this batch
      const batchQuestions = await generateQuestionBatch(text, questionType, remaining, difficulty, allQuestions, API_KEY);
      
      // Add unique questions only
      const uniqueQuestions = filterUniqueQuestions(batchQuestions, allQuestions);
      allQuestions = allQuestions.concat(uniqueQuestions);
      
      console.log(`Batch ${attempt} added ${uniqueQuestions.length} unique questions`);
      console.log(`Total progress: ${allQuestions.length}/${numQuestions}`);

      if (allQuestions.length >= numQuestions) {
        console.log(`SUCCESS: Generated ${allQuestions.length} questions!`);
        break;
      }

    } catch (error) {
      console.error(`Batch ${attempt} failed:`, error.message);
    }

    attempt++;
  }

  // Limit to exact number requested
  const finalQuestions = allQuestions.slice(0, numQuestions);

  return {
    message: `Generated ${finalQuestions.length} unique questions using ${attempt - 1} API calls`,
    groqRawResponse: `Multi-batch generation completed`,
    questions: finalQuestions,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    textLength: text.length,
    batchesUsed: attempt - 1,
    requestParams: {
      questionType,
      numQuestions,
      difficulty
    }
  };
}

// GENERATE SINGLE BATCH OF QUESTIONS
async function generateQuestionBatch(text, questionType, numQuestions, difficulty, existingQuestions, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Get random text sections instead of sequential
  const textSections = getRandomTextSections(text, numQuestions);
  
  const prompt = createAdvancedQuestionPrompt(textSections, questionType, numQuestions, difficulty, existingQuestions);
  
  console.log(`Making API request for ${numQuestions} questions...`);
  
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
          content: "You are an expert educator creating challenging questions that test deep comprehension of content. Focus on what the student learned from reading, not on author analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const groqGeneratedText = result.choices[0]?.message?.content || '';
  
  console.log('Groq response received, parsing questions...');
  
  const parsedQuestions = parseGroqQuestionsResponse(groqGeneratedText, questionType, numQuestions);
  return parsedQuestions;
}

// GET RANDOM TEXT SECTIONS FROM DIFFERENT PARTS
function getRandomTextSections(text, numQuestions) {
  // Split text into chunks and select random sections
  const chunkSize = Math.floor(text.length / Math.max(numQuestions, 10));
  const sections = [];
  
  for (let i = 0; i < numQuestions; i++) {
    const randomStart = Math.floor(Math.random() * (text.length - chunkSize));
    const section = text.substring(randomStart, randomStart + chunkSize);
    sections.push(section);
  }
  
  return sections.join('\n\n--- SECTION BREAK ---\n\n');
}

// CREATE IMPROVED QUESTION PROMPT
function createAdvancedQuestionPrompt(textSections, questionType, numQuestions, difficulty, existingQuestions) {
  const difficultyLevel = {
    'easy': 'medium-challenging',
    'medium': 'hard-analytical', 
    'hard': 'expert-level',
    'exam level': 'extremely difficult requiring mastery'
  }[difficulty.toLowerCase()] || 'challenging';

  let prompt = `Create exactly ${numQuestions} unique ${questionType.toLowerCase()} questions at ${difficultyLevel} difficulty based on these text sections:

TEXT SECTIONS (from random parts of the content):
"""
${textSections}
"""

CRITICAL REQUIREMENTS:
- Test comprehension of CONTENT and CONCEPTS, not author intentions
- Focus on what students learned from reading: facts, processes, relationships, applications
- Each question must test different concepts and use varied phrasing
- Questions should test understanding across different topics/chapters
- Make questions challenging but focused on material comprehension
- AVOID repetitive question patterns or similar concepts`;

  // Add uniqueness check if there are existing questions
  if (existingQuestions.length > 0) {
    const existingTopics = existingQuestions.map(q => q.question.substring(0, 100)).join('\n- ');
    prompt += `\n\nIMPORTANT - AVOID THESE EXISTING QUESTION TOPICS:\n- ${existingTopics}\n\nCreate questions on completely different topics/concepts.`;
  }

  if (questionType === 'Multiple Choice') {
    prompt += `\n\nFORMAT EXACTLY (create ALL ${numQuestions} questions):

Q1: [Question testing specific concept from the text - focus on WHAT was explained, not WHY author wrote it]
A) [Detailed option based on content]
B) [Alternative based on different aspect]
C) [Plausible but incorrect option]
D) [Another content-based option]
ANSWER: A

Q2: [Completely different topic/concept question with varied structure]
A) [Different style of option]
B) [Alternative approach]
C) [Different type of distractor]
D) [Varied content option]
ANSWER: C

[Continue for ALL ${numQuestions} questions with distinct topics and varied question styles]`;

  } else if (questionType === 'True/False') {
    prompt += `\n\nFORMAT EXACTLY (create ALL ${numQuestions} questions):

Q1: [Statement about specific content/concept from text]
ANSWER: True

Q2: [Different statement about unrelated concept]
ANSWER: False

[Continue for ALL ${numQuestions} questions on different topics]`;

  } else if (questionType === 'Short Answer') {
    prompt += `\n\nFORMAT EXACTLY (create ALL ${numQuestions} questions):

Q1: [Question requiring explanation of concept/process from text]

Q2: [Question about different topic requiring analysis]

[Continue for ALL ${numQuestions} questions on varied topics]`;

  } else if (questionType === 'Flashcards') {
    prompt += `\n\nFORMAT EXACTLY (create ALL ${numQuestions} flashcards):

Q1: [Concept/term from text]
ANSWER: [Comprehensive explanation based on content]

Q2: [Different concept/process]
ANSWER: [Detailed explanation]

[Continue for ALL ${numQuestions} flashcards on different concepts]`;
  }

  prompt += `\n\nREMEMBER: Generate EXACTLY ${numQuestions} unique questions testing content comprehension, not author analysis.`;
  
  return prompt;
}

// FILTER OUT DUPLICATE/SIMILAR QUESTIONS
function filterUniqueQuestions(newQuestions, existingQuestions) {
  const unique = [];
  
  for (const newQ of newQuestions) {
    let isDuplicate = false;
    
    for (const existingQ of existingQuestions) {
      // Check for similar questions using keyword overlap
      const newWords = newQ.question.toLowerCase().split(/\s+/);
      const existingWords = existingQ.question.toLowerCase().split(/\s+/);
      
      const overlap = newWords.filter(word => existingWords.includes(word) && word.length > 3);
      const similarityRatio = overlap.length / Math.min(newWords.length, existingWords.length);
      
      if (similarityRatio > 0.4) { // If more than 40% similarity
        isDuplicate = true;
        console.log(`Skipping similar question: ${newQ.question.substring(0, 60)}...`);
        break;
      }
    }
    
    if (!isDuplicate) {
      unique.push(newQ);
    }
  }
  
  return unique;
}

// CREATE QUESTION GENERATION PROMPT
function createQuestionGenerationPrompt(text, questionType, numQuestions, difficulty) {
  // This function is now replaced by createAdvancedQuestionPrompt
  // Keep for backward compatibility
  return createAdvancedQuestionPrompt(text, questionType, numQuestions, difficulty, []);
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
