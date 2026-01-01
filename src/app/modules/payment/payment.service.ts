import Stripe from "stripe";
import { prisma } from "../../shared/prisma";
import { PaymentStatus, Prisma } from "@prisma/client";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const bookingId = session.metadata?.bookingId;
      const paymentId = session.metadata?.paymentId;

      if (!bookingId || !paymentId) {
        console.error("❌ Missing bookingId or paymentId in Stripe metadata");
        return;
      }

      const isPaid = session.payment_status === "paid";

      await prisma.$transaction(async (tx) => {
        // 1️⃣ Update booking payment status
        await tx.booking.update({
          where: {
            id: bookingId,
          },
          data: {
            paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          },
        });

        // 2️⃣ Update payment record
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
            paymentGatewayData: session as unknown as Prisma.JsonObject,
          },
        });
      });

      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }
};

export const PaymentService = {
  handleStripeWebhookEvent,
};
