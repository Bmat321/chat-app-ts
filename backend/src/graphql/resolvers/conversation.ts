import {
  ConversationPopulated,
  ConversationUpdatedSupscritionPayload,
  ConversationDeletedSupscritionPayload,
  GraphqlContext,
} from "../../utils/types";
import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";
import { userIsConversationParticipant } from "../../utils/functions";
import { GraphQLError } from "graphql";

const resolvers = {
  Query: {
    conversations: async (
      _: any,
      __: any,
      context: GraphqlContext
    ): Promise<Array<ConversationPopulated>> => {
      const { session, prisma } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const {
        user: { id: userId },
      } = session;

      try {
        const conversations = await prisma.conversation.findMany({
          include: conversationPopulated,
        });

        return conversations.filter(
          (conversation) =>
            !!conversation.participants.find((p) => p.userId === userId)
        );
      } catch (error: any) {
        throw new GraphQLError(error.message);
      }
    },
  },

  Mutation: {
    createConversation: async (
      _: any,
      args: { participantIds: Array<string> },
      context: GraphqlContext
    ): Promise<{ conversationId: string }> => {
      const { prisma, session, pubsub } = context;
      const { participantIds } = args;
      // console.log("IDS", participantIds);
      if (!session?.user) {
        throw new GraphQLError("Noth authorized");
      }

      const {
        user: { id: userId },
      } = session;
      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participantIds.map((id) => ({
                  userId: id,
                  hasSeenLatestMessage: id === userId,
                })),
              },
            },
          },
          include: conversationPopulated,
        });
        pubsub.publish("CONVERSATION_CREATED", {
          conversationCreated: conversation,
        });
        return {
          conversationId: conversation.id,
        };
      } catch (error) {
        // console.log("Conversation in Resolvers", error);
        throw new GraphQLError("Error creating conversation");
      }
    },

    markConversationAsRead: async function (
      _: any,
      args: { userId: string; conversationId: string },
      context: GraphqlContext
    ): Promise<boolean> {
      const { prisma, session } = context;
      const { userId, conversationId } = args;

      if (!session?.user) {
        throw new GraphQLError("Noth authorized");
      }

      try {
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId,
          },
        });

        if (!participant) {
          throw new GraphQLError("Participant entity not found");
        }

        await prisma.conversationParticipant.update({
          where: {
            id: participant.id,
          },
          data: {
            hasSeenLatestMessage: true,
          },
        });
        return true;
      } catch (error: any) {
        // console.log("marked message error", error);
        throw new GraphQLError(error.message);
      }
    },

    deleteConversation: async function (
      _: any,
      args: { conversationId: string },
      context: GraphqlContext
    ): Promise<boolean> {
      const { prisma, session, pubsub } = context;
      const { conversationId } = args;

      if (!session?.user) {
        throw new GraphQLError("Noth authorized");
      }
      try {
        // Delete conversation and all related entity
        const [deletedConversation] = await prisma.$transaction([
          prisma.conversation.delete({
            where: {
              id: conversationId,
            },
            include: conversationPopulated,
          }),
          prisma.conversationParticipant.deleteMany({
            where: {
              conversationId,
            },
          }),
          prisma.message.deleteMany({
            where: {
              conversationId,
            },
          }),
        ]);

        pubsub.publish("CONVERSATION_DELETED", {
          conversationDeleted: deletedConversation,
        });
      } catch (error: any) {
        // console.log("DELETE CONVERSATION", error);
        throw new GraphQLError("Failed to delete conversation");
      }
      return true;
    },
  },

  Subscription: {
    conversationCreated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphqlContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
        },
        (
          payload: ConversationSubscriptionPayload,
          _,
          context: GraphqlContext
        ) => {
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError("Noth authorized");
          }

          const {
            conversationCreated: { participants },
          } = payload;

          return userIsConversationParticipant(participants, session.user.id);
        }
      ),
    },

    conversationUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphqlContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator(["CONVERSATION_UPDATED"]);
        },
        (
          payload: ConversationUpdatedSupscritionPayload,
          _: any,
          context: GraphqlContext
        ) => {
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError("Noth authorized");
          }
          const {
            conversationUpdated: {
              conversation: { participants },
            },
          } = payload;
          const {
            user: { id: userId },
          } = session;

          return userIsConversationParticipant(participants, userId);
        }
      ),
    },

    conversationDeleted: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphqlContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator(["CONVERSATION_DELETED"]);
        },
        (
          payload: ConversationDeletedSupscritionPayload,
          _: any,
          context: GraphqlContext
        ) => {
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError("Noth authorized");
          }

          const { id: userId } = session.user;
          const {
            conversationDeleted: { participants },
          } = payload;

          return userIsConversationParticipant(participants, userId);
        }
      ),
    },
  },
};

export interface ConversationSubscriptionPayload {
  conversationCreated: ConversationPopulated;
}

export const participantPopulated =
  Prisma.validator<Prisma.ConversationParticipantInclude>()({
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  });

export const conversationPopulated =
  Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
      include: participantPopulated,
    },
    latestMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    },
  });
export default resolvers;
