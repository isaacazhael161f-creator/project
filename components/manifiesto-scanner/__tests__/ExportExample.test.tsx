/**
 * Tests for ExportExample component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ExportExample } from '../ExportExample';
import { StoredManifiesto, ManifiestoData } from '../../../types/manifiesto';

// Mock the export utilities
jest.mock('../../../utils/manifiesto/export', () => ({
  exportManifiestos: jest.fn().mockResolvedValue(undefined),
  createDefaultExportOptions: jest.fn().mockReturnValue({
    format: 'csv',
    includeMetadata: true,
    csvOptions: {
      delimiter: ',',
      includeHeaders: true,
      dateFormat: 'ISO',
      numberFormat: 'decimal'
    }
  }),
  validateExportOptions: jest.fn().mockReturnValue([]),
  getAvailableCSVFields: jest.fn().mockReturnValue([
    { key: 'fecha', label: 'Fecha' },
    { key: 'folio', label: 'Folio' }
  ])
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn()
    }
  };
});

// Mock data
const mockManifiestoData: ManifiestoData = {
  fecha: '2024-01-15',
  folio: 'MAN-001',
  aeropuertoSalida: 'SCL',
  tipoVuelo: 'Internacional',
  transportista: 'LATAM Airlines',
  equipo: 'B787',
  matricula: 'CC-BGG',
  numeroVuelo: 'LA800',
  pilotoAlMando: 'Juan Pérez',
  numeroLicencia: 'PIL-12345',
  tripulacion: 8,
  origenVuelo: 'SCL',
  proximaEscala: 'LIM',
  destinoVuelo: 'MIA',
  horaSlotAsignado: '14:30',
  horaSlotCoordinado: '14:35',
  horaTerminoPernocta: '13:00',
  horaInicioManiobras: '13:30',
  horaSalidaPosicion: '14:40',
  causaDemora: 'Condiciones meteorológicas',
  codigoCausa: 'WX01',
  pasajeros: {
    nacional: 50,
    internacional: 25,
    diplomaticos: 2,
    enComision: 1,
    infantes: 5,
    transitos: 10,
    conexiones: 8,
    otrosExentos: 3,
    total: 104
  },
  carga: {
    equipaje: 2500,
    carga: 1200,
    correo: 50,
    total: 3750
  },
  imagenOriginal: 'data:image/jpeg;base64,mock-image-data',
  fechaProcesamiento: new Date('2024-01-15T10:30:00Z'),
  editado: true
};

const mockStoredManifiesto: StoredManifiesto = {
  id: 'test-id-1',
  data: mockManifiestoData,
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:35:00Z')
};

describe('ExportExample', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with manifiestos count', () => {
    const { getByText } = render(
      <ExportExample manifiestos={[mockStoredManifiesto]} />
    );

    expect(getByText('Exportar Manifiestos')).toBeTruthy();
    expect(getByText('1 manifiestos disponibles para exportar')).toBeTruthy();
  });

  it('should render empty state when no manifiestos', () => {
    const { getByText } = render(<ExportExample manifiestos={[]} />);

    expect(getByText('No hay manifiestos para exportar')).toBeTruthy();
  });

  it('should render basic UI elements', () => {
    const { getByText } = render(
      <ExportExample manifiestos={[mockStoredManifiesto]} />
    );

    expect(getByText('Exportar Manifiestos')).toBeTruthy();
    expect(getByText('1 manifiestos disponibles para exportar')).toBeTruthy();
    expect(getByText('Exportar CSV')).toBeTruthy();
    expect(getByText('Exportar JSON')).toBeTruthy();
    expect(getByText('CSV Personalizado')).toBeTruthy();
    expect(getByText('Ver Campos')).toBeTruthy();
  });
});