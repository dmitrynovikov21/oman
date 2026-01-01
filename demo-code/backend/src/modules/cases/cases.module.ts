import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { PrismaService } from '../../prisma.service';
import { FilesModule } from '../files/files.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [FilesModule, AiModule],
  controllers: [CasesController],
  providers: [CasesService, PrismaService],
})
export class CasesModule {}



