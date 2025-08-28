import twilio from "twilio";
import config from "../../config/config.js";

// Initialize Twilio client with account SID and auth token
const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

// Function to send SMS using Twilio
const sendSMS = async (to, message) => {
  // Ensure the phone number starts with the country code
  if (!to.startsWith("+")) {
    to = "+977" + to;
  }
  // Send SMS using Twilio client
  try {
    const sms = await client.messages.create({
      // Set the message body and recipient phone number
      body: message,
      // Set the sender phone number from Twilio configuration
      from: config.twilioPhoneNumber,
      // Set the recipient phone number
      to,
    });

    // Return the SMS response
    return sms;
  } catch (error) {
    // If there's an error sending the SMS, throw an error with a message
    throw new Error("Failed to send SMS: " + error.message);
  }
};

export default sendSMS;
