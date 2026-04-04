const express = require('express');
const router  = express.Router();
const { protect } = require('../../middleware/auth');
const { query }   = require('../../config/database');

router.get('/', protect, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
          w.id               AS wishlist_id,
          w.product_id,
          w.created_at,
          p.name             AS product_name,
          p.slug             AS product_slug,
          p.base_price,
          p.discount_price,
          p.is_active, 
          p.stock_quantity,
          p.short_description,
          v.store_name       AS vendor_name,
          (SELECT image_url FROM product_images
            WHERE product_id = p.id AND is_primary = true
            LIMIT 1)          AS product_image
          FROM wishlists w
          JOIN products p  ON p.id  = w.product_id
          LEFT JOIN vendors v ON v.id = p.vendor_id
          WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: { items: rows } });
  } catch (err) {
    console.error('GET /wishlist error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/count', protect, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT COUNT(*) FROM wishlists WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ success: true, data: { count: parseInt(rows[0].count) } });
  } catch (err) {
    console.error('GET /wishlist/count error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/check/:productId', protect, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, data: { wishlisted: rows.length > 0 } });
  } catch (err) {
    console.error('GET /wishlist/check error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  console.log('USER:', req.user);
  console.log('BODY:', req.body);          
  const { product_id } = req.body;
  if (!product_id)
    return res.status(400).json({ success: false, message: 'product_id is required' });
  try {
    const { rows } = await query(
      `INSERT INTO wishlists (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id`,
      [req.user.id, product_id]
    );
    if (!rows.length)
      return res.status(200).json({ success: true, message: 'Already in wishlist' });
    res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (err) {
    console.error('POST /wishlist error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:productId', protect, async (req, res) => {
  try {
    await query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    console.error('DELETE /wishlist error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;