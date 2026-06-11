import type { ElementRef } from '@angular/core';
import { Component, computed, input, model, signal, viewChild } from '@angular/core';

import { fileToUrl } from '@/utils';

import { Button } from '../button/button';

@Component({
    selector: 'app-image-upload',
    templateUrl: './image-upload.html',
    styleUrl: './image-upload.css',
    imports: [Button],
})
export class ImageUpload {
    // Template refs
    filePicker = viewChild.required<ElementRef<HTMLInputElement>>('filePicker');

    // Form
    value = model<{ file: File | null; url: string }>();
    invalid = input<boolean>();
    touched = input<boolean>();
    disabled = input<boolean>(false);

    // Inputs
    id = input.required<string>();
    buttonText = input<string>('Pick an image');
    inverse = input<boolean>(false);
    color = input<'primary' | 'secondary' | 'success' | 'warning' | 'danger'>('primary');
    errorText = input<string>();

    // Signals
    uploadError = signal<string>('');
    uploadAttempt = signal<boolean>(false);

    // Computed
    inverseClass = computed(() => (this.inverse() && !this.disabled() ? 'inverse' : ''));

    colorClass = computed(() => (this.disabled() ? 'disabled' : this.color()));

    showError = computed(() => (this.invalid() || !!this.uploadError()) && this.uploadAttempt());

    // Hanlders
    async changeHandler(event: Event): Promise<void> {
        this.uploadAttempt.set(true);
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
            this.value.update((d) => ({ ...d, file: null, url: '' }));
            this.uploadError.set('Something went wrong! No file found!');
        } else if (files.length > 1) {
            this.value.update((d) => ({ ...d, file: null, url: '' }));
            this.uploadError.set('Please upload only one file at a time!');
        } else {
            try {
                const url = await fileToUrl(files[0]);
                this.value.update((d) => ({ ...d, file: files[0], url }));
                this.uploadError.set('');
            } catch {
                this.uploadError.set('Uploaded file corrupted');
            }
        }
    }

    clickHandler(): void {
        this.filePicker().nativeElement.click();
    }
}
