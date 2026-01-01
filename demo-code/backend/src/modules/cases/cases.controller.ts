import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { DocumentCategory } from '@prisma/client';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  create(@Body() createCaseDto: CreateCaseDto) {
    return this.casesService.create(createCaseDto);
  }

  @Get()
  findAll() {
    return this.casesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCaseDto: UpdateCaseDto) {
    return this.casesService.update(id, updateCaseDto);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async addDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    
    // Fix filename encoding (Multer/Busboy issue with UTF-8)
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    // Validate category
    if (!Object.values(DocumentCategory).includes(category as DocumentCategory)) {
        throw new BadRequestException(`Invalid category. Must be one of: ${Object.values(DocumentCategory).join(', ')}`);
    }

    return this.casesService.addDocument(id, file, category as DocumentCategory);
  }

  @Post(':id/report')
  async generateReport(@Param('id') id: string) {
    return this.casesService.generateReport(id);
  }
}
