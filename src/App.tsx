/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Camera, 
  FileText, 
  Printer,
  Info,
  Save,
  ChevronRight,
  Loader2,
  RotateCw,
  RefreshCw,
  GripVertical
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---

interface MaterialProperties {
  plmNo: string;
  sapNo: string;
  legacyNo: string;
  description: string;
  composition: string;
}

interface Photo {
  id: string;
  url: string;
  rotation: number;
}

interface Method1Row {
  id: string;
  colorCode: string;
  length: {
    before: number;
    afterCut: number;
    afterTest: number;
  };
  width: {
    before: number;
    afterCut: number;
    afterTest: number;
  };
  photos: Photo[]; 
}

interface Method2Row {
  id: string;
  colorCode: string;
  length: {
    before: number;
    afterCut: number;
    afterStep1: number;
    afterStep2: number;
  };
  width: {
    before: number;
    afterCut: number;
    afterStep1: number;
    afterStep2: number;
  };
  photosStep1: Photo[];
  photosStep2: Photo[];
}

interface ReportData {
  title: string;
  companyName: string;
  companyAddress: string;
  logo: string;
  date: string;
  creator: string;
  materialProperties: MaterialProperties;
  method1: {
    parameter: string;
    rows: Method1Row[];
  };
  method2: {
    parameter: string;
    rows: Method2Row[];
  };
  remarks: string;
}

// --- Constants & Defaults ---

const DEFAULT_REPORT: ReportData = {
  title: "Fabric Shrinkage Report",
  companyName: "Triumph International (Vietnam) Ltd",
  companyAddress: "No. 2, Street No. 3, Song Than 1 Industrial Zone, Binh Duong, Vietnam",
  logo: "https://i.postimg.cc/7P0JJwSR/Triumphlogo-Red-RGB-LO-2.png",
  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  creator: "Ni Vo",
  materialProperties: {
    plmNo: "F0034542 /43/44/45/46",
    sapNo: "R0132206",
    legacyNo: "05154",
    description: "ELASTIC CIRCULAR KNITTED PLAIN",
    composition: "70% PA Pre, 30% EL"
  },
  method1: {
    parameter: "Heat press parameter 180 degrees, 30 seconds, 4 bar, only 1 layer (without glue)",
    rows: [
      {
        id: '1',
        colorCode: "04",
        length: { before: 30, afterCut: 30, afterTest: 29.3 },
        width: { before: 30, afterCut: 30, afterTest: 29.0 },
        photos: []
      }
    ]
  },
  method2: {
    parameter: "Heat press parameter 180 degrees, 30 seconds, 4 bar with glue (double layer main item) with LN + glue + outer, 2 steps",
    rows: [
      {
        id: '1',
        colorCode: "04",
        length: { before: 30, afterCut: 30, afterStep1: 29.6, afterStep2: 29.5 },
        width: { before: 30, afterCut: 30, afterStep1: 29.3, afterStep2: 29.2 },
        photosStep1: [],
        photosStep2: []
      }
    ]
  },
  remarks: "Heat press parameter 180 degrees, 30 seconds, 4 bar, only 1 layer (without glue)"
};

// --- Helper Functions ---

const calculateShrinkage = (before: number, after: number) => {
  if (before === 0) return 0;
  return ((before - after) / before) * 100;
};

const calculateDiff = (before: number, after: number) => {
  return before - after;
};

// --- Components ---

// --- Sortable Photo Component ---

interface SortablePhotoProps {
  photo: Photo;
  label: string;
  isEditing: boolean;
  onRotate: () => void;
  onDelete: () => void;
  onZoom: () => void;
}

