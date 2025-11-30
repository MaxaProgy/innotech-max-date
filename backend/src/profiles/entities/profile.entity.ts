import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Photo } from './photo.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 100, nullable: true })
  middleName: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @ManyToOne(() => City, { eager: true })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column()
  cityId: number;

  @Column({ length: 100, nullable: true })
  vkLink: string;

  @Column({ length: 255, nullable: true })
  maxLink: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  // Privacy settings
  @Column({ default: false })
  hideEmail: boolean;

  @Column({ default: true })
  isVisible: boolean;

  // Filter preferences
  @Column({ type: 'enum', enum: Gender, nullable: true })
  preferredGender: Gender;

  @Column({ nullable: true })
  preferredAgeMin: number;

  @Column({ nullable: true })
  preferredAgeMax: number;

  @Column({ nullable: true })
  preferredCityId: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Photo, (photo) => photo.profile, { cascade: true, eager: true })
  photos: Photo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

