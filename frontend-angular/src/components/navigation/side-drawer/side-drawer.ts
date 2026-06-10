import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-side-drawer',
    templateUrl: './side-drawer.html',
    styleUrl: './side-drawer.css',
})
export class SideDrawer {
    show = input<boolean>(false);
    clicked = output<void>();
}
