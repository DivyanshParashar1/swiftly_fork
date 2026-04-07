import type { RefForHtmlFields } from '@/types/refForHtmlFields.types';

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, '');

const setNativeTextValue = (
	element: HTMLInputElement | HTMLTextAreaElement,
	nextValue: string,
): void => {
	const prototype = element instanceof HTMLInputElement
		? HTMLInputElement.prototype
		: HTMLTextAreaElement.prototype;

	const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
	if (descriptor?.set) {
		descriptor.set.call(element, nextValue);
	} else {
		element.value = nextValue;
	}
};

const setElementValue = (element: HTMLElement, value: unknown): void => {
	if (element instanceof HTMLInputElement) {
		if (element.disabled || element.readOnly) return;
		if (element.type === 'file') return;

		if (element.type === 'checkbox' || element.type === 'radio') {
			if (typeof value === 'boolean') {
				element.checked = value;
			} else {
				const normalized = String(value).toLowerCase();
				element.checked = normalized === 'true' || normalized === 'yes' || normalized === '1';
			}
			element.dispatchEvent(new Event('change', { bubbles: true }));
			return;
		}

		setNativeTextValue(element, String(value));
		element.dispatchEvent(new Event('input', { bubbles: true }));
		element.dispatchEvent(new Event('change', { bubbles: true }));
		return;
	}

	if (element instanceof HTMLTextAreaElement) {
		if (element.disabled || element.readOnly) return;
		setNativeTextValue(element, String(value));
		element.dispatchEvent(new Event('input', { bubbles: true }));
		element.dispatchEvent(new Event('change', { bubbles: true }));
		return;
	}

	if (element instanceof HTMLSelectElement) {
		if (element.disabled) return;
		const desiredValue = String(value).trim().toLowerCase();
		const byOptionText = Array.from(element.options).find(
			(option) => option.text.trim().toLowerCase() === desiredValue,
		);

		element.value = byOptionText ? byOptionText.value : String(value);
		element.dispatchEvent(new Event('change', { bubbles: true }));
	}
};

export function autofillJobApplicationForm(fieldRefs: RefForHtmlFields[], response: Record<string, unknown>): void {
	const normalizedResponse = new Map<string, unknown>();
	Object.entries(response).forEach(([key, value]) => {
		normalizedResponse.set(normalizeKey(key), value);
	});

	let filledCount = 0;
	let skippedCount = 0;

	fieldRefs.forEach((field) => {
		const value = response[field.key] ?? normalizedResponse.get(normalizeKey(field.key));
		if (value === null || value === undefined) {
			skippedCount += 1;
			return;
		}

		if (value === 'RESUME_FILE') {
			skippedCount += 1;
			return;
		}

		const normalizedValue = Array.isArray(value) ? value.join(', ') : value;
		try {
			setElementValue(field.element, normalizedValue);
			filledCount += 1;
		} catch (error) {
			skippedCount += 1;
			console.warn('Autofill skipped field due to set error:', field.key, error);
		}
	});

	console.log('Autofill applied fields:', filledCount, 'skipped:', skippedCount, 'total:', fieldRefs.length);
}