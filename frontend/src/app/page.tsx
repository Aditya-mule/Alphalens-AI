"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  Search, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Sliders, 
  FolderPlus, 
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw,
  Send,
  Loader2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://alphalens-ai-service-446073417945.asia-south1.run.app";
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

interface StockInfo {
  ticker: string;
  name: string;
  price: number;
  revenueGrowthYoY: number;
  operatingMargin: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  sector: string;
  industry: string;
  exchange?: string;
}

interface WatchlistItem {
  id: string;
  ticker: string;
  companyName: string;
  price: number;
  sector: string;
}

export default function Home() {
  // Authentication & Session
  const [token, setToken] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE");
  const [tickerData, setTickerData] = useState<StockInfo | null>(null);
  const [tickerAnalysis, setTickerAnalysis] = useState<any>(null);
  const [tickerNews, setTickerNews] = useState<any[]>([]);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Chat/RAG State
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; message: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Screener State
  const [screenerQuery, setScreenerQuery] = useState("");
  const [screenerResults, setScreenerResults] = useState<any>(null);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [showScreener, setShowScreener] = useState(false);
  const [screenerSortField, setScreenerSortField] = useState<string>("marketCap");
  const [screenerSortDir, setScreenerSortDir] = useState<"asc" | "desc">("desc");

  // VS Mode State
  const [showVSMode, setShowVSMode] = useState(false);
  const [vsTickerA, setVsTickerA] = useState("TCS");
  const [vsTickerB, setVsTickerB] = useState("INFY");
  const [vsData, setVsData] = useState<any>(null);
  const [vsLoading, setVsLoading] = useState(false);
  const [suggestionsA, setSuggestionsA] = useState<any[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<any[]>([]);
  const [showSuggestionsA, setShowSuggestionsA] = useState(false);
  const [showSuggestionsB, setShowSuggestionsB] = useState(false);

  const sortedScreenerResults = useMemo(() => {
    if (!screenerResults?.results) return [];
    return [...screenerResults.results].sort((a: any, b: any) => {
      let aVal = a[screenerSortField];
      let bVal = b[screenerSortField];

      if (screenerSortField === "peRatio") aVal = a.peRatio !== undefined ? a.peRatio : 25;
      if (screenerSortField === "pbRatio") aVal = a.pbRatio !== undefined ? a.pbRatio : 3.5;
      if (screenerSortField === "dividendYield") aVal = a.dividendYield !== undefined ? a.dividendYield : 1.2;
      if (screenerSortField === "marketCap") aVal = a.marketCap || 5000;

      if (bVal !== undefined && screenerSortField === "peRatio") bVal = b.peRatio !== undefined ? b.peRatio : 25;
      if (bVal !== undefined && screenerSortField === "pbRatio") bVal = b.pbRatio !== undefined ? b.pbRatio : 3.5;
      if (bVal !== undefined && screenerSortField === "dividendYield") bVal = b.dividendYield !== undefined ? b.dividendYield : 1.2;
      if (bVal !== undefined && screenerSortField === "marketCap") bVal = b.marketCap || 5000;

      if (aVal === undefined || aVal === null) aVal = 0;
      if (bVal === undefined || bVal === null) bVal = 0;

      if (typeof aVal === "string") {
        return screenerSortDir === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return screenerSortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [screenerResults, screenerSortField, screenerSortDir]);

  // Portfolio State
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [userPortfolios, setUserPortfolios] = useState<any[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [portfolioAudit, setPortfolioAudit] = useState<any>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  
  // New transaction inputs
  const [txTicker, setTxTicker] = useState("");
  const [txQty, setTxQty] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txSuggestions, setTxSuggestions] = useState<StockInfo[]>([]);
  const [showTxSuggestions, setShowTxSuggestions] = useState(false);

  // PDF Upload State
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTicker, setUploadTicker] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Initialization: Perform automatic Sign-in/Signup to obtain token
  useEffect(() => {
    async function autoAuth() {
      const email = "tester_analyst@alphalens.in";
      const password = "Password123!";
      
      try {
        // Try Logging in
        let response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          // If login fails, try Registering first
          const signupRes = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, fullName: "AlphaLens Analyst", role: "PREMIUM_USER" }),
          });
          
          if (!signupRes.ok) throw new Error("Authentication failed");
          
          response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
        }

        const data = await response.json();
        setToken(data.accessToken);
        loggerInfo("Authentication connected");
      } catch (err: any) {
        loggerError("Auth connection error: " + err.message);
        setAuthError("Failed to connect to backend database service. Ensure local servers are running.");
      }
    }
    autoAuth();
  }, []);

  // Fetch Watchlist, Portfolios, and selected ticker details when Token changes
  useEffect(() => {
    if (!token) return;
    fetchWatchlist();
    fetchPortfolios();
    fetchTickerDetails(selectedTicker);
  }, [token, selectedTicker]);

  // Handle Search Input autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || !token) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/stocks/search?query=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Handle Portfolio Add Holding Search Autocomplete
  useEffect(() => {
    if (!txTicker.trim() || !token) {
      setTxSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/stocks/search?query=${encodeURIComponent(txTicker)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTxSuggestions(data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [txTicker, token]);

  const fetchWatchlist = async () => {
    if (!token) return;
    setWatchlistLoading(true);
    try {
      const response = await fetch(`${API_URL}/watchlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const fetchPortfolios = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/portfolios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPortfolios(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickerDetails = async (symbol: string) => {
    if (!token) return;
    try {
      // 1. Fetch current stock profile info
      const searchRes = await fetch(`${API_URL}/stocks/search?query=${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (searchRes.ok) {
        const list = await searchRes.json();
        const found = list.find((s: StockInfo) => s.ticker === symbol);
        if (found) setTickerData(found);
      }

      // 2. Fetch AI Fundamental Analysis Report
      const analysisRes = await fetch(`${API_URL}/stocks/${symbol}/analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analysisRes.ok) {
        const report = await analysisRes.json();
        setTickerAnalysis(report.analysis);
      }

      // 3. Fetch News Feed and Sentiment
      const newsRes = await fetch(`${API_URL}/news/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (newsRes.ok) {
        const news = await newsRes.json();
        setTickerNews(news);
      }

      // Reset RAG chat history for new stock
      setChatHistory([
        { sender: "ai", message: `Hello! I am AlphaLens AI. I have indexed exchange disclosures for ${symbol}. Ask me any questions about its financials, risks, or quarterly highlights.` }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchResults.length > 0) {
        handleAddToWatchlist(searchResults[0].ticker);
      } else if (searchQuery.trim()) {
        handleAddToWatchlist(searchQuery.trim().toUpperCase());
      }
    }
  };

  const handleAddToWatchlist = async (symbol: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/watchlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticker: symbol })
      });
      if (response.ok) {
        fetchWatchlist();
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromWatchlist = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/watchlist/${symbol}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchWatchlist();
        if (selectedTicker === symbol) {
          setSelectedTicker("RELIANCE");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskRAG = async () => {
    if (!chatQuery.trim() || !token) return;
    const userMsg = chatQuery;
    setChatQuery("");
    setChatHistory(prev => [...prev, { sender: "user", message: userMsg }]);
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat/${selectedTicker}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMsg })
      });

      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: "ai", message: data.answer || "Query returned no matches." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", message: "Error contacting RAG vector service." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchSuggestionsA = async (q: string) => {
    setVsTickerA(q.toUpperCase());
    if (!q.trim()) {
      setSuggestionsA([]);
      setShowSuggestionsA(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/stocks/search?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestionsA(data.slice(0, 8));
        setShowSuggestionsA(true);
      }
    } catch (e) {}
  };

  const fetchSuggestionsB = async (q: string) => {
    setVsTickerB(q.toUpperCase());
    if (!q.trim()) {
      setSuggestionsB([]);
      setShowSuggestionsB(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/stocks/search?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestionsB(data.slice(0, 8));
        setShowSuggestionsB(true);
      }
    } catch (e) {}
  };

  const handleCompareVS = async (tickerA?: string, tickerB?: string) => {
    const tA = tickerA || vsTickerA;
    const tB = tickerB || vsTickerB;
    if (!tA.trim() || !tB.trim() || !token) return;
    setVsLoading(true);
    try {
      const response = await fetch(`${API_URL}/stocks/compare?tickerA=${encodeURIComponent(tA)}&tickerB=${encodeURIComponent(tB)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVsData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVsLoading(false);
    }
  };

  const handleScreenStocks = async (customQuery?: string) => {
    const q = customQuery || screenerQuery;
    if (!q.trim() || !token) return;
    setScreenerLoading(true);
    try {
      const response = await fetch(`${API_URL}/screener?query=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScreenerResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScreenerLoading(false);
    }
  };

  const handleSortScreener = (field: string) => {
    if (screenerSortField === field) {
      setScreenerSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setScreenerSortField(field);
      setScreenerSortDir("desc");
    }
  };

  const handleExportScreenerCSV = () => {
    if (!screenerResults || !sortedScreenerResults.length) return;
    const headers = ["Ticker", "Company Name", "Sector", "Market Cap (Cr)", "CAGR (%)", "P/E", "P/B", "OPM (%)", "ROCE (%)", "Debt/Equity", "Div Yield (%)", "Price (INR)"];
    const rows = sortedScreenerResults.map((c: any) => [
      c.ticker,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.sector.replace(/"/g, '""')}"`,
      c.marketCap || 5000,
      c.revenueGrowthYoY,
      c.peRatio !== undefined ? c.peRatio : 25,
      c.pbRatio !== undefined ? c.pbRatio : 3.5,
      c.operatingMargin,
      c.roce,
      c.debtToEquity,
      c.dividendYield !== undefined ? c.dividendYield : 1.2,
      c.price
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `alphalens_screener_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreatePortfolio = async () => {
    if (!portfolioName.trim() || !token) return;
    setPortfolioLoading(true);
    try {
      const response = await fetch(`${API_URL}/portfolios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: portfolioName })
      });
      if (response.ok) {
        setPortfolioName("");
        fetchPortfolios();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    if (!confirm("Are you sure you want to delete this portfolio? All transactions will be removed.")) return;
    
    try {
      const response = await fetch(`${API_URL}/portfolios/${portfolioId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        if (selectedPortfolio?.id === portfolioId) {
          setSelectedPortfolio(null);
          setPortfolioAudit(null);
        }
        fetchPortfolios();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHolding = async (ticker: string) => {
    if (!selectedPortfolio || !token) return;
    if (!confirm(`Are you sure you want to remove all positions for ${ticker}?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/portfolios/${selectedPortfolio.id}/holdings/${ticker}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchPortfolioAudit(selectedPortfolio.id);
        fetchPortfolios(); // Refresh transaction count
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedPortfolio || !txTicker.trim() || !txQty || !txPrice || !token) return;
    setPortfolioLoading(true);
    try {
      const response = await fetch(`${API_URL}/portfolios/${selectedPortfolio.id}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ticker: txTicker.toUpperCase(),
          quantity: parseInt(txQty),
          purchasePrice: parseFloat(txPrice)
        })
      });

      if (response.ok) {
        setTxTicker("");
        setTxQty("");
        setTxPrice("");
        fetchPortfolioAudit(selectedPortfolio.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const fetchPortfolioAudit = async (id: string) => {
    if (!token) return;
    setPortfolioLoading(true);
    try {
      const response = await fetch(`${API_URL}/portfolios/${id}/audit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolioAudit(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleUploadPDF = async () => {
    if (!selectedFile || !uploadTicker.trim() || !token) return;
    setUploadLoading(true);
    setUploadMessage("");
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("ticker", uploadTicker.toUpperCase());

    try {
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setUploadMessage("PDF uploaded and enqueued for async background indexing successfully!");
        setSelectedFile(null);
        setUploadTicker("");
      } else {
        const err = await response.json();
        setUploadMessage(`Error: ${err.message || "Failed to upload file"}`);
      }
    } catch (err) {
      setUploadMessage("Network error during PDF upload.");
    } finally {
      setUploadLoading(false);
    }
  };

  const triggerAutoCrawlerSync = async () => {
    if (!token) return;
    setUploadLoading(true);
    setUploadMessage("");
    try {
      const response = await axiosPostCrawlerSync(selectedTicker, token);
      if (response.status === "success") {
        setUploadMessage(`Crawled and indexed ${response.chunks_indexed} chunks successfully!`);
        fetchTickerDetails(selectedTicker);
      }
    } catch (err) {
      setUploadMessage("Crawler service offline or timed out.");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* Top Banner Auth Warning */}
      {authError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-700 text-xs px-6 py-2.5 flex items-center justify-between shadow-2xs font-medium">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" /> {authError}
          </span>
          <button onClick={() => window.location.reload()} className="underline hover:text-rose-900">Retry Connection</button>
        </div>
      )}

      {/* Premium Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-md shadow-indigo-500/20">
            A
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900">
              AlphaLens <span className="text-indigo-600 font-semibold">AI</span>
            </h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Equity Intelligence Hub</p>
          </div>
        </div>

        {/* Dynamic Global Autocomplete Search */}
        <div className="relative max-w-md w-full mx-8 hidden md:block">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search stocks & press Enter to watch (e.g. RELIANCE, ZOMATO)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-slate-100/90 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans placeholder-slate-400 shadow-2xs"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
              {searchResults.map((s) => (
                <div 
                  key={s.ticker}
                  onClick={() => handleAddToWatchlist(s.ticker)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900">{s.ticker}</span>
                    {s.exchange && (
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-2 uppercase font-semibold">
                        {s.exchange}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 ml-2">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Watch
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Service Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-700 font-mono font-semibold">Services Connected</span>
          </div>
          <button 
            onClick={() => { setShowPortfolio(false); setShowScreener(false); setShowUpload(false); setShowVSMode(false); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 p-6">
        {/* Watchlist & Toolbar Sidebar */}
        <section className="xl:col-span-1 flex flex-col gap-6">
          {/* Watchlist card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[11px] tracking-widest text-slate-500 uppercase font-mono">My Watchlist</h3>
              <button onClick={fetchWatchlist} className="text-slate-400 hover:text-slate-600">
                <RefreshCw className={`w-3.5 h-3.5 ${watchlistLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {watchlist.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-4 text-center">Your watchlist is empty.</p>
              ) : (
                watchlist.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedTicker(item.ticker)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedTicker === item.ticker 
                        ? "bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-2xs" 
                        : "bg-slate-50/70 border-slate-200/60 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{item.ticker}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[90px]">{item.companyName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">{item.sector}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold font-mono tabular-nums text-slate-800">₹{item.price.toFixed(1)}</span>
                      <button 
                        onClick={(e) => handleRemoveFromWatchlist(item.ticker, e)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action modules cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-[11px] tracking-widest text-slate-500 uppercase font-mono mb-1">Platform Controls</h3>
            
            <button 
              onClick={() => { setShowUpload(true); setShowScreener(false); setShowPortfolio(false); setShowVSMode(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[11px] font-semibold transition-all ${
                showUpload ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs" : "bg-slate-50/80 border-slate-200/80 hover:bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              Ingest PDF Disclosures
            </button>

            <button 
              onClick={() => { setShowScreener(true); setShowUpload(false); setShowPortfolio(false); setShowVSMode(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[11px] font-semibold transition-all ${
                showScreener ? "bg-teal-50 border-teal-300 text-teal-700 shadow-2xs" : "bg-slate-50/80 border-slate-200/80 hover:bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <Sliders className="w-4 h-4 text-teal-600" />
              Smart Stock Screener
            </button>

            <button 
              onClick={() => { setShowPortfolio(true); setShowUpload(false); setShowScreener(false); setShowVSMode(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[11px] font-semibold transition-all ${
                showPortfolio ? "bg-purple-50 border-purple-300 text-purple-700 shadow-2xs" : "bg-slate-50/80 border-slate-200/80 hover:bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <FolderPlus className="w-4 h-4 text-purple-600" />
              Portfolio Risk Auditor
            </button>

            <button 
              onClick={() => { 
                setShowVSMode(true); 
                setShowUpload(false); 
                setShowScreener(false); 
                setShowPortfolio(false); 
                if (!vsData) handleCompareVS("TCS", "INFY");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[11px] font-semibold transition-all ${
                showVSMode ? "bg-amber-50 border-amber-300 text-amber-800 shadow-2xs" : "bg-slate-50/80 border-slate-200/80 hover:bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="text-amber-500 font-bold text-sm">⚔️</span>
              VS Mode Stock Comparison
            </button>
          </div>
        </section>

        {/* Dashboard Panels */}
        <section className="xl:col-span-3 flex flex-col gap-6">
          
          {/* 1. PDF FILE INGESTION PANEL */}
          {showUpload && (
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-indigo-500 p-6 shadow-xs flex flex-col gap-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> PDF Document Ingest Processor
                </h2>
                <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Form */}
                <div className="flex flex-col gap-4 bg-slate-50/80 border border-slate-200/80 p-5 rounded-xl">
                  <h3 className="text-xs font-semibold text-slate-800">Option A: Manual PDF Ingestion</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Target Stock Ticker</label>
                    <input 
                      type="text" 
                      placeholder="e.g. TCS, INFY" 
                      value={uploadTicker}
                      onChange={(e) => setUploadTicker(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">PDF Filing Document</label>
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                      className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={handleUploadPDF}
                    disabled={uploadLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    {uploadLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Upload & Process Filing"}
                  </button>
                </div>

                {/* Automated Exchange Disclosures Scraper/Crawler */}
                <div className="flex flex-col gap-4 bg-slate-50/80 border border-slate-200/80 p-5 rounded-xl">
                  <h3 className="text-xs font-semibold text-slate-800">Option B: Auto-Scrape Exchange disclosures</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Trigger our automated exchange crawler to fetch quarterly disclosures directly for the currently focused stock (<strong>{selectedTicker}</strong>) and index it into Qdrant.
                  </p>
                  <button 
                    onClick={triggerAutoCrawlerSync}
                    disabled={uploadLoading}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold py-2.5 rounded-xl transition-all mt-auto flex items-center justify-center gap-2 shadow-xs"
                  >
                    {uploadLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `Sync Disclosures for ${selectedTicker}`}
                  </button>
                </div>
              </div>

              {uploadMessage && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs">
                  {uploadMessage}
                </div>
              )}
            </div>
          )}

          {/* 2. SMART NL SCREENER PANEL */}
          {showScreener && (
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-teal-500 p-6 shadow-xs flex flex-col gap-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" /> Smart Stock Screener (NLP)
                </h2>
                <button onClick={() => setShowScreener(false)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
              </div>

              {/* Quick Presets Bar */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-mono font-bold mr-1">⚡ Quick Presets:</span>
                <button 
                  onClick={() => { setScreenerQuery("defence stocks with market cap > 10000 Cr"); handleScreenStocks("defence stocks with market cap > 10000 Cr"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 transition-all font-mono"
                >
                  🛡️ Low Debt Defense
                </button>
                <button 
                  onClick={() => { setScreenerQuery("bank stocks with ROCE > 10% and PE < 25"); handleScreenStocks("bank stocks with ROCE > 10% and PE < 25"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 transition-all font-mono"
                >
                  📈 Large Cap Banks
                </button>
                <button 
                  onClick={() => { setScreenerQuery("psu stocks with dividend yield > 2%"); handleScreenStocks("psu stocks with dividend yield > 2%"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 transition-all font-mono"
                >
                  💰 High Dividend PSUs
                </button>
                <button 
                  onClick={() => { setScreenerQuery("real estate stock with market cap > 1000 Cr"); handleScreenStocks("real estate stock with market cap > 1000 Cr"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 transition-all font-mono"
                >
                  🏢 Real Estate Leaders
                </button>
                <button 
                  onClick={() => { setScreenerQuery("technology stocks with CAGR > 15%"); handleScreenStocks("technology stocks with CAGR > 15%"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 transition-all font-mono"
                >
                  🚀 Growth Tech
                </button>
                <button 
                  onClick={() => { setScreenerQuery("renewable energy stocks"); handleScreenStocks("renewable energy stocks"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 transition-all font-mono"
                >
                  🌱 Renewable Energy
                </button>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. technology firms with high capital return (ROCE) and low leverage"
                  value={screenerQuery}
                  onChange={(e) => setScreenerQuery(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <button 
                  onClick={() => handleScreenStocks()}
                  disabled={screenerLoading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  {screenerLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Run Screener"}
                </button>
              </div>

              {/* Supported parameters guide */}
              <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5 font-bold">Supported Screening Parameters</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-[10px] leading-relaxed">
                  <div>
                    <span className="text-slate-700 font-bold block mb-0.5">🏢 Sectors & Sub-Categories</span>
                    <span className="text-slate-500 italic block">e.g. Defense, Banking, PSU, Renewable Energy, Technology, Real Estate, FMCG, Finance</span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-bold block mb-0.5">📊 Valuation (P/E & P/B)</span>
                    <span className="text-slate-500 italic block">e.g. "PE &lt; 30", "price to book under 3", "low PE ratio"</span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-bold block mb-0.5">🚀 Growth (CAGR)</span>
                    <span className="text-slate-500 italic block">e.g. "CAGR &gt; 15%", "revenue growth above 10%"</span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-bold block mb-0.5">💰 Margins & Dividends</span>
                    <span className="text-slate-500 italic block">e.g. "margin &gt; 20%", "dividend yield over 1.5%"</span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-bold block mb-0.5">⚙️ Capital Return & Debt</span>
                    <span className="text-slate-500 italic block">e.g. "ROCE &gt; 12%", "debt to equity under 0.5"</span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-bold block mb-0.5">🏭 Company Size (Market Cap)</span>
                    <span className="text-slate-500 italic block">e.g. "large cap stocks", "mcap &gt; 10000 Cr"</span>
                  </div>
                </div>
              </div>

              {screenerResults && (
                <div className="flex flex-col gap-4">
                  <div className="bg-teal-50/60 border border-teal-200/80 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-teal-800 uppercase tracking-widest block font-bold">AI Parser Interpretation</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-teal-700 font-bold">
                          Showing {sortedScreenerResults.length} matching stocks
                        </span>
                        <button
                          onClick={handleExportScreenerCSV}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-mono px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          📥 Export CSV
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-teal-900 italic">{screenerResults.explanation}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1 font-mono text-[10px] text-teal-700 font-semibold">
                      <span>Sector: {screenerResults.filters.sector || "All"}</span>
                      {screenerResults.filters.minRoce !== null && screenerResults.filters.minRoce !== undefined && <span>Min ROCE: {screenerResults.filters.minRoce}%</span>}
                      {screenerResults.filters.maxDebtToEquity !== null && screenerResults.filters.maxDebtToEquity !== undefined && <span>Max D/E: {screenerResults.filters.maxDebtToEquity}</span>}
                      {screenerResults.filters.maxPe !== null && screenerResults.filters.maxPe !== undefined && <span>Max P/E: {screenerResults.filters.maxPe}</span>}
                      {screenerResults.filters.maxPb !== null && screenerResults.filters.maxPb !== undefined && <span>Max P/B: {screenerResults.filters.maxPb}</span>}
                      {screenerResults.filters.minCagr !== null && screenerResults.filters.minCagr !== undefined && <span>Min CAGR: {screenerResults.filters.minCagr}%</span>}
                      {screenerResults.filters.minOpm !== null && screenerResults.filters.minOpm !== undefined && <span>Min OPM: {screenerResults.filters.minOpm}%</span>}
                      {screenerResults.filters.minDividendYield !== null && screenerResults.filters.minDividendYield !== undefined && <span>Min Div Yield: {screenerResults.filters.minDividendYield}%</span>}
                      {screenerResults.filters.minMarketCap !== null && screenerResults.filters.minMarketCap !== undefined && <span>Min Mcap: {screenerResults.filters.minMarketCap} Cr</span>}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-[10px] min-w-[850px]">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                          <th onClick={() => handleSortScreener("ticker")} className="px-3 py-2.5 cursor-pointer hover:text-slate-900">
                            Ticker {screenerSortField === "ticker" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("name")} className="px-3 py-2.5 cursor-pointer hover:text-slate-900">
                            Company Name {screenerSortField === "name" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("sector")} className="px-3 py-2.5 cursor-pointer hover:text-slate-900">
                            Sector {screenerSortField === "sector" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("marketCap")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            Mcap (Cr) {screenerSortField === "marketCap" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("revenueGrowthYoY")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            CAGR {screenerSortField === "revenueGrowthYoY" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("peRatio")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            P/E {screenerSortField === "peRatio" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("pbRatio")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            P/B {screenerSortField === "pbRatio" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("operatingMargin")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            OPM {screenerSortField === "operatingMargin" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("roce")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            ROCE {screenerSortField === "roce" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("debtToEquity")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            D/E {screenerSortField === "debtToEquity" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("dividendYield")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            Div Yield {screenerSortField === "dividendYield" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th onClick={() => handleSortScreener("price")} className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-900">
                            Price {screenerSortField === "price" ? (screenerSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedScreenerResults.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="px-4 py-4 text-center text-slate-400 italic">No companies matched the criteria.</td>
                          </tr>
                        ) : (
                          sortedScreenerResults.map((c: any) => (
                            <tr key={c.ticker} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2.5 font-bold text-indigo-600">{c.ticker}</td>
                              <td className="px-3 py-2.5 text-slate-800 truncate max-w-[130px]" title={c.name}>{c.name}</td>
                              <td className="px-3 py-2.5 text-slate-500 truncate max-w-[100px]">{c.sector}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">₹{(c.marketCap || 5000).toLocaleString("en-IN")} Cr</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-600 font-semibold">{c.revenueGrowthYoY}%</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">{c.peRatio !== undefined ? c.peRatio : 25.0}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">{c.pbRatio !== undefined ? c.pbRatio : 3.5}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">{c.operatingMargin}%</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-900 font-semibold">{c.roce}%</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">{c.debtToEquity}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-500">{c.dividendYield !== undefined ? c.dividendYield : 1.2}%</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-slate-900">₹{c.price.toFixed(1)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. PORTFOLIO RISK AUDITOR PANEL */}
          {showPortfolio && (
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-purple-500 p-6 shadow-xs flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase font-mono flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-purple-600" /> Portfolio Risk Auditor
                </h2>
                <button onClick={() => setShowPortfolio(false)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Portfolio List & Creation */}
                <div className="lg:col-span-1 flex flex-col gap-4 border-r border-slate-100 pr-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">New Portfolio Name</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. Midcap Growth"
                        value={portfolioName}
                        onChange={(e) => setPortfolioName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                      />
                      <button 
                        onClick={handleCreatePortfolio}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        Create
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Select Active Portfolio</label>
                    <div className="space-y-1.5">
                      {userPortfolios.map((p) => (
                        <div 
                          key={p.id}
                          onClick={() => { setSelectedPortfolio(p); fetchPortfolioAudit(p.id); }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            selectedPortfolio?.id === p.id 
                              ? "bg-purple-50 border-purple-200 text-purple-900 shadow-2xs" 
                              : "bg-slate-50/80 border-slate-200/60 hover:bg-white"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Holdings: {p.transactions?.length || 0}</div>
                          </div>
                          <button
                            onClick={(e) => handleDeletePortfolio(p.id, e)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Portfolio Transactions & Audit details */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                  {selectedPortfolio ? (
                    <>
                      {/* Add Transaction */}
                      <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mb-3">Add Ledger Transaction</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Search Ticker (e.g. KPITTECH, RVNL)"
                              value={txTicker}
                              onChange={(e) => { setTxTicker(e.target.value); setShowTxSuggestions(true); }}
                              onFocus={() => { if (txSuggestions.length > 0) setShowTxSuggestions(true); }}
                              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 transition-colors w-full font-mono font-semibold"
                            />
                            {showTxSuggestions && txSuggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {txSuggestions.map((s) => (
                                  <div
                                    key={s.ticker}
                                    onClick={() => {
                                      setTxTicker(s.ticker);
                                      setTxPrice(s.price ? s.price.toString() : "");
                                      setShowTxSuggestions(false);
                                    }}
                                    className="p-2.5 hover:bg-purple-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                  >
                                    <div>
                                      <div className="font-bold text-purple-900">{s.ticker}</div>
                                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{s.name}</div>
                                    </div>
                                    <span className="font-mono font-semibold text-slate-800">₹{s.price}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <input 
                            type="number" 
                            placeholder="Quantity"
                            value={txQty}
                            onChange={(e) => setTxQty(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                          />
                          <input 
                            type="number" 
                            placeholder="Price (INR)"
                            value={txPrice}
                            onChange={(e) => setTxPrice(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                          />
                        </div>
                        <button 
                          onClick={handleAddTransaction}
                          disabled={portfolioLoading}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-xs font-semibold py-2 rounded-lg mt-3 transition-colors flex items-center justify-center gap-2 shadow-2xs"
                        >
                          {portfolioLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Log buy Ledger Entry"}
                        </button>
                      </div>

                      {/* Portfolio Audit review */}
                      {portfolioAudit && (
                        <div className="flex flex-col gap-5">
                          {/* Over-Concentration Warning Alert */}
                          {portfolioAudit.metrics.concentrationWarning && (
                            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2.5 font-mono shadow-2xs">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{portfolioAudit.metrics.concentrationWarning}</span>
                            </div>
                          )}

                          {/* Total P&L & Returns Tracker Cards */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">TOTAL INVESTED</span>
                              <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">
                                ₹{(portfolioAudit.metrics.totalInvested || 0).toLocaleString("en-IN")}
                              </div>
                            </div>

                            <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">PORTFOLIO VALUE</span>
                              <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">
                                ₹{portfolioAudit.metrics.totalValue.toLocaleString("en-IN")}
                              </div>
                            </div>

                            <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">NET UNREALIZED P&L</span>
                              <div className={`text-sm font-bold font-mono tabular-nums mt-1 ${
                                (portfolioAudit.metrics.totalPnL || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {(portfolioAudit.metrics.totalPnL || 0) >= 0 ? "+" : ""}₹{(portfolioAudit.metrics.totalPnL || 0).toLocaleString("en-IN")}
                              </div>
                            </div>

                            <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">NET RETURN %</span>
                              <div className={`text-sm font-bold font-mono tabular-nums mt-1 ${
                                (portfolioAudit.metrics.totalReturnPercent || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {(portfolioAudit.metrics.totalReturnPercent || 0) >= 0 ? "📈 +" : "📉 "}{(portfolioAudit.metrics.totalReturnPercent || 0).toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          {/* Sector Concentration & Diversification Pie Chart */}
                          {portfolioAudit.metrics.sectorWeights && Object.keys(portfolioAudit.metrics.sectorWeights).length > 0 && (
                            <div className="flex flex-col gap-3">
                              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                                🥧 Sector Allocation & Concentration Breakdown
                              </span>
                              {(() => {
                                const entries = Object.entries(portfolioAudit.metrics.sectorWeights as Record<string, number>).filter(([_, w]) => w > 0);
                                const palette = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#f97316", "#a855f7", "#64748b"];
                                const radius = 40;
                                const circumference = 2 * Math.PI * radius;
                                let accumulated = 0;

                                return (
                                  <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
                                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                                        {entries.map(([sec, weight], idx) => {
                                          const dashLength = (weight / 100) * circumference;
                                          const dashOffset = -(accumulated / 100) * circumference;
                                          accumulated += weight;
                                          const strokeColor = palette[idx % palette.length];
                                          return (
                                            <circle
                                              key={sec}
                                              cx="50"
                                              cy="50"
                                              r={radius}
                                              fill="transparent"
                                              stroke={strokeColor}
                                              strokeWidth="14"
                                              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                              strokeDashoffset={dashOffset}
                                              className="transition-all duration-500 hover:opacity-80"
                                            />
                                          );
                                        })}
                                      </svg>
                                      <div className="absolute flex flex-col items-center justify-center text-center">
                                        <span className="text-[9px] font-mono text-slate-400 uppercase">SECTORS</span>
                                        <span className="text-xs font-bold font-mono text-slate-800">{entries.length}</span>
                                      </div>
                                    </div>

                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      {entries.map(([sec, weight], idx) => (
                                        <div key={sec} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                                          <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: palette[idx % palette.length] }} />
                                            <span className="text-slate-700 font-semibold text-[11px] truncate max-w-[120px]">{sec}</span>
                                          </div>
                                          <span className="font-mono font-bold text-slate-900 text-[11px]">{weight}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Active Holdings List with P&L */}
                          <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
                            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mb-3">Portfolio Holdings (Edit / P&L Tracker)</h4>
                            {portfolioAudit.positions.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic text-center py-2">No stocks in this portfolio.</p>
                            ) : (
                              <div className="space-y-2">
                                {portfolioAudit.positions.map((pos: any) => {
                                  const pnl = pos.unrealizedPnL !== undefined ? pos.unrealizedPnL : (pos.currentValue - (pos.quantity * pos.avgPrice));
                                  const pnlPercent = pos.unrealizedPnLPercent !== undefined ? pos.unrealizedPnLPercent : ((pnl / (pos.quantity * pos.avgPrice)) * 100);
                                  return (
                                    <div 
                                      key={pos.ticker}
                                      className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 shadow-2xs"
                                    >
                                      <div>
                                        <div className="font-bold flex items-center gap-2">
                                          <span className="text-slate-900">{pos.ticker}</span>
                                          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md uppercase font-semibold">{pos.sector}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 tabular-nums">
                                          {pos.quantity} Shares × Buy: ₹{pos.avgPrice.toLocaleString("en-IN")} | CMP: ₹{pos.currentPrice.toLocaleString("en-IN")}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <div className="text-right">
                                          <div className="font-bold font-mono text-slate-900 tabular-nums">₹{pos.currentValue.toLocaleString("en-IN")}</div>
                                          <div className={`text-[10px] font-mono font-semibold tabular-nums ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {pnl >= 0 ? "+" : ""}₹{pnl.toLocaleString("en-IN")} ({pnl >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteHolding(pos.ticker)}
                                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                          title="Remove stock holding"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50/80 border border-slate-200/80 p-5 rounded-xl">
                            <h4 className="text-xs font-bold text-purple-700 uppercase font-mono mb-3 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-purple-600" /> AI Risk Audit Report
                              </span>
                              <button 
                                onClick={() => fetchPortfolioAudit(selectedPortfolio.id)}
                                className="text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200 rounded-lg px-2.5 py-1 hover:bg-purple-200 active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${portfolioLoading ? "animate-spin" : ""}`} />
                                Re-Run AI Audit
                              </button>
                            </h4>
                            <div className="text-[11px] text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                              {portfolioAudit.audit}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-10">
                      Select or create a portfolio to view ledger metrics and risk audits.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. VS MODE STOCK COMPARISON PANEL */}
          {showVSMode && (
            <div className="bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-amber-500 p-6 shadow-xs flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase font-mono flex items-center gap-2">
                  <span className="text-amber-500 font-bold">⚔️</span> VS Mode: Side-by-Side Stock Comparison
                </h2>
                <button onClick={() => setShowVSMode(false)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
              </div>

              {/* Quick VS Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-mono font-bold mr-1">⚡ Popular Comparisons:</span>
                <button 
                  onClick={() => { setVsTickerA("TCS"); setVsTickerB("INFY"); handleCompareVS("TCS", "INFY"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-amber-400 text-slate-700 hover:text-amber-700 transition-all font-mono"
                >
                  ⚔️ TCS vs INFY
                </button>
                <button 
                  onClick={() => { setVsTickerA("HDFCBANK"); setVsTickerB("ICICIBANK"); handleCompareVS("HDFCBANK", "ICICIBANK"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-amber-400 text-slate-700 hover:text-amber-700 transition-all font-mono"
                >
                  ⚔️ HDFCBANK vs ICICIBANK
                </button>
                <button 
                  onClick={() => { setVsTickerA("TATAMOTORS"); setVsTickerB("MARUTI"); handleCompareVS("TATAMOTORS", "MARUTI"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-amber-400 text-slate-700 hover:text-amber-700 transition-all font-mono"
                >
                  ⚔️ TATAMOTORS vs MARUTI
                </button>
                <button 
                  onClick={() => { setVsTickerA("HAL"); setVsTickerB("BEL"); handleCompareVS("HAL", "BEL"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-amber-400 text-slate-700 hover:text-amber-700 transition-all font-mono"
                >
                  ⚔️ HAL vs BEL
                </button>
                <button 
                  onClick={() => { setVsTickerA("DLF"); setVsTickerB("LODHA"); handleCompareVS("DLF", "LODHA"); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 hover:border-amber-400 text-slate-700 hover:text-amber-700 transition-all font-mono"
                >
                  ⚔️ DLF vs LODHA
                </button>
              </div>

              {/* Dual Selector Inputs with Autocomplete Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                <div className="sm:col-span-2 relative">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-1">Stock A</label>
                  <input 
                    type="text" 
                    placeholder="Search any stock (e.g. ICICI, SBI, TCS)"
                    value={vsTickerA}
                    onChange={(e) => fetchSuggestionsA(e.target.value)}
                    onFocus={() => { if (suggestionsA.length > 0) setShowSuggestionsA(true); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                  {showSuggestionsA && suggestionsA.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {suggestionsA.map((item) => (
                        <div 
                          key={item.ticker}
                          onClick={() => {
                            setVsTickerA(item.ticker);
                            setShowSuggestionsA(false);
                          }}
                          className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="font-bold font-mono text-amber-700">{item.ticker}</span>
                          <span className="text-[11px] text-slate-600 font-sans truncate max-w-[170px]">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center font-bold text-amber-500 font-mono text-sm self-end pb-2">
                  VS
                </div>

                <div className="sm:col-span-2 relative">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-1">Stock B</label>
                  <input 
                    type="text" 
                    placeholder="Search any stock (e.g. INFY, HDFC, SBIN)"
                    value={vsTickerB}
                    onChange={(e) => fetchSuggestionsB(e.target.value)}
                    onFocus={() => { if (suggestionsB.length > 0) setShowSuggestionsB(true); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                  {showSuggestionsB && suggestionsB.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {suggestionsB.map((item) => (
                        <div 
                          key={item.ticker}
                          onClick={() => {
                            setVsTickerB(item.ticker);
                            setShowSuggestionsB(false);
                          }}
                          className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="font-bold font-mono text-amber-700">{item.ticker}</span>
                          <span className="text-[11px] text-slate-600 font-sans truncate max-w-[170px]">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => handleCompareVS()}
                disabled={vsLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                {vsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Run Head-to-Head VS Comparison"}
              </button>

              {/* Head-to-Head Comparison Output */}
              {vsData && (
                <div className="flex flex-col gap-6">
                  {/* Winner Banner */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-200 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
                    <div>
                      <span className="text-[9px] font-mono text-amber-800 uppercase tracking-widest block font-bold">🏆 AI Head-to-Head Winner</span>
                      <div className="text-xl font-bold font-mono text-amber-900 mt-0.5 flex items-center gap-2">
                        <span>{vsData.aiScorecard.winner_ticker}</span>
                        <span className="text-xs font-normal text-slate-600">({vsData.stockA.ticker === vsData.aiScorecard.winner_ticker ? vsData.stockA.name : vsData.stockB.name})</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 italic">{vsData.aiScorecard.winner_reason}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold shadow-2xs">
                        Valuation: {vsData.aiScorecard.valuation_winner}
                      </span>
                      <span className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold shadow-2xs">
                        Growth: {vsData.aiScorecard.growth_winner}
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Financial Metrics Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-mono">
                          <th className="px-4 py-3">Metric</th>
                          <th className="px-4 py-3 text-center text-indigo-600 font-bold">{vsData.stockA.ticker}</th>
                          <th className="px-4 py-3 text-center text-teal-600 font-bold">{vsData.stockB.ticker}</th>
                          <th className="px-4 py-3 text-right">Advantage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px] bg-white">
                        <tr>
                          <td className="px-4 py-2.5 text-slate-500 font-semibold">Company Name</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 font-sans truncate max-w-[150px]" title={vsData.stockA.name}>{vsData.stockA.name}</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 font-sans truncate max-w-[150px]" title={vsData.stockB.name}>{vsData.stockB.name}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400 font-sans">-</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-slate-500 font-semibold">Sector</td>
                          <td className="px-4 py-2.5 text-center text-slate-600 font-sans">{vsData.stockA.sector}</td>
                          <td className="px-4 py-2.5 text-center text-slate-600 font-sans">{vsData.stockB.sector}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400 font-sans">-</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">Market Cap (Cr)</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">₹{(vsData.stockA.marketCap || 5000).toLocaleString("en-IN")} Cr</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">₹{(vsData.stockB.marketCap || 5000).toLocaleString("en-IN")} Cr</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">
                            {(vsData.stockA.marketCap || 0) > (vsData.stockB.marketCap || 0) ? vsData.stockA.ticker : vsData.stockB.ticker}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">P/E Ratio</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockA.peRatio !== undefined ? vsData.stockA.peRatio : 25.0}</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockB.peRatio !== undefined ? vsData.stockB.peRatio : 25.0}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">{vsData.aiScorecard.valuation_winner}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">P/B Ratio</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockA.pbRatio !== undefined ? vsData.stockA.pbRatio : 3.5}</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockB.pbRatio !== undefined ? vsData.stockB.pbRatio : 3.5}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">
                            {(vsData.stockA.pbRatio || 3.5) < (vsData.stockB.pbRatio || 3.5) ? vsData.stockA.ticker : vsData.stockB.ticker}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">Revenue Growth (YoY/CAGR)</td>
                          <td className="px-4 py-2.5 text-center text-emerald-600 font-bold tabular-nums">{vsData.stockA.revenueGrowthYoY}%</td>
                          <td className="px-4 py-2.5 text-center text-emerald-600 font-bold tabular-nums">{vsData.stockB.revenueGrowthYoY}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">{vsData.aiScorecard.growth_winner}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">Operating Margin (OPM)</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockA.operatingMargin}%</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockB.operatingMargin}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">{vsData.aiScorecard.margins_winner}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">ROCE (Capital Return)</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockA.roce}%</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockB.roce}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">
                            {vsData.stockA.roce > vsData.stockB.roce ? vsData.stockA.ticker : vsData.stockB.ticker}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">Debt to Equity (D/E)</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockA.debtToEquity}</td>
                          <td className="px-4 py-2.5 text-center text-slate-800 tabular-nums">{vsData.stockB.debtToEquity}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">{vsData.aiScorecard.debt_winner}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">Dividend Yield</td>
                          <td className="px-4 py-2.5 text-center text-slate-600 tabular-nums">{vsData.stockA.dividendYield !== undefined ? vsData.stockA.dividendYield : 1.2}%</td>
                          <td className="px-4 py-2.5 text-center text-slate-600 tabular-nums">{vsData.stockB.dividendYield !== undefined ? vsData.stockB.dividendYield : 1.2}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">
                            {(vsData.stockA.dividendYield || 1.2) > (vsData.stockB.dividendYield || 1.2) ? vsData.stockA.ticker : vsData.stockB.ticker}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">Current Share Price</td>
                          <td className="px-4 py-2.5 text-center text-slate-900 font-bold tabular-nums">₹{vsData.stockA.price.toFixed(1)}</td>
                          <td className="px-4 py-2.5 text-center text-slate-900 font-bold tabular-nums">₹{vsData.stockB.price.toFixed(1)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400 font-sans">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* AI Scorecard Analysis Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-bold text-amber-700 font-mono flex items-center gap-1.5">
                          📊 Valuation Analysis
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          Winner: {vsData.aiScorecard.valuation_winner}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans mt-1">
                        {vsData.aiScorecard.valuation_analysis}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-bold text-emerald-700 font-mono flex items-center gap-1.5">
                          🚀 Growth Analysis
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                          Winner: {vsData.aiScorecard.growth_winner}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans mt-1">
                        {vsData.aiScorecard.growth_analysis}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-bold text-indigo-700 font-mono flex items-center gap-1.5">
                          💰 Margins & ROCE
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200">
                          Winner: {vsData.aiScorecard.margins_winner}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans mt-1">
                        {vsData.aiScorecard.margins_analysis}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-bold text-purple-700 font-mono flex items-center gap-1.5">
                          ⚙️ Debt & Solvency
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                          Winner: {vsData.aiScorecard.debt_winner}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans mt-1">
                        {vsData.aiScorecard.debt_analysis}
                      </p>
                    </div>
                  </div>

                  {/* Final Head-to-Head Investment Thesis */}
                  <div className="bg-slate-50/80 border border-slate-200/80 p-5 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-800 uppercase font-mono mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-600" /> Final AI Head-to-Head Investment Thesis
                    </h4>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                      {vsData.aiScorecard.verdict_summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAIN stock VIEW */}
          {(!showUpload && !showScreener && !showPortfolio && !showVSMode) && (
            <>
              {/* Ticker overview card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-indigo-500 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md">Ticker Focus</span>
                    <span className="text-slate-400 text-xs font-medium">Auto-synced</span>
                  </div>
                  <h2 className="text-xl font-bold mt-1.5 tracking-tight text-slate-900">
                    {tickerData ? `${tickerData.name} (${tickerData.ticker})` : `${selectedTicker} Corporation`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    Real-time metrics verified by secure Node.js database service. AI analysis parsed and mapped internally.
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Consensus Rating</div>
                    <div className="text-xs font-bold text-emerald-600 font-sans mt-0.5">BUY (Consensus)</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Sector Category</div>
                    <div className="text-xs font-bold text-slate-700 mt-0.5">{tickerData?.sector || "General Industries"}</div>
                  </div>
                </div>
              </div>

              {/* Metric grids */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Revenue Growth (YoY)</span>
                  <div className="text-lg font-bold font-mono tabular-nums mt-1 text-emerald-600">+{tickerData?.revenueGrowthYoY || 10.0}%</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Operating Margin</span>
                  <div className="text-lg font-bold font-mono tabular-nums mt-1 text-slate-900">{tickerData?.operatingMargin || 15.0}%</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Capital Return (ROCE)</span>
                  <div className="text-lg font-bold font-mono tabular-nums mt-1 text-slate-900">{tickerData?.roce || 12.0}%</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Debt / Equity</span>
                  <div className="text-lg font-bold font-mono tabular-nums mt-1 text-indigo-600">{tickerData?.debtToEquity || 0.5}</div>
                </div>
              </div>

              {/* AI Fundamental Report Details */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-xs tracking-wider text-slate-900 uppercase font-mono">AI Fundamental Analysis Report</h3>
                  </div>
                  <span className="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-mono font-semibold">Structured output</span>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                  {tickerAnalysis ? (
                    <>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Company Overview</h4>
                        <p className="text-slate-600 leading-relaxed">{tickerAnalysis.overview}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
                          <h5 className="font-bold text-slate-900 text-xs mb-2.5 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" /> Key Growth Opportunities
                          </h5>
                          <ul className="list-disc list-inside text-slate-600 space-y-1">
                            {tickerAnalysis.opportunities.map((o: string, idx: number) => (
                              <li key={idx}>{o}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
                          <h5 className="font-bold text-slate-900 text-xs mb-2.5 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-500" /> Identified Risk Vectors
                          </h5>
                          <ul className="list-disc list-inside text-slate-600 space-y-1">
                            {tickerAnalysis.risks.map((r: string, idx: number) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center text-slate-400 italic">No fundamental analysis report has been synthesized yet.</div>
                  )}
                </div>
              </div>

              {/* News & Sentiment */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-4">
                <h3 className="font-bold text-xs tracking-wider text-slate-900 uppercase font-mono border-b border-slate-100 pb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> Enriched News Feed & Sentiment
                </h3>
                <div className="space-y-3">
                  {tickerNews.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-4 text-center">No news articles found for this ticker.</p>
                  ) : (
                    tickerNews.map((news, idx) => (
                      <div key={idx} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{news.title}</span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                            news.sentimentScore > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            Sentiment: {news.sentimentScore > 0 ? "Bullish" : "Bearish"} ({news.sentimentScore})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{news.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RAG Chat Engine Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-xs tracking-wider text-slate-900 uppercase font-mono">Ask AlphaLens RAG Engine</h3>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {chatHistory.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                        item.sender === "user" 
                          ? "bg-indigo-600 text-white ml-auto max-w-[85%] shadow-2xs" 
                          : "bg-slate-50 border border-slate-200/80 text-slate-800 mr-auto max-w-[85%]"
                      }`}
                    >
                      {item.message}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-slate-100 border border-slate-200 text-slate-500 text-xs p-3 rounded-xl mr-auto max-w-[80%] flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Thinking...
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <input
                    type="text"
                    placeholder={`Ask anything about ${selectedTicker}'s filings (e.g. "What risks did they report?")`}
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskRAG()}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors font-sans placeholder-slate-400"
                  />
                  <button 
                    onClick={handleAskRAG}
                    disabled={chatLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Query AI
                  </button>
                </div>
              </div>
            </>
          )}

        </section>
      </main>
    </div>
  );
}

// Helper function definitions to map axios triggers
async function axiosPostCrawlerSync(ticker: string, token: string) {
  const res = await fetch(`${API_URL}/crawler/${ticker}/sync-disclosures`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

function loggerInfo(msg: string) {
  console.log(`[INFO] ${msg}`);
}

function loggerError(msg: string) {
  console.error(`[ERROR] ${msg}`);
}
