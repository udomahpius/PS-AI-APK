
const nm = require("nodemailer");

const tx = process.env.SMTP_HOST
  ? nm.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

exports.send = async (to, subject, text) => {
  if (!tx) {
    console.log(`[MAIL → ${to}] ${subject}\n${text}\n`);

    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }

    return;
  }

  try {
    return await tx.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
    });
  } catch (e) {
    console.error("Email delivery failed:", e.message);
    throw e;
  }
};
