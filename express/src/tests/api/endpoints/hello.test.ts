import supertest from "supertest";
import app from "../../../api";
import { crudUser } from "../../../models/crud";
import { connectDbs, closeDbs } from "../../../lib/clients";

const request = supertest(app);

beforeAll(async () => {
    await connectDbs();
});

afterAll(async () => {
    await closeDbs();
});

describe("GET /api/hello-world/", () => {
    it("responds with json", async () => {
        const response = await request
            .get("/api/hello-world/")
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({ message: "Hello World!" });
    });
});

describe("GET /api/hello-world/user", () => {
    it("responds with json", async () => {
        const token = await crudUser.getBearer("mslimbeji@gmail.com");
        const response = await request
            .get("/api/hello-world/user")
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({ message: "Hello Slim Beji!" });
    });
});

describe("GET /api/hello-world/admin", () => {
    it("responds with json", async () => {
        const token = await crudUser.getBearer("mslimbeji@gmail.com");
        const response = await request
            .get("/api/hello-world/admin")
            .set("Authorization", token)
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({ message: "Hello Admin Slim Beji!" });
    });
});
