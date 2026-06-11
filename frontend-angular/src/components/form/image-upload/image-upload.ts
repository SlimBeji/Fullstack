import type { ElementRef } from '@angular/core';
import { Component, computed, input, signal, viewChild } from '@angular/core';
import type { Field } from '@angular/forms/signals';

import type { ColorType } from '@/types';
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
    field = input.required<Field<{ file: File | null; url: string }>>();

    // Inputs
    id = input.required<string>();
    buttonText = input<string>('Pick an image');
    inverse = input<boolean>(false);
    color = input<ColorType>('primary');
    errorText = input<string>();

    // Signals
    uploadError = signal<string>('');
    uploadAttempt = signal<boolean>(false);

    // Computed
    inverseClass = computed(() => {
        const field = this.field()();
        if (this.inverse() && !field.disabled()) return 'inverse';
        return '';
    });

    colorClass = computed(() => (this.field()().disabled() ? 'disabled' : this.color()));

    showError = computed(
        () => (this.field()().invalid() || !!this.uploadError()) && this.uploadAttempt()
    );

    // Hanlders
    async changeHandler(event: Event): Promise<void> {
        this.uploadAttempt.set(true);
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
            this.field()().value.set({ file: null, url: '' });
            this.uploadError.set('Something went wrong! No file found!');
        } else if (files.length > 1) {
            this.field()().value.set({ file: null, url: '' });
            this.uploadError.set('Please upload only one file at a time!');
        } else {
            try {
                const url = await fileToUrl(files[0]);
                this.field()().value.set({ file: files[0], url });
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
