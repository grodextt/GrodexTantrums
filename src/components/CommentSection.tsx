import { useState, useMemo, useRef, useEffect } from 'react';
import { ThumbsUp, MessageCircle, LogIn, Pin, Shield, Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useComments, CommentRow } from '@/hooks/useComments';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

type SortMode = 'popular' | 'recent';

interface Props {
  mangaId: string;
}

// Parse @mentions (hyphenated) and render as highlighted spans
function renderTextWithMentions(text: string) {
  const parts = text.split(/(@[\w-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const displayName = part.slice(1).replace(/-/g, ' ');
      return <span key={i} className="text-primary font-medium">@{displayName}</span>;
    }
    return part;
  });
}

function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  mangaId,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  mangaId: string;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ display_name: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = async (newValue: string) => {
    onChange(newValue);
    const cursor = textareaRef.current?.selectionStart || newValue.length;
    const textBeforeCursor = newValue.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w-]*)$/);
    if (atMatch) {
      const query = atMatch[1].replace(/-/g, ' ');
      if (query.length >= 1) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .ilike('display_name', `%${query}%`)
          .limit(5);
        setSuggestions((data || []).filter(p => p.display_name));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (name: string) => {
    const cursor = textareaRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursor);
    const textAfterCursor = value.slice(cursor);
    const hyphenatedName = name.replace(/\s+/g, '-');
    const newBefore = textBeforeCursor.replace(/@[\w-]*$/, `@${hyphenatedName} `);
    onChange(newBefore + textAfterCursor);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={e => handleChange(e.target.value)}
        className={className}
        autoFocus={autoFocus}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-60 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.display_name}
              onClick={() => selectSuggestion(s.display_name!)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              @{s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  isAdmin,
  isAuthenticated,
  currentUserId,
  onReply,
  onLike,
  onPin,
  onEdit,
  onDelete,
  mangaId,
  replyTo,
  replyText,
  setReplyText,
  submitReply,
  setReplyTo,
  topLevelParentId,
}: {
  comment: CommentRow;
  isAdmin: boolean;
  isAuthenticated: boolean;
  currentUserId?: string;
  onReply: (id: string) => void;
  onLike: (id: string, hasLiked: boolean) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  mangaId: string;
  replyTo: string | null;
  replyText: string;
  setReplyText: (v: string) => void;
  submitReply: (parentId: string) => void;
  setReplyTo: (id: string | null) => void;
  topLevelParentId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const displayName = comment.profile?.display_name || 'User';
  const initial = displayName[0]?.toUpperCase() || 'U';
  const isOwner = currentUserId === comment.user_id;
  const canModerate = isOwner || isAdmin;

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onEdit(comment.id, editText.trim());
    }
    setEditing(false);
  };

  // For nested replies, use the top-level parent ID
  const effectiveParentId = topLevelParentId || comment.id;

  const handleReplyClick = () => {
    if (topLevelParentId) {
      // This is a nested reply, prepend @mention of the user being replied to
      const hyphenatedName = displayName.replace(/\s+/g, '-');
      setReplyTo(comment.id);
      setReplyText(`@${hyphenatedName} `);
    } else {
      onReply(comment.id);
    }
  };

  return (
    <div className={`p-3 rounded-xl space-y-2 ${comment.is_pinned ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {comment.profile?.avatar_url ? (
              <img src={comment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{initial}</span>
            )}
          </div>
          <span className="text-sm font-medium">{displayName}</span>
          {comment.is_admin && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
              <Shield className="w-2.5 h-2.5" /> Admin
            </span>
          )}
          {comment.is_pinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
              <Pin className="w-2.5 h-2.5" /> Pinned
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canModerate && !editing && (
            <>
              <button onClick={() => { setEditing(true); setEditText(comment.text); }} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground" title="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => onDelete(comment.id)} className="p-1 rounded bg-destructive/10 text-destructive" title="Confirm delete">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Cancel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
          {isAdmin && (
            <button
              onClick={() => onPin(comment.id, comment.is_pinned)}
              className={`p-1 rounded hover:bg-muted transition-colors ${comment.is_pinned ? 'text-amber-500' : 'text-muted-foreground'}`}
              title={comment.is_pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="bg-background border-border min-h-[60px] resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit} disabled={!editText.trim()}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground/90">{renderTextWithMentions(comment.text)}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => onLike(comment.id, !!comment.user_has_liked)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            comment.user_has_liked ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${comment.user_has_liked ? 'fill-primary' : ''}`} />
          {comment.likes_count}
        </button>
        {isAuthenticated && (
          <button
            onClick={handleReplyClick}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Reply
          </button>
        )}
      </div>

      {/* Reply input for this comment */}
      {replyTo === comment.id && (
        <div className="ml-4 flex gap-2 mt-2">
          <MentionInput
            value={replyText}
            onChange={setReplyText}
            placeholder="Write a reply... Use @username to mention"
            className="bg-secondary border-border min-h-[60px] resize-none flex-1"
            autoFocus
            mangaId={mangaId}
          />
          <Button size="sm" onClick={() => submitReply(effectiveParentId)} disabled={!replyText.trim()} className="self-end">
            Reply
          </Button>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 space-y-2 pt-1 border-l-2 border-border/50 pl-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              onReply={onReply}
              onLike={onLike}
              onPin={onPin}
              onEdit={onEdit}
              onDelete={onDelete}
              mangaId={mangaId}
              replyTo={replyTo}
              replyText={replyText}
              setReplyText={setReplyText}
              submitReply={submitReply}
              setReplyTo={setReplyTo}
              topLevelParentId={topLevelParentId || comment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ mangaId }: Props) {
  const { isAuthenticated, user, setShowLoginModal } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { comments, isLoading, addComment, toggleLike, togglePin, editComment, deleteComment } = useComments(mangaId);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  // Extract hyphenated @mentions and convert to space-separated names
  const extractMentions = (text: string): string[] => {
    return [...text.matchAll(/@([\w-]+)/g)].map(m => m[1].replace(/-/g, ' '));
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    const mentions = extractMentions(newComment);
    await addComment.mutateAsync({ text: newComment, mentions });
    setNewComment('');
  };

  const handleReply = (parentId: string) => {
    setReplyTo(replyTo === parentId ? null : parentId);
    setReplyText('');
  };

  const submitReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    const mentions = extractMentions(replyText);
    await addComment.mutateAsync({ text: replyText, parentId, mentions });
    setReplyTo(null);
    setReplyText('');
  };

  const sortedComments = useMemo(() => {
    const pinned = comments.filter(c => c.is_pinned);
    const unpinned = comments.filter(c => !c.is_pinned);
    const sorted = sortMode === 'popular'
      ? unpinned.sort((a, b) => b.likes_count - a.likes_count)
      : unpinned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [...pinned, ...sorted];
  }, [comments, sortMode]);

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Comments</h3>
          <span className="text-sm text-muted-foreground">({totalCount})</span>
        </div>
        <div className="flex items-center bg-muted rounded-full p-0.5">
          {(['popular', 'recent'] as SortMode[]).map(mode => (
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

      {/* Input */}
      {isAuthenticated ? (
        <div className="space-y-2">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            placeholder="Write a comment... Use @username to mention someone"
            className="bg-secondary border-border min-h-[80px] resize-none"
            mangaId={mangaId}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || addComment.isPending} className="gap-1.5">
              <Send className="w-3.5 h-3.5" /> Post
            </Button>
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

      {/* Comments */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading comments...</div>
      ) : (
        <div className="space-y-3">
          {sortedComments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              currentUserId={user?.id}
              onReply={handleReply}
              onLike={(id, hasLiked) => toggleLike.mutate({ commentId: id, hasLiked })}
              onPin={(id, isPinned) => togglePin.mutate({ commentId: id, isPinned })}
              onEdit={(id, text) => editComment.mutate({ commentId: id, text })}
              onDelete={(id) => deleteComment.mutate(id)}
              mangaId={mangaId}
              replyTo={replyTo}
              replyText={replyText}
              setReplyText={setReplyText}
              submitReply={submitReply}
              setReplyTo={setReplyTo}
            />
          ))}
          {comments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </div>
  );
}
