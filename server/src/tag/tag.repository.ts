import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagRepository extends Repository<Tag> {
  constructor(private dataSource: DataSource) {
    super(Tag, dataSource.createEntityManager());
  }

  async findTags(tags: string[]) {
    return await this.find({
      where: tags.map((name) => ({ name })),
    });
  }

  async createTags(newTagNames: string[]) {
    const newTags = this.create(newTagNames.map((name) => ({ name })));
    return await this.save(newTags);
  }
}
