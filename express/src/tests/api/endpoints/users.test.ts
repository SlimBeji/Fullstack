import supertest from "supertest";
import { memoryDb } from "../../memoryDb";
import app from "../../../api";
import { crudUser } from "../../../models/crud";
import { getImagePath } from "../../../lib/utils";
import { UserRead } from "../../../models/schemas";

let adminToken: string = "";
let token: string = "";
let example: UserRead;
const request = supertest(app);

beforeAll(async () => {
    await memoryDb.session();
    adminToken = await crudUser.getBearer("mslimbeji@gmail.com");
    token = await crudUser.getBearer("beji.slim@yahoo.fr");
    example = (await crudUser.getByEmail("beji.slim@yahoo.fr"))!;
});

afterAll(async () => {
    token = "";
    adminToken = "";
    await memoryDb.destroy();
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

describe("POST /api/users", () => {
    it("Create Users", async () => {
        const response = await request
            .post("/api/users")
            .field("name", "Test Van Test")
            .field("email", "test@test.com")
            .field("password", "very_secret")
            .field("isAdmin", true)
            .attach("image", getImagePath("avatar1.jpg"))
            .set("Authorization", adminToken)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "test@test.com");
        expect(response.body).toHaveProperty("name", "Test Van Test");
        expect(response.body).toHaveProperty("isAdmin", true);
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
});
