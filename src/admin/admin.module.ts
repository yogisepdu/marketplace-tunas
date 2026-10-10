import { Module } from '@nestjs/common';

import { StudyProgramController } from './study-program/study-program.controller';
import { StudyProgramService } from './study-program/study-program.service';

import { CourseController } from './course/course.controller';
import { CourseService } from './course/course.service';

import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';

import { ProductFileController } from './product-file/product-file.controller';
import { ProductFileService } from './product-file/product-file.service';

@Module({
  controllers: [
    StudyProgramController,
    CourseController,
    ProductController,
    ProductFileController,
  ],
  providers: [
    StudyProgramService,
    CourseService,
    ProductService,
    ProductFileService,
  ],
})
export class AdminModule {}
