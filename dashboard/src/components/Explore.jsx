import React, { useState, useEffect, useMemo, useContext } from "react";
import apiClient from "../config/api";
import { useMarketData } from "../context/MarketDataContext";
import GeneralContext from "./GeneralContext";
import { useToast } from "./ui/ToastContainer";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Comprehensive metadata for all supported instruments
const ALL_STOCKS_METADATA = [
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd",
    sector: "Information Technology",
    category: "Large Cap",
    marketCap: "₹14.2L Cr",
    pe: 28.5,
    week52High: 4250.0,
    week52Low: 3150.0,
    description: "India's largest multinational IT services, digital transformation, and consulting powerhouse.",
    exchange: "NSE",
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd",
    sector: "Information Technology",
    category: "Large Cap",
    marketCap: "₹6.8L Cr",
    pe: 26.2,
    week52High: 1950.0,
    week52Low: 1350.0,
    description: "Global leader in next-generation digital services, artificial intelligence, and cloud ecosystems.",
    exchange: "NSE",
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    sector: "Energy & Conglomerate",
    category: "Large Cap",
    marketCap: "₹19.5L Cr",
    pe: 25.1,
    week52High: 3100.0,
    week52Low: 2220.0,
    description: "India's highest market cap conglomerate spanning petrochemicals, Jio Telecom, and Retail.",
    exchange: "NSE",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹12.9L Cr",
    pe: 18.8,
    week52High: 1795.0,
    week52Low: 1360.0,
    description: "India's foremost private sector banking institution commanding premier retail credit scale.",
    exchange: "NSE",
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹8.4L Cr",
    pe: 17.5,
    week52High: 1310.0,
    week52Low: 930.0,
    description: "Premier private banking and financial conglomerate with diversified corporate solutions.",
    exchange: "NSE",
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹7.1L Cr",
    pe: 10.4,
    week52High: 910.0,
    week52Low: 550.0,
    description: "India's historic public sector banking pillar with unmatched nationwide reach and deposits.",
    exchange: "NSE",
  },
  {
    symbol: "ITC",
    name: "ITC Ltd",
    sector: "Consumer Goods & FMCG",
    category: "Large Cap",
    marketCap: "₹5.6L Cr",
    pe: 26.8,
    week52High: 520.0,
    week52Low: 395.0,
    description: "Resilient consumer goods powerhouse across branded foods, hotels, packaging, and agriculture.",
    exchange: "NSE",
  },
  {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever Ltd",
    sector: "Consumer Goods & FMCG",
    category: "Large Cap",
    marketCap: "₹5.9L Cr",
    pe: 54.2,
    week52High: 3030.0,
    week52Low: 2170.0,
    description: "India's greatest FMCG leader touch-pointing over 9 out of 10 households across the subcontinent.",
    exchange: "NSE",
  },
  {
    symbol: "WIPRO",
    name: "Wipro Ltd",
    sector: "Information Technology",
    category: "Large Cap",
    marketCap: "₹2.8L Cr",
    pe: 22.4,
    week52High: 580.0,
    week52Low: 375.0,
    description: "Comprehensive global software services, cognitive computing, and cybersecurity services.",
    exchange: "NSE",
  },
  {
    symbol: "M&M",
    name: "Mahindra & Mahindra Ltd",
    sector: "Automotive",
    category: "Large Cap",
    marketCap: "₹3.5L Cr",
    pe: 31.0,
    week52High: 3220.0,
    week52Low: 1510.0,
    description: "Global automotive pioneer commanding SUV leadership, electric vehicles, and farm tractors.",
    exchange: "NSE",
  },
  {
    symbol: "ONGC",
    name: "Oil & Natural Gas Corp",
    sector: "Energy & Resources",
    category: "Large Cap",
    marketCap: "₹3.1L Cr",
    pe: 7.2,
    week52High: 345.0,
    week52Low: 178.0,
    description: "State-owned hydrocarbon major producing the vast majority of India's crude oil and domestic gas.",
    exchange: "NSE",
  },
  {
    symbol: "AXISBANK",
    name: "Axis Bank Ltd",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹3.4L Cr",
    pe: 13.9,
    week52High: 1340.0,
    week52Low: 935.0,
    description: "Third largest private sector bank providing agile retail lending and corporate treasury.",
    exchange: "NSE",
  },
  {
    symbol: "KOTAKBANK",
    name: "Kotak Mahindra Bank",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹3.6L Cr",
    pe: 20.8,
    week52High: 1930.0,
    week52Low: 1540.0,
    description: "Leading private commercial banking, wealth management, and securities brokerage group.",
    exchange: "NSE",
  },
  {
    symbol: "KPITTECH",
    name: "KPIT Technologies Ltd",
    sector: "Automotive & Software",
    category: "Mid Cap",
    marketCap: "₹38,500 Cr",
    pe: 62.5,
    week52High: 1930.0,
    week52Low: 1060.0,
    description: "Specialized embedded software and autonomous mobility architecture partner for global OEMs.",
    exchange: "NSE",
  },
  {
    symbol: "QUICKHEAL",
    name: "Quick Heal Technologies Ltd",
    sector: "Cybersecurity & Software",
    category: "Small Cap",
    marketCap: "₹2,600 Cr",
    pe: 41.2,
    week52High: 620.0,
    week52Low: 290.0,
    description: "Indian enterprise cybersecurity innovator offering Seqrite zero-trust and endpoint protection.",
    exchange: "NSE",
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors Ltd",
    sector: "Automotive",
    category: "Large Cap",
    marketCap: "₹3.6L Cr",
    pe: 10.2,
    week52High: 1179.0,
    week52Low: 605.0,
    description: "Global automotive multinational manufacturing passenger cars, commercial haulers, and Jaguar Land Rover.",
    exchange: "NSE",
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Ltd",
    sector: "Telecommunications",
    category: "Large Cap",
    marketCap: "₹8.9L Cr",
    pe: 45.3,
    week52High: 1650.0,
    week52Low: 890.0,
    description: "Leading global telecommunications company operating across 18 countries across South Asia and Africa.",
    exchange: "NSE",
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Ltd",
    sector: "Infrastructure & Engineering",
    category: "Large Cap",
    marketCap: "₹5.1L Cr",
    pe: 37.6,
    week52High: 3950.0,
    week52Low: 2870.0,
    description: "Indian tech, engineering, construction, and manufacturing conglomerate leading mega-scale global infrastructure.",
    exchange: "NSE",
  },
  {
    symbol: "BAJFINANCE",
    name: "Bajaj Finance Ltd",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹4.3L Cr",
    pe: 29.8,
    week52High: 8190.0,
    week52Low: 6160.0,
    description: "Premier diversified NBFC offering consumer finance, omnichannel lending, payments, and SME wealth.",
    exchange: "NSE",
  },
  {
    symbol: "BAJAJFINSV",
    name: "Bajaj Finserv Ltd",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹2.9L Cr",
    pe: 36.4,
    week52High: 1980.0,
    week52Low: 1420.0,
    description: "Financial holding company operating major retail finance, life insurance, and general insurance arms.",
    exchange: "NSE",
  },
  {
    symbol: "HCLTECH",
    name: "HCL Technologies Ltd",
    sector: "Information Technology",
    category: "Large Cap",
    marketCap: "₹4.8L Cr",
    pe: 28.1,
    week52High: 1890.0,
    week52Low: 1210.0,
    description: "Global technology enterprise delivering deep engineering, cloud modernization, and software IP.",
    exchange: "NSE",
  },
  {
    symbol: "SUNPHARMA",
    name: "Sun Pharmaceutical Industries",
    sector: "Healthcare & Pharma",
    category: "Large Cap",
    marketCap: "₹4.5L Cr",
    pe: 42.0,
    week52High: 1950.0,
    week52Low: 1110.0,
    description: "India's largest pharmaceutical company manufacturing specialty generics and formulations worldwide.",
    exchange: "NSE",
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki India Ltd",
    sector: "Automotive",
    category: "Large Cap",
    marketCap: "₹3.9L Cr",
    pe: 28.7,
    week52High: 13680.0,
    week52Low: 9740.0,
    description: "Passenger car market leader in India commanding high domestic share through Nexa and Arena networks.",
    exchange: "NSE",
  },
  {
    symbol: "NTPC",
    name: "NTPC Ltd",
    sector: "Energy & Resources",
    category: "Large Cap",
    marketCap: "₹3.9L Cr",
    pe: 18.5,
    week52High: 440.0,
    week52Low: 230.0,
    description: "India's largest thermal and renewable power generation conglomerate delivering national energy security.",
    exchange: "NSE",
  },
  {
    symbol: "POWERGRID",
    name: "Power Grid Corp of India",
    sector: "Energy & Resources",
    category: "Large Cap",
    marketCap: "₹3.2L Cr",
    pe: 20.3,
    week52High: 365.0,
    week52Low: 195.0,
    description: "Central transmission utility conveying over 85% of India's inter-regional bulk power through smart grids.",
    exchange: "NSE",
  },
  {
    symbol: "TITAN",
    name: "Titan Company Ltd",
    sector: "Consumer Goods & FMCG",
    category: "Large Cap",
    marketCap: "₹3.1L Cr",
    pe: 87.2,
    week52High: 3880.0,
    week52Low: 3050.0,
    description: "Leading lifestyle brand in jewelry (Tanishq), precision watches, eyewear, and premium fashion accessories.",
    exchange: "NSE",
  },
  {
    symbol: "ASIANPAINT",
    name: "Asian Paints Ltd",
    sector: "Consumer Goods & FMCG",
    category: "Large Cap",
    marketCap: "₹3.0L Cr",
    pe: 56.4,
    week52High: 3560.0,
    week52Low: 2780.0,
    description: "India's largest decorative paints manufacturer dominating home solutions, coatings, and waterproofing.",
    exchange: "NSE",
  },
  {
    symbol: "ULTRACEMCO",
    name: "UltraTech Cement Ltd",
    sector: "Infrastructure & Engineering",
    category: "Large Cap",
    marketCap: "₹3.2L Cr",
    pe: 44.1,
    week52High: 12100.0,
    week52Low: 7950.0,
    description: "Third largest cement producer globally outside China with massive gray cement and RMC capacities.",
    exchange: "NSE",
  },
  {
    symbol: "TATASTEEL",
    name: "Tata Steel Ltd",
    sector: "Infrastructure & Engineering",
    category: "Large Cap",
    marketCap: "₹1.9L Cr",
    pe: 22.0,
    week52High: 184.0,
    week52Low: 114.0,
    description: "Pioneering integrated global steel company with operations in India, Europe, and Southeast Asia.",
    exchange: "NSE",
  },
  {
    symbol: "COALINDIA",
    name: "Coal India Ltd",
    sector: "Energy & Resources",
    category: "Large Cap",
    marketCap: "₹3.1L Cr",
    pe: 8.4,
    week52High: 540.0,
    week52Low: 270.0,
    description: "World's largest coal-producing corporation supplying fuel critical to India's baseload power stations.",
    exchange: "NSE",
  },
  {
    symbol: "ADANIENT",
    name: "Adani Enterprises Ltd",
    sector: "Energy & Conglomerate",
    category: "Large Cap",
    marketCap: "₹3.5L Cr",
    pe: 95.8,
    week52High: 3450.0,
    week52Low: 2150.0,
    description: "Flagship incubator for Adani Group developing green hydrogen, airport hubs, roads, and data centers.",
    exchange: "NSE",
  },
  {
    symbol: "ADANIPORTS",
    name: "Adani Ports and SEZ Ltd",
    sector: "Infrastructure & Engineering",
    category: "Large Cap",
    marketCap: "₹3.1L Cr",
    pe: 34.2,
    week52High: 1620.0,
    week52Low: 755.0,
    description: "India's largest commercial port developer and integrated logistics operator spanning Mundra to Colombo.",
    exchange: "NSE",
  },
  {
    symbol: "JSWSTEEL",
    name: "JSW Steel Ltd",
    sector: "Infrastructure & Engineering",
    category: "Large Cap",
    marketCap: "₹2.3L Cr",
    pe: 26.5,
    week52High: 1040.0,
    week52Low: 735.0,
    description: "Flagship business of JSW Group manufacturing high-grade flat and long steels for core industries.",
    exchange: "NSE",
  },
  {
    symbol: "GRASIM",
    name: "Grasim Industries Ltd",
    sector: "Energy & Conglomerate",
    category: "Large Cap",
    marketCap: "₹1.8L Cr",
    pe: 27.8,
    week52High: 2870.0,
    week52Low: 1880.0,
    description: "Aditya Birla flagship commanding global leadership in viscose staple fiber, chemicals, and paints.",
    exchange: "NSE",
  },
  {
    symbol: "TECHM",
    name: "Tech Mahindra Ltd",
    sector: "Information Technology",
    category: "Large Cap",
    marketCap: "₹1.6L Cr",
    pe: 34.7,
    week52High: 1720.0,
    week52Low: 1090.0,
    description: "Digital transformation leader delivering 5G network integration, telecom engineering, and cloud platforms.",
    exchange: "NSE",
  },
  {
    symbol: "CIPLA",
    name: "Cipla Ltd",
    sector: "Healthcare & Pharma",
    category: "Large Cap",
    marketCap: "₹1.3L Cr",
    pe: 28.3,
    week52High: 1700.0,
    week52Low: 1130.0,
    description: "Global healthcare champion known for affordable generic medicines, inhalers, and respiratory formulations.",
    exchange: "NSE",
  },
  {
    symbol: "DRREDDY",
    name: "Dr. Reddy's Laboratories Ltd",
    sector: "Healthcare & Pharma",
    category: "Large Cap",
    marketCap: "₹1.1L Cr",
    pe: 19.5,
    week52High: 7100.0,
    week52Low: 5200.0,
    description: "Global pharmaceutical leader providing active pharmaceutical ingredients (APIs), biosimilars, and generics.",
    exchange: "NSE",
  },
  {
    symbol: "NESTLEIND",
    name: "Nestle India Ltd",
    sector: "Consumer Goods & FMCG",
    category: "Large Cap",
    marketCap: "₹2.4L Cr",
    pe: 74.2,
    week52High: 2770.0,
    week52Low: 2140.0,
    description: "Iconic consumer nutrition and food processing giant behind Maggi, Nescafe, KitKat, and Cerelac.",
    exchange: "NSE",
  },
  {
    symbol: "BRITANNIA",
    name: "Britannia Industries Ltd",
    sector: "Consumer Goods & FMCG",
    category: "Large Cap",
    marketCap: "₹1.4L Cr",
    pe: 62.0,
    week52High: 6100.0,
    week52Low: 4430.0,
    description: "Centenary food brand dominating biscuits (Good Day, Marie Gold), dairy, and packaged bakery goods.",
    exchange: "NSE",
  },
  {
    symbol: "EICHERMOT",
    name: "Eicher Motors Ltd",
    sector: "Automotive",
    category: "Large Cap",
    marketCap: "₹1.3L Cr",
    pe: 31.8,
    week52High: 5100.0,
    week52Low: 3370.0,
    description: "Global mid-weight motorcycle leader through the iconic Royal Enfield brand and VE Commercial Vehicles.",
    exchange: "NSE",
  },
  {
    symbol: "DIVISLAB",
    name: "Divi's Laboratories Ltd",
    sector: "Healthcare & Pharma",
    category: "Large Cap",
    marketCap: "₹1.4L Cr",
    pe: 72.1,
    week52High: 5450.0,
    week52Low: 3350.0,
    description: "One of the world's top API manufacturers specializing in custom synthesis and nutraceutical ingredients.",
    exchange: "NSE",
  },
  {
    symbol: "APOLLOHOSP",
    name: "Apollo Hospitals Enterprise Ltd",
    sector: "Healthcare & Pharma",
    category: "Large Cap",
    marketCap: "₹1.0L Cr",
    pe: 82.5,
    week52High: 7300.0,
    week52Low: 4700.0,
    description: "India's largest integrated healthcare network spanning multispecialty hospitals, Apollo 24|7, and pharmacies.",
    exchange: "NSE",
  },
  {
    symbol: "INDUSINDBK",
    name: "IndusInd Bank Ltd",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹1.1L Cr",
    pe: 12.8,
    week52High: 1690.0,
    week52Low: 1330.0,
    description: "Modern commercial bank with substantial retail vehicle financing, microfinance, and global remittances.",
    exchange: "NSE",
  },
  {
    symbol: "HEROMOTOCO",
    name: "Hero MotoCorp Ltd",
    sector: "Automotive",
    category: "Large Cap",
    marketCap: "₹1.1L Cr",
    pe: 26.4,
    week52High: 5890.0,
    week52Low: 2950.0,
    description: "World's largest two-wheeler manufacturer by volume pioneering Splendor, Passion, and Vida EV mobility.",
    exchange: "NSE",
  },
  {
    symbol: "HINDALCO",
    name: "Hindalco Industries Ltd",
    sector: "Infrastructure & Engineering",
    category: "Large Cap",
    marketCap: "₹1.5L Cr",
    pe: 14.8,
    week52High: 715.0,
    week52Low: 448.0,
    description: "World's largest aluminum rolling company and major copper producer through Novelis and Indian smelters.",
    exchange: "NSE",
  },
  {
    symbol: "BPCL",
    name: "Bharat Petroleum Corp Ltd",
    sector: "Energy & Resources",
    category: "Large Cap",
    marketCap: "₹1.5L Cr",
    pe: 8.6,
    week52High: 390.0,
    week52Low: 160.0,
    description: "Maharatna energy corporation refining crude and marketing fuel across a vast pan-India retail grid.",
    exchange: "NSE",
  },
  {
    symbol: "IOC",
    name: "Indian Oil Corporation Ltd",
    sector: "Energy & Resources",
    category: "Large Cap",
    marketCap: "₹2.4L Cr",
    pe: 7.9,
    week52High: 196.0,
    week52Low: 85.0,
    description: "India's highest ranking government energy corporate refining nearly half of national petroleum consumption.",
    exchange: "NSE",
  },
  {
    symbol: "ZOMATO",
    name: "Zomato Ltd",
    sector: "Internet & Technology",
    category: "Large Cap",
    marketCap: "₹2.3L Cr",
    pe: 110.0,
    week52High: 298.0,
    week52Low: 98.0,
    description: "India's premier hyperlocal consumer platform leading food delivery, Blinkit quick commerce, and Hyperpure.",
    exchange: "NSE",
  },
  {
    symbol: "JIOFIN",
    name: "Jio Financial Services Ltd",
    sector: "Banking & Finance",
    category: "Large Cap",
    marketCap: "₹2.2L Cr",
    pe: 135.0,
    week52High: 394.0,
    week52Low: 204.0,
    description: "Next-generation digital financial services platform providing consumer loans, merchant POS, and asset management.",
    exchange: "NSE",
  },
  {
    symbol: "PAYTM",
    name: "One97 Communications Ltd",
    sector: "Internet & Technology",
    category: "Mid Cap",
    marketCap: "₹43,000 Cr",
    pe: 45.0,
    week52High: 998.0,
    week52Low: 310.0,
    description: "Pioneer of QR payments and digital financial inclusion offering soundbox merchants, loans, and wallet services.",
    exchange: "NSE",
  },
];

