import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { dateNotInPastValidator, dateRevisionValidator } from './product-form.validators';

describe('dateNotInPastValidator', () => {
    const validator = dateNotInPastValidator();

    it('accepts an empty value and leaves required validation to Validators.required', () => {
        expect(validator(new FormControl(''))).toBeNull();
    });

    it('rejects a date before today', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const value = [yesterday.getFullYear(), String(yesterday.getMonth() + 1).padStart(2, '0'), String(yesterday.getDate()).padStart(2, '0')].join('-');

        expect(validator(new FormControl(value))).toEqual({ dateInPast: true });
    });

    it('accepts today', () => {
        const today = new Date();
        const value = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');

        expect(validator(new FormControl(value))).toBeNull();
    });

    it('accepts a future date', () => {
        expect(validator(new FormControl('2099-12-31'))).toBeNull();
    });
});

describe('dateRevisionValidator', () => {
    const validate = (release: string, revision: string) =>
        dateRevisionValidator()(
            new FormGroup({
                date_release: new FormControl(release),
                date_revision: new FormControl(revision),
            }),
        );

    it('does not validate until both dates exist', () => {
        expect(validate('', '')).toBeNull();
        expect(validate('2026-01-10', '')).toBeNull();
        expect(validate('', '2027-01-10')).toBeNull();
    });

    it('accepts a revision date exactly one year after release', () => {
        expect(validate('2026-05-10', '2027-05-10')).toBeNull();
    });

    it('rejects a revision date earlier than one year', () => {
        expect(validate('2026-05-10', '2027-05-09')).toEqual({ invalidRevisionDate: true });
    });

    it('rejects a revision date later than one year', () => {
        expect(validate('2026-05-10', '2027-05-11')).toEqual({ invalidRevisionDate: true });
    });

    it('handles leap-year date arithmetic consistently with JavaScript Date', () => {
        const result = validate('2024-02-29', '2025-03-01');
        expect(result).toBeNull();
    });
});
