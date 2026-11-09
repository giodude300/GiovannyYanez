import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Product, ProductsResponse } from '../models/product.model';

interface ProductResponse {
    message: string;
    data: Product;
}

@Injectable({
    providedIn: 'root',
})
export class ProductService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api/products';

    getProducts(): Observable<Product[]> {
        return this.http.get<ProductsResponse>(this.apiUrl).pipe(map((response) => response.data));
    }

    verifyProductId(id: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/verification/${encodeURIComponent(id)}`);
    }

    createProduct(product: Product): Observable<ProductResponse> {
        return this.http.post<ProductResponse>(this.apiUrl, product);
    }

    updateProduct(id: string, product: Product): Observable<ProductResponse> {
        return this.http.put<ProductResponse>(`${this.apiUrl}/${encodeURIComponent(id)}`, product);
    }
}
