import React, { useRef, useState } from 'react';
import { X, Download, GitBranch, Github, Upload, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { VaultItem } from '../types';
import { exportVaultAsGitRepoZip } from '../utils/vaultStorage';

interface GitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultItems: VaultItem[];
  onImportVault: (items: VaultItem[]) => void;
}

export const GitSyncModal: React.FC<GitSyncModalProps> = ({
  isOpen,
  onClose,
  vaultItems,
  onImportVault,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await exportVaultAsGitRepoZip(vaultItems);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const gitSnippet = `# 1. Extract the downloaded zip into your workspace folder
cd sermon-vault

# 2. Initialize git repository
git init
git add .
git commit -m "Initial commit: sermon library & biblical exegesis vault"

# 3. Connect to your GitHub repository and push
git branch -M main
git remote add origin https://github.com/<your-username>/sermon-vault.git
git push -u origin main`;

  const copyGitCommands = () => {
    navigator.clipboard.writeText(gitSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportVault(parsed);
          setImportStatus(`Successfully restored ${parsed.length} works into your vault.`);
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus('Invalid vault format. Please provide a valid vault-backup.json file.');
        }
      } catch (err) {
        setImportStatus('Error reading file. Ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-stone-300 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-stone-800" />
            <h3 className="text-lg font-serif-title font-semibold text-stone-900">
              GitHub Repository Sync & Version Control
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-stone-700">
          <div>
            <p className="leading-relaxed text-stone-600">
              Kerygma saves every sermon manuscript, exegesis study, and outline in clean Markdown with industry-standard YAML frontmatter. You can version-control your entire library on GitHub, share it publicly, or deploy it to a digital garden or website.
            </p>
          </div>

          {/* Action 1: Download Zip */}
          <div className="p-4 bg-stone-100/70 border border-stone-200/90 rounded-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-stone-900">Download Complete Git Repository Bundle</h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Contains all {vaultItems.length} documents as organized .md files (/sermons, /studies, /illustrations), README.md index, and vault-backup.json.
                </p>
              </div>
              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-50 text-xs font-medium rounded hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generating ZIP...' : 'Download .zip'}
              </button>
            </div>
          </div>

          {/* Git Terminal Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-sans">
                Push to GitHub in 3 steps
              </span>
              <button
                onClick={copyGitCommands}
                className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-950 font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-stone-800" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to clipboard' : 'Copy commands'}
              </button>
            </div>
            <pre className="p-3.5 bg-stone-900 text-stone-200 text-xs font-mono-code rounded-md overflow-x-auto leading-relaxed border border-stone-800">
              {gitSnippet}
            </pre>
          </div>

          {/* Public Sharing & Web Hosting Advice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-stone-200 rounded">
              <div className="font-medium text-stone-900 mb-1 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-stone-700" />
                Branch Version Control
              </div>
              <p className="text-stone-500">
                Create branches like <code className="font-mono text-[11px] bg-stone-100 px-1 py-0.5 rounded">series/romans-8</code> to track revisions across preaching dates.
              </p>
            </div>

            <div className="p-3 bg-white border border-stone-200 rounded">
              <div className="font-medium text-stone-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                Obsidian / Foam Compatible
              </div>
              <p className="text-stone-500">
                Unzip directly into an Obsidian or Foam vault folder. All cross-references and tags are natively recognized.
              </p>
            </div>
          </div>

          {/* Import / Restore */}
          <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-medium text-stone-900 block">Restore or Import Vault</span>
              <span className="text-xs text-stone-500">Load a previously exported vault-backup.json file</span>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 text-stone-700 rounded hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Backup JSON
              </button>
            </div>
          </div>

          {importStatus && (
            <div className="p-2.5 bg-stone-100 border border-stone-300 text-stone-800 text-xs rounded text-center">
              {importStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100/50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
