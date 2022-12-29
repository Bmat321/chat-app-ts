import { useMutation } from "@apollo/client";
import { Button, Center, Image, Input, Stack, Text, Toast } from "@chakra-ui/react";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import UserOperation from "../../graphql/operations/user";
import { CreateUsernameData, CreateUsernameVariables } from "../../utils/type";

type AuthProps = {
  session: Session | null;
  reLoadSession: () => void;
};

const Auth: React.FC<AuthProps> = ({ session, reLoadSession }) => {
  const [username, setUsername] = useState("");
  const [createUsername, { loading, error }] = useMutation<
    CreateUsernameData,
    CreateUsernameVariables
  >(UserOperation.Mutations.createUsername);

  const onSubmit = async () => {
    if (!username) return;
    try {
      const { data } = await createUsername({ variables: { username } });

      if (!data?.createUsername) {
        throw new Error();
      }

      if (data.createUsername.error) {
        const {
          createUsername: { error },
        } = data;

        throw new Error(error);
      }

      toast.success('Username successfully created! 🚀' )

      // Reload session if its true 
      reLoadSession();
    } catch (error: any) {
      toast.error(error?.message)
      console.log("onSubmit", error);
    }
  };

  return (
    <Center height="100vh">
      <Stack spacing={6} align="center">
        {session ? (
          <>
            <Text fontWeight="3xl">Create a Username</Text>
            <Input
              placeholder="Enter a Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button width="100%" onClick={onSubmit} isLoading={loading}>
              Save
            </Button>
          </>
        ) : (
          <>
            <Text fontSize="3xl">MessengerQL</Text>
            <Button
              onClick={() => signIn("google")}
              leftIcon={
                <Image src="/images/googlelogo.png" height="20px" alt="" />
              }
            >
              Continue with Google
            </Button>
          </>
        )}
      </Stack>
    </Center>
  );
};
export default Auth;
