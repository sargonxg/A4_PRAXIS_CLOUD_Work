import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  situationId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

function chatsRef(uid: string, situationId: string) {
  return collection(db, 'users', uid, 'situations', situationId, 'chats');
}

function chatDoc(uid: string, situationId: string, chatId: string) {
  return doc(db, 'users', uid, 'situations', situationId, 'chats', chatId);
}

export async function createChat(uid: string, situationId: string, title: string): Promise<Chat> {
  const ref = doc(chatsRef(uid, situationId));
  const now = new Date().toISOString();
  const chat: Chat = { id: ref.id, situationId, title, messages: [], createdAt: now, updatedAt: now };
  await setDoc(ref, chat);
  return chat;
}

export async function getChat(uid: string, situationId: string, chatId: string): Promise<Chat | null> {
  const snap = await getDoc(chatDoc(uid, situationId, chatId));
  return snap.exists() ? (snap.data() as Chat) : null;
}

export async function listChats(uid: string, situationId: string): Promise<Chat[]> {
  const q = query(chatsRef(uid, situationId), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Chat);
}

export async function appendMessage(uid: string, situationId: string, chatId: string, message: ChatMessage): Promise<void> {
  const chat = await getChat(uid, situationId, chatId);
  if (!chat) return;
  chat.messages.push(message);
  await updateDoc(chatDoc(uid, situationId, chatId), {
    messages: chat.messages,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteChat(uid: string, situationId: string, chatId: string): Promise<void> {
  await deleteDoc(chatDoc(uid, situationId, chatId));
}
