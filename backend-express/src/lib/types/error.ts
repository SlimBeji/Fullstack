import { HttpStatus } from "./enums";

export class ApiError extends Error {
    constructor(
        public code: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        public message: string = "An unknown error occured",
        public details: object = {}
    ) {
        super(message);
    }

    toJson(): Record<string, any> {
        const resp: Record<string, any> = {
            error: true,
            message: this.message,
        };
        if (this.details && Object.keys(this.details).length > 0) {
            resp["details"] = this.details;
        }
        return resp;
    }
}
