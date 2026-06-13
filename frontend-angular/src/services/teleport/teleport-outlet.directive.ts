import { CdkPortalOutlet } from '@angular/cdk/portal';
import type { OnDestroy, OnInit } from '@angular/core';
import { Directive, inject, input } from '@angular/core';

import { TeleportService } from './teleport.service';

@Directive({
    selector: '[appTeleportOutlet]',
})
export class TeleportOutlet implements OnInit, OnDestroy {
    private outlet = inject(CdkPortalOutlet);
    private teleport = inject(TeleportService);

    name = input.required<string>({ alias: 'appTeleportOutlet' });

    ngOnInit() {
        this.teleport.register(this.name(), this.outlet);
    }

    ngOnDestroy() {
        this.teleport.unregister(this.name());
    }
}
