import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
    selector: 'app-product-list',
    standalone: true,
    templateUrl: './product-list.html',
    styleUrl: './product-list.css',
    imports: [DatePipe, RouterLink],
})
export class ProductListComponent implements OnInit {
    private readonly productService = inject(ProductService);

    protected readonly products = signal<Product[]>([]);
    protected readonly searchTerm = signal('');
    protected readonly isLoading = signal(true);
    protected readonly errorMessage = signal<string | null>(null);
    protected readonly pageSize = signal(5);
    protected readonly currentPage = signal(1);
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

    protected readonly totalPages = computed(() => {
        return Math.ceil(this.filteredProducts().length / this.pageSize());
    });

    protected readonly paginatedProducts = computed(() => {
        const startIndex = (this.currentPage() - 1) * this.pageSize();
        const endIndex = startIndex + this.pageSize();
        return this.filteredProducts().slice(startIndex, endIndex);
    });

    protected readonly startIndex = computed(() => {
        if (this.filteredProducts().length === 0) {
            return 0;
        }
        return (this.currentPage() - 1) * this.pageSize() + 1;
    });

    protected readonly endIndex = computed(() => {
        return Math.min(this.currentPage() * this.pageSize(), this.filteredProducts().length);
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
                this.currentPage.set(1);
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
        this.currentPage.set(1);
    }

    protected onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.pageSize.set(Number(select.value));
        this.currentPage.set(1);
    }

    protected previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update((page) => page - 1);
        }
    }

    protected nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update((page) => page + 1);
        }
    }

    protected retry(): void {
        this.loadProducts();
    }
}
