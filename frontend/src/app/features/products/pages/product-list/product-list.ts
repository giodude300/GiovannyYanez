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

    protected readonly activeMenu = signal<string | null>(null);
    protected readonly menuPosition = signal<{ top: number; left: number } | null>(null);
    protected readonly selectedProduct = signal<Product | null>(null);
    protected readonly isDeleting = signal(false);
    protected readonly deleteError = signal<string | null>(null);
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

    protected toggleMenu(productId: string, event: MouseEvent): void {
        if (this.activeMenu() === productId) {
            this.closeMenu();
            return;
        }

        const button = event.currentTarget as HTMLElement;
        const buttonRect = button.getBoundingClientRect();
        const menuWidth = 130;
        const menuHeight = 88;
        const viewportPadding = 8;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const openAbove = spaceBelow < menuHeight + viewportPadding;
        const top = openAbove ? Math.max(viewportPadding, buttonRect.top - menuHeight - 4) : Math.min(window.innerHeight - menuHeight - viewportPadding, buttonRect.bottom + 4);
        const left = Math.max(viewportPadding, Math.min(buttonRect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding));

        this.menuPosition.set({ top, left });
        this.activeMenu.set(productId);
    }

    protected closeMenu(): void {
        this.activeMenu.set(null);
        this.menuPosition.set(null);
    }

    protected openDeleteConfirmation(product: Product): void {
        this.closeMenu();
        this.deleteError.set(null);
        this.selectedProduct.set(product);
    }

    protected closeDeleteConfirmation(): void {
        if (this.isDeleting()) {
            return;
        }
        this.selectedProduct.set(null);
        this.deleteError.set(null);
    }

    protected confirmDelete(): void {
        const product = this.selectedProduct();
        if (!product || this.isDeleting()) {
            return;
        }
        this.isDeleting.set(true);
        this.deleteError.set(null);
        this.productService.deleteProduct(product.id).subscribe({
            next: () => {
                this.products.update((products) => products.filter((item) => item.id !== product.id));
                this.selectedProduct.set(null);
                this.isDeleting.set(false);
                const remainingPages = Math.ceil(this.filteredProducts().length / this.pageSize());
                if (remainingPages === 0) {
                    this.currentPage.set(1);
                } else if (this.currentPage() > remainingPages) {
                    this.currentPage.set(remainingPages);
                }
            },
            error: () => {
                this.deleteError.set('No fue posible eliminar el producto. Intenta nuevamente.');
                this.isDeleting.set(false);
            },
        });
    }

    protected retry(): void {
        this.loadProducts();
    }
}
