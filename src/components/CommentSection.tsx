import { useState } from 'react';
import { ThumbsUp, MessageCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import type { Comment } from '@/data/mockManga';

interface Props {
  comments: Comment[];
  title?: string;
}

export default function CommentSection({ comments, title = 'Comments' }: Props) {
  const { isAuthenticated, user, profile, setShowLoginModal } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(comments);

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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-sm text-muted-foreground">({localComments.length})</span>
      </div>

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

      <div className="space-y-3">
        {localComments.map(c => (
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
