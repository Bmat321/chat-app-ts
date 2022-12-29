import {ConversationPopulated, MessagePopulated} from '../../../backend/src/utils/types'

// users
export interface CreateUsernameData {
  createUsername: {
    success: boolean;
    error: string;
  };
}

export interface CreateUsernameVariables {
  username: string;
}

export interface SearchUsersInput {
  username: string;
}

export interface SearchUsersData {
  searchUsers: Array<SearchedUser>;
}

export interface SearchedUser {
  id: string;
  username: string;
}

// conversations

export interface ConversationData {
  conversations: Array<ConversationPopulated>
}


// create conversation

export interface CreateConversationData {
  createConversation: {
    conversationId: string
  }
}

export interface ConversationDeletedData {
  conversationDeleted: {
    id: string
  }
}

export interface ConversationUpdatedData {
  conversationUpdated : {
    // conversation: Omit<ConversationPopulated, 'latestMessage'> & {
    //   latestMessage: MessagePopulated
    // }
    conversation: ConversationPopulated
  }
}

export interface CreateConversationInput {
  participantIds: Array<string>
}

// messages

export interface MessageData {
  messages: Array<MessagePopulated>
}

export interface MessageVariables {
  conversationId: string
}


// message subscriptionData

export interface MessageSubscriptionData {
  subscriptionData : {
    data: {
      messageSent: MessagePopulated
    }
  }
}