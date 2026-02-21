/* client/src/components/onboarding/OnboardingWizard.tsx */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowForward,
  ArrowBack,
  People,
  Restaurant,
  AttachMoney,
  Kitchen,
  CheckCircle,
} from '@mui/icons-material';
import GlassCard from '../common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { triggerCelebration } from '../../utils/celebrations';

interface OnboardingData {
  householdName: string;
  memberCount: number;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  weeklyBudget: number;
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  hasKitchenEquipment: string[];
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

const steps = [
  { label: 'Welcome', icon: <CheckCircle /> },
  { label: 'Household', icon: <People /> },
  { label: 'Diet', icon: <Restaurant /> },
  { label: 'Budget', icon: <AttachMoney /> },
  { label: 'Cooking', icon: <Kitchen /> },
];

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Kosher',
  'Halal',
  'Low-Carb',
  'Keto',
  'Paleo',
];

const cuisineOptions = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'Mediterranean',
  'American',
  'French',
  'Korean',
];

const equipmentOptions = [
  'Oven',
  'Stovetop',
  'Microwave',
  'Slow Cooker',
  'Instant Pot',
  'Air Fryer',
  'Blender',
  'Food Processor',
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onSkip }) => {
  const { mode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    householdName: '',
    memberCount: 2,
    dietaryRestrictions: [],
    cuisinePreferences: [],
    weeklyBudget: 150,
    cookingSkill: 'intermediate',
    hasKitchenEquipment: ['Oven', 'Stovetop', 'Microwave'],
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      triggerCelebration('fireworks');
      setTimeout(() => onComplete(data), 500);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    setData((prev) => {
      const array = prev[field] as string[];
      const newArray = array.includes(item)
        ? array.filter((i) => i !== item)
        : [...array, item];
      return { ...prev, [field]: newArray };
    });
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Typography sx={{ fontSize: '5rem', mb: 2 }}>👋</Typography>
            </motion.div>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Welcome to Nora!
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 4, maxWidth: '500px', mx: 'auto' }}>
              I'm your AI chef assistant. Let's take a quick moment to personalize your meal planning experience.
              This will help me suggest meals that fit your household perfectly.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip label="Smart meal planning" icon={<Restaurant />} />
              <Chip label="Budget tracking" icon={<AttachMoney />} />
              <Chip label="Nutrition goals" icon={<CheckCircle />} />
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Tell me about your household
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 4 }}>
              This helps me plan the right portion sizes and meal variety.
            </Typography>

            <TextField
              fullWidth
              label="Household Name (optional)"
              placeholder="e.g., The Smith Family"
              value={data.householdName}
              onChange={(e) => updateData('householdName', e.target.value)}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth>
              <InputLabel>How many people are you cooking for?</InputLabel>
              <Select
                value={data.memberCount}
                onChange={(e) => updateData('memberCount', e.target.value)}
                label="How many people are you cooking for?"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num} {num === 1 ? 'person' : 'people'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Dietary preferences & restrictions
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Select all that apply. I'll make sure to respect these in all meal suggestions.
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Dietary Restrictions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
              {dietaryOptions.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  onClick={() => toggleArrayItem('dietaryRestrictions', option)}
                  color={data.dietaryRestrictions.includes(option) ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Favorite Cuisines:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {cuisineOptions.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  onClick={() => toggleArrayItem('cuisinePreferences', option)}
                  color={data.cuisinePreferences.includes(option) ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Set your weekly budget
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 4 }}>
              I'll help you find delicious meals that fit your budget.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
                ${data.weeklyBudget}
              </Typography>
              <TextField
                fullWidth
                type="range"
                min="50"
                max="500"
                step="10"
                value={data.weeklyBudget}
                onChange={(e) => updateData('weeklyBudget', parseInt(e.target.value))}
                slotProps={{
                  input: {
                    sx: { accentColor: 'var(--primary)' },
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-tertiary)' }}>
                  $50/week
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-tertiary)' }}>
                  $500/week
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: 'var(--radius-lg)',
                bgcolor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                💡 <strong>Tip:</strong> The average American household spends $250-$300 per week on groceries.
                You can adjust this anytime!
              </Typography>
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Cooking experience & equipment
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 4 }}>
              This helps me suggest recipes that match your skill level and available tools.
            </Typography>

            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>Cooking Skill Level</InputLabel>
              <Select
                value={data.cookingSkill}
                onChange={(e) => updateData('cookingSkill', e.target.value)}
                label="Cooking Skill Level"
              >
                <MenuItem value="beginner">🔰 Beginner - I'm just getting started</MenuItem>
                <MenuItem value="intermediate">👨‍🍳 Intermediate - I know my way around</MenuItem>
                <MenuItem value="advanced">⭐ Advanced - I love complex recipes</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Available Equipment:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {equipmentOptions.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  onClick={() => toggleArrayItem('hasKitchenEquipment', option)}
                  color={data.hasKitchenEquipment.includes(option) ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background:
          mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '700px' }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              Step {activeStep + 1} of {steps.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 'var(--radius-full)' }} />
        </Box>

        {/* Main Card */}
        <GlassCard sx={{ p: 4 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  icon={
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: index <= activeStep ? 'var(--primary)' : 'var(--surface)',
                        color: index <= activeStep ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {step.icon}
                    </Box>
                  }
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={activeStep === 0 ? onSkip : handleBack}
              disabled={activeStep === 0}
              startIcon={activeStep === 0 ? null : <ArrowBack />}
            >
              {activeStep === 0 ? 'Skip for now' : 'Back'}
            </Button>

            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
              sx={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: '#fff',
                px: 4,
              }}
            >
              {activeStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
            </Button>
          </Box>
        </GlassCard>
      </Box>
    </Box>
  );
};

export default OnboardingWizard;
