import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPlace } from './new-place';

describe('NewPlace', () => {
    let component: NewPlace;
    let fixture: ComponentFixture<NewPlace>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NewPlace],
        }).compileComponents();

        fixture = TestBed.createComponent(NewPlace);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
