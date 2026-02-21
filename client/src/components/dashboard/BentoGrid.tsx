/* client/src/components/dashboard/BentoGrid.tsx */
import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { springs } from '../../utils/springConfig';

interface BentoGridProps {
  children: React.ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const bentoItemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.gentle,
  },
};

/**
 * BentoGrid - CSS Grid layout with responsive areas for the dashboard.
 *
 * Desktop (md+): 4-column grid with named areas:
 *   "greeting  greeting   streak    budget"
 *   "nutrition nutrition  activity  activity"
 *   "actions   actions    activity  activity"
 *
 * Tablet (sm): 2-column layout
 * Mobile (xs): Single column stack
 *
 * Each child should be wrapped in a named grid-area Box via the parent component.
 */
const BentoGrid = ({ children }: BentoGridProps) => {
  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        display: 'grid',
        gap: { xs: 2, sm: 2.5, md: 3 },
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gridTemplateRows: 'auto',
        gridTemplateAreas: {
          xs: `
            "greeting"
            "streak"
            "budget"
            "actions"
            "nutrition"
            "activity"
          `,
          sm: `
            "greeting  greeting"
            "streak    budget"
            "actions   actions"
            "nutrition nutrition"
            "activity  activity"
          `,
          md: `
            "greeting  greeting   streak    budget"
            "nutrition nutrition  activity  activity"
            "actions   actions    activity  activity"
          `,
        },
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
};

export default BentoGrid;
