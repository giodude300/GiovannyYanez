import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/products/pages/product-list/product-list').then((component) => component.ProductListComponent),
    },
    {
        path: 'products/new',
        loadComponent: () => import('./features/products/pages/product-form/product-form').then((component) => component.ProductFormComponent),
    },
    {
        path: 'products/edit/:id',
        loadComponent: () => import('./features/products/pages/product-form/product-form').then((component) => component.ProductFormComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
