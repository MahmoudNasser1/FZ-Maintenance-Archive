// u0625u0639u062fu0627u062f u0645u062au062cu0631 Redux u0644u0644u062au0637u0628u064au0642
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from './notificationSlice';

// u0625u0646u0634u0627u0621 u0627u0644u0645u062au062cu0631 u0645u0639 u062cu0645u064au0639 reducers
export const store = configureStore({
  reducer: {
    notifications: notificationReducer,
    // u064au0645u0643u0646 u0625u0636u0627u0641u0629 u0627u0644u0645u0632u064au062f u0645u0646 reducers u0647u0646u0627
  },
});

// Typescript type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
