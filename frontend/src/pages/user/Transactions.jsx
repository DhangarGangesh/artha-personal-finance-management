import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react';
import { financeService } from '../../services/financeService';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ALL_CATEGORIES,
  getCategoriesForType,
} from '../../constants/categories';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

export const Transactions = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [categoriesData, setCategoriesData] = useState({
    expense: EXPENSE_CATEGORIES,
    income: INCOME_CATEGORIES,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Sync state if URL query changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [formType, setFormType] = useState('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Food');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await financeService.getCategories();
      if (res && (res.income || res.expense)) {
        setCategoriesData({
          expense: Array.isArray(res.expense) && res.expense.length ? res.expense : EXPENSE_CATEGORIES,
          income: Array.isArray(res.income) && res.income.length ? res.income : INCOME_CATEGORIES,
        });
      }
    } catch {
      // Keep fallback constants
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getTransactions({
        search,
        type: type || undefined,
        category: category || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        page,
        limit: 15,
      });

      // Response might be { transactions, total, page, totalPages } or { data, pagination }
      if (Array.isArray(res)) {
        setTransactions(res);
        setPagination({ total: res.length, totalPages: 1 });
      } else {
        setTransactions(res.transactions || res.items || []);
        setPagination({
          total: res.total || res.pagination?.total || 0,
          totalPages: res.totalPages || res.pagination?.totalPages || 1,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [search, type, category, startDate, endDate, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setFormType('expense');
    setFormAmount('');
    setFormCategory('Food');
    setFormDescription('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(String(tx.amount));
    setFormCategory(tx.category);
    setFormDescription(tx.description);
    setFormDate(new Date(tx.date).toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleTypeSwitch = (newType) => {
    setFormType(newType);
    const validCats = newType === 'income' ? categoriesData.income : categoriesData.expense;
    if (!validCats.includes(formCategory)) {
      setFormCategory(validCats[0]);
    }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: formType,
        amount,
        category: formCategory,
        description: formDescription.trim(),
        date: new Date(formDate).toISOString(),
      };

      if (editingTx) {
        await financeService.updateTransaction(editingTx._id, payload);
        toast.success('Transaction updated successfully');
      } else {
        await financeService.createTransaction(payload);
        toast.success('Transaction recorded successfully');
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      toast.error(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await financeService.deleteTransaction(deleteId);
      toast.success('Transaction deleted');
      setDeleteId(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err.message || 'Failed to delete transaction');
    }
  };

  const formatRupee = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Transactions
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            View, search, filter, and record your financial operations
          </p>
        </div>

        <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {/* Search by Description */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Type Filter */}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            <option value="">All Types (Income & Expense)</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            <option value="">All Categories</option>
            {(type === 'expense'
              ? categoriesData.expense
              : type === 'income'
              ? categoriesData.income
              : ALL_CATEGORIES
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            placeholder="From Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="form-input"
          />

          {/* End Date */}
          <input
            type="date"
            placeholder="To Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="form-input"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <Skeleton height="32px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="32px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="32px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="32px" />
          </div>
        ) : error ? (
          <div className="empty-state">
            <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
            <p>{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions match your current filters</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="artha-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{tx.description}</td>
                    <td>
                      <span className="badge badge-info">{tx.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className="mono-num"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatRupee(tx.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px' }}
                          title="Edit transaction"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(tx._id)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', color: 'var(--danger)' }}
                          title="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total {pagination.total} records • Page {page} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTx ? 'Edit Transaction' : 'Record Transaction'}
      >
        <form onSubmit={handleSaveTransaction}>
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`btn ${formType === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`btn ${formType === 'income' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="form-select"
            >
              {(formType === 'income' ? categoriesData.income : categoriesData.expense).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Grocery store, Salary, Coffee"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Saving...' : editingTx ? 'Save Changes' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        maxWidth="420px"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Are you sure you want to delete this transaction? This action will adjust your overall balance and budgets.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={() => setDeleteId(null)} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-danger">
            Delete Record
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Transactions;
