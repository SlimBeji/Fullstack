import { CdkPortalOutlet } from '@angular/cdk/portal';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MainNavigation } from '@/components/navigation';
import { TeleportOutlet } from '@/services';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, MainNavigation, CdkPortalOutlet, TeleportOutlet],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App {
    protected readonly title = signal('frontend-angular');
}
