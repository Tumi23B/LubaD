const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ======================
// 🛡️ Security Middleware
// ======================
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests
  message: 'Too many payment requests, please try again later'
});

// ======================
// 🔐 PayFast Configuration
// ======================
const isSandbox = process.env.PAYFAST_MODE === 'sandbox';

const config = {
  merchant_id: isSandbox 
    ? process.env.PAYFAST_SANDBOX_MERCHANT_ID 
    : process.env.PAYFAST_MERCHANT_ID,
  merchant_key: isSandbox 
    ? process.env.PAYFAST_SANDBOX_MERCHANT_KEY 
    : process.env.PAYFAST_MERCHANT_KEY,
  passphrase: isSandbox 
    ? process.env.PAYFAST_SANDBOX_PASSPHRASE 
    : process.env.PAYFAST_PASSPHRASE,
  baseUrl: isSandbox 
    ? process.env.PAYFAST_SANDBOX_URL 
    : process.env.PAYFAST_LIVE_URL
};

// ======================
// 🔧 Helper Functions
// ======================
function generateSignature(data, passphrase) {
  let pfOutput = '';
  for (const key in data) {
    if (data[key] !== '' && data[key] !== undefined) {
      pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
    }
  }
  pfOutput = pfOutput.slice(0, -1); // Remove trailing &
  
  if (passphrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  return crypto.createHash('md5').update(pfOutput).digest('hex');
}

function validatePaymentData(data) {
  const requiredFields = ['amount', 'item_name'];
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field]) errors.push(`${field} is required`);
  });

  if (data.amount && isNaN(parseFloat(data.amount))) {
    errors.push('Amount must be a number');
  }

  return errors.length ? errors : null;
}

// ======================
// 💳 Payment Endpoints
// ======================
app.post('/payfast', paymentLimiter, async (req, res) => {
  try {
      console.log('🔍 Incoming Request Body:', req.body);
    // Validate input
    const validationErrors = validatePaymentData(req.body);
    if (validationErrors) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors 
      });
    }

    const { amount, item_name, email, name_first, name_last, cell_number } = req.body;
    
    const paymentData = {
      merchant_id: config.merchant_id,
      merchant_key: config.merchant_key,
      return_url: process.env.PAYFAST_RETURN_URL || `${req.protocol}://${req.get('host')}/success`,
      cancel_url: process.env.PAYFAST_CANCEL_URL || `${req.protocol}://${req.get('host')}/cancel`,
      notify_url: process.env.PAYFAST_NOTIFY_URL || `${req.protocol}://${req.get('host')}/ipn`,
      amount: parseFloat(amount).toFixed(2),
      item_name: item_name.substring(0, 100), // Truncate to 100 chars
      item_description: item_name.substring(0, 255),
      name_first: (name_first || '').substring(0, 255),
      name_last: (name_last || '').substring(0, 255),
      email_address: email || '',
      cell_number: cell_number || '',
      m_payment_id: `trip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    // Generate signature
    paymentData.signature = generateSignature(paymentData, config.passphrase);

    // Create payment URL
    const paymentUrl = `${config.baseUrl}?${new URLSearchParams(paymentData).toString()}`;

    // Log successful payment initiation
    console.log('💰 Payment initiated:', {
      reference: paymentData.m_payment_id,
      amount: paymentData.amount
    });

    res.json({
      success: true,
      paymentUrl,
      reference: paymentData.m_payment_id,
      amount: paymentData.amount
    });

  } catch (error) {
    console.error('❌ PayFast URL generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate payment URL',
      details: error.message 
    });
  }
});

// ======================
// 🔄 IPN Handler
// ======================
app.post('/ipn', async (req, res) => {
  const ipnData = req.body;
  
  // 1. Validate required fields
  if (!ipnData || !ipnData.m_payment_id || !ipnData.signature) {
    console.warn('⚠️ Invalid IPN data received');
    return res.status(400).send('Invalid IPN data');
  }

  // 2. Verify signature
  const localSignature = generateSignature(ipnData, config.passphrase);
  if (localSignature !== ipnData.signature) {
    console.warn('❌ Signature mismatch:', {
      received: ipnData.signature,
      calculated: localSignature,
      data: ipnData
    });
    return res.status(403).send('Invalid signature');
  }

  // 3. Validate with PayFast
  try {
    const pfResponse = await axios.post(
      `${config.baseUrl}/eng/query/validate`,
      new URLSearchParams(ipnData).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );

    if (pfResponse.data === 'VALID') {
      // ✅ Payment is verified
      console.log('✅ Payment Verified:', {
        reference: ipnData.m_payment_id,
        amount: ipnData.amount_gross,
        status: ipnData.payment_status,
        pf_payment_id: ipnData.pf_payment_id,
        payment_date: ipnData.payment_date
      });

      // ========================================
      // database logic here
      //
      // ========================================

      return res.status(200).send('IPN processed');
    }

    console.warn('❌ PayFast validation failed:', pfResponse.data);
    res.status(400).send('Invalid payment');

  } catch (error) {
    console.error('❌ IPN processing error:', {
      error: error.message,
      data: ipnData,
      stack: error.stack
    });
    res.status(500).send('Error processing IPN');
  }
});

// ======================
// 🖥️ Status Pages
// ======================
app.get('/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        h1 { color: #4CAF50; }
        .container { max-width: 500px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Payment Successful!</h1>
        <p>Thank you for your payment. Your transaction has been completed.</p>
        <p>You may now close this window and return to the app.</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        h1 { color: #f44336; }
        .container { max-width: 500px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Payment Cancelled</h1>
        <p>Your payment was not completed.</p>
        <p>You may close this window and try again.</p>
      </div>
    </body>
    </html>
  `);
});

// ======================
// 🏃‍♂️ Start Server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PayFast server running on port ${PORT}`);
  console.log(`🔒 Mode: ${isSandbox ? 'SANDBOX' : 'LIVE'}`);
  console.log(`🌐 Endpoints:`);
  console.log(`- POST /payfast - Initiate payment`);
  console.log(`- POST /ipn - Payment notifications (IPN)`);
  console.log(`- GET /success - Payment success page`);
  console.log(`- GET /cancel - Payment cancellation page`);
});