const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/apiResponse');

// GET /api/v1/carousel  — public, no (auth) needed
router.get('/', catchAsync(async (req, res) => {
  const result = await query(
    `SELECT id, image_url, headline, description, badge,
            button_text, link, position, sort_order
     FROM carousel_slides
     WHERE is_active = true
     ORDER BY sort_order ASC, created_at ASC`
  );
  sendSuccess(res, 200, 'Carousel slides fetched.', { slides: result.rows });
}));

module.exports = router;