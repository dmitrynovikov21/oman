import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { CasesModule } from './modules/cases/cases.module';
import { FilesModule } from './modules/files/files.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [CasesModule, FilesModule, AiModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
