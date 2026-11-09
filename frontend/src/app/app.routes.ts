import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/products/pages/product-list/product-list').then((component) => component.ProductListComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
