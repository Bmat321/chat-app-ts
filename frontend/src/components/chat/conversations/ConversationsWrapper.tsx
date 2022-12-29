import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { GraphQLError } from "graphql";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import {
  ConversationPopulated,
  ParticipantPopulated,
} from "../../../../../backend/src/utils/types";
import ConversationOperations from "../../../graphql/operations/conversation";
import {
  ConversationData,
  ConversationDeletedData,
  ConversationUpdatedData,
} from "../../../utils/type";
import SkeletonLoader from "../../common/SkeletonLoader";
import ConversationsList from "./ConversationsList";

interface ConversationsWrapperProps {
  session: Session;
}

const ConversationsWrapper: React.FC<ConversationsWrapperProps> = ({
  session,
}) => {
  const router = useRouter();

  const {
    query: { conversationId },
  } = router;

  const {
    user: { id: userId },
  } = session;

  const {
    data: conversationData,
    error: conversationEror,
    loading: conversationLoading,
    subscribeToMore,
  } = useQuery<ConversationData, null>(
    ConversationOperations.Oueries.conversations
  );

  const [markConversationAsRead, { data, loading, error }] = useMutation<
    { markConversationAsRead: boolean },
    { userId: string; conversationId: string }
  >(ConversationOperations.Mutations.markConversationAsRead);

  useSubscription<ConversationUpdatedData, null>(
    ConversationOperations.Subscriptions.conversationUpdated,
    {
      onData: ({ client, data }) => {
        const { data: subscriptionData } = data;

        if (!subscriptionData) return;

        const {
          conversationUpdated: { conversation: updateConversation },
        } = subscriptionData;

        const currentlyViewingConversation =
          updateConversation.id === conversationId;

        if (currentlyViewingConversation) {
          onViewConversation(conversationId, false);
          return;
        }
      },
    }
  );

  useSubscription<ConversationDeletedData, null>(
    ConversationOperations.Subscriptions.conversationDeleted,
    {
      onData: ({ client, data }) => {
        console.log("deleted sub data", data);
        const { data: subscriptionData } = data;

        if (!subscriptionData) return;

        const existing = client.readQuery<ConversationData>({
          query: ConversationOperations.Oueries.conversations,
        });

        if (!existing) return;

        const { conversations } = existing;

        const {
          conversationDeleted: { id: deletedConversationId },
        } = subscriptionData;

        client.writeQuery<ConversationData>({
          query: ConversationOperations.Oueries.conversations,
          data: {
            conversations: conversations.filter(
              (conversation) => conversation.id !== deletedConversationId
            ),
          },
        });

        router.push("/");
      },
    }
  );

  const onViewConversation = async (
    conversationId: string,
    hasSeenLatestMessage: boolean | undefined
  ) => {
    // Push the converation to the router query

    router.push({ query: { conversationId } });

    // Mark the conversation as read
    if (hasSeenLatestMessage) return;

    // markConversation mutation
    try {
      await markConversationAsRead({
        variables: {
          userId,
          conversationId,
        },
        optimisticResponse: {
          markConversationAsRead: true,
        },
        update: (cache) => {
          // Get conversation participants from cache
          const participantFragment = cache.readFragment<{
            participants: Array<ParticipantPopulated>;
          }>({
            id: `Conversation:${conversationId}`,
            fragment: gql`
              fragment Participants on Conversation {
                participants {
                  user {
                    id
                    username
                  }
                  hasSeenLatestMessage
                }
              }
            `,
          });
          if (!participantFragment) return;

          const participants = [...participantFragment.participants];

          const userParticipantIdx = participants.findIndex(
            (p) => p.user.id === userId
          );
          if (userParticipantIdx === -1) return;

          const userParticipant = participants[userParticipantIdx];

          // Update participant to show latest message as read

          participants[userParticipantIdx] = {
            ...userParticipant,
            hasSeenLatestMessage: true,
          };

          // update the cache

          cache.writeFragment({
            id: `Conversation:${conversationId}`,
            fragment: gql`
              fragment UpdatedParticipants on Conversation {
                participants
              }
            `,
            data: {
              participants,
            },
          });
        },
      });
    } catch (error: any) {
      console.log("markConversation error", error);
      throw new GraphQLError(error.message);
    }
  };

  const subscribeToNewConversations = () => {
    subscribeToMore({
      document: ConversationOperations.Subscriptions.conversationCreated,
      updateQuery: (
        prev,
        {
          subscriptionData,
        }: {
          subscriptionData: {
            data: { conversationCreated: ConversationPopulated };
          };
        }
      ) => {
        if (!subscriptionData.data) return prev;

        const newConversation = subscriptionData.data.conversationCreated;

        return Object.assign({}, prev, {
          conversations: [newConversation, ...prev.conversations],
        });
      },
    });
  };

  //  execute subscription on mount
  useEffect(() => {
    subscribeToNewConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      display={{ base: conversationId ? "none" : "flex", md: "flex" }}
      width={{ base: "100%", md: "430px" }}
      bg="whiteAlpha.50"
      flexDirection="column"
      gap={4}
      py={6}
      px={3}
    >
      {conversationLoading ? (
        <SkeletonLoader count={7} height="80px" />
      ) : (
        <ConversationsList
          session={session}
          conversations={conversationData?.conversations || []}
          onViewConversation={onViewConversation}
        />
      )}
    </Box>
  );
};
export default ConversationsWrapper;
