import { CdkPortal } from '@angular/cdk/portal';
import type { OnDestroy, OnInit } from '@angular/core';
import { Directive, inject, input } from '@angular/core';

import { TeleportService } from './teleport.service';

@Directive({
    selector: '[appTeleport]',
})
export class Teleport implements OnInit, OnDestroy {
    private portal = inject(CdkPortal);
    private teleport = inject(TeleportService);

    to = input.required<string>({ alias: 'appTeleport' });

    ngOnInit() {
        this.teleport.attach(this.to(), this.portal);
    }

    ngOnDestroy() {
        this.teleport.detach(this.to());
    }
}
