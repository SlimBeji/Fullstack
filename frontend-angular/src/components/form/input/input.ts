import { Component, computed, input } from '@angular/core';
import type { Field } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';

import type { CssClass } from '@/types';

@Component({
    selector: 'app-input',
    templateUrl: './input.html',
    styleUrl: './input.css',
    imports: [FormField],
})
export class Input {
    // Form
    field = input.required<Field<any>>();

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
    showError = computed(() => {
        const field = this.field()();
        return !!field.invalid() && !!field.touched();
    });

    inputClass = computed(() => {
        const field = this.field()();
        return {
            disabled: field.disabled(),
            active: !field.disabled(),
        };
    });

    containerClass = computed(() => [this.customClass(), { error: this.showError() }]);

    isTextarea = computed(() => this.element() === 'textarea');

    errorMessage = computed(() => {
        const errorText = this.errorText();
        if (errorText) return errorText;

        const errors = this.field()().errors();
        if (errors && errors.length > 0) return errors[0].message;

        return 'The input is not valid';
    });
}
