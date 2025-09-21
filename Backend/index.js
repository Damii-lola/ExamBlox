const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
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

// Test routes
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

app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({
    message: 'Test endpoint works!',
    timestamp: new Date().toISOString(),
    platform: 'railway',
    status: 'success'
  });
});

app.all('/simple', (req, res) => {
  console.log('Simple endpoint called with method:', req.method);
  res.json({
    message: 'Simple endpoint responding',
    method: req.method,
    working: true,
    timestamp: new Date().toISOString()
  });
});

// MAIN QUESTION GENERATION ENDPOINT
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { text, questionType, numQuestions, difficulty } = req.body;

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

    // Filter out "About the author" sections and other irrelevant content
    const cleanedText = filterRelevantContent(text);
    console.log('- Cleaned text length:', cleanedText.length, 'characters');

    // Generate questions with persistent retry until target is reached
    const response = await generateQuestionsWithPersistence(cleanedText, questionType, numQuestions, difficulty);

    // Log ALL generated questions for debugging
    console.log('\n' + '='.repeat(80));
    console.log('🎯 ALL GENERATED QUESTIONS - FINAL OUTPUT');
    console.log('='.repeat(80));
    if (response.questions && response.questions.length > 0) {
      response.questions.forEach((q, index) => {
        console.log(`\n--- QUESTION ${index + 1} OF ${response.questions.length} ---`);
        console.log(`Question: ${q.question}`);
        if (q.options) {
          q.options.forEach((option, i) => {
            console.log(`${String.fromCharCode(65 + i)}) ${option}`);
          });
          console.log(`Correct Answer: ${q.correctLetter}`);
        } else if (q.correctAnswer) {
          console.log(`Answer: ${q.correctAnswer}`);
        }
        if (q.explanation) {
          console.log(`Explanation: ${q.explanation}`);
        }
        console.log(`Difficulty Level: ${q.difficultyLevel || 'Not specified'}`);
      });
    }
    console.log('\n' + '='.repeat(80));
    console.log(`✅ SUCCESS: Generated ${response.questions.length}/${numQuestions} questions`);
    console.log('='.repeat(80));

    res.json({
      success: true,
      message: response.message,
      data: response,
      metadata: {
        textLength: text.length,
        cleanedTextLength: cleanedText.length,
        questionType,
        numQuestions,
        actualQuestions: response.questions.length,
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

// FILTER OUT IRRELEVANT CONTENT
function filterRelevantContent(text) {
  console.log('🧹 Filtering out irrelevant content...');
  
  let cleanedText = text;
  
  // Remove "About the author" sections
  cleanedText = cleanedText.replace(/about\s+the\s+author[^]*?(?=\n\n|\n[A-Z]|$)/gi, '');
  
  // Remove other common irrelevant sections
  const sectionsToRemove = [
    /acknowledgments?[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /bibliography[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /references[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /index[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /table\s+of\s+contents[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /copyright[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /published\s+by[^]*?(?=\n\n|\n[A-Z]|$)/gi,
    /isbn[^]*?(?=\n\n|\n[A-Z]|$)/gi
  ];
  
  sectionsToRemove.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  // Remove excessive whitespace
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  cleanedText = cleanedText.trim();
  
  console.log(`✅ Content filtering complete. Removed ${text.length - cleanedText.length} characters of irrelevant content.`);
  
  return cleanedText;
}

// PERSISTENT QUESTION GENERATION - KEEPS TRYING UNTIL TARGET IS REACHED
async function generateQuestionsWithPersistence(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    throw new Error('GROQ_API_KEY is not configured');
  }

  console.log('\n🎯 STARTING PERSISTENT QUESTION GENERATION');
  console.log(`Target: ${numQuestions} questions`);
  console.log(`Difficulty: ${difficulty}`);
  console.log(`Text length: ${text.length} characters`);

  let allQuestions = [];
  let totalAttempts = 0;
  const maxTotalAttempts = 25; // Increased maximum attempts

  while (allQuestions.length < numQuestions && totalAttempts < maxTotalAttempts) {
    const remaining = numQuestions - allQuestions.length;
    totalAttempts++;
    
    console.log(`\n🔄 ATTEMPT ${totalAttempts}`);
    console.log(`Current: ${allQuestions.length}/${numQuestions} questions`);
    console.log(`Requesting: ${remaining} more questions`);

    try {
      // Use escalated difficulty for this batch
      const batchDifficulty = getEscalatedDifficulty(difficulty, totalAttempts);
      console.log(`Batch difficulty: ${batchDifficulty}`);
      
      // Generate questions for this batch
      const batchQuestions = await generateQuestionBatch(text, questionType, remaining, batchDifficulty, allQuestions, API_KEY);
      
      // Add unique, exam-worthy questions only
      const examWorthyQuestions = filterExamWorthyQuestions(batchQuestions, allQuestions);
      allQuestions = allQuestions.concat(examWorthyQuestions);
      
      console.log(`✅ Batch ${totalAttempts}: Added ${examWorthyQuestions.length} questions`);
      console.log(`📊 Progress: ${allQuestions.length}/${numQuestions} (${Math.round((allQuestions.length/numQuestions)*100)}%)`);

      if (allQuestions.length >= numQuestions) {
        console.log(`\n🎉 TARGET REACHED! Generated ${allQuestions.length} questions in ${totalAttempts} attempts`);
        break;
      }

      // If we're getting close but not quite there, be more aggressive
      if (remaining <= 3 && totalAttempts > 10) {
        console.log('🚀 Final push mode: Requesting extra questions to ensure target');
      }

    } catch (error) {
      console.error(`❌ Batch ${totalAttempts} failed:`, error.message);
      
      // Add small delay before retry to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final check and trimming
  const finalQuestions = allQuestions.slice(0, numQuestions);
  
  console.log(`\n📈 GENERATION SUMMARY:`);
  console.log(`- Requested: ${numQuestions} questions`);
  console.log(`- Generated: ${finalQuestions.length} questions`);
  console.log(`- Success rate: ${Math.round((finalQuestions.length/numQuestions)*100)}%`);
  console.log(`- Total attempts: ${totalAttempts}`);

  return {
    message: `Generated ${finalQuestions.length}/${numQuestions} extremely challenging questions using ${totalAttempts} attempts`,
    questions: finalQuestions,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    textLength: text.length,
    attemptsUsed: totalAttempts,
    completionRate: Math.round((finalQuestions.length/numQuestions)*100),
    requestParams: {
      questionType,
      numQuestions,
      difficulty
    }
  };
}

// ESCALATED DIFFICULTY MAPPING
function getEscalatedDifficulty(userDifficulty, attemptNumber) {
  // Map user difficulty to much harder actual difficulty
  const difficultyMap = {
    'easy': 'Challenging', // Easy becomes Medium-Hard
    'medium': 'Extremely Difficult', // Medium becomes Hard
    'hard': 'Expert Level', // Hard becomes Exam Level  
    'exam level': 'Impossible' // Exam Level becomes Impossible
  };
  
  const baseDifficulty = difficultyMap[userDifficulty.toLowerCase()] || 'Extremely Difficult';
  
  // Escalate further based on attempt number for variety
  const escalationLevels = [
    'Challenging',
    'Very Challenging', 
    'Extremely Difficult',
    'Expert Level',
    'Impossible',
    'Beyond Expert Level'
  ];
  
  const baseIndex = escalationLevels.findIndex(d => d === baseDifficulty);
  const escalatedIndex = Math.min(escalationLevels.length - 1, baseIndex + Math.floor(attemptNumber / 3));
  
  return escalationLevels[escalatedIndex];
}

// GENERATE SINGLE BATCH WITH EXTREME DIFFICULTY FOCUS
async function generateQuestionBatch(text, questionType, numQuestions, difficulty, existingQuestions, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Use different sections of text for variety
  const maxTextLength = 10000;
  const startPos = existingQuestions.length > 0 
    ? Math.floor(Math.random() * Math.max(0, text.length - maxTextLength))
    : 0;
  const textSection = text.length > maxTextLength 
    ? text.substring(startPos, startPos + maxTextLength)
    : text;
  
  const prompt = createExtremelyChallengingPrompt(textSection, questionType, numQuestions, difficulty, existingQuestions);
  
  console.log(`🔥 Making API request for ${numQuestions} ${difficulty} questions...`);
  
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
          content: "You are an EXTREMELY demanding expert examiner creating the most challenging questions possible. Your questions must be worthy of the hardest professional certification exams. Make students work for every point. Test deep analytical thinking, complex synthesis, and expert-level understanding."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9, // High creativity for challenging questions
      max_tokens: 3000 // More tokens for complex questions
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const groqGeneratedText = result.choices[0]?.message?.content || '';
  
  console.log(`📝 Received response: ${groqGeneratedText.length} characters`);
  
  const parsedQuestions = parseGroqQuestionsResponse(groqGeneratedText, questionType, numQuestions);
  
  // Add difficulty level to each question
  parsedQuestions.forEach(q => {
    q.difficultyLevel = difficulty;
  });
  
  console.log(`✅ Parsed ${parsedQuestions.length} questions from this batch`);
  
  return parsedQuestions;
}

// CREATE EXTREMELY CHALLENGING PROMPTS
function createExtremelyChallengingPrompt(textSection, questionType, numQuestions, difficulty, existingQuestions) {
  
  let prompt = `You must GREATLY AND SERIOUSLY STUDY this text with extreme attention to detail. Create ${questionType.toLowerCase()} questions at ${difficulty} level that would challenge even experts in this field.

CRITICAL ANALYSIS REQUIREMENTS:
- STUDY EVERY SENTENCE with microscopic attention
- Identify subtle nuances, implications, and hidden meanings
- Test complex relationships between concepts
- Create questions that require DEEP synthesis and analysis
- Make questions that separate true experts from casual readers
- Focus on WHY things matter, not just WHAT they are
- Test ability to apply concepts in complex scenarios

TEXT FOR INTENSIVE STUDY:
"""
${textSection}
"""

DIFFICULTY LEVEL: ${difficulty}
- Questions must be mentally exhausting to answer
- Require multiple layers of thinking to solve
- Test connections between distant concepts
- Challenge assumptions and require justification
- Make students prove their mastery, not just recognition

Create exactly ${numQuestions} questions that would appear on the most challenging professional certification exams in this field.`;

  if (existingQuestions.length > 0) {
    const recentTopics = existingQuestions.slice(-3).map(q => {
      const words = q.question.split(' ');
      return words.slice(0, 8).join(' ');
    }).join('; ');
    prompt += `\n\nAVOID these recent question topics: ${recentTopics}
Find completely different angles and concepts to test.`;
  }

  if (questionType === 'Multiple Choice') {
    prompt += `

FORMAT - Create exactly ${numQuestions} multiple choice questions:

Q1: [Extremely challenging question requiring deep analysis and synthesis]
A) [Complex correct answer requiring expert understanding]
B) [Sophisticated incorrect option that would fool non-experts] 
C) [Another complex incorrect option requiring careful analysis to reject]
D) [Fourth sophisticated incorrect option]
ANSWER: A
EXPLANATION: [Detailed explanation of why this tests expert-level understanding and how the correct answer demonstrates mastery of complex concepts from the text]

QUALITY REQUIREMENTS for ${difficulty} level:
- Questions must require 2-3 minutes of deep thinking
- All options must be sophisticated and require expert knowledge to distinguish
- Test synthesis of multiple concepts, not isolated facts
- Require understanding of implications, consequences, and relationships
- Make students demonstrate mastery through complex reasoning`;

  } else if (questionType === 'True/False') {
    prompt += `

FORMAT - Create exactly ${numQuestions} true/false questions:

Q1: [Extremely subtle and complex statement requiring expert analysis]
ANSWER: True
EXPLANATION: [Detailed explanation requiring deep understanding of nuances and implications]

REQUIREMENTS for ${difficulty} level:
- Statements must be subtly complex, not obviously true/false
- Test understanding of nuances and edge cases
- Require deep analysis of implications and consequences`;

  } else if (questionType === 'Short Answer') {
    prompt += `

FORMAT - Create exactly ${numQuestions} short answer questions:

Q1: [Complex question requiring synthesis, analysis, and expert explanation]
EXPLANATION: [What a complete expert-level answer must include, showing deep understanding]

REQUIREMENTS for ${difficulty} level:
- Questions must require essay-length responses
- Test ability to synthesize multiple concepts
- Require justification and evidence-based reasoning`;

  } else if (questionType === 'Flashcards') {
    prompt += `

FORMAT - Create exactly ${numQuestions} flashcards:

Q1: [Complex concept or nuanced term requiring expert understanding]
ANSWER: [Comprehensive expert-level definition with implications and applications]
EXPLANATION: [Why mastering this concept is crucial for expert-level understanding]

REQUIREMENTS for ${difficulty} level:
- Terms must be complex and nuanced
- Definitions must require expert-level understanding
- Include implications and applications, not just basic definitions`;
  }

  return prompt;
}

// FILTER FOR EXAM-WORTHY QUESTIONS
function filterExamWorthyQuestions(newQuestions, existingQuestions) {
  const examWorthy = [];
  
  for (const newQ of newQuestions) {
    // Check if question is exam-worthy
    if (!isExamWorthy(newQ)) {
      console.log(`❌ Rejected non-exam-worthy: ${newQ.question.substring(0, 60)}...`);
      continue;
    }
    
    // Check for duplicates/similarity
    let isDuplicate = false;
    for (const existingQ of existingQuestions) {
      const similarity = calculateQuestionSimilarity(newQ.question, existingQ.question);
      if (similarity > 0.3) { // Reduced threshold for stricter filtering
        isDuplicate = true;
        console.log(`❌ Rejected similar question: ${newQ.question.substring(0, 60)}...`);
        break;
      }
    }
    
    if (!isDuplicate) {
      examWorthy.push(newQ);
      console.log(`✅ Accepted exam-worthy: ${newQ.question.substring(0, 60)}...`);
    }
  }
  
  return examWorthy;
}

// CHECK IF QUESTION IS EXAM-WORTHY
function isExamWorthy(question) {
  const questionText = question.question.toLowerCase();
  
  // Reject questions that are too basic or trivial
  const trivialIndicators = [
    'what is the title',
    'who is the author',
    'what page',
    'according to page',
    'in what year was this written',
    'how many pages',
    'what is the first word',
    'what is the last word',
    'true or false: the text mentions'
  ];
  
  for (const indicator of trivialIndicators) {
    if (questionText.includes(indicator)) {
      return false;
    }
  }
  
  // Require questions to test understanding/analysis
  const examWorthyIndicators = [
    'analyze', 'synthesize', 'evaluate', 'compare and contrast', 'justify',
    'what are the implications', 'how does this relate to', 'what would happen if',
    'what is the significance', 'what can be concluded', 'why is this important',
    'how does the author', 'what evidence supports', 'what assumptions',
    'critically assess', 'to what extent', 'how effectively'
  ];
  
  const hasExamWorthy = examWorthyIndicators.some(indicator => 
    questionText.includes(indicator)
  );
  
  // Questions should be substantial (not too short or too long)
  const isGoodLength = question.question.length >= 20 && question.question.length <= 300;
  
  return hasExamWorthy && isGoodLength;
}

// CALCULATE QUESTION SIMILARITY
function calculateQuestionSimilarity(q1, q2) {
  const words1 = q1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = q2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  const commonWords = words1.filter(w => words2.includes(w));
  const totalUniqueWords = new Set([...words1, ...words2]).size;
  
  return totalUniqueWords > 0 ? commonWords.length / totalUniqueWords : 0;
}

// ENHANCED QUESTION PARSING
function parseGroqQuestionsResponse(groqResponse, questionType, numQuestions) {
  console.log('🔄 Parsing Groq response with enhanced extraction...');
  
  const questions = [];
  
  if (questionType === 'Multiple Choice') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    console.log(`📊 Found ${questionBlocks.length} MC question blocks`);
    
    for (let i = 0; i < questionBlocks.length && questions.length < numQuestions; i++) {
      try {
        const block = questionBlocks[i].trim();
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 3) continue;
        
        const questionText = lines[0];
        if (!questionText || questionText.length < 20) continue;
        
        const options = [];
        let answerLine = '';
        let explanationLine = '';
        
        for (let line of lines.slice(1)) {
          if (/^[A-D]\)/.test(line)) {
            options.push(line.substring(2).trim());
          } else if (line.toUpperCase().includes('ANSWER:')) {
            answerLine = line;
          } else if (line.toUpperCase().includes('EXPLANATION:')) {
            explanationLine = line.substring(line.toUpperCase().indexOf('EXPLANATION:') + 12).trim();
          }
        }
        
        if (questionText && options.length >= 4 && answerLine) {
          const correctLetter = answerLine.toUpperCase().match(/[A-D]/)?.[0] || 'A';
          const correctIndex = correctLetter.charCodeAt(0) - 65;
          
          const enhancedExplanation = explanationLine || 
            `This extremely challenging question tests expert-level understanding of complex concepts and their intricate relationships as presented in the source material.`;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            options: options.slice(0, 4),
            correctAnswer: correctIndex,
            correctLetter: correctLetter,
            explanation: enhancedExplanation,
            source: 'groq_ai',
            examWorthy: true
          });
          
          console.log(`✅ Parsed challenging MC question ${questions.length}`);
        }
      } catch (error) {
        console.log(`❌ Error parsing MC question ${i + 1}:`, error.message);
      }
    }
    
  } else if (questionType === 'True/False') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const answerLine = lines.find(line => line.toUpperCase().includes('ANSWER:'));
        const explanationLine = lines.find(line => line.toUpperCase().includes('EXPLANATION:'));
        
        if (questionText && answerLine && questionText.length >= 20) {
          const answer = answerLine.toUpperCase().includes('TRUE') ? 'True' : 'False';
          const explanation = explanationLine ? 
            explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() :
            `This extremely challenging statement requires expert-level analysis of subtle nuances and complex implications from the source material.`;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            correctAnswer: answer,
            explanation: explanation,
            source: 'groq_ai',
            examWorthy: true
          });
        }
      } catch (error) {
        console.log(`❌ Error parsing T/F question ${index + 1}:`, error.message);
      }
    });
    
  } else if (questionType === 'Short Answer') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const explanationLine = lines.find(line => line.toUpperCase().includes('EXPLANATION:'));
        
        if (questionText && questionText.length > 20) {
          const explanation = explanationLine ? 
            explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() :
            `An expert-level answer must demonstrate sophisticated synthesis, critical analysis, and deep understanding of complex relationships and implications presented in the source material.`;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            explanation: explanation,
            source: 'groq_ai',
            examWorthy: true
          });
        }
      } catch (error) {
        console.log(`❌ Error parsing SA question ${index + 1}:`, error.message);
      }
    });
    
  } else if (questionType === 'Flashcards') {
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const answerLine = lines.find(line => line.toUpperCase().includes('ANSWER:'));
        const explanationLine = lines.find(line => line.toUpperCase().includes('EXPLANATION:'));
        
        if (questionText && answerLine) {
          const answer = answerLine.substring(answerLine.toUpperCase().indexOf('ANSWER:') + 7).trim();
          const explanation = explanationLine ? 
            explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() :
            `This complex concept requires expert-level mastery and understanding of sophisticated relationships within the broader theoretical framework presented in the material.`;
          
          questions.push({
            id: questions.length + 1,
            type: questionType,
            question: questionText,
            answer: answer,
            explanation: explanation,
            source: 'groq_ai',
            examWorthy: true
          });
        }
      } catch (error) {
        console.log(`❌ Error parsing Flashcard ${index + 1}:`, error.message);
      }
    });
  }
  
  console.log(`📊 Final parsing result: ${questions.length} extremely challenging questions extracted`);
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
  console.log('🚀 ExamBlox Backend ready with PERSISTENT GENERATION and EXTREME DIFFICULTY!');
});
