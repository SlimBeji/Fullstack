import { Component, output } from '@angular/core';

@Component({
    selector: 'app-backdrop',
    templateUrl: './backdrop.html',
    styleUrl: './backdrop.css',
})
export class Backdrop {
    clicked = output<void>();
}
