import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Feed } from '../feed/feed.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Feed, (feed) => feed.tags)
  feeds: Feed[];
}
