import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
    it('creates the root application component', async () => {
        await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
        const fixture = TestBed.createComponent(App);
        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    });
});
