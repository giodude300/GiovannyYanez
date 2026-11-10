import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { ProductFormComponent } from './product-form';

describe('ProductFormComponent', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<ProductFormComponent>>;
    let component: ProductFormComponent;
    let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
    let api: {
        getProducts: ReturnType<typeof vi.fn>;
        verifyProductId: ReturnType<typeof vi.fn>;
        createProduct: ReturnType<typeof vi.fn>;
        updateProduct: ReturnType<typeof vi.fn>;
    };
    let router: { navigate: ReturnType<typeof vi.fn> };
    let location: { back: ReturnType<typeof vi.fn> };

    const product: Product = {
        id: 'prod1',
        name: 'Producto financiero',
        description: 'Descripción de producto',
        logo: 'data:image/jpeg;base64,logo',
        date_release: '2099-05-10',
        date_revision: '2100-05-10',
    };

    const createFixture = async () => {
        fixture = TestBed.createComponent(ProductFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    beforeEach(async () => {
        params = new BehaviorSubject(convertToParamMap({}));
        api = {
            getProducts: vi.fn().mockReturnValue(of([product])),
            verifyProductId: vi.fn().mockReturnValue(of(false)),
            createProduct: vi.fn().mockReturnValue(of({ message: 'created', data: product })),
            updateProduct: vi.fn().mockReturnValue(of({ message: 'updated', data: product })),
        };
        router = { navigate: vi.fn() };
        location = { back: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [ProductFormComponent],
            providers: [
                { provide: ProductService, useValue: api },
                { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
                { provide: Router, useValue: router },
                { provide: Location, useValue: location },
            ],
        }).compileComponents();
    });

    it('creates the form with the expected controls', async () => {
        await createFixture();
        expect(component).toBeTruthy();
        expect((component as any).productForm.contains('id')).toBe(true);
        expect((component as any).productForm.contains('name')).toBe(true);
        expect((component as any).productForm.contains('description')).toBe(true);
        expect((component as any).productForm.contains('logo')).toBe(true);
        expect((component as any).productForm.controls.date_revision.disabled).toBe(true);
    });

    it('shows validation errors and does not create an invalid form', async () => {
        await createFixture();
        (component as any).submitForm();
        expect((component as any).errorMessage.value).toContain('corrige los errores');
        expect(api.createProduct).not.toHaveBeenCalled();
    });

    it('updates the revision date when the release date changes', async () => {
        await createFixture();
        (component as any).productForm.controls.date_release.setValue('2099-05-10');
        expect((component as any).productForm.controls.date_revision.value).toBe('2100-05-10');
        (component as any).productForm.controls.date_release.setValue('');
        expect((component as any).productForm.controls.date_revision.value).toBe('');
    });

    it('validates asynchronous ID verification as available', async () => {
        await createFixture();
        const control = (component as any).productForm.controls.id;
        control.setValue('new-id');
        await new Promise((resolve) => setTimeout(resolve, 350));
        expect(api.verifyProductId).toHaveBeenCalledWith('new-id');
        expect(control.errors).toBeNull();
    });

    it('marks an existing ID as unavailable', async () => {
        api.verifyProductId.mockReturnValue(of(true));
        await createFixture();
        const control = (component as any).productForm.controls.id;
        control.setValue('taken-id');
        await new Promise((resolve) => setTimeout(resolve, 350));
        expect(control.errors).toEqual({ idTaken: true });
    });

    it('reports ID verification failures as validation errors', async () => {
        api.verifyProductId.mockReturnValue(throwError(() => new Error('network')));
        await createFixture();
        const control = (component as any).productForm.controls.id;
        control.setValue('new-id');
        await new Promise((resolve) => setTimeout(resolve, 350));
        expect(control.errors).toEqual({ idVerificationFailed: true });
    });

    it('does not call ID verification for values outside the accepted length', async () => {
        await createFixture();
        const control = (component as any).productForm.controls.id;
        control.setValue('ab');
        await new Promise((resolve) => setTimeout(resolve, 350));
        expect(api.verifyProductId).not.toHaveBeenCalled();
    });

    it('creates a valid product and displays success feedback', async () => {
        await createFixture();
        const form = (component as any).productForm;
        form.controls.id.setValue('new-id');
        form.controls.name.setValue('Producto nuevo');
        form.controls.description.setValue('Descripción válida del producto');
        form.controls.logo.setValue('data:image/jpeg;base64,logo');
        form.controls.date_release.setValue('2099-05-10');
        await new Promise((resolve) => setTimeout(resolve, 350));
        (component as any).submitForm();

        expect(api.createProduct).toHaveBeenCalledOnce();
        expect((component as any).successMessage.value).toBe('Producto agregado correctamente');
        expect((component as any).isSubmitting.value).toBe(false);
    });

    it('shows an error when product creation fails', async () => {
        api.createProduct.mockReturnValue(throwError(() => new Error('server')));
        await createFixture();
        const form = (component as any).productForm;
        form.controls.id.setValue('new-id');
        form.controls.name.setValue('Producto nuevo');
        form.controls.description.setValue('Descripción válida del producto');
        form.controls.logo.setValue('logo');
        form.controls.date_release.setValue('2099-05-10');
        await new Promise((resolve) => setTimeout(resolve, 350));
        (component as any).submitForm();

        expect((component as any).errorMessage.value).toContain('No fue posible registrar');
        expect((component as any).isSubmitting.value).toBe(false);
    });

    it('loads an existing product in edit mode and disables its ID', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        fixture.detectChanges();

        expect((component as any).isEditMode).toBe(true);
        expect((component as any).productForm.controls.id.disabled).toBe(true);
        expect((component as any).productForm.controls.name.value).toBe(product.name);
        expect((component as any).logoPreview).toBe(product.logo);
    });

    it('reports when the requested product does not exist', async () => {
        api.getProducts.mockReturnValue(of([]));
        await createFixture();
        params.next(convertToParamMap({ id: 'missing' }));
        await fixture.whenStable();
        expect((component as any).errorMessage.value).toContain('No se encontró el producto');
        expect((component as any).isLoadingProduct).toBe(false);
    });

    it('reports errors while loading an existing product', async () => {
        api.getProducts.mockReturnValue(throwError(() => new Error('network')));
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        expect((component as any).errorMessage.value).toContain('No fue posible cargar el producto');
        expect((component as any).isLoadingProduct).toBe(false);
    });

    it('restores original values when resetting edit mode', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        const form = (component as any).productForm;
        form.controls.name.setValue('Nombre modificado');
        (component as any).resetForm();

        expect(form.controls.name.value).toBe(product.name);
        expect(form.controls.id.disabled).toBe(true);
        expect((component as any).logoPreview).toBe(product.logo);
    });

    it('clears all values when resetting create mode', async () => {
        await createFixture();
        const form = (component as any).productForm;
        form.controls.name.setValue('Nombre temporal');
        (component as any).logoPreview = 'preview';
        (component as any).resetForm();

        expect(form.controls.name.value).toBe('');
        expect(form.controls.id.value).toBe('');
        expect((component as any).logoPreview).toBe('');
    });

    it('updates an existing product and displays success feedback', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        (component as any).submitForm();

        expect(api.updateProduct).toHaveBeenCalledWith(product.id, expect.objectContaining({ name: product.name }));
        expect((component as any).successMessage.value).toBe('Producto actualizado correctamente');
    });

    it('shows an error when updating a product fails', async () => {
        api.updateProduct.mockReturnValue(throwError(() => new Error('server')));
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        (component as any).submitForm();

        expect((component as any).errorMessage.value).toContain('No fue posible actualizar');
    });

    it('does not submit while a product is loading or a submission is active', async () => {
        await createFixture();
        const form = (component as any).productForm;
        form.controls.id.setValue('new-id');
        form.controls.name.setValue('Producto nuevo');
        form.controls.description.setValue('Descripción válida del producto');
        form.controls.logo.setValue('logo');
        form.controls.date_release.setValue('2099-05-10');
        await new Promise((resolve) => setTimeout(resolve, 350));
        (component as any).isLoadingProduct = true;
        (component as any).submitForm();
        expect(api.createProduct).not.toHaveBeenCalled();
        (component as any).isLoadingProduct = false;
        (component as any).isSubmitting.value = true;
        (component as any).submitForm();
        expect(api.createProduct).not.toHaveBeenCalled();
    });

    it('handles field errors and invalid state helpers', async () => {
        await createFixture();
        const name = (component as any).productForm.controls.name;
        name.markAsTouched();
        expect((component as any).getFieldError('name')).toContain('requerido');
        expect((component as any).isFieldInvalid('name')).toBe(true);
        expect((component as any).isFieldInvalid('unknown')).toBe(false);
        expect((component as any).getFieldError('unknown')).toBe('');
    });

    it('opens the logo modal only when a preview exists', async () => {
        await createFixture();
        (component as any).openLogoModal();
        expect((component as any).isLogoModalOpen).toBe(false);
        (component as any).logoPreview = 'logo';
        (component as any).openLogoModal();
        expect((component as any).isLogoModalOpen).toBe(true);
        (component as any).closeLogoModal();
        expect((component as any).isLogoModalOpen).toBe(false);
    });

    it('navigates back when requested', async () => {
        await createFixture();
        (component as any).goBack();
        expect(location.back).toHaveBeenCalledOnce();
    });

    it('rejects unsupported logo file types', async () => {
        await createFixture();
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', { value: [new File(['x'], 'file.gif', { type: 'image/gif' })] });
        await (component as any).onLogoSelected({ target: input });
        expect((component as any).logoError).toContain('PNG, JPG o WEBP');
        expect((component as any).productForm.controls.logo.value).toBe('');
    });

    it('rejects logos larger than five megabytes', async () => {
        await createFixture();
        const input = document.createElement('input');
        const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
        Object.defineProperty(input, 'files', { value: [oversized] });
        await (component as any).onLogoSelected({ target: input });
        expect((component as any).logoError).toContain('5 MB');
    });

    it('renders the form validation messages for minlength and maxlength', async () => {
        await createFixture();
        const form = (component as any).productForm;
        form.controls.name.setValue('abc');
        form.controls.name.markAsTouched();
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Mínimo 5 caracteres');

        // Use a fresh fixture to test the maxlength branch independently.
        fixture.destroy();
        await createFixture();

        const maxLengthControl = (component as any).productForm.controls.name;
        maxLengthControl.setValue('N'.repeat(101));
        maxLengthControl.markAsTouched();
        maxLengthControl.updateValueAndValidity();
        fixture.detectChanges();

        expect((component as any).getFieldError('name')).toBe('Máximo 100 caracteres');
        expect(fixture.nativeElement.textContent).toContain('Máximo 100 caracteres');
    });

    it('renders the group validation message for an invalid revision date', async () => {
        await createFixture();
        const form = (component as any).productForm;
        form.controls.date_release.setValue('2099-05-10');
        form.controls.date_revision.setValue('2099-05-10');
        form.updateValueAndValidity();
        fixture.detectChanges();

        expect((component as any).getFormError()).toContain('un año posterior');
        expect(fixture.nativeElement.textContent).toContain('un año posterior');
    });

    it('renders and dismisses the error toast from the template', async () => {
        await createFixture();
        (component as any).submitForm();
        fixture.detectChanges();

        const toast = fixture.nativeElement.querySelector('.error-toast') as HTMLElement;
        expect(toast).toBeTruthy();
        expect(toast.textContent).toContain('corrige los errores');

        (toast.querySelector('.toast-close') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect((component as any).errorMessage.value).toBe('');
        expect(fixture.nativeElement.querySelector('.error-toast')).toBeNull();
    });

    it('submits the form through its submit event', async () => {
        await createFixture();
        const form = (component as any).productForm;
        form.controls.id.setValue('new-id');
        form.controls.name.setValue('Producto nuevo');
        form.controls.description.setValue('Descripción válida del producto');
        form.controls.logo.setValue('logo');
        form.controls.date_release.setValue('2099-05-10');
        await new Promise((resolve) => setTimeout(resolve, 350));

        (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        fixture.detectChanges();

        expect(api.createProduct).toHaveBeenCalledOnce();
        expect(fixture.nativeElement.textContent).toContain('Producto agregado correctamente');
    });

    it('opens and closes the logo modal using its template controls', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        fixture.detectChanges();

        const preview = fixture.nativeElement.querySelector('.logo-preview') as HTMLButtonElement;
        expect(preview).toBeTruthy();
        preview.click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();

        (fixture.nativeElement.querySelector('.logo-modal-close') as HTMLButtonElement).click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    });

    it('closes the logo modal when its backdrop is clicked', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.logo-preview') as HTMLButtonElement).click();
        fixture.detectChanges();

        const backdrop = fixture.nativeElement.querySelector('.logo-modal') as HTMLElement;
        expect(backdrop).toBeTruthy();
        backdrop.click();
        fixture.detectChanges();

        expect((component as any).isLogoModalOpen).toBe(false);
    });

    it('does not close the logo modal when the dialog content is clicked', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.logo-preview') as HTMLButtonElement).click();
        fixture.detectChanges();

        const dialogContent = fixture.nativeElement.querySelector('.logo-modal-content') as HTMLElement;
        expect(dialogContent).toBeTruthy();
        dialogContent.click();
        fixture.detectChanges();

        expect((component as any).isLogoModalOpen).toBe(true);
    });

    it('handles a missing file selection without changing the logo', async () => {
        await createFixture();
        (component as any).productForm.controls.logo.setValue('existing-logo');
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', { value: [] });

        await (component as any).onLogoSelected({ target: input });

        expect((component as any).productForm.controls.logo.value).toBe('existing-logo');
    });

    it('sets a processed logo when image compression succeeds', async () => {
        await createFixture();
        vi.spyOn(component as any, 'compressLogo').mockResolvedValue('data:image/jpeg;base64,compressed');
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', {
            value: [new File(['image'], 'logo.png', { type: 'image/png' })],
        });

        await (component as any).onLogoSelected({ target: input });

        expect((component as any).logoPreview).toBe('data:image/jpeg;base64,compressed');
        expect((component as any).productForm.controls.logo.value).toBe('data:image/jpeg;base64,compressed');
        expect((component as any).productForm.controls.logo.dirty).toBe(true);
    });

    it('shows a processing error when image compression fails', async () => {
        await createFixture();
        vi.spyOn(component as any, 'compressLogo').mockRejectedValue(new Error('compression'));
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', {
            value: [new File(['image'], 'logo.png', { type: 'image/png' })],
        });

        await (component as any).onLogoSelected({ target: input });

        expect((component as any).logoError).toContain('No fue posible procesar');
        expect((component as any).productForm.controls.logo.value).toBe('');
    });

    it('clears the preview and form logo when an unsupported file is selected', async () => {
        await createFixture();
        (component as any).logoPreview = 'previous-preview';
        (component as any).productForm.controls.logo.setValue('previous-logo');
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', {
            value: [new File(['image'], 'logo.gif', { type: 'image/gif' })],
        });

        await (component as any).onLogoSelected({ target: input });

        expect((component as any).logoPreview).toBe('');
        expect((component as any).productForm.controls.logo.value).toBe('');
        expect(input.value).toBe('');
    });

    it('shows the fallback message when edit mode has no original product to reset', async () => {
        await createFixture();
        (component as any).isEditMode = true;
        (component as any).resetForm();

        expect((component as any).errorMessage.value).toContain('No se pudieron recuperar');
    });

    it('clears the error message when the reset button is clicked', async () => {
        await createFixture();
        (component as any).errorMessage.value = 'Error previo';
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.reset-button') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect((component as any).errorMessage.value).toBe('');
    });

    it('calls the back navigation from the template button', async () => {
        await createFixture();
        (fixture.nativeElement.querySelector('.back-button') as HTMLButtonElement).click();

        expect(location.back).toHaveBeenCalledOnce();
    });

    it('does not return field errors before a control is touched', async () => {
        await createFixture();
        const name = (component as any).productForm.controls.name;
        name.setValue('');

        expect((component as any).getFieldError('name')).toBe('');
        expect((component as any).isFieldInvalid('name')).toBe(false);
    });

    it('returns an empty form error when the form has no group errors', async () => {
        await createFixture();

        expect((component as any).getFormError()).toBe('');
    });

    it('returns an empty message for an unrecognized field validation error', async () => {
        await createFixture();
        const name = (component as any).productForm.controls.name;
        name.setErrors({ customValidation: true });
        name.markAsTouched();

        expect((component as any).getFieldError('name')).toBe('');
        expect((component as any).isFieldInvalid('name')).toBe(true);
    });

    it('returns an empty message for an unrecognized form validation error', async () => {
        await createFixture();
        (component as any).productForm.setErrors({ customValidation: true });

        expect((component as any).getFormError()).toBe('');
    });

    it('does not submit when the asynchronous ID validation resolves as unavailable', async () => {
        api.verifyProductId.mockReturnValue(of(true));
        await createFixture();
        const form = (component as any).productForm;
        form.controls.id.setValue('taken-id');
        form.controls.name.setValue('Producto válido');
        form.controls.description.setValue('Descripción válida del producto');
        form.controls.logo.setValue('logo');
        form.controls.date_release.setValue('2099-05-10');

        (component as any).submitForm();
        await new Promise((resolve) => setTimeout(resolve, 350));
        await fixture.whenStable();

        expect(api.createProduct).not.toHaveBeenCalled();
        expect(form.controls.id.errors).toEqual({ idTaken: true });
    });

    it('waits for pending ID validation before creating a valid product', async () => {
        await createFixture();
        const form = (component as any).productForm;
        form.controls.id.setValue('new-id');
        form.controls.name.setValue('Producto válido');
        form.controls.description.setValue('Descripción válida del producto');
        form.controls.logo.setValue('logo');
        form.controls.date_release.setValue('2099-05-10');

        (component as any).submitForm();
        await new Promise((resolve) => setTimeout(resolve, 350));
        await fixture.whenStable();

        expect(api.createProduct).toHaveBeenCalledOnce();
    });

    it('does not save when the internal save guard detects an invalid form', async () => {
        await createFixture();

        (component as any).saveProductIfValid();

        expect(api.createProduct).not.toHaveBeenCalled();
    });

    it('does not save when the internal save guard detects an active submission', async () => {
        await createFixture();
        (component as any).isSubmitting.value = true;
        const form = (component as any).productForm;
        form.controls.id.setValue('new-id');
        form.controls.name.setValue('Producto válido');
        form.controls.description.setValue('Descripción válida del producto');
        form.controls.logo.setValue('logo');
        form.controls.date_release.setValue('2099-05-10');

        (component as any).saveProductIfValid();

        expect(api.createProduct).not.toHaveBeenCalled();
    });

    it('clears edit-mode messages and restores the original logo when resetting', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        fixture.detectChanges();

        (component as any).logoError = 'Logo inválido';
        (component as any).successMessage.value = 'Éxito anterior';
        (component as any).errorMessage.value = 'Error anterior';
        (component as any).isLogoModalOpen = true;
        (component as any).productForm.controls.name.setValue('Nombre temporal');

        (component as any).resetForm();

        expect((component as any).logoError).toBe('');
        expect((component as any).successMessage.value).toBe('');
        expect((component as any).errorMessage.value).toBe('');
        expect((component as any).isLogoModalOpen).toBe(false);
        expect((component as any).logoPreview).toBe(product.logo);
        expect((component as any).productForm.controls.name.value).toBe(product.name);
        expect((component as any).productForm.pristine).toBe(true);
        expect((component as any).productForm.untouched).toBe(true);
    });

    it('clears the native logo input when resetting edit mode', async () => {
        await createFixture();
        params.next(convertToParamMap({ id: product.id }));
        await fixture.whenStable();
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        Object.defineProperty(input, 'value', { value: 'selected-file.png', writable: true, configurable: true });

        (component as any).resetForm();

        expect(input.value).toBe('');
    });

    it('clears the native logo input when resetting create mode', async () => {
        await createFixture();
        const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        Object.defineProperty(input, 'value', { value: 'selected-file.png', writable: true, configurable: true });

        (component as any).resetForm();

        expect(input.value).toBe('');
    });

    it('rejects canvas conversion when the browser returns no blob', async () => {
        await createFixture();
        const canvas = {
            toBlob: (callback: (blob: Blob | null) => void) => callback(null),
        };

        await expect((component as any).canvasToBlob(canvas, 0.9)).rejects.toThrow('No fue posible comprimir la imagen.');
    });

    it('converts a blob to a base64 data URL', async () => {
        await createFixture();
        const result = await (component as any).blobToBase64(new Blob(['logo'], { type: 'image/jpeg' }));

        expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('renders a logo processing error in the template', async () => {
        await createFixture();
        vi.spyOn(component as any, 'compressLogo').mockRejectedValue(new Error('compression failed'));

        const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['logo'], 'logo.png', { type: 'image/png' });
        Object.defineProperty(input, 'files', {
            value: [file],
            configurable: true,
        });

        await (component as any).onLogoSelected({ target: input } as unknown as Event);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.field-error')?.textContent).toContain('No fue posible procesar la imagen. Selecciona otra imagen.');
    });

    it('renders a validation error for the revision date when the control is enabled', async () => {
        await createFixture();
        const control = (component as any).productForm.controls.date_revision;
        control.enable();
        control.setErrors({ required: true });
        control.markAsTouched();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Este campo es requerido');
    });

    it('compresses a logo and releases its temporary object URL', async () => {
        await createFixture();
        class MockImage {
            width = 600;
            height = 300;
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;

            set src(_value: string) {
                this.onload?.();
            }
        }
        const context = {
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
        };
        const canvas = {
            width: 0,
            height: 0,
            getContext: vi.fn().mockReturnValue(context),
        };
        const createObjectUrl = vi.fn().mockReturnValue('blob:logo');
        const revokeObjectUrl = vi.fn();
        const originalCreateElement = document.createElement.bind(document);
        vi.stubGlobal('URL', {
            createObjectURL: createObjectUrl,
            revokeObjectURL: revokeObjectUrl,
        });
        vi.stubGlobal('Image', MockImage);
        vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
            if (tagName === 'canvas') {
                return canvas as unknown as HTMLCanvasElement;
            }

            return originalCreateElement(tagName, options);
        }) as typeof document.createElement);
        vi.spyOn(component as any, 'canvasToBlob').mockResolvedValue(new Blob(['small']));
        vi.spyOn(component as any, 'blobToBase64').mockResolvedValue('data:image/jpeg;base64,logo');

        const result = await (component as any).compressLogo(new File(['image'], 'logo.png', { type: 'image/png' }));

        expect(result).toBe('data:image/jpeg;base64,logo');
        expect(canvas.width).toBe(300);
        expect(canvas.height).toBe(150);
        expect(context.fillRect).toHaveBeenCalledOnce();
        expect(context.drawImage).toHaveBeenCalledOnce();
        expect(createObjectUrl).toHaveBeenCalledOnce();
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:logo');

        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('shows the ID verification label while asynchronous validation is pending', async () => {
        await createFixture();
        (component as any).productForm.controls.id.setValue('pending-id');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.submit-button')?.textContent).toContain('Verificando ID...');

        await new Promise((resolve) => setTimeout(resolve, 350));
    });

    it('rejects blob conversion when FileReader returns a non-string result', async () => {
        await createFixture();

        vi.stubGlobal(
            'FileReader',
            class {
                result: string | ArrayBuffer | null = new ArrayBuffer(0);
                onload: ((event: ProgressEvent) => void) | null = null;
                onerror: ((event: ProgressEvent) => void) | null = null;

                readAsDataURL() {
                    this.onload?.(new ProgressEvent('load'));
                }
            },
        );

        try {
            await expect((component as any).blobToBase64(new Blob(['logo']))).rejects.toThrow('No fue posible convertir la imagen.');
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('rejects blob conversion when FileReader reports an error', async () => {
        await createFixture();

        vi.stubGlobal(
            'FileReader',
            class {
                result: string | ArrayBuffer | null = null;
                onload: ((event: ProgressEvent) => void) | null = null;
                onerror: ((event: ProgressEvent) => void) | null = null;

                readAsDataURL() {
                    this.onerror?.(new ProgressEvent('error'));
                }
            },
        );

        try {
            await expect((component as any).blobToBase64(new Blob(['logo']))).rejects.toThrow('No fue posible leer la imagen.');
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
