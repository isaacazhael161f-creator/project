/**
 * TypeScript types and interfaces for the Manifiesto Scanner
 * Based on the design document specifications
 */

// Main data structure for a manifiesto
export interface ManifiestoData {
  // Información del vuelo
  fecha: string;
  folio: string;
  aeropuertoSalida: string;
  tipoVuelo: string;
  
  // Información de aeronave
  transportista: string;
  equipo: string;
  matricula: string;
  numeroVuelo: string;
  
  // Información del piloto
  pilotoAlMando: string;
  numeroLicencia: string;
  tripulacion: number;
  
  // Movimiento de operaciones
  origenVuelo: string;
  proximaEscala: string;
  destinoVuelo: string;
  horaSlotAsignado: string;
  horaSlotCoordinado: string;
  horaTerminoPernocta: string;
  horaInicioManiobras: string;
  horaSalidaPosicion: string;
  
  // Causa de demora
  causaDemora: string;
  codigoCausa: string;
  
  // Embarque
  pasajeros: PassengerData;
  carga: CargoData;
  
  // Metadatos
  imagenOriginal: string; // Base64
  fechaProcesamiento: Date;
  editado: boolean;
}

// Passenger data structure
export interface PassengerData {
  nacional: number;
  internacional: number;
  diplomaticos: number;
  enComision: number;
  infantes: number;
  transitos: number;
  conexiones: number;
  otrosExentos: number;
  total: number;
}

// Cargo data structure
export interface CargoData {
  equipaje: number; // en kilogramos
  carga: number;    // en kilogramos
  correo: number;   // en kilogramos
  total: number;    // en kilogramos
}

// Validation rules for form fields
export interface ValidationRule {
  field: keyof ManifiestoData;
  required: boolean;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage: string;
}

// Extraction patterns for OCR parsing
export interface ExtractionPattern {
  field: keyof ManifiestoData;
  pattern: RegExp;
  transform?: (match: string) => any;
  fallbackPatterns?: RegExp[];
}

// Error recovery strategy
export interface ErrorRecoveryStrategy {
  errorType: string;
  retryAttempts: number;
  fallbackAction: () => void;
  userNotification: string;
}

// Component prop interfaces
export interface ManifiestoScannerProps {
  onDataExtracted: (data: ManifiestoData) => void;
}

export interface ImageUploaderProps {
  onImageSelected: (imageData: string) => void;
  supportedFormats: string[];
}

export interface OCRProcessorProps {
  imageData: string;
  onTextExtracted: (text: string) => void;
  onProgress: (progress: number) => void;
  onError: (error: string) => void;
}

export interface ManifiestoParserProps {
  rawText: string;
  onDataParsed: (data: Partial<ManifiestoData>) => void;
}

export interface DataEditorProps {
  data: Partial<ManifiestoData>;
  onDataChanged: (updatedData: ManifiestoData) => void;
  validationRules: ValidationRule[];
}

// Enums for common values
export enum TipoVuelo {
  NACIONAL = 'Nacional',
  INTERNACIONAL = 'Internacional',
  CHARTER = 'Charter',
  CARGA = 'Carga',
  PRIVADO = 'Privado',
  GUBERNAMENTAL = 'Gubernamental'
}

