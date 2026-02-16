import { Column, Entity, OneToMany } from "typeorm";

import { BaseEntity } from "@/lib/typeorm_";

import { Place } from "./place.entity";
import { Tables } from "./tables";

@Entity(Tables.users)
export class User extends BaseEntity {
    // Fields

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

    // Relationships

    @OneToMany(() => Place, (place) => place.creator)
    places!: Place[];
}
