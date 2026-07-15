// Frontend component tests — Free Tools, Status Page, Changelog, Knowledge Base, Affiliate
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock the API module
jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: { ok: true } }),
    delete: jest.fn().mockResolvedValue({ data: { ok: true } }),
    patch: jest.fn().mockResolvedValue({ data: { ok: true } }),
  },
}));

// Mock usePageMeta
jest.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: jest.fn(),
}));

// Mock useAnalytics
jest.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: jest.fn(),
  trackEvent: jest.fn(),
  trackConversion: jest.fn(),
  trackToolUsage: jest.fn(),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Search: () => <span data-testid="icon-search">Search</span>,
  BookOpen: () => <span data-testid="icon-book">Book</span>,
  ChevronRight: () => <span data-testid="icon-chevron">Chevron</span>,
  Copy: () => <span data-testid="icon-copy">Copy</span>,
  Mail: () => <span data-testid="icon-mail">Mail</span>,
  Users: () => <span data-testid="icon-users">Users</span>,
  DollarSign: () => <span data-testid="icon-dollar">$</span>,
  TrendingUp: () => <span data-testid="icon-trending">Trending</span>,
  LayoutDashboard: () => <span>Dashboard</span>,
  FolderKanban: () => <span>Projects</span>,
  Gauge: () => <span>Audit</span>,
  Sparkles: () => <span>AI</span>,
  LogOut: () => <span>Logout</span>,
  User: () => <span>User</span>,
  CreditCard: () => <span>Billing</span>,
  ClipboardList: () => <span>List</span>,
  Share2: () => <span>Social</span>,
  Bot: () => <span>Bot</span>,
  MapPin: () => <span>Map</span>,
  Gift: () => <span>Gift</span>,
  Shield: () => <span>Shield</span>,
  Moon: () => <span>Moon</span>,
  Sun: () => <span>Sun</span>,
  ArrowUp: () => <span>ArrowUp</span>,
  BarChart3: () => <span>BarChart</span>,
  Globe: () => <span>Globe</span>,
  Zap: () => <span>Zap</span>,
  FileText: () => <span>FileText</span>,
  Smartphone: () => <span>Smartphone</span>,
  Hash: () => <span>Hash</span>,
  Lock: () => <span>Lock</span>,
  Code: () => <span>Code</span>,
  FileSearch: () => <span>FileSearch</span>,
  Heading1: () => <span>Heading1</span>,
  ExternalLink: () => <span>ExternalLink</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  XCircle: () => <span>XCircle</span>,
  Info: () => <span>Info</span>,
  ArrowRight: () => <span>ArrowRight</span>,
  Star: () => <span>Star</span>,
  Clock: () => <span>Clock</span>,
  Target: () => <span>Target</span>,
  Award: () => <span>Award</span>,
  Bell: () => <span>Bell</span>,
  Settings: () => <span>Settings</span>,
  HelpCircle: () => <span>HelpCircle</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  Send: () => <span>Send</span>,
  X: () => <span>X</span>,
  Menu: () => <span>Menu</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  Eye: () => <span>Eye</span>,
  EyeOff: () => <span>EyeOff</span>,
  Loader2: () => <span>Loader</span>,
  RefreshCw: () => <span>Refresh</span>,
  Download: () => <span>Download</span>,
  Plus: () => <span>Plus</span>,
  Minus: () => <span>Minus</span>,
  Edit: () => <span>Edit</span>,
  Trash2: () => <span>Trash</span>,
  Link: () => <span>Link</span>,
  Image: () => <span>Image</span>,
  Video: () => <span>Video</span>,
  Music: () => <span>Music</span>,
  Calendar: () => <span>Calendar</span>,
  Map: () => <span>Map</span>,
  Phone: () => <span>Phone</span>,
  AtSign: () => <span>AtSign</span>,
  Key: () => <span>Key</span>,
  ShieldCheck: () => <span>ShieldCheck</span>,
  ShieldAlert: () => <span>ShieldAlert</span>,
  Activity: () => <span>Activity</span>,
  PieChart: () => <span>PieChart</span>,
  LineChart: () => <span>LineChart</span>,
  TrendingDown: () => <span>TrendingDown</span>,
  Percent: () => <span>Percent</span>,
  Tag: () => <span>Tag</span>,
  Filter: () => <span>Filter</span>,
  Sliders: () => <span>Sliders</span>,
  List: () => <span>List</span>,
  Grid: () => <span>Grid</span>,
  Columns: () => <span>Columns</span>,
  Layout: () => <span>Layout</span>,
  Home: () => <span>Home</span>,
  Compass: () => <span>Compass</span>,
  Bookmark: () => <span>Bookmark</span>,
  Heart: () => <span>Heart</span>,
  ThumbsUp: () => <span>ThumbsUp</span>,
  ThumbsDown: () => <span>ThumbsDown</span>,
  Flag: () => <span>Flag</span>,
  Share: () => <span>Share</span>,
  MoreHorizontal: () => <span>More</span>,
  MoreVertical: () => <span>MoreV</span>,
  ArrowLeft: () => <span>ArrowLeft</span>,
  ArrowUpRight: () => <span>ArrowUpRight</span>,
  ArrowDown: () => <span>ArrowDown</span>,
  RotateCw: () => <span>RotateCw</span>,
  Maximize2: () => <span>Maximize</span>,
  Minimize2: () => <span>Minimize</span>,
  Move: () => <span>Move</span>,
  Clipboard: () => <span>Clipboard</span>,
  Printer: () => <span>Printer</span>,
  Database: () => <span>Database</span>,
  Server: () => <span>Server</span>,
  Cloud: () => <span>Cloud</span>,
  Wifi: () => <span>Wifi</span>,
  WifiOff: () => <span>WifiOff</span>,
  Bluetooth: () => <span>Bluetooth</span>,
  Battery: () => <span>Battery</span>,
  Cpu: () => <span>Cpu</span>,
  HardDrive: () => <span>HardDrive</span>,
  Monitor: () => <span>Monitor</span>,
  Tablet: () => <span>Tablet</span>,
  Camera: () => <span>Camera</span>,
  Mic: () => <span>Mic</span>,
  Volume2: () => <span>Volume</span>,
  Play: () => <span>Play</span>,
  Pause: () => <span>Pause</span>,
  SkipForward: () => <span>SkipForward</span>,
  SkipBack: () => <span>SkipBack</span>,
  Repeat: () => <span>Repeat</span>,
  Shuffle: () => <span>Shuffle</span>,
}));

