import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { FilesService } from '../files/files.service';
import { AiService } from '../ai/ai.service';
import { DocumentCategory, DocumentType } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private aiService: AiService,
  ) {}

  async create(data: CreateCaseDto) {
    return this.prisma.case.create({
      data: {
        ...data,
        court: data.court || 'TBD',
        plaintiff: data.plaintiff || 'TBD',
        defendant: data.defendant || 'TBD',
        status: 'in_progress',
      },
    });
  }

  async findAll() {
    return this.prisma.case.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    });
  }

  async findOne(id: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });
    if (!caseData) throw new NotFoundException(`Case with ID ${id} not found`);
    return caseData;
  }

  async update(id: string, data: UpdateCaseDto) {
    await this.findOne(id); // Check existence
    return this.prisma.case.update({
      where: { id },
      data,
    });
  }

  async addDocument(
    caseId: string,
    file: Express.Multer.File,
    category: DocumentCategory,
  ) {
    const kase = await this.findOne(caseId); // Ensure case exists

    // Treat video as audio for transcription purposes
    const isAudioOrVideo = file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/');

    const type = isAudioOrVideo
      ? DocumentType.AUDIO
      : DocumentType.FILE;

    // 1. Create Document immediately with PENDING/PROCESSING status
    const document = await this.prisma.document.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: 'uploads/' + file.originalname,
        category,
        type,
        extractedText: '', // Empty initially
        status: 'PROCESSING',
        case: { connect: { id: caseId } },
      },
    });

    // 2. Start processing in background (fire and forget)
    this.processDocumentBackground(document.id, file).catch((err) => {
      console.error(`Background processing failed for doc ${document.id}`, err);
    });

    return document;
  }

  private async processDocumentBackground(documentId: string, file: Express.Multer.File) {
    try {
      console.log(`Starting background processing for doc ${documentId}`);
      const extractedText = await this.filesService.extractText(file);
      
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          extractedText,
          status: 'COMPLETED',
        },
      });
      console.log(`Completed background processing for doc ${documentId}`);
    } catch (error) {
      console.error(`Failed processing doc ${documentId}`, error);
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
        },
      });
    }
  }

  async generateReport(caseId: string) {
    const kase = await this.findOne(caseId);
    const docs = kase.documents;

    // FORMING CONTEXT EXACTLY AS REQUESTED
    let context = `CASE: ${kase.caseNumber}\n\n`;

    // 1. Court Appointment
    context += `1. Court Appointment\n`;
    const courtDocs = docs.filter(d => d.category === 'COURT_APPOINTMENT');
    if (courtDocs.length > 0) {
        courtDocs.forEach(d => context += `[Document: ${d.name}]\n${d.extractedText}\n---\n`);
    } else {
        context += `(No documents provided)\n`;
    }
    context += `\n`;

    // 2. Plaintiff Documents
    context += `2. Plaintiff Documents\n`;
    const plaintiffDocs = docs.filter(d => d.category === 'PLAINTIFF');
    if (plaintiffDocs.length > 0) {
        plaintiffDocs.forEach(d => context += `[Document: ${d.name}]\n${d.extractedText}\n---\n`);
    } else {
        context += `(No documents provided)\n`;
    }
    context += `\n`;

    // 3. Defendant Documents
    context += `3. Defendant Documents\n`;
    const defendantDocs = docs.filter(d => d.category === 'DEFENDANT');
    if (defendantDocs.length > 0) {
        defendantDocs.forEach(d => context += `[Document: ${d.name}]\n${d.extractedText}\n---\n`);
    } else {
        context += `(No documents provided)\n`;
    }
    context += `\n`;

    // 4. Meeting Notes
    context += `4. Meeting Notes\n`;
    const notesDocs = docs.filter(d => d.category === 'MEETING_NOTES');
    let hasNotes = false;
    if (notesDocs.length > 0) {
        hasNotes = true;
        notesDocs.forEach(d => context += `[File: ${d.name}]\n${d.extractedText}\n---\n`);
    }
    if (kase.meetingNotes) {
         hasNotes = true;
         context += `[Manual Note]\n${kase.meetingNotes}\n`;
    }
    if (!hasNotes) {
        context += `(No notes provided)\n`;
    }
    context += `\n`;

    // LOGGING CONTEXT FOR DEBUGGING
    console.log('--- GENERATING AI REPORT ---');
    console.log(`Case ID: ${caseId}`);
    console.log('--- CONTEXT START ---');
    console.log(context.substring(0, 1000) + '...'); 
    console.log('--- CONTEXT END ---');

    // 2. Call AI
    const report = await this.aiService.generateCaseReport(context);

    // 3. Save Report AND Update Status
    return this.prisma.case.update({
      where: { id: caseId },
      data: { 
          aiReport: report,
          status: 'completed' 
      },
    });
  }
}
