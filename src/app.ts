import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import config from "./config";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import { BookingService } from "./app/modules/bookings/booking.service";
import cron from "node-cron";
import { prisma } from "./app/shared/prisma";
import { PaymentController } from "./app/modules/payment/payment.controller";
import { PaymentService } from "./app/modules/payment/payment.service";

const app: Application = express();

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent
);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

//parser
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Run every minute
cron.schedule("* * * * *", async () => {
  try {
    await prisma.$transaction(async (tx) => {
      console.log("Node cron called at ", new Date());
      // Handle payment webhooks / pending payments
      // Note: Remove this call if it requires a Stripe Event object that isn't available in cron context
      // await PaymentService.handleStripeWebhookEvent();

      // Auto-complete bookings (only ACCEPTED + PAID)
      await BookingService.autoCompleteBookings(tx);
    });
  } catch (err) {
    console.error("Cron job error:", err);
  }
});

app.use("/api", router);

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Server is running...",
    environment: config.node_env,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
