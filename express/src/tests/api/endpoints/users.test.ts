import supertest from "supertest";
import { memoryDb } from "../../memoryDb";
import app from "../../../api";
import { crudUser, CrudUser } from "../../../models/crud";

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
