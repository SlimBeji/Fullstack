export interface SigninResponse {
    access_token: string;
    token_type: "bearer";
    user_id: string;
    email: string;
    expires_in: number;
}

export interface EncodedUserToken {
    access_token: string;
    token_type: "bearer";
    user_id: string;
    email: string;
    expires_at: number;
}
