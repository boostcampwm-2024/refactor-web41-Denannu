import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';

@Module({
  providers: [TagService, TagRepository],
  exports: [TagService],
})
export class TagModule {}
