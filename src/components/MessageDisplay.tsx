import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Message } from '../redux/types/messageActionTypes';
import { RootState } from '../redux/types/RootState';

const MessageDisplay = () => {

  const messages: Message[] = useSelector((state: RootState) => state.messages);

   console.log("messages", messages);

  console.log("this is the message: "+messages[0]);
    if (!messages || messages.length === 0) return null;
  const message = messages[messages.length - 1];
console.log("Last message:", message);
  return (
    <View
      style={[
        styles.container,
        message.status === 500 ? styles.errorContainer : null,
      ]}>
     <Text style={styles.messageText}>{message}</Text>

    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 20,
  },
  messageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffcccc',
    borderColor: '#ff9999',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 20,
  },
});

export default MessageDisplay;
