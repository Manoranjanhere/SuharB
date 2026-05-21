import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('likes')
@Unique(['fromUserId', 'toUserId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  fromUserId: string;

  @Index()
  @Column()
  toUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toUserId' })
  toUser: User;

  @Column({ default: false })
  isSuperLike: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complimentMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
