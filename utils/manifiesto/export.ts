/**
 * Export utilities for manifiesto data
 * Handles CSV and JSON export functionality
 */

import { ManifiestoData, StoredManifiesto, ExportFormat, ExportOptions, CSVExportOptions } from '../../types/manifiesto';

// Version for export metadata
const EXPORT_VERSION = '1.0.0';

/**
 * Export manifiestos to specified format
 */
export const exportManifiestos = async (
  manifiestos: StoredManifiesto[],
  options: ExportOptions
): Promise<void> => {
  const filteredData = filterManifiestosByDate(manifiestos, options.dateRange);
  
  switch (options.format) {
    case ExportFormat.CSV:
      await exportToCSV(filteredData, options.includeMetadata, options.csvOptions);
      break;
    case ExportFormat.JSON:
      await exportToJSON(filteredData, options.includeMetadata);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

/**
 * Export data to CSV format with custom options
 */
const exportToCSV = async (
  manifiestos: StoredManifiesto[], 
  includeMetadata: boolean,
  csvOptions?: CSVExportOptions
): Promise<void> => {
  const options = {
    delimiter: ',',
    includeHeaders: true,
    dateFormat: 'ISO' as const,
    numberFormat: 'decimal' as const,
    ...csvOptions
  };

  // Define all available fields with their headers
  const allFields = {
    fecha: 'Fecha',
    folio: 'Folio',
    aeropuertoSalida: 'Aeropuerto Salida',
    tipoVuelo: 'Tipo Vuelo',
    transportista: 'Transportista',
    equipo: 'Equipo',
    matricula: 'Matrícula',
    numeroVuelo: 'Número Vuelo',
    pilotoAlMando: 'Piloto al Mando',
    numeroLicencia: 'Número Licencia',
    tripulacion: 'Tripulación',
    origenVuelo: 'Origen Vuelo',
    proximaEscala: 'Próxima Escala',
    destinoVuelo: 'Destino Vuelo',
    horaSlotAsignado: 'Hora Slot Asignado',
    horaSlotCoordinado: 'Hora Slot Coordinado',
    horaTerminoPernocta: 'Hora Término Pernocta',
    horaInicioManiobras: 'Hora Inicio Maniobras',
    horaSalidaPosicion: 'Hora Salida Posición',
    causaDemora: 'Causa Demora',
    codigoCausa: 'Código Causa',
    pasajerosNacional: 'Pasajeros Nacional',
    pasajerosInternacional: 'Pasajeros Internacional',
    pasajerosDiplomaticos: 'Pasajeros Diplomáticos',
    pasajerosEnComision: 'Pasajeros En Comisión',
    pasajerosInfantes: 'Pasajeros Infantes',
    pasajerosTransitos: 'Pasajeros Tránsitos',
    pasajerosConexiones: 'Pasajeros Conexiones',
    pasajerosOtrosExentos: 'Pasajeros Otros Exentos',
    totalPasajeros: 'Total Pasajeros',
    equipaje: 'Equipaje (kg)',
    carga: 'Carga (kg)',
    correo: 'Correo (kg)',
    totalCarga: 'Total Carga (kg)'
  };

  // Determine which fields to include
  let fieldsToInclude = Object.keys(allFields);
  
  if (options.customFields && options.customFields.length > 0) {
    fieldsToInclude = options.customFields.filter(field => field in allFields);
  }
  
  if (options.excludeFields && options.excludeFields.length > 0) {
    fieldsToInclude = fieldsToInclude.filter(field => !options.excludeFields!.includes(field));
  }

  // Build headers
  const headers = fieldsToInclude.map(field => allFields[field as keyof typeof allFields]);
  
  if (includeMetadata) {
    headers.push('Fecha Procesamiento', 'Editado', 'ID', 'Versión Exportación');
  }

  // Build rows
  const rows = manifiestos.map(stored => {
    const data = stored.data;
    const row = fieldsToInclude.map(field => {
      return formatFieldValue(data, field, options);
    });
    
    if (includeMetadata) {
      row.push(
        formatDate(data.fechaProcesamiento, options.dateFormat),
        data.editado?.toString() || 'false',
        stored.id,
        EXPORT_VERSION
      );
    }
    
    return row;
  });

  // Generate CSV content
  let csvContent = '';
  
  if (options.includeHeaders) {
    csvContent += headers.map(header => escapeCSVField(header, options.delimiter)).join(options.delimiter) + '\n';
  }
  
  csvContent += rows
    .map(row => row.map(field => escapeCSVField(field, options.delimiter)).join(options.delimiter))
    .join('\n');

  const filename = generateExportFilename(ExportFormat.CSV);
  await downloadFile(csvContent, filename, 'text/csv');
};

/**
 * Format field value according to options
 */
const formatFieldValue = (data: ManifiestoData, field: string, options: any): string => {
  let value: any;
  
  switch (field) {
    case 'fecha':
      return formatDate(data.fecha, options.dateFormat);
    case 'folio':
      return data.folio || '';
    case 'aeropuertoSalida':
      return data.aeropuertoSalida || '';
    case 'tipoVuelo':
      return data.tipoVuelo || '';
    case 'transportista':
      return data.transportista || '';
    case 'equipo':
      return data.equipo || '';
    case 'matricula':
      return data.matricula || '';
    case 'numeroVuelo':
      return data.numeroVuelo || '';
    case 'pilotoAlMando':
      return data.pilotoAlMando || '';
    case 'numeroLicencia':
      return data.numeroLicencia || '';
    case 'tripulacion':
      return formatNumber(data.tripulacion, options.numberFormat);
    case 'origenVuelo':
      return data.origenVuelo || '';
    case 'proximaEscala':
      return data.proximaEscala || '';
    case 'destinoVuelo':
      return data.destinoVuelo || '';
    case 'horaSlotAsignado':
      return data.horaSlotAsignado || '';
    case 'horaSlotCoordinado':
      return data.horaSlotCoordinado || '';
    case 'horaTerminoPernocta':
      return data.horaTerminoPernocta || '';
    case 'horaInicioManiobras':
      return data.horaInicioManiobras || '';
    case 'horaSalidaPosicion':
      return data.horaSalidaPosicion || '';
    case 'causaDemora':
      return data.causaDemora || '';
    case 'codigoCausa':
      return data.codigoCausa || '';
    case 'pasajerosNacional':
      return formatNumber(data.pasajeros?.nacional, options.numberFormat);
    case 'pasajerosInternacional':
      return formatNumber(data.pasajeros?.internacional, options.numberFormat);
    case 'pasajerosDiplomaticos':
      return formatNumber(data.pasajeros?.diplomaticos, options.numberFormat);
    case 'pasajerosEnComision':
      return formatNumber(data.pasajeros?.enComision, options.numberFormat);
    case 'pasajerosInfantes':
      return formatNumber(data.pasajeros?.infantes, options.numberFormat);
    case 'pasajerosTransitos':
      return formatNumber(data.pasajeros?.transitos, options.numberFormat);
    case 'pasajerosConexiones':
      return formatNumber(data.pasajeros?.conexiones, options.numberFormat);
    case 'pasajerosOtrosExentos':
      return formatNumber(data.pasajeros?.otrosExentos, options.numberFormat);
    case 'totalPasajeros':
      return formatNumber(data.pasajeros?.total, options.numberFormat);
    case 'equipaje':
      return formatNumber(data.carga?.equipaje, options.numberFormat);
    case 'carga':
      return formatNumber(data.carga?.carga, options.numberFormat);
    case 'correo':
      return formatNumber(data.carga?.correo, options.numberFormat);
    case 'totalCarga':
      return formatNumber(data.carga?.total, options.numberFormat);
    default:
      return '';
  }
};

/**
 * Format date according to specified format
 */
const formatDate = (date: string | Date | undefined, format: 'ISO' | 'DD/MM/YYYY' | 'MM/DD/YYYY'): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  switch (format) {
    case 'DD/MM/YYYY':
      return dateObj.toLocaleDateString('es-ES');
    case 'MM/DD/YYYY':
      return dateObj.toLocaleDateString('en-US');
    case 'ISO':
    default:
      return dateObj.toISOString().split('T')[0];
  }
};

/**
 * Format number according to specified format
 */
const formatNumber = (value: number | undefined, format: 'decimal' | 'integer'): string => {
  if (value === undefined || value === null) return '0';
  
  switch (format) {
    case 'integer':
      return Math.round(value).toString();
    case 'decimal':
    default:
      return value.toString();
  }
};

/**
 * Escape CSV field value
 */
const escapeCSVField = (value: string, delimiter: string): string => {
  if (!value) return '';
  
  // If the value contains the delimiter, quotes, or newlines, wrap in quotes
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
};

/**
 * Export data to JSON format
 */
const exportToJSON = async (manifiestos: StoredManifiesto[], includeMetadata: boolean): Promise<void> => {
  const exportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    totalRecords: manifiestos.length,
    manifiestos: manifiestos.map(stored => {
      const result: any = { ...stored.data };
      
      if (includeMetadata) {
        result._metadata = {
          id: stored.id,
          createdAt: stored.createdAt,
          updatedAt: stored.updatedAt,
          exportVersion: EXPORT_VERSION
        };
      }
      
      // Remove base64 image data if not including metadata to reduce file size
      if (!includeMetadata) {
        delete result.imagenOriginal;
      }
      
      return result;
    })
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  const filename = generateExportFilename(ExportFormat.JSON);
  await downloadFile(jsonContent, filename, 'application/json');
};

/**
 * Filter manifiestos by date range
 */
const filterManifiestosByDate = (
  manifiestos: StoredManifiesto[],
  dateRange?: { start: Date; end: Date }
): StoredManifiesto[] => {
  if (!dateRange) return manifiestos;
  
  return manifiestos.filter(manifiesto => {
    const createdAt = new Date(manifiesto.createdAt);
    return createdAt >= dateRange.start && createdAt <= dateRange.end;
  });
};

/**
 * Download file to user's device with enhanced error handling
 */
const downloadFile = async (content: string, filename: string, mimeType: string): Promise<void> => {
  try {
    // Add BOM for CSV files to ensure proper encoding in Excel
    const bom = mimeType === 'text/csv' ? '\uFEFF' : '';
    const blob = new Blob([bom + content], { type: `${mimeType};charset=utf-8` });
    
    // Check if the browser supports the download attribute
    if ('download' in document.createElement('a')) {
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      // Fallback for older browsers
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        throw new Error('No se pudo abrir la ventana de descarga. Verifique que los pop-ups estén habilitados.');
      }
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error(`Error al descargar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Generate filename with timestamp
 */
export const generateExportFilename = (format: ExportFormat, prefix: string = 'manifiestos'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${format}`;
};

/**
 * Validate export options
 */
export const validateExportOptions = (options: ExportOptions): string[] => {
  const errors: string[] = [];
  
  if (!Object.values(ExportFormat).includes(options.format)) {
    errors.push('Formato de exportación no válido');
  }
  
  if (options.dateRange) {
    if (options.dateRange.start > options.dateRange.end) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }
  }
  
  if (options.csvOptions) {
    const csvErrors = validateCSVOptions(options.csvOptions);
    errors.push(...csvErrors);
  }
  
  return errors;
};

/**
 * Validate CSV-specific options
 */
const validateCSVOptions = (csvOptions: CSVExportOptions): string[] => {
  const errors: string[] = [];
  
  if (csvOptions.delimiter && csvOptions.delimiter.length !== 1) {
    errors.push('El delimitador CSV debe ser un solo carácter');
  }
  
  if (csvOptions.dateFormat && !['ISO', 'DD/MM/YYYY', 'MM/DD/YYYY'].includes(csvOptions.dateFormat)) {
    errors.push('Formato de fecha no válido');
  }
  
  if (csvOptions.numberFormat && !['decimal', 'integer'].includes(csvOptions.numberFormat)) {
    errors.push('Formato de número no válido');
  }
  
  return errors;
};

/**
 * Get available CSV fields for custom selection
 */
export const getAvailableCSVFields = (): { key: string; label: string }[] => {
  return [
    { key: 'fecha', label: 'Fecha' },
    { key: 'folio', label: 'Folio' },
    { key: 'aeropuertoSalida', label: 'Aeropuerto Salida' },
    { key: 'tipoVuelo', label: 'Tipo Vuelo' },
    { key: 'transportista', label: 'Transportista' },
    { key: 'equipo', label: 'Equipo' },
    { key: 'matricula', label: 'Matrícula' },
    { key: 'numeroVuelo', label: 'Número Vuelo' },
    { key: 'pilotoAlMando', label: 'Piloto al Mando' },
    { key: 'numeroLicencia', label: 'Número Licencia' },
    { key: 'tripulacion', label: 'Tripulación' },
    { key: 'origenVuelo', label: 'Origen Vuelo' },
    { key: 'proximaEscala', label: 'Próxima Escala' },
    { key: 'destinoVuelo', label: 'Destino Vuelo' },
    { key: 'horaSlotAsignado', label: 'Hora Slot Asignado' },
    { key: 'horaSlotCoordinado', label: 'Hora Slot Coordinado' },
    { key: 'horaTerminoPernocta', label: 'Hora Término Pernocta' },
    { key: 'horaInicioManiobras', label: 'Hora Inicio Maniobras' },
    { key: 'horaSalidaPosicion', label: 'Hora Salida Posición' },
    { key: 'causaDemora', label: 'Causa Demora' },
    { key: 'codigoCausa', label: 'Código Causa' },
    { key: 'pasajerosNacional', label: 'Pasajeros Nacional' },
    { key: 'pasajerosInternacional', label: 'Pasajeros Internacional' },
    { key: 'pasajerosDiplomaticos', label: 'Pasajeros Diplomáticos' },
    { key: 'pasajerosEnComision', label: 'Pasajeros En Comisión' },
    { key: 'pasajerosInfantes', label: 'Pasajeros Infantes' },
    { key: 'pasajerosTransitos', label: 'Pasajeros Tránsitos' },
    { key: 'pasajerosConexiones', label: 'Pasajeros Conexiones' },
    { key: 'pasajerosOtrosExentos', label: 'Pasajeros Otros Exentos' },
    { key: 'totalPasajeros', label: 'Total Pasajeros' },
    { key: 'equipaje', label: 'Equipaje (kg)' },
    { key: 'carga', label: 'Carga (kg)' },
    { key: 'correo', label: 'Correo (kg)' },
    { key: 'totalCarga', label: 'Total Carga (kg)' }
  ];
};

/**
 * Create default export options
 */
export const createDefaultExportOptions = (format: ExportFormat): ExportOptions => {
  return {
    format,
    includeMetadata: true,
    csvOptions: {
      delimiter: ',',
      includeHeaders: true,
      dateFormat: 'ISO',
      numberFormat: 'decimal'
    }
  };
};