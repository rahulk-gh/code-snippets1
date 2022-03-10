

/* eslint-disable no-console */
const express = require('express');

const app = express();
const { resolve } = require('path');
// Replace if using a different env file or config
require('dotenv').config({ path: './.env' });

//RK - added stripe node library with var pulled from .env file in place of actual stripe secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
// https://stackoverflow.com/questions/24330014/bodyparser-is-deprecated-express-4

const allitems = {};

// const MIN_ITEMS_FOR_DISCOUNT = 2;
app.use(express.static(process.env.STATIC_DIR));

app.use(
  express.json(
    {
      // Should use middleware or a function to compute it only when
      // hitting the Stripe webhook endpoint.
      verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/webhook')) {
          req.rawBody = buf.toString();
        }
      },
    },
  ),
);

// load config file
const fs = require('fs');

const configFile = fs.readFileSync('../config.json');
const config = JSON.parse(configFile);

// load items file for video courses
const file = require('../items.json');
const { takeCoverage } = require('v8');
const { resolveSoa } = require('dns');
const { ENGINE_METHOD_PKEY_ASN1_METHS } = require('constants');

file.forEach((item) => {
  const initializedItem = item;
  initializedItem.selected = false;
  allitems[item.itemId] = initializedItem;
});


// const asyncMiddleware = fn => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

// Routes
// Get started! Shows the main page of the challenge with links to the
// different sections.
app.get('/', (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/index.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});

//serving the public Key dynamically
app.get('/publicKey', (req, res) => {
  try {
    // process.env.STRIPE_SECRET_KEY
    // const path = resolve(`${process.env.STATIC_DIR}/index.html`);
    // if (!fs.existsSync(path)) throw Error();
    res.send({key: process.env.STRIPE_PUBLISHABLE_KEY});
  } catch (error) {
      console.log(`couldnt send public key - $(error)`);
  }
});


// Challenge Section 1
// Challenge section 1: shows the concert tickets page.
app.get('/concert', (req, res) => {
  console.log('Inside the concert passge now');
  try {
    const path = resolve(`${process.env.STATIC_DIR}/concert.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});

//RK - adding a domain
const YOUR_DOMAIN = 'http://localhost:4242';

app.get('/setup-concert-page', (req, res) => {
  res.send({
    basePrice: config.checkout_base_price,
    currency: config.checkout_currency,
  });
});

app.post('/setup-concert-page', async (req, res) => {

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        //exact price ID of product we are trying to sell
        price: 'price_1Jr1JnGCV0rfiy0S3YF3bTj7',
        quantity: req.body.quantity,
      },
    ],
    payment_method_types: [
      'card',
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}/concert-success?id={CHECKOUT_SESSION_ID}`,
    // cancel_url: './public/static-file-error.html',
    cancel_url: `${YOUR_DOMAIN}/static-file-error.html`,
  });

  
  res.json({
    id: session.id,
  });
  // res.redirect(303, session.url)
  //this line was above res.json

});

