import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Message } from '../redux/types/messageActionTypes';

const MessageDisplay = () => {
  const messages: Message[] = useSelector((state: RootState) => state.messages);
  console.log("messages");
  console.log(messages);
  if (messages.length === 0) {
    return null; // Return null to render nothing if there are no messages
  }

  const message = messages[messages.length - 1];
  console.log( message);
  return (
    <View
      style={[
        styles.container,
        message.status === 500 ? styles.errorContainer : null,
      ]}>
     <Text style={styles.messageText}>{message.text}</Text>

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
