import { Component, computed, input, model } from '@angular/core';
import type { ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';

import type { CssClass } from '@/types';

@Component({
    selector: 'app-input',
    templateUrl: './input.html',
    styleUrl: './input.css',
})
export class Input {
    // Form
    value = model<string>();
    invalid = input<boolean>();
    touched = input<boolean>();
    disabled = input<boolean>();
    errors = input<readonly WithOptionalFieldTree<ValidationError>[]>();

    // Inputs
    id = input.required<string>();
    label = input.required<string>();
    customClass = input<CssClass>('basis-full');
    element = input<'input' | 'textarea'>('input');
    type = input<HTMLInputElement['type']>();
    step = input<string>();
    rows = input<number>(3);
    placeholder = input<string>('');
    errorText = input<string>();

    // Computed
    showError = computed(() => !!this.invalid() && !!this.touched());

    inputClass = computed(() => ({
        disabled: this.disabled(),
        active: !this.disabled(),
    }));

    containerClass = computed(() => [this.customClass(), { error: this.showError() }]);

    isTextarea = computed(() => this.element() === 'textarea');

    errorMessage = computed(() => {
        const errorText = this.errorText();
        if (errorText) return errorText;

        const errors = this.errors();
        if (errors && errors.length > 0) return errors[0].message;

        return 'The input is not valid';
    });
}
