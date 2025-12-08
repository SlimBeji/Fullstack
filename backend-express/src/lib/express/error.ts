import { HttpStatus } from "./enums";

export class ApiError extends Error {
    constructor(
        public code: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        public message: string = "An unknown error occured",
        public details: object = {}
    ) {
        super(message);
    }
}
