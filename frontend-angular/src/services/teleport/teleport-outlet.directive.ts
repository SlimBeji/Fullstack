import type { OnDestroy, OnInit } from '@angular/core';
import { Directive, inject, input, ViewContainerRef } from '@angular/core';

import { TeleportService } from './teleport.service';

@Directive({
    selector: '[appTeleportOutlet]',
})
export class TeleportOutlet implements OnInit, OnDestroy {
    private outlet = inject(ViewContainerRef);
    private teleport = inject(TeleportService);

    name = input.required<string>({ alias: 'appTeleportOutlet' });

    ngOnInit() {
        this.teleport.registerOutlet(this.name(), this.outlet);
    }

    ngOnDestroy() {
        this.teleport.unregisterOutlet(this.name());
    }
}
