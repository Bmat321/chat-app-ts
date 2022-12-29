import { Prisma, PrismaClient } from "@prisma/client";
import { ISODateString } from "next-auth";
import {
  conversationPopulated,
  participantPopulated,
} from "../graphql/resolvers/conversation";
import { Context } from "graphql-ws/lib/server";
import { PubSub } from "graphql-subscriptions";
import { messagePopulated } from "../graphql/resolvers/message";

// server configuration
export interface GraphqlContext {
  session: Session | null;
  prisma: PrismaClient;
  pubsub: PubSub;
}
// users

export interface Session {
  user?: User;
  expires: ISODateString;
}

export interface SubscriptionContext extends Context {
  connectionParams: {
    session?: Session;
  };
}

export interface User {
  id: string;
  image: string;
  email: string;
  emailVerified: boolean;
  name: string;
  username: string;
}

export interface CreateUsernameResponse {
  success?: boolean;
  error?: string;
}

// conversations

export type ConversationPopulated = Prisma.ConversationGetPayload<{
  include: typeof conversationPopulated;
}>;

export type ParticipantPopulated = Prisma.ConversationParticipantGetPayload<{
  include: typeof participantPopulated;
}>;

// message
export interface sendMessageArgurments {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
}

// messageSent Subscription

export interface MessageSentSubscriptionPayload {
  messageSent: MessagePopulated;
}

export interface ConversationUpdatedSupscritionPayload {
  conversationUpdated: {
    conversation: ConversationPopulated;
  };
}
export interface ConversationDeletedSupscritionPayload {
  conversationDeleted: ConversationPopulated;
}

export type MessagePopulated = Prisma.MessageGetPayload<{
  include: typeof messagePopulated;
}>;
