import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Place } from "./place.entity";

@Entity("users")
export class User {
    // Fields

    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar")
    name!: string;

    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column({ type: "varchar", select: false })
    password!: string;

    @Column({ name: "image_url", type: "varchar", nullable: true })
    imageUrl?: string;

    @Column({ name: "is_admin", type: "bool", default: false })
    isAdmin!: boolean;

    // Timestamp

    @Index()
    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    // Relationships

    @OneToMany(() => Place, (place) => place.creator)
    places!: Place[];
}
