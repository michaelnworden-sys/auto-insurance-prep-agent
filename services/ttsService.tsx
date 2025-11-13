// services/ttsService.ts

// --- CONFIGURATION ---
// IMPORTANT: Replace with the Trigger URL of the Cloud Function you deployed.
const CLOUD_FUNCTION_URL = 'https://get-tts-api-key-561750363497.us-central1.run.app'; 
// ---------------------

// URL for the Google Cloud Text-to-Speech API.
const GOOGLE_TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// A simple in-memory cache to store the API key after fetching it once.
let cachedApiKey: string | null = null;

/**
 * Securely fetches the TTS API key from our Cloud Function proxy.
 * Caches the key in memory to avoid fetching it on every request.
 * @returns {Promise<string|null>} The API key, or null if it fails.
 */
const getTTSApiKey = async (): Promise<string | null> => {
  // If we already have the key, return it immediately without a network call.
  if (cachedApiKey) {
    return cachedApiKey;
  }
  
  // Check if the URL was configured correctly.
  if (!CLOUD_FUNCTION_URL) {
      console.error('Cloud Function URL is not configured in ttsService.ts');
      return null;
  }

  try {
    // Call the Cloud Function to get the key. This only happens ONCE.
    const response = await fetch(CLOUD_FUNCTION_URL);
    if (!response.ok) {
        console.error(`Failed to fetch API key from proxy: ${response.statusText}`);
        return null;
    }
    const data = await response.json();
    if (!data.apiKey) {
        console.error('API key was not found in the response from the proxy.');
        return null;
    }
    
    // Store the key in our cache and return it.
    cachedApiKey = data.apiKey;
    return cachedApiKey;

  } catch (error) {
    console.error('Failed to fetch API key:', error);
    return null;
  }
};


/**
 * This is the main function that App.tsx will call.
 * It takes a string of text and returns a playable audio object.
 * It now securely fetches the API key on the first run.
 */
export async function convertTextToSpeech(text: string): Promise<HTMLAudioElement | null> {
  // Don't do anything if the text is empty.
  if (!text.trim()) {
    return null;
  }

  // Get the API key securely.
  const apiKey = await getTTSApiKey();

  // If the API key is missing, log an error and stop.
  if (!apiKey) {
    console.error("ERROR: Could not retrieve the TTS API Key.");
    return null;
  }

  // Construct the API URL with the secure key.
  const apiUrl = `${GOOGLE_TTS_API_URL}?key=${apiKey}`;

  // We prepare the request, telling Google what text to use and what voice we want.
  // This preserves your custom, high-quality voice setting.
  const requestBody = {
    input: {
      text: text,
    },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Chirp3-HD-Charon', 
    },
    audioConfig: {
      audioEncoding: 'MP3',
    },
  };

  try {
    // We send the request to the Google API.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // If the request wasn't successful, stop here.
    if (!response.ok) {
      console.error("Text-to-Speech API request failed:", response.status, await response.text());
      return null;
    }

    // Get the response data, which contains the audio.
    const data = await response.json();
    const audioContent = data.audioContent; // This is the audio file encoded as a string.

    // If we got audio content back, create a playable audio file and return it.
    if (audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      return audio;
    }

    return null;

  } catch (error) {
    console.error("Error calling Text-to-Speech API:", error);
    return null;
  }
}