export interface SigninResponse {
    access_token: string;
    token_type: "bearer";
    userId: string;
    email: string;
    expires_in: number;
}

export interface EncodedUserToken {
    access_token: string;
    token_type: "bearer";
    userId: string;
    email: string;
    expiresAt: number;
}
