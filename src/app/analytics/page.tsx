"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Loader2, TrendingUp, Building2, MapPin, Activity } from "lucide-react";
import { getMetrics, formatAED } from "@/lib/api";
import type { MetricsResponse } from "@/lib/api";

const CHART_COLORS = [
  "#c9a84c",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
  "#f97316",
  "#22c55e",
  "#14b8a6",
];

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="p-6 bg-danger/10 border border-danger/30 rounded-xl text-danger">
          <p className="font-semibold">Could not load analytics</p>
          <p className="text-sm mt-1">
            {error || "Make sure the API is running on localhost:8000"}
          </p>
        </div>
      </div>
    );
  }

  const { r2, mae_aed, mape_pct, median_absolute_error_aed } = metrics.metrics;
  const summary = metrics.training_summary;

  const featureData = metrics.feature_importance.map((f) => ({
    name: f.feature
      .replace(/_encoded/g, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    value: +(f.importance * 100).toFixed(2),
  }));

  const modelAccuracyData = [
    { metric: "R2 Score", value: +(r2 * 100).toFixed(1), max: 100 },
    { metric: "MAPE Accuracy", value: +(100 - mape_pct).toFixed(1), max: 100 },
  ];

  const splitData = [
    { name: "Train", value: summary.train_rows },
    { name: "Test", value: summary.test_rows },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gold-text">Market Analytics</span>
        </h1>
        <p className="text-muted mt-2">
          Model performance metrics and market insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={<Activity className="w-5 h-5" />}
          label="Model R2"
          value={`${(r2 * 100).toFixed(1)}%`}
          sub="Variance explained"
          color="text-success"
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          label="MAPE"
          value={`${mape_pct.toFixed(1)}%`}
          sub="Avg prediction error"
          color="text-accent"
        />
        <KPICard
          icon={<Building2 className="w-5 h-5" />}
          label="MAE"
          value={formatAED(mae_aed)}
          sub="Mean absolute error"
          color="text-primary"
        />
        <KPICard
          icon={<MapPin className="w-5 h-5" />}
          label="Median Error"
          value={formatAED(median_absolute_error_aed)}
          sub="50th percentile error"
          color="text-primary-light"
        />
      </div>

      {/* Training summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Transactions", value: summary.rows_after_filtering.toLocaleString() },
          { label: "Zones", value: summary.zones_seen.toString() },
          { label: "Buildings", value: summary.buildings_seen.toLocaleString() },
          { label: "From", value: summary.min_date },
          { label: "To", value: summary.max_date },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 bg-card rounded-lg border border-card-border text-center"
          >
            <div className="text-xs text-muted">{s.label}</div>
            <div className="text-sm font-semibold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="p-6 bg-card rounded-xl border border-card-border">
          <h3 className="text-lg font-semibold mb-4">Feature Importance (%)</h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={featureData}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: "#e2e8f0", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                }}
                formatter={(val) => [`${val}%`, "Importance"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {featureData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model Accuracy Radar */}
        <div className="p-6 bg-card rounded-xl border border-card-border">
          <h3 className="text-lg font-semibold mb-4">Model Accuracy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={modelAccuracyData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#e2e8f0", fontSize: 12 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Radar
                dataKey="value"
                stroke="#c9a84c"
                fill="#c9a84c"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-background rounded-lg text-center">
              <div className="text-2xl font-bold gold-text">
                {(r2 * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted">R2 Score</div>
            </div>
            <div className="p-3 bg-background rounded-lg text-center">
              <div className="text-2xl font-bold text-accent">
                {(100 - mape_pct).toFixed(1)}%
              </div>
              <div className="text-xs text-muted">Prediction Accuracy</div>
            </div>
          </div>
        </div>

        {/* Train/Test Split */}
        <div className="p-6 bg-card rounded-xl border border-card-border">
          <h3 className="text-lg font-semibold mb-4">
            Train / Test Split (80/20)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={splitData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) =>
                  `${name}: ${(value / 1000).toFixed(0)}K`
                }
              >
                <Cell fill="#c9a84c" />
                <Cell fill="#3b82f6" />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                }}
                formatter={(val) => [Number(val).toLocaleString(), "Rows"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Error distribution info */}
        <div className="p-6 bg-card rounded-xl border border-card-border">
          <h3 className="text-lg font-semibold mb-4">Error Analysis</h3>
          <div className="space-y-4">
            <ErrorBar
              label="Mean Absolute Error"
              value={mae_aed}
              max={1000000}
              color="bg-danger"
            />
            <ErrorBar
              label="Median Absolute Error"
              value={median_absolute_error_aed}
              max={1000000}
              color="bg-primary"
            />
            <div className="mt-6 p-4 bg-background rounded-lg">
              <p className="text-sm text-muted leading-relaxed">
                The median error of{" "}
                <span className="text-primary font-semibold">
                  {formatAED(median_absolute_error_aed)}
                </span>{" "}
                means that for 50% of properties, the model&apos;s prediction is
                within this range of the actual sale price. The model performs
                best for mid-range properties in high-volume zones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="p-5 bg-card rounded-xl border border-card-border card-hover">
      <div className={`${color} mb-3`}>{icon}</div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted mt-1">{sub}</p>
    </div>
  );
}

function ErrorBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-semibold">{formatAED(value)}</span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
