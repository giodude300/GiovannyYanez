import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { ProductListComponent } from './product-list';

describe('ProductListComponent', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<ProductListComponent>>;
    let component: ProductListComponent;
    let api: { getProducts: ReturnType<typeof vi.fn>; deleteProduct: ReturnType<typeof vi.fn> };
    const products: Product[] = Array.from({ length: 7 }, (_, index) => ({
        id: `id${index + 1}`,
        name: index === 0 ? 'Crédito Ágil' : `Producto ${index + 1}`,
        description: index === 0 ? 'Financiación personal' : `Descripción ${index + 1}`,
        logo: 'logo.png',
        date_release: '2026-01-01',
        date_revision: '2027-01-01',
    }));

    beforeEach(async () => {
        api = {
            getProducts: vi.fn().mockReturnValue(of(products)),
            deleteProduct: vi.fn().mockReturnValue(of({ message: 'deleted' })),
        };
        await TestBed.configureTestingModule({
            imports: [ProductListComponent],
            providers: [provideRouter([]), { provide: ProductService, useValue: api }],
        }).compileComponents();
        fixture = TestBed.createComponent(ProductListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    const internals = () => component as unknown as Record<string, (...args: any[]) => unknown>;

    it('creates and loads products on initialization', () => {
        expect(component).toBeTruthy();
        expect(api.getProducts).toHaveBeenCalledOnce();
        expect(fixture.nativeElement.textContent).toContain('Crédito Ágil');
    });

    it('shows skeletons while loading', () => {
        const pending = new Subject<Product[]>();
        api.getProducts.mockReturnValue(pending);
        const loadingFixture = TestBed.createComponent(ProductListComponent);
        loadingFixture.detectChanges();
        expect(loadingFixture.nativeElement.querySelector('.skeleton')).toBeTruthy();
        pending.next(products);
        pending.complete();
        loadingFixture.detectChanges();
        expect(loadingFixture.nativeElement.querySelector('.skeleton')).toBeFalsy();
    });

    it('renders the empty state', () => {
        api.getProducts.mockReturnValue(of([]));
        const emptyFixture = TestBed.createComponent(ProductListComponent);
        emptyFixture.detectChanges();
        expect(emptyFixture.nativeElement.textContent).toContain('No se encontraron productos financieros.');
    });

    it('renders the API error and retries successfully', () => {
        api.getProducts.mockReturnValueOnce(throwError(() => new Error('network'))).mockReturnValueOnce(of(products));
        const errorFixture = TestBed.createComponent(ProductListComponent);
        errorFixture.detectChanges();
        expect(errorFixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
        (errorFixture.nativeElement.querySelector('.error-state button') as HTMLButtonElement).click();
        errorFixture.detectChanges();
        expect(api.getProducts).toHaveBeenCalledTimes(3);
        expect(errorFixture.nativeElement.textContent).toContain('Crédito Ágil');
    });

    it('filters product name ignoring accents and case', () => {
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.value = 'credito agil';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Crédito Ágil');
        expect(fixture.nativeElement.textContent).not.toContain('Producto 2');
    });

    it('changes page size and resets pagination', () => {
        const select = fixture.nativeElement.querySelector('[aria-label="Cantidad de registros"]') as HTMLSelectElement;
        select.value = '10';
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('1 / 1');
    });

    it('does not move outside pagination boundaries', () => {
        internals()['previousPage']();
        expect((component as any).currentPage()).toBe(1);
        internals()['nextPage']();
        internals()['nextPage']();
        internals()['nextPage']();
        expect((component as any).currentPage()).toBe(2);
    });

    it('opens and closes the action menu', () => {
        const button = document.createElement('button');
        button.getBoundingClientRect = () => ({ top: 100, bottom: 130, left: 200, right: 230, width: 30, height: 30, x: 200, y: 100, toJSON: () => ({}) });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
        internals()['toggleMenu']('id1', { currentTarget: button } as unknown as never);
        expect((component as any).activeMenu()).toBe('id1');
        expect((component as any).menuPosition()).not.toBeNull();
        internals()['closeMenu']();
        expect((component as any).activeMenu()).toBeNull();
    });

    it('closes an already open menu when toggled again', () => {
        const button = document.createElement('button');
        button.getBoundingClientRect = () => ({ top: 100, bottom: 130, left: 200, right: 230, width: 30, height: 30, x: 200, y: 100, toJSON: () => ({}) });
        const event = { currentTarget: button } as unknown as never;
        internals()['toggleMenu']('id1', event);
        internals()['toggleMenu']('id1', event);
        expect((component as any).activeMenu()).toBeNull();
    });

    it('opens and cancels delete confirmation without calling the API', () => {
        internals()['openDeleteConfirmation'](products[0] as never);
        expect((component as any).selectedProduct()).toEqual(products[0]);
        internals()['closeDeleteConfirmation']();
        expect((component as any).selectedProduct()).toBeNull();
        expect(api.deleteProduct).not.toHaveBeenCalled();
    });

    it('deletes selected product and updates the list', () => {
        internals()['openDeleteConfirmation'](products[0] as never);
        internals()['confirmDelete']();
        expect(api.deleteProduct).toHaveBeenCalledWith('id1');
        expect((component as any).products()).toHaveLength(6);
        expect((component as any).selectedProduct()).toBeNull();
    });

    it('does nothing when there is no selected product', () => {
        internals()['confirmDelete']();
        expect(api.deleteProduct).not.toHaveBeenCalled();
    });

    it('does not close the modal while deletion is pending', () => {
        const pending = new Subject<{ message: string }>();
        api.deleteProduct.mockReturnValue(pending);
        internals()['openDeleteConfirmation'](products[0] as never);
        internals()['confirmDelete']();
        internals()['closeDeleteConfirmation']();
        expect((component as any).selectedProduct()).toEqual(products[0]);
        expect((component as any).isDeleting()).toBe(true);
        pending.next({ message: 'deleted' });
        pending.complete();
    });

    it('keeps the product and shows an error when deletion fails', () => {
        api.deleteProduct.mockReturnValue(throwError(() => new Error('delete failed')));
        internals()['openDeleteConfirmation'](products[0] as never);
        internals()['confirmDelete']();
        expect((component as any).products()).toHaveLength(7);
        expect((component as any).deleteError()).toContain('No fue posible eliminar');
        expect((component as any).isDeleting()).toBe(false);
    });

    it('returns to the first page when deleting the last product', () => {
        (component as any).products.set([products[0]]);
        internals()['openDeleteConfirmation'](products[0] as never);
        internals()['confirmDelete']();
        expect((component as any).currentPage()).toBe(1);
    });

    it('moves to the previous page when the current last page becomes empty', () => {
        (component as any).products.set(products.slice(0, 6));
        (component as any).currentPage.set(2);
        internals()['openDeleteConfirmation'](products[5] as never);
        internals()['confirmDelete']();
        expect((component as any).currentPage()).toBe(1);
    });

    it('renders the no-results message when a search has no matches', () => {
        const input = fixture.nativeElement.querySelector('[aria-label="Buscar productos"]') as HTMLInputElement;
        input.value = 'no existe';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain('No se encontraron productos que coincidan con la búsqueda.');
        expect((component as any).startIndex()).toBe(0);
        expect((component as any).endIndex()).toBe(0);
    });

    it('searches by product ID and description', () => {
        const input = fixture.nativeElement.querySelector('[aria-label="Buscar productos"]') as HTMLInputElement;
        input.value = 'id2';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Producto 2');

        input.value = 'descripcion 3';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Producto 3');
        expect(fixture.nativeElement.textContent).not.toContain('Producto 2');
    });

    it('renders the product card actions and opens its delete confirmation', () => {
        const mobileMenuButton = fixture.nativeElement.querySelector('.products-mobile .menu-button') as HTMLButtonElement;
        mobileMenuButton.click();
        fixture.detectChanges();

        const deleteButton = fixture.nativeElement.querySelector('.products-mobile .delete-menu-button') as HTMLButtonElement;
        expect(deleteButton).toBeTruthy();
        deleteButton.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
        expect(fixture.nativeElement.textContent).toContain('¿Estas seguro de eliminar el producto');
    });

    it('closes the delete confirmation when the backdrop is clicked', () => {
        internals()['openDeleteConfirmation'](products[0]);
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement).click();
        fixture.detectChanges();

        expect((component as any).selectedProduct()).toBeNull();
    });

    it('keeps the delete confirmation open when the modal content is clicked', () => {
        internals()['openDeleteConfirmation'](products[0]);
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.delete-modal') as HTMLElement).click();
        fixture.detectChanges();

        expect((component as any).selectedProduct()).toEqual(products[0]);
    });

    it('renders and dismisses a delete error through the modal', () => {
        api.deleteProduct.mockReturnValue(throwError(() => new Error('delete failed')));
        internals()['openDeleteConfirmation'](products[0]);
        internals()['confirmDelete']();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.delete-error')?.textContent).toContain('No fue posible eliminar');
        (fixture.nativeElement.querySelector('.cancel-delete-button') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect((component as any).selectedProduct()).toBeNull();
    });

    it('does not allow the modal to close from the backdrop while deleting', () => {
        const pending = new Subject<{ message: string }>();
        api.deleteProduct.mockReturnValue(pending);
        internals()['openDeleteConfirmation'](products[0]);
        internals()['confirmDelete']();
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement).click();
        fixture.detectChanges();

        expect((component as any).selectedProduct()).toEqual(products[0]);
        pending.next({ message: 'deleted' });
        pending.complete();
    });

    it('renders the pagination footer and disables the previous button on the first page', () => {
        const previous = fixture.nativeElement.querySelector('[aria-label="Página anterior"]') as HTMLButtonElement;
        const next = fixture.nativeElement.querySelector('[aria-label="Página siguiente"]') as HTMLButtonElement;

        expect(previous.disabled).toBe(true);
        expect(next.disabled).toBe(false);
        next.click();
        fixture.detectChanges();

        expect((component as any).currentPage()).toBe(2);
        expect(previous.disabled).toBe(false);
        expect(next.disabled).toBe(true);
    });

    it('renders the error state and hides the results footer until retry completes', () => {
        const pending = new Subject<Product[]>();
        api.getProducts.mockReturnValueOnce(throwError(() => new Error('network'))).mockReturnValueOnce(pending);
        const errorFixture = TestBed.createComponent(ProductListComponent);
        errorFixture.detectChanges();

        expect(errorFixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
        (errorFixture.nativeElement.querySelector('.error-state button') as HTMLButtonElement).click();
        errorFixture.detectChanges();

        expect(errorFixture.nativeElement.querySelector('.skeleton-desktop')).toBeTruthy();
        expect(errorFixture.nativeElement.querySelector('.pagination')).toBeNull();
        pending.next(products);
        pending.complete();
        errorFixture.detectChanges();
        expect(errorFixture.nativeElement.textContent).toContain('Crédito Ágil');
    });

    it('positions the action menu above the button when there is not enough space below', () => {
        const button = document.createElement('button');
        button.getBoundingClientRect = () => ({
            top: 760,
            bottom: 790,
            left: 200,
            right: 230,
            width: 30,
            height: 30,
            x: 200,
            y: 760,
            toJSON: () => ({}),
        });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });

        internals()['toggleMenu']('id1', { currentTarget: button } as unknown as MouseEvent);

        expect((component as any).menuPosition().top).toBe(668);
    });

    it('opens the desktop product action menu from its template button', () => {
        const button = fixture.nativeElement.querySelector('.table-wrapper .menu-button') as HTMLButtonElement;
        expect(button).toBeTruthy();

        button.click();
        fixture.detectChanges();

        expect((component as any).activeMenu()).toBe('id1');
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(fixture.nativeElement.querySelector('.table-wrapper .context-menu')).toBeTruthy();
    });
});
