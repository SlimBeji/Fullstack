import { Component, inject } from '@angular/core';

import { AuthStore } from '@/store';

@Component({
    selector: 'app-auth-form',
    templateUrl: './auth-form.html',
    styleUrl: './auth-form.css',
})
export class AuthForm {
    store = inject(AuthStore);

    onLogin() {
        this.store.login({
            access_token: 'fake-token',
            token_type: 'bearer',
            user_id: 1,
            email: 'test@test.com',
            expires_in: 3600,
        });
    }

    onLogout() {
        this.store.logout();
    }
}
