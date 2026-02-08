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

    @Index()
    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column("varchar")
    password!: string;

    @Column({ type: "varchar", nullable: true })
    imageUrl?: string;

    @Column({ type: "bool", default: false })
    isAdmin!: boolean;

    // Timestamp

    @Index()
    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt!: Date;

    // Relationships

    @OneToMany(() => Place, (place) => place.creator)
    places!: Place[];
}
