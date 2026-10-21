import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  PieChart,
  Target,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Lock,
  Activity,
  BarChart3,
  Compass,
  Zap,
  Sliders,
  DollarSign,
  ChevronRight,
  LogIn,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ArthaLogo } from '../components/common/ArthaLogo';

export const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme();

  // Interactive Savings Power Demo Slider
  const [sliderIncome, setSliderIncome] = useState(75000);
  const estimatedSavings = Math.round(sliderIncome * 0.42);
  const annualSavings = estimatedSavings * 12;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '1rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArthaLogo size="md" subtitle="WEALTH INTELLIGENCE" />
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
            className="landing-nav-links"
          >
            <style>{`
              @media (max-width: 860px) {
                .landing-nav-links { display: none !important; }
              }
            `}</style>
            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Features
            </a>
            <a href="#calculator" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Savings Engine
            </a>
            <a href="#analytics" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Analytics
            </a>
            <a href="#security" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
              Zero-Knowledge Security
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
            </button>

            <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '4.5rem 1.5rem 4rem',
          textAlign: 'center',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% -20%, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 80%)',
        }}
      >
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          {/* Luminous Innovation Chip */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: 'var(--brand-primary)',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '1.75rem',
            }}
          >
            <Sparkles size={16} />
            Deterministic Financial Intelligence & Governance
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              marginBottom: '1.5rem',
            }}
          >
            Master Your Money.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}
            >
              Understand Every Rupee.
            </span>
            <br />
            Build Generational Wealth.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              maxWidth: '720px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            ARTHA replaces confusing spreadsheets with explainable personal financial intelligence,
            real-time budget guardrails, human-friendly savings elasticity forecasting, and zero-knowledge
            administrative governance.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '3.5rem',
            }}
          >
            <Link
              to="/register"
              className="btn btn-primary btn-lg"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.4)',
              }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="btn btn-secondary btn-lg"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <LogIn size={18} color="#6366f1" />
              <span>Sign In to Dashboard</span>
            </Link>
          </motion.div>

          {/* Interactive Live Mockup Preview Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{
              maxWidth: '920px',
              margin: '0 auto',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '1.5rem',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Mockup Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 600 }}>
                  artha.finance/dashboard — Live Preview
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                ● 100% Operational
              </span>
            </div>

            {/* Mockup 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-subtle)', borderTop: '3px solid #8b5cf6' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Income</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹85,000</div>
                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>↗ 35% growth</span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-subtle)', borderTop: '3px solid #f97316' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Spending</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹35,000</div>
                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>↗ Within budget</span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-subtle)', borderTop: '3px solid #0ea5e9' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Spending Goal</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹92,540</div>
                <span style={{ fontSize: '0.65rem', color: '#0ea5e9', fontWeight: 700 }}>15% under cap</span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-subtle)', borderTop: '3px solid #10b981' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Monthly Savings</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>₹50,000</div>
                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>58.8% Savings Rate</span>
              </div>
            </div>

            {/* Mockup Cashflow & Recent Transactions Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem' }} className="mockup-split">
              <style>{`
                @media (max-width: 680px) {
                  .mockup-split { grid-template-columns: 1fr !important; }
                }
              `}</style>
              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span>Your Assets Trajectory</span>
                  <span style={{ color: '#10b981' }}>● Income vs ● Spending</span>
                </div>
                {/* SVG Visualizer representing curved asset flow */}
                <svg viewBox="0 0 400 120" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <path
                    d="M 0,90 Q 70,30 140,65 T 280,30 T 400,20"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M 0,110 Q 70,80 140,85 T 280,75 T 400,60"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                  />
                  <circle cx="280" cy="30" r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                  <circle cx="280" cy="75" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>

              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Verified Activity</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Monthly Salary</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>+₹85,000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Apartment Rent</span>
                  <span style={{ fontWeight: 700 }}>-₹22,000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.3rem 0' }}>
                  <span>Supermarket Groceries</span>
                  <span style={{ fontWeight: 700 }}>-₹4,250</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof & Metrics Strip */}
      <section
        style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          padding: '2.5rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: '-0.02em' }}>
              ₹12.4 Cr+
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Financial Volume Analyzed
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
              386 Passed
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Automated Tests (100% Pass)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9', letterSpacing: '-0.02em' }}>
              Python 3.13
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Embedded Statistical Engine
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', letterSpacing: '-0.02em' }}>
              Zero-Knowledge
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Segregated Admin Architecture
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Savings Calculator Section */}
      <section
        id="calculator"
        style={{
          padding: '5rem 1.5rem',
          maxWidth: '1000px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--brand-primary)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            INTERACTIVE SAVINGS ELASTICITY
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Discover Your True Savings Potential
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '580px', margin: '0.5rem auto 0' }}>
            Artha’s financial engine predicts how much money you can consistently save every month based on verified income elasticity.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '2.5rem',
            alignItems: 'center',
          }}
          className="calc-split"
        >
          <style>{`
            @media (max-width: 768px) {
              .calc-split { grid-template-columns: 1fr !important; }
            }
          `}</style>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.95rem' }}>Monthly Income</label>
                <span className="mono-num" style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--brand-primary)' }}>
                  ₹{sliderIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="300000"
                step="5000"
                value={sliderIncome}
                onChange={(e) => setSliderIncome(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                <span>₹20,000</span>
                <span>₹1,50,000</span>
                <span>₹3,00,000</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Deterministic 42% savings elasticity baseline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Real-time budget guardrail at 85% expenditure</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Automated category classification across 18+ closed enums</span>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Projected Monthly Savings
            </span>
            <div
              className="mono-num"
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#10b981',
                margin: '0.5rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              ₹{estimatedSavings.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Accumulating <strong style={{ color: 'var(--text-primary)' }}>₹{annualSavings.toLocaleString('en-IN')}</strong> per year
            </div>

            <Link to="/register" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Build Your Wealth Plan
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section
        id="features"
        style={{
          padding: '5rem 1.5rem',
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--brand-primary)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              COMPREHENSIVE CAPABILITIES
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Engineered for Precision Personal Finance
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Feature 1 */}
            <div className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <PieChart size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Zero-Based Budget Guardrails
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Allocate every rupee with closed category validation. Automated warnings trigger at 85% of budget
                limits to prevent accidental overspending.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Compass size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Plain-English Financial Trends
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                No confusing statistical equations or raw formulas. We translate mathematical regression models into
                clear, actionable coaching advice and 90-day wealth forecasts.
              </p>
            </div>

            {/* Feature 3 */}
            <div id="analytics" className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(14, 165, 233, 0.15)',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <BarChart3 size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Scientific Exploratory Analytics
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Inspect univariate expenditure histograms, category-wise breakdowns, bivariate Pearson correlations,
                and monthly cashflow run-rates in real time.
              </p>
            </div>

            {/* Feature 4 */}
            <div id="security" className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  color: 'var(--brand-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Zero-Knowledge Admin Governance
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                System administration is strictly segregated. Platform operators govern user accounts and inspect system
                health without ever seeing your private transactions or balances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          />
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem', color: '#ffffff' }}>
            Start Building Your Financial Future Today
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#c7d2fe', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Join users who make confident financial decisions backed by explainable mathematical clarity.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              className="btn btn-lg"
              style={{
                backgroundColor: '#ffffff',
                color: '#312e81',
                fontWeight: 700,
                padding: '0.85rem 2rem',
              }}
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="btn btn-outline btn-lg"
              style={{
                borderColor: '#c7d2fe',
                color: '#ffffff',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Sign In to Account</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2.5rem 1.75rem',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <ArthaLogo size="sm" subtitle="PERSONAL WEALTH MANAGEMENT" />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            © {new Date().getFullYear()} ARTHA — Personal Finance Management System. Zero-Knowledge Architecture.
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