export enum CodigoAeropuerto {
  // Principales aeropuertos mexicanos
  MEX = 'MEX', // Ciudad de México - Aeropuerto Internacional Benito Juárez
  GDL = 'GDL', // Guadalajara - Aeropuerto Internacional Miguel Hidalgo y Costilla
  MTY = 'MTY', // Monterrey - Aeropuerto Internacional General Mariano Escobedo
  CUN = 'CUN', // Cancún - Aeropuerto Internacional de Cancún
  TIJ = 'TIJ', // Tijuana - Aeropuerto Internacional General Abelardo L. Rodríguez
  PVR = 'PVR', // Puerto Vallarta - Aeropuerto Internacional Lic. Gustavo Díaz Ordaz
  SJD = 'SJD', // Los Cabos - Aeropuerto Internacional de Los Cabos
  MID = 'MID', // Mérida - Aeropuerto Internacional Manuel Crescencio Rejón
  OAX = 'OAX', // Oaxaca - Aeropuerto Internacional Xoxocotlán
  VER = 'VER', // Veracruz - Aeropuerto Internacional General Heriberto Jara Corona
  ACA = 'ACA', // Acapulco - Aeropuerto Internacional General Juan N. Álvarez
  HMO = 'HMO', // Hermosillo - Aeropuerto Internacional General Ignacio Pesqueira García
  CJS = 'CJS', // Ciudad Juárez - Aeropuerto Internacional Abraham González
  SLP = 'SLP', // San Luis Potosí - Aeropuerto Internacional Ponciano Arriaga
  AGU = 'AGU', // Aguascalientes - Aeropuerto Nacional Jesús Terán Peredo
  
  // Aeropuertos internacionales comunes
  LAX = 'LAX', // Los Angeles
  DFW = 'DFW', // Dallas Fort Worth
  JFK = 'JFK', // New York JFK
  MIA = 'MIA', // Miami
  ATL = 'ATL', // Atlanta
  ORD = 'ORD', // Chicago O'Hare
  DEN = 'DEN', // Denver
  PHX = 'PHX', // Phoenix
  LAS = 'LAS', // Las Vegas
  SEA = 'SEA', // Seattle
  
  // Aeropuertos de Centroamérica y Sudamérica
  GUA = 'GUA', // Guatemala City
  SAL = 'SAL', // San Salvador
  SJO = 'SJO', // San José, Costa Rica
  PTY = 'PTY', // Panama City
  BOG = 'BOG', // Bogotá
  LIM = 'LIM', // Lima
  SCL = 'SCL', // Santiago
  GRU = 'GRU', // São Paulo
  EZE = 'EZE', // Buenos Aires
  
  // Aeropuertos europeos principales
  MAD = 'MAD', // Madrid
  BCN = 'BCN', // Barcelona
  CDG = 'CDG', // Paris Charles de Gaulle
  LHR = 'LHR', // London Heathrow
  FRA = 'FRA', // Frankfurt
  AMS = 'AMS', // Amsterdam
  FCO = 'FCO', // Rome Fiumicino
}

// Storage interface for IndexedDB
export interface StoredManifiesto {
  id: string;
  data: ManifiestoData;
  createdAt: Date;
  updatedAt: Date;
}

// Export format options
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json'
}

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  csvOptions?: CSVExportOptions;
}

export interface CSVExportOptions {
  delimiter?: string; // Default: ','
  includeHeaders?: boolean; // Default: true
  dateFormat?: 'ISO' | 'DD/MM/YYYY' | 'MM/DD/YYYY'; // Default: 'ISO'
  numberFormat?: 'decimal' | 'integer'; // Default: 'decimal'
  customFields?: string[]; // Specific fields to include
  excludeFields?: string[]; // Fields to exclude
}

// Códigos de causa de demora comunes en aeropuertos
export enum CodigoCausaDemora {
  // Causas meteorológicas
  WX01 = 'WX01', // Condiciones meteorológicas adversas
  WX02 = 'WX02', // Viento fuerte
  WX03 = 'WX03', // Lluvia intensa
  WX04 = 'WX04', // Niebla
  WX05 = 'WX05', // Tormenta eléctrica
  
  // Causas técnicas
  TC01 = 'TC01', // Falla técnica de aeronave
  TC02 = 'TC02', // Mantenimiento no programado
  TC03 = 'TC03', // Cambio de aeronave
  TC04 = 'TC04', // Falta de tripulación técnica
  
  // Causas operacionales
  OP01 = 'OP01', // Congestión de tráfico aéreo
  OP02 = 'OP02', // Restricciones de slot
  OP03 = 'OP03', // Demora en conexión
  OP04 = 'OP04', // Carga/descarga demorada
  OP05 = 'OP05', // Documentación faltante
  
