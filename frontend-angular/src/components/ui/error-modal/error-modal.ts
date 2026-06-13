import { Component, input, output } from '@angular/core';

import { Button } from '@/components/form';

import { Modal } from '../modal/modal';

@Component({
    selector: 'app-error-modal',
    templateUrl: './error-modal.html',
    styleUrl: './error-modal.css',
    imports: [Modal, Button],
})
export class ErrorModal {
    // Inputs
    error = input<string>();
    header = input<string>('An Error Occured!');

    // Outputs
    closed = output<void>();
}
