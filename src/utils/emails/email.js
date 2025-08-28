import config from "../../config/config.js";
import { Resend } from "resend";

const resend = new Resend(config.apiKey);

// This function sends OTP emails using the Resend service.
export const sendEmail = async (receiverEmail, { subject, body }) => {
  const { error, response } = await resend.emails.send({
    from: "noreply@otp.nepwears.tech",
    to: [receiverEmail],
    subject,
    html: body,
  });

  if (error) {
    throw new Error("Failed to send email");
  }

  return response;
};
