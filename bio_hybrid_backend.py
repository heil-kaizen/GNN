import numpy as np
from scipy.stats import entropy
from google import genai
from google.genai import types
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Bio-Hybrid Language Interface API")

# Enable CORS so the React frontend can communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the expected request payload
class GenerationRequest(BaseModel):
    prompt: str
    # We can accept pre-calculated metrics from the frontend, 
    # or raw signals. Here we accept the metrics for simplicity.
    rms: float
    variance: float
    entropy: float
    correlation: float

# ---------------------------------------------------------
# 1. Bio-Modulated LLM Generation
# ---------------------------------------------------------
def generate_bio_modulated_text(prompt: str, bio_features: dict):
    """
    Uses the extracted plant features to modulate the Gemini model's generation.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
        
    client = genai.Client(api_key=api_key)
    
    system_instruction = f"""
    You are the Bio-Hybrid Language Interface (BHLI). 
    Your responses are modulated by the current electrophysiological state of a plant network.
    
    Current Biological Entropy Parameters:
    - RMS Amplitude: {bio_features['rms']:.2f}
    - Temporal Variance: {bio_features['variance']:.2f}
    - Spectral Entropy: {bio_features['entropy'] * 100:.1f}%
    - Network Correlation: {bio_features['correlation'] * 100:.1f}%

    If entropy is high, make your response more creative, chaotic, or organic.
    If correlation is high, make your response highly structured and logical.
    If RMS is high, convey a sense of high energy or urgency.
    Reflect these biological states subtly in your tone and content.
    """
    
    # Modulate model temperature based on plant entropy (0.0 to 2.0 scale)
    dynamic_temperature = min(2.0, 0.7 + (bio_features['entropy'] * 0.8))
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=dynamic_temperature,
        )
    )
    
    return response.text, dynamic_temperature

# ---------------------------------------------------------
# 2. API Endpoints
# ---------------------------------------------------------
@app.post("/generate")
async def generate_endpoint(request: GenerationRequest):
    try:
        bio_features = {
            "rms": request.rms,
            "variance": request.variance,
            "entropy": request.entropy,
            "correlation": request.correlation
        }
        
        output_text, temp_used = generate_bio_modulated_text(request.prompt, bio_features)
        
        return {
            "status": "success",
            "output": output_text,
            "temperature_used": temp_used,
            "features_received": bio_features
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "online", "message": "Bio-Hybrid Backend is running."}

if __name__ == "__main__":
    print("Starting Bio-Hybrid Backend on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
