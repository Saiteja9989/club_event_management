// src/pages/student/StudentPayment.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Calendar, MapPin } from 'lucide-react';
import paymentApi from '../../api/paymentApi';
import { useToast } from '@/components/ui/useToast';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../../context/AuthContext';

export default function StudentPayment() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await paymentApi.getEventForPayment(eventId);
        setEvent(res.data.event);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handlePayment = async () => {
    if (paying) return;
    setPaying(true);
    setError('');

    try {
      const orderRes = await paymentApi.createOrder(eventId);

      if (orderRes.data.alreadyRegistered || orderRes.data.alreadyPaid) {
        toast({ title: 'Already Registered', description: 'You have already paid and registered for this event.' });
        navigate('/student/my-events');
        return;
      }

      const realOrderId = orderRes.data.orderId;
      setOrderId(realOrderId);

      const options = {
        key: orderRes.data.key,
        amount: orderRes.data.amount * 100,
        currency: 'INR',
        name: 'ClubHub',
        description: event.title,
        order_id: realOrderId,
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              eventId,
            });
            toast({ title: 'Payment Successful!', description: 'You are now registered. Check My Events for your QR code.' });
            navigate('/student/my-events');
          } catch (verifyErr) {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#195de6' },
        modal: { ondismiss: () => setPaying(false) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Payment">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">Loading payment details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !event) {
    return (
      <DashboardLayout title="Payment">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center space-y-6">
            <AlertCircle className="h-16 w-16 mx-auto text-red-600" />
            <div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">Oops! Something went wrong</h2>
              <p className="text-red-700">{error || 'Event not found'}</p>
            </div>
            <Button onClick={() => navigate('/student/events')}>Back to Events</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payment">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/student/events')} className="hover:text-primary transition-colors">Events</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-foreground">{event.title}</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="font-medium text-foreground">Payment</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">Event Payment</h1>
          {orderId && (
            <p className="text-muted-foreground mt-1 text-sm font-mono">Order ID: {orderId}</p>
          )}
        </div>

        {/* Payment Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold">{event.title}</h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} • {event.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{event.venue || 'TBD'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center gap-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="text-3xl font-bold text-primary">₹{event.price?.toLocaleString('en-IN')}</p>
                </div>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  Paid Event
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Summary</h3>
              <div className="bg-muted/50 p-5 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Event Registration</span>
                  <span>₹{event.price?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Fee</span>
                  <span>₹0</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{event.price?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button size="lg" className="w-full text-lg font-medium" onClick={handlePayment} disabled={paying}>
                {paying ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Processing...</>
                ) : (
                  <>Pay ₹{event.price?.toLocaleString('en-IN')} Securely</>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Secured by Razorpay • 100% safe & encrypted
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button variant="ghost" onClick={() => navigate('/student/events')}>
            ← Back to Events
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
