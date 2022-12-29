import { Flex, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { SearchedUser } from "../../../../utils/type";
import { IoIosCloseCircleOutline } from "react-icons/io";

interface ParticipantsProps {
  participants: Array<SearchedUser>;
  removeParticipant: (userId: string) => void;
}

const Participants: React.FC<ParticipantsProps> = ({
  participants,
  removeParticipant,
}) => {
 
  return (
    <Flex mt={8} gap="10pt" flexWrap='wrap'>
      {participants.map((participant) => (
        <Stack
          direction="row"
          key={participant.id}
          p={2}
          align="center"
          bg="whiteAlpha.200"
          borderRadius={4}
        >
          <Text color="white">{participant.username}</Text>
          <IoIosCloseCircleOutline
            size={20}
            color='white'
            cursor="pointer"
            onClick={() => removeParticipant(participant.id)}
          />
        </Stack>
      ))}
    </Flex>
  );
};
export default Participants;
