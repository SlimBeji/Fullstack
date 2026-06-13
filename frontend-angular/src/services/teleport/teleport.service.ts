import type { CdkPortal, CdkPortalOutlet } from '@angular/cdk/portal';
import { Service } from '@angular/core';

@Service()
export class TeleportService {
    private outlets = new Map<string, CdkPortalOutlet>();

    register(name: string, outlet: CdkPortalOutlet) {
        this.outlets.set(name, outlet);
    }

    unregister(name: string) {
        this.outlets.delete(name);
    }

    attach(name: string, portal: CdkPortal) {
        const outlet = this.outlets.get(name);
        if (!outlet) return;
        if (outlet.hasAttached()) outlet.detach();
        outlet.attach(portal);
    }

    detach(name: string) {
        this.outlets.get(name)?.detach();
    }
}
