import { Avatar, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { SearchedUser } from "../../../../utils/type";

interface UserSearchListsProps {
  users: Array<SearchedUser>;
  addParticipants: (user: SearchedUser) => void;
}

const UserSearchLists: React.FC<UserSearchListsProps> = ({
  users,
  addParticipants,
}) => {
  return (
    <>
      {users.length === 0 ? (
        <Flex mt={6} justify="center" color="gray.300">
          <Text>No users found</Text>
        </Flex>
      ) : (
        <Stack mt={6}>
          {users.map((user) => (
            <Stack
              key={user.id}
              direction="row"
              align="center"
              spacing={4}
              py={2}
              px={4}
              borderRadius={4}
              
              _hover={{ bg: "whiteAlpha.200" }}
            >
              <Avatar />
              <Flex justify="space-between" align="center" width="100%">
                <Text>{user.username}</Text>
                <Button
                  bg="brand.100"
                  _hover={{ bg: "brand.100" }}
                  onClick={() => addParticipants(user)}
                >
                  Select
                </Button>
              </Flex>
            </Stack>
          ))}
        </Stack>
      )}
    </>
  );
};
export default UserSearchLists;
