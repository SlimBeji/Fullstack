import type { EmbeddedViewRef, TemplateRef, ViewContainerRef } from '@angular/core';
import { Service } from '@angular/core';

@Service()
export class TeleportService {
    private outlets = new Map<string, ViewContainerRef>();
    private views = new Map<TemplateRef<unknown>, EmbeddedViewRef<unknown>>();

    registerOutlet(name: string, outlet: ViewContainerRef) {
        this.outlets.set(name, outlet);
    }

    unregisterOutlet(name: string) {
        this.outlets.delete(name);
    }

    attachRef(name: string, template: TemplateRef<unknown>) {
        const outlet = this.outlets.get(name);
        if (!outlet) return;
        const viewRef = outlet.createEmbeddedView(template);
        this.views.set(template, viewRef);
    }

    detachRef(template: TemplateRef<unknown>) {
        this.views.get(template)?.destroy();
        this.views.delete(template);
    }
}
