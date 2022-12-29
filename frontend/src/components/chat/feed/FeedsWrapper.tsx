import { Flex } from "@chakra-ui/react";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import MessageHeader from "./messages/Header";
import MessageInput from "./messages/MessageInput";
import Messages from "./messages/Messages";
import NoConversation from "./NoConversation";

interface FeedsWrapperProps {
  session: Session;
}

const FeedsWrapper: React.FC<FeedsWrapperProps> = ({ session }) => {
  const router = useRouter();

  const { conversationId } = router.query;

 

  return (
    <Flex
      display={{ base: conversationId ? "flex" : "none", md: "flex" }}
      width="100%"
      direction="column"
    >
      {conversationId && typeof conversationId === "string" ? (
          <>
          <Flex
            direction="column"
            justify="space-between"
            overflow="hidden"
            flexGrow={1}
          >
            <MessageHeader
              userId={session.user.id}
              conversationId={conversationId}
            />
            <Messages
              userId={session.user.id}
              conversationId={conversationId}
            />
          </Flex>
          <MessageInput session={session} conversationId={conversationId} />
        </>
      ) : (
        <NoConversation />
      )}
    </Flex>
  );
};
export default FeedsWrapper;
