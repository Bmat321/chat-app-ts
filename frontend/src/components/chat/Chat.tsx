import { Button, Flex } from '@chakra-ui/react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import React from 'react';
import ConversationsWrapper from './conversations/ConversationsWrapper';
import FeedsWrapper from './feed/FeedsWrapper';

type ChatProps = {
    session: Session
};

const Chat:React.FC<ChatProps> = ({session}) => {
    
    return <Flex height='100vh'>
        <ConversationsWrapper session={session} />
        <FeedsWrapper session={session} />
    </Flex>
}
export default Chat;