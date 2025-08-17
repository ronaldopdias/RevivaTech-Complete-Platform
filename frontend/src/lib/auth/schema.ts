/**
 * Fresh Better Auth Database Schema
 * Pure Better Auth implementation - no legacy code
 * Matches the database schema exactly
 */

import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// User table - core Better Auth table with RevivaTech extensions
export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  
  // RevivaTech specific fields
  firstName: text("firstName").notNull().default(''),
  lastName: text("lastName").notNull().default(''),
  phone: text("phone"),
  role: text("role", { 
    enum: ['CUSTOMER', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'] 
  }).notNull().default('CUSTOMER'),
  isActive: boolean("isActive").notNull().default(true),
}, (table) => ({
  emailIdx: index("user_email_idx").on(table.email),
}));

// Session table - Better Auth sessions
export const session = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
  userIdIdx: index("session_userId_idx").on(table.userId),
  tokenIdx: index("session_token_idx").on(table.token),
}));

// Account table - Better Auth accounts (for OAuth and password)
export const account = pgTable("account", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("account_userId_idx").on(table.userId),
  providerAccountIdx: index("account_provider_account_idx").on(table.providerId, table.accountId),
}));

// Verification table - Better Auth email verification
export const verification = pgTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  identifierIdx: index("verification_identifier_idx").on(table.identifier),
}));

// Two Factor Authentication table (Better Auth plugin)
export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Organization tables (Better Auth plugin)
export const organization = pgTable("organization", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const member = pgTable("member", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  organizationIdIdx: index("member_organizationId_idx").on(table.organizationId),
  userIdIdx: index("member_userId_idx").on(table.userId),
  orgUserIdx: index("member_org_user_idx").on(table.organizationId, table.userId),
}));

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status", { enum: ['pending', 'accepted', 'declined'] }).notNull().default('pending'),
  expiresAt: timestamp("expiresAt").notNull(),
  inviterId: text("inviterId").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  organizationIdIdx: index("invitation_organizationId_idx").on(table.organizationId),
}));

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactors: many(twoFactor),
  memberships: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// Export all tables as schema
export const schema = {
  user,
  session,
  account,
  verification,
  twoFactor,
  organization,
  member,
  invitation,
  userRelations,
  sessionRelations,
  accountRelations,
  twoFactorRelations,
  memberRelations,
  organizationRelations,
  invitationRelations,
};

export default schema;