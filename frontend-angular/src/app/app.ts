import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MainNavigation } from '@/components/navigation';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, MainNavigation],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App {
    protected readonly title = signal('frontend-angular');
}
