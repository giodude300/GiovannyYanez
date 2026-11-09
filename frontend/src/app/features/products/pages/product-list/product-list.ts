import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

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
    protected readonly searchTerm = signal('');
    protected readonly isLoading = signal(true);
    protected readonly errorMessage = signal<string | null>(null);

    protected readonly filteredProducts = computed(() => {
        const search = this.normalizeText(this.searchTerm());

        if (!search) {
            return this.products();
        }

        return this.products().filter((product) => {
            const searchableFields = [product.id, product.name, product.description];

            return searchableFields.some((field) => this.normalizeText(field).includes(search));
        });
    });

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

    private normalizeText(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    protected onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;

        this.searchTerm.set(input.value);
    }

    protected retry(): void {
        this.loadProducts();
    }
}
