import { useState, useMemo } from 'react';
import { ThumbsUp, MessageCircle, LogIn, Flame, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import type { Comment } from '@/types/manga';

type SortMode = 'best' | 'newest' | 'oldest';

interface Props {
  comments: Comment[];
  title?: string;
}

export default function CommentSection({ comments, title = 'Comments' }: Props) {
  const { isAuthenticated, user, profile, setShowLoginModal } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [sortMode, setSortMode] = useState<SortMode>('best');
  const [commentedToday, setCommentedToday] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  const handleSubmit = () => {
    if (!newComment.trim() || !user) return;
    setLocalComments(prev => [{
      id: Date.now(),
      user: profile?.display_name || 'User',
      avatar: '',
      text: newComment,
      date: 'Just now',
      likes: 0,
    }, ...prev]);
    setNewComment('');
    if (!commentedToday) {
      setCommentedToday(true);
      setStreakDays(prev => prev + 1);
    }
  };

  const sortedComments = useMemo(() => {
    const copy = [...localComments];
    if (sortMode === 'best') return copy.sort((a, b) => b.likes - a.likes);
    if (sortMode === 'newest') return copy;
    return [...copy].reverse();
  }, [localComments, sortMode]);

  const daysUntilReward = 3 - (streakDays % 3);
  const tokensAvailable = Math.floor(streakDays / 3);

  return (
    <div className="space-y-4">
      {/* Header with sort */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="text-sm text-muted-foreground">({localComments.length})</span>
        </div>
        <div className="flex items-center bg-muted rounded-full p-0.5">
          {(['best', 'newest', 'oldest'] as SortMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors ${
                sortMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Streak banner — only for logged-in users */}
      {isAuthenticated && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{streakDays} Day Streak</span>
                {tokensAvailable > 0 && (
                  <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-[10px] px-1.5 py-0">
                    {tokensAvailable} ticket{tokensAvailable !== 1 ? 's' : ''} available!
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {commentedToday ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-500" />
                    You've commented today! · {daysUntilReward} day{daysUntilReward !== 1 ? 's' : ''} until free ticket
                  </span>
                ) : (
                  <span>Comment today to {streakDays === 0 ? 'start' : 'continue'} your streak · {daysUntilReward} day{daysUntilReward !== 1 ? 's' : ''} until free ticket</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < (streakDays % 3 === 0 && streakDays > 0 && !commentedToday ? 3 : streakDays % 3)
                      ? 'bg-primary'
                      : 'bg-muted-foreground/25'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              Resets in 23h
            </span>
          </div>
        </div>
      )}

      {/* Comment input or login prompt */}
      {isAuthenticated ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-secondary border-border min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()}>Post Comment</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full p-4 rounded-lg border border-dashed border-border bg-secondary/50 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span className="text-sm">Sign in to leave a comment</span>
        </button>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {sortedComments.map(c => (
          <div key={c.id} className="p-3 rounded-lg bg-secondary/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{c.user[0]}</span>
                </div>
                <span className="text-sm font-medium">{c.user}</span>
                <span className="text-xs text-muted-foreground">{c.date}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{c.text}</p>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
              {c.likes}
            </button>
          </div>
        ))}
        {localComments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
