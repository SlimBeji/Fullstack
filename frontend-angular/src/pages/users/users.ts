import type { OnInit } from '@angular/core';
import { Component, computed, inject } from '@angular/core';

import { HttpError, LoadingSpinner } from '@/components/ui';
import { UsersList } from '@/components/user';
import { BackendService } from '@/services';
import type { User } from '@/types';

@Component({
    selector: 'app-users',
    templateUrl: './users.html',
    imports: [HttpError, LoadingSpinner, UsersList],
    providers: [BackendService],
})
export class Users implements OnInit {
    // Init
    backend = inject(BackendService);

    // Computed
    items = computed((): User[] => {
        if (this.backend.httpData().json?.data) {
            return this.backend.httpData().json?.data as User[];
        }
        return [];
    });

    // Events
    ngOnInit(): void {
        this.backend.sendRequest('/users/', 'get');
    }
}
