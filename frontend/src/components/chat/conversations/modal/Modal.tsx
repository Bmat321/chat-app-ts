import {
  useLazyQuery,
  useMutation
} from "@apollo/client";
import {
  Button, Input, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalHeader, ModalOverlay, Stack
} from "@chakra-ui/react";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import ConversationsOperation from "../../../../graphql/operations/conversation";
import UsersOperation from "../../../../graphql/operations/user";
import {
  CreateConversationData,
  CreateConversationInput,
  SearchedUser,
  SearchUsersData,
  SearchUsersInput
} from "../../../../utils/type";
import Participants from "./Participants";
import UserSearchLists from "./UserSearchLists";

interface ModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

const ConversationModal: React.FC<ModalProps> = ({
  session,
  isOpen,
  onClose,
}) => {
  const {
    user: { id: userId },
  } = session;
  const [username, SetUsername] = useState("");
  const router = useRouter();
  const [participants, setParticipants] = useState<Array<SearchedUser>>([]);
  const [searchUsers, { data, loading, error }] = useLazyQuery<
    SearchUsersData,
    SearchUsersInput
  >(UsersOperation.Queries.searchUsers);
  const [createConversation, { loading: createConversationLoading }] =
    useMutation<CreateConversationData, CreateConversationInput>(
      ConversationsOperation.Mutations.createConversation
    );
  console.log("HERE IS MY SEARCH DATA", data);

  const addParticipants = (user: SearchedUser) => {
    setParticipants((prev) => [...prev, user]);
  };
  const removeParticipants = (userId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    searchUsers({ variables: { username } });
  };

  const onCreateConversation = async () => {
    const participantIds = [userId, ...participants.map((p) => p.id)];
    try {
      const { data } = await createConversation({
        variables: {
          participantIds,
        },
      });

      if (!data?.createConversation) {
        throw new Error("Error creating conversation");
      }

      const {
        createConversation: { conversationId },
      } = data;

      router.push({ query: { conversationId } });

      // clear the modal
      setParticipants([]);
      SetUsername("");
      onClose();

      console.log("CONVERS DATA IS HERE", data);
    } catch (error: any) {
      console.log("CreateConversation error", error);
      toast.error(error?.message);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="#665f5f" pb={4}>
          <ModalHeader color="whiteAlpha.400">
            Create a Conversation
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={submitSearch}>
              <Stack spacing={4}>
                <Input
                  value={username}
                  type="text"
                  placeholder="Enter a Username"
                  onChange={(event) => SetUsername(event.target.value)}
                  _placeholder={{ color: "whiteAlpha.300" }}
                />
                <Button
                  type="submit"
                  disabled={!username}
                  isLoading={loading}
                  bg="brand.100"
                  color="white"
                  _hover={{ bg: "brand.100" }}
                >
                  Search
                </Button>
              </Stack>
            </form>
            {data?.searchUsers && (
              <UserSearchLists
                users={data.searchUsers}
                addParticipants={addParticipants}
              />
            )}
            <>
              {participants.length !== 0 && (
                <Participants
                  participants={participants}
                  removeParticipant={removeParticipants}
                />
              )}
              <Button
                width="100%"
                mt={6}
                bg="brand.100"
                _hover={{ bg: "brand.100" }}
                color="white"
                isLoading={createConversationLoading}
                onClick={onCreateConversation}
              >
                Create Conversation
              </Button>
            </>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
export default ConversationModal;
