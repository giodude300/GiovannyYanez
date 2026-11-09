import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateNotInPastValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(`${control.value}T00:00:00`);
        return selectedDate >= today ? null : { dateInPast: true };
    };
}

export function dateRevisionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const releaseDate = control.get('date_release')?.value;
        const revisionDate = control.get('date_revision')?.value;
        if (!releaseDate || !revisionDate) {
            return null;
        }
        const expectedDate = new Date(`${releaseDate}T00:00:00`);
        expectedDate.setFullYear(expectedDate.getFullYear() + 1);
        const expectedValue = [expectedDate.getFullYear(), String(expectedDate.getMonth() + 1).padStart(2, '0'), String(expectedDate.getDate()).padStart(2, '0')].join('-');
        return revisionDate === expectedValue ? null : { invalidRevisionDate: true };
    };
}
