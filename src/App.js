import React, { useState, useEffect, useRef } from "react";
import socketIOClient from "socket.io-client";
import { Container, Row, Col, Form, Button, ListGroup } from "react-bootstrap";
import { toast } from "react-hot-toast";
import "./App.css";

const ENDPOINT = "http://localhost:5000";

function App() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [room, setRoom] = useState("general");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState("");
  const [username, setUsername] = useState("");
  const [recipient, setRecipient] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const lastMessageRef = useRef(null);
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    setSocket(socket);

    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("typing", (username) => {
      setIsTyping(username ? `${username} is typing...` : "");
    });

    socket.on("notTyping", () => {
      setIsTyping("");
    });

    socket.on("privateMessage", (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    socket.on("notification", (notification) => {
      toast.success(notification);
    });

    socket.on("history-message", (data) => {
      setMessages(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleMessageChange = (e) => {
    setMessageInput(e.target.value);
    if (socket) {
      if (e.target.value) {
        socket.emit("typing");
      } else {
        socket.emit("notTyping");
      }
    }
  };

  const joinRoom = () => {
    if (socket && username) {
      socket.emit("joinRoom", { room, username, socketID: socket.id });
      setUsername("");
      setJoinedRoom(true);
    }
  };

  const sendMessage = () => {
    if (socket && messageInput) {
      const messageData = { room, message: messageInput, recipient };
      socket.emit("sendMessage", messageData);
      setMessageInput("");
      socket.emit("notTyping");
    }
  };
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const leaveRoom = () => {
    setJoinedRoom(false);
    setRoom("general");

    setMessageInput("");
  };

  return (
    <Container className="my-5">
      <h2 className="text-center fw-bold"> Chat App</h2>
      <Row>
        <Col xs={3}>
          <Form.Group>
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(capitalize(e.target.value))}
              placeholder="Enter username"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Room</Form.Label>
            <Form.Control
              as="select"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            >
              <option value="general">General</option>
              <option value="random">Random</option>
            </Form.Control>
          </Form.Group>

          <Button variant="primary" onClick={joinRoom} className="mt-2">
            Join Room
          </Button>
        </Col>
        <Col>
          {joinedRoom && (
            <>
              <ListGroup className="chat-box mt-3">
                {messages.map((message, index) => (
                  <ListGroup.Item
                    key={index}
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                  >
                    <strong>{message.sender}</strong>: {message.text}
                    <p> {new Date(message.time).toString()}</p>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Form.Group className="mt-3">
                <Form.Control
                  type="text"
                  value={messageInput}
                  onChange={handleMessageChange}
                  placeholder="Type your message..."
                />
                <Form.Text className="text-success">{isTyping}</Form.Text>
              </Form.Group>

              <Form.Group className="mt-4 optional-user-section">
                <Form.Control
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter recipient username (optional)"
                />
              </Form.Group>
              <Button variant="primary" onClick={sendMessage} className="mt-2">
                Send
              </Button>
              <Button
                variant="danger"
                onClick={leaveRoom}
                className="mt-2 mx-2"
              >
                Leave Room
              </Button>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default App;
