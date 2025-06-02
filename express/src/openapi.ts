import { z } from "zod";
import {
    extendZodWithOpenApi,
    OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const registery = new OpenAPIRegistry();

export { z, registery };
