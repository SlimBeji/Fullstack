import { CdkPortal } from '@angular/cdk/portal';
import { Component, input, output } from '@angular/core';

import { Teleport } from '@/services';

@Component({
    selector: 'app-side-drawer',
    templateUrl: './side-drawer.html',
    styleUrl: './side-drawer.css',
    imports: [CdkPortal, Teleport],
})
export class SideDrawer {
    show = input<boolean>(false);
    clicked = output<void>();
}
