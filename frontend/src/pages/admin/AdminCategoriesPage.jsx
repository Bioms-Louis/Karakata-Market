import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit2, Tag, X, Check,
  ChevronRight, ChevronDown, FolderOpen, Folder
} from 'lucide-react';
import {
  getAdminCategories, createCategory,
  updateCategory, deleteCategory
} from '../../api/admin.api';
import Spinner from '../../components/common/Spinner';

const inputClass = `
  w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
  text-sm outline-none focus:ring-2 focus:ring-yellow-400
  focus:border-transparent transition-all
`;

// Build tree from flat array
const buildTree = (flat) => {
  const map = {};
  const roots = [];
  flat.forEach(c => { map[c.id] = { ...c, children: [] }; });
  flat.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else if (!c.parent_id) {
      roots.push(map[c.id]);
    }
  });
  return roots;
};

// Get depth of a category
const getDepth = (flat, id) => {
  let depth = 0;
  let current = flat.find(c => c.id === id);
  while (current?.parent_id) {
    depth++;
    current = flat.find(c => c.id === current.parent_id);
  }
  return depth;
};

// Get all ancestors label for breadcrumb display
const getAncestorPath = (flat, id) => {
  const path = [];
  let current = flat.find(c => c.id === id);
  while (current?.parent_id) {
    current = flat.find(c => c.id === current.parent_id);
    if (current) path.unshift(current.name);
  }
  return path;
};

