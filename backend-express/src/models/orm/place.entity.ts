import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("places")
export class Place {
    // Fields

    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar")
    title!: string;

    @Column("text")
    description!: string;

    @Column("varchar")
    address!: string;

    @Column({ type: "varchar", nullable: true })
    imageUrl?: string;

    @Column("jsonb")
    location!: {
        lat: number;
        lng: number;
    };

    // PgVector

    @Column("vector", { nullable: true, length: 384 })
    embedding?: number[];

    // Timestamp

    @Index()
    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt!: Date;

    // Relationships

    @Index("idx_place_creator")
    @ManyToOne(() => User, (user) => user.places, { onDelete: "CASCADE" })
    @JoinColumn({ name: "creatorId" })
    creator!: User;
}
