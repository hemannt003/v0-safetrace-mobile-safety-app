import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiAudioResponse, GeminiRiskResponse, ThreatSignal } from '../../types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function analyzeAudioClip(audioBase64: string): Promise<GeminiAudioResponse | null> {
  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/webm',
          data: audioBase64,
        },
      },
      `Analyze this 2-second audio clip for signs of emergency or distress.
       Respond ONLY with valid JSON exactly matching this format:
       {
         "threat": boolean,
         "confidence": number (0.0-1.0),
         "indicators": ["scream", "distress_words", "struggle", "aggressive_voice", "crying"],
         "detected_words": ["any", "distress", "words", "heard"],
         "explanation": "one sentence"
       }
       Be conservative: only flag true threats, not loud music or arguments.`
    ]);

    const responseText = result.response.text();
    // Try to extract JSON if it's wrapped in markdown
    const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || responseText.match(/{[\s\S]*}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
    
    return JSON.parse(jsonString) as GeminiAudioResponse;
  } catch (error) {
    console.error('[Gemini AI] Error analyzing audio:', error);
    return null;
  }
}

export async function assessContextualRisk(
  signals: ThreatSignal[],
  location: string,
  timeOfDay: string,
  crimeScore: number
): Promise<GeminiRiskResponse | null> {
  try {
    const prompt = `
      You are a safety AI. A woman's safety app has detected these signals:
      Signals: ${JSON.stringify(signals)}
      Location crime score: ${crimeScore}/1.0
      Time: ${timeOfDay}
      Location: ${location}

      Based on these combined factors, assess the threat level.
      Respond ONLY with JSON matching this format:
      {
        "threatLevel": "safe"|"caution"|"warning"|"danger",
        "confidenceScore": number (0.0-1.0),
        "reasoning": "one sentence",
        "recommendSOS": boolean
      }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || responseText.match(/{[\s\S]*}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
    
    return JSON.parse(jsonString) as GeminiRiskResponse;
  } catch (error) {
    console.error('[Gemini AI] Error assessing risk:', error);
    return null;
  }
}
