import numpy as np
from scipy.stats import entropy
from google import genai
from google.genai import types
import os
import asyncio
import json
import time
import threading
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Try to import serial for Arduino communication
try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

app = FastAPI(title="Bio-Hybrid Language Interface API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration for Arduino
SERIAL_PORT = os.environ.get("ARDUINO_PORT", "COM3") # Change to /dev/ttyACM0 on Linux/Mac
BAUD_RATE = 115200
num_plants = 20

# Global state to store the latest readings
latest_readings = [0.0] * num_plants
latest_frequencies = [0.0] * num_plants
arduino_serial = None

def serial_reader_thread():
    """Background thread to read from and write to Arduino Serial port."""
    global latest_readings, arduino_serial
    if not SERIAL_AVAILABLE:
        print("pyserial not installed. Serial reading disabled.")
        return

    print(f"Attempting to connect to Arduino on {SERIAL_PORT}...")
    try:
        arduino_serial = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)
        time.sleep(2) # Wait for Arduino reset
        print(f"Connected to Arduino on {SERIAL_PORT}")
        
        while True:
            if arduino_serial.in_waiting > 0:
                line = arduino_serial.readline().decode('utf-8', errors='ignore').strip()
                try:
                    # Expecting comma-separated values: "v1,v2,v3..."
                    values = [float(v) for v in line.split(',')]
                    # Update global state
                    for i in range(min(len(values), num_plants)):
                        latest_readings[i] = values[i]
                except ValueError:
                    pass 
            time.sleep(0.01)
    except Exception as e:
        print(f"Serial Error: {e}. Falling back to simulation mode.")
        arduino_serial = None

def send_to_arduino(command: str):
    """Helper to send a command string to the Arduino."""
    global arduino_serial
    if arduino_serial and arduino_serial.is_open:
        try:
            arduino_serial.write(f"{command}\n".encode('utf-8'))
            print(f"Sent to Arduino: {command}")
        except Exception as e:
            print(f"Error writing to serial: {e}")

# Start the serial reader in a separate thread
threading.Thread(target=serial_reader_thread, daemon=True).start()

class GenerationRequest(BaseModel):
    prompt: str
    rms: float
    variance: float
    entropy: float
    correlation: float

def generate_bio_modulated_text(prompt: str, bio_features: dict):
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

@app.websocket("/ws/plants")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to WebSocket stream.")
    
    t = 0.0
    try:
        while True:
            # 1. Listen for incoming messages from the frontend (stimuli)
            try:
                # Non-blocking check for messages
                raw_msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                msg = json.loads(raw_msg)
                if msg.get("action") == "stimulus":
                    stim_type = msg.get("type", "").upper()
                    send_to_arduino(f"STIM:{stim_type}")
            except asyncio.TimeoutError:
                pass # No message this tick
            
            # 2. Send data to frontend
            t += 0.1
            signals = []
            
            # Use real readings if available, otherwise simulate
            is_simulating = all(v == 0.0 for v in latest_readings)
            
            for i in range(num_plants):
                if is_simulating:
                    # Simulation mode
                    base_freq = 0.5 + (i % 3) * 0.2
                    amp = 50.0
                    noise = np.random.normal(0, 5.0)
                    voltage = np.sin(t * base_freq * 2 * np.pi) * amp + noise
                    signals.append(float(voltage))
                else:
                    # Real Arduino data
                    signals.append(latest_readings[i])
                
            payload = {
                "timestamp": time.time(),
                "signals": signals,
                "is_real_data": not is_simulating,
                "correlations": []
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(0.05)
            
    except WebSocketDisconnect:
        print("Frontend disconnected.")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
