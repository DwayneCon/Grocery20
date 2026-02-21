/* client/src/components/chat/MealPlanCanvas.tsx */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip,
  Stack,
  Divider,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft,
  CalendarMonth,
  Restaurant,
  CheckCircle,
  Circle,
  NavigateNext,
  NavigateBefore,
  Close,
} from '@mui/icons-material';
import {
  WeekMealPlan,
  DayMealPlan,
  MealSlot,
  DayName,
  createEmptyWeekPlan,
  calculateCompletion,
  getStatusColor,
  getDayColor,
} from '../../types/mealPlanCanvas';
import { ParsedMeal } from '../../utils/mealParser';
import { logger } from '../../utils/logger';

interface MealPlanCanvasProps {
  /** Current week meal plan data */
  weekPlan: WeekMealPlan;
  /** Callback when a day is selected */
  onDaySelect: (dayName: DayName) => void;
  /** Callback when a meal slot is clicked */
  onMealClick: (day: DayName, mealType: MealSlot['mealType']) => void;
  /** Whether canvas is visible (for mobile drawer) */
  isVisible: boolean;
  /** Callback to close canvas (mobile only) */
  onClose: () => void;
}

/**
 * Meal Plan Canvas - Persistent sidebar showing week overview
 * Transforms chat interface into "Kitchen Command Center"
 *
 * Features:
 * - Week overview with 7 days and completion status
 * - Day detail view with meal slots
 * - Visual status indicators using Culinary Spectrum palette
 * - Glassmorphism aesthetic
 * - Responsive: sidebar on desktop, drawer on mobile
 */
