const express = require('express')
const bodyParser = require('body-parser')
const sgMail = require('@sendgrid/mail');
const expressValidator = require('express-validator')
const { body } = require('express-validator/check')
const cors = require('cors')
const fetch = require('node-fetch');

const app = express();
sgMail.setApiKey(process.env.SENDGRID);
app.use(bodyParser.json())
app.use(expressValidator())

const validate = (method) => {
  switch (method) {
    case 'sendMail': {
      return [ 
        body('name', 'No Name').exists(),
        body('recaptchaScore', 'No reCaptcha').exists(),
        body('organization', 'No Organization').exists(),
        body('message', 'No Message').exists(),
        body('email', 'Invalid email').exists().isEmail(),  
      ]   
    }
  }
}

app.options('*', cors())

app.post('*', cors(), validate('sendMail'), async (req, res) => {
  if (req.body == null) {
    return res.send(400, { error: 'no JSON object in the request' })
  }

  let secret = process.env.RECAPTCHA;
  let score = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${req.body.recaptchaScore}`, {
    method: 'POST'
  });
  let response = await score.json();
  console.log("here 1", req.body.recaptchaScore, response);

  if (response.success) {
    let name = req.body.name.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
    let organization = req.body.organization.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
    let message = req.body.message.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
    let email = req.body.email;
    req.body.name = name;
    req.body.message = message;
    console.log('here 2')
    let msg = {
      to: 'contact@ligature.design',
      from: `website@ligature.design`,
      subject: 'New Contact Form Message!',
      text: `From: ${name}, Organization: ${organization}, Email: ${email}\nMessage: ${message}`,
      html: `<p>From: ${name}<br>Organization: ${organization}<br>Email: ${email}<br>Message: ${message}</p>`
    };
    await sgMail.send(msg);
  }
  else {
    res.status(405).send("Captcha did not succeed.")
  }

  res.set('Content-Type', 'application/json')
  res.status(200).send(JSON.stringify(req.body, null, 4))
})

app.all('*', (req, res) => {
  res.send(405, { error: 'only POST requests are accepted' })
})

module.exports = app

