import os
import requests
import json
import sys

def call_deepseek_api(prompt):
    """Call the DeepSeek API with the given prompt"""
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY not found in environment variables")
    
    url = "https://api.deepseek.com/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that generates educational questions based on provided text."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code != 200:
        raise Exception(f"API request failed with status {response.status_code}: {response.text}")
    
    return response.json()

def main():
    # In a real implementation, you would get this data from the workflow trigger
    # For demonstration, we'll use a sample prompt
    sample_text = """
    Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. 
    There are two types of photosynthetic processes: oxygenic photosynthesis and anoxygenic photosynthesis. 
    The general principles of anoxygenic and oxygenic photosynthesis are very similar, but oxygenic photosynthesis is the most common and is seen in plants, algae and cyanobacteria.
    """
    
    prompt = f"""
    Based on the following text, generate 5 multiple choice questions with 4 options each and indicate the correct answer.
    
    Text: {sample_text}
    
    Format the response as JSON with the following structure:
    {{
      "questions": [
        {{
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correct_answer": "option1",
          "explanation": "brief explanation of why this is correct"
        }}
      ]
    }}
    """
    
    try:
        print("Calling DeepSeek API...")
        result = call_deepseek_api(prompt)
        
        # Extract the generated content
        generated_content = result["choices"][0]["message"]["content"]
        
        # Try to parse the JSON response
        try:
            # Extract JSON from the response (the API might return text with JSON in it)
            if "```json" in generated_content:
                # Extract JSON from code block
                json_start = generated_content.find("```json") + 7
                json_end = generated_content.find("```", json_start)
                json_str = generated_content[json_start:json_end].strip()
                questions_data = json.loads(json_str)
            else:
                # Try to parse the entire response as JSON
                questions_data = json.loads(generated_content)
        except json.JSONDecodeError:
            # If it's not valid JSON, just save the raw text
            questions_data = {"raw_response": generated_content}
        
        # Save results
        with open("results.json", "w") as f:
            json.dump(questions_data, f, indent=2)
            
        print("Successfully generated questions!")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        # Save error information
        with open("results.json", "w") as f:
            json.dump({"error": str(e)}, f, indent=2)

if __name__ == "__main__":
    main()
