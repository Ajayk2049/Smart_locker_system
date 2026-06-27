import { Resend } from "resend";
import { config } from "../config.js";

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (config.resendApiKey) {
      this.resend = new Resend(config.resendApiKey);
    }
  }

  async sendDeliveryNotification(
    to: string,
    deviceName: string
  ): Promise<void> {
    if (!this.resend) {
      console.log("📧 Email service not configured, skipping notification");
      return;
    }

    try {
      await this.resend.emails.send({
        from: "SmartBox <noreply@yourdomain.com>",
        to,
        subject: `Parcel Delivered to ${deviceName}`,
        html: `
          <h1>Package Delivered!</h1>
          <p>Your parcel has been delivered to <strong>${deviceName}</strong>.</p>
          <p>The door has been securely closed and locked.</p>
        `,
      });
      console.log(`📧 Delivery notification sent to ${to}`);
    } catch (error) {
      console.error("📧 Failed to send email:", error);
    }
  }
}

export const emailService = new EmailService();
