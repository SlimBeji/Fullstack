import { Component, computed, inject, signal } from '@angular/core';
import { form, FormRoot, minLength, pattern, required, validate } from '@angular/forms/signals';

import { Button, ImageUpload, Input } from '@/components/form';
import { HttpError, LoadingSpinner } from '@/components/ui';
import { BackendService } from '@/services';
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
    imports: [Button, Input, ImageUpload, LoadingSpinner, HttpError, FormRoot],
})
export class AuthForm {
    // Init
    store = inject(AuthStore);
    backend = inject(BackendService);

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
        const resp = await this.backend.sendRequest<SigninResponse>('/auth/signin', 'post', body, {
            tokenRequired: false,
        });
        this.store.login(resp.data);
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
        const resp = await this.backend.sendRequest<SigninResponse>(
            '/auth/signup',
            'post',
            formData,
            { tokenRequired: false }
        );
        this.store.login(resp.data);
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
