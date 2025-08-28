export const passwordResetEmail = (otpCode, userId, appUrl) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:32px 24px; background:#fff; color:#111;">
    <h2 style="font-size:28px; font-weight:700; margin-bottom:24px; color:#000; letter-spacing:1px;">Password Reset Request</h2>
    <p style="font-size:16px; margin-bottom:16px;">Hello,</p>
    <p style="font-size:16px; margin-bottom:24px;">
      You requested to reset your password. Please use the OTP code below to proceed:
    </p>
    <div style="font-size:32px; font-weight:700; letter-spacing:8px; margin:32px 0; color:#000; background:#f5f5f5; padding:16px 0; text-align:center;">
      ${otpCode}
    </div>
    <p style="font-size:16px; margin-bottom:16px;">
      Or click the link below to reset your password:
    </p>
    <p style="margin:32px 0;">
      <a href="${appUrl}/reset-password/${userId}?token=${otpCode}"
         style="display:inline-block; background:#000; color:#fff; text-decoration:none; font-size:16px; font-weight:600; padding:14px 32px; border:none; border-radius:0; letter-spacing:2px;">
        RESET PASSWORD
      </a>
    </p>
    <p style="font-size:13px; color:#555; margin-top:40px;">
      This OTP and link will expire in 10 minutes. If you did not request this, please ignore this email.
    </p>
    <hr style="border:none; border-top:1px solid #eee; margin:40px 0 24px 0;">
    <p style="font-size:12px; color:#aaa; text-align:center;">
      &copy; ${new Date().getFullYear()} Nepwears. All rights reserved.
    </p>
  </div>
`;
