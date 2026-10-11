import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';

import { StudyProgramController } from './study-program/study-program.controller';
import { StudyProgramService } from './study-program/study-program.service';

import { CourseController } from './course/course.controller';
import { CourseService } from './course/course.service';

import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';

import { ProductFileController } from './product-file/product-file.controller';
import { ProductFileService } from './product-file/product-file.service';

import { CustomerController } from './customer/customer.controller';
import { CustomerService } from './customer/customer.service';

import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';

import { UploadController } from './upload/upload.controller';

@Module({
  imports: [StorageModule],

  controllers: [
    StudyProgramController,
    CourseController,
    ProductController,
    ProductFileController,
    CustomerController,
    OrderController,
    UploadController,
  ],

  providers: [
    StudyProgramService,
    CourseService,
    ProductService,
    ProductFileService,
    CustomerService,
    OrderService,
  ],
})
export class AdminModule {}
