import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePlace } from './update-place';

describe('UpdatePlace', () => {
    let component: UpdatePlace;
    let fixture: ComponentFixture<UpdatePlace>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UpdatePlace],
        }).compileComponents();

        fixture = TestBed.createComponent(UpdatePlace);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