// Show success page, after user buy concert tickets
app.get('/concert-success', (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/concert-success.html`);
    console.log(path);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});

app.get('/checkout-session', async (req, res) =>{
  const session = await stripe.checkout.sessions.retrieve(req.query.id);
  res.json(session);
});

// Chalellenge Section 2
// Challenge section 2: shows the videos purchase page.
app.get('/videos', (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/videos.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});

// Challenge section 2: returns config information that is used by the client JavaScript
// to display the videos page.
app.get('/setup-video-page', (req, res) => {
  res.send({
    discountFactor: config.video_discount_factor,
    minItemsForDiscount: config.video_min_items_for_discount,
    items: allitems,
  });
});



// This might be same as above
app.post('/vidTest2', async (req, res)=>{
  console.log(req.body);
  const paymentIntent = await stripe.paymentIntents.create({
    amount:req.body.amount,
    currency: 'usd',
    payment_method_types:[
      'card',
    ],
  });
  // res.json({client_secret: paymentIntent.client_secret})
  res.json({clientSecret: paymentIntent.client_secret})
})
  


// Challenge section 3: shows the lesson sign up page.
app.get('/lessons', (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/lessons.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});


var cusIDlast4;

app.post('/lessonTest1', async (req, res) => {
  console.log(req.body);

  try{
    const customerQuery = await stripe.customers.list({
      limit: 3, 
      email: req.body.email,
      
      
    });
    if(customerQuery.data.length ==0){
      console.log(' The customer does not exist. New Customer welcome!')
      const customer = await stripe.customers.create({
          name: req.body.name,
          email: req.body.email,
        });
      console.log(customer.id);
      console.log(customer.email);
        
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        // payment_method_types: ['card'],
      });
      
      console.log(`This is the setupIntent ${JSON.stringify(setupIntent)}`);

      
      res.json({client_secret: setupIntent.client_secret,  customerID: customer.id, customerExists: false,});

    } else{
      console.log(' You exist already!')
      console.log(customerQuery.data[0].name);
      console.log(customerQuery.data[0].id);
      // return res.status(300).send({
      //   message: 'The user exists, Please login'
      // })
      // res.sendStatus(404);
      // res.status(404).send('not found');
      res.json({client_secret: 'ohnosodumb!!!!', customerID: customerQuery.data[0].id , customerExists: true, });
    }
  } catch (e){
    console.error('Something went wrong');
    // console.log(customerQuery.data[0]);
    // console.log(customerQuery.data[0].name);
  }
  



});


// Challenge section 4: '/schedule-lesson'
// Authorize a payment for a lesson
//
// Parameters:
// customer_id: id of the customer
// amount: amount of the lesson in cents
// description: a description of this lesson
//
// Example call:
// curl -X POST http://localhost:4242/schdeule-lesson \
//  -d customer_id=cus_GlY8vzEaWTFmps \
//  -d amount=4500 \
//  -d description='Lesson on Feb 25th'
//
// Returns: a JSON response of one of the following forms:
// For a successful payment, return the payment intent:
//   {
//        payment: <payment_intent>
//    }
//
// For errors:
//  {
//    error:
//       code: the code returned from the Stripe error if there was one
//       message: the message returned from the Stripe error. if no payment method was
//         found for that customer return an msg 'no payment methods found for <customer_id>'
//    payment_intent_id: if a payment intent was created but not successfully authorized
// }



app.post('/schedule-lesson', async (req, res) => {
  console.log(req.body.amount);

  try{
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd',
      customer: req.body.customer_id,
      description: req.body.description,
      metadata: {type: 'lessons-payment'},
      
    });
    console.log(`the required paymentIntent is ${paymentIntent}`);
    // res.json({payment: paymentIntent.id})
    res.json({payment: paymentIntent})


  } catch (e){
    console.error(`Something went wrong ${e}`);
    res.json(e);
  }
});

// Challenge section 4: '/complete-lesson-payment'
// Capture a payment for a lesson.
//
// Parameters:
// amount: (optional) amount to capture if different than the original amount authorized
//
// Example call:
// curl -X POST http://localhost:4242/complete_lesson_payment \
//  -d payment_intent_id=pi_XXX \
//  -d amount=4500
//
// Returns: a JSON response of one of the following forms:
//
// For a successful payment, return the payment intent:
//   {
//        payment: <payment_intent>
//    }
//
// for errors:
//  {
//    error:
//       code: the code returned from the error
//       message: the message returned from the error from Stripe
// }
//
app.post('/complete-lesson-payment', async (req, res) => {
  try{
   

    const paymentIntent = await stripe.paymentIntents.capture(
      req.body.payment_intent_id , {amount_to_capture: req.body.amount}
    );
    console.log(`the captured paymentIntent is ${paymentIntent}`);
    // res.json({payment: paymentIntent.id})
    res.json({payment: paymentIntent})
  } catch (e){
    console.error(`Something went wrong ${e}`);
    res.json(e);
  }
});

// Challenge section 4: '/refund-lesson'
// Refunds a lesson payment.  Refund the payment from the customer (or cancel the auth
// if a payment hasn't occurred).
// Sets the refund reason to 'requested_by_customer'
//
// Parameters:
// payment_intent_id: the payment intent to refund
// amount: (optional) amount to refund if different than the original payment
//
// Example call:
// curl -X POST http://localhost:4242/refund-lesson \
//   -d payment_intent_id=pi_XXX \
//   -d amount=2500
//
// Returns
// If the refund is successfully created returns a JSON response of the format:
//
// {
//   refund: refund.id
// }
//
// If there was an error:
//  {
//    error: {
//        code: e.error.code,
//        message: e.error.message
//      }
//  }
app.post('/refund-lesson', async (req, res) => {
  try{
    const paymentIntent = await stripe.paymentIntents.retrieve(
    req.body.payment_intent_id);
    console.log(`The captured payment intent status is ${paymentIntent.status}`)
    if (paymentIntent.status ==='succeeded') {
      try{
        //add another if option incase amount is not given
        const refund = await stripe.refunds.create({
          amount: req.body.amount,
          payment_intent: req.body.payment_intent_id,
          reason: "requested_by_customer"
        });
        res.json({refund: refund})
      } catch(e) {
        console.error(`Refund failed  - ${e}`);
        res.json(e);
      }
    } else {
      try{
        //add another if option incase amount is not given
        const canceledPaymentIntent = await stripe.paymentIntents.cancel(
          req.body.payment_intent_id,
        );
        res.json({canceled_paymentIntent: canceledPaymentIntent})
      } catch(e) {
        console.error(`payment Intent de-authorization failed  - ${e}`);
        res.json(e);
      }
    }

} catch (e){
  console.error(`Something went wrong ${e}`);
  res.json(e);
}
});

// Challenge Section 5
// Displays the account update page for a given customer


var customerIdParam;


app.get('/account-update/:customer_id',async (req, res) => {
  console.log(req.params.customer_id)
  customerIdParam = req.params.customer_id;
  try {
    const path = resolve(`${process.env.STATIC_DIR}/account-update.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});


