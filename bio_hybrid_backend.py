import numpy as np
from scipy.stats import entropy
from google import genai
from google.genai import types
import os
import asyncio
import json
import time
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
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

# ---------------------------------------------------------
# 3. WebSocket Streaming (Hardware Integration Point)
# ---------------------------------------------------------
@app.websocket("/ws/plants")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to WebSocket stream.")
    
    # In a real scenario, this loop would read from a serial port (e.g., ESP32)
    # or an MQTT broker where the hardware sensors are publishing data.
    # For now, we generate the signal here on the backend so the frontend is "dumb".
    
    num_plants = 20
    t = 0.0
    
    try:
        while True:
            t += 0.1
            signals = []
            frequencies = []
            
            # Generate backend-simulated data (to be replaced by real hardware reads)
            for i in range(num_plants):
                base_freq = 0.5 + (i % 3) * 0.2
                amp = 50.0
                noise = np.random.normal(0, 5.0)
                
                # Simple sine wave + noise
                voltage = np.sin(t * base_freq * 2 * np.pi) * amp + noise
                
                signals.append(float(voltage))
                frequencies.append(float(base_freq))
                
            # Send the data payload to the React frontend
            payload = {
                "timestamp": time.time(),
                "signals": signals,
                "frequencies": frequencies,
                "correlations": [] # We can add backend correlation logic here later
            }
            
            await websocket.send_json(payload)
            
            # Stream at ~20Hz (50ms delay)
            await asyncio.sleep(0.05)
            
    except WebSocketDisconnect:
        print("Frontend disconnected from WebSocket stream.")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    print("Starting Bio-Hybrid Backend on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
