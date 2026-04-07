import React, { useState, useCallback } from 'react';
import { MessageSquare, X, Pencil, Trash2, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Annotation, DataPoint } from '../../types/charts';
import { cn } from '../../utils/cn';

interface AnnotationSystemProps {
  data: DataPoint[];
  annotations: Annotation[];
  currentUserId: string;
  onAdd: (dataPointId: string, note: string) => Promise<void>;
  onUpdate: (annotationId: string, note: string) => Promise<void>;
  onDelete: (annotationId: string) => Promise<void>;
  className?: string;
}

interface AnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
  dataPoint: DataPoint | null;
  existingAnnotation?: Annotation;
  mode: 'add' | 'edit';
}

const AnnotationModal: React.FC<AnnotationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dataPoint,
  existingAnnotation,
  mode,
}) => {
  const [note, setNote] = useState(existingAnnotation?.note ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(note.trim());
      setNote('');
      onClose();
    } catch (error) {
      console.error('Failed to save annotation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !dataPoint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold">
            {mode === 'add' ? 'Add Annotation' : 'Edit Annotation'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Data point: {format(new Date(dataPoint.date), 'MMM dd, yyyy')} · {dataPoint.value}
            </p>
            {dataPoint.notes && (
              <p className="text-xs text-slate-500 mb-2">
                Existing notes: {dataPoint.notes}
              </p>
            )}
            {dataPoint.medications && dataPoint.medications.length > 0 && (
              <p className="text-xs text-slate-500 mb-2">
                Medications: {dataPoint.medications.join(', ')}
              </p>
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your annotation..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-900"
            rows={4}
            disabled={isSubmitting}
            autoFocus
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md disabled:opacity-50"
              disabled={isSubmitting || !note.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AnnotationSystem: React.FC<AnnotationSystemProps> = ({
  data,
  annotations,
  currentUserId,
  onAdd,
  onUpdate,
  onDelete,
  className,
}) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    dataPoint: DataPoint | null;
    annotation?: Annotation;
  }>({
    isOpen: false,
    mode: 'add',
    dataPoint: null,
  });

  const openAddModal = useCallback((dataPoint: DataPoint) => {
    setModalState({
      isOpen: true,
      mode: 'add',
      dataPoint,
    });
  }, []);

  const openEditModal = useCallback((annotation: Annotation) => {
    const dataPoint = data.find(d => d.id === annotation.dataPointId);
    if (!dataPoint) return;

    setModalState({
      isOpen: true,
      mode: 'edit',
      dataPoint,
      annotation,
    });
  }, [data]);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: 'add',
      dataPoint: null,
    });
  }, []);

  const handleAdd = useCallback(
    async (note: string) => {
      if (!modalState.dataPoint?.id) return;
      await onAdd(modalState.dataPoint.id, note);
    },
    [modalState.dataPoint, onAdd]
  );

  const handleUpdate = useCallback(
    async (note: string) => {
      if (!modalState.annotation?.id) return;
      await onUpdate(modalState.annotation.id, note);
    },
    [modalState.annotation, onUpdate]
  );

  const handleSubmit = useCallback(
    async (note: string) => {
      if (modalState.mode === 'add') {
        await handleAdd(note);
      } else {
        await handleUpdate(note);
      }
    },
    [modalState.mode, handleAdd, handleUpdate]
  );

  // Group annotations by data point
  const annotationsByDataPoint = React.useMemo(() => {
    const grouped = new Map<string, Annotation[]>();
    annotations.forEach(annotation => {
      const existing = grouped.get(annotation.dataPointId) || [];
      existing.push(annotation);
      grouped.set(annotation.dataPointId, existing);
    });
    return grouped;
  }, [annotations]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Annotation list */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold">Annotations</h3>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              ({annotations.length})
            </span>
          </div>
        </div>

        {/* Data points with annotations */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {data.map(dataPoint => {
            const pointAnnotations = annotationsByDataPoint.get(dataPoint.id ?? '') || [];
            if (pointAnnotations.length === 0) return null;

            return (
              <div
                key={dataPoint.id ?? dataPoint.date}
                className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">
                      {format(new Date(dataPoint.date), 'MMM dd, yyyy')}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      · {dataPoint.value}
                    </span>
                  </div>

                  <button
                    onClick={() => openAddModal(dataPoint)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                    title="Add annotation"
                  >
                    <Plus className="w-4 h-4 text-teal-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  {pointAnnotations.map(annotation => (
                    <div
                      key={annotation.id}
                      className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{annotation.note}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(annotation.createdAt), 'MMM dd, yyyy HH:mm')}
                            {annotation.userId !== currentUserId && ' · by another user'}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 ml-2">
                          {annotation.userId === currentUserId && (
                            <>
                              <button
                                onClick={() => openEditModal(annotation)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                                title="Edit annotation"
                              >
                                <Pencil className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                              </button>
                              <button
                                onClick={() => onDelete(annotation.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md"
                                title="Delete annotation"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {annotations.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No annotations yet</p>
              <p className="text-sm mt-1">
                Click on a data point in the chart to add an annotation
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Annotation modal */}
      <AnnotationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        dataPoint={modalState.dataPoint}
        existingAnnotation={modalState.annotation}
        mode={modalState.mode}
      />
    </div>
  );
};

interface AnnotationMarkerProps {
  x: number;
  y: number;
  hasAnnotation: boolean;
  onClick: () => void;
}

export const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  x,
  y,
  hasAnnotation,
  onClick,
}) => {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className="cursor-pointer"
      style={{ pointerEvents: 'all' }}
    >
      <circle
        r="8"
        fill={hasAnnotation ? '#0d9488' : 'white'}
        stroke={hasAnnotation ? '#0d9488' : '#64748b'}
        strokeWidth="2"
        className="hover:fill-teal-100 dark:hover:fill-teal-900 transition-colors"
      />
      {hasAnnotation && (
        <>
          <circle cx="0" cy="-2" r="2" fill="white" />
          <circle cx="2" cy="0" r="2" fill="white" />
          <circle cx="-2" cy="0" r="2" fill="white" />
        </>
      )}
      <title>{hasAnnotation ? 'Has annotation' : 'Add annotation'}</title>
    </g>
  );
};
