const express = require('express')
const bodyParser = require('body-parser')
const sgMail = require('@sendgrid/mail');

const app = express()
sgMail.setApiKey(process.env.SENDGRID);

app.use(bodyParser.json())
app.post('*', (req, res) => {
  if (req.body == null) {
    return res.send(400, { error: 'no JSON object in the request' })
  }

  let msg = {
    to: 'contact@ligature.design',
    from: 'website@ligature.design',
    subject: 'Hello from EXPRESS!',
    text: 'This is the text for this message',
    html: '<strong>This is the text for this message</strong>',
  };
  sgMail.send(msg);

  res.set('Content-Type', 'application/json')
  res.send(200, JSON.stringify(req.body, null, 4))
})

app.all('*', (req, res) => {
  res.send(405, { error: 'only POST requests are accepted' })
})

module.exports = app