const SECTORS = [
  "All",
  "Information Technology",
  "Banking & Finance",
  "Consumer Goods & FMCG",
  "Automotive",
  "Energy & Resources",
  "Healthcare & Pharma",
  "Infrastructure & Engineering",
  "Internet & Technology",
  "Telecommunications",
  "Cybersecurity & Software",
];

const Explore = () => {
  const { getQuote } = useMarketData();
  const { openBuyWindow, openSellWindow, refreshKey, triggerRefresh } = useContext(GeneralContext);
  const { addToast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    let ignore = false;
    apiClient
      .get("/watchlist")
      .then((res) => {
        if (!ignore && res.data?.success && res.data?.data) {
          setWatchlistSymbols(res.data.data.symbols || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load user watchlist in Explore:", err);
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleToggleWatchlist = async (symbol) => {
    if (actionInProgress) return;
    const isAdded = watchlistSymbols.includes(symbol);
    setActionInProgress(symbol);

    try {
      if (isAdded) {
        const res = await apiClient.delete(`/watchlist/${symbol}`);
        if (res.data?.success && res.data?.data) {
          setWatchlistSymbols(res.data.data.symbols || []);
          triggerRefresh();
          addToast(`Removed ${symbol} from watchlist`, "info");
        }
      } else {
        const res = await apiClient.post("/watchlist", { symbol });
        if (res.data?.success && res.data?.data) {
          setWatchlistSymbols(res.data.data.symbols || []);
          triggerRefresh();
          addToast(`Added ${symbol} to watchlist`, "success");
        }
      }
    } catch (err) {
      console.error("Watchlist toggle error in Explore:", err);
      addToast(err.response?.data?.message || "Failed to update watchlist", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredStocks = useMemo(() => {
    const cleanQuery = search.toLowerCase().trim();
    return ALL_STOCKS_METADATA.filter((stock) => {
      const matchesSearch =
        !cleanQuery ||
        stock.symbol.toLowerCase().includes(cleanQuery) ||
        stock.name.toLowerCase().includes(cleanQuery) ||
        stock.sector.toLowerCase().includes(cleanQuery);

      const matchesSector =
        selectedSector === "All" || stock.sector === selectedSector;

      return matchesSearch && matchesSector;
    });
  }, [search, selectedSector]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 pb-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Compass className="size-6 sm:size-7 text-cyan-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Explore Stocks
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Explore all institutional equities available on the platform with real-time market streaming, valuation metrics, and one-click execution.
          </p>
        </div>

        {/* Quick Market Stats Counter */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Badge variant="outline" className="px-3 py-1.5 text-xs text-emerald-400 gap-1.5 border-emerald-500/20 bg-emerald-500/10">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NSE Live</span>
          </Badge>
        </div>
      </div>

      {/* Controls: Search & Sector Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414] border border-white/10">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stocks by name, symbol, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-[#1A1A1A] text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        {/* Sector Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {SECTORS.map((sector) => {
            const isSelected = selectedSector === sector;
            return (
              <button
                key={sector}
                type="button"
                onClick={() => setSelectedSector(sector)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  isSelected
                    ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,216,246,0.3)] font-bold"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                )}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredStocks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-[#141414]/50">
          <div className="size-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3">
            <Search className="size-6" />
          </div>
          <p className="text-sm font-semibold text-white">No matching stocks found</p>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search or clearing the sector filter.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setSelectedSector("All");
            }}
            className="mt-4 text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* 4 Cards in a Row Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.map((stock) => {
            const quote = getQuote(stock.symbol);
            const livePrice = quote?.price ?? stock.week52Low;
            const changePercent = quote?.changePercent ?? 0;
            const isDown = changePercent < 0;

            return (
              <Card
                key={stock.symbol}
                className="flex flex-col justify-between bg-[#141414] border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_24px_rgba(0,216,246,0.1)] transition-all duration-300 group"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black text-white group-hover:text-cyan-400 transition-colors">
                          {stock.symbol}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 text-slate-400">
                          {stock.exchange}
                        </Badge>
                      </div>
                      <h3
                        className="text-xs font-semibold text-slate-400 mt-0.5 line-clamp-1"
                        title={stock.name}
                      >
                        {stock.name}
                      </h3>
                    </div>

                    {/* Add to Watchlist / Already Added Checkmark Option */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleToggleWatchlist(stock.symbol)}
                          disabled={actionInProgress === stock.symbol}
                          className={cn(
                            "size-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer",
                            watchlistSymbols.includes(stock.symbol)
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30"
                              : "bg-white/5 text-slate-400 border border-white/10 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                          )}
                          aria-label={
                            watchlistSymbols.includes(stock.symbol)
                              ? `Remove ${stock.symbol} from watchlist`
                              : `Add ${stock.symbol} to watchlist`
                          }
                        >
                          {actionInProgress === stock.symbol ? (
                            <Loader2 className="size-3.5 animate-spin text-cyan-400" />
                          ) : watchlistSymbols.includes(stock.symbol) ? (
                            <Check className="size-3.5 stroke-[2.5]" />
                          ) : (
                            <Plus className="size-3.5" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {watchlistSymbols.includes(stock.symbol)
                          ? "In Watchlist (click to remove)"
                          : "Add to Watchlist"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  {/* Price & Live Change Banner */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="text-xl font-black text-white tabular-nums tracking-tight">
                      ₹{livePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded shrink-0",
                        isDown
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      )}
                    >
                      {isDown ? (
                        <ArrowDownRight className="size-2.5 mr-0.5 shrink-0" />
                      ) : (
                        <ArrowUpRight className="size-2.5 mr-0.5 shrink-0" />
                      )}
                      {changePercent >= 0 ? "+" : ""}
                      {changePercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Market Cap
                      </span>
                      <span className="font-bold text-slate-200 tabular-nums">
                        {stock.marketCap}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        P/E Ratio
                      </span>
                      <span className="font-bold text-slate-200 tabular-nums">
                        {stock.pe}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        52W High
                      </span>
                      <span className="font-semibold text-emerald-400 tabular-nums text-[11px]">
                        ₹{stock.week52High.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        52W Low
                      </span>
                      <span className="font-semibold text-rose-400 tabular-nums text-[11px]">
                        ₹{stock.week52Low.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Quick Buy & Sell Execution Actions */}
                <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-white/5 mt-auto">
                  <Button
                    type="button"
                    onClick={() => openBuyWindow(stock.symbol)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-sm hover:shadow-emerald-500/20 transition-all cursor-pointer h-8.5"
                  >
                    Buy
                  </Button>
                  <Button
                    type="button"
                    onClick={() => openSellWindow(stock.symbol)}
                    className="w-full bg-rose-500 hover:bg-rose-400 text-black font-bold text-xs shadow-sm hover:shadow-rose-500/20 transition-all cursor-pointer h-8.5"
                  >
                    Sell
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </TooltipProvider>
  );
};

export default Explore;
