import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { AssemblyAI } from 'assemblyai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf = require('pdf-parse');

@Injectable()
export class FilesService {
  private client: AssemblyAI;

  constructor() {
    this.client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY || 'dummy_key',
    });
  }

  async extractText(file: Express.Multer.File): Promise<string> {
    const mimeType = file.mimetype;

    if (mimeType === 'application/pdf') {
      return this.extractFromPdf(file.buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.extractFromDocx(file.buffer);
    } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
      return this.transcribeAudio(file);
    } else if (mimeType.startsWith('text/')) {
      return file.buffer.toString('utf-8');
    }

    return ''; // Unsupported format
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (e: any) {
      console.error('PDF extraction failed', e);
      return '';
    }
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (e: any) {
      console.error('DOCX extraction failed', e);
      return '';
    }
  }

  private async transcribeAudio(file: Express.Multer.File): Promise<string> {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        console.warn('ASSEMBLYAI_API_KEY missing, skipping real transcription');
        return `[Audio Transcription Mock] (No API Key provided)\nSpeaker A: This is a placeholder.\nSpeaker B: Because the key is missing.`;
    }

    try {
      // 1. Upload file directly from buffer
      // AssemblyAI SDK supports buffer upload
      const uploadUrl = await this.client.files.upload(file.buffer);

      // 2. Start transcription with Diarization (Speaker Labels)
      const transcript = await this.client.transcripts.transcribe({
        audio: uploadUrl,
        speaker_labels: true,
        language_detection: true,
      });

      if (transcript.status === 'error') {
          throw new Error(transcript.error);
      }

      // 3. Format output "Speaker A: Text"
      if (transcript.utterances && transcript.utterances.length > 0) {
          return transcript.utterances
            .map(u => `Speaker ${u.speaker}: ${u.text}`)
            .join('\n');
      }

      // Fallback
      return transcript.text || '';

    } catch (e: any) {
      console.error('AssemblyAI Transcription failed', e);
      return `[Error during transcription: ${e.message}]`;
    }
  }
}
