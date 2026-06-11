import { Component, input } from '@angular/core';

@Component({
    selector: 'app-loading-spinner',
    templateUrl: './loading-spinner.html',
    styleUrl: './loading-spinner.css',
})
export class LoadingSpinner {
    asOverlay = input<boolean>(false);
}
