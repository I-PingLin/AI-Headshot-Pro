
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from './services/ai.service';

interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private aiService = inject(AiService);
  
  loading = this.aiService.loading;
  statusMessage = this.aiService.statusMessage;
  
  uploadedImage = signal<string | null>(null);
  generatedImage = signal<string | null>(null);
  selectedStyleId = signal<string>('corp-grey');
  editRequest = signal<string>('');

  styles: StylePreset[] = [
    {
      id: 'corp-grey',
      name: 'Corporate Classic',
      description: 'Neutral grey studio backdrop',
      prompt: 'Neutral professional grey studio backdrop, soft Rembrandt lighting, business attire.',
      icon: '🏢'
    },
    {
      id: 'modern-office',
      name: 'Modern Tech',
      description: 'Bright office with soft bokeh',
      prompt: 'Modern high-tech office background with depth of field blur, natural bright window lighting, smart casual professional attire.',
      icon: '💻'
    },
    {
      id: 'natural-outdoor',
      name: 'Natural Light',
      description: 'Outdoor park or urban setting',
      prompt: 'Warm natural outdoor lighting, blurred park and greenery background, friendly and approachable professional portrait.',
      icon: '🌿'
    },
    {
      id: 'luxury-loft',
      name: 'Luxury Executive',
      description: 'Elegant penthouse interior',
      prompt: 'Elegant high-end penthouse interior background, warm architectural lighting, luxury professional aesthetic.',
      icon: '💎'
    }
  ];

  selectedStyle = computed(() => this.styles.find(s => s.id === this.selectedStyleId())!);

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImage.set(e.target.result);
        this.generatedImage.set(null);
      };
      reader.readAsDataURL(file);
    }
  }

  async generate() {
    if (!this.uploadedImage()) return;
    try {
      const result = await this.aiService.generateHeadshot(
        this.uploadedImage()!, 
        this.selectedStyle().prompt
      );
      this.generatedImage.set(result);
    } catch (err) {
      alert('Failed to generate headshot. Please try again.');
    }
  }

  async applyEdit() {
    if (!this.generatedImage() || !this.editRequest()) return;
    const prompt = this.editRequest();
    this.editRequest.set('');
    try {
      const result = await this.aiService.editHeadshot(this.generatedImage()!, prompt);
      this.generatedImage.set(result);
    } catch (err) {
      alert('Failed to edit headshot. Please try again.');
    }
  }

  reset() {
    this.uploadedImage.set(null);
    this.generatedImage.set(null);
    this.editRequest.set('');
  }
}
