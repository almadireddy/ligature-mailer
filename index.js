const express = require('express')
const bodyParser = require('body-parser')
const sgMail = require('@sendgrid/mail');
const expressValidator = require('express-validator')
const { body } = require('express-validator/check')

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


app.post('*', validate('sendMail'), async (req, res) => {
  if (req.body == null) {
    return res.send(400, { error: 'no JSON object in the request' })
  }

  let secret = process.env.RECAPTCHA;
  let score = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${req.body.recaptchaScore}`, {
    method: 'POST'
  });
  let response = await score.json();

  if (emailValid && response.success) {
    let name = req.body.name.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
    let organization = req.body.organization.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
    let message = req.body.message.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
    let email = req.body.email;
    req.body.name = name;
    req.body.message = message;

    let msg = {
      to: 'contact@ligature.design',
      from: `${email}`,
      subject: 'New Contact Form Message!',
      text: `From: ${name}, Organization: ${organization}`,
      html: '<strong>This is the text for this message</strong>',
    };
    sgMail.send(msg);
  }
  else {
    res.send(405, "Invalid Email")
  }


  res.set('Content-Type', 'application/json')
  res.send(200, JSON.stringify(req.body, null, 4))
})

app.all('*', (req, res) => {
  res.send(405, { error: 'only POST requests are accepted' })
})

module.exports = app

