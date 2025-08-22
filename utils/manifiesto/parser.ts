/**
 * Manifiesto parsing utilities
 * Provides functions for extracting structured data from OCR text
 */

import { ManifiestoData, PassengerData, CargoData, PartialManifiestoData } from '../../types/manifiesto';
import { 
  ErrorType, 
  createManifiestoError, 
  withErrorHandling 
} from './errorHandler';

// Patrones regex para extraer campos específicos del manifiesto
export const EXTRACTION_PATTERNS = {
  // Información básica del vuelo
  fecha: [
    /fecha[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /date[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /fecha[:\s]*(\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4})/i,
    /date[:\s]*(\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2})/,
    // Fallback patterns for malformed dates with spaces
    /(\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4})/,
    /(\d{4}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{1,2})/
  ],
  
  folio: [
    /folio[:\s]*([A-Z0-9\-]+)/i,
    /n[úu]mero[:\s]*([A-Z0-9\-]+)/i,
    /ref[:\s]*([A-Z0-9\-]+)/i,
    /documento[:\s]*([A-Z0-9\-]+)/i,
    /manifest[:\s]*([A-Z0-9\-]+)/i,
    // Fallback patterns for malformed folios
    /([A-Z]{2,4}[\-\s]*\d{3,6}[\-\s]*[A-Z0-9]*)/i,
    /([A-Z0-9]{3,}-[A-Z0-9]{3,})/i
  ],
  
  numeroVuelo: [
    /vuelo[:\s]*([A-Z]{1,3}[\-\s]*\d{1,4}[A-Z]?)/i,
    /flight[:\s]*([A-Z]{1,3}[\-\s]*\d{1,4}[A-Z]?)/i,
    /n[úu]mero\s*de\s*vuelo[:\s]*([A-Z]{1,3}[\-\s]*\d{1,4}[A-Z]?)/i,
    /([A-Z]{2,3}[\-\s]*\d{1,4}[A-Z]?)/,
    // Fallback patterns for malformed flight numbers
    /([A-Z]{1,3})\s*(\d{1,4})\s*([A-Z]?)/,
    /([A-Z0-9]{2,6})\s*(?:flight|vuelo)/i,
    // Pattern for when OCR misreads characters
    /([A-Z0-9]{2,3})[O0](\d{1,4})/i, // O/0 confusion
    /([A-Z]{2,3})[Il1](\d{1,4})/i    // I/l/1 confusion
  ],
  
  transportista: [
    /transportista[:\s]*([A-Z\s]+)/i,
    /aerol[íi]nea[:\s]*([A-Z\s]+)/i,
    /airline[:\s]*([A-Z\s]+)/i,
    /carrier[:\s]*([A-Z\s]+)/i
  ],
  
  // Información de aeronave
  equipo: [
    /equipo[:\s]*([A-Z0-9]+)/i,
    /aircraft[:\s]*([A-Z0-9]+)/i,
    /tipo[:\s]*([A-Z0-9]+)/i,
    /([AB]\d{3}[0-9A-Z]*)/,
    /(B737|B738|B777|B787|A320|A321|A330|E190)/i
  ],
  
  matricula: [
    /matr[íi]cula[:\s]*([A-Z]{1,2}[\-\s]*[A-Z0-9]+)/i,
    /registration[:\s]*([A-Z]{1,2}[\-\s]*[A-Z0-9]+)/i,
    /([XN]A[\-\s]*[A-Z0-9]{3,4})/i
  ],
  
  // Información del piloto
  pilotoAlMando: [
    /piloto\s*al\s*mando[:\s]*([A-Z\s,\.]{5,30})/i,
    /piloto[:\s]*([A-Z\s,\.]{5,30})/i,
    /capit[áa]n[:\s]*([A-Z\s,\.]{5,30})/i,
    /commander[:\s]*([A-Z\s,\.]{5,30})/i
  ],
  
  numeroLicencia: [
    /licencia[:\s]*([A-Z0-9\-]+)/i,
    /license[:\s]*([A-Z0-9\-]+)/i,
    /([A-Z]{2,3}[\-\s]*\d{4,6})/
  ],
  
  // Aeropuertos
  aeropuertoSalida: [
    /aeropuerto\s*salida[:\s]*([A-Z]{3})/i,
    /salida[:\s]*([A-Z]{3})/i,
    /departure[:\s]*([A-Z]{3})/i,
    /from[:\s]*([A-Z]{3})/i,
    // More specific patterns to avoid false matches
    /aeropuerto[:\s]*([A-Z]{3})/i
  ],
  
  origenVuelo: [
    /origen\s*vuelo[:\s]*([A-Z]{3})/i,
    /origen[:\s]*([A-Z]{3})/i,
    /from[:\s]*([A-Z]{3})/i,
    /departure[:\s]*([A-Z]{3})/i
  ],
  
  destinoVuelo: [
    /destino\s*vuelo[:\s]*([A-Z]{3})/i,
    /destino[:\s]*([A-Z]{3})/i,
    /to[:\s]*([A-Z]{3})/i,
    /arrival[:\s]*([A-Z]{3})/i
  ],
  
  proximaEscala: [
    /escala[:\s]*([A-Z]{3})/i,
    /stopover[:\s]*([A-Z]{3})/i,
    /via[:\s]*([A-Z]{3})/i
  ],
  
  // Horarios
  horaSlotAsignado: [
    /slot\s*asignado[:\s]*(\d{1,2}:\d{2})/i,
    /assigned\s*slot[:\s]*(\d{1,2}:\d{2})/i,
    /(\d{1,2}:\d{2})/
  ],
  
  horaSlotCoordinado: [
    /slot\s*coordinado[:\s]*(\d{1,2}:\d{2})/i,
    /coordinated\s*slot[:\s]*(\d{1,2}:\d{2})/i
  ],
  
  horaInicioManiobras: [
    /inicio\s*maniobras[:\s]*(\d{1,2}:\d{2})/i,
    /start\s*operations[:\s]*(\d{1,2}:\d{2})/i
  ],
  
  horaSalidaPosicion: [
    /salida\s*posici[óo]n[:\s]*(\d{1,2}:\d{2})/i,
    /pushback[:\s]*(\d{1,2}:\d{2})/i
  ],
  
  // Tipo de vuelo
  tipoVuelo: [
    /tipo\s*vuelo[:\s]*(nacional|internacional|charter|carga|privado|gubernamental)/i,
    /tipo[:\s]*(nacional|internacional|charter|carga|privado|gubernamental)/i,
    /type[:\s]*(domestic|international|charter|cargo|private|government)/i,
    // Fallback patterns
    /vuelo[:\s]*(nacional|internacional)/i
  ],
  
  // Causa de demora
  causaDemora: [
    /causa\s*demora[:\s]*([A-Z\s]+)/i,
    /delay\s*reason[:\s]*([A-Z\s]+)/i,
    /demora[:\s]*([A-Z\s]+)/i
  ],
  
  codigoCausa: [
    /c[óo]digo[:\s]*([A-Z]{2}\d{2})/i,
    /code[:\s]*([A-Z]{2}\d{2})/i,
    /([A-Z]{2}\d{2})/
  ]
};

