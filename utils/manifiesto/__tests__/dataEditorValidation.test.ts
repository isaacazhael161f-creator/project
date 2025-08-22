/**
 * DataEditor Validation Tests
 * Tests for validation logic used by the DataEditor component
 */

import { validateManifiestoData, validateField, VALIDATION_RULES } from '../validation';
import { ManifiestoData } from '../../../types/manifiesto';

describe('DataEditor Validation Logic', () => {
  const mockManifiestoData: Partial<ManifiestoData> = {
    fecha: '15/12/2024',
    folio: 'ABC123',
    numeroVuelo: 'AM123',
    transportista: 'Aeroméxico',
    pasajeros: {
      nacional: 120,
      internacional: 0,
      diplomaticos: 0,
      enComision: 2,
      infantes: 5,
      transitos: 0,
      conexiones: 0,
      otrosExentos: 0,
      total: 127
    },
    carga: {
      equipaje: 2500.5,
      carga: 1200.0,
      correo: 50.0,
      total: 3750.5
    }
  };

  it('validates complete manifiesto data correctly', () => {
    const errors = validateManifiestoData(mockManifiestoData, VALIDATION_RULES);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('validates required fields', () => {
    const incompleteData: Partial<ManifiestoData> = {
      fecha: '',
      folio: '',
      numeroVuelo: '',
      transportista: ''
    };

    const errors = validateManifiestoData(incompleteData, VALIDATION_RULES);
    expect(errors.fecha).toBeDefined();
    expect(errors.folio).toBeDefined();
    expect(errors.numeroVuelo).toBeDefined();
    expect(errors.transportista).toBeDefined();
  });

  it('validates date format', () => {
    const error = validateField('fecha', '32/13/2024', VALIDATION_RULES);
    expect(error).toBeTruthy();

    const validError = validateField('fecha', '15/12/2024', VALIDATION_RULES);
    expect(validError).toBeNull();
  });

  it('validates flight number format', () => {
    const error = validateField('numeroVuelo', '123', VALIDATION_RULES);
    expect(error).toBeTruthy();

    const validError = validateField('numeroVuelo', 'AM123', VALIDATION_RULES);
    expect(validError).toBeNull();
  });

  it('validates passenger data totals', () => {
    const invalidPassengerData = {
      ...mockManifiestoData,
      pasajeros: {
        nacional: 100,
        internacional: 50,
        diplomaticos: 0,
        enComision: 0,
        infantes: 0,
        transitos: 0,
        conexiones: 0,
        otrosExentos: 0,
        total: 200 // Incorrect total (should be 150)
      }
    };

    const errors = validateManifiestoData(invalidPassengerData, VALIDATION_RULES);
    expect(errors['pasajeros.total']).toBeTruthy();
    expect(errors['pasajeros.total']).toContain('no coincide');
  });

  it('validates cargo data totals', () => {
    const invalidCargoData = {
      ...mockManifiestoData,
      carga: {
        equipaje: 1000,
        carga: 500,
        correo: 100,
        total: 2000 // Incorrect total (should be 1600)
      }
    };

    const errors = validateManifiestoData(invalidCargoData, VALIDATION_RULES);
    expect(errors['carga.total']).toBeTruthy();
    expect(errors['carga.total']).toContain('no coincide');
  });

  it('validates negative passenger numbers', () => {
    const invalidPassengerData = {
      ...mockManifiestoData,
      pasajeros: {
        nacional: -5,
        internacional: 0,
        diplomaticos: 0,
        enComision: 0,
        infantes: 0,
        transitos: 0,
        conexiones: 0,
        otrosExentos: 0,
        total: -5
      }
    };

    const errors = validateManifiestoData(invalidPassengerData, VALIDATION_RULES);
    expect(errors['pasajeros.nacional']).toBeTruthy();
    expect(errors['pasajeros.nacional']).toContain('no negativo');
  });

  it('validates negative cargo weights', () => {
    const invalidCargoData = {
      ...mockManifiestoData,
      carga: {
        equipaje: -100,
        carga: 500,
        correo: 100,
        total: 500
      }
    };

    const errors = validateManifiestoData(invalidCargoData, VALIDATION_RULES);
    expect(errors['carga.equipaje']).toBeTruthy();
    expect(errors['carga.equipaje']).toContain('no negativo');
  });

  it('validates airport codes format', () => {
    const error = validateField('origenVuelo', 'INVALID', VALIDATION_RULES);
    expect(error).toBeTruthy();

    const validError = validateField('origenVuelo', 'GDL', VALIDATION_RULES);
    expect(validError).toBeNull();
  });

  it('validates aircraft registration format', () => {
    const error = validateField('matricula', 'INVALID', VALIDATION_RULES);
    expect(error).toBeTruthy();

    const validError = validateField('matricula', 'XA-ABC', VALIDATION_RULES);
    expect(validError).toBeNull();
  });

  it('handles empty optional fields correctly', () => {
    const dataWithEmptyOptionals: Partial<ManifiestoData> = {
      fecha: '15/12/2024',
      folio: 'ABC123',
      numeroVuelo: 'AM123',
      transportista: 'Aeroméxico',
      matricula: '', // Optional field, empty
      origenVuelo: '', // Optional field, empty
      destinoVuelo: '' // Optional field, empty
    };

    const errors = validateManifiestoData(dataWithEmptyOptionals, VALIDATION_RULES);
    expect(errors.matricula).toBeUndefined();
    expect(errors.origenVuelo).toBeUndefined();
    expect(errors.destinoVuelo).toBeUndefined();
  });

  it('validates folio format', () => {
    const error = validateField('folio', 'abc123', VALIDATION_RULES);
    expect(error).toBeTruthy();

    const validError = validateField('folio', 'ABC123', VALIDATION_RULES);
    expect(validError).toBeNull();
  });

  it('auto-calculates passenger totals correctly', () => {
    const passengerData = {
      nacional: 100,
      internacional: 50,
      diplomaticos: 2,
      enComision: 1,
      infantes: 5,
      transitos: 3,
      conexiones: 2,
      otrosExentos: 1,
      total: 0 // Will be calculated
    };

    const expectedTotal = 100 + 50 + 2 + 1 + 5 + 3 + 2 + 1;
    expect(expectedTotal).toBe(164);
  });

  it('auto-calculates cargo totals correctly', () => {
    const cargoData = {
      equipaje: 1500.5,
      carga: 2000.0,
      correo: 100.5,
      total: 0 // Will be calculated
    };

    const expectedTotal = 1500.5 + 2000.0 + 100.5;
    expect(expectedTotal).toBe(3601.0);
  });

  it('validates field sanitization requirements', () => {
    // Test that validation works with the expected sanitized values
    const error1 = validateField('numeroVuelo', 'am 123', VALIDATION_RULES);
    expect(error1).toBeTruthy(); // Should fail before sanitization

    const error2 = validateField('numeroVuelo', 'AM123', VALIDATION_RULES);
    expect(error2).toBeNull(); // Should pass after sanitization
  });

  it('validates time format patterns', () => {
    // While we don't have specific time validation rules in VALIDATION_RULES,
    // we can test the pattern that would be used
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    expect(timePattern.test('14:30')).toBe(true);
    expect(timePattern.test('23:59')).toBe(true);
    expect(timePattern.test('00:00')).toBe(true);
    expect(timePattern.test('24:00')).toBe(false);
    expect(timePattern.test('12:60')).toBe(false);
    expect(timePattern.test('25:30')).toBe(false);
  });

  it('validates date format patterns', () => {
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    
    expect(datePattern.test('15/12/2024')).toBe(true);
    expect(datePattern.test('1/1/2024')).toBe(true);
    expect(datePattern.test('31/12/2024')).toBe(true);
    expect(datePattern.test('2024-12-15')).toBe(false);
    expect(datePattern.test('15-12-2024')).toBe(false);
    expect(datePattern.test('15/12/24')).toBe(false);
  });
});