export const MealPlanCanvas: React.FC<MealPlanCanvasProps> = ({
  weekPlan,
  onDaySelect,
  onMealClick,
  isVisible,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<DayName | null>(null);

  // Debug: Log weekPlan changes
  logger.info('[MealPlanCanvas] Received weekPlan', {
    days: weekPlan.days.map(d => ({
      dayName: d.dayName,
      status: d.status,
      meals: d.meals.map(m => ({
        mealType: m.mealType,
        status: m.status,
        hasMeal: !!m.meal,
        mealName: m.meal?.name
      }))
    })),
    completionPercentage: weekPlan.completionPercentage
  });

  // Handle day click - switch to day detail view
  const handleDayClick = (day: DayMealPlan) => {
    setSelectedDay(day.dayName);
    setViewMode('day');
    onDaySelect(day.dayName);
  };

  // Handle back to week view
  const handleBackToWeek = () => {
    setViewMode('week');
    setSelectedDay(null);
  };

  // Get selected day data
  const selectedDayData = selectedDay
    ? weekPlan.days.find(d => d.dayName === selectedDay)
    : null;

  // Canvas content component
  const CanvasContent = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isMobile
          ? 'rgba(255, 255, 255, 0.98)'
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderLeft: !isMobile ? '1px solid rgba(255, 107, 53, 0.1)' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(5, 175, 92, 0.05) 100%)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {viewMode === 'day' && (
            <IconButton
              onClick={handleBackToWeek}
              size="small"
              sx={{ color: 'var(--chef-orange)' }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          <CalendarMonth sx={{ color: 'var(--chef-orange)', fontSize: 24 }} />

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'var(--chef-orange)',
                fontWeight: 700,
              }}
            >
              {viewMode === 'week' ? 'Meal Plan Canvas' : selectedDay}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {viewMode === 'week'
                ? `${weekPlan.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekPlan.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : selectedDayData?.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </Typography>
          </Box>

          {isMobile && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Stack>

        {/* Week completion progress */}
        {viewMode === 'week' && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Week Progress
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'var(--basil-green)' }}
              >
                {weekPlan.completionPercentage}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={weekPlan.completionPercentage}
              sx={{
                height: 6,
                borderRadius: 'var(--radius-md)',
                bgcolor: 'rgba(0, 0, 0, 0.08)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, var(--chef-orange) 0%, var(--basil-green) 100%)',
                  borderRadius: 'var(--radius-md)',
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Scrollable content area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <AnimatePresence mode="wait">
          {viewMode === 'week' ? (
            <WeekOverview
              key="week-view"
              weekPlan={weekPlan}
              onDayClick={handleDayClick}
            />
          ) : (
            <DayDetail
              key="day-view"
              day={selectedDayData!}
              onMealClick={(mealType) => onMealClick(selectedDay!, mealType)}
            />
          )}
        </AnimatePresence>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Restaurant sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {viewMode === 'week'
              ? `${weekPlan.days.filter(d => d.status !== 'empty').length}/7 days planned`
              : `${selectedDayData?.meals.filter(m => m.status !== 'empty').length}/${selectedDayData?.meals.length} meals`}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );

  // Render as drawer on mobile, sidebar on desktop
  if (isMobile) {
    return (
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                zIndex: 1200,
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '85vw',
                maxWidth: '400px',
                zIndex: 1300,
              }}
            >
              <CanvasContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop sidebar
  return (
    <Box
      sx={{
        width: 320,
        height: '100%',
        flexShrink: 0,
      }}
    >
      <CanvasContent />
    </Box>
  );
};

/**
 * Week Overview - Shows all 7 days with status indicators
 */
interface WeekOverviewProps {
  weekPlan: WeekMealPlan;
  onDayClick: (day: DayMealPlan) => void;
}

const WeekOverview: React.FC<WeekOverviewProps> = ({ weekPlan, onDayClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Stack spacing={1.5}>
        {weekPlan.days.map((day, index) => {
          const dayColor = getDayColor(day.dayName);
          const statusColor = getStatusColor(day.status);
          const completion = calculateCompletion([day]);
          // Count all non-empty meals (suggested, accepted, cooking, completed)
          const filledMeals = day.meals.filter(
            m => m.status !== 'empty'
          ).length;

          return (
            <motion.div
              key={day.dayName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                onClick={() => onDayClick(day)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${dayColor}40`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${dayColor}30`,
                    borderColor: dayColor,
                  },
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {/* Day indicator circle */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${dayColor} 0%, ${dayColor}CC 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      >
                        {day.dayName.slice(0, 3).toUpperCase()}
                      </Typography>
                    </Box>

                    {/* Day info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: dayColor,
                          mb: 0.25,
                        }}
                      >
                        {day.dayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>

                      {/* Meal status dots */}
                      <Stack direction="row" spacing={0.5} mt={0.5}>
                        {day.meals.map((meal, idx) => (
                          <Tooltip
                            key={idx}
                            title={`${meal.mealType}: ${meal.status}`}
                            arrow
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: getStatusColor(meal.status),
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </Box>

                    {/* Completion badge */}
                    <Chip
                      label={`${filledMeals}/${day.meals.length}`}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: completion === 100 ? 'var(--basil-green)' : 'rgba(0, 0, 0, 0.08)',
                        color: completion === 100 ? 'white' : 'text.secondary',
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </Stack>
    </motion.div>
  );
};

/**
 * Day Detail - Shows meal slots for selected day
 */
interface DayDetailProps {
  day: DayMealPlan;
  onMealClick: (mealType: MealSlot['mealType']) => void;
}

const DayDetail: React.FC<DayDetailProps> = ({ day, onMealClick }) => {
  const dayColor = getDayColor(day.dayName);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Stack spacing={2}>
        {/* Day header */}
        <Box
          sx={{
            p: 2,
            borderRadius: 'var(--radius-lg)',
            background: `linear-gradient(135deg, ${dayColor}15 0%, ${dayColor}05 100%)`,
            border: `1px solid ${dayColor}30`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'var(--font-display)',
              color: dayColor,
              mb: 0.5,
            }}
          >
            {day.dayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {day.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Box>

        {/* Meal slots */}
        {day.meals.map((mealSlot, index) => {
          const statusColor = getStatusColor(mealSlot.status);

          return (
            <motion.div
              key={mealSlot.mealType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => onMealClick(mealSlot.mealType)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)',
                  background: mealSlot.meal
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${statusColor}40`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${statusColor}30`,
                    borderColor: statusColor,
                  },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    {/* Meal type header */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label={mealSlot.mealType}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          bgcolor: `${statusColor}20`,
                          color: statusColor,
                        }}
                      />
                      {mealSlot.status !== 'empty' ? (
                        <CheckCircle sx={{ fontSize: 16, color: statusColor }} />
                      ) : (
                        <Circle sx={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.2)' }} />
                      )}
                    </Stack>

                    {/* Meal content */}
                    {mealSlot.meal ? (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        >
                          {mealSlot.meal.name}
                        </Typography>
                        {mealSlot.meal.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {mealSlot.meal.description}
                          </Typography>
                        )}
                        {(mealSlot.meal.prepTime || mealSlot.meal.cookTime) && (
                          <Typography variant="caption" color="text.secondary">
                            ⏱️ {mealSlot.meal.prepTime && `${mealSlot.meal.prepTime} prep`}
                            {mealSlot.meal.prepTime && mealSlot.meal.cookTime && ' • '}
                            {mealSlot.meal.cookTime && `${mealSlot.meal.cookTime} cook`}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Click to plan {mealSlot.mealType}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </Stack>
    </motion.div>
  );
};

export default MealPlanCanvas;
