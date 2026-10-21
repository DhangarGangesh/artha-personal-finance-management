import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  PieChart,
  Shield,
  CreditCard,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';

const FAQS = [
  {
    category: 'transactions',
    q: 'How do I record a new income or expense transaction?',
    a: 'Navigate to the Transactions page or click the Quick Add button on the Dashboard. Select "Expense" or "Income", enter the exact amount, pick the matching category (e.g. Food, Transport, Rent for expenses, or Salary, Freelance for income), add a description, and click Save.',
  },
  {
    category: 'budgets',
    q: 'How do monthly budget limits and warnings work?',
    a: 'You can define monthly budget limits for each expenditure category under the Budgets tab. When your spending crosses 85% of that threshold, the system displays amber warning badges and notification alerts to prevent overspending.',
  },
  {
    category: 'trends',
    q: 'How does the Financial Trends forecasting work without complex math?',
    a: 'Artha evaluates your historical transaction patterns to determine your personal savings elasticity. Instead of raw statistical regression formulas, it tells you in plain terms how much of every ₹100 of new income you consistently save, and projects your upcoming month-end cash balance.',
  },
  {
    category: 'goals',
    q: 'How do savings goals and milestones work?',
    a: 'Under the Goals section, you can set target amounts and target dates for milestones such as emergency funds, vacations, or home purchases. You can record manual contributions anytime and watch your progress update in real time.',
  },
  {
    category: 'security',
    q: 'Is my personal financial data secure and private?',
    a: 'All data is isolated per authenticated user session using industry-standard JWT encryption and strictly validated schemas. Your records are never shared with external aggregators without your explicit consent.',
  },
  {
    category: 'export',
    q: 'Can I export my financial data for tax preparation or backup?',
    a: 'Yes, head to Settings > Financial Preferences and click "Export Data". You can download a structured JSON file containing all your verified transactions, categories, and budget targets.',
  },
];

export const HelpCenter = () => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(0); // Index of open FAQ

  // Contact Form State
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast.error('Please enter both a subject and your message');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Your message has been sent to our financial support team');
      setContactSubject('');
      setContactMessage('');
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--brand-primary-light)',
            color: 'var(--brand-primary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          <HelpCircle size={14} />
          Knowledge Base & Support
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          How can we help you today?
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.5rem' }}>
          Search guides, explore frequently asked questions, or reach out directly to our wealth advisory team.
        </p>

        {/* Search Bar */}
        <div
          style={{
            maxWidth: '540px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search questions (e.g. budgets, categories, trends)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: '44px',
              height: '48px',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-card)',
              boxShadow: 'var(--shadow-md)',
            }}
          />
        </div>
      </div>

      {/* Quick Topic Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => setSearchQuery('transaction')}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <CreditCard size={20} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Transactions & Cash Flow</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Logging income, category rules, and managing transaction records.
          </p>
        </div>

        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => setSearchQuery('budget')}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <PieChart size={20} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Budgets & Targets</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Configuring monthly thresholds and overspending alerts.
          </p>
        </div>

        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => setSearchQuery('trends')}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: 'var(--brand-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <BookOpen size={20} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Trends & Forecasting</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Understanding your personal savings power and cash trajectories.
          </p>
        </div>

        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => setSearchQuery('security')}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Shield size={20} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Security & Privacy</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Encrypted storage, password policy, and data exports.
          </p>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Frequently Asked Questions {searchQuery && `(${filteredFaqs.length} results)`}
        </h2>

        {filteredFaqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No matching questions found for "{searchQuery}". You can submit a message below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isOpen ? 'var(--bg-subtle)' : 'var(--bg-card)',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: 'var(--bg-card)',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact Support Form */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--brand-primary)" />
              Still have questions? Contact Support
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Our dedicated financial support team responds within 24 hours
            </p>
          </div>
        </div>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="e.g. Issue with transaction categories, or trend forecast question"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Details</label>
            <textarea
              rows={4}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Describe your question or feedback..."
              className="form-input"
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={15} />
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HelpCenter;
