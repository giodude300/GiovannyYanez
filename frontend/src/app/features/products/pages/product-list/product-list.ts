import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
    selector: 'app-product-list',
    standalone: true,
    templateUrl: './product-list.html',
    styleUrl: './product-list.css',
    imports: [DatePipe],
})
export class ProductListComponent implements OnInit {
    private readonly productService = inject(ProductService);

    protected readonly products = signal<Product[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly errorMessage = signal<string | null>(null);

    ngOnInit(): void {
        this.loadProducts();
    }

    private loadProducts(): void {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.productService.getProducts().subscribe({
            next: (products) => {
                this.products.set(products);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('No fue posible cargar los productos. Intenta nuevamente.');
                this.isLoading.set(false);
            },
        });
    }

    protected retry(): void {
        this.loadProducts();
    }
}
