import { Injectable } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { Tag } from './tag.entity';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async getTags(AITags: string): Promise<Tag[]> {
    const tags = JSON.parse(AITags).tags;

    if (!tags || tags.length === 0) return [];

    const existingTags = await this.tagRepository.findTags(tags);

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTagNames = tags.filter(
      (name: string) => !existingTagNames.includes(name),
    );

    const newTags = await this.tagRepository.createTags(newTagNames);

    return [...existingTags, ...newTags];
  }
}
