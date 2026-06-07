import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPlaces } from './user-places';

describe('UserPlaces', () => {
    let component: UserPlaces;
    let fixture: ComponentFixture<UserPlaces>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserPlaces],
        }).compileComponents();

        fixture = TestBed.createComponent(UserPlaces);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