// Patrones para detectar tablas de datos
export const TABLE_PATTERNS = {
  passengerTable: [
    /pasajeros[:\s]*\n([\s\S]*?)(?=\n\s*carga|$)/i,
    /passengers[:\s]*\n([\s\S]*?)(?=\n\s*cargo|$)/i,
    /pax[:\s]*\n([\s\S]*?)(?=\n\s*cargo|$)/i,
    // Fallback: look for passenger-related content
    /(nacional[\s\S]*?total[\s\S]*?\d+)/i,
    /(domestic[\s\S]*?total[\s\S]*?\d+)/i
  ],
  
  cargoTable: [
    /carga[:\s]*\n([\s\S]*?)(?=\n\s*[a-z]+:|$)/i,
    /cargo[:\s]*\n([\s\S]*?)(?=\n\s*[a-z]+:|$)/i,
    /weight[:\s]*\n([\s\S]*?)(?=\n\s*[a-z]+:|$)/i,
    // Fallback: look for cargo-related content
    /(equipaje[\s\S]*?total[\s\S]*?\d+)/i,
    /(baggage[\s\S]*?total[\s\S]*?\d+)/i
  ]
};

// Patrones para extraer datos de pasajeros
export const PASSENGER_PATTERNS = {
  nacional: [
    /nacional[:\s]*(\d+)/i,
    /domestic[:\s]*(\d+)/i,
    /nac[:\s]*(\d+)/i,
    // Fallback patterns for table format
    /nacional\s*[:\|\-\s]*(\d+)/i,
    /nac\s*[:\|\-\s]*(\d+)/i,
    // Pattern for when text is in table format
    /nacional\s+(\d+)/i,
    // OCR error patterns
    /naci[o0]nal[:\s]*(\d+)/i,
    /nac[il1][o0]nal[:\s]*(\d+)/i
  ],
  
  internacional: [
    /internacional[:\s]*(\d+)/i,
    /international[:\s]*(\d+)/i,
    /intl[:\s]*(\d+)/i,
    // Fallback patterns for table format
    /internacional\s*[:\|\-\s]*(\d+)/i,
    /intl\s*[:\|\-\s]*(\d+)/i,
    /internacional\s+(\d+)/i,
    // OCR error patterns
    /internaci[o0]nal[:\s]*(\d+)/i,
    /[il1]nternac[il1][o0]nal[:\s]*(\d+)/i
  ],
  
  diplomaticos: [
    /diplom[áa]ticos[:\s]*(\d+)/i,
    /diplomatic[:\s]*(\d+)/i,
    /dipl[:\s]*(\d+)/i,
    // Fallback patterns for table format
    /diplom[áa]ticos\s*[:\|\-\s]*(\d+)/i,
    /diplomatic\s*[:\|\-\s]*(\d+)/i,
    /diplom[áa]ticos\s+(\d+)/i
  ],
  
  enComision: [
    /en\s*comisi[óo]n[:\s]*(\d+)/i,
    /official[:\s]*(\d+)/i,
    /com[:\s]*(\d+)/i
  ],
  
  infantes: [
    /infantes[:\s]*(\d+)/i,
    /infants[:\s]*(\d+)/i,
    /inf[:\s]*(\d+)/i
  ],
  
  transitos: [
    /tr[áa]nsitos[:\s]*(\d+)/i,
    /transit[:\s]*(\d+)/i,
    /trans[:\s]*(\d+)/i
  ],
  
  conexiones: [
    /conexiones[:\s]*(\d+)/i,
    /connections[:\s]*(\d+)/i,
    /conn[:\s]*(\d+)/i
  ],
  
  otrosExentos: [
    /otros\s*exentos[:\s]*(\d+)/i,
    /other\s*exempt[:\s]*(\d+)/i,
    /exempt[:\s]*(\d+)/i
  ],
  
  total: [
    /total\s*pasajeros[:\s]*(\d+)/i,
    /total\s*passengers[:\s]*(\d+)/i,
    /total[:\s]*(\d+)/i,
    /pax[:\s]*(\d+)/i
  ]
};

