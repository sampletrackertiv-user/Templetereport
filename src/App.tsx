/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Camera, 
  FileText, 
  Printer,
  Info,
  Save
} from 'lucide-react';

// --- Types ---

interface MaterialProperties {
  plmNo: string;
  sapNo: string;
  legacyNo: string;
  description: string;
  composition: string;
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
  photos: string[]; // base64 strings
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
  photosStep1: string[];
  photosStep2: string[];
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
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Triumph_International_Logo.svg/2560px-Triumph_International_Logo.svg.png",
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

export default function App() {
  const [data, setData] = useState<ReportData>(DEFAULT_REPORT);
  const [isEditing, setIsEditing] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          if (method === 1) {
            setData(prev => ({
              ...prev,
              method1: {
                ...prev.method1,
                rows: prev.method1.rows.map(r => r.id === rowId ? { ...r, photos: [...r.photos, base64].slice(0, 4) } : r)
              }
            }));
          } else {
            setData(prev => ({
              ...prev,
              method2: {
                ...prev.method2,
                rows: prev.method2.rows.map(r => {
                  if (r.id === rowId) {
                    if (step === 1) return { ...r, photosStep1: [...r.photosStep1, base64].slice(0, 4) };
                    return { ...r, photosStep2: [...r.photosStep2, base64].slice(0, 4) };
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200 sticky top-4 z-50">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-bold tracking-tight">Report Builder</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isEditing 
                ? 'bg-stone-900 text-white hover:bg-stone-800' 
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
              {isEditing ? 'Preview Report' : 'Edit Mode'}
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div id="report-container" className={`bg-white shadow-2xl rounded-sm overflow-hidden border border-stone-300 print:shadow-none print:border-none ${!isEditing ? 'cursor-default' : ''}`}>
          
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
            <section>
              <h3 className="text-sm font-bold bg-stone-100 px-3 py-1 border-l-4 border-stone-900 mb-3 uppercase tracking-widest">
                1. Material Properties
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-stone-300 text-xs">
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
            <section>
              <div className="flex justify-between items-center bg-stone-900 text-white px-4 py-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  Method 1: {isEditing ? (
                    <input 
                      className="bg-transparent border-b border-white/30 focus:border-white focus:outline-none ml-2 w-2/3"
                      value={data.method1.parameter}
                      onChange={e => setData({...data, method1: {...data.method1, parameter: e.target.value}})}
                    />
                  ) : data.method1.parameter}
                </h3>
                {isEditing && (
                  <button onClick={addMethod1Row} className="text-xs flex items-center gap-1 hover:text-red-400 transition-colors">
                    <Plus className="w-3 h-3" /> Add Color
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-stone-300 text-[10px]">
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
              <div className="mt-6 space-y-8">
                {data.method1.rows.map(row => (
                  <div key={row.id} className="border border-stone-200 p-4 rounded-lg bg-stone-50/50">
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
                      {[
                        "Before cut along grandline",
                        "Before cut cross grandline",
                        "After heatpress along grandline",
                        "After heatpress cross grandline"
                      ].map((label, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="aspect-square bg-stone-200 rounded border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden relative group">
                            {row.photos[idx] ? (
                              <>
                                <img src={row.photos[idx]} className="w-full h-full object-cover" alt={label} referrerPolicy="no-referrer" />
                                {isEditing && (
                                  <button 
                                    onClick={() => setData(prev => ({
                                      ...prev,
                                      method1: {
                                        ...prev.method1,
                                        rows: prev.method1.rows.map(r => r.id === row.id ? { ...r, photos: r.photos.filter((_, i) => i !== idx) } : r)
                                      }
                                    }))}
                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="text-center p-4">
                                <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                                <span className="text-[8px] text-stone-500 uppercase font-bold">{idx + 1}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-center font-bold text-stone-500 uppercase leading-tight">{label} (cm)</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Method 2 */}
            <section>
              <div className="flex justify-between items-center bg-stone-900 text-white px-4 py-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  Method 2: {isEditing ? (
                    <input 
                      className="bg-transparent border-b border-white/30 focus:border-white focus:outline-none ml-2 w-2/3"
                      value={data.method2.parameter}
                      onChange={e => setData({...data, method2: {...data.method2, parameter: e.target.value}})}
                    />
                  ) : data.method2.parameter}
                </h3>
                {isEditing && (
                  <button onClick={addMethod2Row} className="text-xs flex items-center gap-1 hover:text-red-400 transition-colors">
                    <Plus className="w-3 h-3" /> Add Color
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Length Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-stone-300 text-[10px]">
                    <thead>
                      <tr className="bg-blue-50">
                        <th colSpan={10} className="border border-stone-300 p-1 font-bold uppercase text-blue-900">Length/Warp along grandline (cm)</th>
                      </tr>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-300 p-1 font-bold uppercase">Color Code</th>
                        <th className="border border-stone-300 p-1 font-semibold">Before</th>
                        <th className="border border-stone-300 p-1 font-semibold">After cut</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 1</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S1</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % S1</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 2</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S2</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % S2</th>
                        <th className="border border-stone-300 p-1 font-bold bg-yellow-50">Total Shrink %</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Width Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-stone-300 text-[10px]">
                    <thead>
                      <tr className="bg-green-50">
                        <th colSpan={10} className="border border-stone-300 p-1 font-bold uppercase text-green-900">Width/Weft cross grandline (cm)</th>
                      </tr>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-300 p-1 font-bold uppercase">Color Code</th>
                        <th className="border border-stone-300 p-1 font-semibold">Before</th>
                        <th className="border border-stone-300 p-1 font-semibold">After cut</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 1</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S1</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % S1</th>
                        <th className="border border-stone-300 p-1 font-semibold">After step 2</th>
                        <th className="border border-stone-300 p-1 font-semibold">(+/-) S2</th>
                        <th className="border border-stone-300 p-1 font-semibold">Shrink % S2</th>
                        <th className="border border-stone-300 p-1 font-bold bg-yellow-50">Total Shrink %</th>
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
                <div className="mt-8 space-y-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest border-b border-stone-300 pb-2">Photo method 2</h3>
                  {data.method2.rows.map(row => (
                    <div key={row.id} className="border border-stone-200 p-4 rounded-lg bg-stone-50/50">
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
                        {[
                          { label: "After step 1 along grandline", photos: row.photosStep1, idx: 0, step: 1 },
                          { label: "After step 1 cross grandline", photos: row.photosStep1, idx: 1, step: 1 },
                          { label: "After step 2 along grandline", photos: row.photosStep2, idx: 0, step: 2 },
                          { label: "After step 2 cross grandline", photos: row.photosStep2, idx: 1, step: 2 }
                        ].map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="aspect-square bg-stone-200 rounded border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden relative group">
                              {item.photos[item.idx] ? (
                                <>
                                  <img src={item.photos[item.idx]} className="w-full h-full object-cover" alt={item.label} referrerPolicy="no-referrer" />
                                  {isEditing && (
                                    <button 
                                      onClick={() => setData(prev => ({
                                        ...prev,
                                        method2: {
                                          ...prev.method2,
                                          rows: prev.method2.rows.map(r => {
                                            if (r.id === row.id) {
                                              if (item.step === 1) return { ...r, photosStep1: r.photosStep1.filter((_, idx) => idx !== item.idx) };
                                              return { ...r, photosStep2: r.photosStep2.filter((_, idx) => idx !== item.idx) };
                                            }
                                            return r;
                                          })
                                        }
                                      }))}
                                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div className="text-center p-4">
                                  <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                                  <span className="text-[8px] text-stone-500 uppercase font-bold">{item.step === 1 ? 'S1' : 'S2'}-{item.idx + 1}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-[9px] text-center font-bold text-stone-500 uppercase leading-tight">{item.label} (cm)</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Remarks */}
            <section>
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
          <footer className="p-8 border-t border-stone-200 bg-stone-50/50 flex justify-between items-end">
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
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .max-w-6xl {
            max-width: 100%;
          }
          button, .sticky, .fixed, .no-print {
            display: none !important;
          }
          #report-container {
            box-shadow: none;
            border: none;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