  // Causas de pasajeros
  PS01 = 'PS01', // Pasajero perdido
  PS02 = 'PS02', // Problema médico
  PS03 = 'PS03', // Documentación de pasajero
  PS04 = 'PS04', // Seguridad de pasajero
  
  // Causas de aeropuerto
  AP01 = 'AP01', // Cierre de pista
  AP02 = 'AP02', // Falla de equipos de aeropuerto
  AP03 = 'AP03', // Congestión en terminal
  AP04 = 'AP04', // Servicios de rampa
  
  // Sin demora
  NONE = 'NONE' // Sin demora reportada
}

// Tipos de equipos/aeronaves comunes
export enum TipoEquipo {
  // Boeing
  B737 = 'B737',
  B738 = 'B738',
  B739 = 'B739',
  B747 = 'B747',
  B757 = 'B757',
  B767 = 'B767',
  B777 = 'B777',
  B787 = 'B787',
  
  // Airbus
  A319 = 'A319',
  A320 = 'A320',
  A321 = 'A321',
  A330 = 'A330',
  A340 = 'A340',
  A350 = 'A350',
  A380 = 'A380',
  
  // Embraer
  E170 = 'E170',
  E175 = 'E175',
  E190 = 'E190',
  E195 = 'E195',
  
  // Otros
  CRJ = 'CRJ', // Canadair Regional Jet
  ATR = 'ATR', // ATR 42/72
  DHC = 'DHC', // De Havilland Canada
  
  // Carga
  B744F = 'B744F', // Boeing 747-400F
  B77F = 'B77F',   // Boeing 777F
  A33F = 'A33F',   // Airbus A330F
}

// Estados de procesamiento del manifiesto
export enum EstadoProcesamiento {
  PENDIENTE = 'pendiente',
  PROCESANDO = 'procesando',
  COMPLETADO = 'completado',
  ERROR = 'error',
  EDITADO = 'editado'
}

// Tipos de validación más específicos
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: keyof ManifiestoData;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: keyof ManifiestoData;
  message: string;
  suggestion?: string;
}

// Configuración de OCR
export interface OCRConfig {
  language: string;
  tesseractOptions: {
    logger?: (m: any) => void;
    errorHandler?: (err: any) => void;
  };
  preprocessingOptions: {
    enhanceContrast: boolean;
    autoRotate: boolean;
    denoise: boolean;
  };
}

// Metadatos extendidos para el manifiesto
export interface ManifiestoMetadata {
  version: string;
  processingTime: number; // en milisegundos
  ocrConfidence: number; // 0-100
  editedFields: (keyof ManifiestoData)[];
  validationStatus: EstadoProcesamiento;
  lastModified: Date;
}

// Utility types for better type safety
export type ManifiestoField = keyof ManifiestoData;
export type RequiredManifiestoFields = 'fecha' | 'folio' | 'numeroVuelo' | 'transportista';
export type OptionalManifiestoFields = Exclude<ManifiestoField, RequiredManifiestoFields>;

// Partial types for different stages of processing
export type PartialManifiestoData = Partial<ManifiestoData>;
export type ManifiestoDataWithoutMetadata = Omit<ManifiestoData, 'imagenOriginal' | 'fechaProcesamiento' | 'editado'>;

// Type guards for runtime type checking
export const isValidPassengerData = (data: any): data is PassengerData => {
  return typeof data === 'object' &&
    typeof data.nacional === 'number' &&
    typeof data.internacional === 'number' &&
    typeof data.total === 'number';
};

export const isValidCargoData = (data: any): data is CargoData => {
  return typeof data === 'object' &&
    typeof data.equipaje === 'number' &&
    typeof data.carga === 'number' &&
    typeof data.total === 'number';
};

export const isValidManifiestoData = (data: any): data is ManifiestoData => {
  return typeof data === 'object' &&
    typeof data.fecha === 'string' &&
    typeof data.folio === 'string' &&
    typeof data.numeroVuelo === 'string' &&
    isValidPassengerData(data.pasajeros) &&
    isValidCargoData(data.carga);
};