const SortablePhoto = ({ photo, label, isEditing, onRotate, onDelete, onZoom }: SortablePhotoProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2 relative group">
      <div className="aspect-square bg-stone-200 rounded border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden relative">
        <div className="relative w-full h-full group">
          <img 
            src={photo.url} 
            className="w-full h-full object-cover cursor-zoom-in transition-transform" 
            style={{ transform: `rotate(${photo.rotation}deg)` }}
            alt={label} 
            referrerPolicy="no-referrer" 
            onClick={onZoom}
          />
          {isEditing && (
            <>
              <div 
                {...attributes} 
                {...listeners}
                className="absolute top-1 left-1 bg-stone-900/50 text-white p-1 rounded cursor-grab active:cursor-grabbing z-10"
                title="Drag to reorder"
              >
                <GripVertical className="w-3 h-3" />
              </div>
              <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRotate(); }}
                  className="bg-stone-900 text-white p-1 rounded hover:bg-stone-700"
                  title="Rotate"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-[9px] text-center font-bold text-stone-500 uppercase leading-tight">{label} (cm)</p>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<ReportData>(DEFAULT_REPORT);
  const [isEditing, setIsEditing] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('shrinkage_report_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic migration for old photo format if needed
        const migrateRow1 = (r: any) => ({
          ...r,
          photos: r.photos.map((p: any) => typeof p === 'string' ? { url: p, rotation: 0 } : p)
        });
        const migrateRow2 = (r: any) => ({
          ...r,
          photosStep1: r.photosStep1.map((p: any) => typeof p === 'string' ? { url: p, rotation: 0 } : p),
          photosStep2: r.photosStep2.map((p: any) => typeof p === 'string' ? { url: p, rotation: 0 } : p)
        });

        setData({
          ...parsed,
          method1: { ...parsed.method1, rows: parsed.method1.rows.map(migrateRow1) },
          method2: { ...parsed.method2, rows: parsed.method2.rows.map(migrateRow2) }
        });
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent, method: 1 | 2, rowId: string, step: 1 | 2 | null) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setData((prev) => {
        const updateRows = (rows: any[]) => rows.map(r => {
          if (r.id === rowId) {
            if (method === 1) {
              const oldIndex = r.photos.findIndex((p: any) => p.id === active.id);
              const newIndex = r.photos.findIndex((p: any) => p.id === over.id);
              return { ...r, photos: arrayMove(r.photos, oldIndex, newIndex) };
            } else {
              const photoKey = step === 1 ? 'photosStep1' : 'photosStep2';
              const oldIndex = r[photoKey].findIndex((p: any) => p.id === active.id);
              const newIndex = r[photoKey].findIndex((p: any) => p.id === over.id);
              return { ...r, [photoKey]: arrayMove(r[photoKey], oldIndex, newIndex) };
            }
          }
          return r;
        });

        if (method === 1) {
          return { ...prev, method1: { ...prev.method1, rows: updateRows(prev.method1.rows) } };
        } else {
          return { ...prev, method2: { ...prev.method2, rows: updateRows(prev.method2.rows) } };
        }
      });
    }
  };

  const saveDraft = () => {
    localStorage.setItem('shrinkage_report_draft', JSON.stringify(data));
    alert("Draft saved successfully!");
  };

  const resetReport = () => {
    if (window.confirm("Are you sure you want to reset the report to default? All unsaved changes will be lost.")) {
      setData(DEFAULT_REPORT);
      localStorage.removeItem('shrinkage_report_draft');
    }
  };

  const handlePrint = () => {
    setIsEditing(false);
    // Small delay to allow state update to reflect in DOM before print dialog
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const element = reportRef.current;
      
      // Ensure images are loaded
      const images = element.getElementsByTagName('img');
      const promises = Array.from(images).map((img: HTMLImageElement) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(promises);

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('report-container');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.margin = '0';
            el.style.padding = '20px';
            el.style.width = '1200px';
          }
        }
      });
      
      let imgData;
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.92);
      } catch (e) {
        console.error('Canvas toDataURL failed:', e);
        throw new Error('Security restriction: External images without CORS support are blocking PDF generation.');
      }
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${data.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      const message = error.message || 'Unknown error';
      if (window.confirm(`PDF generation failed: ${message}\n\nWould you like to use the browser print option instead?`)) {
        handlePrint();
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addMethod1Row = () => {
    const newRow: Method1Row = {
      id: Math.random().toString(36).substr(2, 9),
      colorCode: "",
      length: { before: 30, afterCut: 30, afterTest: 30 },
      width: { before: 30, afterCut: 30, afterTest: 30 },
      photos: []
    };
    setData(prev => ({
      ...prev,
      method1: { ...prev.method1, rows: [...prev.method1.rows, newRow] }
    }));
  };

  const removeMethod1Row = (id: string) => {
    setData(prev => ({
      ...prev,
      method1: { ...prev.method1, rows: prev.method1.rows.filter(r => r.id !== id) }
    }));
  };

  const updateMethod1Row = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      method1: {
        ...prev.method1,
        rows: prev.method1.rows.map(r => {
          if (r.id === id) {
            const parts = field.split('.');
            if (parts.length === 2) {
              return { ...r, [parts[0]]: { ...(r as any)[parts[0]], [parts[1]]: value } };
            }
            return { ...r, [field]: value };
          }
          return r;
        })
      }
    }));
  };

  const addMethod2Row = () => {
    const newRow: Method2Row = {
      id: Math.random().toString(36).substr(2, 9),
      colorCode: "",
      length: { before: 30, afterCut: 30, afterStep1: 30, afterStep2: 30 },
      width: { before: 30, afterCut: 30, afterStep1: 30, afterStep2: 30 },
      photosStep1: [],
      photosStep2: []
    };
    setData(prev => ({
      ...prev,
      method2: { ...prev.method2, rows: [...prev.method2.rows, newRow] }
    }));
  };

  const removeMethod2Row = (id: string) => {
    setData(prev => ({
      ...prev,
      method2: { ...prev.method2, rows: prev.method2.rows.filter(r => r.id !== id) }
    }));
  };

  const updateMethod2Row = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      method2: {
        ...prev.method2,
        rows: prev.method2.rows.map(r => {
          if (r.id === id) {
            const parts = field.split('.');
            if (parts.length === 2) {
              return { ...r, [parts[0]]: { ...(r as any)[parts[0]], [parts[1]]: value } };
            }
            return { ...r, [field]: value };
          }
          return r;
        })
      }
    }));
  };

  const handlePhotoUpload = (method: 1 | 2, rowId: string, step: 1 | 2 | null, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const photoObj: Photo = { 
            id: Math.random().toString(36).substr(2, 9),
            url: base64, 
            rotation: 0 
          };
          if (method === 1) {
            setData(prev => ({
              ...prev,
              method1: {
                ...prev.method1,
                rows: prev.method1.rows.map(r => r.id === rowId ? { ...r, photos: [...r.photos, photoObj].slice(0, 4) } : r)
              }
            }));
          } else {
            setData(prev => ({
              ...prev,
              method2: {
                ...prev.method2,
                rows: prev.method2.rows.map(r => {
                  if (r.id === rowId) {
                    if (step === 1) return { ...r, photosStep1: [...r.photosStep1, photoObj].slice(0, 4) };
                    return { ...r, photosStep2: [...r.photosStep2, photoObj].slice(0, 4) };
                  }
                  return r;
                })
              }
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const rotatePhoto = (method: 1 | 2, rowId: string, step: 1 | 2 | null, photoIdx: number) => {
    if (method === 1) {
      setData(prev => ({
        ...prev,
        method1: {
          ...prev.method1,
          rows: prev.method1.rows.map(r => r.id === rowId ? { 
            ...r, 
            photos: r.photos.map((p, i) => i === photoIdx ? { ...p, rotation: (p.rotation + 90) % 360 } : p) 
          } : r)
        }
      }));
    } else {
      setData(prev => ({
        ...prev,
        method2: {
          ...prev.method2,
          rows: prev.method2.rows.map(r => {
            if (r.id === rowId) {
              if (step === 1) return { ...r, photosStep1: r.photosStep1.map((p, i) => i === photoIdx ? { ...p, rotation: (p.rotation + 90) % 360 } : p) };
              return { ...r, photosStep2: r.photosStep2.map((p, i) => i === photoIdx ? { ...p, rotation: (p.rotation + 90) % 360 } : p) };
            }
            return r;
          })
        }
      }));
    }
  };

  const avgShrinkageM1Length = data.method1.rows.length > 0 
    ? data.method1.rows.reduce((acc, r) => acc + calculateShrinkage(r.length.before, r.length.afterTest), 0) / data.method1.rows.length 
    : 0;

  const avgShrinkageM1Width = data.method1.rows.length > 0 
    ? data.method1.rows.reduce((acc, r) => acc + calculateShrinkage(r.width.before, r.width.afterTest), 0) / data.method1.rows.length 
    : 0;

  const avgShrinkageM2Length = data.method2.rows.length > 0
    ? data.method2.rows.reduce((acc, r) => acc + calculateShrinkage(r.length.before, r.length.afterStep2), 0) / data.method2.rows.length
    : 0;

  const avgShrinkageM2Width = data.method2.rows.length > 0
    ? data.method2.rows.reduce((acc, r) => acc + calculateShrinkage(r.width.before, r.width.afterStep2), 0) / data.method2.rows.length
    : 0;

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 sm:px-6 lg:px-8 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200 sticky top-4 z-50 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold tracking-tight">Report Builder</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={saveDraft}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button 
                onClick={resetReport}
                className="flex items-center gap-2 px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-300 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isEditing 
                  ? 'bg-stone-900 text-white hover:bg-stone-800' 
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                {isEditing ? <Printer className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isEditing ? 'Preview Report' : 'Edit Mode'}
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button 
                onClick={exportToPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div 
          ref={reportRef}
          id="report-container" 
          className={`bg-white shadow-2xl rounded-sm overflow-hidden border border-stone-300 print:shadow-none print:border-none ${!isEditing ? 'cursor-default' : ''}`}
        >
          
          {/* Header Section */}
          <header className="p-8 border-b border-stone-200">
            <div className="flex justify-between items-start">
              <div className="flex gap-6 items-center">
                <div className="relative group">
                  <img 
                    src={data.logo} 
                    alt="Company Logo" 
                    className="h-16 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded">
                      <Upload className="w-6 h-6 text-white" />
                      <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                    </label>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-700 leading-tight">
                    {isEditing ? (
                      <input 
                        className="border-b border-transparent hover:border-stone-300 focus:border-red-500 focus:outline-none w-full"
                        value={data.companyName}
                        onChange={e => setData({...data, companyName: e.target.value})}
                      />
                    ) : data.companyName}
                  </h2>
                  <p className="text-xs text-stone-500 max-w-md mt-1 italic">
                    {isEditing ? (
                      <textarea 
                        className="border-b border-transparent hover:border-stone-300 focus:border-red-500 focus:outline-none w-full resize-none"
                        value={data.companyAddress}
                        onChange={e => setData({...data, companyAddress: e.target.value})}
                        rows={2}
                      />
                    ) : data.companyAddress}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs space-y-1">
                <div className="flex justify-end gap-2">
                  <span className="font-semibold text-stone-400 uppercase tracking-wider">Date:</span>
                  <span className="font-medium">
                    {isEditing ? (
                      <input 
                        type="text"
                        className="border-b border-transparent hover:border-stone-300 focus:border-red-500 focus:outline-none text-right"
                        value={data.date}
                        onChange={e => setData({...data, date: e.target.value})}
                      />
                    ) : data.date}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="font-semibold text-stone-400 uppercase tracking-wider">Creator:</span>
                  <span className="font-medium">
                    {isEditing ? (
                      <input 
                        type="text"
                        className="border-b border-transparent hover:border-stone-300 focus:border-red-500 focus:outline-none text-right"
                        value={data.creator}
                        onChange={e => setData({...data, creator: e.target.value})}
                      />
                    ) : data.creator}
                  </span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-black text-center mt-10 mb-4 tracking-tight uppercase border-y-2 border-stone-900 py-2">
              {isEditing ? (
                <input 
                  className="text-center w-full focus:outline-none"
                  value={data.title}
                  onChange={e => setData({...data, title: e.target.value})}
                />
              ) : data.title}
            </h1>
          </header>

          <main className="p-8 space-y-10">
            
            {/* 1. Material Properties */}
            <section id="material" className="print-no-break">
              <h3 className="text-sm font-bold bg-stone-100 px-3 py-1 border-l-4 border-stone-900 mb-3 uppercase tracking-widest">
                1. Material Properties
              </h3>
              <div className="overflow-x-auto relative group">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-stone-900/10 p-1 rounded-l md:hidden pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-stone-500 animate-pulse" />
                </div>
                <table className="w-full border-collapse border border-stone-300 text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="border border-stone-300 p-2 text-left font-bold uppercase">PLM No.</th>
                      <th className="border border-stone-300 p-2 text-left font-bold uppercase">SAP No.</th>
                      <th className="border border-stone-300 p-2 text-left font-bold uppercase">Legacy No.</th>
                      <th className="border border-stone-300 p-2 text-left font-bold uppercase">Description</th>
                      <th className="border border-stone-300 p-2 text-left font-bold uppercase">Composition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-stone-300 p-2">
                        {isEditing ? (
                          <input 
                            className="w-full focus:outline-none"
                            value={data.materialProperties.plmNo}
                            onChange={e => setData({...data, materialProperties: {...data.materialProperties, plmNo: e.target.value}})}
                          />
                        ) : data.materialProperties.plmNo}
                      </td>
                      <td className="border border-stone-300 p-2">
                        {isEditing ? (
                          <input 
                            className="w-full focus:outline-none"
                            value={data.materialProperties.sapNo}
                            onChange={e => setData({...data, materialProperties: {...data.materialProperties, sapNo: e.target.value}})}
                          />
                        ) : data.materialProperties.sapNo}
                      </td>
                      <td className="border border-stone-300 p-2">
                        {isEditing ? (
                          <input 
                            className="w-full focus:outline-none"
                            value={data.materialProperties.legacyNo}
                            onChange={e => setData({...data, materialProperties: {...data.materialProperties, legacyNo: e.target.value}})}
                          />
                        ) : data.materialProperties.legacyNo}
                      </td>
                      <td className="border border-stone-300 p-2">
                        {isEditing ? (
                          <input 
                            className="w-full focus:outline-none"
                            value={data.materialProperties.description}
                            onChange={e => setData({...data, materialProperties: {...data.materialProperties, description: e.target.value}})}
                          />
                        ) : data.materialProperties.description}
                      </td>
                      <td className="border border-stone-300 p-2">
                        {isEditing ? (
                          <input 
                            className="w-full focus:outline-none"
                            value={data.materialProperties.composition}
                            onChange={e => setData({...data, materialProperties: {...data.materialProperties, composition: e.target.value}})}
                          />
                        ) : data.materialProperties.composition}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2. Method 1 */}
            <section id="method1" className="print-no-break">
              <div className="flex justify-between items-center bg-stone-900 text-white px-4 py-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest flex-1">
                  Method 1: {isEditing ? (
                    <textarea 
                      className="bg-transparent border-b border-white/30 focus:border-white focus:outline-none ml-2 w-full text-xs"
                      value={data.method1.parameter}
                      onChange={e => setData({...data, method1: {...data.method1, parameter: e.target.value}})}
                      rows={2}
                    />
                  ) : <span className="ml-2">{data.method1.parameter}</span>}
                </h3>
                {isEditing && (
                  <button onClick={addMethod1Row} className="text-xs flex items-center gap-1 hover:text-red-400 transition-colors">
                    <Plus className="w-3 h-3" /> Add Color
                  </button>
                )}
              </div>

              <div className="overflow-x-auto relative group">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-stone-900/10 p-1 rounded-l md:hidden pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-stone-500 animate-pulse" />
                </div>
                <table className="w-full border-collapse border border-stone-300 text-[10px] min-w-[800px]">
                  <thead>
                    <tr className="bg-stone-100">
                      <th rowSpan={2} className="border border-stone-300 p-1 font-bold uppercase">Color Code</th>
                      <th colSpan={5} className="border border-stone-300 p-1 font-bold uppercase bg-blue-50">Length/Warp along grandline (cm)</th>
                      <th colSpan={5} className="border border-stone-300 p-1 font-bold uppercase bg-green-50">Width/Weft cross grandline (cm)</th>
                      {isEditing && <th rowSpan={2} className="border border-stone-300 p-1"></th>}
                    </tr>
                    <tr className="bg-stone-50">
                      <th className="border border-stone-300 p-1 font-semibold">Before</th>
                      <th className="border border-stone-300 p-1 font-semibold">After cut</th>
                      <th className="border border-stone-300 p-1 font-semibold">After test</th>
                      <th className="border border-stone-300 p-1 font-semibold">(+/-)</th>
                      <th className="border border-stone-300 p-1 font-semibold">Shrinkage %</th>
                      <th className="border border-stone-300 p-1 font-semibold">Before</th>
                      <th className="border border-stone-300 p-1 font-semibold">After cut</th>
                      <th className="border border-stone-300 p-1 font-semibold">After test</th>
                      <th className="border border-stone-300 p-1 font-semibold">(+/-)</th>
                      <th className="border border-stone-300 p-1 font-semibold">Shrinkage %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.method1.rows.map(row => (
                      <tr key={row.id} className="hover:bg-stone-50 transition-colors">
                        <td className="border border-stone-300 p-1 text-center font-bold">
                          {isEditing ? (
                            <input 
                              className="w-full text-center focus:outline-none bg-transparent"
                              value={row.colorCode}
                              onChange={e => updateMethod1Row(row.id, 'colorCode', e.target.value)}
                            />
                          ) : row.colorCode}
                        </td>
                        {/* Length */}
                        <td className="border border-stone-300 p-1 text-center">
                          {isEditing ? (
                            <input type="number" className="w-12 text-center focus:outline-none bg-transparent" value={row.length.before} onChange={e => updateMethod1Row(row.id, 'length.before', parseFloat(e.target.value))} />
                          ) : row.length.before}
                        </td>
                        <td className="border border-stone-300 p-1 text-center">
                          {isEditing ? (
                            <input type="number" className="w-12 text-center focus:outline-none bg-transparent" value={row.length.afterCut} onChange={e => updateMethod1Row(row.id, 'length.afterCut', parseFloat(e.target.value))} />
                          ) : row.length.afterCut}
                        </td>
                        <td className="border border-stone-300 p-1 text-center font-medium text-blue-700">
                          {isEditing ? (
                            <input type="number" className="w-12 text-center focus:outline-none bg-transparent" value={row.length.afterTest} onChange={e => updateMethod1Row(row.id, 'length.afterTest', parseFloat(e.target.value))} />
                          ) : row.length.afterTest}
                        </td>
                        <td className="border border-stone-300 p-1 text-center text-stone-500">
                          {calculateDiff(row.length.before, row.length.afterTest).toFixed(1)}
                        </td>
                        <td className="border border-stone-300 p-1 text-center font-bold">
                          {calculateShrinkage(row.length.before, row.length.afterTest).toFixed(2)}%
                        </td>
                        {/* Width */}
                        <td className="border border-stone-300 p-1 text-center">
                          {isEditing ? (
                            <input type="number" className="w-12 text-center focus:outline-none bg-transparent" value={row.width.before} onChange={e => updateMethod1Row(row.id, 'width.before', parseFloat(e.target.value))} />
                          ) : row.width.before}
                        </td>
                        <td className="border border-stone-300 p-1 text-center">
                          {isEditing ? (
                            <input type="number" className="w-12 text-center focus:outline-none bg-transparent" value={row.width.afterCut} onChange={e => updateMethod1Row(row.id, 'width.afterCut', parseFloat(e.target.value))} />
                          ) : row.width.afterCut}
                        </td>
                        <td className="border border-stone-300 p-1 text-center font-medium text-green-700">
                          {isEditing ? (
                            <input type="number" className="w-12 text-center focus:outline-none bg-transparent" value={row.width.afterTest} onChange={e => updateMethod1Row(row.id, 'width.afterTest', parseFloat(e.target.value))} />
                          ) : row.width.afterTest}
                        </td>
                        <td className="border border-stone-300 p-1 text-center text-stone-500">
                          {calculateDiff(row.width.before, row.width.afterTest).toFixed(1)}
                        </td>
                        <td className="border border-stone-300 p-1 text-center font-bold">
                          {calculateShrinkage(row.width.before, row.width.afterTest).toFixed(2)}%
                        </td>
                        {isEditing && (
                          <td className="border border-stone-300 p-1 text-center">
                            <button onClick={() => removeMethod1Row(row.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-stone-900 text-white font-bold">
                      <td className="border border-stone-300 p-2 text-center uppercase">Average</td>
                      <td colSpan={5} className="border border-stone-300 p-2 text-center">
                        Length/Warp: {avgShrinkageM1Length.toFixed(2)}%
                      </td>
                      <td colSpan={5} className="border border-stone-300 p-2 text-center">
                        Width/Weft: {avgShrinkageM1Width.toFixed(2)}%
                      </td>
                      {isEditing && <td className="border border-stone-300"></td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Method 1 Photos */}
              <div className="mt-6 space-y-8 print-no-break">
                {data.method1.rows.map(row => (
                  <div key={row.id} className="border border-stone-200 p-4 rounded-lg bg-stone-50/50 print:bg-white print:p-0 print:border-none">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold uppercase text-stone-600">Photos for Color {row.colorCode || '??'}</h4>
                      {isEditing && (
                        <label className="flex items-center gap-2 px-3 py-1 bg-white border border-stone-300 rounded text-[10px] font-medium cursor-pointer hover:bg-stone-100 transition-colors">
                          <Camera className="w-3 h-3" /> Upload Photos
                          <input type="file" multiple className="hidden" onChange={e => handlePhotoUpload(1, row.id, null, e)} accept="image/*" />
                        </label>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, 1, row.id, null)}
                      >
                        <SortableContext 
                          items={row.photos.map(p => p.id)}
                          strategy={rectSortingStrategy}
                        >
                          {[
                            "Before cut along grandline",
                            "Before cut cross grandline",
                            "After heatpress along grandline",
                            "After heatpress cross grandline"
                          ].map((label, idx) => (
                            <React.Fragment key={idx}>
                              {row.photos[idx] ? (
                                <SortablePhoto 
                                  photo={row.photos[idx]}
                                  label={label}
                                  isEditing={isEditing}
                                  onRotate={() => rotatePhoto(1, row.id, null, idx)}
                                  onDelete={() => setData(prev => ({
                                    ...prev,
                                    method1: {
                                      ...prev.method1,
                                      rows: prev.method1.rows.map(r => r.id === row.id ? { ...r, photos: r.photos.filter((_, i) => i !== idx) } : r)
                                    }
                                  }))}
                                  onZoom={() => setZoomedImage(row.photos[idx].url)}
                                />
                              ) : (
                                <div className="space-y-2">
                                  <div className="aspect-square bg-stone-200 rounded border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden relative group">
                                    <div className="text-center p-4">
                                      <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                                      <span className="text-[8px] text-stone-500 uppercase font-bold">{idx + 1}</span>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-center font-bold text-stone-500 uppercase leading-tight">{label} (cm)</p>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Method 2 */}
            <section id="method2" className="print-no-break">
              <div className="flex justify-between items-center bg-stone-900 text-white px-4 py-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest flex-1">
                  Method 2: {isEditing ? (
                    <textarea 
                      className="bg-transparent border-b border-white/30 focus:border-white focus:outline-none ml-2 w-full text-xs"
                      value={data.method2.parameter}
                      onChange={e => setData({...data, method2: {...data.method2, parameter: e.target.value}})}
                      rows={2}
                    />
                  ) : <span className="ml-2">{data.method2.parameter}</span>}
                </h3>
                {isEditing && (
                  <button onClick={addMethod2Row} className="text-xs flex items-center gap-1 hover:text-red-400 transition-colors">
                    <Plus className="w-3 h-3" /> Add Color
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Length Table */}
                <div className="overflow-x-auto relative group">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-stone-900/10 p-1 rounded-l md:hidden pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-stone-500 animate-pulse" />
                  </div>
                  <table className="w-full border-collapse border border-stone-300 text-[10px] min-w-[800px]">
                    <thead>
                      <tr className="bg-blue-50">
                        <th colSpan={isEditing ? 11 : 10} className="border border-stone-300 p-1 font-bold uppercase text-blue-900">Length/Warp along grandline (cm)</th>
                      </tr>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-300 p-1 font-bold uppercase">Color Code</th>
                        <th className="border border-stone-300 p-1 font-semibold">Before</th>
                        <th className="border border-stone-300 p-1 font-semibold">After cut</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 1</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S1</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % step1</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 2</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S2</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % step2</th>
                        <th className="border border-stone-300 p-1 font-bold bg-yellow-50">Total Shrink %</th>
                        {isEditing && <th className="border border-stone-300 p-1"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.method2.rows.map(row => (
                        <tr key={row.id} className="hover:bg-stone-50 transition-colors">
                          <td className="border border-stone-300 p-1 text-center font-bold">
                            {isEditing ? (
                              <input className="w-full text-center focus:outline-none bg-transparent" value={row.colorCode} onChange={e => updateMethod2Row(row.id, 'colorCode', e.target.value)} />
                            ) : row.colorCode}
                          </td>
                          <td className="border border-stone-300 p-1 text-center">{row.length.before}</td>
                          <td className="border border-stone-300 p-1 text-center">{row.length.afterCut}</td>
                          <td className="border border-stone-300 p-1 text-center">
                            {isEditing ? (
                              <input type="number" className="w-10 text-center focus:outline-none bg-transparent" value={row.length.afterStep1} onChange={e => updateMethod2Row(row.id, 'length.afterStep1', parseFloat(e.target.value))} />
                            ) : row.length.afterStep1}
                          </td>
                          <td className="border border-stone-300 p-1 text-center text-stone-500">{(row.length.before - row.length.afterStep1).toFixed(1)}</td>
                          <td className="border border-stone-300 p-1 text-center">{calculateShrinkage(row.length.before, row.length.afterStep1).toFixed(2)}%</td>
                          <td className="border border-stone-300 p-1 text-center">
                            {isEditing ? (
                              <input type="number" className="w-10 text-center focus:outline-none bg-transparent" value={row.length.afterStep2} onChange={e => updateMethod2Row(row.id, 'length.afterStep2', parseFloat(e.target.value))} />
                            ) : row.length.afterStep2}
                          </td>
                          <td className="border border-stone-300 p-1 text-center text-stone-500">{(row.length.afterStep1 - row.length.afterStep2).toFixed(1)}</td>
                          <td className="border border-stone-300 p-1 text-center">{calculateShrinkage(row.length.afterStep1, row.length.afterStep2).toFixed(2)}%</td>
                          <td className="border border-stone-300 p-1 text-center font-bold bg-yellow-50/50">{calculateShrinkage(row.length.before, row.length.afterStep2).toFixed(2)}%</td>
                          {isEditing && (
                            <td className="border border-stone-300 p-1 text-center">
                              <button onClick={() => removeMethod2Row(row.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Width Table */}
                <div className="overflow-x-auto relative group">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-stone-900/10 p-1 rounded-l md:hidden pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-stone-500 animate-pulse" />
                  </div>
                  <table className="w-full border-collapse border border-stone-300 text-[10px] min-w-[800px]">
                    <thead>
                      <tr className="bg-green-50">
                        <th colSpan={isEditing ? 11 : 10} className="border border-stone-300 p-1 font-bold uppercase text-green-900">Width/Weft cross grandline (cm)</th>
                      </tr>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-300 p-1 font-bold uppercase">Color Code</th>
                        <th className="border border-stone-300 p-1 font-semibold">Before</th>
                        <th className="border border-stone-300 p-1 font-semibold">After cut</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 1</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S1</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % step1</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 2</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S2</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % step2</th>
                        <th className="border border-stone-300 p-1 font-bold bg-yellow-50">Total Shrink %</th>
                        {isEditing && <th className="border border-stone-300 p-1"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.method2.rows.map(row => (
                        <tr key={row.id} className="hover:bg-stone-50 transition-colors">
                          <td className="border border-stone-300 p-1 text-center font-bold">
                            {isEditing ? (
                              <input className="w-full text-center focus:outline-none bg-transparent" value={row.colorCode} onChange={e => updateMethod2Row(row.id, 'colorCode', e.target.value)} />
                            ) : row.colorCode}
                          </td>
                          <td className="border border-stone-300 p-1 text-center">{row.width.before}</td>
                          <td className="border border-stone-300 p-1 text-center">{row.width.afterCut}</td>
                          <td className="border border-stone-300 p-1 text-center">
                            {isEditing ? (
                              <input type="number" className="w-10 text-center focus:outline-none bg-transparent" value={row.width.afterStep1} onChange={e => updateMethod2Row(row.id, 'width.afterStep1', parseFloat(e.target.value))} />
                            ) : row.width.afterStep1}
                          </td>
                          <td className="border border-stone-300 p-1 text-center text-stone-500">{(row.width.before - row.width.afterStep1).toFixed(1)}</td>
                          <td className="border border-stone-300 p-1 text-center">{calculateShrinkage(row.width.before, row.width.afterStep1).toFixed(2)}%</td>
                          <td className="border border-stone-300 p-1 text-center">
                            {isEditing ? (
                              <input type="number" className="w-10 text-center focus:outline-none bg-transparent" value={row.width.afterStep2} onChange={e => updateMethod2Row(row.id, 'width.afterStep2', parseFloat(e.target.value))} />
                            ) : row.width.afterStep2}
                          </td>
                          <td className="border border-stone-300 p-1 text-center text-stone-500">{(row.width.afterStep1 - row.width.afterStep2).toFixed(1)}</td>
                          <td className="border border-stone-300 p-1 text-center">{calculateShrinkage(row.width.afterStep1, row.width.afterStep2).toFixed(2)}%</td>
                          <td className="border border-stone-300 p-1 text-center font-bold bg-yellow-50/50">{calculateShrinkage(row.width.before, row.width.afterStep2).toFixed(2)}%</td>
                          {isEditing && (
                            <td className="border border-stone-300 p-1 text-center">
                              <button onClick={() => removeMethod2Row(row.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Method 2 Average Row */}
                <div className="overflow-x-auto mt-4">
                  <table className="w-full border-collapse border border-stone-300 text-[10px]">
                    <tbody>
                      <tr className="bg-stone-900 text-white font-bold">
                        <td className="border border-stone-300 p-2 text-center uppercase w-1/4">Average Shrinkage %</td>
                        <td className="border border-stone-300 p-2 text-center w-3/8">
                          Length/Warp along grandline (cm): {avgShrinkageM2Length.toFixed(2)}%
                        </td>
                        <td className="border border-stone-300 p-2 text-center w-3/8">
                          Width/Weft cross grandline (cm): {avgShrinkageM2Width.toFixed(2)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Method 2 Photos */}
                <div className="mt-8 space-y-8 print-no-break">
                  <h3 className="text-xs font-bold uppercase tracking-widest border-b border-stone-300 pb-2">Photo method 2</h3>
                  {data.method2.rows.map(row => (
                    <div key={row.id} className="border border-stone-200 p-4 rounded-lg bg-stone-50/50 print:bg-white print:p-0 print:border-none">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold uppercase text-stone-600">Photos for Color {row.colorCode || '??'}</h4>
                        {isEditing && (
                          <div className="flex gap-2">
                            <label className="flex items-center gap-2 px-3 py-1 bg-white border border-stone-300 rounded text-[10px] font-medium cursor-pointer hover:bg-stone-100 transition-colors">
                              <Camera className="w-3 h-3" /> Step 1 Photos
                              <input type="file" multiple className="hidden" onChange={e => handlePhotoUpload(2, row.id, 1, e)} accept="image/*" />
                            </label>
                            <label className="flex items-center gap-2 px-3 py-1 bg-white border border-stone-300 rounded text-[10px] font-medium cursor-pointer hover:bg-stone-100 transition-colors">
                              <Camera className="w-3 h-3" /> Step 2 Photos
                              <input type="file" multiple className="hidden" onChange={e => handlePhotoUpload(2, row.id, 2, e)} accept="image/*" />
                            </label>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, 2, row.id, 1)}
                        >
                          <SortableContext 
                            items={row.photosStep1.map(p => p.id)}
                            strategy={rectSortingStrategy}
                          >
                            {[
                              "After step 1 along grandline",
                              "After step 1 cross grandline"
                            ].map((label, idx) => (
                              <React.Fragment key={idx}>
                                {row.photosStep1[idx] ? (
                                  <SortablePhoto 
                                    photo={row.photosStep1[idx]}
                                    label={label}
                                    isEditing={isEditing}
                                    onRotate={() => rotatePhoto(2, row.id, 1, idx)}
                                    onDelete={() => setData(prev => ({
                                      ...prev,
                                      method2: {
                                        ...prev.method2,
                                        rows: prev.method2.rows.map(r => r.id === row.id ? { ...r, photosStep1: r.photosStep1.filter((_, i) => i !== idx) } : r)
                                      }
                                    }))}
                                    onZoom={() => setZoomedImage(row.photosStep1[idx].url)}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <div className="aspect-square bg-stone-200 rounded border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden relative group">
                                      <div className="text-center p-4">
                                        <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                                        <span className="text-[8px] text-stone-500 uppercase font-bold">S1-{idx + 1}</span>
                                      </div>
                                    </div>
                                    <p className="text-[9px] text-center font-bold text-stone-500 uppercase leading-tight">{label} (cm)</p>
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </SortableContext>
                        </DndContext>

                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, 2, row.id, 2)}
                        >
                          <SortableContext 
                            items={row.photosStep2.map(p => p.id)}
                            strategy={rectSortingStrategy}
                          >
                            {[
                              "After step 2 along grandline",
                              "After step 2 cross grandline"
                            ].map((label, idx) => (
                              <React.Fragment key={idx}>
                                {row.photosStep2[idx] ? (
                                  <SortablePhoto 
                                    photo={row.photosStep2[idx]}
                                    label={label}
                                    isEditing={isEditing}
                                    onRotate={() => rotatePhoto(2, row.id, 2, idx)}
                                    onDelete={() => setData(prev => ({
                                      ...prev,
                                      method2: {
                                        ...prev.method2,
                                        rows: prev.method2.rows.map(r => r.id === row.id ? { ...r, photosStep2: r.photosStep2.filter((_, i) => i !== idx) } : r)
                                      }
                                    }))}
                                    onZoom={() => setZoomedImage(row.photosStep2[idx].url)}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <div className="aspect-square bg-stone-200 rounded border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden relative group">
                                      <div className="text-center p-4">
                                        <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                                        <span className="text-[8px] text-stone-500 uppercase font-bold">S2-{idx + 1}</span>
                                      </div>
                                    </div>
                                    <p className="text-[9px] text-center font-bold text-stone-500 uppercase leading-tight">{label} (cm)</p>
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Remarks */}
            <section id="remarks" className="print-no-break">
              <h3 className="text-sm font-bold bg-stone-100 px-3 py-1 border-l-4 border-stone-900 mb-3 uppercase tracking-widest">
                5. Remarks
              </h3>
              <div className="p-4 border border-stone-300 bg-stone-50 rounded italic text-xs min-h-[80px]">
                {isEditing ? (
                  <textarea 
                    className="w-full bg-transparent focus:outline-none resize-none"
                    value={data.remarks}
                    onChange={e => setData({...data, remarks: e.target.value})}
                    rows={4}
                  />
                ) : data.remarks}
              </div>
            </section>

          </main>

          {/* Footer */}
          <footer className="p-8 border-t border-stone-200 bg-stone-50/50 flex justify-between items-end print:bg-white print:border-none">
            <div className="space-y-4">
              <div className="w-48 border-b border-stone-900 h-10"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Tested By</p>
            </div>
            <div className="space-y-4 text-right">
              <div className="w-48 border-b border-stone-900 h-10 ml-auto"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Approved By</p>
            </div>
          </footer>
        </div>

        {/* Floating Help/Info */}
        <div className="mt-8 flex justify-center gap-6 text-[10px] text-stone-400 font-medium uppercase tracking-widest">
          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Auto-calculating shrinkage %</span>
          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Standard 30cm samples</span>
          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> ISO 9001 Compliant</span>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            className="max-w-full max-h-full object-contain rounded shadow-2xl" 
            alt="Zoomed" 
            referrerPolicy="no-referrer"
          />
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
            <Plus className="w-8 h-8 rotate-45" />
          </button>
        </div>
      )}
    </div>
  );
}
