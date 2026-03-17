import {
    CreateDateColumn,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    created_at!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updated_at!: Date;
}
