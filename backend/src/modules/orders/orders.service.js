const { query, getClient } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { clearCart } = require('../cart/cart.service');

const SHIPPING_FEE = 100;

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${random}`;
};

const createOrder = async (userId, orderData) => {
  const {
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingCountry = 'Nigeria',
    notes
  } = orderData;

  const cartResult = await query(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );

  if (cartResult.rows.length === 0) {
    throw new AppError('Your cart is empty.', 400);
  }

  const cartId = cartResult.rows[0].id;

  const cartItemsResult = await query(
    `SELECT
       ci.id, ci.quantity, ci.unit_price,
       ci.product_id, ci.variant_id,
       p.name AS product_name,
       p.stock_quantity AS product_stock,
       p.is_active,
       p.vendor_id,
       pv.variant_name,
       pv.stock_quantity AS variant_stock
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     LEFT JOIN product_variants pv ON ci.variant_id = pv.id
     WHERE ci.cart_id = $1`,
    [cartId]
  );

  const cartItems = cartItemsResult.rows;

  if (cartItems.length === 0) {
    throw new AppError('Your cart is empty.', 400);
  }

  for (const item of cartItems) {
    if (!item.is_active) {
      throw new AppError(
        `"${item.product_name}" is no longer available.`, 400
      );
    }

    const availableStock = item.variant_id
      ? item.variant_stock
      : item.product_stock;

    if (availableStock < item.quantity) {
      throw new AppError(
        `"${item.product_name}" only has ${availableStock} units in stock.`, 400
      );
    }
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unit_price) * item.quantity, 0
  );

  const shippingFee = SHIPPING_FEE;
  const totalAmount = subtotal + shippingFee;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const orderNumber = generateOrderNumber();

    const orderResult = await client.query(
      `INSERT INTO orders (
         user_id, order_number, subtotal, shipping_fee, total_amount,
         shipping_name, shipping_phone, shipping_address,
         shipping_city, shipping_state, shipping_country, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        userId, orderNumber, subtotal.toFixed(2),
        shippingFee, totalAmount.toFixed(2),
        shippingName, shippingPhone, shippingAddress,
        shippingCity, shippingState, shippingCountry, notes || null
      ]
    );

    const newOrder = orderResult.rows[0];

    for (const item of cartItems) {
      const itemTotal = parseFloat(item.unit_price) * item.quantity;

      await client.query(
        `INSERT INTO order_items (
           order_id, vendor_id, product_id, variant_id,
           product_name, variant_name, quantity, unit_price, total_price
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          newOrder.id, item.vendor_id, item.product_id,
          item.variant_id || null, item.product_name,
          item.variant_name || null, item.quantity,
          item.unit_price, itemTotal.toFixed(2)
        ]
      );

      if (item.variant_id) {
        await client.query(
          `UPDATE product_variants
           SET stock_quantity = stock_quantity - $1
           WHERE id = $2`,
          [item.quantity, item.variant_id]
        );
      } else {
        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity - $1,
               total_sold = total_sold + $1,
               updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query(
      'DELETE FROM cart_items WHERE cart_id = $1',
      [cartId]
    );

    await client.query('COMMIT');

    const orderItemsResult = await query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [newOrder.id]
    );

    return {
      ...newOrder,
      items: orderItemsResult.rows
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getUserOrders = async (userId, { page = 1, limit = 10, status }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = ['o.user_id = $1'];
  const values = [userId];
  let paramCount = 2;

  if (status) {
    conditions.push(`o.status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const [ordersResult, countResult] = await Promise.all([
    query(
      `SELECT
         o.id, o.order_number, o.status, o.payment_status,
         o.subtotal, o.shipping_fee, o.total_amount,
         o.created_at,
         COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, parseInt(limit), offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      values
    )
  ]);

  const total = parseInt(countResult.rows[0].total);

  return {
    orders: ordersResult.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const getOrderById = async (orderId, userId) => {
  const orderResult = await query(
    `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );

  if (orderResult.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  const order = orderResult.rows[0];

  const itemsResult = await query(
    `SELECT
       oi.*,
       v.store_name AS vendor_name,
       (SELECT image_url FROM product_images
        WHERE product_id = oi.product_id AND is_primary = true
        LIMIT 1) AS product_image
     FROM order_items oi
     LEFT JOIN vendors v ON oi.vendor_id = v.id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return {
    ...order,
    items: itemsResult.rows
  };
};

const cancelOrder = async (orderId, userId) => {
  const orderResult = await query(
    'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  );

  if (orderResult.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  const order = orderResult.rows[0];

  if (order.status !== 'pending') {
    throw new AppError(
      `Order cannot be cancelled. Current status: ${order.status}.`, 400
    );
  }

  const result = await query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [orderId]
  );

  return result.rows[0];
};

const getShippingFee = () => ({ shippingFee: SHIPPING_FEE });

module.exports = {
  getShippingFee,
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder
};