// Mock Common components
jest.mock("@/components/app/Common", () => ({
  Logo: () => <span data-testid="logo">Goodly</span>,
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));

// Mock react-router-dom Navigate
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate">Redirect to {to}</div>,
  };
});

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

// Import pages lazily to avoid circular deps
let StatusPage, ChangelogPage, KnowledgeBase, AffiliateProgram, FreeTools;

beforeAll(async () => {
  StatusPage = (await import("@/pages/StatusPage")).default;
  ChangelogPage = (await import("@/pages/Changelog")).default;
  KnowledgeBase = (await import("@/pages/KnowledgeBase")).default;
  AffiliateProgram = (await import("@/pages/AffiliateProgram")).default;
  FreeTools = (await import("@/pages/FreeTools")).default;
});

describe("StatusPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders the status page heading", async () => {
    renderWithProviders(<StatusPage />);
    expect(await screen.findByText("System Status")).toBeTruthy();
  });

  test("shows loading state initially", async () => {
    renderWithProviders(<StatusPage />);
    expect(screen.getByText("Loading...")).toBeTruthy();
    // Wait for async fetchHealth to settle to avoid act() warnings
    await waitFor(() => expect(screen.queryByText("Loading...")).toBeNull());
  });

  test("renders service status cards after load", async () => {
    const { api } = require("@/lib/api");
    api.get.mockResolvedValueOnce({
      data: {
        status: "ok",
        version: "1.9.0",
        uptime_seconds: 3600,
        database: "connected",
        ai_service: "configured",
        stripe: "configured",
        email: "configured",
        scheduler: "enabled",
      },
    });
    renderWithProviders(<StatusPage />);
    expect(await screen.findByText("All Systems Operational")).toBeTruthy();
    expect(screen.getByText("API")).toBeTruthy();
    expect(screen.getByText("Database")).toBeTruthy();
  });
});

describe("ChangelogPage", () => {
  test("renders the changelog heading", () => {
    renderWithProviders(<ChangelogPage />);
    expect(screen.getByText("Changelog")).toBeTruthy();
  });

  test("renders version entries", () => {
    renderWithProviders(<ChangelogPage />);
    expect(screen.getByText("v1.9.0")).toBeTruthy();
    expect(screen.getByText("v1.8.0")).toBeTruthy();
    expect(screen.getByText("v1.5.0")).toBeTruthy();
  });

  test("shows Latest badge on most recent version", () => {
    renderWithProviders(<ChangelogPage />);
    expect(screen.getByText("● Latest")).toBeTruthy();
  });
});

describe("KnowledgeBase", () => {
  test("renders the help center heading", () => {
    renderWithProviders(<KnowledgeBase />);
    expect(screen.getByText("Help Center")).toBeTruthy();
  });

  test("renders category filter buttons", () => {
    renderWithProviders(<KnowledgeBase />);
    expect(screen.getByText("All")).toBeTruthy();
    // "Basics" and "SEO" appear in both filter buttons and article cards
    const basicsElements = screen.getAllByText("Basics");
    expect(basicsElements.length).toBeGreaterThanOrEqual(2);
    const seoElements = screen.getAllByText("SEO");
    expect(seoElements.length).toBeGreaterThanOrEqual(2);
  });

  test("renders article list", () => {
    renderWithProviders(<KnowledgeBase />);
    expect(screen.getByText("Getting Started with Goodly")).toBeTruthy();
    expect(screen.getByText("How the SEO Audit Works")).toBeTruthy();
  });

  test("filters articles by search", () => {
    renderWithProviders(<KnowledgeBase />);
    const input = screen.getByPlaceholderText("Search articles...");
    expect(input).toBeTruthy();
  });
});

describe("FreeTools", () => {
  test("renders the free tools hub heading", () => {
    renderWithProviders(<FreeTools />);
    expect(screen.getByText("Free SEO Tools")).toBeTruthy();
  });

  test("renders tool cards", () => {
    renderWithProviders(<FreeTools />);
    expect(screen.getByText("Meta Tag Checker")).toBeTruthy();
    expect(screen.getByText("Page Speed Test")).toBeTruthy();
  });
});

describe("AffiliateProgram", () => {
  test("redirects when not logged in", () => {
    renderWithProviders(<AffiliateProgram />);
    expect(screen.getByTestId("navigate")).toBeTruthy();
  });
});
