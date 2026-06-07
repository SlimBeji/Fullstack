import { Component } from '@angular/core';

import { AuthForm } from '@/components/user';

@Component({
    selector: 'app-auth',
    imports: [AuthForm],
    templateUrl: './auth.html',
})
export class Auth {}