// Patrones para extraer datos de carga
export const CARGO_PATTERNS = {
  equipaje: [
    /equipaje[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /baggage[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /bag[:\s]*(\d+(?:\.\d+)?)/i,
    // Fallback patterns for table format
    /equipaje\s*[:\|\-\s]*(\d+(?:\.\d+)?)/i,
    /baggage\s*[:\|\-\s]*(\d+(?:\.\d+)?)/i,
    /equipaje\s+(\d+(?:\.\d+)?)/i
  ],
  
  carga: [
    /carga[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /cargo[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /freight[:\s]*(\d+(?:\.\d+)?)/i,
    // Fallback patterns for table format
    /carga\s*[:\|\-\s]*(\d+(?:\.\d+)?)/i,
    /cargo\s*[:\|\-\s]*(\d+(?:\.\d+)?)/i,
    /carga\s+(\d+(?:\.\d+)?)/i,
    // Avoid matching "equipaje" when looking for "carga"
    /(?<!equi)carga[:\s]*(\d+(?:\.\d+)?)/i
  ],
  
  correo: [
    /correo[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /mail[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /post[:\s]*(\d+(?:\.\d+)?)/i
  ],
  
  total: [
    /total\s*carga[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /total\s*cargo[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /total\s*weight[:\s]*(\d+(?:\.\d+)?)/i
  ]
};

/**
 * Extrae un campo específico del texto usando múltiples patrones
 * @param text - Texto donde buscar
 * @param patterns - Array de patrones regex a probar
 * @param transform - Función opcional para transformar el resultado
 * @returns Valor extraído o null si no se encuentra
 */
export const extractField = (
  text: string,
  patterns: RegExp[],
  transform?: (value: string) => any
): any => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      return transform ? transform(value) : value;
    }
  }
  return null;
};

/**
 * Extrae una tabla específica del texto
 * @param text - Texto completo del manifiesto
 * @param tablePatterns - Patrones para identificar la tabla
 * @returns Texto de la tabla extraída o texto completo si no se encuentra
 */
export const extractTable = (text: string, tablePatterns: RegExp[]): string => {
  for (const pattern of tablePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  // Si no se encuentra una tabla específica, devolver el texto completo
  return text;
};

/**
 * Limpia texto mal reconocido por OCR
 * @param text - Texto a limpiar
 * @returns Texto limpio
 */
export const cleanOCRText = (text: string): string => {
  let cleaned = text;
  
  // Corregir confusiones O/0 en contexto numérico
  cleaned = cleaned.replace(/(\d+)[O](\d+)/g, '$10$2'); // Números con O en el medio
  cleaned = cleaned.replace(/[O](\d+)/g, '0$1'); // O al inicio de números
  cleaned = cleaned.replace(/(\d+)[O]/g, '$10'); // O al final de números
  
  // Corregir confusiones I/l/1 en contexto numérico
  cleaned = cleaned.replace(/(\d+)[Il](\d+)/g, '$11$2'); // I/l en medio de números
  cleaned = cleaned.replace(/[Il](\d+)/g, '1$1'); // I/l al inicio de números
  cleaned = cleaned.replace(/(\d+)[Il]/g, '$11'); // I/l al final de números
  
  // Corregir 1 a I en palabras específicas (más conservador)
  cleaned = cleaned.replace(/Fl1ght/gi, 'FIight'); // Caso específico Flight
  cleaned = cleaned.replace(/F1([a-z]+)/gi, 'FI$1'); // F1... -> FI...
  cleaned = cleaned.replace(/([A-Z])1([a-z]{2,})/g, '$1I$2'); // Letra mayúscula + 1 + letras minúsculas
  
  // Limpiar espacios múltiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

/**
 * Normaliza fechas a formato estándar
 * @param dateStr - Cadena de fecha
 * @returns Fecha normalizada en formato DD/MM/YYYY
 */
export const normalizeDateString = (dateStr: string): string => {
  // Limpiar la fecha pero mantener espacios para el patrón con espacios
  let cleaned = dateStr.replace(/[^\d\/\-\.\s]/g, '');
  
  // Intentar diferentes formatos, incluyendo con espacios
  const formats = [
    /(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{4})/,  // DD/MM/YYYY con espacios
    /(\d{4})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})/,  // YYYY/MM/DD con espacios
    /(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{2})/,  // DD/MM/YY con espacios
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,              // YYYY/MM/DD
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,             // DD/MM/YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/              // DD/MM/YY
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      let [, part1, part2, part3] = match;
      
      // Si el primer número tiene 4 dígitos, es YYYY/MM/DD
      if (part1.length === 4) {
        return `${part3.padStart(2, '0')}/${part2.padStart(2, '0')}/${part1}`;
      }
      
      // Si el año es de 2 dígitos, asumir 20XX
      if (part3.length === 2) {
        part3 = '20' + part3;
      }
      
      return `${part1.padStart(2, '0')}/${part2.padStart(2, '0')}/${part3}`;
    }
  }
  
  return dateStr;
};

/**
 * Normaliza códigos de vuelo
 * @param flightCode - Código de vuelo
 * @returns Código normalizado
 */
export const normalizeFlightCode = (flightCode: string): string => {
  return flightCode
    .replace(/\s+/g, '')  // Eliminar espacios
    .replace(/[\-_]/g, '') // Eliminar guiones y guiones bajos
    .toUpperCase();
};

/**
 * Normaliza códigos de aeropuerto
 * @param airportCode - Código de aeropuerto
 * @returns Código normalizado de 3 letras
 */
export const normalizeAirportCode = (airportCode: string): string => {
  const cleaned = airportCode.replace(/[^A-Z]/gi, '').toUpperCase();
  return cleaned.length === 3 ? cleaned : airportCode;
};

/**
 * Normaliza horarios
 * @param timeStr - Cadena de tiempo
 * @returns Tiempo normalizado en formato HH:MM
 */
export const normalizeTimeString = (timeStr: string): string => {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})/);
  if (match) {
    const [, hours, minutes] = match;
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  return timeStr;
};

/**
 * Extrae datos de pasajeros del texto
 * @param text - Texto del manifiesto
 * @returns Datos de pasajeros extraídos
 */
export const extractPassengerData = (text: string): PassengerData => {
  const data: Partial<PassengerData> = {};
  
  // Limpiar texto de errores de OCR
  const cleanedText = cleanOCRText(text);
  
  // Intentar extraer tabla de pasajeros específica
  const passengerTable = extractTable(cleanedText, TABLE_PATTERNS.passengerTable);
  
  // Extraer cada campo de pasajeros de la tabla o texto completo
  Object.entries(PASSENGER_PATTERNS).forEach(([field, patterns]) => {
    // Primero intentar en la tabla específica
    let value = extractField(passengerTable, patterns, (val) => parseInt(val, 10));
    
    // Si no se encuentra, intentar en el texto completo
    if (value === null || isNaN(value)) {
      value = extractField(cleanedText, patterns, (val) => parseInt(val, 10));
    }
    
    if (value !== null && !isNaN(value) && value >= 0) {
      (data as any)[field] = value;
    }
  });
  
  // Intentar extraer datos de tabla estructurada si los patrones individuales fallan
  if (Object.keys(data).length === 0) {
    const tableData = extractPassengerDataFromTable(passengerTable);
    Object.assign(data, tableData);
  }
  
  // Calcular total si no se encontró
  if (!data.total) {
    const sum = (data.nacional || 0) + 
                 (data.internacional || 0) + 
                 (data.diplomaticos || 0) + 
                 (data.enComision || 0) + 
                 (data.infantes || 0) + 
                 (data.transitos || 0) + 
                 (data.conexiones || 0) + 
                 (data.otrosExentos || 0);
    
    if (sum > 0) {
      data.total = sum;
    }
  }
  
  return {
    nacional: data.nacional || 0,
    internacional: data.internacional || 0,
    diplomaticos: data.diplomaticos || 0,
    enComision: data.enComision || 0,
    infantes: data.infantes || 0,
    transitos: data.transitos || 0,
    conexiones: data.conexiones || 0,
    otrosExentos: data.otrosExentos || 0,
    total: data.total || 0
  };
};

/**
 * Extrae datos de pasajeros de una tabla estructurada
 * @param tableText - Texto de la tabla de pasajeros
 * @returns Datos parciales de pasajeros
 */
export const extractPassengerDataFromTable = (tableText: string): Partial<PassengerData> => {
  const data: Partial<PassengerData> = {};
  
  // Buscar filas que contengan números
  const rows = tableText.split('\n').filter(row => /\d+/.test(row));
  
  for (const row of rows) {
    const numbers = row.match(/\d+/g);
    if (!numbers) continue;
    
    const rowLower = row.toLowerCase();
    
    // Identificar el tipo de fila por palabras clave
    if (/nac|domestic/.test(rowLower) && !data.nacional) {
      data.nacional = parseInt(numbers[0], 10);
    } else if (/int|international/.test(rowLower) && !data.internacional) {
      data.internacional = parseInt(numbers[0], 10);
    } else if (/dipl|diplomatic/.test(rowLower) && !data.diplomaticos) {
      data.diplomaticos = parseInt(numbers[0], 10);
    } else if (/comis|official/.test(rowLower) && !data.enComision) {
      data.enComision = parseInt(numbers[0], 10);
    } else if (/infant/.test(rowLower) && !data.infantes) {
      data.infantes = parseInt(numbers[0], 10);
    } else if (/trans/.test(rowLower) && !data.transitos) {
      data.transitos = parseInt(numbers[0], 10);
    } else if (/conex|connection/.test(rowLower) && !data.conexiones) {
      data.conexiones = parseInt(numbers[0], 10);
    } else if (/exent|exempt/.test(rowLower) && !data.otrosExentos) {
      data.otrosExentos = parseInt(numbers[0], 10);
    } else if (/total|pax/.test(rowLower) && !data.total) {
      data.total = parseInt(numbers[numbers.length - 1], 10);
    }
  }
  
  return data;
};

/**
 * Extrae datos de carga del texto
 * @param text - Texto del manifiesto
 * @returns Datos de carga extraídos
 */
export const extractCargoData = (text: string): CargoData => {
  const data: Partial<CargoData> = {};
  
  // Limpiar texto de errores de OCR
  const cleanedText = cleanOCRText(text);
  
  // Intentar extraer tabla de carga específica
  const cargoTable = extractTable(cleanedText, TABLE_PATTERNS.cargoTable);
  
  // Extraer cada campo de carga de la tabla o texto completo
  Object.entries(CARGO_PATTERNS).forEach(([field, patterns]) => {
    // Primero intentar en la tabla específica
    let value = extractField(cargoTable, patterns, (val) => parseFloat(val));
    
    // Si no se encuentra, intentar en el texto completo
    if (value === null || isNaN(value)) {
      value = extractField(cleanedText, patterns, (val) => parseFloat(val));
    }
    
    if (value !== null && !isNaN(value) && value >= 0) {
      (data as any)[field] = value;
    }
  });
  
  // Intentar extraer datos de tabla estructurada si los patrones individuales fallan
  if (Object.keys(data).length === 0) {
    const tableData = extractCargoDataFromTable(cargoTable);
    Object.assign(data, tableData);
  }
  
  // Calcular total si no se encontró
  if (!data.total) {
    const sum = (data.equipaje || 0) + (data.carga || 0) + (data.correo || 0);
    if (sum > 0) {
      data.total = sum;
    }
  }
  
  return {
    equipaje: data.equipaje || 0,
    carga: data.carga || 0,
    correo: data.correo || 0,
    total: data.total || 0
  };
};

/**
 * Extrae datos de carga de una tabla estructurada
 * @param tableText - Texto de la tabla de carga
 * @returns Datos parciales de carga
 */
export const extractCargoDataFromTable = (tableText: string): Partial<CargoData> => {
  const data: Partial<CargoData> = {};
  
  // Buscar filas que contengan números con posibles unidades kg
  const rows = tableText.split('\n').filter(row => /\d+/.test(row));
  
  for (const row of rows) {
    // Buscar números que pueden incluir decimales
    const numbers = row.match(/\d+(?:\.\d+)?/g);
    if (!numbers) continue;
    
    const rowLower = row.toLowerCase();
    
    // Identificar el tipo de fila por palabras clave
    if (/equipaje|baggage|bag/.test(rowLower) && !data.equipaje) {
      data.equipaje = parseFloat(numbers[0]);
    } else if (/carga|cargo|freight/.test(rowLower) && !/equipaje|baggage/.test(rowLower) && !data.carga) {
      data.carga = parseFloat(numbers[0]);
    } else if (/correo|mail|post/.test(rowLower) && !data.correo) {
      data.correo = parseFloat(numbers[0]);
    } else if (/total.*(?:carga|cargo|weight)/.test(rowLower) && !data.total) {
      data.total = parseFloat(numbers[numbers.length - 1]);
    }
  }
  
  return data;
};

/**
 * Función principal para parsear texto de manifiesto
 * @param rawText - Texto crudo extraído por OCR
 * @returns Datos parciales del manifiesto
 */
export const parseManifiestoText = withErrorHandling(
  (rawText: string): PartialManifiestoData => {
    if (!rawText || rawText.trim().length === 0) {
      throw createManifiestoError(
        ErrorType.PARSING_NO_DATA_FOUND,
        'Texto vacío o nulo',
        { operation: 'text_validation' }
      );
    }

    const data: PartialManifiestoData = {};
    
    try {
      // Limpiar texto de errores comunes de OCR
      const cleanedText = cleanOCRText(rawText);
      
      // Extraer campos básicos con patrones mejorados
      Object.entries(EXTRACTION_PATTERNS).forEach(([field, patterns]) => {
        let value = extractField(cleanedText, patterns);
        
        // Si no se encuentra con el texto limpio, intentar con el texto original
        if (value === null) {
          value = extractField(rawText, patterns);
        }
        
        if (value !== null) {
          // Aplicar transformaciones específicas
          switch (field) {
            case 'fecha':
              value = normalizeDateString(value);
              break;
            case 'numeroVuelo':
              value = normalizeFlightCode(value);
              break;
            case 'aeropuertoSalida':
            case 'origenVuelo':
            case 'destinoVuelo':
            case 'proximaEscala':
              value = normalizeAirportCode(value);
              break;
            case 'horaSlotAsignado':
            case 'horaSlotCoordinado':
            case 'horaInicioManiobras':
            case 'horaSalidaPosicion':
            case 'horaTerminoPernocta':
              value = normalizeTimeString(value);
              break;
            case 'tripulacion':
              value = parseInt(value, 10);
              if (isNaN(value)) value = null;
              break;
            default:
              // Limpiar espacios extra y caracteres especiales para campos de texto
              if (typeof value === 'string') {
                value = value.replace(/\s+/g, ' ').trim();
              }
          }
          
          if (value !== null) {
            (data as any)[field] = value;
          }
        }
      });
      
      // Extraer datos de pasajeros y carga con métodos mejorados
      data.pasajeros = extractPassengerData(rawText);
      data.carga = extractCargoData(rawText);
      
      // Agregar metadatos
      data.fechaProcesamiento = new Date();
      data.editado = false;
      
      // Validar que se extrajo al menos algo útil
      const hasBasicData = data.fecha || data.folio || data.numeroVuelo || data.transportista;
      const hasPassengerData = data.pasajeros && data.pasajeros.total > 0;
      const hasCargoData = data.carga && data.carga.total > 0;
      
      if (!hasBasicData && !hasPassengerData && !hasCargoData) {
        throw createManifiestoError(
          ErrorType.PARSING_NO_DATA_FOUND,
          'No se encontraron datos válidos del manifiesto',
          { 
            operation: 'data_extraction',
            textLength: rawText.length,
            cleanedTextLength: cleanedText.length
          }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('PARSING_')) {
        throw error; // Ya es un ManifiestoError
      }
      
      throw createManifiestoError(
        ErrorType.PARSING_FAILED,
        error instanceof Error ? error.message : String(error),
        { operation: 'text_parsing', textLength: rawText.length }
      );
    }
  },
  { component: 'ManifiestoParser', operation: 'parseManifiestoText' },
  {
    retry: async () => {
      console.log('Reintentando parsing con patrones alternativos...');
    },
    fallback: async () => {
      console.log('Usando parser de respaldo...');
    }
  }
);

/**
 * Valida la completitud de los datos extraídos
 * @param data - Datos parciales del manifiesto
 * @returns Información sobre campos faltantes y confianza
 */
export const validateExtractedData = (data: PartialManifiestoData): {
  completeness: number;
  missingRequired: string[];
  missingOptional: string[];
  confidence: number;
} => {
  const requiredFields = ['fecha', 'folio', 'numeroVuelo', 'transportista'];
  const optionalFields = [
    'aeropuertoSalida', 'tipoVuelo', 'equipo', 'matricula',
    'pilotoAlMando', 'numeroLicencia', 'origenVuelo', 'destinoVuelo',
    'horaSlotAsignado', 'causaDemora', 'codigoCausa'
  ];
  
  const missingRequired = requiredFields.filter(field => !data[field as keyof PartialManifiestoData]);
  const missingOptional = optionalFields.filter(field => !data[field as keyof PartialManifiestoData]);
  
  const totalFields = requiredFields.length + optionalFields.length;
  const foundFields = totalFields - missingRequired.length - missingOptional.length;
  const completeness = (foundFields / totalFields) * 100;
  
  // Calcular confianza basada en campos requeridos y datos de pasajeros/carga
  let confidence = 100;
  
  // Penalizar por campos requeridos faltantes
  confidence -= missingRequired.length * 20;
  
  // Penalizar por campos opcionales faltantes
  confidence -= missingOptional.length * 5;
  
  // Bonificar por datos de pasajeros válidos
  if (data.pasajeros && data.pasajeros.total > 0) {
    confidence += 10;
  }
  
  // Bonificar por datos de carga válidos
  if (data.carga && data.carga.total > 0) {
    confidence += 10;
  }
  
  return {
    completeness: Math.round(completeness),
    missingRequired,
    missingOptional,
    confidence: Math.max(0, Math.min(100, confidence))
  };
};

/**
 * Sugiere correcciones para campos mal extraídos
 * @param data - Datos extraídos
 * @returns Sugerencias de corrección
 */
export const suggestCorrections = (data: PartialManifiestoData): {
  field: string;
  currentValue: any;
  suggestion: string;
  reason: string;
}[] => {
  const suggestions: {
    field: string;
    currentValue: any;
    suggestion: string;
    reason: string;
  }[] = [];
  
  // Validar formato de fecha
  if (data.fecha && !/^\d{2}\/\d{2}\/\d{4}$/.test(data.fecha)) {
    suggestions.push({
      field: 'fecha',
      currentValue: data.fecha,
      suggestion: 'Verificar formato DD/MM/YYYY',
      reason: 'Formato de fecha no estándar'
    });
  }
  
  // Validar código de vuelo
  if (data.numeroVuelo && !/^[A-Z]{2,3}\d{1,4}[A-Z]?$/.test(data.numeroVuelo)) {
    suggestions.push({
      field: 'numeroVuelo',
      currentValue: data.numeroVuelo,
      suggestion: 'Verificar formato de código de vuelo (ej: AM123)',
      reason: 'Formato de código de vuelo inusual'
    });
  }
  
  // Validar códigos de aeropuerto
  ['aeropuertoSalida', 'origenVuelo', 'destinoVuelo', 'proximaEscala'].forEach(field => {
    const value = data[field as keyof PartialManifiestoData] as string;
    if (value && (value.length !== 3 || !/^[A-Z]{3}$/.test(value))) {
      suggestions.push({
        field,
        currentValue: value,
        suggestion: 'Verificar código de aeropuerto de 3 letras',
        reason: 'Código de aeropuerto debe tener exactamente 3 letras'
      });
    }
  });
  
  // Validar horarios
  ['horaSlotAsignado', 'horaSlotCoordinado', 'horaInicioManiobras', 'horaSalidaPosicion'].forEach(field => {
    const value = data[field as keyof PartialManifiestoData] as string;
    if (value && !/^\d{2}:\d{2}$/.test(value)) {
      suggestions.push({
        field,
        currentValue: value,
        suggestion: 'Verificar formato HH:MM',
        reason: 'Formato de hora no estándar'
      });
    }
  });
  
  // Validar datos de pasajeros
  if (data.pasajeros) {
    const { pasajeros } = data;
    const calculatedTotal = pasajeros.nacional + pasajeros.internacional + 
                           pasajeros.diplomaticos + pasajeros.enComision + 
                           pasajeros.infantes + pasajeros.transitos + 
                           pasajeros.conexiones + pasajeros.otrosExentos;
    
    if (pasajeros.total > 0 && Math.abs(pasajeros.total - calculatedTotal) > 0) {
      suggestions.push({
        field: 'pasajeros.total',
        currentValue: pasajeros.total,
        suggestion: `El total calculado es ${calculatedTotal}`,
        reason: 'Discrepancia en el total de pasajeros'
      });
    }
  }
  
  // Validar datos de carga
  if (data.carga) {
    const { carga } = data;
    const calculatedTotal = carga.equipaje + carga.carga + carga.correo;
    
    if (carga.total > 0 && Math.abs(carga.total - calculatedTotal) > 0.1) {
      suggestions.push({
        field: 'carga.total',
        currentValue: carga.total,
        suggestion: `El total calculado es ${calculatedTotal.toFixed(1)} kg`,
        reason: 'Discrepancia en el total de carga'
      });
    }
  }
  
  return suggestions;
};