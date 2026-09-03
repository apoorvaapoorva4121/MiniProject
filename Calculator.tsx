import React, { useState, useEffect } from 'react';
import { MixRatio } from '../types';
import { Calculator as CalcIcon } from 'lucide-react';

interface CalculatorProps {
  baseRatio: MixRatio;
}

const Calculator: React.FC<CalculatorProps> = ({ baseRatio }) => {
  const [plasticInput, setPlasticInput] = useState<number>(1);
  const [calculated, setCalculated] = useState<MixRatio>(baseRatio);

  useEffect(() => {
    const scale = plasticInput / (baseRatio.plasticKg || 1);
    setCalculated({
      plasticKg: plasticInput,
      soilKg: Number((baseRatio.soilKg * scale).toFixed(2)),
      sandKg: Number((baseRatio.sandKg * scale).toFixed(2)),
      cementKg: Number((baseRatio.cementKg * scale).toFixed(2)),
    });
  }, [plasticInput, baseRatio]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 p-6 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-4 text-emerald-800 dark:text-emerald-400">
        <CalcIcon className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Production Calculator</h3>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Available Plastic Waste (kg)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={plasticInput}
          onChange={(e) => setPlasticInput(parseFloat(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Required Materials</h4>
        <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-medium">Soil</span>
                <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{calculated.soilKg} kg</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <span className="block text-xs text-amber-600 dark:text-amber-400 font-medium">Sand</span>
                <span className="text-lg font-bold text-amber-900 dark:text-amber-100">{calculated.sandKg} kg</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                <span className="block text-xs text-gray-500 dark:text-slate-400 font-medium">Cement</span>
                <span className="text-lg font-bold text-gray-900 dark:text-slate-100">{calculated.cementKg} kg</span>
            </div>
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <span className="block text-xs text-blue-600 dark:text-blue-400 font-medium">Total Weight</span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {(calculated.plasticKg + calculated.soilKg + calculated.sandKg + calculated.cementKg).toFixed(2)} kg
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;