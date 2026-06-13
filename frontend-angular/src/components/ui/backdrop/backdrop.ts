import { CdkPortal } from '@angular/cdk/portal';
import { Component, output } from '@angular/core';

import { Teleport } from '@/services';

@Component({
    selector: 'app-backdrop',
    templateUrl: './backdrop.html',
    styleUrl: './backdrop.css',
    imports: [CdkPortal, Teleport],
})
export class Backdrop {
    clicked = output<void>();
}
