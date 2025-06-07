import supertest from "supertest";
import { memoryDb } from "../../memoryDb";
import app from "../../../api";
import { crudUser } from "../../../models/crud";

let token: string = "";
const request = supertest(app);

beforeAll(async () => {
    await memoryDb.session();
    token = await crudUser.getBearer("mslimbeji@gmail.com");
});

afterAll(async () => {
    token = "";
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

describe("GET /api/users/id", () => {
    it("Fetches Users", async () => {
        const user = (await crudUser.getByEmail("mslimbeji@gmail.com"))!;
        const response = await request
            .get(`/api/users/${user.id}`)
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(response.body).toHaveProperty("email", "mslimbeji@gmail.com");
        expect(response.body).toHaveProperty("name", "Slim Beji");
    });
});
