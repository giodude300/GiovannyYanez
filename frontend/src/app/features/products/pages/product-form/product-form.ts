import { Component, DestroyRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, finalize, map, Observable, of, switchMap, take, timer } from 'rxjs';
import { Location } from '@angular/common';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { dateNotInPastValidator, dateRevisionValidator } from './product-form.validators';

@Component({
    selector: 'app-product-form',
    standalone: true,
    templateUrl: './product-form.html',
    styleUrl: './product-form.css',
    imports: [ReactiveFormsModule],
})
export class ProductFormComponent {
    private readonly formBuilder = inject(FormBuilder);
    private readonly productService = inject(ProductService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly location = inject(Location);
    private readonly maxLogoSize = 5 * 1024 * 1024;
    private readonly maxProcessedLogoSize = 90 * 1024;
    private readonly maxLogoDimension = 300;

    protected readonly isSubmitting = { value: false };
    protected readonly successMessage = { value: '' };
    protected readonly errorMessage = { value: '' };
    protected logoPreview = '';
    protected logoError = '';

    protected readonly productForm = this.formBuilder.group(
        {
            id: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)], [this.validateProductId.bind(this)]],
            name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
            logo: ['', Validators.required],
            date_release: ['', [Validators.required, dateNotInPastValidator()]],
            date_revision: [{ value: '', disabled: true }, Validators.required],
        },
        {
            validators: [dateRevisionValidator()],
        },
    );

    private readonly fieldErrorMessages: Record<string, (error: ValidationErrors[string]) => string> = {
        required: () => 'Este campo es requerido',
        minlength: (error) => `Mínimo ${error['requiredLength']} caracteres`,
        maxlength: (error) => `Máximo ${error['requiredLength']} caracteres`,
        dateInPast: () => 'La fecha debe ser igual o posterior a la fecha actual',
        idTaken: () => 'ID no válido',
        idVerificationFailed: () => 'No fue posible verificar el ID. Intenta nuevamente',
    };

    private readonly formErrorMessages: Record<string, string> = {
        invalidRevisionDate: 'La fecha de revisión debe ser un año posterior a la fecha de liberación.',
    };

    constructor() {
        this.productForm.controls.date_release.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((date) => {
            this.updateRevisionDate(date);
        });
    }

    private validateProductId(control: AbstractControl): Observable<ValidationErrors | null> {
        const id = String(control.value ?? '').trim();
        if (!id || id.length < 3 || id.length > 10) {
            return of(null);
        }
        return timer(300).pipe(
            switchMap(() => this.productService.verifyProductId(id)),
            map((exists) => (exists ? { idTaken: true } : null)),
            catchError(() => of({ idVerificationFailed: true })),
        );
    }

    private updateRevisionDate(date: string | null): void {
        if (!date) {
            this.productForm.controls.date_revision.setValue('', {
                emitEvent: false,
            });
            return;
        }

        const revisionDate = new Date(`${date}T00:00:00`);
        revisionDate.setFullYear(revisionDate.getFullYear() + 1);
        const formattedDate = [revisionDate.getFullYear(), String(revisionDate.getMonth() + 1).padStart(2, '0'), String(revisionDate.getDate()).padStart(2, '0')].join('-');
        this.productForm.controls.date_revision.setValue(formattedDate, {
            emitEvent: false,
        });
        this.productForm.updateValueAndValidity();
    }

    protected async onLogoSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }
        this.logoError = '';
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.logoPreview = '';
            this.productForm.controls.logo.setValue('');
            this.logoError = 'Selecciona una imagen PNG, JPG o WEBP.';
            this.productForm.controls.logo.markAsTouched();
            input.value = '';
            return;
        }
        if (file.size > this.maxLogoSize) {
            this.logoPreview = '';
            this.productForm.controls.logo.setValue('');
            this.logoError = 'La imagen no puede superar los 5 MB.';
            this.productForm.controls.logo.markAsTouched();
            input.value = '';
            return;
        }
        try {
            const processedLogo = await this.compressLogo(file);
            this.logoPreview = processedLogo;
            this.productForm.controls.logo.setValue(processedLogo);
            this.productForm.controls.logo.markAsTouched();
            this.productForm.controls.logo.markAsDirty();
        } catch {
            this.logoPreview = '';
            this.productForm.controls.logo.setValue('');
            this.productForm.controls.logo.markAsTouched();
            this.logoError = 'No fue posible procesar la imagen. Selecciona otra imagen.';
        }
        input.value = '';
    }

    private async compressLogo(file: File): Promise<string> {
        const imageUrl = URL.createObjectURL(file);
        try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                const element = new Image();
                element.onload = () => resolve(element);
                element.onerror = () => reject(new Error('No fue posible cargar la imagen.'));
                element.src = imageUrl;
            });

            const scale = Math.min(this.maxLogoDimension / image.width, this.maxLogoDimension / image.height, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('No fue posible procesar la imagen.');
            }
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            let quality = 0.9;
            let blob = await this.canvasToBlob(canvas, quality);
            while (blob.size > this.maxProcessedLogoSize && quality > 0.1) {
                quality = Math.max(0.1, quality - 0.1);
                blob = await this.canvasToBlob(canvas, quality);
            }
            if (blob.size > this.maxProcessedLogoSize) {
                throw new Error('La imagen supera el tamaño permitido después de comprimirla.');
            }
            return await this.blobToBase64(blob);
        } finally {
            URL.revokeObjectURL(imageUrl);
        }
    }

    private canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('No fue posible comprimir la imagen.'));
                        return;
                    }
                    resolve(blob);
                },
                'image/jpeg',
                quality,
            );
        });
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                    return;
                }
                reject(new Error('No fue posible convertir la imagen.'));
            };
            reader.onerror = () => reject(new Error('No fue posible leer la imagen.'));
            reader.readAsDataURL(blob);
        });
    }

    protected getFieldError(fieldName: string): string {
        const control = this.productForm.get(fieldName);
        if (!control || !control.touched || !control.errors) {
            return '';
        }
        const firstError = Object.keys(control.errors)[0];
        return this.fieldErrorMessages[firstError]?.(control.errors[firstError]) ?? '';
    }

    protected getFormError(): string {
        const firstError = Object.keys(this.productForm.errors ?? {})[0];
        return this.formErrorMessages[firstError] ?? '';
    }

    protected isFieldInvalid(fieldName: string): boolean {
        const control = this.productForm.get(fieldName);
        return !!control && control.invalid && control.touched;
    }

    protected submitForm(): void {
        this.successMessage.value = '';
        this.errorMessage.value = '';
        this.productForm.markAllAsTouched();
        if (this.productForm.invalid && !this.productForm.pending) {
            this.errorMessage.value = 'Por favor, corrige los errores del formulario antes de continuar.';
            return;
        }
        if (this.isSubmitting.value) {
            return;
        }
        if (this.productForm.pending) {
            this.productForm.statusChanges
                .pipe(
                    filter((status) => status !== 'PENDING'),
                    take(1),
                    takeUntilDestroyed(this.destroyRef),
                )
                .subscribe(() => {
                    this.createProductIfValid();
                });
            return;
        }
        this.createProductIfValid();
    }

    protected goBack(): void {
        this.location.back();
    }

    private createProductIfValid(): void {
        if (this.isSubmitting.value || this.productForm.invalid || this.productForm.pending) {
            return;
        }
        this.isSubmitting.value = true;
        const product = this.productForm.getRawValue() as Product;
        this.productService
            .createProduct(product)
            .pipe(
                finalize(() => {
                    this.isSubmitting.value = false;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.successMessage.value = 'Producto agregado correctamente';

                    timer(1200)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe(() => {
                            this.router.navigate(['/']);
                        });
                },
                error: () => {
                    this.errorMessage.value = 'No fue posible registrar el producto. Intenta nuevamente.';
                },
            });
    }

    protected resetForm(): void {
        this.productForm.reset({
            id: '',
            name: '',
            description: '',
            logo: '',
            date_release: '',
            date_revision: '',
        });
        this.logoPreview = '';
        this.logoError = '';
        this.successMessage.value = '';
        this.errorMessage.value = '';
    }
}
