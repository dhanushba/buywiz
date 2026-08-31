import { EmailContent, EmailProductInfo, NotificationType } from '@/types';
import nodemailer from 'nodemailer';

const Notification = {
  WELCOME: 'WELCOME',
  CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
  LOWEST_PRICE: 'LOWEST_PRICE',
  THRESHOLD_MET: 'THRESHOLD_MET',
};

export async function generateEmailBody(
  product: EmailProductInfo,
  type: NotificationType
) {
  const THRESHOLD_PERCENTAGE = 40;
  const shortenedTitle =
    product.title.length > 20 ? `${product.title.substring(0, 20)}...` : product.title;

  let subject = '';
  let body = '';

  switch (type) {
    case Notification.WELCOME:
      subject = `Welcome to Price Tracking for ${shortenedTitle}`;
      body = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0; }
              .email-container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              h2 { color: #4CAF50; }
              a { color: #007BFF; text-decoration: none; }
              .button { background-color: #28a745; color: white; padding: 10px 20px; text-align: center; border-radius: 5px; display: inline-block; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
              .footer a { color: #777; text-decoration: none; }
              .product-image { width: 100%; max-width: 400px; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <h2>Welcome to BuyWiz 🚀</h2>
              <p>You are now tracking ${product.title}. We'll keep you updated on any changes!</p>
              <p>Here's an example of how you'll receive updates:</p>
              <div style="border: 1px solid #ccc; padding: 10px; background-color: #f8f8f8;">
                <h3>${product.title} is back in stock!</h3>
                <p>Don't miss out - <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="button">Buy it now</a>!</p>
                <img class="product-image" src="${product.image}" alt="Product Image"/>
              </div>
              <p>Stay tuned for more updates on ${product.title} and other products you're tracking.</p>
              <div class="footer">
                <p>You're receiving this email because you signed up for BuyWiz updates.</p>
                <p><a href="${product.url}">Unsubscribe</a> if you'd no longer like to receive updates.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    case Notification.CHANGE_OF_STOCK:
      subject = `${shortenedTitle} is now back in stock!`;
      body = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0; }
              .email-container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              h2 { color: #4CAF50; }
              a { color: #007BFF; text-decoration: none; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
              .footer a { color: #777; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <h2>Great News!</h2>
              <h4>${product.title} is now back in stock! 🎉</h4>
              <p>Grab it before it runs out again! <a href="${product.url}" target="_blank" rel="noopener noreferrer">Check it out here</a>.</p>
              <div class="footer">
                <p>You're receiving this email because you're tracking ${product.title} through BuyWiz.</p>
                <p><a href="${product.url}">Unsubscribe</a> from notifications if you'd prefer not to receive updates.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    case Notification.LOWEST_PRICE:
      subject = `Lowest Price Alert for ${shortenedTitle}`;
      body = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0; }
              .email-container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              h2 { color: #4CAF50; }
              a { color: #007BFF; text-decoration: none; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
              .footer a { color: #777; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <h2>Lowest Price Alert for ${shortenedTitle} 🚨</h2>
              <h4>${product.title} is now at its lowest price ever! 🤑</h4>
              <p>Don't wait! Grab it now before the price goes up again. <a href="${product.url}" target="_blank" rel="noopener noreferrer">Buy it here</a>.</p>
              <img class="product-image" src="${product.image}" alt="Product Image"/>
              <div class="footer">
                <p>You're receiving this email because you're tracking ${product.title} through BuyWiz.</p>
                <p><a href="${product.url}">Unsubscribe</a> if you'd prefer not to receive updates.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    case Notification.THRESHOLD_MET:
      subject = `Discount Alert for ${shortenedTitle}`;
      body = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0; }
              .email-container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              h2 { color: #4CAF50; }
              a { color: #007BFF; text-decoration: none; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
              .footer a { color: #777; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <h2>Discount Alert! 🎉</h2>
              <h4>${product.title} is now available at a discount of more than ${THRESHOLD_PERCENTAGE}%!</h4>
              <p>Don't miss out! <a href="${product.url}" target="_blank" rel="noopener noreferrer">Buy it now</a>.</p>
              <div class="footer">
                <p>You're receiving this email because you're tracking ${product.title} through BuyWiz.</p>
                <p><a href="${product.url}">Unsubscribe</a> if you'd prefer not to receive updates.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    default:
      throw new Error('Invalid notification type.');
  }

  return { subject, body };
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER_EMAIL || 'buywiz@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Validate required email environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.GMAIL_USER_EMAIL) {
    console.error('WARNING: GMAIL_USER_EMAIL environment variable is not defined');
  }
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.error('WARNING: GMAIL_APP_PASSWORD environment variable is not defined');
  }
}

// export const sendEmail = async (emailContent: EmailContent, sendTo: string[]) => {
//   const mailOptions = {
//     from: 'buywiz11@gmail.com',
//     to: sendTo,
//     html: emailContent.body,
//     subject: emailContent.subject,
//   };

//   transporter.sendMail(mailOptions, (error: any, info: any) => {
//     if (error) return console.log(error);

//     console.log('Email sent: ', info);
//   });
// };

export const sendEmail = async (emailContent: EmailContent, sendTo: string[]) => {
  const mailOptions = {
    from: process.env.GMAIL_USER_EMAIL || 'buywiz@gmail.com',
    to: sendTo,
    subject: emailContent.subject,
    html: emailContent.body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info);
    console.log('✅ Email sent: ', info.response);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};
