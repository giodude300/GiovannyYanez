import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

describe('ProductService', () => {
    let service: ProductService;
    let httpMock: HttpTestingController;

    const product: Product = {
        id: 'prod1',
        name: 'Producto financiero',
        description: 'Descripción de producto',
        logo: 'data:image/jpeg;base64,abc',
        date_release: '2026-12-01',
        date_revision: '2027-12-01',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(ProductService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('retrieves products and maps the data property', () => {
        let result: Product[] = [];
        service.getProducts().subscribe((products) => (result = products));

        const request = httpMock.expectOne('/api/products');
        expect(request.request.method).toBe('GET');
        request.flush({ data: [product] });

        expect(result).toEqual([product]);
    });

    it('verifies a product ID using an encoded identifier', () => {
        let result = false;
        service.verifyProductId('id with spaces').subscribe((exists) => (result = exists));

        const request = httpMock.expectOne('/api/products/verification/id%20with%20spaces');
        expect(request.request.method).toBe('GET');
        request.flush(true);

        expect(result).toBe(true);
    });

    it('creates a product', () => {
        let result: unknown;
        service.createProduct(product).subscribe((response) => (result = response));

        const request = httpMock.expectOne('/api/products');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(product);
        request.flush({ message: 'created', data: product });

        expect(result).toEqual({ message: 'created', data: product });
    });

    it('updates a product using an encoded identifier', () => {
        let result: unknown;
        service.updateProduct('id/1', product).subscribe((response) => (result = response));

        const request = httpMock.expectOne('/api/products/id%2F1');
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual(product);
        request.flush({ message: 'updated', data: product });

        expect(result).toEqual({ message: 'updated', data: product });
    });

    it('deletes a product using an encoded identifier', () => {
        let result: unknown;
        service.deleteProduct('id/1').subscribe((response) => (result = response));

        const request = httpMock.expectOne('/api/products/id%2F1');
        expect(request.request.method).toBe('DELETE');
        request.flush({ message: 'deleted' });

        expect(result).toEqual({ message: 'deleted' });
    });

    it('propagates HTTP errors from the API', () => {
        let status = 0;
        service.getProducts().subscribe({ error: (error: { status: number }) => (status = error.status) });

        httpMock.expectOne('/api/products').flush('Server error', { status: 500, statusText: 'Server Error' });

        expect(status).toBe(500);
    });
});
