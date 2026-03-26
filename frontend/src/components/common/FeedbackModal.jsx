import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import StarRating from './StarRating';
import eventsApi from '../../api/eventsApi';
import { useToast } from '@/components/ui/useToast';

const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent!' };

export default function FeedbackModal({ open, onClose, event, onSubmitted }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    if (!open || !event?._id) return;
    setLoadingExisting(true);
    eventsApi.getMyFeedback(event._id)
      .then((res) => {
        const f = res.data.feedback;
        if (f) { setRating(f.rating); setReview(f.review || ''); }
        else { setRating(0); setReview(''); }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [open, event?._id]);

  const handleSubmit = async () => {
    if (!rating) return toast({ variant: 'destructive', description: 'Please select a rating.' });
    setSaving(true);
    try {
      await eventsApi.submitFeedback(event._id, { rating, review });
      toast({ description: 'Feedback submitted! Thank you.' });
      onSubmitted?.({ rating, review });
      onClose();
    } catch (err) {
      toast({ variant: 'destructive', description: err.response?.data?.message || 'Failed to submit.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Rate this Event</DialogTitle>
          {event?.title && <p className="text-sm text-muted-foreground mt-1 truncate">{event.title}</p>}
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Stars */}
            <div className="flex flex-col items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className={`text-sm font-semibold transition-all ${rating ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {rating ? LABELS[rating] : 'Tap a star to rate'}
              </span>
            </div>

            {/* Review */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Review <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground text-right">{review.length}/500</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !rating || loadingExisting} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
