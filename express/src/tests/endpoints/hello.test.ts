import request from "supertest";
import app from "../../app";

describe("GET /api/hello-world/", () => {
    it("responds with json", async () => {
        const response = await request(app)
            .get("/api/hello-world/")
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({ message: "Hello World!" });
    });
});
