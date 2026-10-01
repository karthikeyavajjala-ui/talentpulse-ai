import React, { useState } from 'react';
import { ShieldCheck, Info, CheckCircle2, X } from 'lucide-react';

export const FairnessBanner: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  const excludedTraits = [
    'Gender & Pronouns',
    'Religion & Creed',
    'Caste & Community',
    'Race & Ethnicity',
    'Disability Status',
    'Age & Date of Birth',
    'Candidate Photograph',
    'Marital & Family Status',
    'Political Affiliation',
  ];

  return (
    <div className="bg-indigo-950/95 dark:bg-slate-900 text-indigo-100 border-b border-indigo-800/60 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Fairness Guard Active
          </span>
          <p className="font-medium text-indigo-100">
            AI-generated screening results are decision-support information only. Recruiters must review candidates and make final decisions.
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-indigo-300 hover:text-white underline underline-offset-2 font-medium transition"
        >
          <Info className="w-3.5 h-3.5" />
          {showDetails ? 'Hide Zero-Bias Audit Policy' : 'View Zero-Bias Audit Policy'}
        </button>
      </div>

      {showDetails && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-indigo-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-indigo-200">
          <div>
            <p className="font-semibold text-white mb-1">
              Strict Protected-Characteristic Redaction & Non-Inference Guarantee:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {excludedTraits.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-900/80 border border-indigo-700/60 text-[11px] text-indigo-200"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Excluded: {trait}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowDetails(false)}
            className="text-indigo-300 hover:text-white p-1 self-end md:self-center"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
