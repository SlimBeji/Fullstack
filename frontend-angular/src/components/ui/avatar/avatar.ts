import { Component, input } from '@angular/core';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.html',
    styleUrl: './avatar.css',
})
export class Avatar {
    imageUrl = input.required<string>();
    alt = input.required<string>();
}
