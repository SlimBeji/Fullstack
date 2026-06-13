import { DomPortal } from '@angular/cdk/portal';
import { DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';

import { TeleportService } from './teleport.service';

@Directive({
    selector: '[appTeleport]',
})
export class Teleport {
    to = input.required<string>({ alias: 'appTeleport' });

    private el = inject<ElementRef<HTMLElement>>(ElementRef);
    private service = inject(TeleportService);

    constructor() {
        inject(DestroyRef).onDestroy(() => this.service.detach(this.to()));

        effect(() => {
            this.service.attach(this.to(), new DomPortal(this.el));
        });
    }
}
