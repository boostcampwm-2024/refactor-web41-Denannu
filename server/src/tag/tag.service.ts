import { Injectable } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { Tag } from './tag.entity';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async getTags(AITags: string): Promise<Tag[]> {
    const jsonString = AITags.match(/\{"tags":\s*\[.*\]\}/);
    let tags = [];

    if (jsonString && jsonString[0]) {
      const parsedData = JSON.parse(jsonString[0]);
      tags = parsedData.tags ? parsedData.tags.slice(0, 3) : [];
    }

    const existingTags = await this.tagRepository.findTags(tags);

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTagNames = tags.filter(
      (name: string) => !existingTagNames.includes(name),
    );

    const newTags = await this.tagRepository.createTags(newTagNames);

    return [...existingTags, ...newTags];
  }
}
