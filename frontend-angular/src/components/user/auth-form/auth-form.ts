import { Component, computed, inject, signal } from '@angular/core';

import { Button, ImageUpload, Input } from '@/components/form';
import type { FieldConfig } from '@/services';
import { type FieldState, validatorPlaceholder } from '@/services';
import { AuthStore } from '@/store';
import type { SigninResponse } from '@/types';

// const AuthFormConfig: FormConfig = {
//     username: { active: false, validators: [validatorPlaceholder] },
//     image: { active: false, initial: { file: null, url: '' } },
//     email: { validators: [validatorPlaceholder] },
//     password: { validators: [validatorPlaceholder] },
// };

// type FieldsType = keyof typeof AuthFormConfig;

@Component({
    selector: 'app-auth-form',
    templateUrl: './auth-form.html',
    styleUrl: './auth-form.css',
    imports: [Button, Input, ImageUpload],
})
export class AuthForm {
    // Init
    store = inject(AuthStore);
    // const { httpData, sendRequest, clear } = useBackend();

    // Form
    fields = signal<Record<string, FieldState>>({
        username: {
            value: '',
            initial: '',
            active: true,
            valid: true,
            validators: [validatorPlaceholder],
        },
        image: {
            value: { file: null, url: '' },
            initial: { file: null, url: '' },
            active: true,
            valid: true,
            validators: [validatorPlaceholder],
        },
        email: {
            value: '',
            initial: '',
            active: true,
            valid: true,
            validators: [validatorPlaceholder],
        },
        password: {
            value: '',
            initial: '',
            active: true,
            valid: true,
            validators: [validatorPlaceholder],
        },
    });
    formValid = signal<boolean>(true);
    updateFieldConfig(update: Partial<Record<string, FieldConfig>>) {
        Object.keys(update).forEach((name) => {
            const field = this.fields()[name];
            const config = update[name]!;
            if (config.active !== undefined) field.active = config.active;
            if (config.validators !== undefined) field.validators = config.validators;
            if (config.initial !== undefined) field.initial = config.initial;
        });
    }

    // State
    isLoginMode = signal<boolean>(true);

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
        body.append('username', this.fields()['email'].value);
        body.append('password', this.fields()['password'].value);
        console.log('request sent to the server');
        //const resp = await sendRequest('/auth/signin', 'post', body, false);
        const data: SigninResponse = {
            access_token: 'fake-token',
            token_type: 'bearer',
            user_id: 1,
            email: 'test@test.com',
            expires_in: 3600,
        };
        this.store.login(data);
    }

    async onSignup() {
        // use FormData for multipart/form-data
        const formData = new FormData();
        formData.append('name', this.fields()['username'].value);
        formData.append('email', this.fields()['email'].value);
        formData.append('password', this.fields()['password'].value);
        if (this.fields()['image'].value.file) {
            formData.append('image', this.fields()['image'].value.file);
        }
        console.log('request sent to the server');
        //const resp = await sendRequest('/auth/signup', 'post', formData, false);
        const data: SigninResponse = {
            access_token: 'fake-token',
            token_type: 'bearer',
            user_id: 1,
            email: 'test@test.com',
            expires_in: 3600,
        };
        this.store.login(data);
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
        // if prev === true ==> We were in Login Mode
        // username and image were disabled (false)
        // Switching to Signup Mode, we want to
        // enable them so we send prev (true)
        // Same reasoning if we were in Signup Mode
        const prev = this.isLoginMode();
        this.updateFieldConfig({ username: { active: prev }, image: { active: prev } });
        this.isLoginMode.set(!prev);
    }
}
