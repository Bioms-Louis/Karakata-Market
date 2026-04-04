const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');
const slugify = require('slugify');

const getAllCategories = async () => {
  const result = await query(
    `SELECT id, name, slug, description, icon_url, parent_id, sort_order
     FROM categories
     WHERE is_active = true
     ORDER BY sort_order ASC, name ASC`
  );

  const allCategories = result.rows;
  
  const map = {};
  allCategories.forEach(c => { map[c.id] = { ...c, children: [] }; });

  const roots = [];
  allCategories.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else if (!c.parent_id) {
      roots.push(map[c.id]);
    }
  });

  return roots;
};

const getCategoryBySlug = async (slug) => {
  const result = await query(
    `SELECT id, name, slug, description, icon_url, parent_id
     FROM categories
     WHERE slug = $1 AND is_active = true`,
    [slug]
  );

  if (result.rows.length === 0) {
    throw new AppError('Category not found.', 404);
  }

  return result.rows[0];
};

const createCategory = async ({ name, description, iconUrl, parentId, sortOrder }) => {
  const slug = slugify(name, { lower: true, strict: true });
  const existing = await query(
    'SELECT id FROM categories WHERE slug = $1',
    [slug]
  );

  if (existing.rows.length > 0) {
    throw new AppError('A category with this name already exists.', 400);
  }
  if (parentId) {
    const parent = await query(
      'SELECT id FROM categories WHERE id = $1',
      [parentId]
    );
    if (parent.rows.length === 0) {
      throw new AppError('Parent category not found.', 404);
    }
  }

  const result = await query(
    `INSERT INTO categories (name, slug, description, icon_url, parent_id, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, slug, description || null, iconUrl || null, parentId || null, sortOrder || 0]
  );

  return result.rows[0];
};

const updateCategory = async (categoryId, updates) => {
  const { name, description, iconUrl, isActive, sortOrder } = updates;
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
    const newSlug = slugify(name, { lower: true, strict: true });
    fields.push(`slug = $${paramCount}`);
    values.push(newSlug);
    paramCount++;
  }

  if (description !== undefined) {
    fields.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }

  if (iconUrl !== undefined) {
    fields.push(`icon_url = $${paramCount}`);
    values.push(iconUrl);
    paramCount++;
  }

  if (isActive !== undefined) {
    fields.push(`is_active = $${paramCount}`);
    values.push(isActive);
    paramCount++;
  }

  if (sortOrder !== undefined) {
    fields.push(`sort_order = $${paramCount}`);
    values.push(sortOrder);
    paramCount++;
  }

  if (fields.length === 0) {
    throw new AppError('No valid fields provided for update.', 400);
  }

  values.push(categoryId);

  const result = await query(
    `UPDATE categories SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Category not found.', 404);
  }

  return result.rows[0];
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory
};