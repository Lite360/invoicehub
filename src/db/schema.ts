import { pgTable, text, timestamp, uuid, boolean, integer, numeric } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Maps to Supabase auth.users ID
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  registrationNumber: text("registration_number"),
  taxId: text("tax_id"),
  currency: text("currency").default("NGN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandingSettings = pgTable("branding_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#0f172a"),
  secondaryColor: text("secondary_color").default("#334155"),
  accentColor: text("accent_color").default("#3b82f6"),
  backgroundColor: text("background_color").default("#ffffff"),
  textColor: text("text_color").default("#020617"),
  defaultTemplate: text("default_template").default("modern"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const signatureSettings = pgTable("signature_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull().unique(),
  signatureUrl: text("signature_url"),
  signatureType: text("signature_type").default("upload"), // "type" or "upload"
  signatureText: text("signature_text"), // If signatureType is "type"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const watermarkSettings = pgTable("watermark_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  type: text("type").default("text"), // "text" or "logo"
  text: text("watermark_text"),
  opacity: integer("opacity").default(10),
  position: text("position").default("center"),
  rotation: integer("rotation").default(-45),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Customers ---
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Invoices ---
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  // Custom customer info (when not linked to a saved customer)
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  // Invoice details
  invoiceNumber: text("invoice_number").notNull(),
  status: text("status").default("draft").notNull(), // draft | sent | paid | overdue | cancelled
  currency: text("currency").default("NGN").notNull(),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date"),
  // Financials
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  discountType: text("discount_type").default("none"), // none | percentage | fixed
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).default("0").notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).default("0"),
  balanceDue: numeric("balance_due", { precision: 12, scale: 2 }).default("0"),
  // Content
  notes: text("notes"),
  paymentTerms: text("payment_terms"),
  // Metadata
  template: text("template").default("modern"),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  sortOrder: integer("sort_order").default(0),
});

// --- Quotations ---
export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  quotationNumber: text("quotation_number").notNull(),
  status: text("status").default("draft").notNull(), // draft | sent | accepted | rejected | expired
  currency: text("currency").default("NGN").notNull(),
  issueDate: text("issue_date").notNull(),
  validUntil: text("valid_until"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  discountType: text("discount_type").default("none"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  terms: text("terms"),
  template: text("template").default("modern"),
  convertedToInvoiceId: uuid("converted_to_invoice_id"),
  sentAt: timestamp("sent_at"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationItems = pgTable("quotation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  sortOrder: integer("sort_order").default(0),
});

// --- Receipts ---
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  invoiceId: uuid("invoice_id").references(() => invoices.id), // Optional link to the invoice paid
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  receiptNumber: text("receipt_number").notNull(),
  status: text("status").default("issued").notNull(), // issued | cancelled
  paymentMethod: text("payment_method").default("cash").notNull(), // cash | transfer | card | cheque
  currency: text("currency").default("NGN").notNull(),
  issueDate: text("issue_date").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  discountType: text("discount_type").default("none"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).default("0").notNull(), // This represents amount received
  notes: text("notes"),
  template: text("template").default("modern"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const receiptItems = pgTable("receipt_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptId: uuid("receipt_id").references(() => receipts.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  sortOrder: integer("sort_order").default(0),
});

// --- Letters ---
export const letters = pgTable("letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientAddress: text("recipient_address"),
  subject: text("subject"),
  reference: text("reference"),
  issueDate: text("issue_date").notNull(),
  content: text("content").notNull(),
  status: text("status").default("draft").notNull(), // draft | sent
  template: text("template").default("modern"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Payments ---
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  customerId: uuid("customer_id").references(() => customers.id),
  clientName: text("client_name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("NGN").notNull(),
  paymentMethod: text("payment_method").default("cash").notNull(), // cash | transfer | card | cheque | paystack
  reference: text("reference"), // Payment reference / transaction ID
  status: text("status").default("completed").notNull(), // completed | pending | failed | refunded
  paymentDate: text("payment_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Admin Roles ---
export const roles = pgTable("roles", {
  id: text("id").primaryKey(), // "super_admin", "finance_admin", etc
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  roleId: text("role_id").references(() => roles.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Subscriptions and Plans ---
export const plans = pgTable("plans", {
  id: text("id").primaryKey(), // "free", "starter", "pro", "business"
  name: text("name").notNull(),
  description: text("description"),
  weeklyPrice: numeric("weekly_price", { precision: 12, scale: 2 }).default("0").notNull(),
  monthlyPrice: numeric("monthly_price", { precision: 12, scale: 2 }).default("0").notNull(),
  yearlyPrice: numeric("yearly_price", { precision: 12, scale: 2 }).default("0").notNull(),
  invoiceLimit: integer("invoice_limit"), // null for unlimited
  customerLimit: integer("customer_limit"), 
  teamMemberLimit: integer("team_member_limit").default(1),
  features: text("features"), // JSON string or comma separated
  status: text("status").default("active").notNull(), // active, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull().unique(),
  planId: text("plan_id").references(() => plans.id).notNull(),
  status: text("status").default("active").notNull(), // trial, active, past_due, cancelled, expired
  billingCycle: text("billing_cycle").default("monthly").notNull(), // weekly, monthly, yearly
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  paystackSubscriptionCode: text("paystack_subscription_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Platform Settings ---
export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"), // Only one row, id is "default"
  siteName: text("site_name").notNull().default("InvoicePoint"),
  contactEmail: text("contact_email"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
