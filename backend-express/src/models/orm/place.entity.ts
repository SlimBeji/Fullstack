import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntity } from "./entity";
import { Tables } from "./tables";
import { User } from "./user.entity";

@Entity(Tables.places)
export class Place extends BaseEntity {
    // Fields

    @Column("varchar")
    title!: string;

    @Column("text")
    description!: string;

    @Column("varchar")
    address!: string;

    @Column({ name: "image_url", type: "varchar", nullable: true })
    imageUrl?: string;

    @Column("jsonb")
    location!: {
        lat: number;
        lng: number;
    };

    // PgVector

    @Column("vector", { nullable: true, length: 384 })
    embedding?: number[];

    // Relationships

    @Index("idx_place_creator")
    @ManyToOne(() => User, (user) => user.places, { onDelete: "CASCADE" })
    @JoinColumn({ name: "creator_id" })
    creator!: User;

    @Column({ name: "creator_id", type: "int" })
    creatorId!: number;
}
