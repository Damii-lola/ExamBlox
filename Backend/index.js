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

    // Generate questions with enhanced prompting
    const response = await generateQuestionsWithGroq(cleanedText, questionType, numQuestions, difficulty);

    // Log generated questions for debugging
    console.log('=== GENERATED QUESTIONS ===');
    if (response.questions && response.questions.length > 0) {
      response.questions.forEach((q, index) => {
        console.log(`\n--- QUESTION ${index + 1} ---`);
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
      });
    }
    console.log('=== END OF QUESTIONS ===');

    res.json({
      success: true,
      message: response.message,
      data: response,
      metadata: {
        textLength: text.length,
        cleanedTextLength: cleanedText.length,
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

// PARALLEL BATCH QUESTION GENERATION - SENDS ALL REQUESTS SIMULTANEOUSLY
async function generateQuestionsWithGroq(text, questionType, numQuestions, difficulty) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    throw new Error('GROQ_API_KEY is not configured');
  }

  console.log('🚀 Starting PARALLEL BATCH question generation...');
  console.log('📊 Processing text length:', text.length, 'characters');
  console.log('🎯 TARGET QUESTIONS:', numQuestions);

  // Calculate batch configuration
  const batchSize = 10;
  const numberOfBatches = Math.ceil(numQuestions / batchSize);
  const batches = [];

  // Create batch configurations
  for (let i = 0; i < numberOfBatches; i++) {
    const startIndex = i * batchSize + 1;
    const endIndex = Math.min((i + 1) * batchSize, numQuestions);
    const questionsInThisBatch = endIndex - startIndex + 1;
    
    batches.push({
      batchId: i + 1,
      questionsNeeded: questionsInThisBatch,
      startIndex: startIndex,
      endIndex: endIndex
    });
  }

  console.log('📦 BATCH CONFIGURATION:');
  batches.forEach(batch => {
    console.log(`   Batch ${batch.batchId}: Questions ${batch.startIndex}-${batch.endIndex} (${batch.questionsNeeded} questions)`);
  });

  let attempt = 1;
  const maxAttempts = 10; // Reduced since we're doing parallel processing
  let allQuestions = [];

  while (allQuestions.length < numQuestions && attempt <= maxAttempts) {
    console.log(`\n🔄 === PARALLEL ATTEMPT ${attempt}/${maxAttempts} ===`);
    console.log(`📊 NEED: ${numQuestions - allQuestions.length} more questions | HAVE: ${allQuestions.length}/${numQuestions}`);

    try {
      // Create all batch promises simultaneously
      const batchPromises = batches.map(async (batch) => {
        const questionsToRequest = batch.questionsNeeded * 2; // Ask for 2x to account for filtering
        const batchDifficulty = getDynamicDifficulty(difficulty, batch.batchId);
        
        console.log(`🚀 Launching Batch ${batch.batchId}: Requesting ${questionsToRequest} ${batchDifficulty} questions`);
        
        return generateSingleBatch(text, questionType, questionsToRequest, batchDifficulty, batch.batchId, API_KEY);
      });

      // Execute all batches simultaneously
      console.log(`⚡ EXECUTING ${batches.length} PARALLEL API CALLS...`);
      const batchResults = await Promise.all(batchPromises);
      
      // Combine all batch results
      let rawQuestions = [];
      batchResults.forEach((questions, index) => {
        console.log(`📥 Batch ${index + 1} returned ${questions.length} raw questions`);
        rawQuestions = rawQuestions.concat(questions);
      });

      console.log(`📊 Total raw questions collected: ${rawQuestions.length}`);

      // Deduplicate and filter for exam-worthiness
      console.log('🔍 DEDUPLICATING AND FILTERING...');
      const uniqueQuestions = deduplicateQuestions(rawQuestions);
      console.log(`✅ After deduplication: ${uniqueQuestions.length} unique questions`);

      const examWorthyQuestions = filterExamWorthyQuestions(uniqueQuestions, []);
      console.log(`✅ After exam-worthy filter: ${examWorthyQuestions.length} quality questions`);

      // Add new questions to our collection
      const questionsBeforeAdd = allQuestions.length;
      allQuestions = deduplicateQuestions([...allQuestions, ...examWorthyQuestions]);
      const questionsAdded = allQuestions.length - questionsBeforeAdd;

      console.log(`📈 PARALLEL ATTEMPT ${attempt} RESULTS:`);
      console.log(`   - Raw questions generated: ${rawQuestions.length}`);
      console.log(`   - After deduplication: ${uniqueQuestions.length}`);
      console.log(`   - After quality filter: ${examWorthyQuestions.length}`);
      console.log(`   - New questions added: ${questionsAdded}`);
      console.log(`   - Total progress: ${allQuestions.length}/${numQuestions} (${((allQuestions.length/numQuestions)*100).toFixed(1)}%)`);

      if (allQuestions.length >= numQuestions) {
        console.log(`🎉 SUCCESS! Generated ${allQuestions.length}/${numQuestions} questions in ${attempt} parallel attempts!`);
        break;
      }

      // If we didn't get enough, adjust batches for remaining questions
      if (allQuestions.length < numQuestions) {
        const remaining = numQuestions - allQuestions.length;
        console.log(`🔄 Need ${remaining} more questions. Reconfiguring batches for next parallel attempt...`);
        
        // Reconfigure batches for remaining questions
        const newBatchCount = Math.min(Math.ceil(remaining / batchSize), 5); // Max 5 batches for remaining
        batches.length = 0; // Clear existing batches
        
        for (let i = 0; i < newBatchCount; i++) {
          const questionsInBatch = Math.ceil(remaining / newBatchCount);
          batches.push({
            batchId: i + 1,
            questionsNeeded: questionsInBatch,
            startIndex: i * questionsInBatch + 1,
            endIndex: Math.min((i + 1) * questionsInBatch, remaining)
          });
        }
      }

    } catch (error) {
      console.error(`❌ Parallel attempt ${attempt} failed:`, error.message);
    }

    attempt++;
    
    if (attempt <= maxAttempts && allQuestions.length < numQuestions) {
      console.log(`⏱️ Brief pause before next parallel attempt...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }

  // Final results and logging
  const finalQuestions = allQuestions.slice(0, numQuestions); // Limit to exact number requested

  if (finalQuestions.length < numQuestions) {
    console.log(`⚠️ WARNING: Generated ${finalQuestions.length}/${numQuestions} questions after ${attempt - 1} parallel attempts`);
  } else {
    console.log(`🏆 MISSION ACCOMPLISHED! Generated exactly ${numQuestions} questions using parallel processing!`);
  }

  // ALWAYS log ALL questions at the end
  console.log(`\n🔥 === FINAL QUESTION SET (${finalQuestions.length} questions) ===`);
  finalQuestions.forEach((q, index) => {
    console.log(`\n--- QUESTION ${index + 1}/${finalQuestions.length} ---`);
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
  });
  console.log(`\n🔥 === END OF FINAL QUESTION SET ===`);

  return {
    message: `Generated ${finalQuestions.length} questions using ${attempt - 1} parallel batch attempts`,
    questions: finalQuestions,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    textLength: text.length,
    parallelBatchesUsed: attempt - 1,
    successRate: `${finalQuestions.length}/${numQuestions} (${((finalQuestions.length/numQuestions)*100).toFixed(1)}%)`,
    requestParams: {
      questionType,
      numQuestions,
      difficulty
    }
  };
}

// GENERATE SINGLE BATCH FOR PARALLEL PROCESSING
async function generateSingleBatch(text, questionType, numQuestions, difficulty, batchId, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Use different sections of text for each batch to increase variety
  const maxTextLength = 12000;
  const sections = Math.floor(text.length / maxTextLength) || 1;
  const sectionIndex = (batchId - 1) % sections;
  const startPos = sectionIndex * maxTextLength;
  const textSection = text.length > maxTextLength 
    ? text.substring(startPos, startPos + maxTextLength)
    : text;
  
  const prompt = createExamFocusedPrompt(textSection, questionType, numQuestions, difficulty, []);
  
  console.log(`   🎲 Batch ${batchId}: Using text section ${sectionIndex + 1}/${sections} (${textSection.length} chars)`);
  
  try {
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
            content: `You are an expert exam question creator for Batch ${batchId}. Create unique, exam-worthy questions that test deep understanding. Each question should be different from typical questions and focus on important concepts.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7 + (batchId * 0.1), // Vary temperature slightly per batch for variety
        max_tokens: 2800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Batch ${batchId} API error:`, response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const groqGeneratedText = result.choices[0]?.message?.content || '';
    
    const parsedQuestions = parseGroqQuestionsResponse(groqGeneratedText, questionType, numQuestions);
    
    // Add batch identifier to questions
    parsedQuestions.forEach(q => {
      q.batchId = batchId;
      q.batchSource = `batch_${batchId}`;
    });
    
    console.log(`   ✅ Batch ${batchId}: Generated ${parsedQuestions.length} questions`);
    return parsedQuestions;

  } catch (error) {
    console.error(`❌ Batch ${batchId} failed:`, error.message);
    return []; // Return empty array on failure
  }
}

// ADVANCED DEDUPLICATION FUNCTION
function deduplicateQuestions(questions) {
  console.log(`🔍 Starting deduplication of ${questions.length} questions...`);
  
  const uniqueQuestions = [];
  const questionHashes = new Set();
  let duplicatesRemoved = 0;
  
  for (const question of questions) {
    // Create a normalized hash of the question for comparison
    const normalizedQuestion = question.question
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Create hash from first 10 significant words
    const significantWords = normalizedQuestion
      .split(' ')
      .filter(word => word.length > 3) // Only words longer than 3 characters
      .slice(0, 10); // First 10 significant words
    
    const questionHash = significantWords.join('_');
    
    if (questionHashes.has(questionHash)) {
      duplicatesRemoved++;
      console.log(`   ❌ Removed duplicate: ${question.question.substring(0, 60)}...`);
      continue;
    }
    
    // Check for semantic similarity with existing questions
    let isSimilar = false;
    for (const existingQ of uniqueQuestions) {
      const similarity = calculateAdvancedSimilarity(question.question, existingQ.question);
      if (similarity > 0.7) { // 70% similarity threshold
        isSimilar = true;
        duplicatesRemoved++;
        console.log(`   ❌ Removed similar (${(similarity * 100).toFixed(1)}%): ${question.question.substring(0, 60)}...`);
        break;
      }
    }
    
    if (!isSimilar) {
      questionHashes.add(questionHash);
      uniqueQuestions.push(question);
      console.log(`   ✅ Kept unique: ${question.question.substring(0, 60)}...`);
    }
  }
  
  console.log(`🔍 Deduplication complete: Removed ${duplicatesRemoved} duplicates/similar, kept ${uniqueQuestions.length} unique`);
  return uniqueQuestions;
}

// ADVANCED SIMILARITY CALCULATION
function calculateAdvancedSimilarity(question1, question2) {
  // Normalize both questions
  const normalize = (text) => text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  const words1 = normalize(question1);
  const words2 = normalize(question2);
  
  // Calculate Jaccard similarity (intersection over union)
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// GET DYNAMIC DIFFICULTY FOR VARIETY (SIMPLIFIED FOR PARALLEL PROCESSING)
function getDynamicDifficulty(baseDifficulty, batchId) {
  const difficulties = ['Easy', 'Medium', 'Hard', 'Exam Level'];
  const baseIndex = difficulties.findIndex(d => d.toLowerCase() === baseDifficulty.toLowerCase());
  
  // Simple variance pattern for batches
  const variance = [-1, 0, 1, 0, 1];
  const adjustedIndex = Math.max(0, Math.min(3, baseIndex + (variance[batchId % 5] || 0)));
  
  return difficulties[adjustedIndex];
}

// GENERATE SINGLE BATCH WITH EXAM-FOCUSED PROMPTING
async function generateQuestionBatch(text, questionType, numQuestions, difficulty, existingQuestions, API_KEY) {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Use different sections of text for variety
  const maxTextLength = 12000;
  const startPos = existingQuestions.length > 0 
    ? Math.floor(Math.random() * Math.max(0, text.length - maxTextLength))
    : 0;
  const textSection = text.length > maxTextLength 
    ? text.substring(startPos, startPos + maxTextLength)
    : text;
  
  const prompt = createExamFocusedPrompt(textSection, questionType, numQuestions, difficulty, existingQuestions);
  
  console.log(`Making API request for ${numQuestions} ${difficulty} questions...`);
  
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
          content: "You are an expert exam question creator. Your questions must be worthy of appearing on actual exams. Focus on testing understanding, application, and critical thinking rather than simple recall."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8, // Increased for more variety
      max_tokens: 2800 // Increased token limit
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const groqGeneratedText = result.choices[0]?.message?.content || '';
  
  console.log('Raw Groq response length:', groqGeneratedText.length, 'characters');
  
  const parsedQuestions = parseGroqQuestionsResponse(groqGeneratedText, questionType, numQuestions);
  console.log(`Parsed ${parsedQuestions.length} questions from this batch`);
  
  return parsedQuestions;
}

// CREATE EXAM-FOCUSED PROMPTS
function createExamFocusedPrompt(textSection, questionType, numQuestions, difficulty, existingQuestions) {
  const difficultyMap = {
    'easy': 'moderately challenging (like mid-term exam questions)',
    'medium': 'challenging (like final exam questions)', 
    'hard': 'very challenging (like advanced course exams)',
    'exam level': 'extremely challenging (like professional certification exams)'
  };
  
  const difficultyLevel = difficultyMap[difficulty.toLowerCase()] || 'challenging';

  let prompt = `You are creating ${questionType.toLowerCase()} questions for an actual exam. These questions MUST be exam-worthy and test real understanding.

EXAM STANDARDS:
- Questions should appear on a real exam about this material
- Test understanding, application, and analysis - NOT just memorization
- Make students think critically about the concepts
- Questions should have clear, defensible answers based on the text
- Avoid trivial details that don't matter for learning

TEXT TO ANALYZE:
"""
${textSection}
"""

Create exactly ${numQuestions} ${difficultyLevel} questions that would appear on an exam covering this material.`;

  if (existingQuestions.length > 0) {
    const recentTopics = existingQuestions.slice(-3).map(q => {
      const words = q.question.split(' ');
      return words.slice(0, 6).join(' '); // First 6 words
    }).join('; ');
    prompt += `\n\nAVOID these recent question topics: ${recentTopics}
Focus on completely different concepts from the text.`;
  }

  if (questionType === 'Multiple Choice') {
    prompt += `

FORMAT - Create exactly ${numQuestions} multiple choice questions:

Q1: [Exam-worthy question testing understanding/application]
A) [Detailed correct answer based on text]
B) [Plausible incorrect option] 
C) [Another plausible incorrect option]
D) [Fourth plausible incorrect option]
ANSWER: A
EXPLANATION: [Why this tests understanding and why the answer is correct based on specific text content]

Continue this exact format for all ${numQuestions} questions.

QUALITY REQUIREMENTS:
- Each question tests a different important concept
- Options should be similar length and plausibility
- Incorrect options should be believable but clearly wrong
- Explanations must reference specific content from the text`;

  } else if (questionType === 'True/False') {
    prompt += `

FORMAT - Create exactly ${numQuestions} true/false questions:

Q1: [Exam-worthy statement about concepts from text]
ANSWER: True
EXPLANATION: [Why this is true/false based on specific text content]

Continue for all ${numQuestions} questions.`;

  } else if (questionType === 'Short Answer') {
    prompt += `

FORMAT - Create exactly ${numQuestions} short answer questions:

Q1: [Question requiring explanation/analysis based on text]
EXPLANATION: [What a complete answer should include based on the text]

Continue for all ${numQuestions} questions.`;

  } else if (questionType === 'Flashcards') {
    prompt += `

FORMAT - Create exactly ${numQuestions} flashcards:

Q1: [Important term/concept from text]
ANSWER: [Complete definition/explanation from text]
EXPLANATION: [Why this concept is important for understanding the material]

Continue for all ${numQuestions} flashcards.`;
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
      if (similarity > 0.35) { // Reduced threshold for stricter filtering
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
    'what is the last word'
  ];
  
  for (const indicator of trivialIndicators) {
    if (questionText.includes(indicator)) {
      return false;
    }
  }
  
  // Require questions to test understanding/analysis
  const examWorthyIndicators = [
    'explain', 'analyze', 'compare', 'contrast', 'evaluate', 'discuss',
    'what does this suggest', 'why is', 'how does', 'what would happen',
    'what is the significance', 'what can be concluded', 'what is the relationship',
    'according to the text', 'based on the content', 'the author argues'
  ];
  
  const hasExamWorthy = examWorthyIndicators.some(indicator => 
    questionText.includes(indicator)
  );
  
  // Questions should be substantial (not too short or too long)
  const isGoodLength = question.question.length >= 15 && question.question.length <= 200;
  
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
    // Enhanced multiple choice parsing
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift(); // Remove empty first element
    
    console.log(`📊 Found ${questionBlocks.length} MC question blocks`);
    
    for (let i = 0; i < questionBlocks.length && questions.length < numQuestions; i++) {
      try {
        const block = questionBlocks[i].trim();
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 3) continue;
        
        const questionText = lines[0];
        if (!questionText || questionText.length < 15) continue;
        
        const options = [];
        let answerLine = '';
        let explanationLine = '';
        
        // Extract options, answer, and explanation
        for (let line of lines.slice(1)) {
          if (/^[A-D]\)/.test(line)) {
            options.push(line.substring(2).trim());
          } else if (line.toUpperCase().includes('ANSWER:')) {
            answerLine = line;
          } else if (line.toUpperCase().includes('EXPLANATION:')) {
            explanationLine = line.substring(line.toUpperCase().indexOf('EXPLANATION:') + 12).trim();
          }
        }
        
        // Validation and construction
        if (questionText && options.length >= 4 && answerLine) {
          const correctLetter = answerLine.toUpperCase().match(/[A-D]/)?.[0] || 'A';
          const correctIndex = correctLetter.charCodeAt(0) - 65;
          
          // Enhanced explanation that references the text
          const enhancedExplanation = explanationLine || 
            `This question tests understanding of key concepts from the source material. The correct answer is ${correctLetter} because it accurately reflects the information presented in the text.`;
          
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
          
          console.log(`✅ Parsed MC question ${questions.length}: ${questionText.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`❌ Error parsing MC question ${i + 1}:`, error.message);
      }
    }
    
  } else if (questionType === 'True/False') {
    // Enhanced T/F parsing
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
          const answer = answerLine.toUpperCase().includes('TRUE') ? 'True' : 'False';
          const explanation = explanationLine ? 
            explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() :
            `This statement is ${answer.toLowerCase()} based on the content analysis of the source material.`;
          
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
    // Enhanced Short Answer parsing
    const questionBlocks = groqResponse.split(/Q\d+:/);
    questionBlocks.shift();
    
    questionBlocks.forEach((block, index) => {
      if (questions.length >= numQuestions) return;
      
      try {
        const lines = block.trim().split('\n').filter(line => line.trim());
        const questionText = lines[0]?.trim();
        const explanationLine = lines.find(line => line.toUpperCase().includes('EXPLANATION:'));
        
        if (questionText && questionText.length > 15) {
          const explanation = explanationLine ? 
            explanationLine.substring(explanationLine.toUpperCase().indexOf('EXPLANATION:') + 12).trim() :
            `A comprehensive answer should demonstrate understanding of the key concepts and their relationships as presented in the source material.`;
          
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
    // Enhanced Flashcard parsing
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
            `This concept is essential for understanding the broader themes and principles discussed in the material.`;
          
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
  
  console.log(`📊 Final parsing result: ${questions.length} exam-worthy questions extracted`);
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
  console.log('🚀 ExamBlox Backend is ready with enhanced exam-focused question generation!');
});
