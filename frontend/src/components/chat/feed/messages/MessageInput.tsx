import { useMutation } from "@apollo/client";
import { Box, Input } from "@chakra-ui/react";
import { ObjectID } from "bson";
import { Session } from "next-auth";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { sendMessageArgurments } from "../../../../../../backend/src/utils/types";
import MessageOpertion from "../../../../graphql/operations/message";
import { MessageData } from "../../../../utils/type";

interface MessageInputProps {
  session: Session;
  conversationId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  session,
  conversationId,
}) => {
  const [messageBody, setMessageBody] = useState("");
  const [sendMessage] = useMutation<
    { sendMessage: boolean },
    sendMessageArgurments
  >(MessageOpertion.Mutation.sendMessage);

  const onSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { id: senderId } = session.user;
      const messageId = new ObjectID().toString();
      const newMessage: sendMessageArgurments = {
        id: messageId,
        senderId,
        conversationId,
        body: messageBody,
      };

      setMessageBody("");

      const { data, errors } = await sendMessage({
        variables: {
          ...newMessage,
        },
        optimisticResponse: {
          sendMessage: true,
        },
        update: (cache) => {
          const existing = cache.readQuery<MessageData>({
            query: MessageOpertion.Query.messages,
            variables: { conversationId },
          }) as MessageData;

          cache.writeQuery<MessageData, { conversationId: string }>({
            query: MessageOpertion.Query.messages,
            variables: { conversationId },
            data: {
              ...existing,
              messages: [
                {
                  id: messageId,
                  body: messageBody,
                  senderId: session.user.id,
                  conversationId,
                  sender: {
                    id: session.user.id,
                    username: session.user.username,
                  },
                  createdAt: new Date(Date.now()),
                  updatedAt: new Date(Date.now()),
                },
                ...existing.messages,
              ],
            },
          });
        },
      });

      if (!data?.sendMessage || errors) {
        throw new Error("Failed to send message");
      }
    } catch (error: any) {
      // console.log("Send Message error", error);
      toast.error(error.message);
    }
  };

  return (
    <Box px={4} py={6} width="100%">
      <form onSubmit={onSendMessage}>
        <Input
          value={messageBody}
          onChange={(event) => setMessageBody(event.target.value)}
          placeholder="Type your message"
          size="md"
          resize="none"
          _focus={{
            boxShadow: "none",
            border: "1px solid",
            borderColor: "whiteAlpha.300",
          }}
        />
      </form>
    </Box>
  );
};
export default MessageInput;