app.get("/update-get-customer", async(req, res) =>{
  try{
    const setupIntents = await stripe.setupIntents.list({
      limit: 2,
      customer: customerIdParam,
      expand: ['data.payment_method', 'data.customer'],
    });
    // console.log(`here is the list of setupIntents ${JSON.stringify(setupIntents, null, 2)}`)
    //above works just removed coz of too many messages. 

    // res.json({listOfSI: setupIntents});
    res.json({setupIntentsX: setupIntents});

  } catch(err){
    // console.log(`couldnt find customer ${err}`)
    console.log(`couldnt find setupIntents ${err}`)
  }
});


app.post("/update-set-customer", async(req, res) => {
  
  try{
    const updatedCustomer = await stripe.customers.update(
      customerIdParam,
      // req.body.id, 
      {
        name: req.body.name,
        email: req.body.email
      }
    );
    console.log(JSON.stringify(updatedCustomer, null, 2));
    console.log(updatedCustomer.email);
    console.log(updatedCustomer.id);
    // res.json({customer: customer})

    try{
      const newSetupIntent = await stripe.setupIntents.create({
        // customer: updatedCustomer.id
        customer: customerIdParam
      })
  
      res.send({newSetupIntent: newSetupIntent});
    } catch (error) {
      console.log('couldnt create new setupIntent using customer id - ${error}')
    };
  } catch (err) {
    console.log(`couldnt update customer, ${err}`)
  }
  // console.log(`accessing customer outside ${updatedCustomer.id}`)

  
});





