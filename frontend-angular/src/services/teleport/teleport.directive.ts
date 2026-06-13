import type { OnDestroy, OnInit } from '@angular/core';
import { Directive, inject, input, TemplateRef } from '@angular/core';

import { TeleportService } from './teleport.service';

@Directive({
    selector: '[appTeleport]',
})
export class Teleport implements OnInit, OnDestroy {
    private template = inject(TemplateRef);
    private teleport = inject(TeleportService);

    to = input.required<string>({ alias: 'appTeleport' });

    ngOnInit() {
        this.teleport.attachRef(this.to(), this.template);
    }

    ngOnDestroy() {
        this.teleport.detachRef(this.template);
    }
}
