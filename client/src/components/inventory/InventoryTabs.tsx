import { Badge, Box, Tab, Tabs } from '@mui/material';
import { AcUnit, Kitchen, SevereCold } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export type InventoryLocation = 'Fridge' | 'Pantry' | 'Freezer';

interface InventoryTabsProps {
  activeTab: InventoryLocation;
  onChange: (tab: InventoryLocation) => void;
  counts: Record<InventoryLocation, number>;
}

const tabConfig: { label: InventoryLocation; icon: React.ReactElement; color: string; bgColor: string }[] = [
  {
    label: 'Fridge',
    icon: <AcUnit />,
    color: '#42A5F5',
    bgColor: 'rgba(66, 165, 245, 0.12)',
  },
  {
    label: 'Pantry',
    icon: <Kitchen />,
    color: '#FFA726',
    bgColor: 'rgba(255, 167, 38, 0.12)',
  },
  {
    label: 'Freezer',
    icon: <SevereCold />,
    color: '#26C6DA',
    bgColor: 'rgba(38, 198, 218, 0.12)',
  },
];

const InventoryTabs = ({ activeTab, onChange, counts }: InventoryTabsProps) => {
  const { mode } = useTheme();

  const activeIndex = tabConfig.findIndex((t) => t.label === activeTab);
  const activeColor = tabConfig[activeIndex]?.color ?? '#42A5F5';

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        backdropFilter: 'blur(16px)',
        border: mode === 'dark'
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.06)',
        mb: 3,
      }}
    >
      <Tabs
        value={activeIndex}
        onChange={(_, newIndex) => onChange(tabConfig[newIndex].label)}
        variant="fullWidth"
        sx={{
          minHeight: 56,
          '& .MuiTabs-indicator': {
            bgcolor: activeColor,
            height: 3,
            borderRadius: '3px 3px 0 0',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '& .MuiTab-root': {
            minHeight: 56,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            transition: 'all 0.25s ease',
            '&.Mui-selected': {
              color: activeColor,
            },
            '&:hover': {
              color: activeColor,
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            },
          },
        }}
      >
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.label;
          const count = counts[tab.label] || 0;

          return (
            <Tab
              key={tab.label}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      bgcolor: isActive ? tab.bgColor : 'transparent',
                      transition: 'all 0.25s ease',
                      color: isActive ? tab.color : 'inherit',
                    }}
                  >
                    {tab.icon}
                  </Box>
                  <span>{tab.label}</span>
                  <Badge
                    badgeContent={count}
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: isActive ? tab.color : mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                        color: isActive ? '#fff' : mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        minWidth: 20,
                        height: 20,
                        transition: 'all 0.25s ease',
                      },
                    }}
                  />
                </Box>
              }
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default InventoryTabs;
