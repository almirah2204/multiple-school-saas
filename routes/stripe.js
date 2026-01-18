const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const db = require('../db');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// POST /stripe/create-checkout-session
router.post('/create-checkout-session', async (req, res, next) => {
  try {
    const { priceId, schoolId, success_url, cancel_url } = req.body;
    // priceId refers to Stripe Price for plan
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { school_id: schoolId },
      success_url: success_url || `${process.env.FRONTEND_URL}/dashboard`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL}/pricing`
    });
    res.json({ url: session.url });
  } catch (err) { next(err); }
});

// POST /stripe/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const schoolId = session.metadata ? session.metadata.school_id : null;
    // You can link the subscription and mark the plan in DB
    try {
      // fetch subscription
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      // store subscription record
      await db.query('INSERT INTO subscriptions (school_id, stripe_subscription_id, status, starts_at) VALUES ($1,$2,$3,now()) ON CONFLICT (stripe_subscription_id) DO NOTHING', [schoolId, sub.id, sub.status]);
      console.log('Saved subscription for school', schoolId);
    } catch (err) {
      console.error('Error saving subscription', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;