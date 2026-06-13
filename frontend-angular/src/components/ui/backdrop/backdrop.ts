import { Component, output } from '@angular/core';

import { Teleport } from '@/services';

@Component({
    selector: 'app-backdrop',
    templateUrl: './backdrop.html',
    styleUrl: './backdrop.css',
    imports: [Teleport],
})
export class Backdrop {
    clicked = output<void>();
}
