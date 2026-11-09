import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Product, ProductsResponse } from '../models/product.model';

@Injectable({
    providedIn: 'root',
})
export class ProductService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api/products';

    getProducts(): Observable<Product[]> {
        return this.http.get<ProductsResponse>(this.apiUrl).pipe(map((response) => response.data));
    }
}
