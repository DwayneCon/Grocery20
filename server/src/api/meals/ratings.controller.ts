import { Response } from 'express';
import { AuthRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';

/**
 * Create or update a rating for a recipe
 * POST /api/recipes/:recipeId/ratings
 */
export const rateRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recipeId } = req.params;
  const { rating, review, images } = req.body;
  const userId = req.user!.id;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5',
    });
  }

  try {
    // Check if recipe exists
    const recipes: any[] = await query('SELECT id FROM recipes WHERE id = ?', [recipeId]);
    if (recipes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    // Check if user has already rated this recipe
    const existingRating: any[] = await query(
      'SELECT id FROM recipe_ratings WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );

    if (existingRating.length > 0) {
      // Update existing rating
      await query(
        `UPDATE recipe_ratings
         SET rating = ?, review = ?, images = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [rating, review || null, images ? JSON.stringify(images) : null, existingRating[0].id]
      );

      return res.json({
        success: true,
        message: 'Rating updated successfully',
        ratingId: existingRating[0].id,
      });
    } else {
      // Create new rating
      const ratingId = uuidv4();
      await query(
        `INSERT INTO recipe_ratings (id, recipe_id, user_id, rating, review, images)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ratingId, recipeId, userId, rating, review || null, images ? JSON.stringify(images) : null]
      );

      return res.status(201).json({
        success: true,
        message: 'Rating created successfully',
        ratingId,
      });
    }
  } catch (error) {
    console.error('Error rating recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to rate recipe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all ratings for a recipe
 * GET /api/recipes/:recipeId/ratings
 */
export const getRecipeRatings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recipeId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  try {
    // Get ratings with user information
    const ratings: any[] = await query(
      `SELECT
        rr.id,
        rr.rating,
        rr.review,
        rr.images,
        rr.created_at as createdAt,
        rr.updated_at as updatedAt,
        u.id as userId,
        u.name as userName
      FROM recipe_ratings rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.recipe_id = ?
      ORDER BY rr.created_at DESC
      LIMIT ? OFFSET ?`,
      [recipeId, Number(limit), Number(offset)]
    );

    // Get rating summary
    const summary: any[] = await query(
      `SELECT
        COUNT(*) as totalRatings,
        AVG(rating) as averageRating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as fiveStarCount,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as fourStarCount,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as threeStarCount,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as twoStarCount,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as oneStarCount
      FROM recipe_ratings
      WHERE recipe_id = ?`,
      [recipeId]
    );

    // Parse images JSON for each rating
    const parsedRatings = ratings.map(rating => ({
      ...rating,
      images: rating.images ? JSON.parse(rating.images) : [],
    }));

    return res.json({
      success: true,
      data: {
        ratings: parsedRatings,
        summary: {
          totalRatings: summary[0]?.totalRatings || 0,
          averageRating: parseFloat(summary[0]?.averageRating) || 0,
          distribution: {
            5: summary[0]?.fiveStarCount || 0,
            4: summary[0]?.fourStarCount || 0,
            3: summary[0]?.threeStarCount || 0,
            2: summary[0]?.twoStarCount || 0,
            1: summary[0]?.oneStarCount || 0,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error getting recipe ratings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get recipe ratings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get current user's rating for a recipe
 * GET /api/recipes/:recipeId/ratings/my-rating
 */
export const getMyRating = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recipeId } = req.params;
  const userId = req.user!.id;

  try {
    const ratings: any[] = await query(
      `SELECT id, rating, review, images, created_at as createdAt, updated_at as updatedAt
       FROM recipe_ratings
       WHERE recipe_id = ? AND user_id = ?`,
      [recipeId, userId]
    );

    if (ratings.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No rating found',
      });
    }

    const rating = {
      ...ratings[0],
      images: ratings[0].images ? JSON.parse(ratings[0].images) : [],
    };

    return res.json({
      success: true,
      data: rating,
    });
  } catch (error) {
    console.error('Error getting user rating:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get rating',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete a rating
 * DELETE /api/recipes/:recipeId/ratings
 */
export const deleteRating = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recipeId } = req.params;
  const userId = req.user!.id;

  try {
    const result: any = await query(
      'DELETE FROM recipe_ratings WHERE recipe_id = ? AND user_id = ?',
      [recipeId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found',
      });
    }

    return res.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete rating',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get top-rated recipes
 * GET /api/recipes/top-rated
 */
export const getTopRatedRecipes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = 10, minRatings = 3 } = req.query;

  try {
    const recipes: any[] = await query(
      `SELECT
        r.id,
        r.name,
        r.description,
        r.prep_time as prepTime,
        r.cook_time as cookTime,
        r.servings,
        r.difficulty,
        r.tags,
        COUNT(rr.id) as totalRatings,
        AVG(rr.rating) as averageRating
      FROM recipes r
      JOIN recipe_ratings rr ON r.id = rr.recipe_id
      GROUP BY r.id
      HAVING totalRatings >= ?
      ORDER BY averageRating DESC, totalRatings DESC
      LIMIT ?`,
      [Number(minRatings), Number(limit)]
    );

    // Parse JSON fields
    const parsedRecipes = recipes.map(recipe => ({
      ...recipe,
      tags: recipe.tags ? JSON.parse(recipe.tags) : [],
      averageRating: parseFloat(recipe.averageRating),
    }));

    return res.json({
      success: true,
      data: parsedRecipes,
    });
  } catch (error) {
    console.error('Error getting top-rated recipes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get top-rated recipes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
