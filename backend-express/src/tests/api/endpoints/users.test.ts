import supertest from "supertest";

import app from "../../../api";
import { createToken } from "../../../lib/encryption";
import { closeAll, startAll } from "../../../lib/sync";
import { readImage } from "../../../lib/utils";
import { crudUser } from "../../../models/crud";
import { UserRead } from "../../../models/schemas";
import { HttpStatus } from "../../../types";

let adminExample: UserRead;
let adminToken: string = "";
let example: UserRead;
let token: string = "";
const request = supertest(app);

beforeAll(async () => {
    await startAll();
    adminExample = (await crudUser.getByEmail("mslimbeji@gmail.com"))!;
    adminToken = `Bearer ${createToken(adminExample).access_token}`;
    example = (await crudUser.getByEmail("beji.slim@yahoo.fr"))!;
    token = `Bearer ${createToken(example).access_token}`;
});

afterAll(async () => {
    token = "";
    adminToken = "";
    await closeAll();
});

describe("GET /api/users", () => {
    it("Fetches Users", async () => {
        const response = await request
            .get("/api/users")
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("page", 1);
        expect(response.body).toHaveProperty("totalPages");
        expect(response.body).toHaveProperty("totalCount");
        expect(response.body).toHaveProperty("data");
    });
});

describe("POST /api/users/query", () => {
    it("Fetches users", async () => {
        const data = {
            email: ["regex:@gmail.com"],
            fields: ["email", "name"],
        };
        const response = await request
            .post("/api/users/query")
            .send(data)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("page", 1);
        expect(response.body).toHaveProperty("totalPages");
        expect(response.body).toHaveProperty("totalCount", 1);
        expect(response.body).toHaveProperty("data");

        const fetchedData = response.body["data"][0];
        expect(fetchedData).toEqual({
            name: "Slim Beji",
            email: "mslimbeji@gmail.com",
        });
    });
});

describe("POST /api/users", () => {
    it("Create Users", async () => {
        const response = await request
            .post("/api/users")
            .field("name", "Test Van Test")
            .field("email", "test@test.com")
            .field("password", "very_secret")
            .field("isAdmin", true)
            .attach("image", readImage("avatar1.jpg"))
            .set("Authorization", adminToken)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "test@test.com");
        expect(response.body).toHaveProperty("name", "Test Van Test");
        expect(response.body).toHaveProperty("isAdmin", true);
    });

    it("Non Admin users are denied", async () => {
        await request
            .post("/api/users")
            .field("name", "Test Van Test II")
            .field("email", "test_2@test.com")
            .field("password", "very_secret")
            .field("isAdmin", true)
            .attach("image", readImage("avatar1.jpg"))
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(HttpStatus.UNAUTHORIZED);
    });
});

describe("GET /api/users/id", () => {
    it("Fetches Users", async () => {
        const response = await request
            .get(`/api/users/${example.id}`)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "beji.slim@yahoo.fr");
        expect(response.body).toHaveProperty("name", "Mohamed Slim Beji");
    });
});

describe("PUT /api/users/id", () => {
    it("Update Users", async () => {
        const data = { name: "Slim El Beji" };
        const response = await request
            .put(`/api/users/${example.id}`)
            .send(data)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "beji.slim@yahoo.fr");
        expect(response.body).toHaveProperty("name", "Slim El Beji");
    });

    it("Users cannot update others profiles", async () => {
        const data = { name: "Slim El Beji" };
        await request
            .put(`/api/users/${adminExample.id}`)
            .send(data)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(HttpStatus.UNAUTHORIZED);
    });
});

describe("DELETE /api/users/id", () => {
    it("DELETE Users", async () => {
        const response = await request
            .delete(`/api/users/${example.id}`)
            .set("Authorization", adminToken)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty(
            "message",
            `Deleted user ${example.id}`
        );
    });

    it("Only admins can delete Users", async () => {
        await request
            .delete(`/api/users/${example.id}`)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(HttpStatus.UNAUTHORIZED);
    });
});
