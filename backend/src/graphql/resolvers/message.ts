import { Prisma, prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import {
  GraphqlContext,
  MessagePopulated,
  MessageSentSubscriptionPayload,
  sendMessageArgurments,
} from "../../utils/types";
import { conversationPopulated } from "./conversation";
import { userIsConversationParticipant } from "../../utils/functions";

const resolvers = {
  Query: {
    messages: async function (
      _: any,
      args: { conversationId: string },
      context: GraphqlContext
    ): Promise<Array<MessagePopulated>> {
      const { session, prisma, pubsub } = context;
      const { conversationId } = args;
      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const {
        user: { id: userId },
      } = session;

      // verify the participant is part of the conversation
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: conversationPopulated,
      });

      if (!conversation) {
        throw new GraphQLError("Coversation Not Found");
      }

      const allowedToView = userIsConversationParticipant(
        conversation.participants,
        userId
      );

      if (!allowedToView) {
        throw new GraphQLError("Not authorized");
      }

      try {
        const messages = await prisma.message.findMany({
          where: {
            conversationId,
          },
          include: messagePopulated,
          orderBy: {
            createdAt: "desc",
          },
        });

        return messages;
      } catch (error: any) {
        console.log("MessaeQuery", error);
        throw new GraphQLError(error.message);
      }
    },
  },
  // Mutation: {
  //   sendMessage: async function (
  //     _: any,
  //     args: sendMessageArgurments,
  //     context: GraphqlContext
  //   ): Promise<boolean> {
  //     const { session, prisma, pubsub } = context;
  //     const { id: messageId, conversationId, senderId, body } = args;

  //     if (!session?.user) {
  //       throw new GraphQLError("Not authorized");
  //     }

  //     const {
  //       user: { id: userId },
  //     } = session;

  //     if (userId !== senderId) {
  //       throw new GraphQLError("Not authorized");
  //     }

  //     // create send Message

  //     try {
  //       const newMessage = await prisma.message.create({
  //         data: {
  //           id: messageId,
  //           conversationId,
  //           senderId,
  //           body,
  //         },
  //         include: messagePopulated,
  //       });

  //       // Find the conversationParticipant entity
  //       const participant = await prisma.conversationParticipant.findFirst({
  //         where: {
  //           userId,
  //           conversationId,
  //         },
  //       });

  //       // Participant should always exist

  //       if (!participant) {
  //         throw new GraphQLError("Participant does not exist");
  //       }

  //       const { id: participantId } = participant;

  //       // Update the conversation
  //       const conversation = await prisma.conversation.update({
  //         where: {
  //           id: conversationId,
  //         },
  //         data: {
  //           latestMessageId: newMessage.id,
  //           participants: {
  //             update: {
  //               where: {
  //                 id: participantId,
  //               },
  //               data: {
  //                 hasSeenLatestMessage: true,
  //               },
  //             },
  //             updateMany: {
  //               where: {
  //                 NOT: {
  //                   userId: senderId,
  //                 },
  //               },
  //               data: {
  //                 hasSeenLatestMessage: false,
  //               },
  //             },
  //           },
  //         },
  //         include: conversationPopulated,
  //       });

  //       // for the subscription

  //       pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
  //       // pubsub.publish("CONVERSATION_UPDATED", {
  //       //   conversationUpdated: {
  //       //     conversation,
  //       //   },
  //       // });
  //     } catch (error) {
  //       console.log("sendMessage", error);
  //       throw new GraphQLError("Error sending message");
  //     }

  //     return true;
  //   },
  // },

  Mutation: {
    sendMessage: async function (
      _: any,
      args: sendMessageArgurments,
      context: GraphqlContext
    ): Promise<boolean> {
      const { session, prisma, pubsub } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const { id: userId } = session.user;
      const { id: messageId, senderId, conversationId, body } = args;

      try {
        /**
         * Create new message entity
         */
        const newMessage = await prisma.message.create({
          data: {
            id: messageId,
            senderId,
            conversationId,
            body,
          },
          include: messagePopulated,
        });

        /**
         * Could cache this in production
         */
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId,
          },
        });

        /**
         * Should always exist
         */
        if (!participant) {
          throw new GraphQLError("Participant does not exist");
        }

        const { id: participantId } = participant;

        /**
         * Update conversation latestMessage
         */
        const conversation = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            latestMessageId: newMessage.id,
            participants: {
              update: {
                where: {
                  id: participantId,
                },
                data: {
                  hasSeenLatestMessage: true,
                },
              },
              updateMany: {
                where: {
                  NOT: {
                    userId,
                  },
                },
                data: {
                  hasSeenLatestMessage: false,
                },
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
        pubsub.publish("CONVERSATION_UPDATED", {
          conversationUpdated: {
            conversation,
          },
        });

        return true;
      } catch (error) {
        console.log("sendMessage error", error);
        throw new GraphQLError("Error sending message");
      }
    },
  },

  Subscription: {
    messageSent: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphqlContext) => {
          const { pubsub } = context;

          return pubsub.asyncIterator(["MESSAGE_SENT"]);
        },
        (
          payload: MessageSentSubscriptionPayload,
          args: { conversationId: string },
          context: GraphqlContext
        ) => {
          return payload.messageSent.conversationId === args.conversationId;
        }
      ),
    },
  },
};

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: {
      id: true,
      username: true,
    },
  },
});

export default resolvers;
