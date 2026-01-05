/**
 * Script to create Stripe coupons and promotion codes for discount system
 * 
 * Usage:
 *   1. Set your Stripe secret key: export STRIPE_SECRET_KEY=sk_test_...
 *   2. Run: pnpm tsx scripts/create-stripe-coupons.ts
 * 
 * Or run directly with the key:
 *   STRIPE_SECRET_KEY=sk_test_... pnpm tsx scripts/create-stripe-coupons.ts
 */

import Stripe from 'stripe';

// Try to load .env.local or .env file if dotenv is available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv');
  const path = require('path');
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  dotenv.config({ path: path.join(process.cwd(), '.env') });
} catch {
  // dotenv not installed, skip
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.error('\nOptions:');
  console.error('  1. Set environment variable: export STRIPE_SECRET_KEY=sk_test_...');
  console.error('  2. Create .env.local file with: STRIPE_SECRET_KEY=sk_test_...');
  console.error('  3. Run with inline: STRIPE_SECRET_KEY=sk_test_... pnpm tsx scripts/create-stripe-coupons.ts');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-11-17.clover',
});

const coupon = {
  name: 'Annual Plan 20% Discount',
  percentOff: 20,
  code: 'ALAUNCH20',
  duration: 'once' as const,
};

async function createCouponsAndPromoCodes() {
  console.log('Creating Stripe launch coupon and promotion code...\n');

  try {
    // Create coupon
    console.log(`Creating coupon: ${coupon.name}...`);
    const createdCoupon = await stripe.coupons.create({
      name: coupon.name,
      percent_off: coupon.percentOff,
      duration: coupon.duration,
      currency: 'usd',
    });

    console.log(`✓ Coupon created: ${createdCoupon.id}`);

    // Create promotion code with minimum order value of $300
    console.log(`Creating promotion code: ${coupon.code}...`);
    // Note: In newer Stripe API versions, use 'promotion' object with 'type' field
    // Minimum amount is in cents: $300 = 30000 cents
    const promotionCode = await stripe.promotionCodes.create({
      promotion: {
        type: 'coupon',
        coupon: createdCoupon.id,
      },
      code: coupon.code,
      active: true,
      restrictions: {
        minimum_amount: 30000, // $300 in cents
        minimum_amount_currency: 'usd',
        first_time_transaction: true,
      },
    });

    console.log(`✓ Promotion code created: ${promotionCode.code} (ID: ${promotionCode.id})\n`);

    console.log('\n=== Summary ===\n');
    console.log('Add this promotion code ID to your .env file:\n');
    console.log(`STRIPE_LAUNCH_PROMOTION_CODE_ID=${promotionCode.id}\n`);
    console.log('Done! Launch coupon and promotion code have been created.');
  } catch (error: any) {
    if (error.code === 'resource_already_exists') {
      console.log(`⚠ Coupon or promotion code already exists for ${coupon.name}`);
      console.log(`  Skipping...\n`);
    } else {
      console.error(`✗ Error creating ${coupon.name}:`, error.message);
      console.log('');
    }
  }
}

createCouponsAndPromoCodes()
  .then(() => {
    console.log('\nScript completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });

