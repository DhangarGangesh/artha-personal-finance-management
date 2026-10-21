import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  BarChart3,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Activity,
  Percent,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import '../../components/charts/ChartSetup';
import { financeService } from '../../services/financeService';
import { Skeleton } from '../../components/common/Skeleton';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, getChartOptions, exportChartAsPNG } from '../../components/charts/ChartTheme';
import { FinancialTrendForecastChart } from '../../components/charts/FinancialTrendForecastChart';
import { ESSENTIAL_CATEGORIES } from '../../constants/categories';

export const FinancialTrends = () => {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regressionData, setRegressionData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [budgetsData, setBudgetsData] = useState([]);

  // Active filter for Spending Trends (stacked vs multi-line)
  const [spendingViewMode, setSpendingViewMode] = useState('stacked'); // 'stacked' | 'lines'
  // Indicator detail expander
  const [expandedIndicator, setExpandedIndicator] = useState(null);

  const fetchAllTrendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [regRes, anaRes, budRes] = await Promise.all([
        financeService.getRegression(),
        financeService.getAnalytics(),
        financeService.getBudgets(),
      ]);
      setRegressionData(regRes);
      setAnalyticsData(anaRes);
      setBudgetsData(budRes.items || []);
    } catch (err) {
      setError(err.message || 'Failed to calculate financial trend models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTrendData();
  }, [fetchAllTrendData]);

  const incomeSavings = regressionData?.incomeSavings || {};
  const expenditureTrend = regressionData?.expenditureTrend || {};
  const monthlyData = expenditureTrend.monthlyData || analyticsData?.monthly || [];
  const forecast = expenditureTrend.forecast || null;

  // -------------------------------------------------------------
  // A. MONTHLY FINANCIAL OVERVIEW & DYNAMIC NATURAL-LANGUAGE INSIGHT
  // -------------------------------------------------------------
  const { monthlyOverviewChart, dynamicExplanation, momSummary } = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return {
        monthlyOverviewChart: { labels: [], datasets: [] },
        dynamicExplanation: 'No financial records available yet to generate trend analysis.',
        momSummary: null,
      };
    }

    const labels = monthlyData.map((m) => {
      if (m.month) {
        const parts = m.month.split('-');
        if (parts.length === 2) {
          const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, 1));
          return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        }
        return m.month;
      }
      return m.label || '';
    });

    const income = monthlyData.map((m) => Math.round(Number(m.income || 0)));
    const expense = monthlyData.map((m) => Math.round(Number(m.expenditure || m.expense || 0)));
    const savings = monthlyData.map((m) => Math.round(Number(m.savings !== undefined ? m.savings : (m.income || 0) - (m.expenditure || m.expense || 0))));

    const chart = {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Monthly Income',
          data: income,
          borderColor: CHART_PALETTE.income,
          backgroundColor: CHART_PALETTE.incomeLight,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          fill: false,
        },
        {
          type: 'line',
          label: 'Monthly Expenses',
          data: expense,
          borderColor: CHART_PALETTE.expense,
          backgroundColor: CHART_PALETTE.expenseLight,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          fill: false,
        },
        {
          type: 'bar',
          label: 'Net Savings',
          data: savings,
          backgroundColor: (ctx) => {
            const val = ctx.raw;
            return val >= 0 ? CHART_PALETTE.savings : CHART_PALETTE.expenseDanger;
          },
          borderRadius: 4,
          barPercentage: 0.45,
        },
      ],
    };

    // Calculate real Month-over-Month change from latest 2 observations
    const len = monthlyData.length;
    let explanation = '';
    let mom = null;

    if (len >= 2) {
      const cur = monthlyData[len - 1];
      const prev = monthlyData[len - 2];

      const curInc = Number(cur.income || 0);
      const prevInc = Number(prev.income || 0);
      const incDiff = curInc - prevInc;
      const incPct = prevInc > 0 ? ((incDiff / prevInc) * 100).toFixed(1) : null;

      const curExp = Number(cur.expenditure || cur.expense || 0);
      const prevExp = Number(prev.expenditure || prev.expense || 0);
      const expDiff = curExp - prevExp;
      const expPct = prevExp > 0 ? ((expDiff / prevExp) * 100).toFixed(1) : null;

      const curSav = curInc - curExp;
      const prevSav = prevInc - prevExp;
      const savDiff = curSav - prevSav;

      const curRate = curInc > 0 ? ((curSav / curInc) * 100).toFixed(1) : '0.0';
      const prevRate = prevInc > 0 ? ((prevSav / prevInc) * 100).toFixed(1) : '0.0';
      const ratePp = (Number(curRate) - Number(prevRate)).toFixed(1);

      mom = {
        curMonth: cur.month,
        prevMonth: prev.month,
        curInc,
        incDiff,
        incPct,
        curExp,
        expDiff,
        expPct,
        curSav,
        savDiff,
        curRate,
        ratePp,
      };

      // Generate accurate verbal narrative based on real figures
      const expVerb = expDiff > 0 ? 'increased by' : expDiff < 0 ? 'decreased by' : 'remained flat at';
      const expAbs = formatINR(Math.abs(expDiff));
      const expPctStr = expPct !== null ? ` (${Math.abs(Number(expPct))}%)` : '';

      const incVerb = incDiff > 0 ? 'increased by' : incDiff < 0 ? 'decreased by' : 'remained steady at';
      const incAbs = formatINR(Math.abs(incDiff));

      const savVerb = curSav >= 0 ? `delivering a surplus of ${formatINR(curSav)}` : `resulting in a deficit of ${formatINR(Math.abs(curSav))}`;

      explanation = `In your latest recorded month (${cur.month}), your expenses ${expVerb} ${expAbs}${expPctStr} compared with ${prev.month}, while your income ${incVerb} ${incAbs}, ${savVerb} (${curRate}% savings rate).`;
    } else if (len === 1) {
      const cur = monthlyData[0];
      const curInc = Number(cur.income || 0);
      const curExp = Number(cur.expenditure || cur.expense || 0);
      const curSav = curInc - curExp;
      const rate = curInc > 0 ? Math.round((curSav / curInc) * 100) : 0;
      explanation = `Recorded ${cur.month} shows income of ${formatINR(curInc)} and expenditure of ${formatINR(curExp)}, yielding a net savings rate of ${rate}%. Additional monthly records will generate comparative trend insights.`;
    }

    return { monthlyOverviewChart: chart, dynamicExplanation: explanation, momSummary: mom };
  }, [monthlyData]);

  // -------------------------------------------------------------
  // B. SPENDING TREND ANALYSIS (CATEGORIES ACROSS MONTHS)
  // -------------------------------------------------------------
  const { categoryTrendChart, risingCategories, fallingCategories } = useMemo(() => {
    const categoriesList = analyticsData?.univariate?.categorySpending || [];
    const totalExp = analyticsData?.overview?.totalExpenditure || 1;

    // Categorize shifts based on share of spending
    const sorted = [...categoriesList].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const topCats = sorted.slice(0, 5);

    // Compute rising vs falling categories
    const rising = sorted.filter((c) => (c.sharePercent || 0) >= 20);
    const falling = sorted.filter((c) => (c.sharePercent || 0) < 10);

    const labels = topCats.map((c) => c.category);
    const values = topCats.map((c) => Math.round(c.amount || 0));

    const chart = {
      labels,
      datasets: [
        {
          label: 'Expenditure Volume',
          data: values,
          backgroundColor: CHART_PALETTE.categories.slice(0, labels.length),
          borderRadius: 6,
        },
      ],
    };

    return {
      categoryTrendChart: chart,
      risingCategories: rising,
      fallingCategories: falling,
    };
  }, [analyticsData]);

  // -------------------------------------------------------------
  // D. 6 FINANCIAL HEALTH INDICATORS (CALCULATED & EXPLAINED)
  // -------------------------------------------------------------
  const healthIndicators = useMemo(() => {
    const totalInc = Number(analyticsData?.overview?.totalIncome || 0);
    const totalExp = Number(analyticsData?.overview?.totalExpenditure || 0);
    const totalSav = totalInc - totalExp;

    // 1. Savings Rate
    const savingsRate = totalInc > 0 ? Math.round((totalSav / totalInc) * 100) : 0;
    const savingsStatus = savingsRate >= 20 ? 'Optimal' : savingsRate >= 10 ? 'Moderate' : 'Under Target';

    // 2. Essential vs Discretionary Ratio
    const categoriesList = analyticsData?.univariate?.categorySpending || [];
    let essentialSum = 0;
    let discretionarySum = 0;
    categoriesList.forEach((c) => {
      const amt = Number(c.amount || 0);
      if (ESSENTIAL_CATEGORIES?.includes(c.category) || ['Food', 'Rent', 'Utilities', 'Healthcare', 'Transportation'].includes(c.category)) {
        essentialSum += amt;
      } else {
        discretionarySum += amt;
      }
    });
    const essentialPct = totalExp > 0 ? Math.round((essentialSum / totalExp) * 100) : 50;

    // 3. Budget Adherence
    const totalBudgets = budgetsData.length;
    const onTrackBudgets = budgetsData.filter((b) => (b.spent || 0) <= (b.amount || 0)).length;
    const budgetAdherencePct = totalBudgets > 0 ? Math.round((onTrackBudgets / totalBudgets) * 100) : 100;

    // 4. Income-to-Expense Ratio
    const coverageRatio = totalExp > 0 ? (totalInc / totalExp).toFixed(2) : 'N/A';

    // 5. Spending Volatility (Standard Deviation of monthly spend)
    const expenses = monthlyData.map((m) => Number(m.expenditure || m.expense || 0));
    let volatility = 0;
    if (expenses.length >= 2) {
      const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
      const variance = expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (expenses.length - 1);
      volatility = Math.round(Math.sqrt(variance));
    }

    // 6. Savings Habit Continuity
    const positiveSavingsMonths = monthlyData.filter((m) => {
      const sav = Number(m.savings !== undefined ? m.savings : (m.income || 0) - (m.expenditure || m.expense || 0));
      return sav > 0;
    }).length;
    const continuityPct = monthlyData.length > 0 ? Math.round((positiveSavingsMonths / monthlyData.length) * 100) : 0;

    return [
      {
        id: 'savings-rate',
        name: 'Net Savings Rate',
        value: `${savingsRate}%`,
        status: savingsStatus,
        color: savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#ef4444',
        measure: 'Proportion of gross total income preserved as surplus capital after all expenditures.',
        calculation: 'Formula: (Net Savings / Total Income) × 100',
        meaning: savingsRate >= 20
          ? 'Exceptional capital accumulation pace aligned with long-term financial independence.'
          : 'Meets basic buffer requirements, but discretionary trimming can accelerate savings goals.',
        limitations: 'Calculated over all recorded historical ledger periods; does not adjust for tax deductions.',
      },
      {
        id: 'essential-ratio',
        name: 'Essential vs Discretionary Split',
        value: `${essentialPct}% Essential`,
        status: essentialPct <= 60 ? 'Balanced' : 'High Baseline',
        color: essentialPct <= 60 ? '#10b981' : '#f59e0b',
        measure: 'Distribution between mandatory living costs (Housing, Food, Utilities) and lifestyle spending.',
        calculation: 'Formula: (Essential Category Spending / Total Spending) × 100',
        meaning: essentialPct <= 60
          ? 'Healthy flexibility in monthly budget allowing swift spending adjustments if income dips.'
          : 'High baseline obligations require maintaining an emergency fund of at least 3-6 months.',
        limitations: 'Relies on category classification tags (Food, Rent, Utilities categorized as essential).',
      },
      {
        id: 'budget-adherence',
        name: 'Budget Adherence Rate',
        value: `${budgetAdherencePct}%`,
        status: budgetAdherencePct === 100 ? 'Disciplined' : 'Breaches Present',
        color: budgetAdherencePct >= 80 ? '#10b981' : '#ef4444',
        measure: 'Percentage of established category spending limits operating strictly within bounds.',
        calculation: 'Formula: (Budgets Under Limit / Total Active Budgets) × 100',
        meaning: `${onTrackBudgets} of ${totalBudgets} configured category limits are currently respected.`,
        limitations: 'Reflects only active categories with explicit budget limits configured.',
      },
      {
        id: 'coverage-ratio',
        name: 'Income-to-Expense Coverage',
        value: `${coverageRatio}x`,
        status: Number(coverageRatio) >= 1.25 ? 'Robust' : Number(coverageRatio) >= 1.0 ? 'Tight' : 'Deficit',
        color: Number(coverageRatio) >= 1.25 ? '#10b981' : Number(coverageRatio) >= 1.0 ? '#f59e0b' : '#ef4444',
        measure: 'Ratio of inflows to outflows, representing how many times your income covers expenses.',
        calculation: 'Formula: Total Inflows / Total Outflows',
        meaning: Number(coverageRatio) >= 1.25
          ? 'Comfortable operating margin absorbing unexpected living cost fluctuations.'
          : 'Narrow liquidity buffer. Even minor spikes in expenses may erode past savings.',
        limitations: 'Aggregated across recorded timeframe; monthly ratios may vary.',
      },
      {
        id: 'spending-volatility',
        name: 'Spending Volatility (Std Dev)',
        value: formatINR(volatility),
        status: volatility < 10000 ? 'Stable' : 'Fluctuating',
        color: volatility < 10000 ? '#10b981' : '#0ea5e9',
        measure: 'Dispersion and month-to-month fluctuation in your total living expenditures.',
        calculation: 'Formula: Sample standard deviation s = √[ Σ(x - μ)² / (n - 1) ] across all months',
        meaning: volatility < 10000
          ? 'Predictable, consistent recurring lifestyle costs make forecasting reliable.'
          : 'Irregular or lumpy expenditures observed across different calendar months.',
        limitations: 'Requires at least 2 monthly observation cycles for statistical calculation.',
      },
      {
        id: 'savings-continuity',
        name: 'Savings Habit Continuity',
        value: `${continuityPct}%`,
        status: continuityPct >= 80 ? 'Habitual' : 'Intermittent',
        color: continuityPct >= 80 ? '#10b981' : '#f59e0b',
        measure: 'Consistency in ending months with positive net savings without deficit dipping.',
        calculation: 'Formula: (Months with Net Savings > 0 / Total Months) × 100',
        meaning: `Positive cash accumulation achieved in ${positiveSavingsMonths} of ${monthlyData.length} recorded months.`,
        limitations: 'Based on chronological calendar months in ledger.',
      },
    ];
  }, [analyticsData, budgetsData, monthlyData]);

  if (loading && !regressionData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="40%" height="36px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: '120px' }}><Skeleton height="100%" /></div>
          ))}
        </div>
        <div className="card" style={{ height: '360px' }}><Skeleton height="100%" /></div>
      </div>
    );
  }

  if (error && !regressionData) {
    return (
      <div className="card empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={36} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Unable to calculate financial trends</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button type="button" onClick={fetchAllTrendData} className="btn btn-primary">
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Title Header */}
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--brand-primary-light)',
            color: 'var(--brand-primary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          <Compass size={14} />
          Analytical Trend Workspace
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Financial Trends & Analytical Workspace
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Empirical Ordinary Least Squares (OLS) trends, month-over-month shifts, and predictive health indicators
        </p>
      </div>

      {/* SECTION A: DYNAMIC MONTHLY FINANCIAL OVERVIEW & VERBAL NARRATIVE */}
      <div className="card" style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Monthly Financial Trajectory</h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Chronological revenue vs living cost dynamics
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CHART_PALETTE.income }} /> Income
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CHART_PALETTE.expense }} /> Expenses
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CHART_PALETTE.savings }} /> Net Savings
            </span>
          </div>
        </div>

        {/* Dynamic Verbal Narrative generated from actual math */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
            borderLeft: '4px solid var(--brand-primary)',
            fontSize: '0.825rem',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>
            <Activity size={14} />
            <span>Automated Trend Summary</span>
          </div>
          <p style={{ margin: 0 }}>{dynamicExplanation}</p>
        </div>

        {/* Chart View */}
        <div style={{ position: 'relative', width: '100%', height: '300px' }}>
          <Line
            data={monthlyOverviewChart}
            options={getChartOptions({ isDark, showLegend: false })}
          />
        </div>
      </div>

      {/* SECTION C: MONTH-OVER-MONTH COMPARISON CARDS */}
      {momSummary && (
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Month-over-Month Shift ({momSummary.prevMonth} → {momSummary.curMonth})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {/* Income MoM Card */}
            <div className="card" style={{ padding: '1.1rem', borderLeft: `4px solid ${momSummary.incDiff >= 0 ? '#10b981' : '#f59e0b'}` }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Income Delta</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: momSummary.incDiff >= 0 ? '#10b981' : '#f59e0b', margin: '0.25rem 0' }}>
                {momSummary.incDiff >= 0 ? '+' : ''}{formatINR(momSummary.incDiff)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {momSummary.incPct !== null ? `${momSummary.incPct > 0 ? '+' : ''}${momSummary.incPct}% change` : 'No previous baseline'}
              </span>
            </div>

            {/* Expense MoM Card */}
            <div className="card" style={{ padding: '1.1rem', borderLeft: `4px solid ${momSummary.expDiff <= 0 ? '#10b981' : '#ef4444'}` }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Spending Delta</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: momSummary.expDiff <= 0 ? '#10b981' : '#ef4444', margin: '0.25rem 0' }}>
                {momSummary.expDiff >= 0 ? '+' : ''}{formatINR(momSummary.expDiff)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {momSummary.expPct !== null ? `${momSummary.expPct > 0 ? '+' : ''}${momSummary.expPct}% shift` : 'No previous baseline'}
              </span>
            </div>

            {/* Savings Delta Card */}
            <div className="card" style={{ padding: '1.1rem', borderLeft: `4px solid ${momSummary.savDiff >= 0 ? '#06b6d4' : '#f59e0b'}` }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Savings Delta</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: momSummary.savDiff >= 0 ? '#06b6d4' : '#f59e0b', margin: '0.25rem 0' }}>
                {momSummary.savDiff >= 0 ? '+' : ''}{formatINR(momSummary.savDiff)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Current Surplus: {formatINR(momSummary.curSav)}
              </span>
            </div>

            {/* Savings Rate Pp Card */}
            <div className="card" style={{ padding: '1.1rem', borderLeft: '4px solid #6366f1' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Savings Rate Impact</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: Number(momSummary.ratePp) >= 0 ? '#10b981' : '#f59e0b', margin: '0.25rem 0' }}>
                {Number(momSummary.ratePp) >= 0 ? '+' : ''}{momSummary.ratePp} pp
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Current Pace: {momSummary.curRate}% of income
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: CAREFULLY LABELED FORECASTS & PREDICTION INTERVALS */}
      <FinancialTrendForecastChart
        historicalData={monthlyData}
        fittedValues={expenditureTrend.fittedValues || []}
        forecast={forecast}
        title="Ordinary Least Squares Trend & 3-Month Projection"
        height={320}
      />

      {/* SECTION D: FINANCIAL HEALTH INDICATORS MATRIX */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Financial Health Diagnostics
          </h2>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Transparent financial metrics with mathematical formulas and explanations
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {healthIndicators.map((ind) => {
            const isExpanded = expandedIndicator === ind.id;

            return (
              <div
                key={ind.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${ind.color}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {ind.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: ind.color,
                        backgroundColor: `${ind.color}15`,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {ind.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem 0' }}>
                    {ind.value}
                  </div>

                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {ind.meaning}
                  </p>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedIndicator(isExpanded ? null : ind.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Hide Formula & Limitations' : 'Inspect Calculation Formula'}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '0.65rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        fontSize: '0.725rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        lineHeight: 1.4,
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Formula:</strong> {ind.calculation}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Measures:</strong> {ind.measure}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Limitations:</strong> {ind.limitations}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinancialTrends;
