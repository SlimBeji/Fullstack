import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";
import config from "../config";

const swaggerRegistery = new OpenAPIRegistry();

const registerSwaggger = (app: Application, path: string): void => {
    swaggerRegistery.registerComponent("securitySchemes", "BearerAuth", {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
            "Enter your JWT Bearer token in the format: **Bearer <token>**",
    });
    const generator = new OpenApiGeneratorV3(swaggerRegistery.definitions);
    const openApiDocument = generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "My Express Zod API",
            version: "1.0.0",
            description:
                "API documentation for my Express application using Zod and Swagger UI",
        },
        servers: [
            {
                url: config.API_URL,
                description: "Swagger documentation",
            },
        ],
        tags: [
            {
                name: "Auth",
                description: "Registration and Authentication endpoints",
            },
            {
                name: "Hello World",
                description: "Hello World endpoints",
            },
            {
                name: "User",
                description: "User crud endpoints",
            },
        ],
    });
    app.use(path, swaggerUi.serve, swaggerUi.setup(openApiDocument));
};

export { swaggerRegistery, registerSwaggger };