// Challenge section 5: '/delete-account'
// Deletes a customer object if there are no uncaptured payment intents for them.
//
// Parameters:
//   customer_id: the id of the customer to delete
//
// Example request
//   curl -X POST http://localhost:4242/delete-account \
//    -d customer_id=cusXXX
//
// Returns 1 of 3 responses:
// If the customer had no uncaptured charges and was successfully deleted returns the response:
//   {
//        deleted: true
//   }
//
// If the customer had uncaptured payment intents, return a list of the payment intent ids:
//   {
//     uncaptured_payments: ids of any uncaptured payment intents
//   }
//
// If there was an error:
//  {
//    error: {
//        code: e.error.code,
//        message: e.error.message
//      }
//  }
//
app.post('/delete-account/:customer_id', async (req, res) => {
  customerIdParam = req.params.customer_id;
  try{
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerIdParam,
    });
    console.log(`paymentIntents data array length is ${paymentIntents.data.length}`)
    
    var dataArray = paymentIntents.data.filter(element => element.status !=='succeeded')
    
    console.log(JSON.stringify(dataArray));
    console.log(dataArray.length);

    if(dataArray.length ===0){
      try{
        const deletedConfirm = await stripe.customers.del(
          customerIdParam
        );
        res.json({deleted: deletedConfirm.deleted})
      } catch(err){
        console.log(`couldnt delete customer -${err}`)
      }

    }else{
      res.json({statusArray: dataArray});
    }
  } catch(err){
    // console.log(`couldnt find customer ${err}`)
    console.log(`couldnt find setupIntents ${err}`)
  }
  
});


// Challenge section 6: '/calculate-lesson-total'
// Returns the total amounts for payments for lessons, ignoring payments
// for videos and concert tickets.
//
// Example call: curl -X GET http://localhost:4242/calculate-lesson-total
//
// Returns a JSON response of the format:
// {
//      payment_total: total before fees and refunds (including disputes), and excluding payments
//         that haven't yet been captured.
//         This should be equivalent to net + fee totals.
//      fee_total: total amount in fees that the store has paid to Stripe
//      net_total: net amount the store has earned from the payments.
// }
//



app.get('/calculate-lesson-total', async (req, res) => {
  const balanceTransactions = await stripe.balanceTransactions.list({
    created: {
      lt : Date.now() - (7*24*60*60),  
    }
  });

  var sumArray = balanceTransactions.data.map(element => {return element.amount} );
  var sumTotal =  sumArray.reduce((a, b) => a + b, 0)
  var feeArray = balanceTransactions.data.map(element => {return element.fee} );
  var feeTotal =  feeArray.reduce((a, b) => a + b, 0)
  var netArray = balanceTransactions.data.map(element => {return element.net} );
  var netTotal =  netArray.reduce((a, b) => a + b, 0)
  
  res.json({
    amount:sumTotal, 
    fee: feeTotal,
    net: netTotal,
    
  })
});


// Challenge section 6: '/find-customers-with-failed-payments'
// Returns any customer who meets the following conditions:
// The last attempt to make a payment for that customer failed.
// The payment method associated with that customer is the same payment method used
// for the failed payment, in other words, the customer has not yet supplied a new payment method.
//
// Example request: curl -X GET http://localhost:4242/find-customers-with-failed-payments
//
// Returns a JSON response with information about each customer identified and
// their associated last payment
// attempt and, info about the payment method on file.
// {
//   <customer_id>:
//     customer: {
//       email: customer.email,
//       name: customer.name,
//     },
//     payment_intent: {
//       created: created timestamp for the payment intent
//       description: description from the payment intent
//       status: the status of the payment intent
//       error: the error returned from the payment attempt
//     },
//     payment_method: {
//       last4: last four of the card stored on the customer
//       brand: brand of the card stored on the customer
//     }
//   },
//   <customer_id>: {},
//   <customer_id>: {},
// }
//
app.get('/find-customers-with-failed-payments', (req, res) => {

  res.json({message: 'unsure of how to filter this'})
});

function errorHandler(err, req, res, next) {
  res.status(500).send({ error: { message: err.message } });
}

app.use(errorHandler);

app.listen(4242, () => console.log(`Node server listening on port http://localhost:${4242}`));
