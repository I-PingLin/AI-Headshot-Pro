
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
  
  loading = signal(false);
  statusMessage = signal('');

  async generateHeadshot(base64Image: string, stylePrompt: string): Promise<string> {
    this.loading.set(true);
    this.statusMessage.set('Analyzing your features...');
    
    try {
      // First, use Gemini to describe the person to ensure Imagen captures the likeness better via text context
      const analysisResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: "Describe this person's key facial features, hair style, and gender in 2 sentences for a high-fidelity image generation prompt. Focus only on physical characteristics." },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } }
            ]
          }
        ]
      });

      const description = analysisResponse.text;
      this.statusMessage.set('Rendering your professional look...');

      // Now generate the image using Imagen 4.0
      const finalPrompt = `A high-end professional corporate headshot of ${description}. ${stylePrompt}. Professional lighting, sharp focus, 8k resolution, cinematic composition.`;
      
      const imageResponse = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1'
        }
      });

      return `data:image/png;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
    } catch (error) {
      console.error('Error generating headshot:', error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async editHeadshot(currentImageUrl: string, editPrompt: string): Promise<string> {
    this.loading.set(true);
    this.statusMessage.set('Applying AI modifications...');
    
    try {
      // Use Gemini to understand the edit and create a refined prompt
      const analysisResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: `The user wants to edit this professional headshot. Request: "${editPrompt}". Describe how the final image should look now, maintaining the person's identity but applying the changes.` },
              { inlineData: { mimeType: 'image/png', data: currentImageUrl.split(',')[1] } }
            ]
          }
        ]
      });

      const refinedPrompt = analysisResponse.text;
      
      // Generate the edited version
      const imageResponse = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A professional headshot: ${refinedPrompt}. Maintain consistency with original person. High resolution.`,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1'
        }
      });

      return `data:image/png;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
    } catch (error) {
      console.error('Error editing headshot:', error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }
}
