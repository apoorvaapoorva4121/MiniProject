import React, { useRef, useState } from 'react';
import { AnalysisResult } from '../types';
import MixChart from './MixChart';
import Calculator from './Calculator';
import { Recycle, Ruler, BrickWall, AlertCircle, CheckCircle2, ArrowLeft, Factory, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AnalysisViewProps {
  result: AnalysisResult;
  imageSrc: string | null;
  onReset: () => void;
  onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, imageSrc, onReset, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EcoBrick_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6 no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white/90 rounded-lg transition-all shadow-sm font-medium"
          >
            {isExporting ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <Download className="w-5 h-5" />
            )}
            <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      <div ref={printRef} id="analysis-content" className="bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
        {/* Header Result Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden border border-emerald-100 dark:border-emerald-900/50 mb-8 transition-colors duration-300">
          <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-1/3 bg-gray-100 dark:bg-slate-800 relative h-64 md:h-auto">
              {imageSrc && (
                  <img 
                    src={imageSrc} 
                    alt="Analyzed Plastic" 
                    className="w-full h-full object-cover"
                  />
              )}
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-emerald-800 dark:text-emerald-400 shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {result.confidence}% Confidence
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 md:p-8 md:w-2/3 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold tracking-wide uppercase border border-emerald-200 dark:border-emerald-800">
                      Detected Type
                  </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  {result.category}
                  <Recycle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </h1>
              
              <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
                  {result.reasoning}
              </p>

              {/* Production Note */}
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0 text-amber-700 dark:text-amber-400">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm uppercase tracking-wide mb-1">Production Note</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{result.productionNote}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <Ruler className="w-6 h-6 text-slate-500 dark:text-slate-400 mt-1" />
                      <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Est. Thickness</p>
                          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{result.thicknessMicrons} µm</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
                      <BrickWall className="w-6 h-6 text-orange-500 dark:text-orange-400 mt-1" />
                      <div>
                          <p className="text-sm text-orange-500 dark:text-orange-400 font-medium">Recommended Brick</p>
                          <p className="text-xl font-bold text-orange-800 dark:text-orange-100">{result.brickType}</p>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Mix Ratio Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 p-6 transition-colors duration-300">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-6 border-b dark:border-slate-800 pb-2">Material Mix Ratio (Base: 1kg Plastic)</h3>
              <div className="flex items-center justify-center">
                  <MixChart mixRatio={result.mixRatio} />
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-slate-400 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Ratios are approximate. Test a small batch first.</span>
              </div>
          </div>

          {/* Calculator */}
          <Calculator baseRatio={result.mixRatio} />
        </div>
      </div>

      <div className="mt-12 flex justify-center no-print">
        <button
          onClick={onReset}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold rounded-full shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-105 active:scale-95"
        >
          Scan New Sample
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;