import { PaymentMethod, PaymentStatus } from "@prisma/client";
import prisma from "../../prisma/client";
import { AppError } from "../../utils/errorHandler";
import { StripeService } from "./stripe.service";

export interface PaymentInitResponse {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  checkoutUrl?: string; 
  clientSecret?: string; 
  approvalUrl?: string; 
  paymentIntentId?: string; 
  sessionId?: string; 

  status: "initialized" | "pending" | "failed";
}

export class PaymentService {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  
  }


  //  Initialize Stripe payment with Checkout Session (Hosted Payment Page)

  async initializeStripePayment(
    orderId: string,
    amount: number,
    items: Array<{ title: string; price: number; quantity: number }>
  ): Promise<PaymentInitResponse> {
    const { checkoutUrl, sessionId } =
      await this.stripeService.createCheckoutSession(orderId, amount, items);

    return {
      orderId,
      paymentMethod: PaymentMethod.STRIPE,
      amount,
      checkoutUrl,
      sessionId,
      status: "initialized",
    };
  }



  /**
   * Initialize payment based on payment method
   */
  async initializePayment(
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    items: Array<{ title: string; price: number; quantity: number }>
  ): Promise<PaymentInitResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    switch (paymentMethod) {
      case PaymentMethod.STRIPE:
        return this.initializeStripePayment(orderId, amount, items);
      default:
        throw new AppError("Invalid payment method", 400);
    }
  }

  /**
   * Get Stripe service instance
   */
  getStripeService(): StripeService {
    return this.stripeService;
  }


}

