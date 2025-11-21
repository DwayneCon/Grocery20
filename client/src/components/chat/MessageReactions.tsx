/* client/src/components/chat/MessageReactions.tsx */
import { Box, IconButton, Tooltip } from '@mui/material';
import { ThumbUp, ThumbDown, ContentCopy, Share } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface MessageReactionsProps {
  messageId: string;
  messageText: string;
  onReaction?: (messageId: string, reaction: string) => void;
}

const MessageReactions = ({ messageId, messageText, onReaction }: MessageReactionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleReaction = (reaction: string) => {
    onReaction?.(messageId, reaction);
  };

  const reactions = [
    { icon: <ThumbUp fontSize="small" />, label: 'Helpful', action: 'like' },
    { icon: <ThumbDown fontSize="small" />, label: 'Not Helpful', action: 'dislike' },
    { icon: <ContentCopy fontSize="small" />, label: copied ? 'Copied!' : 'Copy', action: 'copy', onClick: handleCopy },
    { icon: <Share fontSize="small" />, label: 'Share', action: 'share' },
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        display: 'flex',
        gap: 0.5,
        mt: 1,
        opacity: 0,
        transition: 'opacity 0.3s',
        '.MuiListItem-root:hover &': {
          opacity: 1,
        },
      }}
    >
      {reactions.map((reaction) => (
        <Tooltip key={reaction.action} title={reaction.label} arrow>
          <IconButton
            size="small"
            onClick={reaction.onClick || (() => handleReaction(reaction.action))}
            sx={{
              color: 'rgba(255,255,255,0.5)',
              bgcolor: 'rgba(255,255,255,0.05)',
              '&:hover': {
                color: '#4ECDC4',
                bgcolor: 'rgba(78, 205, 196, 0.1)',
              },
              width: 28,
              height: 28,
            }}
            aria-label={reaction.label}
          >
            {reaction.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

export default MessageReactions;
