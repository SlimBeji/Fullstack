import { Component } from '@angular/core';

import { PlaceCreateForm } from '@/components/place';

@Component({
    selector: 'app-new-place',
    imports: [PlaceCreateForm],
    templateUrl: './new-place.html',
})
export class NewPlace {}
