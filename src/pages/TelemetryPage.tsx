import React, { useState, useEffect } from 'react';
import { Activity, Server, BarChart3, RefreshCw, Zap, Play, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface MetricsSummary {
  service: string;
  timestamp: string;
  activeHolds: number;
  totalBookings: number;
  prometheusEndpoint: string;
  metrics: Array<{
    name: string;
    help: string;
    type: string;
    values: Array<{
      value: number;
      labels: Record<string, string>;
    }>;
  }>;
}

export const TelemetryPage: React.FC = () => {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [rawMetricsText, setRawMetricsText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [testingTraffic, setTestingTraffic] = useState<boolean>(false);
  const [trafficCount, setTrafficCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [sumRes, textRes] = await Promise.all([
        fetch('/api/metrics/summary').then((r) => r.json()),
        fetch('/metrics').then((r) => r.text()),
      ]);
      setSummary(sumRes);
      setRawMetricsText(textRes);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateTraffic = async () => {
    setTestingTraffic(true);
    const endpoints = ['/api/health', '/api/movies', '/api/shows', '/api/shows/show-1/seats'];
    for (let i = 0; i < 15; i++) {
      const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
      try {
        await fetch(ep);
      } catch {
        // ignore error
      }
      setTrafficCount((prev) => prev + 1);
      await new Promise((r) => setTimeout(r, 100));
    }
    await fetchMetrics();
    setTestingTraffic(false);
  };

  const copyDockerCommand = () => {
    navigator.clipboard.writeText('docker-compose up -d');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b09] text-white py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="emerald" icon={<Activity className="w-3 h-3" />}>
                Prometheus & Grafana
              </Badge>
              <Badge variant="neutral">prom-client v7+</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
              Movie<span className="text-emerald-400">Seat</span> Telemetry & Prometheus Metrics
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Real-time instrumentation exporter for Prometheus scraper at <code className="text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">/metrics</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchMetrics}
            >
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-4 h-4 text-black fill-black" />}
              onClick={handleSimulateTraffic}
              disabled={testingTraffic}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            >
              {testingTraffic ? 'Generating Traffic...' : 'Simulate Traffic Load'}
            </Button>
          </div>
        </div>

        {/* Live Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-wider">
              <span>Prometheus Scraper</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-display flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              HTTP 200 OK
            </div>
            <p className="text-xs text-neutral-400 font-mono">/metrics endpoint operational</p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-wider">
              <span>Active Seat Holds</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-display">
              {summary ? summary.activeHolds : 0}
            </div>
            <p className="text-xs text-neutral-400 font-mono">movieseat_active_seat_holds</p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-wider">
              <span>Total Bookings</span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-display">
              {summary ? summary.totalBookings : 0}
            </div>
            <p className="text-xs text-neutral-400 font-mono">movieseat_tickets_booked_total</p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-wider">
              <span>Simulated Requests</span>
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-cyan-400 font-display">
              {trafficCount}
            </div>
            <p className="text-xs text-neutral-400 font-mono">Simulated API hits this session</p>
          </div>
        </div>

        {/* Quick Docker Instructions */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-800/40 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black font-display text-white">How to Run Docker (Dev & Prod)</h2>
              <p className="text-neutral-300 text-sm mt-1">
                Project Dockerfiles are consolidated in <code className="text-emerald-400 font-mono">/dockerfiles</code> with <code className="text-emerald-400 font-mono">docker-compose.dev.yml</code> and <code className="text-emerald-400 font-mono">docker-compose.prod.yml</code>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Copy className="w-4 h-4" />}
                onClick={() => {
                  navigator.clipboard.writeText('docker-compose -f dockerfiles/docker-compose.dev.yml up -d');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                Copy Dev Command
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={copied ? <CheckCircle2 className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                onClick={() => {
                  navigator.clipboard.writeText('docker-compose -f dockerfiles/docker-compose.prod.yml up -d');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-black"
              >
                Copy Prod Command
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-1">
              <div className="text-xs font-mono text-emerald-400 uppercase">1. Web Application</div>
              <div className="font-bold text-white text-sm">http://localhost:3000</div>
              <div className="text-xs text-neutral-400">Node Frontend + Express API</div>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-1">
              <div className="text-xs font-mono text-purple-400 uppercase">2. Java Backend</div>
              <div className="font-bold text-white text-sm">http://localhost:8085</div>
              <div className="text-xs text-neutral-400">Spring Boot Microservice</div>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-1">
              <div className="text-xs font-mono text-amber-400 uppercase">3. Prometheus UI</div>
              <div className="font-bold text-white text-sm">http://localhost:9090</div>
              <div className="text-xs text-neutral-400">Scrapes /metrics & Actuator</div>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-1">
              <div className="text-xs font-mono text-cyan-400 uppercase">4. Grafana Dashboard</div>
              <div className="font-bold text-white text-sm">http://localhost:3001</div>
              <div className="text-xs text-neutral-400">User: admin / Password: admin</div>
            </div>
          </div>
        </div>

        {/* Live Prometheus Exporter Scraping Feed */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="bg-neutral-950 px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="font-mono text-xs text-neutral-300 font-bold uppercase tracking-wider">
                Raw Prometheus Output (<a href="/metrics" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-1">/metrics <ExternalLink className="w-3 h-3" /></a>)
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              Scrape Interval: 5s
            </span>
          </div>

          <div className="p-4 bg-[#050806] font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-96 leading-relaxed select-all">
            <pre>{rawMetricsText || '# Fetching Prometheus metrics...'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
