/* client/src/components/dashboard/WeatherGreeting.tsx */
import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { WbSunny, Cloud, Grain, AcUnit, Thunderstorm } from '@mui/icons-material';
import GlassCard from '../common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { springs } from '../../utils/springConfig';

interface WeatherGreetingProps {
  userName: string;
}

interface WeatherData {
  tempF: number;
  description: string;
  weatherCode: number;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getWeatherSuggestion = (weather: WeatherData | null): string => {
  if (!weather) return 'What are you in the mood for today?';

  const { tempF, weatherCode } = weather;

  // Rain/thunderstorm codes (wttr.in weather codes)
  if ([200, 201, 202, 230, 231, 232, 300, 301, 302, 310, 311, 312, 321, 500, 501, 502, 503, 504, 511, 520, 521, 522, 531].includes(weatherCode)) {
    return 'Comfort food weather -- perfect for a hearty stew or warm soup.';
  }

  // Snow
  if ([600, 601, 602, 611, 612, 615, 616, 620, 621, 622].includes(weatherCode)) {
    return 'Cozy weather calls for warm, filling meals.';
  }

  if (tempF < 50) return 'Chilly out -- perfect for a warm soup or hearty chili.';
  if (tempF > 85) return 'It is hot out there -- how about a fresh salad or cold gazpacho?';
  if (tempF > 70) return 'Beautiful weather! Great day for grilling.';

  return 'A lovely day to try something new in the kitchen.';
};

const getWeatherIcon = (weather: WeatherData | null) => {
  if (!weather) return <WbSunny sx={{ fontSize: 32, color: 'var(--honey-gold)' }} />;

  const { weatherCode } = weather;

  if ([200, 201, 202, 230, 231, 232].includes(weatherCode)) {
    return <Thunderstorm sx={{ fontSize: 32, color: '#7B68EE' }} />;
  }
  if ([300, 301, 302, 310, 311, 312, 321, 500, 501, 502, 503, 504, 511, 520, 521, 522, 531].includes(weatherCode)) {
    return <Grain sx={{ fontSize: 32, color: '#6CB4EE' }} />;
  }
  if ([600, 601, 602, 611, 612, 615, 616, 620, 621, 622].includes(weatherCode)) {
    return <AcUnit sx={{ fontSize: 32, color: '#B0E0E6' }} />;
  }
  if ([801, 802, 803, 804].includes(weatherCode)) {
    return <Cloud sx={{ fontSize: 32, color: '#B0B0B0' }} />;
  }

  return <WbSunny sx={{ fontSize: 32, color: 'var(--honey-gold)' }} />;
};

const WeatherGreeting = ({ userName }: WeatherGreetingProps) => {
  const { mode } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('https://wttr.in/?format=j1', {
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error('Weather fetch failed');
        const data = await response.json();
        const current = data.current_condition?.[0];
        if (current) {
          setWeather({
            tempF: parseInt(current.temp_F, 10),
            description: current.weatherDesc?.[0]?.value || 'Clear',
            weatherCode: parseInt(current.weatherCode, 10),
          });
        }
      } catch {
        // Gracefully handle failure -- just show greeting without weather
      }
    };

    fetchWeather();
  }, []);

  const greeting = getGreeting();
  const firstName = userName ? userName.split(' ')[0] : 'Chef';
  const suggestion = getWeatherSuggestion(weather);

  const textVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const lineVariant = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: springs.gentle,
    },
  };

  return (
    <GlassCard
      intensity="ultra"
      hover={false}
      sx={{
        height: '100%',
        minHeight: { xs: 180, md: 200 },
        p: { xs: 3, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* Decorative gradient blob */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        variants={textVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Weather icon + temp */}
        <motion.div variants={lineVariant}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            {getWeatherIcon(weather)}
            {weather && (
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                }}
              >
                {weather.tempF}°F &middot; {weather.description}
              </Typography>
            )}
          </Box>
        </motion.div>

        {/* Greeting */}
        <motion.div variants={lineVariant}>
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              background: mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.15,
              fontFamily: 'var(--font-display)',
              mb: 1,
            }}
          >
            {greeting}, {firstName}.
          </Typography>
        </motion.div>

        {/* Weather suggestion */}
        <motion.div variants={lineVariant}>
          <Typography
            variant="body1"
            sx={{
              color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
              fontSize: { xs: '0.9rem', md: '1rem' },
              fontFamily: 'var(--font-body)',
              maxWidth: 420,
            }}
          >
            {suggestion}
          </Typography>
        </motion.div>
      </motion.div>
    </GlassCard>
  );
};

export default WeatherGreeting;
