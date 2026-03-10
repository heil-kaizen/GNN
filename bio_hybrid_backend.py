import numpy as np
from scipy.stats import entropy
from google import genai
from google.genai import types
import os

# ---------------------------------------------------------
# 1. Signal Processing & Feature Extraction
# ---------------------------------------------------------
def extract_bio_features(raw_signals):
    """
    Simulates extracting features from raw plant electrophysiological data.
    raw_signals: A 2D numpy array where rows are different plants/nodes and columns are time samples.
    """
    # Calculate RMS Amplitude
    rms = np.sqrt(np.mean(raw_signals**2, axis=1))
    avg_rms = np.mean(rms)
    
    # Calculate Temporal Variance
    variance = np.var(raw_signals, axis=1)
    avg_variance = np.mean(variance)
    
    # Calculate Spectral Entropy (using a simple histogram approach for demonstration)
    # In a real scenario, you would use FFT to get the power spectral density
    hist, bin_edges = np.histogram(raw_signals.flatten(), bins=50, density=True)
    spectral_entropy = entropy(hist + 1e-9) # Add small epsilon to avoid log(0)
    # Normalize entropy to a 0.0 - 1.0 scale for easier modulation
    normalized_entropy = min(1.0, spectral_entropy / 5.0) 
    
    # Calculate Network Correlation (average of the correlation matrix off-diagonals)
    if raw_signals.shape[0] > 1:
        corr_matrix = np.corrcoef(raw_signals)
        # Extract upper triangle without the diagonal
        upper_tri = corr_matrix[np.triu_indices(corr_matrix.shape[0], k=1)]
        network_correlation = np.mean(upper_tri)
    else:
        network_correlation = 1.0

    return {
        "rms": avg_rms,
        "variance": avg_variance,
        "entropy": normalized_entropy,
        "correlation": network_correlation
    }

# ---------------------------------------------------------
# 2. Bio-Modulated LLM Generation
# ---------------------------------------------------------
def generate_bio_modulated_text(prompt, bio_features):
    """
    Uses the extracted plant features to modulate the Gemini model's generation.
    """
    # Initialize the Gemini client (assumes GEMINI_API_KEY is in your environment variables)
    client = genai.Client()
    
    # Construct the bio-modulated system instruction
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
    # Base temperature of 0.7, increased by high plant entropy
    dynamic_temperature = min(2.0, 0.7 + (bio_features['entropy'] * 0.8))

    print(f"--- Initiating Bio-Modulated Generation ---")
    print(f"Dynamic Temperature set to: {dynamic_temperature:.2f}")
    
    # Call the Gemini model
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=dynamic_temperature,
        )
    )
    
    return response.text

# ---------------------------------------------------------
# 3. Execution / Simulation
# ---------------------------------------------------------
if __name__ == "__main__":
    # Simulate reading 5 seconds of data from 4 plant nodes at 100Hz
    # (In reality, this would come from an ADC connected to Ag/AgCl electrodes)
    num_plants = 4
    samples = 500
    
    # Generate some synthetic noisy sine waves to represent plant electrical potentials
    time = np.linspace(0, 5, samples)
    simulated_signals = np.array([
        np.sin(2 * np.pi * (1.5 + np.random.rand()) * time) + np.random.normal(0, 0.5, samples)
        for _ in range(num_plants)
    ])
    
    # 1. Extract features
    features = extract_bio_features(simulated_signals)
    
    print("Extracted Bio-Features:")
    for k, v in features.items():
        print(f"  {k.capitalize()}: {v:.4f}")
    print("\n")
    
    # 2. Generate text (Requires GEMINI_API_KEY environment variable)
    if not os.environ.get("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY environment variable not set. Skipping API call.")
    else:
        user_prompt = "Explain the relationship between mycelial networks and forest ecosystems."
        output = generate_bio_modulated_text(user_prompt, features)
        
        print("\n--- BHLI Output ---")
        print(output)
