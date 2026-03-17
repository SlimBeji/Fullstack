import { Column, Entity, OneToMany } from "typeorm";

import { BaseEntity } from "@/lib/typeorm_";

import { Place } from "./place.entity";
import { Tables } from "./tables";

@Entity(Tables.users)
export class User extends BaseEntity {
    // Fields

    @Column("text")
    name!: string;

    @Column({ type: "text", unique: true })
    email!: string;

    @Column({ type: "text", select: false })
    password!: string;

    @Column({ name: "image_url", type: "text", default: "" })
    image_url!: string;

    @Column({ name: "is_admin", type: "bool", default: false })
    is_admin!: boolean;

    // Relationships

    @OneToMany(() => Place, (place) => place.creator)
    places!: Place[];
}
