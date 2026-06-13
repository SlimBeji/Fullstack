import { Component, computed, input } from '@angular/core';

import type { User } from '@/types';

import { UserItem } from '../user-item/user-item';

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.html',
    styleUrl: './users-list.css',
    imports: [UserItem],
})
export class UsersList {
    // Inputs
    items = input.required<User[]>();

    // Computed
    noUsers = computed(() => this.items().length === 0);
}
