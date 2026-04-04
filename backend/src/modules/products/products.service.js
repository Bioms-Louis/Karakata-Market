const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');
const slugify = require('slugify');

const getAllProducts = async (queryParams) => {
  const {
    page = 1,
    limit = 20,
    category, 
    vendor, 
    search,
    minPrice,
    maxPrice,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    featured, 
    brand 
  } = queryParams;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = ['p.is_active = true'];
  const values = [];
  let paramCount = 1;

  if (category) {
    conditions.push(`
      p.category_id IN (
        WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE slug = $${paramCount}
          UNION ALL
          SELECT c2.id FROM categories c2
          INNER JOIN cat_tree ct ON c2.parent_id = ct.id
        )
        SELECT id FROM cat_tree
      )
    `);
    values.push(category);
    paramCount++;
  }

  if (vendor) {
    conditions.push(`p.vendor_id = $${paramCount}`);
    values.push(vendor);
    paramCount++;
  }

  if (search) {
    conditions.push(
      `(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`
    );
    values.push(`%${search}%`);
    paramCount++;
  }

  if (minPrice) {
    conditions.push(`p.base_price >= $${paramCount}`);
    values.push(parseFloat(minPrice));
    paramCount++;
  }

  if (maxPrice) {
    conditions.push(`p.base_price <= $${paramCount}`);
    values.push(parseFloat(maxPrice));
    paramCount++;
  }

  if (featured === 'true') {
    conditions.push('p.is_featured = true');
  }

  if (brand) {
    conditions.push(`LOWER(p.brand) = LOWER($${paramCount})`);
    values.push(brand);
    paramCount++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const allowedSortColumns = ['created_at', 'base_price', 'average_rating', 'total_sold'];
  const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const productsQuery = `
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.short_description,
      p.base_price,
      p.discount_price,
      p.stock_quantity,
      p.average_rating,
      p.review_count,
      p.total_sold,
      p.is_featured,
      p.brand,
      c.id   AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      v.id         AS vendor_id,
      v.store_name AS vendor_name,
      -- Get the primary image for each product
      (SELECT image_url FROM product_images 
       WHERE product_id = p.id AND is_primary = true 
       LIMIT 1) AS primary_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN vendors v    ON p.vendor_id = v.id
    ${whereClause}
    ORDER BY p.${safeSortBy} ${safeSortOrder}
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(parseInt(limit), offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereClause}
  `;

  const [productsResult, countResult] = await Promise.all([
    query(productsQuery, values),
    query(countQuery, values.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0].total);

  return {
    products: productsResult.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1
    }
  };
};

const getProductBySlug = async (slug) => {
  const productResult = await query(
    `SELECT 
      p.*,
      c.name AS category_name,
      c.slug AS category_slug,
      v.store_name AS vendor_name,
      v.rating AS vendor_rating,
      v.id AS vendor_id
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN vendors v    ON p.vendor_id = v.id
     WHERE p.slug = $1 AND p.is_active = true`,
    [slug]
  );

  if (productResult.rows.length === 0) {
    throw new AppError('Product not found.', 404);
  }

  const product = productResult.rows[0];

  const imagesResult = await query(
    `SELECT id, image_url, alt_text, is_primary, sort_order
     FROM product_images
     WHERE product_id = $1
     ORDER BY is_primary DESC, sort_order ASC`,
    [product.id]
  );

  const variantsResult = await query(
    `SELECT id, variant_name, attributes, price, stock_quantity, sku, image_url
     FROM product_variants
     WHERE product_id = $1 AND is_active = true`,
    [product.id]
  );

  return {
    ...product,
    images: imagesResult.rows,
    variants: variantsResult.rows
  };
};

const getProductById = async (id) => {
  const productResult = await query(
    `SELECT 
      p.*,
      c.name AS category_name,
      c.slug AS category_slug,
      v.store_name AS vendor_name,
      v.rating AS vendor_rating,
      v.id AS vendor_id
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN vendors v    ON p.vendor_id = v.id
     WHERE p.id = $1`,
    [id]
  );

  if (productResult.rows.length === 0) {
    throw new AppError('Product not found.', 404);
  }

  const product = productResult.rows[0];

  const imagesResult = await query(
    `SELECT id, image_url, alt_text, is_primary, sort_order
     FROM product_images
     WHERE product_id = $1
     ORDER BY is_primary DESC, sort_order ASC`,
    [product.id]
  );

  const variantsResult = await query(
    `SELECT id, variant_name, attributes, price, stock_quantity, sku, image_url
     FROM product_variants
     WHERE product_id = $1 AND is_active = true`,
    [product.id]
  );

  return {
    ...product,
    images: imagesResult.rows,
    variants: variantsResult.rows
  };
};

const createProduct = async (vendorId, productData) => {
  const {
    categoryId,
    name,
    description,
    shortDescription,
    basePrice,
    discountPrice,
    stockQuantity,
    sku,
    brand,
    weight,
    variants = [], 
    images = [] 
  } = productData;

  let slug = slugify(name, { lower: true, strict: true });

  const existingSlug = await query(
    'SELECT id FROM products WHERE slug = $1',
    [slug]
  );

  if (existingSlug.rows.length > 0) {
    slug = `${slug}-${Date.now()}`;
  }

  const category = await query(
    'SELECT id FROM categories WHERE id = $1 AND is_active = true',
    [categoryId]
  );

  if (category.rows.length === 0) {
    throw new AppError('Category not found.', 404);
  }

  const client = await require('../../config/database').getClient();

  try {
    await client.query('BEGIN');
    const productResult = await client.query(
      `INSERT INTO products 
        (vendor_id, category_id, name, slug, description, short_description,
         base_price, discount_price, stock_quantity, sku, brand, weight)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        vendorId, categoryId, name, slug, description || null,
        shortDescription || null, basePrice,
        discountPrice || null, stockQuantity || 0,
        sku || null, brand || null, weight || null
      ]
    );

    const newProduct = productResult.rows[0];
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [newProduct.id, images[i].url, i === 0, i]
        );
      }
    }
    if (variants.length > 0) {
      for (const variant of variants) {
        await client.query(
          `INSERT INTO product_variants 
            (product_id, variant_name, attributes, price, stock_quantity, sku)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newProduct.id,
            variant.name,
            JSON.stringify(variant.attributes),
            variant.price,
            variant.stockQuantity || 0,
            variant.sku || null
          ]
        );
      }
    }

    await client.query('COMMIT');

    return newProduct;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateProduct = async (productId, vendorId, updates) => {
  const ownership = await query(
    'SELECT id FROM products WHERE id = $1 AND vendor_id = $2',
    [productId, vendorId]
  );

  if (ownership.rows.length === 0) {
    throw new AppError('Product not found or you do not have permission to edit it.', 404);
  }

  const {
    name, description, shortDescription, basePrice,
    discountPrice, stockQuantity, isActive, isFeatured, brand
  } = updates;

  const fields = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramCount}`); values.push(name); paramCount++;
    // Generate slug and check for conflicts with OTHER products
    let newSlug = slugify(name, { lower: true, strict: true });
    const slugConflict = await query(
      'SELECT id FROM products WHERE slug = $1 AND id != $2',
      [newSlug, productId]
    );
    if (slugConflict.rows.length > 0) {
      newSlug = `${newSlug}-${Date.now()}`;
    }
    fields.push(`slug = $${paramCount}`); values.push(newSlug); paramCount++;
  }
  if (description !== undefined) {
    fields.push(`description = $${paramCount}`); values.push(description); paramCount++;
  }
  if (shortDescription !== undefined) {
    fields.push(`short_description = $${paramCount}`); values.push(shortDescription); paramCount++;
  }
  if (basePrice !== undefined) {
    fields.push(`base_price = $${paramCount}`); values.push(basePrice); paramCount++;
  }
  if (discountPrice !== undefined) {
    fields.push(`discount_price = $${paramCount}`); values.push(discountPrice); paramCount++;
  }
  if (stockQuantity !== undefined) {
    fields.push(`stock_quantity = $${paramCount}`); values.push(stockQuantity); paramCount++;
  }
  if (isActive !== undefined) {
    fields.push(`is_active = $${paramCount}`); values.push(isActive); paramCount++;
  }
  if (brand !== undefined) {
    fields.push(`brand = $${paramCount}`); values.push(brand || null); paramCount++;
  }

  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) { 
    throw new AppError('No valid fields to update.', 400);
  }

  values.push(productId);

  const result = await query(
    `UPDATE products SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteProduct = async (productId, vendorId) => {
  const result = await query(
    `UPDATE products 
     SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND vendor_id = $2
     RETURNING id`,
    [productId, vendorId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Product not found or you do not have permission to delete it.', 404);
  }

  return { message: 'Product deleted successfully.' };
};

const getBrands = async () => {
  const result = await query(
    `SELECT DISTINCT brand FROM products
     WHERE brand IS NOT NULL AND brand != '' AND is_active = true
     ORDER BY brand ASC`
  );
  return result.rows.map(r => r.brand);
};

module.exports = {
  getAllProducts,
  getProductBySlug,
  getProductById,
  getBrands,
  createProduct,
  updateProduct,
  deleteProduct
};