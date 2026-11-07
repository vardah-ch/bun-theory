import { z } from "zod";

// Shared by the checkout form (instant feedback) and the order API (the
// authority). The server re-validates everything regardless.

const phone = z
  .string()
  .trim()
  .min(7, "That phone number looks too short.")
  .max(20, "That phone number looks too long.")
  .regex(/^\+?[\d\s()-]+$/, "Digits, spaces, brackets, dashes and a leading + only.");

export const CustomerSchema = z
  .object({
    name: z.string().trim().min(2, "Tell us your name.").max(80),
    phone,
    email: z.union([z.literal(""), z.string().trim().email("That email doesn't look right.").max(254)]),
    fulfillment: z.enum(["delivery", "pickup"]),
    address: z.string().trim().max(300),
    notes: z.string().trim().max(400),
    paymentMethod: z.enum(["cash", "card_on_pickup", "online"]),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment === "delivery" && v.address.length < 8) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "We need a full delivery address." });
    }
    if (v.fulfillment === "delivery" && v.paymentMethod === "card_on_pickup") {
      ctx.addIssue({ code: "custom", path: ["paymentMethod"], message: "Card at the window is for pickup orders." });
    }
  });

export type CustomerInput = z.infer<typeof CustomerSchema>;

export const OrderItemSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").max(20, "Up to 20 of one item per order. Call us for bigger orders."),
  options: z.array(z.object({ group: z.string().max(60), optionId: z.string().max(80) })).max(40, "Too many options on one item."),
  build: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.null()])).optional(),
  note: z.string().trim().max(200).optional(),
});

export const OrderRequestSchema = z.object({
  customer: CustomerSchema,
  items: z.array(OrderItemSchema).min(1, "Your bag is empty.").max(50, "That's a lot of burgers. Call us for orders this size."),
  couponCode: z.string().trim().toUpperCase().max(40).optional(),
});

export type OrderRequest = z.infer<typeof OrderRequestSchema>;
