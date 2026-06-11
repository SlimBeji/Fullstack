import { Component, computed, inject, signal } from '@angular/core';
import {
    form,
    FormField,
    FormRoot,
    minLength,
    pattern,
    required,
    validate,
} from '@angular/forms/signals';

import { Button, ImageUpload, Input } from '@/components/form';
import { AuthStore } from '@/store';
import type { SigninResponse } from '@/types';
import { EMAIL_RE } from '@/utils';

interface AuthFormModel {
    username: string;
    email: string;
    password: string;
    image: { file: File | null; url: string };
}

@Component({
    selector: 'app-auth-form',
    templateUrl: './auth-form.html',
    styleUrl: './auth-form.css',
    imports: [Button, Input, ImageUpload, FormField, FormRoot],
})
export class AuthForm {
    // Init
    store = inject(AuthStore);
    // const { httpData, sendRequest, clear } = useBackend();

    // State
    isLoginMode = signal<boolean>(true);
    model = signal<AuthFormModel>({
        username: '',
        email: '',
        password: '',
        image: { file: null, url: '' },
    });

    // Form
    authForm = form(this.model, (path) => {
        // Email validation
        required(path.email, { message: 'Please enter a valid email' });
        pattern(path.email, EMAIL_RE, {
            message: 'Please enter a valid email',
        });

        // Password validtion
        required(path.password, { message: 'Please enter a password' });
        minLength(path.password, 10, {
            message: 'Please enter a password with at least 10 characters',
        });

        // Username only validated in signup mode
        validate(path.username, (ctx) => {
            if (!this.isLoginMode() && ctx.value().trim().length < 8) {
                return {
                    kind: 'minLength',
                    message: 'Please enter a valid username of at least 8 characters',
                };
            }
            return null;
        });
    });

    // Computed
    text = computed(() => {
        if (this.isLoginMode()) {
            return {
                verb: 'Authenticate',
                requiredText: 'Login Required',
                switchText: 'Switch to signup',
            };
        } else {
            return {
                verb: 'Register',
                requiredText: 'Registration Required',
                switchText: 'Swith to login',
            };
        }
    });

    // Handlers
    async onSignin() {
        // use URLSearchParams for application/x-www-form-urlencoded
        const body = new URLSearchParams();
        body.append('username', this.model().email);
        body.append('password', this.model().password);
        console.log('request sent to the server');
        console.log(this.model());
        //const resp = await sendRequest('/auth/signin', 'post', body, false);
        const data: SigninResponse = {
            access_token: 'fake-token',
            token_type: 'bearer',
            user_id: 1,
            email: 'test@test.com',
            expires_in: 3600,
        };
        //this.store.login(data);
    }

    async onSignup() {
        // use FormData for multipart/form-data
        const formData = new FormData();
        formData.append('name', this.model().username);
        formData.append('email', this.model().email);
        formData.append('password', this.model().password);

        const image = this.model().image;
        if (image.file) {
            formData.append('image', image.file);
        }
        console.log('request sent to the server');
        console.log(this.model());
        //const resp = await sendRequest('/auth/signup', 'post', formData, false);
        const data: SigninResponse = {
            access_token: 'fake-token',
            token_type: 'bearer',
            user_id: 1,
            email: 'test@test.com',
            expires_in: 3600,
        };
        //this.store.login(data);
    }

    onSubmit(e: Event) {
        e.preventDefault();
        if (this.isLoginMode()) {
            this.onSignin();
        } else {
            this.onSignup();
        }
    }

    onSwitchModeHandler() {
        this.isLoginMode.update((prev) => !prev);
    }
}
