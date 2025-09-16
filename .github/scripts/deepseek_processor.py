#!/usr/bin/env python3
"""
DeepSeek API Processor for ExamBlox
This script is called by GitHub Actions to generate questions using DeepSeek API
"""

import os
import requests
import json
import sys

def call_deepseek_api(prompt, api_key):
    """Call the DeepSeek API with the given prompt"""
    url = "https://api.deepseek.com/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    data = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system", 
                "content": "You are a helpful assistant that generates educational questions based on provided text. Always respond with valid JSON."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()  # Raise exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
        raise

def extract_json_from_text(text):
    """Extract JSON from text response, handling code blocks"""
    import re
    
    # Try to find JSON code blocks
    json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if json_match:
        return json_match.group(1).strip()
    
    # Try to find any code blocks
    code_match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
    if code_match:
        return code_match.group(1).strip()
    
    # If no code blocks, try to parse the whole text as JSON
    return text.strip()

def main():
    # Get API key from environment
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("❌ ERROR: DEEPSEEK_API_KEY environment variable is not set")
        sys.exit(1)
    
    print("✅ API key found in environment")
    
    # Sample data (in a real scenario, this would come from the workflow input)
    sample_text = """
    Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. 
    There are two types of photosynthetic processes: oxygenic photosynthesis and anoxygenic photosynthesis. 
    The general principles of anoxygenic and oxygenic photosynthesis are very similar, but oxygenic photosynthesis is the most common and is seen in plants, algae and cyanobacteria.
    During photosynthesis, plants convert carbon dioxide and water into glucose and oxygen using sunlight energy.
    """
    
    prompt = f"""
    Based on the following text, generate 3 multiple choice questions with 4 options each and indicate the correct answer.
    Make the questions educational and relevant to the text content.
    
    Text: {sample_text}
    
    Format your response as a valid JSON object with this structure:
    {{
      "questions": [
        {{
          "question": "question text here",
          "options": ["option 1", "option 2", "option 3", "option 4"],
          "correct_answer": "option 1",
          "explanation": "brief explanation of why this is correct"
        }}
      ],
      "summary": "brief summary of the generated questions"
    }}
    
    Return ONLY the JSON object, no additional text or explanation.
    """
    
    try:
        print("🔍 Sending request to DeepSeek API...")
        result = call_deepseek_api(prompt, api_key)
        
        # Extract the generated content
        generated_content = result["choices"][0]["message"]["content"]
        print("✅ Received response from DeepSeek API")
        
        # Try to extract and parse JSON
        try:
            json_content = extract_json_from_text(generated_content)
            questions_data = json.loads(json_content)
            print("✅ Successfully parsed JSON response")
        except json.JSONDecodeError as e:
            print("❌ Could not parse response as JSON, saving raw response")
            print(f"Raw response: {generated_content}")
            questions_data = {
                "raw_response": generated_content,
                "error": f"JSON parse error: {str(e)}"
            }
        
        # Save results to file
        with open("results.json", "w") as f:
            json.dump(questions_data, f, indent=2)
        
        print("✅ Results saved to results.json")
        print("🎉 Question generation completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during question generation: {str(e)}")
        # Save error information
        with open("results.json", "w") as f:
            json.dump({"error": str(e), "success": False}, f, indent=2)
        sys.exit(1)

if __name__ == "__main__":
    main()
