'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState('inventory_valuation');
  const [format, setFormat] = useState('csv');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: 'inventory_valuation', ...t.reports.types.inventory_valuation },
    { value: 'sales_trend', ...t.reports.types.sales_trend },
    { value: 'forecast_accuracy', ...t.reports.types.forecast_accuracy },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data } = await apiClient.post('/reports/generate', { type: reportType, format }, { responseType: 'blob' });

      // If server returned JSON (e.g. "no data"), the blob will be application/json
      if (data.type === 'application/json') {
        const text = await data.text();
        const json = JSON.parse(text);
        toast.success(json.data || t.reports.noData);
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t.reports.downloaded);
    } catch {
      toast.error(t.reports.failed);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.reports.title} />

      <div className="max-w-2xl">
        <div className="card p-6 space-y-6">
          <div>
            <label className="form-label text-base mb-3">{t.reports.reportType}</label>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <label key={type.value} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors touch-target ${reportType === type.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="reportType" value={type.value} checked={reportType === type.value} onChange={() => setReportType(type.value)} className="mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label text-base mb-3">{t.reports.format}</label>
            <div className="flex gap-3">
              <label className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer touch-target ${format === 'csv' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} />
                <span className="text-sm font-semibold">CSV</span>
              </label>
              <label className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer touch-target ${format === 'pdf' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} />
                <span className="text-sm font-semibold">PDF</span>
              </label>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary gap-2 text-lg">
            <Download className="w-5 h-5" />
            {isGenerating ? t.reports.generating : t.reports.generate}
          </button>
        </div>
      </div>
    </div>
  );
}
