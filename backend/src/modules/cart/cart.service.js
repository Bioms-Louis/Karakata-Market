const { query, getClient } = require('../../config/database');
const AppError = require('../../utils/AppError');

const getOrCreateCart = async (userId) => {
  let cartResult = await query(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );

  if (cartResult.rows.length === 0) {
    cartResult = await query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
      [userId]
    );
  }

  return cartResult.rows[0].id;
};

const getCart = async (userId) => {
  const cartId = await getOrCreateCart(userId);
  const itemsResult = await query(
    `SELECT
       ci.id,
       ci.quantity,
       ci.unit_price,
       ci.quantity * ci.unit_price AS item_total,
       p.id           AS product_id,
       p.name         AS product_name,
       p.slug         AS product_slug,
       p.stock_quantity,
       p.is_active    AS product_is_active,
       pv.id          AS variant_id,
       pv.variant_name,
       pv.attributes  AS variant_attributes,
       pv.stock_quantity AS variant_stock,
       v.store_name   AS vendor_name,
       v.id           AS vendor_id,
       -- Get the primary image
       (SELECT image_url FROM product_images
        WHERE product_id = p.id AND is_primary = true
        LIMIT 1) AS product_image
     FROM cart_items ci
     JOIN products p        ON ci.product_id = p.id
     LEFT JOIN product_variants pv ON ci.variant_id = pv.id
     LEFT JOIN vendors v    ON p.vendor_id = v.id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartId]
  );

  const items = itemsResult.rows;

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.item_total), 0
  );

  return {
    cartId,
    items,
    summary: {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(subtotal.toFixed(2))
    }
  };
};

const addItemToCart = async (userId, { productId, variantId, quantity }) => {
  const cartId = await getOrCreateCart(userId);

 const productResult = await query(
    'SELECT id, base_price, discount_price, stock_quantity, is_active FROM products WHERE id = $1',
    [productId]
  );

  if (productResult.rows.length === 0 || !productResult.rows[0].is_active) {
    throw new AppError('Product not found or is no longer available.', 404);
  }

  const product = productResult.rows[0];
  
  let unitPrice = parseFloat(product.discount_price || product.base_price);
  let availableStock = product.stock_quantity;

  if (variantId) {
    const variantResult = await query(
      'SELECT id, price, stock_quantity, is_active FROM product_variants WHERE id = $1 AND product_id = $2',
      [variantId, productId]
    );

    if (variantResult.rows.length === 0 || !variantResult.rows[0].is_active) {
      throw new AppError('Product variant not found.', 404);
    }

    const variant = variantResult.rows[0];
    unitPrice = parseFloat(variant.price);
    availableStock = variant.stock_quantity;
  }

  if (availableStock < quantity) {
    throw new AppError(
      `Only ${availableStock} units available in stock.`, 400
    );
  }
  
  const existingItem = await query(
    `SELECT id, quantity FROM cart_items
     WHERE cart_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))`,
    [cartId, productId, variantId || null]
  );

  if (existingItem.rows.length > 0) {
    const newQuantity = existingItem.rows[0].quantity + quantity;

    if (newQuantity > availableStock) {
      throw new AppError(
        `Cannot add more. Only ${availableStock} units available.`, 400
      );
    }

    await query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2',
      [newQuantity, existingItem.rows[0].id]
    );
  } else {
    await query(
      `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [cartId, productId, variantId || null, quantity, unitPrice]
    );
  }

  return getCart(userId);
};

const updateCartItem = async (userId, cartItemId, quantity) => {
  const cartId = await getOrCreateCart(userId);
const itemResult = await query(
    `SELECT ci.id, ci.product_id, ci.variant_id
     FROM cart_items ci
     WHERE ci.id = $1 AND ci.cart_id = $2`,
    [cartItemId, cartId]
  );

  if (itemResult.rows.length === 0) {
    throw new AppError('Cart item not found.', 404);
  }

  const item = itemResult.rows[0];

  if (item.variant_id) {
    const variantStock = await query(
      'SELECT stock_quantity FROM product_variants WHERE id = $1',
      [item.variant_id]
    );
    if (variantStock.rows[0].stock_quantity < quantity) {
      throw new AppError('Not enough stock available.', 400);
    }
  } else {
    const productStock = await query(
      'SELECT stock_quantity FROM products WHERE id = $1',
      [item.product_id]
    );
    if (productStock.rows[0].stock_quantity < quantity) {
      throw new AppError('Not enough stock available.', 400);
    }
  }

  await query(
    'UPDATE cart_items SET quantity = $1 WHERE id = $2',
    [quantity, cartItemId]
  );

  return getCart(userId);
};

const removeCartItem = async (userId, cartItemId) => {
  const cartId = await getOrCreateCart(userId);

  const result = await query(
    'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING id',
    [cartItemId, cartId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Cart item not found.', 404);
  }

  return getCart(userId);
};

const clearCart = async (userId) => {
  const cartId = await getOrCreateCart(userId);

  await query(
    'DELETE FROM cart_items WHERE cart_id = $1',
    [cartId]
  );

  return { message: 'Cart cleared successfully.' };
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getOrCreateCart
};