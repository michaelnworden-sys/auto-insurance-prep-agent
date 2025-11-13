// services/ttsService.ts

// This is the API key for the Text-to-Speech service.
// It's very important that the name starts with "REACT_APP_".
const TTS_API_KEY = "AIzaSyAPKtQVNSm6zJAPCe62L-dtRImvbbEA_3c";

// This is the function that App.tsx will call.
// It takes a string of text and returns a playable audio object.
export async function convertTextToSpeech(text: string): Promise<HTMLAudioElement | null> {
  // Don't do anything if the text is empty.
  if (!text.trim()) {
    return null;
  }

  // If the API key is missing, log an error and stop.
  if (!TTS_API_KEY) {
    console.error("ERROR: REACT_APP_TTS_API_KEY is not set in your environment variables.");
    return null;
  }

  // This is the web address for Google's Text-to-Speech API.
  const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${TTS_API_KEY}`;

  // We prepare the request, telling Google what text to use and what voice we want.
  const requestBody = {
    input: {
      text: text,
    },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Chirp3-HD-Charon', // This is a great, high-quality modern voice.
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