'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import toast from 'react-hot-toast';

export default function ImportPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
      toast.success(`${data.data.imported} ${t.inventory.imported}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title={t.inventory.importTitle} />

      <div className="card p-6">
        <h2 className="text-sm font-bold text-gray-500 mb-2">{t.inventory.csvFormat}</h2>
        <p className="text-sm text-gray-600 mb-3">{t.inventory.csvHelp}</p>
        <code className="block bg-gray-50 p-3 rounded-xl text-xs text-gray-700">
          sku,name,category,unit,costPrice,sellingPrice,mrp,currentStock,reorderLevel,reorderQuantity,leadTimeDays
        </code>
      </div>

      {!result && (
        <>
          <div
            {...getRootProps()}
            className={`card p-12 text-center cursor-pointer border-2 border-dashed transition-colors rounded-2xl ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold">{file.name}</span>
                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-base font-medium">{t.inventory.dragDrop}</p>
                <p className="text-sm text-gray-400 mt-1">{t.inventory.orBrowse}</p>
              </>
            )}
          </div>

          <button onClick={handleUpload} disabled={!file || isUploading} className="btn-primary w-full text-lg">
            {isUploading ? t.inventory.importing : t.inventory.uploadImport}
          </button>
        </>
      )}

      {result && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-lg font-bold">{t.inventory.importComplete}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-700 font-medium">{t.inventory.imported}</p>
              <p className="text-2xl font-bold text-green-600">{result.imported}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium">{t.inventory.errors}</p>
              <p className="text-2xl font-bold text-red-600">{result.errors?.length || 0}</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-3">
              {result.errors.map((err: any, i: number) => (
                <p key={i} className="text-xs text-red-600 flex items-start gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Row {err.row}: {err.message}
                </p>
              ))}
            </div>
          )}
          <button onClick={() => router.push('/inventory')} className="btn-primary w-full text-lg">
            {t.inventory.goToInventory}
          </button>
        </div>
      )}
    </div>
  );
}
