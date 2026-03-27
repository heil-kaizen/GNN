# Green Neural Network (GNN)

```
   ______ _   _ _   _ 
  / ____/| \ | | \ | |
 | |  _  |  \| |  \| |
 | |_| | | |\  | |\  |
  \____/ |_| \_|_| \_|
                       
  BIO-HYBRID LANGUAGE INTERFACE
```

## What it is

The Green Neural Network (GNN) is a Bio-Hybrid Language Interface (BHLI) designed to bridge the gap between plant electrophysiology and Large Language Models (LLMs). It treats living plants as biological compute nodes, capturing their internal micro-voltage fluctuations and using them as a source of high-entropy data to modulate artificial intelligence.

The system creates a closed-loop cybernetic circuit where biological signals influence digital thought, and digital outputs trigger physical environmental stimuli back to the biological source.

## What it can do

- Real-time Monitoring: Captures and visualizes electrophysiological signals from multiple plant nodes simultaneously.
- Bio-Entropy Analysis: Calculates complex metrics including RMS Amplitude, Temporal Variance, Spectral Entropy, and Network Correlation from live biological data.
- AI Modulation: Dynamically adjusts LLM parameters (Temperature, System Instructions) based on the plant network's current state. High plant entropy leads to more creative/chaotic AI outputs, while high correlation leads to more structured responses.
- Cybernetic Feedback: Automatically triggers physical hardware (Water pumps, Grow lights, Sound transducers) based on AI interactions and biological thresholds.
- Research Documentation: Provides a structured interface for logging synchronous electrical events across species boundaries.

## How to achieve the results

### 1. Hardware Requirements

- Arduino Uno or compatible microcontroller.
- Ag/AgCl surface electrodes (for non-invasive plant signal capture).
- Instrumentation Amplifier (e.g., ADS1115) to amplify micro-volt plant signals.
- Actuators: 5V Relay modules for water pumps/lights or a Piezo buzzer for sound.

### 2. Arduino Setup

1. Connect your plant electrodes to Analog pins A0 through A5.
2. Connect your actuators to Digital pins 8 (Water), 9 (Light), and 10 (Sound).
3. Upload the `bio_hybrid_arduino.ino` sketch to your Arduino.

### 3. Python Backend Setup

The backend requires Python 3.8+ and acts as the bridge between hardware and the web interface.

1. Install dependencies:
   ```bash
   pip install pyserial fastapi uvicorn pydantic numpy scipy google-genai
   ```
2. Set your Gemini API Key:
   ```bash
   export GEMINI_API_KEY="your_actual_api_key"
   ```
3. Set the correct Serial Port for your Arduino:
   ```bash
   export ARDUINO_PORT="COM3" # Windows
   # OR
   export ARDUINO_PORT="/dev/ttyACM0" # Linux/Mac
   ```
4. Run the backend:
   ```bash
   python bio_hybrid_backend.py
   ```

### 4. Frontend Setup

The frontend is a React application that provides the dashboard and BHLI terminal.

1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the application in your browser and navigate to the "Bio-Hybrid AI" tab.

### 5. Operation

Once all components are running, the "Bio-Entropy Source" panel will reflect the actual voltages from your plants. Entering a prompt in the BHLI Terminal will trigger a bio-modulated generation from the Gemini model, and the resulting interaction will physically trigger the connected Arduino actuators.
