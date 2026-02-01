import Stripe from "stripe";
import { prisma } from "../../shared/prisma";
import { PaymentStatus, Prisma } from "@prisma/client";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  let bookingId: string | undefined;
  let paymentId: string | undefined;
  let isPaid = false;
  let sessionOrCharge: any;

  if (event.type === "checkout.session.completed") {
    sessionOrCharge = event.data.object as Stripe.Checkout.Session;
    bookingId = sessionOrCharge.metadata?.bookingId;
    paymentId = sessionOrCharge.metadata?.paymentId;
    isPaid = sessionOrCharge.payment_status === "paid";
    console.log("✅ Checkout session completed for:", sessionOrCharge.id);
  } else if (event.type === "charge.succeeded") {
    sessionOrCharge = event.data.object as Stripe.Charge;
    bookingId = sessionOrCharge.metadata?.bookingId;
    paymentId = sessionOrCharge.metadata?.paymentId;
    isPaid = sessionOrCharge.paid === true;
    console.log("✅ Charge succeeded for:", sessionOrCharge.id);
  }

  if (bookingId && paymentId) {
    console.log(`💰 Processing payment for booking ${bookingId}, status: ${isPaid}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1️⃣ Update booking payment status
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          },
        });

        // 2️⃣ Update payment record
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
            paymentGatewayData: sessionOrCharge as unknown as Prisma.JsonObject,
            stripeEventId: event.id,
          },
        });
      });
      console.log(`✅ Database updated for booking ${bookingId}`);
    } catch (error) {
      console.error(`❌ Failed to update database for booking ${bookingId}:`, error);
    }
  } else {
    console.log(`ℹ️ Event ${event.type} received but missing bookingId/paymentId metadata.`);
  }
};

export const PaymentService = {
  handleStripeWebhookEvent,
};
