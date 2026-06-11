import { Component, computed, input, model, signal } from '@angular/core';

import type { CssClass } from '@/types';

@Component({
    selector: 'app-input',
    templateUrl: './input.html',
    styleUrl: './input.css',
})
export class Input {
    // Model
    value = model.required<string>();

    // Inputs
    id = input.required<string>();
    label = input.required<string>();
    isValid = input<boolean>();
    customClass = input<CssClass>('basis-full');
    element = input<'input' | 'textarea'>('input');
    type = input<HTMLInputElement['type']>();
    step = input<string>();
    disabled = input<boolean>(false);
    rows = input<number>(3);
    placeholder = input<string>();
    errorText = input<string>('The input is not valid');

    // Signals
    isTouched = signal<boolean>(false);

    // Computed
    showError = computed(() => !this.isValid() && this.isTouched());

    inputClass = computed(() => ({
        disabled: this.disabled(),
        active: !this.disabled(),
    }));

    containerClass = computed(() => [this.customClass(), { error: this.showError() }]);

    isTextarea = computed(() => this.element() === 'textarea');

    // Handlers
    onInput(event: InputEvent): void {
        this.value.set((event.target as HTMLInputElement).value);
    }

    onBlur(): void {
        if (!this.disabled()) this.isTouched.set(true);
    }
}
