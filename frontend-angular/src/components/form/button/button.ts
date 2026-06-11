import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ButtonType, ColorType, CssClass } from '@/types';

@Component({
    selector: 'app-button',
    templateUrl: './button.html',
    styleUrl: './button.css',
    imports: [RouterLink],
})
export class Button {
    // Inputs
    disabled = input<boolean>(false);
    inverse = input<boolean>(false);
    color = input<ColorType>('primary');
    customClass = input<CssClass>('');
    to = input<string>();
    href = input<string>();
    type = input<ButtonType>('button');

    // Outputs
    clicked = output<void>();

    // Computed
    inverseClass = computed(() => (this.inverse() && !this.disabled() ? 'inverse' : ''));
    colorClass = computed(() => (this.disabled() ? 'disabled' : this.color()));
    isAnchor = computed(() => !!this.href() && !this.to());
    isRouterLink = computed(() => !!this.to() && !this.href());

    // Handlers
    clickHandler() {
        if (!this.disabled()) {
            this.clicked.emit();
        }
    }
}
