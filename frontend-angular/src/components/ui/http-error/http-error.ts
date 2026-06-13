import { Component, computed, inject, input, output } from '@angular/core';
import type { AxiosResponse } from 'axios';

import { Button } from '@/components/form';
import { AuthStore } from '@/store';

import { ErrorModal } from '../error-modal/error-modal';
import { Modal } from '../modal/modal';

interface ErrorInput {
    tokenExpired?: boolean;
    message?: string;
    response?: AxiosResponse;
}

@Component({
    selector: 'app-http-error',
    templateUrl: './http-error.html',
    styleUrl: './http-error.css',
    imports: [Modal, ErrorModal, Button],
})
export class HttpError {
    // Init
    authStore = inject(AuthStore);

    // Inputs
    error = input<ErrorInput>();
    header = input<string>('');

    // Outputs
    closed = output<void>();

    // Computed
    isTokenExpired = computed(() => this.error()?.tokenExpired);

    // Handlers
    tokenExpiredCleaner() {
        this.closed.emit();
        this.authStore.logout();
    }
}
