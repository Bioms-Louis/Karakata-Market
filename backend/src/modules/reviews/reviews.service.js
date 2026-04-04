const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');

const createReview = async (userId, reviewData) => {
  const { productId, orderId, rating, title, body } = reviewData;

  const productResult = await query(
    'SELECT id FROM products WHERE id = $1 AND is_active = true',
    [productId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError('Product not found.', 404);
  }

  const existingReview = await query(
    `SELECT id FROM reviews
     WHERE product_id = $1 AND user_id = $2 AND order_id = $3`,
    [productId, userId, orderId]
  );

  if (existingReview.rows.length > 0) {
    throw new AppError('You have already reviewed this product.', 400);
  }

  let isVerifiedPurchase = false;

  if (orderId) {
    const purchaseCheck = await query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.id = $1
         AND o.user_id = $2
         AND oi.product_id = $3
         AND o.status = 'delivered'`,
      [orderId, userId, productId]
    );
    isVerifiedPurchase = purchaseCheck.rows.length > 0;
  }

  const reviewResult = await query(
    `INSERT INTO reviews
       (product_id, user_id, order_id, rating, title, body, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      productId, userId, orderId || null,
      rating, title || null, body || null,
      isVerifiedPurchase
    ]
  );

  await query(
    `UPDATE products SET
       average_rating = (
         SELECT ROUND(AVG(rating)::numeric, 2)
         FROM reviews
         WHERE product_id = $1 AND is_approved = true
       ),
       review_count = (
         SELECT COUNT(*) FROM reviews
         WHERE product_id = $1 AND is_approved = true
       ),
       updated_at = NOW()
     WHERE id = $1`,
    [productId]
  );

  return reviewResult.rows[0];
};

const getProductReviews = async (productId, { page = 1, limit = 10, rating }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [
    'r.product_id = $1',
    'r.is_approved = true'
  ];
  const values = [productId];
  let paramCount = 2;

  if (rating) {
    conditions.push(`r.rating = $${paramCount}`);
    values.push(parseInt(rating));
    paramCount++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const [reviewsResult, countResult, summaryResult] = await Promise.all([
    query(
      `SELECT
         r.id, r.rating, r.title, r.body,
         r.is_verified, r.created_at,
         u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, parseInt(limit), offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
      values
    ),
    query(
      `SELECT rating, COUNT(*) as count
       FROM reviews
       WHERE product_id = $1 AND is_approved = true
       GROUP BY rating
       ORDER BY rating DESC`,
      [productId]
    )
  ]);

  const total = parseInt(countResult.rows[0].total);

  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  summaryResult.rows.forEach(row => {
    ratingBreakdown[row.rating] = parseInt(row.count);
  });

  return {
    reviews: reviewsResult.rows,
    ratingBreakdown,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

module.exports = { createReview, getProductReviews };