// CATEGORY FORM MODAL
const CategoryModal = ({ onClose, editCategory, allCategories, presetParentId }) => {
  const queryClient = useQueryClient();
  const isEditing = !!editCategory;

  const currentDepth = isEditing
    ? getDepth(allCategories, editCategory.id)
    : null;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name:        editCategory?.name        || '',
      description: editCategory?.description || '',
      icon:        editCategory?.icon        || '',
      parentId:    editCategory?.parent_id   || presetParentId || '',
    }
  });

  const selectedParentId = watch('parentId');

  const eligibleParents = allCategories.filter(c => {
    if (isEditing && c.id === editCategory.id) return false;
    const depth = getDepth(allCategories, c.id);
    return depth < 2;
  });

  // Show what level this will be
  const newDepth = selectedParentId
    ? getDepth(allCategories, selectedParentId) + 1
    : 0;

  const levelLabels = ['Top-level category', 'Sub-category', 'Sub-sub-category'];

  const mutation = useMutation({
    mutationFn: (data) => isEditing
      ? updateCategory(editCategory.id, data)
      : createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEditing ? 'Category updated!' : 'Category created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed.')
  });

  const onSubmit = (data) => {
    mutation.mutate({
      name:        data.name,
      description: data.description || null,
      icon:        data.icon        || null,
      parentId:    data.parentId    || null,
    });
  };

  // Group eligible parents by their own parent for the select
  const rootParents  = eligibleParents.filter(c => !c.parent_id);
  const level1Parents = eligibleParents.filter(c => c.parent_id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input type="text" placeholder="e.g. T-Shirts" className={inputClass}
                   {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Parent selector — shown for both create and edit */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Parent Category
              <span className="text-gray-400 font-normal ml-1">(leave empty for top-level)</span>
            </label>
            <select className={inputClass} {...register('parentId')}>
              <option value="">None — Top-level category</option>

              {/* Level 0 roots as direct parents (creates level 1 sub) */}
              {rootParents.length > 0 && (
                <optgroup label="── Top-level (creates sub-category)">
                  {rootParents.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Level 1 subs as parents (creates level 2 sub-sub) */}
              {level1Parents.length > 0 && (
                <optgroup label="── Sub-categories (creates sub-sub-category)">
                  {level1Parents.map(cat => {
                    const parentName = allCategories.find(c => c.id === cat.parent_id)?.name;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {parentName ? `${parentName} › ` : ''}{cat.name}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>

            {/* Level indicator badge */}
            {!isEditing && (
              <div className="mt-2 flex items-center gap-2">
                {[0, 1, 2].map(lvl => (
                  <span key={lvl}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      newDepth === lvl
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    style={newDepth === lvl ? { backgroundColor: '#3c1a5b' } : {}}>
                    Level {lvl + 1}
                  </span>
                ))}
                <span className="text-xs text-gray-500">
                  → {levelLabels[newDepth]}
                </span>
              </div>
            )}
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Icon Emoji <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input type="text" placeholder="e.g. 👕" className={inputClass}
                   {...register('icon')} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea rows={3} placeholder="Brief description..."
                      className={inputClass} {...register('description')} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                    style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
              {mutation.isPending ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : isEditing ? <><Check size={16} />Save Changes</> : <><Plus size={16} />Create</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// CATEGORY ROW
const DEPTH_STYLES = [
  { indent: 0,  bg: 'bg-purple-50', border: '#3c1a5b', dot: 20, fontSize: 'text-sm font-bold' },
  { indent: 28, bg: 'bg-blue-50',   border: '#3b82f6', dot: 16, fontSize: 'text-sm font-semibold' },
  { indent: 56, bg: 'bg-green-50',  border: '#22c55e', dot: 12, fontSize: 'text-sm' },
];

const CategoryRow = ({ node, depth = 0, allFlat, onEdit, onDelete, onAddChild }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;
  const style = DEPTH_STYLES[Math.min(depth, 2)];
  const canAddChild = depth < 2;

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
        style={{ paddingLeft: `${16 + style.indent}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center shrink-0 text-gray-400"
        >
          {hasChildren
            ? expanded
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />
            : <span className="w-3 h-3 rounded-full border-2 border-gray-200 block" />
          }
        </button>

        {/* Icon */}
        <div className={`rounded-lg flex items-center justify-center text-base shrink-0 ${style.bg}`}
             style={{ width: style.dot + 12, height: style.dot + 12 }}>
          {node.icon || (depth === 0 ? '📦' : depth === 1 ? '📁' : '📄')}
        </div>

        {/* Name + breadcrumb */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-gray-900 ${style.fontSize}`}>{node.name}</span>
            {depth === 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                    style={{ backgroundColor: '#3c1a5b' }}>
                Level 1
              </span>
            )}
            {depth === 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white bg-blue-500">
                Level 2
              </span>
            )}
            {depth === 2 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white bg-green-500">
                Level 3
              </span>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{node.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="text-center shrink-0 w-14">
          <p className="text-sm font-bold" style={{ color: '#3c1a5b' }}>{node.product_count}</p>
          <p className="text-xs text-gray-400">products</p>
        </div>
        {hasChildren && (
          <div className="text-center shrink-0 w-14">
            <p className="text-sm font-bold text-gray-600">{node.children.length}</p>
            <p className="text-xs text-gray-400">children</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 hrink-0">
          {canAddChild && (
            <button onClick={() => onAddChild(node)}
                    title={`Add sub-category under ${node.name}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors">
              <Plus size={14} />
            </button>
          )}
          <button onClick={() => onEdit(node)}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(node.id, node.name)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Recursive children */}
      {expanded && hasChildren && node.children.map(child => (
        <CategoryRow
          key={child.id}
          node={child}
          depth={depth + 1}
          allFlat={allFlat}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </>
  );
};

// MAIN PAGE
const AdminCategoriesPage = () => {
  const [showModal, setShowModal]       = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [presetParent, setPresetParent] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn:  getAdminCategories,
    select:   (res) => res.data.data.categories,
    staleTime: 0,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot delete this category.')
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (cat) => {
    setPresetParent(null);
    setEditCategory(cat);
    setShowModal(true);
  };

  const handleAddChild = (parentNode) => {
    setEditCategory(null);
    setPresetParent(parentNode);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditCategory(null);
    setPresetParent(null);
    setShowModal(true);
  };

  const tree = data ? buildTree(data) : [];

  // Stats
  const totalCats  = data?.length || 0;
  const level1     = data?.filter(c => !c.parent_id).length || 0;
  const level2     = data?.filter(c => c.parent_id && !data.find(p => p.id === c.parent_id)?.parent_id).length || 0;
  const level3     = data?.filter(c => {
    const parent = data.find(p => p.id === c.parent_id);
    return parent && parent.parent_id;
  }).length || 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">
            3-level hierarchy: Top-level → Sub-category → Sub-sub-category
          </p>
        </div>
        <button onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Stats row */}
      {!isLoading && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total',      value: totalCats, color: '#3c1a5b' },
            { label: 'Level 1',    value: level1,    color: '#3c1a5b' },
            { label: 'Level 2',    value: level2,    color: '#3b82f6' },
            { label: 'Level 3',    value: level3,    color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500 bg-white rounded-xl border border-gray-100 px-4 py-3">
        <span className="font-semibold text-gray-600">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#3c1a5b' }} />
          Level 1 — Top-level (e.g. Fashion)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-blue-500" />
          Level 2 — Sub-category (e.g. Men's Clothing)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-green-500" />
          Level 3 — Sub-sub-category (e.g. T-Shirts)
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <Plus size={12} className="text-yellow-600" />
          = Add child category
        </span>
      </div>

      {/* Tree */}
      {isLoading ? <Spinner center /> : tree.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Tag size={40} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">No categories yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Category" to create your first one</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Category Tree ({totalCats} total)
            </h2>
            <p className="text-xs text-gray-400">
              Click <ChevronRight size={10} className="inline" /> to expand/collapse
            </p>
          </div>
          <div>
            {tree.map(root => (
              <CategoryRow
                key={root.id}
                node={root}
                depth={0}
                allFlat={data}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CategoryModal
          onClose={() => { setShowModal(false); setEditCategory(null); setPresetParent(null); }}
          editCategory={editCategory}
          allCategories={data || []}
          presetParentId={presetParent?.id || null}
        />
      )}
    </div>
  );
};

export default AdminCategoriesPage;