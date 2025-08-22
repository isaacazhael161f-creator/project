/**
 * Zustand store for Manifiesto Scanner global state management
 * Handles the complete workflow state and navigation between steps
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ManifiestoData, PartialManifiestoData, EstadoProcesamiento } from '../types/manifiesto';

// Navigation steps in the manifiesto scanning workflow
export enum ScannerStep {
  IMAGE_UPLOAD = 'image_upload',
  OCR_PROCESSING = 'ocr_processing', 
  DATA_PARSING = 'data_parsing',
  DATA_EDITING = 'data_editing',
  REVIEW_SAVE = 'review_save'
}

// Current processing state
export interface ProcessingState {
  currentStep: ScannerStep;
  completedSteps: Set<ScannerStep>;
  canNavigateToStep: (step: ScannerStep) => boolean;
  progress: number; // 0-100
}

// Scanner session data
export interface ScannerSession {
  id: string;
  imageData?: string;
  extractedText?: string;
  parsedData?: PartialManifiestoData;
  finalData?: ManifiestoData;
  status: EstadoProcesamiento;
  startedAt: Date;
  lastModified: Date;
}

interface ManifiestoScannerState {
  // Current session
  currentSession: ScannerSession | null;
  
  // Navigation state
  processingState: ProcessingState;
  
  // Data flow
  imageData: string | null;
  extractedText: string | null;
  parsedData: PartialManifiestoData | null;
  finalData: ManifiestoData | null;
  
  // UI state
  isProcessing: boolean;
  error: string | null;
  
  // Recent sessions for quick access
  recentSessions: ScannerSession[];
  
  // Actions
  startNewSession: () => void;
  setImageData: (imageData: string) => void;
  setExtractedText: (text: string) => void;
  setParsedData: (data: PartialManifiestoData) => void;
  setFinalData: (data: ManifiestoData) => void;
  navigateToStep: (step: ScannerStep) => void;
  completeStep: (step: ScannerStep) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  saveSession: () => Promise<void>;
  loadSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  resetWorkflow: () => void;
}

// Helper function to calculate progress based on completed steps
const calculateProgress = (completedSteps: Set<ScannerStep>): number => {
  const totalSteps = Object.values(ScannerStep).length;
  return Math.round((completedSteps.size / totalSteps) * 100);
};

// Helper function to determine if navigation to a step is allowed
const canNavigateToStep = (targetStep: ScannerStep, completedSteps: Set<ScannerStep>): boolean => {
  const stepOrder = [
    ScannerStep.IMAGE_UPLOAD,
    ScannerStep.OCR_PROCESSING,
    ScannerStep.DATA_PARSING,
    ScannerStep.DATA_EDITING,
    ScannerStep.REVIEW_SAVE
  ];
  
  const targetIndex = stepOrder.indexOf(targetStep);
  const requiredPreviousSteps = stepOrder.slice(0, targetIndex);
  
  // Can navigate if all previous steps are completed
  return requiredPreviousSteps.every(step => completedSteps.has(step));
};

export const useManifiestoScannerStore = create<ManifiestoScannerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      processingState: {
        currentStep: ScannerStep.IMAGE_UPLOAD,
        completedSteps: new Set(),
        canNavigateToStep: (step: ScannerStep) => {
          const { processingState } = get();
          return canNavigateToStep(step, processingState.completedSteps);
        },
        progress: 0
      },
      imageData: null,
      extractedText: null,
      parsedData: null,
      finalData: null,
      isProcessing: false,
      error: null,
      recentSessions: [],

      // Actions
      startNewSession: () => {
        const sessionId = `session_${Date.now()}`;
        const newSession: ScannerSession = {
          id: sessionId,
          status: EstadoProcesamiento.PENDIENTE,
          startedAt: new Date(),
          lastModified: new Date()
        };

        set({
          currentSession: newSession,
          processingState: {
            currentStep: ScannerStep.IMAGE_UPLOAD,
            completedSteps: new Set(),
            canNavigateToStep: (step: ScannerStep) => {
              const { processingState } = get();
              return canNavigateToStep(step, processingState.completedSteps);
            },
            progress: 0
          },
          imageData: null,
          extractedText: null,
          parsedData: null,
          finalData: null,
          error: null
        });
      },

      setImageData: (imageData: string) => {
        set(state => ({
          imageData,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            imageData,
            lastModified: new Date()
          } : null
        }));
      },

      setExtractedText: (text: string) => {
        set(state => ({
          extractedText: text,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            extractedText: text,
            lastModified: new Date()
          } : null
        }));
      },

      setParsedData: (data: PartialManifiestoData) => {
        set(state => ({
          parsedData: data,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            parsedData: data,
            lastModified: new Date()
          } : null
        }));
      },

      setFinalData: (data: ManifiestoData) => {
        set(state => ({
          finalData: data,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            finalData: data,
            status: EstadoProcesamiento.COMPLETADO,
            lastModified: new Date()
          } : null
        }));
      },

      navigateToStep: (step: ScannerStep) => {
        const { processingState } = get();
        
        if (canNavigateToStep(step, processingState.completedSteps)) {
          set(state => ({
            processingState: {
              ...state.processingState,
              currentStep: step
            },
            error: null
          }));
        }
      },

      completeStep: (step: ScannerStep) => {
        set(state => {
          const newCompletedSteps = new Set(state.processingState.completedSteps);
          newCompletedSteps.add(step);
          
          const progress = calculateProgress(newCompletedSteps);
          
          return {
            processingState: {
              ...state.processingState,
              completedSteps: newCompletedSteps,
              progress
            }
          };
        });
      },

      setProcessing: (isProcessing: boolean) => {
        set(state => ({
          isProcessing,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            status: isProcessing ? EstadoProcesamiento.PROCESANDO : state.currentSession.status,
            lastModified: new Date()
          } : null
        }));
      },

      setError: (error: string | null) => {
        set(state => ({
          error,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            status: error ? EstadoProcesamiento.ERROR : state.currentSession.status,
            lastModified: new Date()
          } : null
        }));
      },

      saveSession: async () => {
        const { currentSession, recentSessions } = get();
        
        if (!currentSession) return;

        try {
          // Update recent sessions
          const updatedRecentSessions = [
            currentSession,
            ...recentSessions.filter(s => s.id !== currentSession.id)
          ].slice(0, 10); // Keep only last 10 sessions

          set({
            recentSessions: updatedRecentSessions
          });

        } catch (error) {
          console.error('Error saving session:', error);
          set({ error: 'Error al guardar la sesión' });
        }
      },

      loadSession: (sessionId: string) => {
        const { recentSessions } = get();
        const session = recentSessions.find(s => s.id === sessionId);
        
        if (session) {
          // Determine current step based on available data
          let currentStep = ScannerStep.IMAGE_UPLOAD;
          const completedSteps = new Set<ScannerStep>();
          
          if (session.imageData) {
            completedSteps.add(ScannerStep.IMAGE_UPLOAD);
            currentStep = ScannerStep.OCR_PROCESSING;
          }
          
          if (session.extractedText) {
            completedSteps.add(ScannerStep.OCR_PROCESSING);
            currentStep = ScannerStep.DATA_PARSING;
          }
          
          if (session.parsedData) {
            completedSteps.add(ScannerStep.DATA_PARSING);
            currentStep = ScannerStep.DATA_EDITING;
          }
          
          if (session.finalData) {
            completedSteps.add(ScannerStep.DATA_EDITING);
            currentStep = ScannerStep.REVIEW_SAVE;
          }

          set({
            currentSession: session,
            imageData: session.imageData || null,
            extractedText: session.extractedText || null,
            parsedData: session.parsedData || null,
            finalData: session.finalData || null,
            processingState: {
              currentStep,
              completedSteps,
              canNavigateToStep: (step: ScannerStep) => canNavigateToStep(step, completedSteps),
              progress: calculateProgress(completedSteps)
            },
            error: null
          });
        }
      },

      clearCurrentSession: () => {
        set({
          currentSession: null,
          imageData: null,
          extractedText: null,
          parsedData: null,
          finalData: null,
          error: null
        });
      },

      resetWorkflow: () => {
        set(state => ({
          processingState: {
            currentStep: ScannerStep.IMAGE_UPLOAD,
            completedSteps: new Set(),
            canNavigateToStep: (step: ScannerStep) => canNavigateToStep(step, new Set()),
            progress: 0
          },
          imageData: null,
          extractedText: null,
          parsedData: null,
          finalData: null,
          error: null,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            status: EstadoProcesamiento.PENDIENTE,
            lastModified: new Date()
          } : null
        }));
      }
    }),
    {
      name: 'manifiesto-scanner-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentSessions: state.recentSessions
      }),
    }
  )
);