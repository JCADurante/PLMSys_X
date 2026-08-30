import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  Wifi, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  HardDrive
} from 'lucide-react';
import { motion } from 'motion/react';

export const MiniserveHub: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [copiedBash, setCopiedBash] = useState(false);
  const [copiedFw, setCopiedFw] = useState(false);

  // Configuration options for live command generator
  const [selectedPort, setSelectedPort] = useState('3000');
  const [bindInterface, setBindInterface] = useState<'all' | 'local'>('all');
  const [enableSpa, setEnableSpa] = useState(true);
  const [enableAuth, setEnableAuth] = useState(false);
  const [authUser, setAuthUser] = useState('admin');
  const [authPass, setAuthPass] = useState('JADB1994');
  const [enableUploads, setEnableUploads] = useState(false);
  const [quietLogs, setQuietLogs] = useState(false);

  // Construct dynamic Miniserve CLI command
  const buildCommand = () => {
    let cmd = 'miniserve';
    if (enableSpa) cmd += ' --spa --index index.html';
    cmd += ` --port ${selectedPort || '3000'}`;
    if (bindInterface === 'all') {
      cmd += ' --interfaces 0.0.0.0';
    } else {
      cmd += ' --interfaces 127.0.0.1';
    }
    if (enableAuth && authUser && authPass) {
      cmd += ` --auth ${authUser}:${authPass}`;
    }
    if (enableUploads) cmd += ' --upload-files';
    if (quietLogs) cmd += ' --quiet';
    cmd += ' dist';
    return cmd;
  };

  const currentCommand = buildCommand();

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleDownloadBatch = () => {
    const content = `@echo off
setlocal enabledelayedexpansion
TITLE PLMSys - Miniserve High-Performance LAN Server
cd /d "%~dp0"

ECHO ============================================================
ECHO     PLMSys - Miniserve Zero-Install LAN / Offline Server
ECHO            (Latest Miniserve v0.35.0 Engine)
ECHO ============================================================
ECHO.

SET "PORT=${selectedPort || '3000'}"
SET "BUNDLE_DIR=dist"
SET "RUN_EXE="

if not exist "dist\\" (
    if not exist "package.json" (
        ECHO [ERROR] Project files not found!
        ECHO Please extract the ZIP file before running this script.
        PAUSE
        EXIT /B 1
    )
)

if exist "miniserve.exe" (
    SET "RUN_EXE=miniserve.exe"
) else if exist "tools\\miniserve.exe" (
    SET "RUN_EXE=tools\\miniserve.exe"
) else (
    where miniserve >nul 2>nul
    if !errorlevel! equ 0 (
        SET "RUN_EXE=miniserve"
    )
)

if "%RUN_EXE%"=="" (
    ECHO [INFO] Downloading Miniserve v0.35.0 for Windows...
    where curl.exe >nul 2>nul
    if !errorlevel! equ 0 (
        curl.exe -L -o miniserve.exe "https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe"
    )
    if not exist "miniserve.exe" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe', 'miniserve.exe')"
    )
    if exist "miniserve.exe" (
        SET "RUN_EXE=miniserve.exe"
    ) else (
        ECHO [ERROR] Please manually download miniserve.exe to this folder.
        PAUSE
        EXIT /B 1
    )
)

if not exist "%BUNDLE_DIR%\\index.html" (
    ECHO [INFO] Building production bundle...
    CALL npm run build
)

ECHO.
ECHO ============================================================
ECHO  Starting Miniserve on http://localhost:%PORT%
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
start "" "http://localhost:%PORT%"
%RUN_EXE% ${buildCommand().replace(/^miniserve\s+/, '')}
PAUSE
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'START-MINISERVE.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const latestReleases = [
    {
      os: 'Windows (64-bit)',
      filename: 'miniserve-v0.35.0-x86_64-pc-windows-msvc.exe',
      url: 'https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe',
      arch: 'x86_64 .exe',
      badge: 'Recommended for Shop-Floor PCs'
    },
    {
      os: 'Linux (x86_64)',
      filename: 'miniserve-v0.35.0-x86_64-unknown-linux-musl',
      url: 'https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-unknown-linux-musl',
      arch: 'musl standalone static binary',
      badge: 'Ubuntu / Debian / Alpine'
    },
    {
      os: 'macOS (Apple Silicon)',
      filename: 'miniserve-v0.35.0-aarch64-apple-darwin',
      url: 'https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-aarch64-apple-darwin',
      arch: 'M1 / M2 / M3 / M4 ARM64',
      badge: 'macOS Silicon'
    },
    {
      os: 'macOS (Intel)',
      filename: 'miniserve-v0.35.0-x86_64-apple-darwin',
      url: 'https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-apple-darwin',
      arch: 'Intel x86_64',
      badge: 'macOS Legacy'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#F27D26]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Latest Release: Miniserve v0.35.0
              </span>
              <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                Zero-Install Static Server
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Miniserve LAN & Air-Gapped Factory Server
            </h2>
            <p className="text-sm text-[#8E9299] max-w-3xl leading-relaxed">
              <span className="text-white font-semibold">Miniserve</span> is an ultra-fast, zero-dependency single-binary web server written in Rust. It serves the pre-compiled PLMSys static application across shop-floor computers, touchscreens, and operator tablets without requiring Node.js, runtime dependencies, or external internet access.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadBatch}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#F27D26] hover:bg-[#d96b1f] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#F27D26]/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Launcher (.BAT)</span>
            </button>
            <a
              href="https://github.com/svenstaro/miniserve/releases/tag/v0.35.0"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#191D28] hover:bg-[#252A38] border border-[#1E222A] text-gray-200 rounded-xl text-xs font-semibold transition-all"
            >
              <span>GitHub Releases</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8E9299]" />
            </a>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1E222A]">
          <div className="flex items-center gap-2.5 text-xs text-[#E0E2E5]">
            <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
            <span>&lt; 5MB RAM Usage</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#E0E2E5]">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Instant Sub-millisecond Response</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#E0E2E5]">
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Local Area Network (LAN) Ready</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#E0E2E5]">
            <HardDrive className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Zero-Install Portable Binary</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Command Builder & Official Binary Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Interactive Command Configurator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#14171F] border border-[#1E222A] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-[#F27D26]">
                <Terminal className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  Miniserve Command Configurator
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#8E9299]">Live Generator</span>
            </div>

            {/* Config Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#8E9299] uppercase tracking-wider block mb-1.5">
                  Server Port
                </label>
                <div className="flex gap-2">
                  {['3000', '8080', '8000', '80'].map((port) => (
                    <button
                      key={port}
                      type="button"
                      onClick={() => setSelectedPort(port)}
                      className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                        selectedPort === port
                          ? 'bg-[#F27D26] text-white border-[#F27D26]'
                          : 'bg-[#0A0B0E] border-[#1E222A] text-[#8E9299] hover:text-white'
                      }`}
                    >
                      {port}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E9299] uppercase tracking-wider block mb-1.5">
                  Network Interface Binding
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBindInterface('all')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      bindInterface === 'all'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-[#0A0B0E] border-[#1E222A] text-[#8E9299] hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>0.0.0.0 (LAN)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBindInterface('local')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      bindInterface === 'local'
                        ? 'bg-sky-600 text-white border-sky-500'
                        : 'bg-[#0A0B0E] border-[#1E222A] text-[#8E9299] hover:text-white'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>127.0.0.1 (Local)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 bg-[#0A0B0E] border border-[#1E222A] rounded-xl cursor-pointer hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Single Page App Mode (--spa --index index.html)</span>
                    <span className="text-[11px] text-[#8E9299]">Routes all URL paths to index.html for React SPA navigation</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableSpa}
                  onChange={(e) => setEnableSpa(e.target.checked)}
                  className="rounded text-[#F27D26] focus:ring-[#F27D26] h-4 w-4 bg-[#191D28] border-[#1E222A]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#0A0B0E] border border-[#1E222A] rounded-xl cursor-pointer hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">HTTP Basic Authentication (--auth user:password)</span>
                    <span className="text-[11px] text-[#8E9299]">Requires credentials before granting access to web UI</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableAuth}
                  onChange={(e) => setEnableAuth(e.target.checked)}
                  className="rounded text-[#F27D26] focus:ring-[#F27D26] h-4 w-4 bg-[#191D28] border-[#1E222A]"
                />
              </label>

              {enableAuth && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#191D28] border border-amber-500/20 rounded-xl animate-fadeIn">
                  <div>
                    <label className="text-[10px] font-bold text-[#8E9299] uppercase block mb-1">Username</label>
                    <input
                      type="text"
                      value={authUser}
                      onChange={(e) => setAuthUser(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0A0B0E] border border-[#1E222A] text-white rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E9299] uppercase block mb-1">Password</label>
                    <input
                      type="text"
                      value={authPass}
                      onChange={(e) => setAuthPass(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0A0B0E] border border-[#1E222A] text-white rounded text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generated Command Box */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8E9299] uppercase tracking-wider">
                  Generated Miniserve Command:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentCommand, setCopiedCmd)}
                  className="flex items-center gap-1.5 text-xs text-[#F27D26] hover:text-[#d96b1f] font-bold cursor-pointer transition-colors"
                >
                  {copiedCmd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-[#0A0B0E] border border-[#1E222A] rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto select-all shadow-inner leading-relaxed">
                {currentCommand}
              </div>
            </div>
          </div>

          {/* Quick Windows Firewall Rule Helper */}
          <div className="bg-[#14171F] border border-[#1E222A] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Windows Firewall LAN Rule (Run in Admin CMD/PowerShell)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`netsh advfirewall firewall add rule name="PLMSys Miniserve" dir=in action=allow protocol=TCP localport=${selectedPort || '3000'}`, setCopiedFw)}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedFw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFw ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 bg-[#0A0B0E] border border-[#1E222A] rounded-lg font-mono text-[11px] text-sky-300 overflow-x-auto">
              {`netsh advfirewall firewall add rule name="PLMSys Miniserve" dir=in action=allow protocol=TCP localport=${selectedPort || '3000'}`}
            </div>
          </div>
        </div>

        {/* Right Col: Official Downloads & Shop-Floor Setup Guide */}
        <div className="lg:col-span-5 space-y-6">
          {/* Download Binaries Box */}
          <div className="bg-[#14171F] border border-[#1E222A] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Download className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  Official Binaries (v0.35.0)
                </h3>
              </div>
              <span className="badge bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono">
                Standalone
              </span>
            </div>

            <div className="space-y-3">
              {latestReleases.map((rel, idx) => (
                <a
                  key={idx}
                  href={rel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-[#0A0B0E] hover:bg-[#191D28] border border-[#1E222A] hover:border-gray-700 rounded-xl transition-all group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#F27D26] transition-colors">
                        {rel.os}
                      </span>
                      <span className="text-[10px] bg-[#191D28] text-[#8E9299] px-1.5 py-0.5 rounded font-mono">
                        {rel.arch}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8E9299] mt-0.5 font-mono truncate max-w-[200px] sm:max-w-xs">
                      {rel.filename}
                    </div>
                  </div>
                  <div className="p-2 bg-[#191D28] group-hover:bg-[#F27D26] text-[#8E9299] group-hover:text-white rounded-lg transition-all shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                </a>
              ))}
            </div>

            {/* Package Manager Options */}
            <div className="pt-2 border-t border-[#1E222A] space-y-2">
              <div className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider">
                Install via Package Manager:
              </div>
              <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-[#0A0B0E] rounded border border-[#1E222A] text-gray-300 flex items-center justify-between">
                  <span>winget install svenstaro.miniserve</span>
                  <button
                    onClick={() => handleCopy('winget install svenstaro.miniserve', setCopiedCmd)}
                    className="text-[#8E9299] hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2 bg-[#0A0B0E] rounded border border-[#1E222A] text-gray-300 flex items-center justify-between">
                  <span>cargo install miniserve</span>
                  <button
                    onClick={() => handleCopy('cargo install miniserve', setCopiedCmd)}
                    className="text-[#8E9299] hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2 bg-[#0A0B0E] rounded border border-[#1E222A] text-gray-300 flex items-center justify-between">
                  <span>brew install miniserve</span>
                  <button
                    onClick={() => handleCopy('brew install miniserve', setCopiedCmd)}
                    className="text-[#8E9299] hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Step Setup Card */}
          <div className="bg-[#14171F] border border-[#1E222A] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 border-b border-[#1E222A] pb-3">
              <HelpCircle className="w-5 h-5" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                3-Step Factory Shop-Floor Deployment
              </h3>
            </div>

            <ol className="space-y-3 text-xs text-[#E0E2E5]">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <strong className="text-white">Build the Static Frontend:</strong>
                  <p className="text-[#8E9299] mt-0.5">Run <code className="text-indigo-300">npm run build</code> once on your development machine to produce the optimized <code className="text-indigo-300">dist/</code> directory.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <strong className="text-white">Place <code className="text-indigo-300">miniserve.exe</code>:</strong>
                  <p className="text-[#8E9299] mt-0.5">Copy <code className="text-indigo-300">dist/</code> and <code className="text-indigo-300">START-MINISERVE.bat</code> (with miniserve.exe) onto the shop-floor machine or USB drive.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <strong className="text-white">Double-Click & Connect:</strong>
                  <p className="text-[#8E9299] mt-0.5">Run <code className="text-indigo-300">START-MINISERVE.bat</code>. Operators on other tablets/stations on the same local network can browse to <code className="text-indigo-300">http://&lt;HOST-IP&gt;:3000</code>.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
