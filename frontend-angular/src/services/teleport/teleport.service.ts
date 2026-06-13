import type { CdkPortalOutlet, DomPortal } from '@angular/cdk/portal';
import { Service } from '@angular/core';

@Service()
export class TeleportService {
    private outlets = new Map<string, CdkPortalOutlet>();

    register(name: string, outlet: CdkPortalOutlet) {
        this.outlets.set(name, outlet);
    }

    attach(name: string, portal: DomPortal<HTMLElement>) {
        const outlet = this.outlets.get(name);
        if (!outlet) return;
        if (outlet.hasAttached()) outlet.detach();
        outlet.attach(portal);
    }

    detach(name: string) {
        this.outlets.get(name)?.detach();
    }
}
